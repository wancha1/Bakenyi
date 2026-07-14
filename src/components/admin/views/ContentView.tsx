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
  ArrowUpRight,
  Shield,
  Layers,
  Users,
  Award,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileDown,
  Archive,
  Image as ImageIcon
} from 'lucide-react';
import { 
  getContributions, 
  updateContributionStatus, 
  addGalleryImage, 
  getGalleryImages,
  updateGalleryImageStatus,
  GalleryImage,
  Contribution,
  getClans,
  createClan,
  updateClan,
  deleteClan,
  Clan,
  getLeaders,
  createLeader,
  updateLeader,
  deleteLeader,
  Leader,
  getStoryCategories,
  saveStoryCategory,
  StoryCategory
} from '../../../lib/supabase';
import ArticlesManager from '../ArticlesManager';
import HeritageModulesManager from './HeritageModulesManager';

interface ContentViewProps {
  userRole?: 'super_admin' | 'admin' | 'historian' | 'community_leader' | 'reporter' | 'member' | 'public' | 'staff' | 'customer';
}

export default function ContentView({ userRole = 'admin' }: ContentViewProps) {
  const resolvedRole = 
    userRole === 'staff' ? 'reporter' : 
    userRole === 'customer' ? 'public' : 
    userRole === 'member' ? 'public' :
    userRole;

  const isElder = resolvedRole === 'super_admin';
  const isAdmin = resolvedRole === 'admin' || resolvedRole === 'community_leader' || resolvedRole === 'super_admin';

  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'submissions' | 'clans' | 'leadership' | 'categories' | 'heritage_modules'>('articles');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoadingContribs, setIsLoadingContribs] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Gallery Submissions States
  const [vettingTab, setVettingTab] = useState<'submissions' | 'gallery'>('submissions');
  const [pendingGalleryImages, setPendingGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Clans States
  const [clans, setClans] = useState<Clan[]>([]);
  const [isLoadingClans, setIsLoadingClans] = useState(false);
  const [isSavingClan, setIsSavingClan] = useState(false);
  const [editingClan, setEditingClan] = useState<Clan | null>(null);
  const [showClanForm, setShowClanForm] = useState(false);
  const [clanForm, setClanForm] = useState<Omit<Clan, 'id'>>({
    name: '',
    totem: '',
    motto: '',
    desc: '',
    status: 'pending',
    history: '',
    origin: '',
    leadership: '',
    custodian: '',
    gallery_urls: [],
    document_urls: []
  });

  // Leadership States
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [isSavingLeader, setIsSavingLeader] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [leaderForm, setLeaderForm] = useState<Omit<Leader, 'id'>>({
    name: '',
    role: '',
    bio: '',
    photo_url: '',
    expertise: '',
    clan: '',
    contact_email: '',
    status: 'pending'
  });

  // Category States
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoryCategory | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState<StoryCategory>({
    id: '',
    name: '',
    description: '',
    fields: [],
    validation_rules: '',
    upload_requirements: '',
    is_archived: false
  });
  const [newField, setNewField] = useState('');

  useEffect(() => {
    if (activeSubTab === 'submissions') {
      loadContributions();
      loadPendingGallery();
    } else if (activeSubTab === 'clans') {
      loadClans();
    } else if (activeSubTab === 'leadership') {
      loadLeaders();
    } else if (activeSubTab === 'categories') {
      loadCategories();
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

  async function loadPendingGallery() {
    setIsLoadingGallery(true);
    try {
      const allImages = await getGalleryImages(true); // include pending!
      const pendingOnly = allImages.filter(img => img.status === 'pending');
      setPendingGalleryImages(pendingOnly);
    } catch (err) {
      console.error('Failed to load pending gallery images:', err);
    } finally {
      setIsLoadingGallery(false);
    }
  }

  async function handleReview(contrib: Contribution, action: 'approved' | 'rejected') {
    setReviewingId(contrib.id);
    try {
      const { success, error } = await updateContributionStatus(contrib.id, action);
      if (error) throw error;

      if (action === 'approved') {
        await addGalleryImage(
          contrib.title,
          contrib.imageUrl,
          contrib.description,
          contrib.type === 'photo' ? 'History' : 'Tradition',
          'approved'
        );
        alert('Contribution successfully vetted and dynamically published into the digital gallery!');
      } else {
        alert('Contribution has been rejected.');
      }
      loadContributions();
    } catch (err: any) {
      console.error('Vetting action failed:', err);
      alert('Vetting failed.');
    } finally {
      setReviewingId(null);
    }
  }

  async function handleGalleryReview(imgId: string, action: 'approved' | 'rejected') {
    setReviewingId(imgId);
    try {
      const { success, error } = await updateGalleryImageStatus(imgId, action);
      if (error) throw error;
      alert(`Gallery photo has been ${action === 'approved' ? 'approved & published!' : 'rejected.'}`);
      loadPendingGallery();
    } catch (err: any) {
      console.error('Gallery review failed:', err);
      alert('Action failed.');
    } finally {
      setReviewingId(null);
    }
  }

  // ==========================================
  // CLANS ADMIN HANDLERS
  // ==========================================
  async function loadClans() {
    setIsLoadingClans(true);
    try {
      const data = await getClans(false); // get all including pending/archived
      setClans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingClans(false);
    }
  }

  const handleClanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClan(true);
    try {
      if (editingClan) {
        const success = await updateClan(editingClan.id, clanForm);
        if (success) {
          alert('Clan updated successfully!');
        } else {
          throw new Error('Failed to update clan');
        }
      } else {
        const payload = {
          ...clanForm,
          status: isElder ? 'approved' : 'pending'
        };
        const { data, error } = await createClan(payload);
        if (error) throw error;
        alert(isElder ? 'New Clan registered and published successfully!' : 'New Clan registered successfully! Pending Elder Council approval.');
      }
      setShowClanForm(false);
      setEditingClan(null);
      resetClanForm();
      loadClans();
    } catch (err: any) {
      alert(err.message || 'Failed to save clan.');
    } finally {
      setIsSavingClan(false);
    }
  };

  const handleEditClanClick = (clan: Clan) => {
    setEditingClan(clan);
    setClanForm({
      name: clan.name,
      totem: clan.totem,
      motto: clan.motto || '',
      desc: clan.desc || '',
      status: clan.status || 'pending',
      history: clan.history || '',
      origin: clan.origin || '',
      leadership: clan.leadership || '',
      custodian: clan.custodian || '',
      gallery_urls: clan.gallery_urls || [],
      document_urls: clan.document_urls || []
    });
    setShowClanForm(true);
  };

  const handleDeleteClanClick = async (clanId: string) => {
    if (!window.confirm('Are you sure you want to delete this clan?')) return;
    try {
      const success = await deleteClan(clanId);
      if (success) {
        alert('Clan deleted successfully!');
        loadClans();
      }
    } catch (e) {
      alert('Failed to delete clan.');
    }
  };

  const handleUpdateClanStatus = async (clanId: string, status: 'approved' | 'rejected' | 'archived') => {
    if (!isElder && (status === 'approved' || status === 'rejected')) {
      alert('Only Elder Council members can approve or reject community clans.');
      return;
    }
    try {
      const success = await updateClan(clanId, { status });
      if (success) {
        alert(`Clan status updated to: ${status}`);
        loadClans();
      }
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  const resetClanForm = () => {
    setClanForm({
      name: '',
      totem: '',
      motto: '',
      desc: '',
      status: 'pending',
      history: '',
      origin: '',
      leadership: '',
      custodian: '',
      gallery_urls: [],
      document_urls: []
    });
  };

  // ==========================================
  // LEADERS ADMIN HANDLERS
  // ==========================================
  async function loadLeaders() {
    setIsLoadingLeaders(true);
    try {
      const data = await getLeaders(false); // get all including pending
      setLeaders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLeaders(false);
    }
  }

  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLeader(true);
    try {
      if (editingLeader) {
        const success = await updateLeader(editingLeader.id, leaderForm);
        if (success) {
          alert('Leader updated successfully!');
        } else {
          throw new Error('Failed to update leader');
        }
      } else {
        const payload = {
          ...leaderForm,
          status: (isAdmin || isElder) ? 'approved' : 'pending'
        };
        const { data, error } = await createLeader(payload);
        if (error) throw error;
        alert((isAdmin || isElder) ? 'New Leader/Elder registered and published successfully!' : 'New Leader/Elder registered successfully! Pending approval.');
      }
      setShowLeaderForm(false);
      setEditingLeader(null);
      resetLeaderForm();
      loadLeaders();
    } catch (err: any) {
      alert(err.message || 'Failed to save leader.');
    } finally {
      setIsSavingLeader(false);
    }
  };

  const handleEditLeaderClick = (leader: Leader) => {
    setEditingLeader(leader);
    setLeaderForm({
      name: leader.name,
      role: leader.role,
      bio: leader.bio,
      photo_url: leader.photo_url || '',
      expertise: leader.expertise || '',
      clan: leader.clan || '',
      contact_email: leader.contact_email || '',
      status: leader.status || 'pending'
    });
    setShowLeaderForm(true);
  };

  const handleDeleteLeaderClick = async (leaderId: string) => {
    if (!window.confirm('Are you sure you want to delete this leader/elder record?')) return;
    try {
      const success = await deleteLeader(leaderId);
      if (success) {
        alert('Leader deleted successfully!');
        loadLeaders();
      }
    } catch (e) {
      alert('Failed to delete leader.');
    }
  };

  const handleUpdateLeaderStatus = async (leaderId: string, status: 'approved' | 'rejected') => {
    try {
      const success = await updateLeader(leaderId, { status });
      if (success) {
        alert(`Leader status updated to: ${status}`);
        loadLeaders();
      }
    } catch (e) {
      alert('Failed to update leader status.');
    }
  };

  const resetLeaderForm = () => {
    setLeaderForm({
      name: '',
      role: '',
      bio: '',
      photo_url: '',
      expertise: '',
      clan: '',
      contact_email: '',
      status: 'pending'
    });
  };

  // ==========================================
  // CATEGORIES ADMIN HANDLERS
  // ==========================================
  async function loadCategories() {
    setIsLoadingCategories(true);
    try {
      const data = await getStoryCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCategories(false);
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id) {
      categoryForm.id = categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    try {
      const success = await saveStoryCategory(categoryForm);
      if (success) {
        alert('Story category saved successfully!');
        setShowCategoryForm(false);
        setEditingCategory(null);
        resetCategoryForm();
        loadCategories();
      } else {
        alert('Failed to save category.');
      }
    } catch (err) {
      alert('Error saving story category.');
    }
  };

  const handleEditCategoryClick = (cat: StoryCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      fields: cat.fields || [],
      validation_rules: cat.validation_rules || '',
      upload_requirements: cat.upload_requirements || '',
      is_archived: cat.is_archived || false
    });
    setShowCategoryForm(true);
  };

  const handleAddField = () => {
    if (!newField.trim()) return;
    setCategoryForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField.trim()]
    }));
    setNewField('');
  };

  const handleRemoveField = (fieldIndex: number) => {
    setCategoryForm(prev => ({
      ...prev,
      fields: (prev.fields || []).filter((_, i) => i !== fieldIndex)
    }));
  };

  const handleArchiveCategoryClick = async (cat: StoryCategory, archiveState: boolean) => {
    try {
      const success = await saveStoryCategory({ ...cat, is_archived: archiveState });
      if (success) {
        alert(`Category ${archiveState ? 'archived' : 'unarchived'} successfully!`);
        loadCategories();
      }
    } catch (e) {
      alert('Failed to update archive status.');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      id: '',
      name: '',
      description: '',
      fields: [],
      validation_rules: '',
      upload_requirements: '',
      is_archived: false
    });
    setNewField('');
  };

  const pendingCount = contributions.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6 text-left">
      {/* Tab Switch Controls */}
      <div className="flex flex-wrap items-center bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs gap-2">
        <button
          onClick={() => setActiveSubTab('articles')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'articles'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Publications
        </button>
        
        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'submissions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          <span>Vetting Queue</span>
          {pendingCount > 0 && (
            <span className="bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('clans')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'clans'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Clans</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leadership')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'leadership'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Elders & Leaders</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Story Categories</span>
        </button>

        <button
          onClick={() => setActiveSubTab('heritage_modules')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'heritage_modules'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Heritage Feeds</span>
        </button>
      </div>

      {/* Publications view */}
      {activeSubTab === 'articles' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs p-1">
          <ArticlesManager userRole={userRole} />
        </div>
      )}

      {/* Submissions queue */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Moderation & Vetting Queue</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
                Audit and vet community-submitted historical items, lineage stories, oral recordings, and public gallery photos.
              </p>
            </div>

            {/* Sub-selector tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-150 dark:border-slate-700 max-w-xs self-start">
              <button
                onClick={() => setVettingTab('submissions')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  vettingTab === 'submissions'
                    ? 'bg-white dark:bg-slate-650 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                Oral Histories ({contributions.filter(c => c.status === 'pending').length})
              </button>
              <button
                onClick={() => setVettingTab('gallery')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  vettingTab === 'gallery'
                    ? 'bg-white dark:bg-slate-650 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                Gallery Uploads ({pendingGalleryImages.length})
              </button>
            </div>
          </div>

          {vettingTab === 'submissions' ? (
            isLoadingContribs ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Loading vetting queue...</span>
              </div>
            ) : contributions.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-center py-20 rounded-3xl space-y-3">
                <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Queue is Clear</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  No oral ancestry records or artifacts are currently pending review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {contributions.map((item) => {
                  const isPending = item.status === 'pending';
                  const statusColors = {
                    approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
                    rejected: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
                    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                  };

                  const isAudio = item.type === 'audio' || (item.imageUrl && (item.imageUrl.startsWith('data:audio/') || item.imageUrl.endsWith('.webm') || item.imageUrl.endsWith('.mp3') || item.imageUrl.endsWith('.wav')));

                  return (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col h-full hover:shadow-md transition-shadow">
                      <div className="aspect-video relative bg-slate-150 dark:bg-slate-900 overflow-hidden flex items-center justify-center p-4">
                        {isAudio ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 gap-3 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 animate-pulse">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </div>
                            <audio src={item.imageUrl} controls className="w-full max-w-[240px] h-8" />
                          </div>
                        ) : (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute top-4 left-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${statusColors[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

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
                            <span className="truncate">Contributor: {item.userEmail}</span>
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
            )
          ) : (
            isLoadingGallery ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Loading gallery queue...</span>
              </div>
            ) : pendingGalleryImages.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-center py-20 rounded-3xl space-y-3">
                <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Gallery Photos Pending</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  All direct gallery uploads are approved and publicly published.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {pendingGalleryImages.map((img) => (
                  <div key={img.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col h-full hover:shadow-md transition-shadow text-left">
                    <div className="aspect-video relative bg-slate-150 dark:bg-slate-900 overflow-hidden">
                      <img 
                        src={img.imageUrl} 
                        alt={img.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/25">
                          PENDING VETTING
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <span>Category: {img.category}</span>
                          <span>Gallery Photo</span>
                        </div>
                        <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white leading-snug">{img.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
                          "{img.description || 'No description provided.'}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40 space-y-3 mt-auto">
                        <div className="flex gap-2.5">
                          {reviewingId === img.id ? (
                            <div className="w-full py-2 flex justify-center items-center">
                              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleGalleryReview(img.id, 'approved')}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 border border-emerald-500/15 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve Photo</span>
                              </button>
                              <button
                                onClick={() => handleGalleryReview(img.id, 'rejected')}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/15 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Clans Management Tab */}
      {activeSubTab === 'clans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Clan Register & Custodians</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
                Review, edit, and approve community clan records, assign custodians, and link digital documents.
              </p>
            </div>
            <button 
              onClick={() => {
                resetClanForm();
                setEditingClan(null);
                setShowClanForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Clan</span>
            </button>
          </div>

          {showClanForm && (
            <form onSubmit={handleClanSubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                {editingClan ? 'Edit Clan Record' : 'Register New Clan'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clan Name</label>
                  <input 
                    required
                    type="text"
                    value={clanForm.name}
                    onChange={e => setClanForm({...clanForm, name: e.target.value})}
                    placeholder="e.g. Abakenye"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Totem / Emblem</label>
                  <input 
                    required
                    type="text"
                    value={clanForm.totem}
                    onChange={e => setClanForm({...clanForm, totem: e.target.value})}
                    placeholder="e.g. Enkejje (Fish)"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Motto</label>
                  <input 
                    type="text"
                    value={clanForm.motto}
                    onChange={e => setClanForm({...clanForm, motto: e.target.value})}
                    placeholder="Ancestral saying..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custodian (Leader / Elder Assigned)</label>
                  <input 
                    type="text"
                    value={clanForm.custodian}
                    onChange={e => setClanForm({...clanForm, custodian: e.target.value})}
                    placeholder="Name of custodian elder"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clan Origins & Geographic Settlement Location</label>
                <input 
                  type="text"
                  value={clanForm.origin}
                  onChange={e => setClanForm({...clanForm, origin: e.target.value})}
                  placeholder="e.g. Pallisa Region, Kyoga Shoreline"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea 
                  rows={2}
                  value={clanForm.desc}
                  onChange={e => setClanForm({...clanForm, desc: e.target.value})}
                  placeholder="General descriptive summary of the clan..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detailed Ancestral History & Timeline</label>
                <textarea 
                  rows={4}
                  value={clanForm.history}
                  onChange={e => setClanForm({...clanForm, history: e.target.value})}
                  placeholder="Detailed chronological history..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowClanForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingClan}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingClan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingClan ? 'Saving Clan...' : 'Save Clan'}</span>
                </button>
              </div>
            </form>
          )}

          {isLoadingClans ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Loading clans list...</span>
            </div>
          ) : clans.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border text-center py-20 rounded-3xl p-8">
              <p className="text-slate-500 text-sm font-semibold">No clans registered yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Clan Info</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Totem</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Custodian</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {clans.map((clan) => (
                      <tr key={clan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10">
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{clan.name}</span>
                            {clan.motto && <span className="text-[10px] text-slate-400 font-medium truncate max-w-xs">"{clan.motto}"</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">{clan.totem}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">{clan.custodian || 'None Assigned'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            clan.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            clan.status === 'rejected' ? 'bg-rose-50 text-rose-500 border-rose-500/20' :
                            clan.status === 'archived' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {clan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {clan.status === 'pending' && (
                              isElder ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateClanStatus(clan.id, 'approved')}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-lg text-emerald-600 transition-colors cursor-pointer"
                                    title="Approve Clan"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateClanStatus(clan.id, 'rejected')}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg text-rose-600 transition-colors cursor-pointer"
                                    title="Reject Clan"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/20">
                                  Elder Approval Required
                                </span>
                              )
                            )}
                            {clan.status === 'approved' && (
                              <button 
                                onClick={() => handleUpdateClanStatus(clan.id, 'archived')}
                                className="p-1.5 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                title="Archive Clan"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleEditClanClick(clan)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg text-indigo-600 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClanClick(clan.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg text-rose-600 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leadership / Elders Tab */}
      {activeSubTab === 'leadership' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Cultural Leadership & Councils</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
                Register historical figures, active council elders, leaders of institutions, and their cultural expertise.
              </p>
            </div>
            <button 
              onClick={() => {
                resetLeaderForm();
                setEditingLeader(null);
                setShowLeaderForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Elder</span>
            </button>
          </div>

          {showLeaderForm && (
            <form onSubmit={handleLeaderSubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                {editingLeader ? 'Edit Leader / Elder Record' : 'Register New Elder / Cultural Leader'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Leader Full Name</label>
                  <input 
                    required
                    type="text"
                    value={leaderForm.name}
                    onChange={e => setLeaderForm({...leaderForm, name: e.target.value})}
                    placeholder="e.g. Chief Aaron Wancha"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Official Title / Role</label>
                  <input 
                    required
                    type="text"
                    value={leaderForm.role}
                    onChange={e => setLeaderForm({...leaderForm, role: e.target.value})}
                    placeholder="e.g. Chairman Elders Council"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cultural Expertise</label>
                  <input 
                    type="text"
                    value={leaderForm.expertise}
                    onChange={e => setLeaderForm({...leaderForm, expertise: e.target.value})}
                    placeholder="e.g. Oral Lineage, Canoecraft"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clan Membership</label>
                  <input 
                    type="text"
                    value={leaderForm.clan}
                    onChange={e => setLeaderForm({...leaderForm, clan: e.target.value})}
                    placeholder="e.g. Abakenye"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contact Email (Optional)</label>
                  <input 
                    type="email"
                    value={leaderForm.contact_email}
                    onChange={e => setLeaderForm({...leaderForm, contact_email: e.target.value})}
                    placeholder="leader@bakenyi.org"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Portrait Image URL</label>
                <input 
                  type="url"
                  value={leaderForm.photo_url}
                  onChange={e => setLeaderForm({...leaderForm, photo_url: e.target.value})}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Biography & Oral Contributions</label>
                <textarea 
                  rows={4}
                  required
                  value={leaderForm.bio}
                  onChange={e => setLeaderForm({...leaderForm, bio: e.target.value})}
                  placeholder="Tell their story, achievements, and contributions to the Bakenyi people..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowLeaderForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingLeader}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingLeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingLeader ? 'Saving Elder...' : 'Save Elder'}</span>
                </button>
              </div>
            </form>
          )}

          {isLoadingLeaders ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Loading leaders...</span>
            </div>
          ) : leaders.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border text-center py-20 rounded-3xl p-8">
              <p className="text-slate-500 text-sm font-semibold">No elders or leaders registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leaders.map((leader) => (
                <div key={leader.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 p-6 flex gap-4 hover:shadow-md transition-shadow">
                  <img 
                    src={leader.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} 
                    alt={leader.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border"
                  />
                  <div className="flex-grow flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{leader.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          leader.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          leader.status === 'rejected' ? 'bg-rose-50 text-red-500 border-red-500/20' :
                          'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {leader.status}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{leader.role}</p>
                      {leader.clan && <p className="text-[10px] text-slate-400 font-medium mt-1">Clan: {leader.clan}</p>}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{leader.bio}</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/40 mt-3">
                      {leader.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateLeaderStatus(leader.id, 'approved')}
                            className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-lg text-emerald-600 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateLeaderStatus(leader.id, 'rejected')}
                            className="p-1 px-2.5 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg text-rose-600 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleEditLeaderClick(leader)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit elder details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLeaderClick(leader.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete elder details"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Story Categories Tab */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Story Categories Setup</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
                Customize, expand, and structure story submission categories. Adjusting categories reconfigures active input forms dynamically.
              </p>
            </div>
            <button 
              onClick={() => {
                resetCategoryForm();
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
          </div>

          {showCategoryForm && (
            <form onSubmit={handleCategorySubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">
                {editingCategory ? 'Edit Story Category' : 'Create New Story Category'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category Name</label>
                  <input 
                    required
                    type="text"
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                    placeholder="e.g. Clan Traditions & Crafts"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System ID Slug (Auto-generated if left blank)</label>
                  <input 
                    type="text"
                    disabled={!!editingCategory}
                    value={categoryForm.id}
                    onChange={e => setCategoryForm({...categoryForm, id: e.target.value})}
                    placeholder="e.g. crafts-lore"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Short Description</label>
                <input 
                  required
                  type="text"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="e.g. Focuses on the ancestral fishing, sailing and weaving technologies..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Required Vetting Rules</label>
                  <input 
                    type="text"
                    value={categoryForm.validation_rules}
                    onChange={e => setCategoryForm({...categoryForm, validation_rules: e.target.value})}
                    placeholder="e.g. Captures accurate dates and elder witness signatures."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attachment Requirements</label>
                  <input 
                    type="text"
                    value={categoryForm.upload_requirements}
                    onChange={e => setCategoryForm({...categoryForm, upload_requirements: e.target.value})}
                    placeholder="e.g. Scans of lineage paper records, or photo proof of artifacts."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dynamic Input Fields for Submission Form</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newField}
                    onChange={e => setNewField(e.target.value)}
                    placeholder="e.g. Fishing Tool Name"
                    className="flex-grow px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                  <button 
                    type="button"
                    onClick={handleAddField}
                    className="px-4 py-2 bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-700 dark:hover:bg-indigo-600 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Add Field
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  {(categoryForm.fields || []).map((field, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-950/40">
                      <span>{field}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveField(idx)}
                        className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950 rounded-full p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {(categoryForm.fields || []).length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">No custom fields defined yet. Standard description will be used.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          )}

          {isLoadingCategories ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Loading categories...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 p-6 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-serif font-bold text-lg text-slate-900 dark:text-white">{cat.name}</h4>
                      {cat.is_archived && (
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">{cat.description}</p>
                    
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-700/40 pt-4 text-xs font-medium">
                      {cat.fields && cat.fields.length > 0 && (
                        <div>
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Active Capture Fields</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {cat.fields.map((f, i) => (
                              <span key={i} className="bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded text-[10px] border dark:border-slate-750 font-mono text-slate-600 dark:text-slate-300">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {cat.validation_rules && (
                        <div className="pt-2">
                          <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Vetting Criteria</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">"{cat.validation_rules}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/40 mt-6">
                    <button 
                      onClick={() => handleArchiveCategoryClick(cat, !cat.is_archived)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        cat.is_archived 
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-150' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {cat.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button 
                      onClick={() => handleEditCategoryClick(cat)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'heritage_modules' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-xs">
          <HeritageModulesManager userRole={resolvedRole} />
        </div>
      )}
    </div>
  );
}
