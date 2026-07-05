export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  category: 'Security' | 'Content' | 'Database' | 'Roles' | 'Media';
  status: 'Success' | 'Warning' | 'Error';
  recordId?: string;
}

export interface PlatformNotification {
  id: string;
  title: string;
  desc: string;
  timestamp: string;
  type: 'user' | 'content' | 'media' | 'role' | 'approval';
  read: boolean;
  targetId?: string;
}

// Global Operations Event for reactive UI updates
const OPERATIONS_EVENT = 'bakenye_operations_updated';

export function triggerOperationsUpdate() {
  window.dispatchEvent(new CustomEvent(OPERATIONS_EVENT));
}

// ----------------------------------------------------
// AUDIT LOGS SERVICES
// ----------------------------------------------------
export function getAuditLogs(): AuditLog[] {
  const stored = localStorage.getItem('bakenye_activity_logs');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing activity logs:', e);
    }
  }
  return [];
}

export function logAdminActivity(
  actor: string,
  action: string,
  details: string,
  category: AuditLog['category'],
  status: AuditLog['status'],
  recordId?: string
): AuditLog {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    category,
    status,
    recordId
  };
  
  logs.unshift(newLog);
  localStorage.setItem('bakenye_activity_logs', JSON.stringify(logs));
  triggerOperationsUpdate();
  return newLog;
}

// ----------------------------------------------------
// NOTIFICATIONS SERVICES
// ----------------------------------------------------
export function getNotifications(): PlatformNotification[] {
  const stored = localStorage.getItem('bakenye_notifications');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing notifications:', e);
    }
  }
  
  // Seed initial high-quality notification center alerts
  const initial: PlatformNotification[] = [
    {
      id: 'not_001',
      title: 'New Registrant Verification Required',
      desc: 'sarah.nak@example.com is pending review for role designation.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
      type: 'user',
      read: false,
      targetId: 'usr-2'
    },
    {
      id: 'not_002',
      title: 'Heritage Content Submitted for Review',
      desc: '"The Canoe Crafts of Paliisa" submitted by staff editor.',
      timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(), // 2h ago
      type: 'content',
      read: false,
      targetId: 'art-draft-1'
    },
    {
      id: 'not_003',
      title: 'Vetting Required: Private Media Attachment',
      desc: 'New artifact photo "traditional_canoe_bow.jpg" uploaded to storage bucket.',
      timestamp: new Date(Date.now() - 1000 * 3600 * 4).toISOString(), // 4h ago
      type: 'media',
      read: false,
      targetId: 'media-pending-1'
    }
  ];
  localStorage.setItem('bakenye_notifications', JSON.stringify(initial));
  return initial;
}

export function addNotification(
  title: string,
  desc: string,
  type: PlatformNotification['type'],
  targetId?: string
): PlatformNotification {
  const notifications = getNotifications();
  const newNotif: PlatformNotification = {
    id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    desc,
    timestamp: new Date().toISOString(),
    type,
    read: false,
    targetId
  };
  
  notifications.unshift(newNotif);
  localStorage.setItem('bakenye_notifications', JSON.stringify(notifications));
  triggerOperationsUpdate();
  return newNotif;
}

export function markNotificationAsRead(id: string) {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    localStorage.setItem('bakenye_notifications', JSON.stringify(notifications));
    triggerOperationsUpdate();
  }
}

export function markAllNotificationsRead() {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('bakenye_notifications', JSON.stringify(updated));
  triggerOperationsUpdate();
}

export function clearNotifications() {
  localStorage.setItem('bakenye_notifications', JSON.stringify([]));
  triggerOperationsUpdate();
}
