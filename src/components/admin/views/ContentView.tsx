import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileText, 
  Calendar, 
  User, 
  Eye, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { getContributions, updateContributionStatus, addGalleryImage, Contribution } from '../../../lib/supabase';
import ArticlesManager from '../ArticlesManager';

export default function ContentView() {
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'submissions'>('articles');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoadingContribs, setIsLoadingContribs] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab === 'submissions') {
      loadContributions();
    }
  }, [activeSubTab]);

  async function loadContributions() {
    setIsLoadingContribs(true);
    try {
      const data = await getContributions();
      setContributions(data);
    } catch (err) {
      console.error('Failed to load community submissions:', err);
    } finally {
      setIsLoadingContribs(false);
    }
  }

  async function handleReview(contrib: Contribution, action: 'approved' | 'rejected') {
    setReviewingId(contrib.id);
    try {
      const { success, error } = await updateContributionStatus(contrib.id, action);
      if (error) throw error;

      if (action === 'approved') {
        // Automatically publish approved submissions to the digital archive gallery
        await addGalleryImage(
          contrib.title,
          contrib.imageUrl,
          contrib.description,
          contrib.type === 'photo' ? 'History' : 'Tradition'
        );
        alert('Contribution successfully vetted and dynamically published into the digital gallery!');
      } else {
        alert('Contribution has been rejected.');
      }
      
      // Reload queue
      loadContributions();
    } catch (err: any) {
      console.error('Vetting action failed:', err);
      alert('Vetting failed. Try checking your network connection.');
    } finally {
      setReviewingId(null);
    }
  }

  const pendingCount = contributions.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6 text-left">
      {/* Tab Switch Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'articles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            Repository Publications
          </button>
          
          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <span>Community Submissions</span>
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conditional Rendering */}
      {activeSubTab === 'articles' ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs p-1">
          <ArticlesManager />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submissions Header */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Moderation & Vetting Queue</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
              Audit submitted historical objects, photographs, and oral lineage records before publishing them to the public archive.
            </p>
          </div>

          {isLoadingContribs ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Loading vetting queue...</span>
            </div>
          ) : contributions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-center py-20 rounded-3xl space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Queue is Clear</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                No cultural artifacts are currently pending review. New public contributions will appear here dynamically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributions.map((item) => {
                const isPending = item.status === 'pending';
                const statusColors = {
                  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
                  rejected: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
                  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                };

                return (
                  <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col h-full hover:shadow-md transition-shadow">
                    {/* Item Image */}
                    <div className="aspect-video relative bg-slate-150 dark:bg-slate-900 overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <span>{item.type}</span>
                          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now'}</span>
                        </div>
                        <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
                          "{item.description}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40 space-y-3 mt-auto">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate" title={item.userEmail}>Contributor: {item.userEmail}</span>
                        </div>

                        {isPending && (
                          <div className="flex gap-2.5">
                            {reviewingId === item.id ? (
                              <div className="w-full py-2 flex justify-center items-center">
                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleReview(item, 'approved')}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 border border-emerald-500/15 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReview(item, 'rejected')}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/15 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
