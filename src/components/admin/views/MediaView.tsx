import React, { useEffect, useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Copy, 
  Search, 
  Loader2, 
  File, 
  Check, 
  ExternalLink,
  HardDrive,
  CheckCircle,
  XCircle,
  Eye,
  ShieldCheck,
  Globe,
  Lock,
  X
} from 'lucide-react';
import { fetchMediaFiles, uploadMediaFile, updateMediaStatus, deleteMediaFile, MediaFile } from '../../../lib/supabaseClient';
import { logAdminActivity } from '../../../lib/operations';

export default function MediaView() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Workflow Tab: 'pending' (Vetting Workspace) or 'approved' (Public Library)
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved'>('pending');
  // Interactive preview workstation target
  const [reviewingFile, setReviewingFile] = useState<MediaFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, search, activeSubTab]);

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

  function filterFiles() {
    let result = files.filter(f => f.status === activeSubTab);
    
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(query));
    }
    
    setFilteredFiles(result);
  }

  // Handle Drag & Drop Upload
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
    const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) as File[] : [];
    if (droppedFiles.length > 0) {
      await uploadMultipleFiles(droppedFiles);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files ? Array.from(e.target.files) as File[] : [];
    if (selectedFiles.length === 0) return;
    await uploadMultipleFiles(selectedFiles);
  }

  async function uploadMultipleFiles(fileList: File[]) {
    const validFiles = fileList.filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Only image assets (JPEG, PNG, WebP) are supported in this workflow.');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;

    for (const file of validFiles) {
      try {
        const uploaded = await uploadMediaFile(file);
        setFiles(prev => [uploaded, ...prev]);
        
        // Write action log
        logAdminActivity(
          'Staff Editor',
          'Media Private Upload',
          `Uploaded raw cultural asset file: "${file.name}". Asset placed in pending vetting queue.`,
          'Media',
          'Success',
          uploaded.name
        );
        successCount++;
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        failedCount++;
      }
    }

    setIsUploading(false);
    if (failedCount > 0) {
      alert(`Bulk upload complete: ${successCount} successful, ${failedCount} failed.`);
    } else {
      alert(`Successfully uploaded ${successCount} asset(s) in bulk. They are locked as private until approved by an Elder.`);
    }
  }

  // Workflow: Approve Media
  async function handleApproveMedia(file: MediaFile) {
    try {
      const updated = await updateMediaStatus(file.name, 'approved');
      if (updated) {
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'approved' } : f));
        
        logAdminActivity(
          'Elder',
          'Media Asset Approved',
          `Vetted and released file "${file.name}" to the public media library.`,
          'Media',
          'Success',
          file.name
        );
        
        alert(`Media asset "${file.name}" has been approved and is now publicly visible!`);
      }
      setReviewingFile(null);
    } catch (err) {
      console.error('Failed to approve media:', err);
    }
  }

  // Workflow: Reject & Purge Media
  async function handleRejectMedia(file: MediaFile) {
    if (window.confirm(`Are you sure you want to REJECT and permanently delete the raw upload "${file.name}"?`)) {
      try {
        await updateMediaStatus(file.name, 'rejected');
        setFiles(prev => prev.filter(f => f.name !== file.name));
        
        logAdminActivity(
          'Elder',
          'Media Asset Rejected',
          `Rejected and deleted private raw media upload: "${file.name}".`,
          'Media',
          'Warning',
          file.name
        );
        
        alert(`Media asset "${file.name}" has been rejected and purged from private storage.`);
        setReviewingFile(null);
      } catch (err) {
        console.error('Failed to reject media:', err);
      }
    }
  }

  // Handle direct deletion of approved media
  async function handleDeleteApproved(name: string) {
    if (window.confirm('Are you sure you want to permanently delete this approved asset? This will break content referencing its public URL.')) {
      try {
        await deleteMediaFile(name);
        setFiles(prev => prev.filter(f => f.name !== name));
        
        logAdminActivity(
          'Elder',
          'Media Asset Deleted',
          `Permanently deleted public media library file "${name}".`,
          'Media',
          'Warning',
          name
        );
      } catch (err) {
        console.error('Delete media failed:', err);
      }
    }
  }

  // Copy Link utility
  function copyToClipboard(url: string, index: number) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }

  function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-500" />
            <span>Operational Media Hub</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Preview private uploads, vet digital heritage imagery, and release approved assets to the archive.
          </p>
        </div>

        {/* Live Storage Statistics */}
        <div className="flex items-center gap-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700 p-2 rounded-2xl">
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
            <span className="block text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-sans">Vetting Queue</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-sans">{pendingCount} Files</span>
          </div>
          <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
            <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-sans">Storage Space</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-sans">
              {formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Workflow Sub-tabs */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveSubTab('pending'); setReviewingFile(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <span>Media Vetting Workspace</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveSubTab('approved'); setReviewingFile(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'approved'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            Public Asset Registry
          </button>
        </div>
      </div>

      {/* Sub-grid: Workspace & Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Upload Zone + Asset Grid */}
        <div className={`${reviewingFile && activeSubTab === 'pending' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
          
          {/* Controls: Drag Drop upload and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Upload block */}
            <div className="md:col-span-1">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all select-none ${
                  dragOver 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                />
                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Uploading Asset...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 text-indigo-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Drag & drop raw file(s)</p>
                    <p className="text-[9px] text-slate-400">or browse local disk (supports multi-select)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Storage description and search */}
            <div className="md:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">
                  {activeSubTab === 'pending' ? '🔒 PRIVATE INBOX' : '🌐 PUBLIC DIRECTORY'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  {activeSubTab === 'pending' 
                    ? 'Newly uploaded files are stored privately. They are only viewable here and cannot be accessed via public links until reviewed and approved.'
                    : 'Approved files are publicly hosted on the CDN network. Copy and paste links directly into article content templates.'}
                </p>
              </div>

              {/* Quick search input */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets by filename..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-805 dark:text-slate-200"
                />
              </div>
            </div>

          </div>

          {/* Asset grid cards */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-48 space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading storage grid...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto opacity-40 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {activeSubTab === 'pending' ? 'Vetting queue is empty' : 'No public files found'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                  {activeSubTab === 'pending' 
                    ? 'No private media uploads are awaiting validation. Newly uploaded images will arrive here.'
                    : 'Browse folders, drag files, or use the uploader to import public images.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map((file, idx) => {
                  const isCopied = copiedIndex === idx;

                  return (
                    <div key={idx} className="group bg-slate-50 dark:bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-750/30 flex flex-col justify-between relative transition-all hover:shadow-sm">
                      
                      {/* Thumbnail with overlay triggers */}
                      <div className="aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Status tag */}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                            file.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          }`}>
                            {file.status === 'pending' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                            <span>{file.status}</span>
                          </span>
                        </div>

                        {/* Interactive triggers overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          {activeSubTab === 'pending' ? (
                            <button
                              onClick={() => setReviewingFile(file)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => copyToClipboard(file.url, idx)}
                                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                                  isCopied ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-slate-100 text-slate-800'
                                }`}
                                title={isCopied ? 'Copied link!' : 'Copy Asset CDN URL'}
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 transition-colors"
                                title="Open in new window"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => handleDeleteApproved(file.name)}
                                className="p-2 rounded-lg bg-white hover:bg-rose-500 text-rose-600 hover:text-white transition-colors cursor-pointer"
                                title="Delete media asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Text details */}
                      <div className="p-3 space-y-0.5 text-left bg-white dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-300 truncate font-sans" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono">
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

        {/* Right Hand: Active Vetting Workstation panel */}
        {reviewingFile && activeSubTab === 'pending' && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-md h-fit space-y-5 animate-fade-in text-left">
            
            {/* Vetting Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 rounded-md text-[9px] font-black uppercase tracking-wider font-sans">
                  Media Vetting Queue
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                  Artifact Photo Inspector
                </h3>
              </div>
              
              <button
                onClick={() => setReviewingFile(null)}
                className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Immersive high resolution preview frame */}
            <div className="aspect-square bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-250 dark:border-slate-800 relative">
              <img 
                src={reviewingFile.url} 
                alt={reviewingFile.name} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Attributes List */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-750/30 text-[11px] font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">File Identifier:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono truncate max-w-[180px]" title={reviewingFile.name}>
                  {reviewingFile.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asset File Size:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {formatBytes(reviewingFile.size)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Upload Date:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {new Date(reviewingFile.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security Rule:</span>
                <span className="text-rose-500 font-black uppercase text-[9px] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Private raw asset</span>
                </span>
              </div>
            </div>

            {/* Informational advice */}
            <div className="flex gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 rounded-xl text-[10px] leading-relaxed text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
              <p>
                <strong>Vetting Advice:</strong> Check resolution, examine metadata compatibility, and ensure the image contains no copyright violations before publishing it.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
              <button
                type="button"
                onClick={() => handleApproveMedia(reviewingFile)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/15"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Release to Public</span>
              </button>

              <button
                type="button"
                onClick={() => handleRejectMedia(reviewingFile)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject & Delete Upload</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
