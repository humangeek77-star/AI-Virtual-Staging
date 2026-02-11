import React, { useState } from 'react';
import { ImageItem, DesignStyle, DeclutterMode } from '../types';
import { Trash2, Download, Wand2, AlertCircle, Eye, RefreshCw, Maximize2, ChevronDown, MessageSquarePlus, X, BrainCircuit, CloudSun, Eraser, Check, Box, Map } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageCardProps {
  item: ImageItem;
  globalStyle: DesignStyle;
  onDelete: (id: string) => void;
  onRefine: (id: string) => void;
  onStage: (id: string) => void;
  onExpand: (id: string) => void;
  onStyleChange: (id: string, style: DesignStyle) => void;
  onPromptChange: (id: string, prompt: string) => void;
  onWeatherChange: (id: string, weather: string) => void;
  onDeclutterChange: (id: string, mode: DeclutterMode, prompt?: string) => void;
  onAIToggle: (id: string, enabled: boolean) => void;
  onQuickRefine: (id: string, instruction: string) => void;
  onToggleSelect: (id: string) => void;
  onGeneratePlan: (id: string, type: '2D' | '3D') => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  item, 
  globalStyle,
  onDelete, 
  onRefine, 
  onStage, 
  onExpand,
  onStyleChange,
  onPromptChange,
  onWeatherChange,
  onDeclutterChange,
  onAIToggle,
  onQuickRefine,
  onToggleSelect,
  onGeneratePlan
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [activeInput, setActiveInput] = useState<'none' | 'prompt' | 'weather' | 'declutter'>('none');

  const displayImage = (isHolding || !item.generated) ? item.original : item.generated;
  const isProcessing = item.status === 'processing';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isIdle = item.status === 'idle';

  const effectiveStyle = item.style || globalStyle;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.generated) {
      const link = document.createElement('a');
      link.href = item.generated;
      link.download = `staged-room-${item.id.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleInput = (type: 'prompt' | 'weather' | 'declutter') => {
    setActiveInput(activeInput === type ? 'none' : type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isCompleted) {
        // If completed, treat input as a quick refine instruction
        if (activeInput === 'prompt' && item.customPrompt) {
           onQuickRefine(item.id, item.customPrompt);
        } else if (activeInput === 'weather' && item.weatherPrompt) {
           onQuickRefine(item.id, `Change weather to: ${item.weatherPrompt}`);
        }
      } else {
        // If not completed, stage from scratch
        onStage(item.id);
      }
    }
  };

  return (
    <div className={clsx(
      "bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md",
      item.selected ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
    )}>
      <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
        <img
          src={displayImage}
          alt="Room"
          className={clsx(
            "w-full h-full object-cover transition-transform duration-700 select-none",
            isProcessing && "scale-105 blur-sm"
          )}
          draggable={false}
        />
        
        {/* Status Overlays */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] z-10">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-3"></div>
            <span className="text-slate-900 text-xs font-semibold tracking-wide uppercase">Processing</span>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/95 z-10 p-6 text-center animate-in fade-in">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm text-red-900 font-semibold mb-1">Generation Failed</p>
            <p className="text-xs text-red-700 font-medium line-clamp-4 max-w-[200px]">
              {item.error || "The model could not generate an image."}
            </p>
          </div>
        )}

        {/* Selection Checkbox (Only for completed items) */}
        {isCompleted && (
          <div className="absolute top-3 left-3 z-20">
            <button
              onClick={() => onToggleSelect(item.id)}
              className={clsx(
                "w-6 h-6 rounded-md border flex items-center justify-center transition-all shadow-sm",
                item.selected 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "bg-white/90 border-gray-300 text-transparent hover:border-blue-400"
              )}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Right Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg shadow-sm border border-gray-200 transition-colors"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Expand Button (Center Overlay on Hover) */}
        {(isCompleted || isIdle) && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              onClick={() => onExpand(item.id)}
              className="pointer-events-auto p-3.5 bg-white/90 hover:bg-white text-slate-900 rounded-full backdrop-blur-sm transform scale-90 hover:scale-100 transition-all shadow-lg border border-gray-200"
              title="Expand View"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Discreet Hold to Compare Button */}
        {isCompleted && (
          <button
            className={clsx(
              "absolute bottom-3 right-3 p-2 rounded-lg backdrop-blur-md transition-all z-20 select-none shadow-sm border",
              isHolding 
                ? "bg-white text-indigo-600 border-indigo-200 scale-105 shadow-md" 
                : "bg-white/80 hover:bg-white text-slate-600 border-white/50"
            )}
            onMouseDown={() => setIsHolding(true)}
            onMouseUp={() => setIsHolding(false)}
            onMouseLeave={() => setIsHolding(false)}
            onTouchStart={() => setIsHolding(true)}
            onTouchEnd={() => setIsHolding(false)}
            title="Hold to see original"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input Areas */}
      {!item.isAIAnalysisEnabled && (
        <>
          {/* Custom Prompt Input */}
          {activeInput === 'prompt' && (
            <div className="px-4 pt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <textarea
                  value={item.customPrompt || ''}
                  onChange={(e) => onPromptChange(item.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isCompleted ? "Refine result (e.g. remove snow)... Press Enter" : "Staging instructions (e.g. white sofa)..."}
                  className="w-full text-xs p-3 pr-8 rounded-lg border border-gray-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none bg-gray-50 text-slate-700 placeholder:text-slate-400"
                  rows={2}
                />
                <button 
                  onClick={() => setActiveInput('none')}
                  className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Weather Input */}
          {activeInput === 'weather' && (
            <div className="px-4 pt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <textarea
                  value={item.weatherPrompt || ''}
                  onChange={(e) => onWeatherChange(item.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isCompleted ? "Update weather (e.g. sunny)... Press Enter" : "Weather context (e.g. snowy outside)..."}
                  className="w-full text-xs p-3 pr-8 rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none bg-amber-50/50 text-slate-700 placeholder:text-slate-400"
                  rows={2}
                />
                <button 
                  onClick={() => setActiveInput('none')}
                  className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-amber-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Declutter Input */}
          {activeInput === 'declutter' && (
            <div className="px-4 pt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="bg-rose-50/50 rounded-lg border border-rose-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-rose-900">Decluttering Mode</span>
                  <button 
                    onClick={() => setActiveInput('none')}
                    className="p-1 text-rose-400 hover:text-rose-700 rounded-full hover:bg-rose-100 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => onDeclutterChange(item.id, 'auto')}
                    className={clsx(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors border",
                      item.declutterMode === 'auto'
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-600 border-gray-200 hover:border-rose-300"
                    )}
                  >
                    AI Auto
                  </button>
                  <button
                    onClick={() => onDeclutterChange(item.id, 'manual')}
                    className={clsx(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors border",
                      item.declutterMode === 'manual'
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-600 border-gray-200 hover:border-rose-300"
                    )}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => onDeclutterChange(item.id, 'none')}
                    className={clsx(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors border",
                      item.declutterMode === 'none' || !item.declutterMode
                        ? "bg-slate-200 text-slate-700 border-slate-300"
                        : "bg-white text-slate-600 border-gray-200 hover:border-slate-300"
                    )}
                  >
                    Off
                  </button>
                </div>

                {item.declutterMode === 'manual' && (
                  <textarea
                    value={item.declutterPrompt || ''}
                    onChange={(e) => onDeclutterChange(item.id, 'manual', e.target.value)}
                    placeholder="List items to remove (e.g. cardboard boxes, old sofa)..."
                    className="w-full text-xs p-2 rounded-md border border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none bg-white text-slate-700 placeholder:text-slate-400"
                    rows={2}
                  />
                )}
                
                {item.declutterMode === 'auto' && (
                  <p className="text-xs text-rose-600 italic px-1">
                    AI will remove clutter but keep main furniture.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom Actions Bar */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white gap-3">
        
        {/* AI Toggle Button */}
        <button
          onClick={() => onAIToggle(item.id, !item.isAIAnalysisEnabled)}
          className={clsx(
            "p-2 rounded-lg transition-all shrink-0 border",
            item.isAIAnalysisEnabled
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-400 border-gray-200 hover:border-slate-300 hover:text-slate-600"
          )}
          title={item.isAIAnalysisEnabled ? "AI Auto-Analysis Enabled" : "Enable AI Auto-Analysis"}
        >
          <BrainCircuit className="w-4 h-4" />
        </button>

        {/* Style Selector Dropdown */}
        <div className={clsx(
          "flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 py-2 border transition-colors relative group/select",
          item.isAIAnalysisEnabled 
            ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60" 
            : "bg-white border-gray-200 hover:border-gray-300"
        )}>
          <div className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isCompleted ? "bg-emerald-500" : isProcessing ? "bg-indigo-500 animate-pulse" : isError ? "bg-red-500" : "bg-slate-300"
          )} />
          
          {item.isAIAnalysisEnabled ? (
            <span className="text-xs font-semibold text-slate-500 w-full truncate">
              AI Auto-Detect
            </span>
          ) : (
            <select
              value={effectiveStyle}
              onChange={(e) => onStyleChange(item.id, e.target.value as DesignStyle)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:ring-0 p-0 cursor-pointer w-full appearance-none pr-4 outline-none"
              disabled={isProcessing}
            >
              {Object.values(DesignStyle).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          
          {!item.isAIAnalysisEnabled && (
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          )}
        </div>

        {/* Extra Controls (Hidden if AI is enabled) */}
        {!item.isAIAnalysisEnabled && (
          <div className="flex gap-1">
            <button
              onClick={() => toggleInput('declutter')}
              className={clsx(
                "p-2 rounded-lg transition-colors border",
                activeInput === 'declutter' || (item.declutterMode && item.declutterMode !== 'none')
                  ? "bg-rose-50 text-rose-600 border-rose-100" 
                  : "bg-white text-slate-400 border-gray-200 hover:border-gray-300 hover:text-slate-600"
              )}
              title="Decluttering Options"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleInput('weather')}
              className={clsx(
                "p-2 rounded-lg transition-colors border",
                activeInput === 'weather' || item.weatherPrompt
                  ? "bg-amber-50 text-amber-600 border-amber-100" 
                  : "bg-white text-slate-400 border-gray-200 hover:border-gray-300 hover:text-slate-600"
              )}
              title="Weather & Outdoor Settings"
            >
              <CloudSun className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleInput('prompt')}
              className={clsx(
                "p-2 rounded-lg transition-colors border",
                activeInput === 'prompt' || item.customPrompt 
                  ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                  : "bg-white text-slate-400 border-gray-200 hover:border-gray-300 hover:text-slate-600"
              )}
              title="Add custom staging instructions"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 border-l border-gray-100 pl-3">
          {isIdle && (
            <div className="flex gap-1">
              <button
                onClick={() => onGeneratePlan(item.id, '2D')}
                className="p-2 text-xs font-medium text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                title="Generate 2D Plan"
              >
                <Map className="w-4 h-4" />
              </button>
              <button
                onClick={() => onGeneratePlan(item.id, '3D')}
                className="p-2 text-xs font-medium text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                title="Generate 3D View"
              >
                <Box className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStage(item.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-sm hover:shadow"
              >
                <Wand2 className="w-3 h-3" />
                Stage
              </button>
            </div>
          )}
          {isCompleted && (
            <>
              <button
                onClick={() => onStage(item.id)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Regenerate Image"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRefine(item.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                Refine
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          {isError && (
             <button
             onClick={() => onStage(item.id)} 
             className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
           >
             <RefreshCw className="w-3 h-3" />
             Retry
           </button>
          )}
        </div>
      </div>
    </div>
  );
};
