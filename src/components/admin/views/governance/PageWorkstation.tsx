import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Archive, 
  Check, 
  X, 
  Edit2, 
  Clock, 
  Activity, 
  TrendingUp, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  Image as ImageIcon, 
  Lock, 
  ShieldAlert, 
  Calendar, 
  ArrowUpRight,
  GitCommit,
  BookOpen,
  Eye,
  Settings,
  AlertTriangle,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { ContentItem, GovernancePage, VersionRecord, PageAuditLog } from './types';

interface PageWorkstationProps {
  page: GovernancePage;
  contentItems: ContentItem[];
  onSaveItems: (items: ContentItem[]) => void;
  auditLogs: PageAuditLog[];
  onAddAuditLog: (log: Omit<PageAuditLog, 'id' | 'timestamp'>) => void;
  versions: VersionRecord[];
  onAddVersion: (record: Omit<VersionRecord, 'id' | 'updatedAt'>) => void;
  onRestoreVersion: (version: VersionRecord) => void;
}

export default function PageWorkstation({
  page,
  contentItems,
  onSaveItems,
  auditLogs,
  onAddAuditLog,
  versions,
  onRestoreVersion
}: PageWorkstationProps) {
  const [activeTab, setActiveTab] = useState<'published' | 'pending' | 'create' | 'history' | 'audits' | 'analytics'>('published');
  
  // Search & Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // In-place Editing Form State
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // New Content Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState<'published' | 'draft'>('published');
  const [newExtraFields, setNewExtraFields] = useState<Record<string, string>>({});

  // Reset workstation tab and forms when navigating to a new page window
  useEffect(() => {
    setActiveTab('published');
    setSearchText('');
    setStatusFilter('all');
    setSelectedItemIds([]);
    setEditingItem(null);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
  }, [page.id]);

  // Stats calculation
  const pageItems = useMemo(() => {
    return contentItems.filter(item => item.pageId === page.id);
  }, [contentItems, page.id]);

  const stats = useMemo(() => {
    return {
      total: pageItems.length,
      published: pageItems.filter(i => i.status === 'published').length,
      pending: pageItems.filter(i => i.status === 'pending').length,
      drafts: pageItems.filter(i => i.status === 'draft').length,
      archived: pageItems.filter(i => i.status === 'archived').length,
    };
  }, [pageItems]);

  // Filtered published & drafts list
  const filteredItems = useMemo(() => {
    return pageItems
      .filter(item => item.status !== 'pending')
      .filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        
        const matchText = searchText.toLowerCase();
        return (
          item.title.toLowerCase().includes(matchText) ||
          (item.summary && item.summary.toLowerCase().includes(matchText)) ||
          item.content.toLowerCase().includes(matchText) ||
          item.author.toLowerCase().includes(matchText)
        );
      });
  }, [pageItems, statusFilter, searchText]);

  // Filtered pending submissions
  const pendingItems = useMemo(() => {
    return pageItems.filter(item => item.status === 'pending');
  }, [pageItems]);

  // Page specific Audit Logs
  const pageAudits = useMemo(() => {
    return auditLogs.filter(log => log.pageId === page.id);
  }, [auditLogs, page.id]);

  // Page specific Version records
  const pageVersions = useMemo(() => {
    return versions.filter(ver => ver.pageId === page.id);
  }, [versions, page.id]);

  // Dynamic extra fields template depending on selected page ID
  const extraFieldsTemplate = useMemo(() => {
    if (page.id === 'home-hero') {
      return [
        { key: 'ctaLabel', label: 'Call to Action Button Label', placeholder: 'Explore Chronicles' },
        { key: 'bgUrl', label: 'Background Backdrop Image URL', placeholder: 'https://images.unsplash.com/...' }
      ];
    }
    if (page.id.includes('dictionary')) {
      return [
        { key: 'partOfSpeech', label: 'Part of Speech', placeholder: 'Noun, Verb, Adjective' },
        { key: 'translation', label: 'English Translation', placeholder: 'To row a wooden canoe' },
        { key: 'example', label: 'Lukenye Usage Example', placeholder: 'Usage sentence with Lukenye pronunciation' }
      ];
    }
    if (page.id.includes('proverbs')) {
      return [
        { key: 'translation', label: 'Literal Translation', placeholder: 'The lake is never without waves' },
        { key: 'metaphor', label: 'Metaphorical Meaning & Morals', placeholder: 'Waves represent hardships, boats represent...' }
      ];
    }
    if (page.id.includes('clans')) {
      return [
        { key: 'seat', label: 'Clan Seat / Location', placeholder: 'Paliisa High Seat' },
        { key: 'totem', label: 'Totem Representative', placeholder: 'Crested Crane' },
        { key: 'membersCount', label: 'Estimated Clan Families', placeholder: '1,200 members' }
      ];
    }
    if (page.id.includes('totems')) {
      return [
        { key: 'representedAnimal', label: 'Represented Species', placeholder: 'Balearica regulorum' },
        { key: 'prohibition', label: 'Customary Prohibitions', placeholder: 'Strictly forbidden from eating, harming...' }
      ];
    }
    if (page.id.includes('gallery')) {
      return [
        { key: 'photographer', label: 'Photographer / Recorder Name', placeholder: 'James Nak' },
        { key: 'location', label: 'Location Captured', placeholder: 'Kyoga Shores' }
      ];
    }
    return [
      { key: 'referenceUrl', label: 'Historical Source URL', placeholder: 'Optional verification reference' },
      { key: 'category', label: 'Bespoke Category Tag', placeholder: 'General Preservation' }
    ];
  }, [page.id]);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  // Create content directly on page
  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ContentItem = {
      id: `gov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageId: page.id,
      title: newTitle,
      summary: newSummary,
      content: newContent,
      status: newStatus,
      author: 'Elder Custodian',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      version: 1,
      extraFields: newExtraFields
    };

    onSaveItems([newItem, ...contentItems]);

    // Audit Log
    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Content Created',
      details: `Directly published new content: "${newTitle}" under ${page.label}.`,
      status: 'Success'
    });

    // Reset Form
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewExtraFields({});
    setActiveTab('published');
  };

  // In-place edit trigger
  const handleStartEdit = (item: ContentItem) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Create a Version History Record before changing
    const original = contentItems.find(i => i.id === editingItem.id);
    if (original) {
      onRestoreVersion({
        id: `ver_${Date.now()}`,
        itemId: original.id,
        pageId: page.id,
        version: original.version,
        title: original.title,
        content: original.content,
        summary: original.summary,
        updatedAt: original.updatedAt,
        actor: original.author,
        extraFields: original.extraFields
      });
    }

    const updatedItems = contentItems.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...editingItem,
          version: item.version + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    onSaveItems(updatedItems);
    
    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Content Edited',
      details: `Modified content item "${editingItem.title}" to version ${original ? original.version + 1 : 2}.`,
      status: 'Success'
    });

    setEditingItem(null);
  };

  // Delete Item
  const handleDeleteItem = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    const filtered = contentItems.filter(item => item.id !== id);
    onSaveItems(filtered);

    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Content Deleted',
      details: `Permanently deleted record: "${title}".`,
      status: 'Warning'
    });
  };

  // Approve pending submission
  const handleApprovePending = (id: string, title: string) => {
    const updated = contentItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'published' as const,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    onSaveItems(updated);

    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Contribution Approved',
      details: `Approved community submission: "${title}". Item is now live.`,
      status: 'Success'
    });
  };

  // Reject pending submission
  const handleRejectPending = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to decline submission: "${title}"?`)) return;
    const updated = contentItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'draft' as const, // move to draft so they can fix it
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    onSaveItems(updated);

    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Contribution Rejected',
      details: `Rejected community submission: "${title}". Returned to drafts directory.`,
      status: 'Warning'
    });
  };

  // Toggle archive status
  const handleToggleArchive = (item: ContentItem) => {
    const targetStatus = (item.status === 'archived' ? 'published' : 'archived') as 'published' | 'archived';
    const updated = contentItems.map(i => {
      if (i.id === item.id) {
        return { ...i, status: targetStatus, updatedAt: new Date().toISOString() };
      }
      return i;
    });
    onSaveItems(updated);

    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: targetStatus === 'archived' ? 'Content Archived' : 'Content Unarchived',
      details: `${targetStatus === 'archived' ? 'Archived' : 'Published'} record: "${item.title}".`,
      status: 'Success'
    });
  };

  // Version rollback helper
  const handleRollback = (ver: VersionRecord) => {
    if (!window.confirm(`Do you want to roll back this page item to Version ${ver.version}?`)) return;
    
    const updated = contentItems.map(item => {
      if (item.id === ver.itemId) {
        return {
          ...item,
          title: ver.title,
          content: ver.content,
          summary: ver.summary,
          extraFields: ver.extraFields,
          version: item.version + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    onSaveItems(updated);

    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Version Rollback Executed',
      details: `Rolled back item ID ${ver.itemId} to historical Version ${ver.version}.`,
      status: 'Success'
    });
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(filteredItems.map(i => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds([...selectedItemIds, id]);
    } else {
      setSelectedItemIds(selectedItemIds.filter(i => i !== id));
    }
  };

  const executeBulkAction = (action: 'publish' | 'archive' | 'delete') => {
    if (selectedItemIds.length === 0) return;
    
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to permanently delete these ${selectedItemIds.length} items?`)) return;
      const filtered = contentItems.filter(i => !selectedItemIds.includes(i.id));
      onSaveItems(filtered);
    } else {
      const targetStatus = action === 'publish' ? 'published' : 'archived';
      const updated = contentItems.map(i => {
        if (selectedItemIds.includes(i.id)) {
          return { ...i, status: targetStatus as any, updatedAt: new Date().toISOString() };
        }
        return i;
      });
      onSaveItems(updated);
    }

    onAddAuditLog({
      pageId: page.id,
      actor: 'Elder (Super Admin)',
      action: 'Bulk Action Executed',
      details: `Executed bulk [${action.toUpperCase()}] on ${selectedItemIds.length} selected records.`,
      status: action === 'delete' ? 'Warning' : 'Success'
    });

    setSelectedItemIds([]);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-150 dark:border-slate-700/60 shadow-xl shadow-slate-100/20 dark:shadow-none flex flex-col gap-6 text-left animate-fade-in">
      
      {/* Workspace Header & Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-extrabold uppercase tracking-widest text-[10px] mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Active Mirror Studio</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-slate-850 dark:text-white flex items-center gap-3">
            <span>{page.label} Page Control</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Dynamic Governance Console targeting the <strong className="text-slate-600 dark:text-slate-350 font-semibold">/{page.id}</strong> route.
          </p>
        </div>

        {/* Connection status pills */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider">
            ● Real-Time Sync
          </span>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider">
            🔐 Elder Signed
          </span>
        </div>
      </div>

      {/* Page Statistics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/50 dark:bg-slate-900/15 p-4 rounded-3xl border border-slate-100 dark:border-slate-750/30">
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750 text-left">
          <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Items</span>
          <span className="text-2xl font-serif font-black text-slate-800 dark:text-white">{stats.total}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750 text-left">
          <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-500">Published</span>
          <span className="text-2xl font-serif font-black text-emerald-600 dark:text-emerald-400">{stats.published}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750 text-left relative overflow-hidden">
          {stats.pending > 0 && (
            <div className="absolute right-2 top-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          )}
          <span className="block text-[8px] font-black uppercase tracking-widest text-amber-500">Pending Approvals</span>
          <span className="text-2xl font-serif font-black text-amber-500">{stats.pending}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750 text-left">
          <span className="block text-[8px] font-black uppercase tracking-widest text-indigo-500">Drafts</span>
          <span className="text-2xl font-serif font-black text-indigo-500 dark:text-indigo-400">{stats.drafts}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-750 col-span-2 md:col-span-1 text-left">
          <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500">Archived</span>
          <span className="text-2xl font-serif font-black text-slate-500 dark:text-slate-400">{stats.archived}</span>
        </div>
      </div>

      {/* Tab select strip */}
      <div className="flex border-b border-slate-100 dark:border-slate-700/50 gap-4 overflow-x-auto pb-1 select-none">
        {[
          { id: 'published', label: 'Published & Drafts', count: stats.published + stats.drafts + stats.archived },
          { id: 'pending', label: 'Submissions Box', count: stats.pending, alert: stats.pending > 0 },
          { id: 'create', label: 'Create Record', icon: Plus },
          { id: 'history', label: 'Revision Registry', count: pageVersions.length },
          { id: 'audits', label: 'Local Audits', count: pageAudits.length },
          { id: 'analytics', label: 'Analytics' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive 
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                  tab.alert 
                    ? 'bg-amber-500 text-slate-950 animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 min-h-[350px]">
        
        {/* TAB: CONTENT LIST (PUBLISHED & DRAFTS) */}
        {activeTab === 'published' && (
          <div className="space-y-4">
            
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search live page registry..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl text-xs outline-none focus:border-amber-500 font-sans font-medium text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Drafts Only</option>
                  <option value="archived">Archived Only</option>
                </select>
              </div>
            </div>

            {/* Bulk actions helper bar */}
            {selectedItemIds.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="font-bold text-slate-800 dark:text-amber-200">
                    {selectedItemIds.length} items checked for bulk execution
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeBulkAction('publish')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[9px] rounded-lg cursor-pointer"
                  >
                    Bulk Publish
                  </button>
                  <button
                    onClick={() => executeBulkAction('archive')}
                    className="px-3 py-1.5 bg-slate-650 hover:bg-slate-700 text-white font-black uppercase tracking-wider text-[9px] rounded-lg cursor-pointer"
                  >
                    Bulk Archive
                  </button>
                  <button
                    onClick={() => executeBulkAction('delete')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-[9px] rounded-lg cursor-pointer"
                  >
                    Bulk Delete
                  </button>
                </div>
              </div>
            )}

            {/* Table layout */}
            <div className="border border-slate-100 dark:border-slate-750/40 rounded-2xl overflow-hidden bg-slate-50/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 font-black uppercase tracking-wider">
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={filteredItems.length > 0 && selectedItemIds.length === filteredItems.length}
                          onChange={handleSelectAll}
                          className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Title / Name</th>
                      <th className="p-4">Audited Author</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Last Updated</th>
                      <th className="p-4">Rev</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-serif font-black text-slate-800 dark:text-white">
                          <div>
                            <span className="text-sm block">{item.title}</span>
                            {item.summary && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[250px] font-sans font-semibold">
                                {item.summary}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-500 dark:text-slate-400">
                          {item.author}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            item.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : item.status === 'archived'
                                ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[10px]">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-400 font-bold font-mono text-[10px]">
                          v{item.version}
                        </td>
                        <td className="p-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
                            title="Edit content"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(item)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
                            title={item.status === 'archived' ? 'Publish' : 'Archive'}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p>No content records found matching filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SUBMISSIONS BOX (PENDING) */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-750/30 pb-2">
              <h3 className="font-serif font-black text-sm text-slate-800 dark:text-white">Pending Vetting Queues</h3>
              <span className="text-[9px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                Requires Elder Consent
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingItems.map(item => (
                <div key={item.id} className="p-5 bg-amber-500/[0.02] dark:bg-slate-900/20 rounded-3xl border border-amber-500/15 dark:border-amber-950/25 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    PENDING
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center rounded-lg font-bold text-[10px]">
                        {item.author.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block text-[11px] font-serif font-black text-slate-800 dark:text-white leading-none">
                          {item.title}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-semibold">
                          By {item.author} ({item.authorEmail})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                      {item.content}
                    </p>

                    {/* Dynamic Extra Field values */}
                    {item.extraFields && Object.keys(item.extraFields).length > 0 && (
                      <div className="bg-white/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-750/40 text-[10px] space-y-1">
                        {Object.entries(item.extraFields).map(([key, val]) => (
                          <div key={key} className="flex justify-between font-mono">
                            <span className="text-slate-400 uppercase">{key}:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[150px]">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => handleApprovePending(item.id, item.title)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] py-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-4.5 h-4.5" />
                      <span>Approve & Publish</span>
                    </button>
                    <button
                      onClick={() => handleRejectPending(item.id, item.title)}
                      className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded-2xl cursor-pointer transition-colors"
                      title="Decline Submission"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}

              {pendingItems.length === 0 && (
                <div className="md:col-span-2 text-center py-16 border border-dashed border-slate-150 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/30 dark:bg-slate-900/5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Page Inbox Empty</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">No pending community stories or records require review for this page.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: CREATE CONTENT FORM */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateContent} className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-750/30 pb-2">
              <h3 className="font-serif font-black text-sm text-slate-800 dark:text-white">Upload New Chronicle</h3>
              <span className="text-[9px] text-slate-400 font-semibold">Immediate Database Entry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Record Title / Term</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., The Cradle of Clans"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Summary / Accent</label>
                <input
                  type="text"
                  placeholder="e.g., Subtext detailing the origin era"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium"
                />
              </div>

              {/* Dynamic inputs based on template */}
              {extraFieldsTemplate.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={newExtraFields[f.key] || ''}
                    onChange={(e) => setNewExtraFields({ ...newExtraFields, [f.key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium"
                  />
                </div>
              ))}

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Full Record Content / Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the complete customary narrative or definition..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium font-sans resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Initial Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newStatus === 'published'}
                      onChange={() => setNewStatus('published')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>Publish Instantly</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newStatus === 'draft'}
                      onChange={() => setNewStatus('draft')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>Save as Draft</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-wider text-[11px] rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Content</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB: REVISION REGISTRY (VERSION HISTORY & ROLLBACK) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-750/30 pb-2">
              <h3 className="font-serif font-black text-sm text-slate-800 dark:text-white">Content Version Registry</h3>
              <span className="text-[9px] text-slate-400 font-semibold">Track & roll back changes</span>
            </div>

            <div className="space-y-3">
              {pageVersions.map(ver => (
                <div key={ver.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-750/40 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs hover:border-amber-500/20 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 shrink-0">
                      <GitCommit className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-black text-sm text-slate-850 dark:text-white">v{ver.version} - {ver.title}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-black uppercase tracking-widest">
                          ACTOR: {ver.actor}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 leading-tight pt-1">
                        Saved {new Date(ver.updatedAt).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-350 italic leading-relaxed pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-750/30 mt-2 max-w-xl">
                        "{ver.content.substring(0, 150)}..."
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRollback(ver)}
                    className="self-start md:self-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-wider text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback</span>
                  </button>
                </div>
              ))}

              {pageVersions.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-150 dark:border-slate-700/60 rounded-3xl space-y-3 bg-slate-50/30 dark:bg-slate-900/5 text-slate-400">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-850 dark:text-white">No revisions logged</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Version logs are automatically generated whenever you edit existing published content.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: LOCAL PAGE AUDITS */}
        {activeTab === 'audits' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-750/30 pb-2">
              <h3 className="font-serif font-black text-sm text-slate-800 dark:text-white">Page Activity Audit Log</h3>
              <span className="text-[9px] text-slate-400 font-semibold">Localized action timeline</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {pageAudits.map(log => (
                <div key={log.id} className="py-3.5 flex items-start gap-3.5 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    log.status === 'Success' 
                      ? 'bg-emerald-500' 
                      : log.status === 'Warning' 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-slate-800 dark:text-white font-serif">{log.action}</strong>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pt-1">
                      {log.details}
                    </p>
                    <span className="text-[9px] text-slate-400 block pt-1 font-bold">
                      Actor Signature: {log.actor}
                    </span>
                  </div>
                </div>
              ))}

              {pageAudits.length === 0 && (
                <div className="text-center py-16 text-slate-400 uppercase tracking-wider text-[10px] space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No localized audits recorded for this route yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: LOCAL PAGE ANALYTICS & INSIGHTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-750/30 pb-2">
              <h3 className="font-serif font-black text-sm text-slate-800 dark:text-white">Analytics & Page Insights</h3>
              <span className="text-[9px] text-slate-400 font-semibold">Aggregated page trends</span>
            </div>

            {/* Simulated analytics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-750/40 p-4 rounded-2xl">
                <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Engagement Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-serif font-black text-slate-800 dark:text-white">94.8%</span>
                  <span className="text-emerald-500 text-[10px] font-bold font-mono">▲ 4.2%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94.8%' }} />
                </div>
                <span className="text-[9px] text-slate-400 block mt-2">Interaction density vs bounce metrics.</span>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-750/40 p-4 rounded-2xl">
                <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Weekly Views Growth</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-serif font-black text-slate-800 dark:text-white">2.4k</span>
                  <span className="text-emerald-500 text-[10px] font-bold font-mono">▲ 12.8%</span>
                </div>
                {/* Micro SVG line graph */}
                <div className="h-10 w-full mt-1.5">
                  <svg viewBox="0 0 100 20" className="w-full h-full stroke-emerald-500 fill-transparent stroke-[1.5]">
                    <polyline points="0,18 15,14 30,15 45,9 60,11 75,4 90,6 100,2" />
                  </svg>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-750/40 p-4 rounded-2xl">
                <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Mobile Traffic Density</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-serif font-black text-slate-800 dark:text-white">65%</span>
                  <span className="text-slate-400 text-[10px] font-bold">Standard Device split</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '65%' }} />
                </div>
                <span className="text-[9px] text-slate-400 block mt-2">Canoe dashboards optimal sizing needed.</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL / POPUP: SECURE IN-PLACE EDIT COMPONENTRY */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-750 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 pb-4 mb-4">
                <div>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Interactive Audit Safe Edit</span>
                  <h3 className="font-serif font-black text-base text-slate-850 dark:text-white">Edit Record - v{editingItem.version}</h3>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Title / Term</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Summary / Accent</label>
                  <input
                    type="text"
                    value={editingItem.summary || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium"
                  />
                </div>

                {/* Edit dynamic template fields */}
                {editingItem.extraFields && Object.keys(editingItem.extraFields).map(key => (
                  <div key={key} className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </label>
                    <input
                      type="text"
                      value={editingItem.extraFields?.[key] || ''}
                      onChange={(e) => {
                        const updatedFields = { ...(editingItem.extraFields || {}), [key]: e.target.value };
                        setEditingItem({ ...editingItem, extraFields: updatedFields });
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium"
                    />
                  </div>
                ))}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Content Body / Description</label>
                  <textarea
                    rows={4}
                    required
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700/60 rounded-xl text-xs outline-none focus:border-amber-500 text-slate-850 dark:text-white font-medium font-sans resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    Commit Version Rollout
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
