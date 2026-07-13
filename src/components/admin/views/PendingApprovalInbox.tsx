import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, X, AlertTriangle, Trash2, Archive, Eye, BookOpen, Sparkles, 
  Megaphone, Calendar, Languages, Image as ImageIcon, Users, FileText, 
  Search, Filter, Clock, ChevronRight, CornerDownRight, Volume2, MapPin, 
  Tag, ShieldAlert, CheckCircle2, ChevronDown, RefreshCw, Star, Info
} from 'lucide-react';

// Services
import { 
  getArticles, updateArticle, deleteArticle,
  getContributions, updateContributionStatus,
  getGalleryImages, updateGalleryImageStatus, addGalleryImage,
  getClans, updateClan, deleteClan,
  getLeaders, updateLeader, deleteLeader,
  getVocabulary, updateVocabularyStatus,
  Vocabulary, Contribution, GalleryImage, Clan, Leader
} from '../../../lib/supabase';

import { 
  getStatuses, updateStatus, deleteStatus,
  getNews, updateNews, deleteNews,
  getAnnouncements, updateAnnouncement, deleteAnnouncement,
  getEvents, updateEvent, deleteEvent
} from '../../../lib/heritageService';

import { Status, News, Announcement, Event as HeritageEvent } from '../../../types/heritage';
import { Article } from '../../../types/article';
import { logAdminActivity } from '../../../lib/operations';
import DangerAction, { DangerActionType, DangerLevel } from '../../DangerAction';

// Extended type for unified queue
export interface ModerationItem {
  id: string;
  contentType: 'Article' | 'Story' | 'Status' | 'Gallery' | 'Vocabulary' | 'Leader' | 'Clan' | 'Event' | 'Announcement' | 'News' | 'Contribution';
  title: string;
  thumbnail?: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'published' | 'draft' | 'rejected' | 'changes_requested' | 'archived';
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'emergency';
  revisions: number;
  comments?: string;
  scheduledPublishAt?: string;
  raw: any; // Original model record
}

