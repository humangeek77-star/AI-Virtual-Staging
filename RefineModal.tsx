import React, { useState, useEffect } from 'react';
import { X, Wand2 } from 'lucide-react';
import { clsx } from 'clsx';

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instruction: string) => void;
  isProcessing: boolean;
}

export const RefineModal: React.FC<RefineModalProps> = ({ isOpen, onClose, onConfirm, isProcessing }) => {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInstruction('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-slate-900">Refine Result</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4 font-medium">
            Describe what you want to change about the image. Be specific.
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="E.g., Make the sofa leather, change the wall color to navy blue, add a plant in the corner..."
            className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-sm mb-6 bg-gray-50 text-slate-900 placeholder:text-slate-400"
            autoFocus
          />
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(instruction)}
              disabled={!instruction.trim() || isProcessing}
              className={clsx(
                "px-5 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 transition-all shadow-sm",
                !instruction.trim() || isProcessing 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-slate-900 hover:bg-slate-800 hover:shadow-md"
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
