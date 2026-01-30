
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DesignStyle, StagingImage } from './types';
import { DESIGN_STYLE_DESCRIPTIONS, MAX_IMAGES } from './constants';
import { GeminiService } from './services/geminiService';
import EditingModal from './components/EditingModal';
import ImageModal from './components/ImageModal';

const App: React.FC = () => {
  const [images, setImages] = useState<StagingImage[]>([]);
  // Use a ref to always have access to the LATEST state in async functions
  const imagesRef = useRef<StagingImage[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const [globalStyle, setGlobalStyle] = useState<DesignStyle>(DesignStyle.MEDITERRANEAN);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [enableAIStyleSuggestion, setEnableAIStyleSuggestion] = useState(false);
  const [editingImage, setEditingImage] = useState<StagingImage | null>(null);
  const [expandedImage, setExpandedImage] = useState<StagingImage | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const countToLoad = Math.min(files.length, MAX_IMAGES - images.length);
    const newImages: StagingImage[] = [];

    for (let i = 0; i < countToLoad; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const imagePromise = new Promise<StagingImage>(resolve => {
        reader.onload = async (e) => {
          const url = e.target?.result as string;
          let suggestedStyle: DesignStyle = globalStyle;
          let isAI: boolean = false;

          if (enableAIStyleSuggestion) {
            try {
              const base64 = url.split(',')[1];
              suggestedStyle = await GeminiService.suggestDesignStyle(base64);
              isAI = true;
            } catch (error) {
              console.error("Failed to get AI style suggestion:", error);
              suggestedStyle = globalStyle;
              isAI = false;
            }
          }

          resolve({
            id: Math.random().toString(36).substr(2, 9),
            originalUrl: url,
            status: 'idle',
            filename: file.name.split('.')[0] + '_staged',
            style: suggestedStyle,
            history: [url],
            isAIStyleSuggested: isAI
          });
        };
        reader.readAsDataURL(file);
      });
      newImages.push(await imagePromise);
    }
    
    setImages(prev => [...prev, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyGlobalToAll = () => {
    setImages(prev => prev.map(img => 
      img.status !== 'processing' && !img.isAIStyleSuggested ? { ...img, style: globalStyle } : img
    ));
  };

  const stageSingleImage = async (imgId: string) => {
    const img = imagesRef.current.find(i => i.id === imgId);
    if (!img || img.status === 'processing') return;

    setImages(prev => prev.map(i => i.id === imgId ? { ...i, status: 'processing' } : i));

    try {
      const base64 = img.originalUrl.split(',')[1];
      const result = await GeminiService.stageImage(base64, img.style, isHighQuality);
      
      setImages(prev => prev.map(i => i.id === imgId ? { 
        ...i, 
        stagedUrl: result, 
        stagedStyle: img.style,
        status: 'completed' 
      } : i));
    } catch (error: any) {
      console.error("Staging error:", error);
      setImages(prev => prev.map(i => i.id === imgId ? { 
        ...i, 
        status: 'failed', 
        error: error.message 
      } : i));
    }
  };

  const stageAllImages = async () => {
    if (isProcessingAll) return;
    setIsProcessingAll(true);
    
    const toProcess = imagesRef.current.filter(img => 
      img.status !== 'completed' || img.style !== img.stagedStyle
    );

    for (const img of toProcess) {
      await stageSingleImage(img.id);
    }
    
    setIsProcessingAll(false);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(i => i.id !== id));
  };

  const clearAllImages = () => {
    // Perform a full reset of the app state
    setImages([]);
    setGlobalStyle(DesignStyle.MEDITERRANEAN);
    setIsHighQuality(false);
    setEnableAIStyleSuggestion(false);
  };

  const downloadImage = (img: StagingImage) => {
    const url = img.stagedUrl || img.originalUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${img.filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateImage = (id: string, newUrl: string) => {
    setImages(prev => prev.map(i => i.id === id ? { ...i, stagedUrl: newUrl, status: 'completed' } : i));
  };

  const updateIndividualStyle = (id: string, style: DesignStyle) => {
    setImages(prev => prev.map(img => img.id === id ? { 
      ...img, 
      style, 
      isAIStyleSuggested: false 
    } : img));
  };

  const canApplyGlobalStyle = useMemo(() => {
    return images.length > 0 && 
           !isProcessingAll && 
           images.some(img => img.status !== 'processing' && img.style !== globalStyle && !img.isAIStyleSuggested);
  }, [images, isProcessingAll, globalStyle]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-inter text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        accept="image/*" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200 flex items-center justify-center">
            <i className="fas fa-couch text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none mb-1">StagedAI</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Real Estate Visuals</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={clearAllImages}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-bold px-5 py-2.5 rounded-xl border border-slate-200 transition-all text-sm group"
          >
            <i className="fas fa-redo-alt text-xs group-hover:rotate-180 transition-transform duration-500"></i>
            Start New
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold px-5 py-2.5 rounded-xl border border-slate-200 transition-all text-sm"
          >
            <i className="fas fa-plus text-xs"></i>
            Upload Room
          </button>
          {images.length > 0 && (
            <button 
              onClick={stageAllImages}
              disabled={isProcessingAll}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-bold px-7 py-2.5 rounded-xl shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-50 text-sm"
            >
              {isProcessingAll ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-pencil-alt text-xs"></i>
              )}
              Stage {images.length} Listings
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60 sticky top-28">
            <div className="flex items-center gap-3 mb-8">
               <i className="fas fa-swatchbook text-indigo-500 text-lg"></i>
               <h2 className="text-lg font-bold text-slate-800">Global Staging</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Default Style</label>
                <div className="relative group">
                  <select 
                    value={globalStyle}
                    onChange={(e) => setGlobalStyle(e.target.value as DesignStyle)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none text-sm font-semibold pr-12 cursor-pointer"
                  >
                    {Object.values(DesignStyle).map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <i className="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
                <p className="mt-5 text-xs text-slate-500 leading-relaxed italic border-l-2 border-indigo-100 pl-4 py-1">
                  {DESIGN_STYLE_DESCRIPTIONS[globalStyle]}
                </p>
              </div>

              <button 
                onClick={applyGlobalToAll}
                disabled={!canApplyGlobalStyle}
                className="w-full bg-indigo-50/40 hover:bg-indigo-50 text-indigo-600 font-bold py-4 rounded-2xl transition-all text-[11px] border border-dashed border-indigo-200 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Style to All
              </button>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                 <div className="flex items-center justify-between group">
                   <span className="text-xs font-bold text-slate-700">Pro Rendering (2K)</span>
                   <div 
                    className={`w-11 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${isHighQuality ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    onClick={() => setIsHighQuality(!isHighQuality)}
                   >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isHighQuality ? 'left-6.5' : 'left-0.5'}`} />
                   </div>
                 </div>
                 <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                   <i className="fas fa-microchip text-[10px]"></i>
                   Gemini 3 Pro Engine
                 </div>

                 <div className="flex items-center justify-between group pt-4 border-t border-slate-100">
                   <span className="text-xs font-bold text-slate-700">AI Style Suggestion</span>
                   <div 
                    className={`w-11 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${enableAIStyleSuggestion ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    onClick={() => setEnableAIStyleSuggestion(!enableAIStyleSuggestion)}
                   >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${enableAIStyleSuggestion ? 'left-6.5' : 'left-0.5'}`} />
                   </div>
                 </div>
                 <p className="mt-2 text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-brain text-[10px]"></i>
                   AI recommends best staging style on upload
                 </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9">
          {images.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[3rem] p-16 py-48 text-center hover:border-indigo-200 hover:bg-white transition-all cursor-pointer group"
            >
              <div className="w-24 h-24 bg-indigo-50/50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <i className="fas fa-cloud-upload-alt text-4xl text-indigo-400"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Upload Listing Photos</h3>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">Transform empty spaces into stunning homes. Upload up to 10 photos to start staging.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {images.map((img) => (
                <div key={img.id} className="bg-white rounded-[2.5rem] shadow-md border border-slate-200/60 overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1">
                  <div className="relative aspect-[16/10] bg-slate-100 cursor-zoom-in overflow-hidden group" onClick={() => setExpandedImage(img)}>
                    <img 
                      src={img.stagedUrl || img.originalUrl} 
                      alt="Room" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
                        <div className="relative w-16 h-16 mb-4">
                          <i className="fas fa-circle-notch fa-spin text-4xl opacity-20 absolute inset-0 flex items-center justify-center"></i>
                          <i className="fas fa-magic text-2xl absolute inset-0 flex items-center justify-center animate-pulse"></i>
                        </div>
                        <span className="font-black text-xs uppercase tracking-[0.2em]">Processing...</span>
                      </div>
                    )}
                    
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all z-10 translate-y-[-10px] group-hover:translate-y-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="w-10 h-10 bg-white/95 hover:bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-xl transition-all border border-slate-100"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text"
                        value={img.filename}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImages(prev => prev.map(i => i.id === img.id ? { ...i, filename: val } : i));
                        }}
                        className="text-lg font-black text-slate-900 truncate bg-transparent border-b-2 border-transparent hover:border-slate-100 focus:border-indigo-500 outline-none transition-all pb-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2">
                         <span className={`w-2.5 h-2.5 rounded-full ${img.status === 'completed' ? 'bg-[#22C55E] shadow-lg shadow-green-100/50' : 'bg-slate-300'}`}></span>
                         <span className={`text-[10px] uppercase font-black tracking-widest ${img.status === 'completed' ? 'text-green-600' : 'text-slate-400'}`}>
                           {img.status === 'completed' ? 'Listing Ready' : 'Awaiting Staging'}
                         </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Individual Style</label>
                       <div className="relative group">
                          <select 
                            value={img.style}
                            disabled={img.status === 'processing'}
                            onChange={(e) => updateIndividualStyle(img.id, e.target.value as DesignStyle)}
                            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all pr-12 cursor-pointer text-slate-700"
                          >
                            {Object.values(DesignStyle).map(style => (
                              <option key={style} value={style}>{style}</option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <i className="fas fa-chevron-down text-[10px]"></i>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100/60">
                      <div className="flex -space-x-4 items-center">
                         <div className="w-12 h-12 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-slate-200/50" title="Original Reference">
                           <img src={img.originalUrl} className="w-full h-full object-cover opacity-60" />
                         </div>
                         {img.stagedUrl && (
                           <div className="w-11 h-11 rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-indigo-500/30 z-10 scale-110" title="AI Version Active">
                             AI
                           </div>
                         )}
                      </div>

                      <div className="flex items-center gap-3">
                        {img.status === 'completed' && (
                          <button 
                            onClick={() => setEditingImage(img)}
                            className="text-[10px] font-black text-slate-600 hover:text-indigo-600 px-5 py-3 rounded-2xl flex items-center gap-2 transition-all bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 uppercase tracking-widest"
                          >
                            <i className="fas fa-wand-magic-sparkles text-xs"></i>
                            Refine
                          </button>
                        )}
                        
                        {(img.status === 'idle' || img.status === 'completed' || img.status === 'failed') && (
                          <button 
                            onClick={() => stageSingleImage(img.id)}
                            disabled={img.status === 'processing'}
                            className={`text-[10px] font-black text-white px-7 py-3 rounded-2xl flex items-center gap-3 transition-all uppercase tracking-widest shadow-xl ${
                              img.status === 'completed' && img.style !== img.stagedStyle
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-green-200 scale-105 ring-2 ring-green-100 ring-offset-2' 
                              : 'bg-gradient-to-r from-indigo-500 to-indigo-700 shadow-indigo-200 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <i className={img.status === 'completed' ? "fas fa-sync-alt text-xs" : "fas fa-pencil-alt text-xs"}></i>
                            {img.status === 'completed' 
                              ? (img.style !== img.stagedStyle ? 'Apply New Style' : 'Re-stage') 
                              : 'Stage'}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => downloadImage(img)}
                          disabled={!img.stagedUrl}
                          className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all border border-slate-100 disabled:opacity-30"
                          title="Download High Res"
                        >
                          <i className="fas fa-download text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {images.length < MAX_IMAGES && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 py-24 text-slate-300 hover:bg-white hover:border-indigo-200 hover:text-indigo-400 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-slate-100">
                    <i className="fas fa-plus text-2xl"></i>
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Add More</span>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-10 py-5 flex items-center justify-between z-40">
        <div className="flex gap-10">
          <div className="flex items-center gap-3">
            <span className="flex w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-100 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Cloud Core Active</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <i className="fas fa-database text-slate-300 text-xs"></i>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               {images.filter(i => i.status === 'completed').length} Listings Processed
             </span>
          </div>
        </div>
        <div className="text-[11px] font-black text-slate-800 tracking-[0.3em] flex items-center gap-3">
          <i className="fas fa-shield-halved text-indigo-500 text-sm"></i>
          STAGED.AI ENTERPRISE
        </div>
      </footer>

      {editingImage && (
        <EditingModal 
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onUpdate={handleUpdateImage}
          isHighQuality={isHighQuality}
        />
      )}

      {expandedImage && (
        <ImageModal 
          image={expandedImage} 
          onClose={() => setExpandedImage(null)} 
        />
      )}
    </div>
  );
};

export default App;
