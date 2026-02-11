import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { StyleSelector } from './components/StyleSelector';
import { ImageCard } from './components/ImageCard';
import { RefineModal } from './components/RefineModal';
import { ImageModal } from './components/ImageModal';
import { GeminiService } from './services/geminiService';
import { DesignStyle, ImageItem } from './types';
import { Wand2, Trash2, RefreshCw, Plus, LayoutGrid, Download, CheckSquare } from 'lucide-react';
import { clsx } from 'clsx';

const MAX_IMAGES = 10;

const App: React.FC = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(DesignStyle.MODERN);
  const [suggestedStyle, setSuggestedStyle] = useState<DesignStyle | null>(null);
  
  // AI Analysis State
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  // Refine Modal State
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [activeRefineItemId, setActiveRefineItemId] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  // Expanded Image State
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Batch Download State
  const [isZipping, setIsZipping] = useState(false);

  // Helper to analyze style
  const analyzeStyle = useCallback(async (image: string) => {
    setIsAnalyzingStyle(true);
    try {
      const style = await GeminiService.suggestDesignStyle(image);
      setSuggestedStyle(style);
      setSelectedStyle(style);
    } catch (err) {
      console.error("Failed to analyze style", err);
    } finally {
      setIsAnalyzingStyle(false);
    }
  }, []);

  // Handle file uploads
  const handleImagesSelect = useCallback((files: File[]) => {
    if (items.length + files.length > MAX_IMAGES) {
      alert(`You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    const newItems: ImageItem[] = [];
    let processedCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        newItems.push({
          id: uuidv4(),
          original: base64,
          generated: null,
          status: 'idle',
          customPrompt: '',
          weatherPrompt: '',
          declutterMode: 'none',
          declutterPrompt: '',
          isAIAnalysisEnabled: false,
          selected: false
        });
        processedCount++;
        
        if (processedCount === files.length) {
          setItems(prev => [...prev, ...newItems]);
          
          // If AI is enabled and we don't have a suggestion yet, analyze the first new image
          if (isAIEnabled && !suggestedStyle && newItems.length > 0) {
             analyzeStyle(newItems[0].original);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, [items.length, suggestedStyle, isAIEnabled, analyzeStyle]);

  // Handle AI Toggle
  const handleToggleAI = (enabled: boolean) => {
    setIsAIEnabled(enabled);
    // If turning ON and we have images but no suggestion, analyze the first one
    if (enabled && !suggestedStyle && items.length > 0) {
      analyzeStyle(items[0].original);
    }
  };

  // Delete an image
  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Start completely new session
  const handleStartNew = () => {
    setItems([]);
    setSuggestedStyle(null);
    setSelectedStyle(DesignStyle.MODERN);
  };

  // Handle individual item style change
  const handleItemStyleChange = (id: string, style: DesignStyle) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newStatus = (item.status === 'completed' || item.status === 'error') ? 'idle' : item.status;
        return { ...item, style, status: newStatus };
      }
      return item;
    }));
  };

  // Handle individual item prompt change
  const handleItemPromptChange = (id: string, prompt: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, customPrompt: prompt };
      }
      return item;
    }));
  };

  // Handle individual item weather prompt change
  const handleItemWeatherChange = (id: string, weather: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, weatherPrompt: weather };
      }
      return item;
    }));
  };

  // Handle individual item declutter change
  const handleItemDeclutterChange = (id: string, mode: any, prompt?: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          declutterMode: mode,
          declutterPrompt: prompt !== undefined ? prompt : item.declutterPrompt 
        };
      }
      return item;
    }));
  };

  // Handle individual item AI toggle
  const handleItemAIToggle = (id: string, enabled: boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isAIAnalysisEnabled: enabled };
      }
      return item;
    }));
  };

  // Handle selection toggle
  const handleToggleSelect = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    }));
  };

  // Select/Deselect All Completed
  const handleToggleSelectAll = () => {
    const completedItems = items.filter(i => i.status === 'completed');
    const allSelected = completedItems.every(i => i.selected);
    
    setItems(prev => prev.map(item => {
      if (item.status === 'completed') {
        return { ...item, selected: !allSelected };
      }
      return item;
    }));
  };

  // Batch Download
  const handleBatchDownload = async () => {
    const selectedItems = items.filter(i => i.selected && i.status === 'completed' && i.generated);
    if (selectedItems.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();

    try {
      const promises = selectedItems.map(async (item, index) => {
        // Convert base64 to blob
        const response = await fetch(item.generated!);
        const blob = await response.blob();
        const filename = `staged-room-${index + 1}-${item.style || selectedStyle}.png`;
        zip.file(filename, blob);
      });

      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `virtual-stager-batch-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to zip files", error);
      alert("Failed to create zip file. Please try downloading individually.");
    } finally {
      setIsZipping(false);
    }
  };

  // Stage a single image
  const handleStageSingle = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.status === 'processing') return;

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'processing', error: undefined } : i));

    try {
      let styleToUse = item.style || selectedStyle;

      // If per-item AI is enabled, analyze first
      if (item.isAIAnalysisEnabled) {
        const detected = await GeminiService.suggestDesignStyle(item.original);
        styleToUse = detected;
        // Update the item's style in state so the user sees what was picked
        setItems(prev => prev.map(i => i.id === id ? { ...i, style: detected } : i));
      }

      const result = await GeminiService.stageImage(item.original, styleToUse, {
        customPrompt: item.customPrompt,
        weatherPrompt: item.weatherPrompt,
        declutterMode: item.declutterMode,
        declutterPrompt: item.declutterPrompt
      });
      
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', generated: result } : i));
    } catch (error: any) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: error.message || "Failed to stage" } : i));
    }
  };

  // Generate 2D/3D Plan
  const handleGeneratePlan = async (id: string, type: '2D' | '3D') => {
    const item = items.find(i => i.id === id);
    if (!item || item.status === 'processing') return;

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'processing', error: undefined } : i));

    try {
      const result = await GeminiService.generatePlan(item.original, type);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'completed', generated: result } : i));
    } catch (error: any) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: error.message || "Failed to generate plan" } : i));
    }
  };

  // Quick refine from card input (preserves furniture)
  const handleQuickRefine = async (id: string, instruction: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !item.generated) return;

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'processing' } : i));

    try {
      const result = await GeminiService.editImage(item.generated, instruction);
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'completed', generated: result } : i
      ));
    } catch (error: any) {
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'error', error: error.message || "Failed to refine" } : i
      ));
    }
  };

  // Stage all idle images SEQUENTIALLY to prevent network errors
  const handleStageAll = async () => {
    const itemsToProcess = items.filter(item => item.status === 'idle' || item.status === 'error');
    if (itemsToProcess.length === 0) return;

    // Update status to processing for all pending items immediately so UI reflects it
    setItems(prev => prev.map(item => 
      (item.status === 'idle' || item.status === 'error') ? { ...item, status: 'processing', error: undefined } : item
    ));

    // Process one by one to avoid "Failed to fetch" (payload too large / rate limits)
    for (const item of itemsToProcess) {
      try {
        // Re-fetch current state of item in case it changed (though in this simple loop it's fine)
        // We use the values from the initial 'itemsToProcess' snapshot
        
        let styleToUse = item.style || selectedStyle;

        if (item.isAIAnalysisEnabled) {
          const detected = await GeminiService.suggestDesignStyle(item.original);
          styleToUse = detected;
          // Update state to reflect detected style
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, style: detected } : i));
        }

        const result = await GeminiService.stageImage(item.original, styleToUse, {
          customPrompt: item.customPrompt,
          weatherPrompt: item.weatherPrompt,
          declutterMode: item.declutterMode,
          declutterPrompt: item.declutterPrompt
        });

        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'completed', generated: result } : i
        ));
      } catch (error: any) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'error', error: error.message || "Failed to stage" } : i
        ));
      }
      
      // Add a 2-second delay between requests to be nice to the API and prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  // Open refine modal
  const handleOpenRefine = (id: string) => {
    setActiveRefineItemId(id);
    setIsRefineModalOpen(true);
  };

  // Submit refinement
  const handleRefineSubmit = async (instruction: string) => {
    if (!activeRefineItemId) return;
    
    setIsRefining(true);
    const targetItem = items.find(i => i.id === activeRefineItemId);
    
    if (!targetItem) {
      setIsRefining(false);
      return;
    }

    const baseImage = targetItem.generated || targetItem.original;

    try {
      setItems(prev => prev.map(i => i.id === activeRefineItemId ? { ...i, status: 'processing' } : i));
      
      const result = await GeminiService.editImage(baseImage, instruction);
      
      setItems(prev => prev.map(i => 
        i.id === activeRefineItemId ? { ...i, status: 'completed', generated: result } : i
      ));
      setIsRefineModalOpen(false);
    } catch (error: any) {
      setItems(prev => prev.map(i => 
        i.id === activeRefineItemId ? { ...i, status: 'error', error: error.message || "Failed to refine" } : i
      ));
    } finally {
      setIsRefining(false);
    }
  };

  const hasImages = items.length > 0;
  const hasIdleImages = items.some(i => i.status === 'idle' || i.status === 'error');
  const isProcessingAny = items.some(i => i.status === 'processing');
  const completedCount = items.filter(i => i.status === 'completed').length;
  const selectedCount = items.filter(i => i.selected).length;

  const expandedItem = items.find(i => i.id === expandedItemId);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.04] pointer-events-none fixed" />
      
      <Header />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {!hasImages ? (
          <div className="max-w-5xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section with Professional Imagery Background */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl mb-12">
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop" 
                  alt="Modern Luxury Interior" 
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
              </div>
              
              <div className="relative z-10 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-xl">
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                    Reimagine Real Estate <br/>
                    <span className="text-blue-400">With Intelligent Staging</span>
                  </h2>
                  <p className="text-lg text-slate-300 leading-relaxed mb-8">
                    Transform vacant properties into captivating, fully furnished homes. 
                    Our enterprise-grade AI analyzes architecture to deliver photorealistic results instantly.
                  </p>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Photorealistic 4K</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Style Analysis</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Instant Turnaround</span>
                  </div>
                </div>
                
                <div className="w-full md:w-auto bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                   <ImageUpload onImagesSelect={handleImagesSelect} compact className="bg-white/95 hover:bg-white border-transparent" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Top Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-xl shadow-sm border border-slate-200 sticky top-20 z-30">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project Gallery</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {items.length} / {MAX_IMAGES} assets
                    </p>
                  </div>
                </div>
                
                {items.length < MAX_IMAGES && (
                  <>
                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                    <button 
                      onClick={() => document.getElementById('image-upload-compact')?.click()}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Images
                    </button>
                    {/* Hidden input trigger via the button above, reusing the component logic would be cleaner but for now we use the grid card */}
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {completedCount > 0 && (
                  <>
                    <button
                      onClick={handleToggleSelectAll}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      {selectedCount === completedCount && completedCount > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {selectedCount > 0 && (
                      <button
                        onClick={handleBatchDownload}
                        disabled={isZipping}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-2 shadow-sm"
                      >
                        {isZipping ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download ({selectedCount})
                      </button>
                    )}
                    <div className="h-8 w-px bg-slate-200 mx-1"></div>
                  </>
                )}

                <button 
                  onClick={handleStartNew}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Project
                </button>
                <button
                  onClick={handleStageAll}
                  disabled={!hasIdleImages || isProcessingAny}
                  className={clsx(
                    "px-6 py-2.5 rounded-lg font-semibold text-white flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:transform active:scale-95",
                    !hasIdleImages || isProcessingAny
                      ? "bg-slate-300 cursor-not-allowed shadow-none" 
                      : "bg-slate-900 hover:bg-slate-800"
                  )}
                >
                  {isProcessingAny ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Stage All Pending
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Sidebar: Style Configuration */}
              <div className="lg:col-span-3 space-y-6 sticky top-44 max-h-[calc(100vh-180px)] flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    suggestedStyle={suggestedStyle}
                    onSelect={setSelectedStyle}
                    isAIEnabled={isAIEnabled}
                    onToggleAI={handleToggleAI}
                    isAnalyzing={isAnalyzingStyle}
                  />
                </div>
              </div>

              {/* Main Grid */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <ImageCard
                      key={item.id}
                      item={item}
                      globalStyle={selectedStyle}
                      onDelete={handleDelete}
                      onRefine={handleOpenRefine}
                      onStage={handleStageSingle}
                      onExpand={setExpandedItemId}
                      onStyleChange={handleItemStyleChange}
                      onPromptChange={handleItemPromptChange}
                      onWeatherChange={handleItemWeatherChange}
                      onDeclutterChange={handleItemDeclutterChange}
                      onAIToggle={handleItemAIToggle}
                      onQuickRefine={handleQuickRefine}
                      onToggleSelect={handleToggleSelect}
                      onGeneratePlan={handleGeneratePlan}
                    />
                  ))}
                  
                  {items.length < MAX_IMAGES && (
                    <div className="aspect-[3/2] rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center cursor-pointer group bg-white"
                         onClick={() => document.getElementById('image-upload-compact')?.click()}
                    >
                      <div className="p-4 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-sm mb-3 transition-all">
                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-900">Add Another Image</span>
                      {/* Hidden upload component just to handle the file input logic easily */}
                      <div className="hidden">
                         <ImageUpload onImagesSelect={handleImagesSelect} compact />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <RefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onConfirm={handleRefineSubmit}
        isProcessing={isRefining}
      />

      {expandedItem && (
        <ImageModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItemId(null)}
          originalImage={expandedItem.original}
          generatedImage={expandedItem.generated}
        />
      )}
    </div>
  );
};

export default App;
