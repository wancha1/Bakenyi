import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Megaphone, Calendar, BookOpen, Clock, Plus, Trash2, 
  Edit3, Check, X, ShieldAlert, Users, MapPin, Tag, Star, Eye
} from 'lucide-react';
import { 
  getStatuses, getNews, getAnnouncements, getEvents,
  createStatus, updateStatus, deleteStatus,
  createNews, updateNews, deleteNews,
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  createEvent, updateEvent, deleteEvent
} from '../../../lib/heritageService';
import { Status, News, Announcement, Event } from '../../../types/heritage';

interface HeritageModulesManagerProps {
  userRole: 'super_admin' | 'admin' | 'historian' | 'community_leader' | 'reporter' | 'member' | 'public' | 'staff' | 'customer';
}

export default function HeritageModulesManager({ userRole }: HeritageModulesManagerProps) {
  const isElder = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || userRole === 'community_leader';
  const isReporter = userRole === 'reporter' || userRole === 'staff' || userRole === 'historian';

  const [activeTab, setActiveTab] = useState<'statuses' | 'news' | 'announcements' | 'events'>('statuses');
  
  // Data lists
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Form toggles
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Status Form States
  const [statusForm, setStatusForm] = useState({
    text: '',
    media_url: '',
    media_type: 'image' as 'image' | 'video' | 'audio',
    link: '',
    visibility: 'public' as 'public' | 'private',
    status: 'pending' as any
  });

  // News Form States
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    content: '',
    cover_image: '',
    category: 'General',
    tags: '',
    featured: false,
    status: 'pending' as any
  });

  // Announcement Form States
  const [annForm, setAnnForm] = useState({
    title: '',
    message: '',
    category: 'community' as any,
    priority: 'normal' as any,
    pinned: false,
    status: 'pending' as any
  });

  // Event Form States
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    start_datetime: '',
    end_datetime: '',
    cover_image: '',
    organizer: '',
    contact: '',
    rsvp_enabled: false,
    rsvp_limit: '' as string | number,
    latitude: '',
    longitude: '',
    status: 'pending' as any
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'statuses') {
        const data = await getStatuses(false); // get all including pending
        setStatuses(data);
      } else if (activeTab === 'news') {
        const data = await getNews(false); // get all including drafts/pending
        setNews(data);
      } else if (activeTab === 'announcements') {
        const data = await getAnnouncements(false); // get all
        setAnnouncements(data);
      } else if (activeTab === 'events') {
        const data = await getEvents(false); // get all
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setShowForm(false);
    setEditingId(null);
    setStatusForm({
      text: '',
      media_url: '',
      media_type: 'image',
      link: '',
      visibility: 'public',
      status: 'pending'
    });
    setNewsForm({
      title: '',
      summary: '',
      content: '',
      cover_image: '',
      category: 'General',
      tags: '',
      featured: false,
      status: 'pending'
    });
    setAnnForm({
      title: '',
      message: '',
      category: 'community',
      priority: 'normal',
      pinned: false,
      status: 'pending'
    });
    setEventForm({
      title: '',
      description: '',
      location: '',
      start_datetime: '',
      end_datetime: '',
      cover_image: '',
      organizer: '',
      contact: '',
      rsvp_enabled: false,
      rsvp_limit: '',
      latitude: '',
      longitude: '',
      status: 'pending'
    });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === 'statuses') {
      setStatusForm({
        text: item.text || '',
        media_url: item.media_items?.[0]?.url || '',
        media_type: item.media_items?.[0]?.type || 'image',
        link: item.link || '',
        visibility: item.visibility || 'public',
        status: item.status
      });
    } else if (activeTab === 'news') {
      setNewsForm({
        title: item.title,
        summary: item.summary || '',
        content: item.content,
        cover_image: item.cover_image || '',
        category: item.category || 'General',
        tags: (item.tags || []).join(', '),
        featured: item.featured || false,
        status: item.status
      });
    } else if (activeTab === 'announcements') {
      setAnnForm({
        title: item.title,
        message: item.message,
        category: item.category,
        priority: item.priority,
        pinned: item.pinned || false,
        status: item.status
      });
    } else if (activeTab === 'events') {
      setEventForm({
        title: item.title,
        description: item.description,
        location: item.location,
        start_datetime: item.start_datetime ? new Date(item.start_datetime).toISOString().slice(0, 16) : '',
        end_datetime: item.end_datetime ? new Date(item.end_datetime).toISOString().slice(0, 16) : '',
        cover_image: item.cover_image || '',
        organizer: item.organizer,
        contact: item.contact || '',
        rsvp_enabled: item.rsvp_settings?.enabled || false,
        rsvp_limit: item.rsvp_settings?.limit || '',
        latitude: item.map_location?.latitude?.toString() || '',
        longitude: item.map_location?.longitude?.toString() || '',
        status: item.status
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this heritage item?')) return;
    let success = false;
    if (activeTab === 'statuses') success = await deleteStatus(id);
    else if (activeTab === 'news') success = await deleteNews(id);
    else if (activeTab === 'announcements') success = await deleteAnnouncement(id);
    else if (activeTab === 'events') success = await deleteEvent(id);

    if (success) {
      alert('Item deleted successfully!');
      fetchData();
    } else {
      alert('Failed to delete item.');
    }
  };

  const handleModeration = async (id: string, newStatus: string) => {
    if (!isElder) {
      alert('Security violation: Only the honorable Elders (super_admin) can approve or publish content.');
      return;
    }
    
    let success = false;
    if (activeTab === 'statuses') {
      const res = await updateStatus(id, { status: newStatus as any });
      success = !res.error;
    } else if (activeTab === 'news') {
      const res = await updateNews(id, { status: newStatus as any });
      success = !res.error;
    } else if (activeTab === 'announcements') {
      const res = await updateAnnouncement(id, { status: newStatus as any });
      success = !res.error;
    } else if (activeTab === 'events') {
      const res = await updateEvent(id, { status: newStatus as any });
      success = !res.error;
    }

    if (success) {
      alert(`Content state transitioned successfully to [${newStatus}]!`);
      fetchData();
    } else {
      alert('Failed to transition state.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'statuses') {
        const payload: Omit<Status, 'id'> = {
          text: statusForm.text,
          media_items: statusForm.media_url ? [{ url: statusForm.media_url, type: statusForm.media_type }] : [],
          link: statusForm.link || undefined,
          author_id: 'active-admin',
          view_count: 0,
          visibility: statusForm.visibility,
          status: editingId ? statusForm.status : (isElder ? 'approved' : 'pending'),
          reactions: {},
          comments: [],
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_archived: false
        };

        if (editingId) {
          // Guard for status updates by non-Elders
          if (!isElder && statusForm.status === 'approved') {
            payload.status = 'pending';
          }
          await updateStatus(editingId, payload);
        } else {
          await createStatus(payload);
        }
      } else if (activeTab === 'news') {
        const payload: Omit<News, 'id'> = {
          title: newsForm.title,
          slug: newsForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          summary: newsForm.summary || undefined,
          content: newsForm.content,
          cover_image: newsForm.cover_image || undefined,
          author_id: 'active-admin',
          category: newsForm.category,
          tags: newsForm.tags ? newsForm.tags.split(',').map(t => t.trim()) : [],
          featured: newsForm.featured,
          status: editingId ? newsForm.status : (isElder ? 'published' : 'pending'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (editingId) {
          if (!isElder && (newsForm.status === 'approved' || newsForm.status === 'published')) {
            payload.status = 'pending';
          }
          await updateNews(editingId, payload);
        } else {
          await createNews(payload);
        }
      } else if (activeTab === 'announcements') {
        const payload: Omit<Announcement, 'id'> = {
          title: annForm.title,
          message: annForm.message,
          category: annForm.category,
          priority: annForm.priority,
          pinned: annForm.pinned,
          start_date: new Date().toISOString(),
          created_by: 'active-admin',
          status: editingId ? annForm.status : (isElder ? 'approved' : 'pending'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (editingId) {
          if (!isElder && annForm.status === 'approved') {
            payload.status = 'pending';
          }
          await updateAnnouncement(editingId, payload);
        } else {
          await createAnnouncement(payload);
        }
      } else if (activeTab === 'events') {
        const payload: Omit<Event, 'id'> = {
          title: eventForm.title,
          description: eventForm.description,
          location: eventForm.location,
          start_datetime: new Date(eventForm.start_datetime).toISOString(),
          end_datetime: new Date(eventForm.end_datetime).toISOString(),
          cover_image: eventForm.cover_image || undefined,
          organizer: eventForm.organizer,
          contact: eventForm.contact || undefined,
          rsvp_settings: {
            enabled: eventForm.rsvp_enabled,
            limit: eventForm.rsvp_limit ? Number(eventForm.rsvp_limit) : null,
            rsvps: []
          },
          map_location: {
            latitude: eventForm.latitude ? Number(eventForm.latitude) : null,
            longitude: eventForm.longitude ? Number(eventForm.longitude) : null
          },
          created_by: 'active-admin',
          status: editingId ? eventForm.status : (isElder ? 'approved' : 'pending'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (editingId) {
          if (!isElder && eventForm.status === 'approved') {
            payload.status = 'pending';
          }
          await updateEvent(editingId, payload);
        } else {
          await createEvent(payload);
        }
      }

      alert('Heritage item successfully persisted!');
      resetForms();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-750 pb-4 gap-4">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => { setActiveTab('statuses'); resetForms(); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'statuses' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Statuses</span>
          </button>
          <button 
            onClick={() => { setActiveTab('news'); resetForms(); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'news' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>News & Press</span>
          </button>
          <button 
            onClick={() => { setActiveTab('announcements'); resetForms(); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>
          <button 
            onClick={() => { setActiveTab('events'); resetForms(); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'events' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events</span>
          </button>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New {activeTab.slice(0, -1)}</span>
        </button>
      </div>

      {/* 2. Security warning banner for non-Elders */}
      {!isElder && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300/80">
            <strong className="block mb-0.5">Vetting Pipeline Restriction In Effect</strong>
            You are logged in as a <strong>{userRole}</strong>. You can create or edit content drafts, but they will be held as <strong className="underline">pending</strong> until vetted and published by the honorable <strong>Council of Elders (super_admin)</strong>.
          </div>
        </div>
      )}

      {/* 3. Form Drawer/Widget */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <span>{editingId ? 'Modify' : 'Create'} {activeTab.slice(0, -1).toUpperCase()} entry</span>
          </h3>

          {/* Form Fields: Statuses */}
          {activeTab === 'statuses' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Text</label>
                <textarea 
                  required
                  rows={3}
                  value={statusForm.text}
                  onChange={e => setStatusForm({...statusForm, text: e.target.value})}
                  placeholder="e.g. Preserving the ancient Bakenyi floating gardens..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attachment Media URL (Optional)</label>
                  <input 
                    type="url"
                    value={statusForm.media_url}
                    onChange={e => setStatusForm({...statusForm, media_url: e.target.value})}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Media Type</label>
                  <select 
                    value={statusForm.media_type}
                    onChange={e => setStatusForm({...statusForm, media_type: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  >
                    <option value="image">Image Attachment</option>
                    <option value="audio">Audio Voice Track</option>
                    <option value="video">Short Video Loop</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: News */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Press Title</label>
                  <input 
                    required
                    type="text"
                    value={newsForm.title}
                    onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                    placeholder="e.g. Lukenye Dialect Formally Digitized"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category Tag</label>
                  <input 
                    required
                    type="text"
                    value={newsForm.category}
                    onChange={e => setNewsForm({...newsForm, category: e.target.value})}
                    placeholder="e.g. Linguistics, Heritage, Gatherings"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Brief Executive Summary</label>
                <input 
                  type="text"
                  value={newsForm.summary}
                  onChange={e => setNewsForm({...newsForm, summary: e.target.value})}
                  placeholder="e.g. Council of Elders initiates database transcription project."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Content Article Body</label>
                <textarea 
                  required
                  rows={5}
                  value={newsForm.content}
                  onChange={e => setNewsForm({...newsForm, content: e.target.value})}
                  placeholder="Markdown or rich story content..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cover Graphic image URL</label>
                  <input 
                    type="url"
                    value={newsForm.cover_image}
                    onChange={e => setNewsForm({...newsForm, cover_image: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    type="checkbox"
                    id="newsFeatured"
                    checked={newsForm.featured}
                    onChange={e => setNewsForm({...newsForm, featured: e.target.checked})}
                    className="rounded text-indigo-650"
                  />
                  <label htmlFor="newsFeatured" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Feature this article prominently on landing homepage
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Announcements */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notice Heading</label>
                <input 
                  required
                  type="text"
                  value={annForm.title}
                  onChange={e => setAnnForm({...annForm, title: e.target.value})}
                  placeholder="e.g. Supreme Elder Council meeting date"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notice Message Details</label>
                <textarea 
                  required
                  rows={3}
                  value={annForm.message}
                  onChange={e => setAnnForm({...annForm, message: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Message Category</label>
                  <select 
                    value={annForm.category}
                    onChange={e => setAnnForm({...annForm, category: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  >
                    <option value="meetings">Official Meeting</option>
                    <option value="emergencies">Critical Emergency</option>
                    <option value="community notices">Community Notice</option>
                    <option value="scholarships">Scholarship Opportunity</option>
                    <option value="ceremonies">Traditional Ceremony</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority Tier</label>
                  <select 
                    value={annForm.priority}
                    onChange={e => setAnnForm({...annForm, priority: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal</option>
                    <option value="high">High priority</option>
                    <option value="emergency">IMMEDIATE EMERGENCY</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    type="checkbox"
                    id="annPinned"
                    checked={annForm.pinned}
                    onChange={e => setAnnForm({...annForm, pinned: e.target.checked})}
                    className="rounded text-indigo-650"
                  />
                  <label htmlFor="annPinned" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pin to top of public homepage banner
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Events */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Event Title</label>
                  <input 
                    required
                    type="text"
                    value={eventForm.title}
                    onChange={e => setEventForm({...eventForm, title: e.target.value})}
                    placeholder="e.g. Stitching Canoe Workshop"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location Venue Details</label>
                  <input 
                    required
                    type="text"
                    value={eventForm.location}
                    onChange={e => setEventForm({...eventForm, location: e.target.value})}
                    placeholder="e.g. Lake Kyoga Bank, Nakasongola"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Event Description Details</label>
                <textarea 
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Date & Time</label>
                  <input 
                    required
                    type="datetime-local"
                    value={eventForm.start_datetime}
                    onChange={e => setEventForm({...eventForm, start_datetime: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date & Time</label>
                  <input 
                    required
                    type="datetime-local"
                    value={eventForm.end_datetime}
                    onChange={e => setEventForm({...eventForm, end_datetime: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Organizer Name</label>
                  <input 
                    required
                    type="text"
                    value={eventForm.organizer}
                    onChange={e => setEventForm({...eventForm, organizer: e.target.value})}
                    placeholder="e.g. Elder Mukasa"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contact Coordinate (Email/Phone)</label>
                  <input 
                    type="text"
                    value={eventForm.contact}
                    onChange={e => setEventForm({...eventForm, contact: e.target.value})}
                    placeholder="e.g. elder@bakenyi.org"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cover Image URL</label>
                  <input 
                    type="url"
                    value={eventForm.cover_image}
                    onChange={e => setEventForm({...eventForm, cover_image: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    type="checkbox"
                    id="rsvpEnabled"
                    checked={eventForm.rsvp_enabled}
                    onChange={e => setEventForm({...eventForm, rsvp_enabled: e.target.checked})}
                    className="rounded text-indigo-650"
                  />
                  <label htmlFor="rsvpEnabled" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enable Attendance RSVP Limit
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Attendee Limit (Optional)</label>
                  <input 
                    type="number"
                    disabled={!eventForm.rsvp_enabled}
                    value={eventForm.rsvp_limit}
                    onChange={e => setEventForm({...eventForm, rsvp_limit: e.target.value})}
                    placeholder="e.g. 50"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-slate-800 dark:text-white text-xs font-semibold disabled:opacity-40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Latitude</label>
                    <input 
                      type="text"
                      value={eventForm.latitude}
                      onChange={e => setEventForm({...eventForm, latitude: e.target.value})}
                      placeholder="1.354"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Longitude</label>
                    <input 
                      type="text"
                      value={eventForm.longitude}
                      onChange={e => setEventForm({...eventForm, longitude: e.target.value})}
                      placeholder="32.556"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              type="button"
              onClick={resetForms}
              className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2 bg-indigo-650 text-white hover:bg-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Save Heritage Entry
            </button>
          </div>
        </form>
      )}

      {/* 4. Display Listings Table / Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-2">
          <Clock className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Hydrating archive registries...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-xs">
          
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
            <h4 className="font-serif font-black text-base text-slate-900 dark:text-white">
              Vetted {activeTab.toUpperCase()} Directory
            </h4>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full font-mono font-bold">
              {activeTab === 'statuses' ? statuses.length : activeTab === 'news' ? news.length : activeTab === 'announcements' ? announcements.length : events.length} active records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Content / Message</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Owner</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status State</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {/* STATUSES LIST */}
                {activeTab === 'statuses' && statuses.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {s.media_items && s.media_items.length > 0 && (
                          <img 
                            src={s.media_items[0].url} 
                            alt="thumb" 
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white max-w-sm line-clamp-2">{s.text || 'No description text'}</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>Expires: {new Date(s.expires_at).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>{s.view_count || 0} Views</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">Digital Historian</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                        s.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-amber-50 text-amber-700 border-amber-150'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isElder && s.status !== 'approved' && (
                          <button 
                            onClick={() => handleModeration(s.id, 'approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="elder approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(s)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* NEWS LIST */}
                {activeTab === 'news' && news.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {n.cover_image && (
                          <img 
                            src={n.cover_image} 
                            alt="thumb" 
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{n.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400">
                            <Tag className="w-3 h-3 text-indigo-500" />
                            <span>{n.category}</span>
                            {n.featured && (
                              <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded">FEATURED</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">Staff Reporter</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                        n.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-amber-50 text-amber-700 border-amber-150'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isElder && n.status !== 'published' && (
                          <button 
                            onClick={() => handleModeration(n.id, 'published')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="elder publish"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(n)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* ANNOUNCEMENTS LIST */}
                {activeTab === 'announcements' && announcements.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10">
                    <td className="p-4">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>{a.title}</span>
                          {a.pinned && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{a.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400">
                          <span className={`font-bold uppercase ${a.priority === 'emergency' ? 'text-rose-500' : 'text-slate-400'}`}>
                            {a.priority} Priority
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">Elderly Warden</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                        a.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-amber-50 text-amber-700 border-amber-150'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isElder && a.status !== 'approved' && (
                          <button 
                            onClick={() => handleModeration(a.id, 'approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="elder approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(a)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* EVENTS LIST */}
                {activeTab === 'events' && events.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/10">
                    <td className="p-4">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{e.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {e.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(e.start_datetime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">Elder Mukasa</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                        e.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-amber-50 text-amber-700 border-amber-150'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isElder && e.status !== 'approved' && (
                          <button 
                            onClick={() => handleModeration(e.id, 'approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="elder approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(e)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-650 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
}
