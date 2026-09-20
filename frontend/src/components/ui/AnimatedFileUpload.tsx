import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpTrayIcon, 
  PhotoIcon, 
  XMarkIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface AnimatedFileUploadProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  onRemove: () => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const AnimatedFileUpload: React.FC<AnimatedFileUploadProps> = ({
  onFileSelect,
  previewUrl,
  onRemove,
  accept = 'image/*',
  maxSizeMb = 10,
  label = 'Drop photographic evidence here, or browse',
  sublabel = 'Supports JPG, PNG, WEBP up to 10MB',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setErrorMessage(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcess(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcess(file);
    }
  };

  const validateAndProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum allowed size of ${maxSizeMb}MB.`);
      return;
    }

    setErrorMessage(null);
    onFileSelect(file);
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        id="animated-file-input"
      />

      <AnimatePresence mode="wait">
        {!previewUrl ? (
          /* Empty / Drop Zone State */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            role="button"
            tabIndex={0}
            aria-label="Upload photographic proof"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 scale-[1.01]'
                : 'border-stone-200 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-stone-50/60 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900'
            }`}
          >
            <motion.div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                isDragOver
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
              animate={{ scale: isDragOver ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {isDragOver ? (
                <ArrowUpTrayIcon className="w-6 h-6 animate-bounce" />
              ) : (
                <PhotoIcon className="w-6 h-6" />
              )}
            </motion.div>

            <span className="text-sm font-bold text-stone-900 dark:text-white mb-1">
              {label}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {sublabel}
            </span>

            {errorMessage && (
              <div
                role="alert"
                className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                {errorMessage}
              </div>
            )}
          </motion.div>
        ) : (
          /* File Uploaded Preview State */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs"
          >
            <div className="relative w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
              <img
                src={previewUrl}
                alt="Selected evidence preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grow min-w-0 space-y-1 text-left w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircleIcon className="w-4 h-4 shrink-0" />
                <span>Photographic Evidence Attached</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                On-site photo ready for geolocation and multimodal verification.
              </p>
              <div className="text-[10px] font-mono text-stone-400">
                Status: Ready for submission
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) fileInputRef.current.value = '';
                onRemove();
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
              aria-label="Remove photo"
              title="Remove photo"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