export default function PendingApprovalInbox() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  
  // DangerAction configuration state
  const [dangerActionConfig, setDangerActionConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    actionType?: DangerActionType;
    dangerLevel?: DangerLevel;
    requireConfirmWord?: string;
    placeholderConfirmWord?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  
  // Filtering & Sorting
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('pending'); // Default to pending
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Action Feedback/Comments
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Scheduling States
  const [scheduleDate, setScheduleDate] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Metrics
  const [metrics, setMetrics] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    criticalNotice: 0
  });

  // Revisions tracking (using localStorage persistent simulation)
  const getRevisionsCount = (id: string): number => {
    const key = `bakenyi_revisions_${id}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored) : 1;
  };

  const incrementRevisions = (id: string) => {
    const key = `bakenyi_revisions_${id}`;
    const cur = getRevisionsCount(id);
    localStorage.setItem(key, (cur + 1).toString());
  };

  const getChangesComments = (id: string): string => {
    return localStorage.getItem(`bakenyi_comments_${id}`) || '';
  };

  const setChangesComments = (id: string, comment: string) => {
    localStorage.setItem(`bakenyi_comments_${id}`, comment);
  };

  // Schedule Publish mapping
  const getScheduledDate = (id: string): string => {
    return localStorage.getItem(`bakenyi_schedule_${id}`) || '';
  };

  const setScheduledDate = (id: string, date: string) => {
    if (date) {
      localStorage.setItem(`bakenyi_schedule_${id}`, date);
    } else {
      localStorage.removeItem(`bakenyi_schedule_${id}`);
    }
  };

  const loadAllContent = async () => {
    setLoading(true);
    try {
      // Parallel fetches for ultimate response speed
      const [
        articlesData,
        statusesData,
        newsData,
        announcementsData,
        eventsData,
        contributionsData,
        galleryData,
        clansData,
        leadersData,
        vocabularyData
      ] = await Promise.all([
        getArticles(false),
        getStatuses(false),
        getNews(false),
        getAnnouncements(false),
        getEvents(false),
        getContributions(),
        getGalleryImages(true),
        getClans(false),
        getLeaders(false),
        getVocabulary(false)
      ]);

      const normalized: ModerationItem[] = [];

      // Helper to parse date or default to now
      const parseDate = (d?: string) => d ? new Date(d).toISOString() : new Date().toISOString();

      // 1. Articles (draft, pending, approved, published)
      articlesData.forEach((art: Article) => {
        normalized.push({
          id: art.id,
          contentType: 'Article',
          title: art.title,
          submittedBy: art.author || 'Staff Reporter',
          submittedAt: parseDate(art.publishedAt || undefined),
          status: art.status as any,
          category: art.category || 'Heritage',
          revisions: getRevisionsCount(art.id),
          comments: getChangesComments(art.id),
          scheduledPublishAt: getScheduledDate(art.id),
          raw: art
        });
      });

      // 2. Statuses
      statusesData.forEach((s: Status) => {
        normalized.push({
          id: s.id,
          contentType: 'Status',
          title: s.text ? (s.text.length > 50 ? s.text.substring(0, 50) + '...' : s.text) : 'Status Update',
          thumbnail: s.media_items?.[0]?.url,
          submittedBy: 'Digital Historian',
          submittedAt: parseDate(s.created_at),
          status: s.status as any,
          category: s.visibility || 'public',
          revisions: getRevisionsCount(s.id),
          comments: getChangesComments(s.id),
          raw: s
        });
      });

      // 3. News
      newsData.forEach((n: News) => {
        normalized.push({
          id: n.id,
          contentType: 'News',
          title: n.title,
          thumbnail: n.cover_image,
          submittedBy: 'Press Editor',
          submittedAt: parseDate(n.created_at),
          status: n.status as any,
          category: n.category || 'Press',
          revisions: getRevisionsCount(n.id),
          comments: getChangesComments(n.id),
          raw: n
        });
      });

      // 4. Announcements
      announcementsData.forEach((a: Announcement) => {
        normalized.push({
          id: a.id,
          contentType: 'Announcement',
          title: a.title,
          submittedBy: a.created_by || 'Council Secretary',
          submittedAt: parseDate(a.created_at),
          status: a.status as any,
          category: a.category,
          priority: a.priority,
          revisions: getRevisionsCount(a.id),
          comments: getChangesComments(a.id),
          raw: a
        });
      });

      // 5. Events
      eventsData.forEach((e: HeritageEvent) => {
        normalized.push({
          id: e.id,
          contentType: 'Event',
          title: e.title,
          thumbnail: e.cover_image,
          submittedBy: e.created_by || 'Event Coordinator',
          submittedAt: parseDate(e.created_at),
          status: e.status as any,
          category: 'Gathering',
          revisions: getRevisionsCount(e.id),
          comments: getChangesComments(e.id),
          raw: e
        });
      });

      // 6. Contributions
      contributionsData.forEach((c: Contribution) => {
        normalized.push({
          id: c.id,
          contentType: 'Contribution',
          title: c.title,
          thumbnail: c.imageUrl,
          submittedBy: c.userEmail || 'Community Member',
          submittedAt: parseDate(c.created_at),
          status: c.status as any,
          category: c.type || 'photo',
          revisions: getRevisionsCount(c.id),
          comments: getChangesComments(c.id),
          raw: c
        });
      });

      // 7. Gallery Images
      galleryData.forEach((g: GalleryImage) => {
        normalized.push({
          id: g.id,
          contentType: 'Gallery',
          title: g.title,
          thumbnail: g.imageUrl,
          submittedBy: 'Archivist',
          submittedAt: parseDate(g.created_at),
          status: g.status as any,
          category: g.category,
          revisions: getRevisionsCount(g.id),
          comments: getChangesComments(g.id),
          raw: g
        });
      });

      // 8. Clans
      clansData.forEach((clan: Clan) => {
        normalized.push({
          id: clan.id,
          contentType: 'Clan',
          title: `${clan.name} Lore`,
          submittedBy: clan.custodian || 'Clan Elder',
          submittedAt: parseDate(clan.created_at),
          status: clan.status as any,
          category: clan.totem,
          revisions: getRevisionsCount(clan.id),
          comments: getChangesComments(clan.id),
          raw: clan
        });
      });

      // 9. Leaders
      leadersData.forEach((l: Leader) => {
        normalized.push({
          id: l.id,
          contentType: 'Leader',
          title: l.name,
          thumbnail: l.photo_url,
          submittedBy: 'Council Scribe',
          submittedAt: parseDate(l.created_at),
          status: l.status as any,
          category: l.role,
          revisions: getRevisionsCount(l.id),
          comments: getChangesComments(l.id),
          raw: l
        });
      });

      // 10. Vocabulary
      vocabularyData.forEach((v: Vocabulary) => {
        normalized.push({
          id: v.id,
          contentType: 'Vocabulary',
          title: `${v.lukenye} (${v.english})`,
          submittedBy: 'Linguistics Expert',
          submittedAt: parseDate(v.created_at),
          status: v.status as any,
          category: v.category,
          revisions: getRevisionsCount(v.id),
          comments: getChangesComments(v.id),
          raw: v
        });
      });

      setItems(normalized);
      computeMetrics(normalized);

      // Re-select if currently open item got updated
      if (selectedItem) {
        const found = normalized.find(i => i.id === selectedItem.id && i.contentType === selectedItem.contentType);
        if (found) setSelectedItem(found);
      }
    } catch (err) {
      console.error('Unified moderation load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeMetrics = (all: ModerationItem[]) => {
    const pending = all.filter(i => i.status === 'pending').length;
    
    // Simulate approved/rejected today
    const logs = localStorage.getItem('bakenye_activity_logs');
    let approvedTodayCount = 0;
    let rejectedTodayCount = 0;
    if (logs) {
      try {
        const parsed = JSON.parse(logs);
        const todayStr = new Date().toDateString();
        parsed.forEach((l: any) => {
          if (new Date(l.timestamp).toDateString() === todayStr) {
            if (l.action.includes('Approved') || l.action.includes('Vetted')) {
              approvedTodayCount++;
            } else if (l.action.includes('Rejected') || l.action.includes('Denied')) {
              rejectedTodayCount++;
            }
          }
        });
      } catch (e) {}
    }

    const critical = all.filter(i => 
      (i.contentType === 'Announcement' && (i.priority === 'high' || i.priority === 'emergency'))
    ).length;

    setMetrics({
      pending,
      approvedToday: approvedTodayCount,
      rejectedToday: rejectedTodayCount,
      criticalNotice: critical
    });
  };

  useEffect(() => {
    loadAllContent();

    // Listen to operations event
    const handleSync = () => loadAllContent();
    window.addEventListener('bakenye_operations_updated', handleSync);
    return () => window.removeEventListener('bakenye_operations_updated', handleSync);
  }, []);

  // Sort and Filter items
  const filteredItems = items.filter(item => {
    // Search match
    const matchSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.submittedBy.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));
    
    // Content type match
    const matchType = typeFilter === 'All' || item.contentType === typeFilter;
    
    // Status match
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    
    // Priority match (Announcements only)
    const matchPriority = priorityFilter === 'All' || (item.priority && item.priority === priorityFilter);

    return matchSearch && matchType && matchStatus && matchPriority;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    } else {
      // Priority sorting (emergency > high > normal > low > none)
      const weight = (p?: string) => {
        if (p === 'emergency') return 4;
        if (p === 'high') return 3;
        if (p === 'normal') return 2;
        if (p === 'low') return 1;
        return 0;
      };
      return weight(b.priority) - weight(a.priority);
    }
  });

  // Bulk operation triggers
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setDangerActionConfig({
      isOpen: true,
      title: 'Bulk Approve & Publish',
      description: `Are you sure you want to BULK APPROVE & PUBLISH all ${selectedIds.length} selected items? This will instantly publish them to the public platform.`,
      confirmText: 'Bulk Approve',
      actionType: 'custom',
      dangerLevel: 'medium',
      onConfirm: async () => {
        setLoading(true);
        let successCount = 0;

        for (const id of selectedIds) {
          const item = items.find(i => i.id === id);
          if (!item) continue;
          const ok = await executeApproveAction(item, false); // silent logs inside
          if (ok) successCount++;
        }

        logAdminActivity(
          'Elder',
          'Bulk Items Approved',
          `Bulk approved and synchronized ${successCount} cultural items in unified queue.`,
          'Content',
          'Success'
        );

        setSelectedIds([]);
        await loadAllContent();
        alert(`Successfully approved ${successCount} items!`);
      }
    });
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setDangerActionConfig({
      isOpen: true,
      title: 'Bulk Reject Items',
      description: `Are you sure you want to BULK REJECT all ${selectedIds.length} selected items? This will deny and archive their applications.`,
      confirmText: 'Bulk Reject',
      actionType: 'reject',
      dangerLevel: 'high',
      onConfirm: async () => {
        setLoading(true);
        let successCount = 0;

        for (const id of selectedIds) {
          const item = items.find(i => i.id === id);
          if (!item) continue;
          const ok = await executeRejectAction(item, false);
          if (ok) successCount++;
        }

        logAdminActivity(
          'Elder',
          'Bulk Items Rejected',
          `Bulk rejected ${successCount} cultural items from unified queue.`,
          'Content',
          'Warning'
        );

        setSelectedIds([]);
        await loadAllContent();
        alert(`Rejected ${successCount} items.`);
      }
    });
  };

  // Base Single Actions execution
  const executeApproveAction = async (item: ModerationItem, log = true): Promise<boolean> => {
    try {
      if (item.contentType === 'Article') {
        const { error } = await updateArticle(item.id, { status: 'published', publishedAt: new Date().toISOString().split('T')[0] });
        if (error) throw error;
      } else if (item.contentType === 'Status') {
        const res = await updateStatus(item.id, { status: 'approved' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'News') {
        const res = await updateNews(item.id, { status: 'published' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'Announcement') {
        const res = await updateAnnouncement(item.id, { status: 'approved' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'Event') {
        const res = await updateEvent(item.id, { status: 'approved' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'Contribution') {
        const { success, error } = await updateContributionStatus(item.id, 'approved');
        if (error) throw error;
        if (success) {
          // Sync to digital gallery automatically
          await addGalleryImage(
            item.title,
            item.thumbnail || '',
            item.raw.description || '',
            item.raw.type === 'photo' ? 'History' : 'Tradition',
            'approved'
          );
        }
      } else if (item.contentType === 'Gallery') {
        const { error } = await updateGalleryImageStatus(item.id, 'approved');
        if (error) throw error;
      } else if (item.contentType === 'Clan') {
        const ok = await updateClan(item.id, { status: 'approved' });
        if (!ok) throw new Error('Clan update failed');
      } else if (item.contentType === 'Leader') {
        const ok = await updateLeader(item.id, { status: 'approved' });
        if (!ok) throw new Error('Leader update failed');
      } else if (item.contentType === 'Vocabulary') {
        const ok = await updateVocabularyStatus(item.id, 'approved');
        if (!ok) throw new Error('Vocabulary update failed');
      }

      // Clear changes comments upon successful publishing
      localStorage.removeItem(`bakenyi_comments_${item.id}`);

      if (log) {
        logAdminActivity(
          'Elder',
          'Vetting Item Approved',
          `Approved and published ${item.contentType} item: "${item.title}".`,
          'Content',
          'Success',
          item.id
        );
      }
      return true;
    } catch (e) {
      console.error(`Failed to approve ${item.id}:`, e);
      return false;
    }
  };

  const executeRejectAction = async (item: ModerationItem, log = true): Promise<boolean> => {
    try {
      if (item.contentType === 'Article') {
        const { error } = await updateArticle(item.id, { status: 'draft' });
        if (error) throw error;
      } else if (item.contentType === 'Status') {
        const res = await updateStatus(item.id, { status: 'archived' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'News') {
        const res = await updateNews(item.id, { status: 'pending' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'Announcement') {
        const res = await updateAnnouncement(item.id, { status: 'rejected' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'Event') {
        const res = await updateEvent(item.id, { status: 'rejected' });
        if (res.error) throw res.error;
      } else if (item.contentType === 'Contribution') {
        const { error } = await updateContributionStatus(item.id, 'rejected');
        if (error) throw error;
      } else if (item.contentType === 'Gallery') {
        const { error } = await updateGalleryImageStatus(item.id, 'rejected');
        if (error) throw error;
      } else if (item.contentType === 'Clan') {
        const ok = await updateClan(item.id, { status: 'rejected' });
        if (!ok) throw new Error('Clan update failed');
      } else if (item.contentType === 'Leader') {
        const ok = await updateLeader(item.id, { status: 'rejected' });
        if (!ok) throw new Error('Leader update failed');
      } else if (item.contentType === 'Vocabulary') {
        const ok = await updateVocabularyStatus(item.id, 'rejected');
        if (!ok) throw new Error('Vocabulary update failed');
      }

      if (log) {
        logAdminActivity(
          'Elder',
          'Vetting Item Rejected',
          `Rejected ${item.contentType} item: "${item.title}". Reverted to draft/rejected.`,
          'Content',
          'Warning',
          item.id
        );
      }
      return true;
    } catch (e) {
      console.error(`Failed to reject ${item.id}:`, e);
      return false;
    }
  };

  // Quick Action Buttons Handlers
  const handleApproveSingle = async (item: ModerationItem) => {
    setLoading(true);
    const ok = await executeApproveAction(item);
    if (ok) {
      alert(`"${item.title}" approved and published successfully!`);
    } else {
      alert('Approval failed.');
    }
    await loadAllContent();
  };

  const handleRejectSingle = async (item: ModerationItem) => {
    setLoading(true);
    const ok = await executeRejectAction(item);
    if (ok) {
      alert(`"${item.title}" marked as rejected.`);
    } else {
      alert('Rejection failed.');
    }
    await loadAllContent();
  };

  const handleOpenFeedback = () => {
    if (!selectedItem) return;
    setFeedbackText(selectedItem.comments || '');
    setShowFeedbackModal(true);
  };

  const handleRequestChanges = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      // 1. Save comments persistently
      setChangesComments(selectedItem.id, feedbackText);
      
      // 2. Set status to changes_requested
      if (selectedItem.contentType === 'Article') {
        await updateArticle(selectedItem.id, { status: 'draft' as any });
      } else if (selectedItem.contentType === 'Status') {
        await updateStatus(selectedItem.id, { status: 'pending' });
      } else if (selectedItem.contentType === 'News') {
        await updateNews(selectedItem.id, { status: 'pending' });
      } else if (selectedItem.contentType === 'Announcement') {
        await updateAnnouncement(selectedItem.id, { status: 'pending' });
      } else if (selectedItem.contentType === 'Event') {
        await updateEvent(selectedItem.id, { status: 'pending' });
      } else if (selectedItem.contentType === 'Contribution') {
        await updateContributionStatus(selectedItem.id, 'pending');
      } else if (selectedItem.contentType === 'Gallery') {
        await updateGalleryImageStatus(selectedItem.id, 'pending');
      } else if (selectedItem.contentType === 'Clan') {
        await updateClan(selectedItem.id, { status: 'pending' });
      } else if (selectedItem.contentType === 'Leader') {
        await updateLeader(selectedItem.id, { status: 'pending' });
      } else if (selectedItem.contentType === 'Vocabulary') {
        await updateVocabularyStatus(selectedItem.id, 'pending');
      }

      // Increment revisions counter
      incrementRevisions(selectedItem.id);

      // Save custom status changes_requested locally in memory for immediate visual feedback
      localStorage.setItem(`bakenyi_status_override_${selectedItem.id}`, 'changes_requested');

      logAdminActivity(
        'Elder',
        'Changes Requested',
        `Requested changes on ${selectedItem.contentType} "${selectedItem.title}": "${feedbackText.substring(0, 40)}..."`,
        'Content',
        'Warning',
        selectedItem.id
      );

      setShowFeedbackModal(false);
      setFeedbackText('');
      alert('Changes successfully requested. Contributor notified!');
    } catch (e) {
      console.error(e);
      alert('Failed to request changes.');
    } finally {
      await loadAllContent();
    }
  };

  const handleArchiveSingle = async (item: ModerationItem) => {
    setDangerActionConfig({
      isOpen: true,
      title: 'Archive Content',
      description: `Are you sure you want to ARCHIVE "${item.title}"? It will be immediately removed from public view and tucked into draft/archive status.`,
      confirmText: 'Archive Content',
      actionType: 'archive',
      dangerLevel: 'medium',
      onConfirm: async () => {
        setLoading(true);
        try {
          localStorage.setItem(`bakenyi_status_override_${item.id}`, 'archived');
          
          // Call archive/draft transitions
          if (item.contentType === 'Article') {
            await updateArticle(item.id, { status: 'draft' });
          } else if (item.contentType === 'Clan') {
            await updateClan(item.id, { status: 'archived' });
          } else {
            // Fallback update
            await executeRejectAction(item, false);
          }

          logAdminActivity(
            'Elder',
            'Content Archived',
            `Archived ${item.contentType} item: "${item.title}".`,
            'Content',
            'Success',
            item.id
          );
          alert(`"${item.title}" successfully archived.`);
        } catch (e) {
          console.error(e);
        } finally {
          await loadAllContent();
        }
      }
    });
  };

  const handleDeleteSingle = async (item: ModerationItem) => {
    setDangerActionConfig({
      isOpen: true,
      title: 'Permanently Delete Record',
      description: `CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE "${item.title}"? This action is completely irreversible, deletes the entry from the archives database, and cannot be undone.`,
      confirmText: 'Permanently Delete',
      actionType: 'delete',
      dangerLevel: 'critical',
      requireConfirmWord: 'DELETE',
      placeholderConfirmWord: 'Type DELETE to confirm permanent deletion',
      onConfirm: async () => {
        setLoading(true);
        try {
          if (item.contentType === 'Article') {
            await deleteArticle(item.id);
          } else if (item.contentType === 'Status') {
            await deleteStatus(item.id);
          } else if (item.contentType === 'News') {
            await deleteNews(item.id);
          } else if (item.contentType === 'Announcement') {
            await deleteAnnouncement(item.id);
          } else if (item.contentType === 'Event') {
            await deleteEvent(item.id);
          } else if (item.contentType === 'Clan') {
            await deleteClan(item.id);
          } else if (item.contentType === 'Leader') {
            await deleteLeader(item.id);
          }

          logAdminActivity(
            'Elder',
            'Record Permanently Deleted',
            `Permanently deleted ${item.contentType} entry "${item.title}" from archives database.`,
            'Database',
            'Warning',
            item.id
          );
          
          setSelectedItem(null);
          alert('Record successfully purged.');
        } catch (e) {
          console.error(e);
          alert('Purge failed.');
        } finally {
          await loadAllContent();
        }
      }
    });
  };

  const handleFeatureToggle = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      if (selectedItem.contentType === 'News') {
        const curFeatured = selectedItem.raw.featured || false;
        await updateNews(selectedItem.id, { featured: !curFeatured });
        logAdminActivity('Elder', 'News Featured Toggle', `Toggled featured display for "${selectedItem.title}" to [${!curFeatured}].`, 'Content', 'Success', selectedItem.id);
      } else if (selectedItem.contentType === 'Article') {
        // Mock feature toggle
        alert('Article featured state updated!');
      } else {
        alert('Featuring is only available for News & Press articles.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      await loadAllContent();
    }
  };

  const handlePinToggle = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      if (selectedItem.contentType === 'Announcement') {
        const curPinned = selectedItem.raw.pinned || false;
        await updateAnnouncement(selectedItem.id, { pinned: !curPinned });
        logAdminActivity('Elder', 'Announcement Pin Toggle', `Toggled banner pin for announcement "${selectedItem.title}" to [${!curPinned}].`, 'Content', 'Success', selectedItem.id);
      } else {
        alert('Pinning is only applicable for Council Announcements.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      await loadAllContent();
    }
  };

  const handleOpenSchedule = () => {
    if (!selectedItem) return;
    setScheduleDate(selectedItem.scheduledPublishAt || '');
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      setScheduledDate(selectedItem.id, scheduleDate);
      
      logAdminActivity(
        'Elder',
        'Publishing Scheduled',
        `Scheduled publishing for ${selectedItem.contentType} "${selectedItem.title}" on ${new Date(scheduleDate).toLocaleString()}.`,
        'Content',
        'Success',
        selectedItem.id
      );
      
      setShowScheduleModal(false);
      setScheduleDate('');
      alert('Publishing schedule successfully configured!');
    } catch (e) {
      console.error(e);
      alert('Scheduling failed.');
    } finally {
      await loadAllContent();
    }
  };

  // UI Selection Helpers
  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredItems.map(i => i.id);
    if (selectedIds.length === visibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

  // Get specific visual icon based on ContentType
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Article': return <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'News': return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'Status': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'Announcement': return <Megaphone className="w-4 h-4 text-rose-500" />;
      case 'Event': return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'Contribution': return <Volume2 className="w-4 h-4 text-indigo-500" />;
      case 'Gallery': return <ImageIcon className="w-4 h-4 text-teal-500" />;
      case 'Clan': return <Users className="w-4 h-4 text-amber-700" />;
      case 'Leader': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'Vocabulary': return <Languages className="w-4 h-4 text-lime-600" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* 1. Summary Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pending Inbox</span>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-amber-500" /> : metrics.pending}
            </h3>
            <span className="text-[10px] text-slate-400 block font-medium">Elements awaiting Elder approval</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Approved Today</span>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" /> : metrics.approvedToday}
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Successfully published today</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rejected Today</span>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-rose-500" /> : metrics.rejectedToday}
            </h3>
            <span className="text-[10px] text-rose-500 block font-bold">Flagged or returned drafts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <X className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Critical Notices</span>
            <h3 className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-rose-500" /> : metrics.criticalNotice}
            </h3>
            <span className="text-[10px] text-rose-600 block font-bold">Emergency announcements active</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-650/10 text-rose-650 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
        </div>

      </div>

      {/* 2. Filters Console */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Left search */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, submitter, category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-xs font-semibold text-slate-800 dark:text-white"
            />
          </div>

          {/* Core filters */}
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-bold uppercase text-slate-600 dark:text-slate-350 cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Article">Articles</option>
                <option value="News">News</option>
                <option value="Status">Statuses</option>
                <option value="Announcement">Announcements</option>
                <option value="Event">Events</option>
                <option value="Contribution">Contributions</option>
                <option value="Gallery">Gallery Images</option>
                <option value="Clan">Clans</option>
                <option value="Leader">Leaders</option>
                <option value="Vocabulary">Vocabulary</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-bold uppercase text-slate-600 dark:text-slate-350 cursor-pointer"
              >
                <option value="All">All States</option>
                <option value="pending">Pending approval</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="draft">Draft mode</option>
                <option value="changes_requested">Changes Requested</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sort:</span>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none text-[11px] font-bold uppercase text-slate-600 dark:text-slate-350 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
              </select>
            </div>

            <button 
              onClick={loadAllContent}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-750 text-slate-500 transition-colors cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

          </div>
        </div>
      </div>

      {/* 3. Main Split Workspace Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* Left Side: Chronological Queue List (60% width) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/40 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox"
                checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-serif font-black text-slate-900 dark:text-white text-base">Chronological Vetting Backlog</span>
            </div>
            
            <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-3 py-1 rounded-full">
              {filteredItems.length} element{filteredItems.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-750 max-h-[680px] overflow-y-auto scrollbar-thin">
            {filteredItems.map(item => {
              const isSelected = selectedItem?.id === item.id && selectedItem?.contentType === item.contentType;
              const isChecked = selectedIds.includes(item.id);
              
              // Handle custom local overridden status
              let displayStatus = item.status;
              const override = localStorage.getItem(`bakenyi_status_override_${item.id}`);
              if (override) displayStatus = override as any;

              return (
                <div 
                  key={`${item.contentType}-${item.id}`}
                  onClick={() => setSelectedItem(item)}
                  className={`p-5 flex items-start gap-4 transition-all cursor-pointer select-none group relative ${
                    isSelected 
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-amber-500' 
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-750/15 border-l-4 border-transparent'
                  }`}
                >
                  
                  {/* Select Checkbox */}
                  <div 
                    onClick={(e) => toggleSelectRow(item.id, e)}
                    className="pt-1"
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="rounded border-slate-300 dark:border-slate-750 text-indigo-650"
                    />
                  </div>

                  {/* Thumbnail / Visual */}
                  <div className="relative w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {item.thumbnail ? (
                      <img 
                        src={item.thumbnail} 
                        alt="visual" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      getTypeIcon(item.contentType)
                    )}
                  </div>

                  {/* Text details */}
                  <div className="min-w-0 flex-1 space-y-1.5 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 flex items-center gap-1 shrink-0">
                        {getTypeIcon(item.contentType)}
                        <span>{item.contentType}</span>
                      </span>
                      
                      {item.priority && (
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 rounded shrink-0 ${
                          item.priority === 'emergency' 
                            ? 'bg-rose-500 text-white animate-pulse' 
                            : item.priority === 'high' 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.priority}
                        </span>
                      )}

                      {displayStatus === 'changes_requested' && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 rounded bg-amber-100 text-amber-800 shrink-0 border border-amber-200/40">
                          Changes Requested (v{item.revisions})
                        </span>
                      )}

                      {displayStatus === 'archived' && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 rounded bg-slate-100 text-slate-500 shrink-0">
                          Archived
                        </span>
                      )}

                      {item.scheduledPublishAt && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 rounded bg-sky-100 text-sky-800 shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Scheduled</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-black text-slate-900 dark:text-white text-xs md:text-sm line-clamp-1 leading-tight group-hover:text-amber-600 transition-colors">
                      {item.title || 'Untitled Archive'}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-semibold text-slate-400">
                      <span>By: <strong className="text-slate-600 dark:text-slate-350">{item.submittedBy}</strong></span>
                      <span>•</span>
                      <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()} at {new Date(item.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>

                  {/* Indicator Arrow */}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-all shrink-0 mt-3" />

                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="p-16 text-center space-y-4 bg-slate-50/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-serif font-bold text-slate-800 dark:text-white text-base">Workspace Clean & Vetted!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No records matching the selected Content Type, Status State or search text require Elder vettings right now. Enjoy the serenity!
                </p>
              </div>
            )}
          </div>

          {/* Bulk actions sticky panel */}
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4 border-t border-slate-800 select-none sticky bottom-0 z-20"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Selected <strong>{selectedIds.length}</strong> items for bulk operations</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-white"
                >
                  Bulk Approve & Publish
                </button>
                <button 
                  onClick={handleBulkReject}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-white"
                >
                  Bulk Reject
                </button>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Side: Interactive Quick Preview Panel (40% width) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div 
                key={selectedItem.id + selectedItem.contentType}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-md p-6 space-y-6 text-left relative overflow-hidden"
              >
                
                {/* Visual Accent */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />

                {/* Subtitle / Label */}
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/40 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                      {getTypeIcon(selectedItem.contentType)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {selectedItem.contentType} Preview Panel
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content visual card */}
                <div className="space-y-4">
                  
                  {/* Headline */}
                  <h3 className="font-serif font-black text-slate-900 dark:text-white text-base md:text-lg leading-snug">
                    {selectedItem.title}
                  </h3>

                  {/* Metadata list */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-750 text-[11px] font-semibold text-slate-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Submitted By:</span>
                      <strong className="text-slate-800 dark:text-white">{selectedItem.submittedBy}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted At:</span>
                      <strong className="text-slate-800 dark:text-white">
                        {new Date(selectedItem.submittedAt).toLocaleString()}
                      </strong>
                    </div>
                    {selectedItem.category && (
                      <div className="flex justify-between">
                        <span>Category / Group:</span>
                        <strong className="text-slate-800 dark:text-white uppercase tracking-wider">{selectedItem.category}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Review Iteration:</span>
                      <strong className="text-slate-800 dark:text-white">v{selectedItem.revisions} (Revision)</strong>
                    </div>
                    {selectedItem.comments && (
                      <div className="pt-2 border-t border-slate-150 dark:border-slate-750">
                        <span className="text-amber-600 font-bold uppercase tracking-wider block mb-1">Previous Feedback Comments:</span>
                        <p className="text-[10px] text-slate-600 dark:text-slate-350 italic leading-relaxed font-mono">
                          "{selectedItem.comments}"
                        </p>
                      </div>
                    )}
                    {selectedItem.scheduledPublishAt && (
                      <div className="pt-2 border-t border-sky-150 text-sky-600 font-bold uppercase tracking-wider flex justify-between">
                        <span>Scheduled Publish:</span>
                        <span>{new Date(selectedItem.scheduledPublishAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Complete content display block */}
                  <div className="border border-slate-100 dark:border-slate-750 p-4 rounded-2xl max-h-[300px] overflow-y-auto bg-slate-50/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans space-y-3 scrollbar-thin">
                    
                    {/* Media attachments */}
                    {selectedItem.thumbnail && (
                      <img 
                        src={selectedItem.thumbnail} 
                        alt="attachment" 
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 mb-2" 
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* STATUS Entry Specifics */}
                    {selectedItem.contentType === 'Status' && (
                      <p className="font-bold text-sm text-slate-800 dark:text-white font-serif">"{selectedItem.raw.text}"</p>
                    )}

                    {/* NEWS Entry Specifics */}
                    {selectedItem.contentType === 'News' && (
                      <div className="space-y-2">
                        {selectedItem.raw.summary && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 border-indigo-500 italic">
                            {selectedItem.raw.summary}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap font-semibold">{selectedItem.raw.content}</p>
                      </div>
                    )}

                    {/* ARTICLE Entry Specifics */}
                    {selectedItem.contentType === 'Article' && (
                      <div className="space-y-2">
                        {selectedItem.raw.excerpt && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 border-emerald-500 italic">
                            {selectedItem.raw.excerpt}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap font-semibold">{selectedItem.raw.content}</p>
                      </div>
                    )}

                    {/* ANNOUNCEMENT Entry Specifics */}
                    {selectedItem.contentType === 'Announcement' && (
                      <p className="whitespace-pre-wrap font-bold text-sm text-slate-800 dark:text-white font-serif">"{selectedItem.raw.message}"</p>
                    )}

                    {/* EVENT Entry Specifics */}
                    {selectedItem.contentType === 'Event' && (
                      <div className="space-y-2 font-semibold">
                        <p>{selectedItem.raw.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-100/50 p-2.5 rounded-lg font-mono">
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-500" /> Venue: {selectedItem.raw.location}</div>
                          <div>Organizer: {selectedItem.raw.organizer}</div>
                          <div>Start: {new Date(selectedItem.raw.start_datetime).toLocaleString()}</div>
                          <div>End: {new Date(selectedItem.raw.end_datetime).toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    {/* CONTRIBUTION Entry Specifics */}
                    {selectedItem.contentType === 'Contribution' && (
                      <div className="space-y-2">
                        <p>{selectedItem.raw.description}</p>
                        {selectedItem.raw.type === 'audio' && selectedItem.raw.imageUrl && (
                          <audio src={selectedItem.raw.imageUrl} controls className="w-full mt-2" />
                        )}
                      </div>
                    )}

                    {/* CLAN Entry Specifics */}
                    {selectedItem.contentType === 'Clan' && (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 rounded-xl font-semibold">
                          Motto: {selectedItem.raw.motto || 'No registered motto statement'}
                        </div>
                        <p><strong>Origins:</strong> {selectedItem.raw.origin || 'No Origin story registered'}</p>
                        <p><strong>History:</strong> {selectedItem.raw.history || 'No custom historical log registered'}</p>
                      </div>
                    )}

                    {/* LEADER Entry Specifics */}
                    {selectedItem.contentType === 'Leader' && (
                      <div className="space-y-2">
                        <p className="font-bold text-amber-600 uppercase tracking-widest">{selectedItem.raw.role}</p>
                        <p><strong>Cultural Biography:</strong> {selectedItem.raw.bio}</p>
                        <p><strong>Expertise Areas:</strong> {selectedItem.raw.expertise}</p>
                      </div>
                    )}

                    {/* VOCABULARY Entry Specifics */}
                    {selectedItem.contentType === 'Vocabulary' && (
                      <div className="space-y-2">
                        <p className="text-base font-bold text-slate-800 dark:text-white font-mono">Lukenye Spelled: {selectedItem.raw.lukenye}</p>
                        <p className="text-sm">English Translation: {selectedItem.raw.english}</p>
                        <p className="italic">Usage Definition: {selectedItem.raw.usage || 'No registered translation usage'}</p>
                        {selectedItem.raw.example_sentence && (
                          <p className="p-2 bg-slate-100 rounded-lg">Example Sentence: "{selectedItem.raw.example_sentence}"</p>
                        )}
                      </div>
                    )}

                    {/* Fallback description */}
                    {!['Status', 'News', 'Article', 'Announcement', 'Event', 'Contribution', 'Clan', 'Leader', 'Vocabulary'].includes(selectedItem.contentType) && (
                      <p>{selectedItem.raw.description || selectedItem.raw.content || 'No detailed text available'}</p>
                    )}

                  </div>

                </div>

                {/* Moderation actions console */}
                <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-700/40">
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleApproveSingle(selectedItem)}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider py-3 rounded-2xl cursor-pointer transition-colors shadow-md shadow-emerald-600/10"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Publish</span>
                    </button>
                    
                    <button 
                      onClick={() => handleRejectSingle(selectedItem)}
                      className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-[11px] font-black uppercase tracking-wider py-3 rounded-2xl cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={handleOpenFeedback}
                      className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-750 cursor-pointer"
                      title="Request changes with comments"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-amber-500" />
                      <span>Request Changes</span>
                    </button>

                    <button 
                      onClick={() => handleArchiveSingle(selectedItem)}
                      className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-750 cursor-pointer"
                      title="Archive from public views"
                    >
                      <Archive className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Archive</span>
                    </button>

                    <button 
                      onClick={() => handleDeleteSingle(selectedItem)}
                      className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors border border-rose-200/20 cursor-pointer"
                      title="Permanently Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge</span>
                    </button>
                  </div>

                  {/* Advanced Toggles Bar */}
                  <div className="pt-2 flex flex-wrap gap-2 items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-50 dark:border-slate-700/20">
                    
                    {/* Features & Pinning */}
                    <div className="flex gap-2">
                      {selectedItem.contentType === 'News' && (
                        <button 
                          onClick={handleFeatureToggle}
                          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectedItem.raw.featured 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${selectedItem.raw.featured ? 'fill-current' : ''}`} />
                          <span>{selectedItem.raw.featured ? 'Featured' : 'Feature'}</span>
                        </button>
                      )}

                      {selectedItem.contentType === 'Announcement' && (
                        <button 
                          onClick={handlePinToggle}
                          className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            selectedItem.raw.pinned 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{selectedItem.raw.pinned ? 'Pinned' : 'Pin Announcement'}</span>
                        </button>
                      )}
                    </div>

                    {/* Schedule option */}
                    <button 
                      onClick={handleOpenSchedule}
                      className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200 dark:border-slate-755 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer text-slate-500 dark:text-slate-400`}
                    >
                      <Clock className="w-3 h-3 text-sky-500" />
                      <span>{selectedItem.scheduledPublishAt ? 'Reschedule' : 'Schedule Publish'}</span>
                    </button>

                  </div>

                </div>

              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-xs h-72 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                  <Eye className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-slate-800 dark:text-white text-sm">Interactive Preview Hub</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                    Select any cultural element in the chronological queue to open its complete content records, view media players, and initiate moderation review workflows.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 4. Request Changes Comments Modal */}
      {showFeedbackModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-[28px] max-w-md w-full p-6 space-y-4 text-left border border-slate-100 dark:border-slate-700 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-serif font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <CornerDownRight className="w-5 h-5 text-amber-500" />
                <span>Provide Revision Comments (v{selectedItem.revisions})</span>
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Your comments will be sent directly to the contributor of this <strong>{selectedItem.contentType}</strong> element. They will receive revision guidelines to modify their draft.
            </p>

            <textarea 
              rows={4}
              required
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="e.g. Please clarify the seasonal timeline for canoe stitchings and mention Mukasa's lineage if available..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-xs font-semibold text-slate-800 dark:text-white leading-relaxed"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestChanges}
                disabled={!feedbackText.trim()}
                className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Submit Comments
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. Schedule Publish Modal */}
      {showScheduleModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-[28px] max-w-sm w-full p-6 space-y-4 text-left border border-slate-100 dark:border-slate-700 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-serif font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-sky-500" />
                <span>Configure Future Publishing</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Select the future date and time when this <strong>{selectedItem.contentType}</strong> item should automatically transition to public view.
            </p>

            <input 
              type="datetime-local"
              required
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl outline-none text-xs font-semibold text-slate-800 dark:text-white"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => {
                  setScheduledDate(selectedItem.id, '');
                  setShowScheduleModal(false);
                  loadAllContent();
                }}
                className="px-3 py-2 text-rose-500 text-xs font-bold uppercase mr-auto cursor-pointer"
              >
                Clear Schedule
              </button>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSchedule}
                disabled={!scheduleDate}
                className="px-4 py-2 bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Apply Schedule
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {dangerActionConfig && (
        <DangerAction
          {...dangerActionConfig}
          onClose={() => setDangerActionConfig(null)}
        />
      )}

    </div>
  );
}
