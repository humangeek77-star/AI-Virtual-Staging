
import React, { useState } from 'react';
import { StagingImage } from '../types';
import { GeminiService } from '../services/geminiService';

interface EditingModalProps {
  image: StagingImage;
  onClose: () => void;
  onUpdate: (id: string, newUrl: string) => void;
  isHighQuality: boolean;
}

const EditingModal: React.FC<EditingModalProps> = ({ image, onClose, onUpdate, isHighQuality }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const currentUrl = image.stagedUrl || image.originalUrl;
      const base64 = currentUrl.split(',')[1];
      const result = await GeminiService.editImage(base64, prompt, isHighQuality);
      onUpdate(image.id, result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to edit image');
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestionChips = [
    "Remove the rug on the stairs",
    "Add a small green plant in the corner",
    "Replace the rug with a modern grey one",
    "Add more sunlight coming from the windows",
    "Change the wall color to off-white",
    "Remove the clutter on the table",
    "Add a large landscape painting on the back wall"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        <div className="flex-1 bg-slate-100 relative">
          <img 
            src={image.stagedUrl || image.originalUrl} 
            alt="Editing preview" 
            className="w-full h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
              <p className="font-bold text-lg animate-pulse">Applying changes...</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-80 p-6 flex flex-col border-l border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Refine Image</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times text-slate-400"></i>
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Tell AI what you want to add, remove, or change in this room.
          </p>

          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full flex-1 min-h-[120px] bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
            placeholder="e.g. Add a mid-century sofa and a coffee table..."
          />

          <div className="mt-4 flex flex-wrap gap-2 mb-6">
            {suggestionChips.map(chip => (
              <button 
                key={chip}
                onClick={() => setPrompt(chip)}
                className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-colors border border-slate-200 text-slate-500 font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-start gap-2">
              <i className="fas fa-exclamation-circle mt-0.5"></i>
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button 
              disabled={isProcessing || !prompt.trim()}
              onClick={handleEdit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Update Image
            </button>
            <button 
              onClick={onClose}
              className="w-full text-slate-500 font-semibold py-2 text-sm hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditingModal;
