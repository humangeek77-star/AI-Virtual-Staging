import React, { useState, useEffect } from 'react';
import { X, Download, Eye } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string;
  generatedImage: string | null;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, originalImage, generatedImage }) => {
  const [isHolding, setIsHolding] = useState(false);

  // Reset holding state when modal opens/closes
  useEffect(() => {
    if (!isOpen) setIsHolding(false);
  }, [isOpen]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayImage = (isHolding || !generatedImage) ? originalImage : generatedImage;

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `staged-room-large-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Image Container - Maximized */}
        <div className="relative w-full h-full flex items-center justify-center p-4 pb-24">
          <img
            src={displayImage}
            alt="Expanded View"
            className="max-w-full max-h-full object-contain shadow-2xl select-none rounded-sm"
            draggable={false}
          />

          {/* Discreet Hold to Compare Button */}
          {generatedImage && (
            <button
              className={clsx(
                "absolute bottom-28 right-10 p-4 rounded-full backdrop-blur-xl transition-all transform select-none shadow-2xl border group",
                isHolding 
                  ? "bg-white text-indigo-600 border-indigo-200 scale-105" 
                  : "bg-black/40 hover:bg-black/60 text-white border-white/20"
              )}
              onMouseDown={() => setIsHolding(true)}
              onMouseUp={() => setIsHolding(false)}
              onMouseLeave={() => setIsHolding(false)}
              onTouchStart={() => setIsHolding(true)}
              onTouchEnd={() => setIsHolding(false)}
              title="Hold to compare with original"
            >
              <Eye className="w-6 h-6" />
              <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-sm">
                Hold to compare
              </span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="text-white/90 text-lg font-medium px-4 tracking-wide">
            {isHolding ? "Original Photo" : (generatedImage ? "Staged Result" : "Original Photo")}
          </div>
          
          {generatedImage && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl hover:bg-gray-100 font-bold text-sm transition-all shadow-lg active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download High Res
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
