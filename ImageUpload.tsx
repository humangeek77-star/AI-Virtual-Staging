import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  className?: string;
  compact?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesSelect, className, compact = false }) => {
  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    }
    
    if (files.length > 0) {
      onImagesSelect(files);
    }
  }, [onImagesSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={clsx(
        "border border-dashed rounded-xl text-center transition-all cursor-pointer group relative",
        "border-slate-300 hover:border-blue-500 hover:bg-blue-50/30",
        compact ? "p-6" : "p-12",
        className
      )}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id={`image-upload-${compact ? 'compact' : 'full'}`}
        onChange={onInputChange}
      />
      <label htmlFor={`image-upload-${compact ? 'compact' : 'full'}`} className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
        <div className={clsx(
          "rounded-full mb-4 transition-colors flex items-center justify-center shadow-sm",
          "bg-white border border-slate-100 group-hover:border-blue-200 group-hover:shadow-md",
          compact ? "p-3" : "p-4"
        )}>
          <Upload className={clsx("text-slate-400 group-hover:text-blue-600 transition-colors", compact ? "w-5 h-5" : "w-6 h-6")} />
        </div>
        <h3 className={clsx("font-semibold text-slate-900", compact ? "text-sm" : "text-lg mb-2")}>
          {compact ? "Add more images" : "Upload Property Photos"}
        </h3>
        {!compact && (
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            Drag & drop high-res photos here, or click to browse.
            <br/>
            <span className="text-xs text-slate-400 mt-2 block">Supports JPG, PNG • Max 10 files</span>
          </p>
        )}
      </label>
    </div>
  );
};
