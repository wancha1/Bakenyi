import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Check, RefreshCw, AlertCircle, FileText, Image as ImageIcon, Video, Music, Loader2 } from 'lucide-react';
import { uploadMedia, uploadAudioFile } from '../../lib/supabase';

export interface UploadZoneProps {
  accept?: string | string[];
  maxSizeBytes?: number;
  maxSizeMB?: number;
  fileType?: 'image' | 'audio' | 'video' | 'document' | 'general';
  value?: string;
  onUploadSuccess: (url: string, file: File) => void;
  onUploadError?: (error: string) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  hint?: string;
  bucket?: string;
  folderPath?: string;
  className?: string;
}

export function UploadZone({
  accept = "image/*,audio/*,video/*,.pdf,.doc,.docx",
  maxSizeBytes,
  maxSizeMB = 25,
  fileType = 'general',
  value = '',
  onUploadSuccess,
  onUploadError,
  onRemove,
  label = 'Upload File',
  description,
  hint = 'Drag and drop your file here, or click to browse',
  bucket = 'images',
  folderPath = 'uploads',
  className = ''
}: UploadZoneProps) {
  const effectiveMaxBytes = maxSizeBytes || maxSizeMB * 1024 * 1024;
  const acceptString = Array.isArray(accept) ? accept.join(',') : accept;
  const displayHint = description || hint;
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<boolean>(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    cancelRef.current = false;
    setLastFile(file);

    // Client-side file size validation
    if (file.size > effectiveMaxBytes) {
      const msg = `File size (${formatSize(file.size)}) exceeds maximum limit of ${formatSize(effectiveMaxBytes)}.`;
      setError(msg);
      if (onUploadError) onUploadError(msg);
      return;
    }

    setUploading(true);
    setProgress(10);

    // Simulate steady visual upload progress interval
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      let resultUrl = '';
      let resultErr: Error | null = null;

      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
        const res = await uploadAudioFile(file, file.name);
        resultUrl = res.url;
        resultErr = res.error;
      } else {
        const typeCategory = file.type.startsWith('application/pdf') || file.name.endsWith('.pdf') ? 'pdfs' : 'images';
        const res = await uploadMedia(file, typeCategory);
        resultUrl = res.url;
        resultErr = res.error;
      }

      clearInterval(progressInterval);

      if (cancelRef.current) {
        setUploading(false);
        setProgress(0);
        return;
      }

      if (resultErr || !resultUrl) {
        const errMsg = resultErr?.message || 'Failed to upload file to Supabase storage.';
        setError(errMsg);
        if (onUploadError) onUploadError(errMsg);
        setUploading(false);
        setProgress(0);
      } else {
        setProgress(100);
        setSuccess(true);
        setUploading(false);
        onUploadSuccess(resultUrl, file);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
      const errMsg = err?.message || 'Network exception during file upload.';
      setError(errMsg);
      if (onUploadError) onUploadError(errMsg);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setUploading(false);
    setProgress(0);
    setError('Upload cancelled by user.');
  };

  const handleRetry = () => {
    if (lastFile) {
      processFile(lastFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const renderIcon = () => {
    if (fileType === 'image') return <ImageIcon className="w-6 h-6 text-heritage-terracotta" />;
    if (fileType === 'video') return <Video className="w-6 h-6 text-sky-500" />;
    if (fileType === 'audio') return <Music className="w-6 h-6 text-amber-500" />;
    if (fileType === 'document') return <FileText className="w-6 h-6 text-emerald-500" />;
    return <Upload className="w-6 h-6 text-heritage-terracotta" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* State A: File Already Uploaded */}
      {value && !uploading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 overflow-hidden w-full">
            {value.match(/\.(jpeg|jpg|gif|png|webp)/i) || fileType === 'image' ? (
              <img
                src={value}
                alt="Uploaded preview"
                className="w-14 h-14 object-cover rounded-xl border border-stone-200 dark:border-slate-800 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                {renderIcon()}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">File Ready & Uploaded</span>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{value}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReplace}
              className="px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* State B: Uploading in Progress */}
      {uploading && (
        <div className="rounded-2xl border border-heritage-terracotta/30 bg-stone-50 dark:bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2 text-heritage-brown dark:text-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-heritage-terracotta" />
              <span>Uploading {lastFile?.name || 'file'}...</span>
            </div>
            <span className="text-heritage-terracotta font-mono text-sm">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-heritage-terracotta"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{lastFile ? formatSize(lastFile.size) : ''}</span>
            <button
              type="button"
              onClick={handleCancel}
              className="text-rose-500 hover:underline font-bold cursor-pointer"
            >
              Cancel Upload
            </button>
          </div>
        </div>
      )}

      {/* State C: Drag and Drop Dropzone */}
      {!value && !uploading && (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-heritage-terracotta bg-heritage-terracotta/10 scale-[1.01]'
                : 'border-heritage-brown/20 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/40 hover:border-heritage-terracotta/50 hover:bg-stone-50'
            }`}
          >
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              {renderIcon()}
            </div>
            <div>
              <p className="text-xs font-bold text-heritage-brown dark:text-slate-200">
                {displayHint}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Formats: {acceptString.replace(/\*/g, '')} (Max {formatSize(effectiveMaxBytes)})
              </p>
            </div>
          </div>

          {/* Error Banner & Retry */}
          {error && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-2.5 py-1 text-[10px] font-bold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadZone;
