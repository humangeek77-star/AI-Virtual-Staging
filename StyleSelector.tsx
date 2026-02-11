import React from 'react';
import { DesignStyle } from '../types';
import { Check, Sparkles, BrainCircuit } from 'lucide-react';
import { clsx } from 'clsx';

interface StyleSelectorProps {
  selectedStyle: DesignStyle;
  suggestedStyle: DesignStyle | null;
  onSelect: (style: DesignStyle) => void;
  isAIEnabled: boolean;
  onToggleAI: (enabled: boolean) => void;
  isAnalyzing?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  suggestedStyle,
  onSelect,
  isAIEnabled,
  onToggleAI,
  isAnalyzing = false
}) => {
  return (
    <div className="space-y-6 flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* AI Toggle Section */}
      <div className={clsx(
        "p-5 rounded-xl border transition-all",
        isAIEnabled 
          ? "bg-slate-900 border-slate-900 text-white shadow-md" 
          : "bg-white border-gray-200 text-slate-900"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={clsx("p-1.5 rounded-lg", isAIEnabled ? "bg-white/10" : "bg-slate-100")}>
              <BrainCircuit className={clsx("w-5 h-5", isAIEnabled ? "text-white" : "text-slate-600")} />
            </div>
            <span className="text-sm font-bold tracking-wide">AI Style Analysis</span>
          </div>
          <button
            onClick={() => onToggleAI(!isAIEnabled)}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
              isAIEnabled ? "bg-white/20 focus:ring-white" : "bg-gray-200 focus:ring-slate-900"
            )}
            role="switch"
            aria-checked={isAIEnabled}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                isAIEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
        <p className={clsx("text-xs leading-relaxed opacity-90", isAIEnabled ? "text-slate-300" : "text-slate-500")}>
          {isAIEnabled 
            ? "AI will analyze room architecture and automatically select the optimal design style." 
            : "Manual mode active. Select your preferred design style from the list below."}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Design Aesthetics
        </h3>
        {isAnalyzing && (
          <span className="text-xs font-medium text-indigo-600 flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3 h-3" />
            Analyzing...
          </span>
        )}
      </div>
      
      {/* Scrollable Grid */}
      <div className="overflow-y-auto pr-2 -mr-2 flex-1 min-h-0 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
          {Object.values(DesignStyle).map((style) => (
            <button
              key={style}
              onClick={() => onSelect(style)}
              className={clsx(
                "relative px-4 py-3.5 rounded-lg text-sm font-medium text-left transition-all border group",
                selectedStyle === style
                  ? "border-slate-900 bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-900"
                  : "border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="block truncate pr-5">{style}</span>
              
              {selectedStyle === style && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3">
                  <Check className="w-4 h-4 text-slate-900" />
                </div>
              )}
              
              {suggestedStyle === style && selectedStyle !== style && (
                 <div className="absolute top-1/2 -translate-y-1/2 right-3" title="AI Suggested">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
              )}
              
              {suggestedStyle === style && selectedStyle === style && (
                <div className="absolute top-1/2 -translate-y-1/2 right-8" title="AI Suggested">
                   <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
