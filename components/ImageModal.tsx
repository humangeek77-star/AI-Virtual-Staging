
import React, { useState } from 'react';
import { StagingImage } from '../types';

interface ImageModalProps {
  image: StagingImage;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-slate-950/90 backdrop-blur-xl transition-all animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <h3 className="text-white font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
              {image.filename}
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            {image.stagedUrl && (
              <button 
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95 select-none"
              >
                Hold to View Original
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/10 transition-all"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
          <img 
            src={showOriginal ? image.originalUrl : (image.stagedUrl || image.originalUrl)} 
            alt="Expanded view" 
            className="max-w-full max-h-full object-contain transition-opacity duration-300"
          />
          
          {/* Label Badge */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white text-xs font-bold uppercase tracking-widest">
            {showOriginal ? 'Original Empty Room' : 'AI Staged Room'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
