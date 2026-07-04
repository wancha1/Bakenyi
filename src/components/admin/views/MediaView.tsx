import React, { useEffect, useState, useRef } from 'react';
import { 
  Image, 
  Upload, 
  Trash2, 
  Copy, 
  Search, 
  Loader2, 
  File, 
  Check, 
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { fetchMediaFiles, uploadMediaFile, deleteMediaFile, MediaFile } from '../../../lib/supabaseClient';

export default function MediaView() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const query = search.toLowerCase();
      setFilteredFiles(files.filter(f => f.name.toLowerCase().includes(query)));
    } else {
      setFilteredFiles(files);
    }
  }, [files, search]);

  async function loadFiles() {
    setIsLoading(true);
    try {
      const data = await fetchMediaFiles();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Manual Upload Selection
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    await uploadSingleFile(selectedFiles[0]);
  }

  // Drag and Drop Upload Handlers
  const [dragOver, setDragOver] = useState(false);
  
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await uploadSingleFile(droppedFiles[0]);
    }
  }

  async function uploadSingleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Only image files (JPEG, PNG, WebP) are supported in this dashboard.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadMediaFile(file);
      setFiles(prev => [uploaded, ...prev]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  }

  // Handle Deletion
  async function handleDelete(name: string) {
    if (window.confirm('Are you sure you want to delete this media file permanently?')) {
      try {
        await deleteMediaFile(name);
        setFiles(prev => prev.filter(f => f.name !== name));
      } catch (err) {
        console.error('Delete media failed:', err);
      }
    }
  }

  // Copy Link
  function copyToClipboard(url: string, index: number) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }

  // Format File Size
  function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Media Library</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
          Upload and organize assets, photos, logos, and catalog mockups.
        </p>
      </div>

      {/* Grid: Upload Zone and Filter Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all select-none ${
              dragOver 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Uploading asset...</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & drop image here</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">or click to browse local directory</p>
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-500">
                  PNG, JPG, WEBP up to 5MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Media Asset List Info */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Storage Analytics</h3>
            </div>
            
            <div className="space-y-3 font-medium text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Connected bucket:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">"media"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total assets logged:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{files.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage occupied:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Media Grid Cards Area */}
      <div className="bg-slate-50 dark:bg-slate-900/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/40">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading catalog files...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Image className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-semibold">No media files found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file, idx) => {
              const isCopied = copiedIndex === idx;

              return (
                <div key={idx} className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between relative transition-all hover:shadow-md">
                  {/* Image Card Top Box */}
                  <div className="aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating Controls Overlaid on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      {/* Copy Link */}
                      <button
                        onClick={() => copyToClipboard(file.url, idx)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isCopied 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                        title={isCopied ? 'Copied!' : 'Copy Asset Link'}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* View Link */}
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-500 hover:text-white text-rose-500 transition-colors cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata bottom text */}
                  <div className="p-2 space-y-1 text-left bg-white dark:bg-slate-800">
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate font-sans" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
