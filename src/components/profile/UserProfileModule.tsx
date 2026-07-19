import React, { useState, useEffect } from 'react';
import { getSupabase } from '../../lib/supabaseClient';
import { 
  User, 
  Shield, 
  Mail, 
  Calendar, 
  Activity, 
  CheckCircle, 
  SlidersHorizontal, 
  Bell, 
  Clock, 
  Bookmark, 
  Check, 
  Edit3, 
  Save, 
  Award,
  BookOpen,
  Mic,
  Camera,
  AlertCircle,
  Facebook,
  Send,
  MessageSquare,
  Globe,
  Link
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  category: string;
}

export default function UserProfileModule({ user }: { user: any }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferredDialect, setPreferredDialect] = useState('Lukenye Standard');
  const [notifPref, setNotifPref] = useState({
    articles: true,
    exhibitions: true,
    events: true,
    announcements: true
  });

  // Dynamic Statistics
  const [stats, setStats] = useState({
    savedItems: 0,
    oralHistories: 0,
    articlesContributed: 0,
    forumPosts: 0
  });

  // Recent activity log
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // Social links states
  const [socialWhatsApp, setSocialWhatsApp] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');
  const [urlErrors, setUrlErrors] = useState<{ [key: string]: string }>({});

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
  ];

  useEffect(() => {
    if (!user) return;
    loadProfileAndData();
  }, [user]);

  const loadProfileAndData = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabase();
      let profileData: UserProfile | null = null;

      if (client) {
        // Query profiles table directly
        const { data, error: fetchErr } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (data) {
          profileData = {
            id: data.id,
            email: data.email || user.email || '',
            role: data.role || 'member',
            status: data.status || 'active',
            created_at: data.created_at || user.created_at || new Date().toISOString(),
            full_name: data.full_name || data.name || '',
            avatar_url: data.avatar_url || ''
          };
        }
      }

      // Local storage/fallback logic if no database record exists or client is offline
      if (!profileData) {
        const storedProfile = localStorage.getItem(`bakenye_profile_${user.id}`);
        if (storedProfile) {
          profileData = JSON.parse(storedProfile);
        } else {
          profileData = {
            id: user.id,
            email: user.email || '',
            role: 'member',
            status: 'active',
            created_at: user.created_at || new Date().toISOString(),
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || ''
          };
          localStorage.setItem(`bakenye_profile_${user.id}`, JSON.stringify(profileData));
        }
      }

      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setAvatarUrl(profileData.avatar_url || avatarPresets[0]);

      // Load preferences from localStorage
      const localDialect = localStorage.getItem(`bakenyi_pref_dialect_${user.id}`);
      if (localDialect) setPreferredDialect(localDialect);

      const localNotif = localStorage.getItem(`bakenyi_pref_notif_${user.id}`);
      if (localNotif) {
        setNotifPref(JSON.parse(localNotif));
      }

      // Load social links from localStorage
      try {
        const storedSocial = localStorage.getItem(`bakenyi_social_links_${user.id}`);
        if (storedSocial) {
          const links = JSON.parse(storedSocial);
          setSocialWhatsApp(links.whatsapp || '');
          setSocialTelegram(links.telegram || '');
          setSocialFacebook(links.facebook || '');
          setSocialX(links.x || '');
          setSocialWebsite(links.website || '');
        }
      } catch (err) {
        console.warn('Failed to parse social links:', err);
      }

      // Calculate dynamic statistics
      // 1. Saved items count
      const saved = JSON.parse(localStorage.getItem('bakenyi_saved_items') || '[]');
      
      // 2. Oral histories recorded by user
      let oralCount = 0;
      if (client) {
        const { count, error: countErr } = await client
          .from('oral_history')
          .select('*', { count: 'exact', head: true })
          .eq('narrator_id', user.id);
        if (!countErr && count !== null) oralCount = count;
      }

      // 3. Articles contributed by user
      let contribCount = 0;
      if (client) {
        const { count, error: contribErr } = await client
          .from('heritage_articles')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
        if (!contribErr && count !== null) contribCount = count;
      }

      setStats({
        savedItems: saved.length,
        oralHistories: oralCount || Number(localStorage.getItem(`bakenye_recorded_count_${user.id}`) || '0'),
        articlesContributed: contribCount || Number(localStorage.getItem(`bakenye_articles_count_${user.id}`) || '0'),
        forumPosts: Number(localStorage.getItem(`bakenye_forum_count_${user.id}`) || '0')
      });

      // Construct recent activity log dynamically
      const activityLog: RecentActivity[] = [];
      if (saved.length > 0) {
        activityLog.push({
          id: 'act-1',
          type: 'bookmark',
          title: `Saved "${saved[0].title}" to personal heritage space`,
          timestamp: 'Recently',
          category: 'My Heritage'
        });
      }
      activityLog.push({
        id: 'act-2',
        type: 'auth',
        title: 'Logged in to Bakenye Heritage Platform',
        timestamp: 'Just now',
        category: 'Security'
      });

      // If they have completed recordings or articles, show them
      const hasRecordings = Number(localStorage.getItem(`bakenye_recorded_count_${user.id}`) || '0') > 0;
      if (hasRecordings) {
        activityLog.unshift({
          id: 'act-3',
          type: 'recording',
          title: 'Recorded a new Oral History narration',
          timestamp: '1 day ago',
          category: 'Oral History'
        });
      }

      setActivities(activityLog);

    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setError('Failed to load profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validate social URLs
    const errors: { [key: string]: string } = {};
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;

    if (socialTelegram && !socialTelegram.startsWith('https://t.me/') && !urlPattern.test(socialTelegram)) {
      errors.telegram = 'Please enter a valid Telegram URL or t.me link.';
    }
    if (socialFacebook && !socialFacebook.startsWith('https://facebook.com/') && !urlPattern.test(socialFacebook)) {
      errors.facebook = 'Please enter a valid Facebook URL.';
    }
    if (socialX && !socialX.startsWith('https://x.com/') && !socialX.startsWith('https://twitter.com/') && !urlPattern.test(socialX)) {
      errors.x = 'Please enter a valid X / Twitter URL.';
    }
    if (socialWebsite && !urlPattern.test(socialWebsite)) {
      errors.website = 'Please enter a valid website URL.';
    }

    if (Object.keys(errors).length > 0) {
      setUrlErrors(errors);
      setError('Some social links have invalid URL formats.');
      setSaving(false);
      return;
    }

    setUrlErrors({});
    const linksObj = {
      whatsapp: socialWhatsApp,
      telegram: socialTelegram,
      facebook: socialFacebook,
      x: socialX,
      website: socialWebsite
    };
    localStorage.setItem(`bakenyi_social_links_${user.id}`, JSON.stringify(linksObj));

    try {
      const client = getSupabase();
      const updatedProfile = {
        ...profile!,
        full_name: fullName,
        avatar_url: avatarUrl
      };

      if (client) {
        const { error: updateErr } = await client
          .from('profiles')
          .update({
            full_name: fullName,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateErr) throw updateErr;
      }

      // Cache locally
      localStorage.setItem(`bakenye_profile_${user.id}`, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      // Save preferences to local storage
      localStorage.setItem(`bakenyi_pref_dialect_${user.id}`, preferredDialect);
      localStorage.setItem(`bakenyi_pref_notif_${user.id}`, JSON.stringify(notifPref));

      // Trigger user feedback
      setSuccess('Profile and preferences updated successfully!');
      
      // Append to activities
      setActivities(prev => [
        {
          id: `act-${Date.now()}`,
          type: 'update',
          title: 'Updated profile details and account settings',
          timestamp: 'Just now',
          category: 'Account'
        },
        ...prev
      ]);

      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Make sure you have permission to edit your own profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-heritage-terracotta/20 border-t-heritage-terracotta rounded-full animate-spin" />
        <p className="text-xs text-heritage-brown/60 font-bold uppercase tracking-wider mt-4">
          Opening secure profile...
        </p>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Elder & Council Admin',
    admin: 'Heritage Administrator',
    historian: 'Digital Historian',
    community_leader: 'Community Elder Representative',
    member: 'Registered Clan Member',
    reporter: 'Cultural Council Reporter'
  };

  return (
    <div id="user_profile_module" className="space-y-8 text-left">
      {/* Notifications Alert banner */}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-fade-in shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Avatar & Overview Card */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-heritage-terracotta via-amber-500 to-heritage-olive" />
          
          <div className="relative mt-4">
            <img 
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
              alt={fullName || 'User avatar'}
              className="w-28 h-28 rounded-full object-cover border-4 border-heritage-terracotta shadow-md transition-all hover:scale-105"
            />
            <div className="absolute bottom-1 right-1 bg-heritage-brown text-white p-2 rounded-full shadow-lg border border-heritage-cream" title={`Verified Role: ${profile?.role}`}>
              <Shield className="w-4 h-4 text-heritage-sand" />
            </div>
          </div>

          <h3 className="font-serif font-black text-lg text-heritage-brown dark:text-white mt-4">
            {fullName || 'Bakenyi Explorer'}
          </h3>
          <span className="px-3 py-1 rounded-full bg-heritage-terracotta/10 border border-heritage-terracotta/20 text-heritage-terracotta text-[10px] font-black uppercase tracking-wider mt-2">
            {roleLabels[profile?.role || 'member'] || 'Registered Clan Member'}
          </span>

          <div className="w-full mt-6 space-y-3 pt-5 border-t border-heritage-brown/5 text-left text-xs font-medium text-heritage-brown/70 dark:text-stone-300">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-heritage-terracotta" />
              <span className="truncate">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-heritage-olive" />
              <span>Registered {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'September 2023'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Security isolating context</span>
            </div>
          </div>

          {/* Configured Social Platforms list */}
          {(socialWhatsApp || socialTelegram || socialFacebook || socialX || socialWebsite) && (
            <div className="w-full mt-5 pt-4 border-t border-heritage-brown/5 text-left">
              <span className="text-[10px] font-black uppercase text-heritage-brown/40 dark:text-stone-500 block mb-2 tracking-wider">
                Configured Socials
              </span>
              <div className="flex flex-wrap gap-2">
                {socialWhatsApp && (
                  <a
                    href={socialWhatsApp.startsWith('http') ? socialWhatsApp : `https://wa.me/${socialWhatsApp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                    title="WhatsApp Connection"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                )}
                {socialTelegram && (
                  <a
                    href={socialTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-sky-500 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                    title="Telegram Channel"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
                {socialFacebook && (
                  <a
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-600 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                    title="Facebook Profile"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {socialX && (
                  <a
                    href={socialX}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                    title="X / Twitter Feed"
                  >
                    <Link className="w-4 h-4" />
                  </a>
                )}
                {socialWebsite && (
                  <a
                    href={socialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer"
                    title="Personal Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Preset Avatar Selection list */}
          <div className="mt-8 pt-5 border-t border-heritage-brown/5 w-full">
            <span className="text-[10px] font-black uppercase text-heritage-brown/40 dark:text-stone-500 block mb-3 text-left tracking-wider">
              Change Profile Avatar:
            </span>
            <div className="flex gap-2 justify-center">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(preset);
                    setSuccess('Avatar updated! Save profile to store changes.');
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-110 ${
                    avatarUrl === preset ? 'border-heritage-terracotta ring-4 ring-heritage-terracotta/15 scale-105 shadow-md' : 'border-transparent'
                  }`}
                >
                  <img src={preset} className="w-full h-full object-cover" alt={`Preset avatar ${idx}`} />
                </button>
              ))}
            </div>
            {/* Input field for custom image url */}
            <div className="mt-4">
              <input 
                type="text" 
                placeholder="Or paste direct image URL..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-heritage-cream dark:bg-stone-950 border border-heritage-brown/15 dark:border-stone-800 rounded-lg px-3 py-2 text-[11px] text-heritage-brown dark:text-white font-medium focus:outline-none focus:border-heritage-terracotta"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Edit Settings and Activity */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Bento Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'stat-saved', label: 'Saved Items', value: stats.savedItems, icon: Bookmark, color: 'text-heritage-terracotta bg-heritage-terracotta/10' },
              { id: 'stat-recorded', label: 'Oral Records', value: stats.oralHistories, icon: Mic, color: 'text-heritage-olive bg-heritage-olive/10' },
              { id: 'stat-contrib', label: 'Articles Written', value: stats.articlesContributed, icon: BookOpen, color: 'text-amber-600 bg-amber-500/10' },
              { id: 'stat-awards', label: 'Achievements', value: Math.max(1, stats.savedItems + stats.oralHistories), icon: Award, color: 'text-purple-600 bg-purple-500/10' }
            ].map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className={`p-2.5 rounded-xl shrink-0 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-heritage-brown/40 dark:text-stone-500 uppercase tracking-wide block">
                    {stat.label}
                  </span>
                  <span className="text-lg font-serif font-black text-heritage-brown dark:text-white mt-0.5 block">
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-5 pb-2 border-b border-heritage-brown/5 dark:border-stone-800 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-heritage-terracotta" />
              <span>Modify Personal Credentials</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown dark:text-stone-300 block mb-2">
                    Display Name / Alias
                  </label>
                  <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Elder Joseph Ogwang"
                    className="w-full bg-heritage-cream dark:bg-stone-950 border border-heritage-brown/15 dark:border-stone-800 rounded-xl px-4 py-3 text-xs text-heritage-brown dark:text-white font-extrabold focus:outline-none focus:border-heritage-terracotta"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-heritage-brown dark:text-stone-300 block mb-2">
                    Dialect Branch Preference
                  </label>
                  <select
                    value={preferredDialect}
                    onChange={(e) => setPreferredDialect(e.target.value)}
                    className="w-full bg-heritage-cream dark:bg-stone-950 border border-heritage-brown/15 dark:border-stone-800 rounded-xl px-4 py-3 text-xs text-heritage-brown dark:text-white font-extrabold focus:outline-none focus:border-heritage-terracotta cursor-pointer"
                  >
                    <option value="Lukenye Standard">Lukenye Standard (Central Preserves)</option>
                    <option value="Riverine Kyoga Dialect">Riverine Kyoga Dialect (Regional Branch)</option>
                    <option value="Riparian Marshlands Dialect">Riparian Marshlands Dialect</option>
                  </select>
                </div>
              </div>

              {/* Social Connectivity Network */}
              <div className="bg-heritage-brown/5 dark:bg-stone-950 p-5 rounded-2xl border border-heritage-brown/5 space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-heritage-brown dark:text-heritage-sand flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-heritage-terracotta" />
                  <span>Social Presence Networks</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-heritage-brown/60 dark:text-stone-400 block mb-1">
                      WhatsApp Number / Link
                    </label>
                    <input
                      type="text"
                      value={socialWhatsApp}
                      onChange={(e) => setSocialWhatsApp(e.target.value)}
                      placeholder="E.g. +256700000000"
                      className="w-full bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-heritage-brown dark:text-white font-semibold focus:outline-none focus:border-heritage-terracotta"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-heritage-brown/60 dark:text-stone-400 block mb-1">
                      Telegram URL
                    </label>
                    <input
                      type="text"
                      value={socialTelegram}
                      onChange={(e) => setSocialTelegram(e.target.value)}
                      placeholder="E.g. https://t.me/username"
                      className={`w-full bg-white dark:bg-stone-900 border rounded-xl px-3.5 py-2.5 text-xs text-heritage-brown dark:text-white font-semibold focus:outline-none focus:border-heritage-terracotta ${
                        urlErrors.telegram ? 'border-rose-500' : 'border-heritage-brown/10 dark:border-stone-800'
                      }`}
                    />
                    {urlErrors.telegram && (
                      <span className="text-[9px] text-rose-500 block mt-1">{urlErrors.telegram}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-heritage-brown/60 dark:text-stone-400 block mb-1">
                      Facebook URL
                    </label>
                    <input
                      type="text"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      placeholder="E.g. https://facebook.com/username"
                      className={`w-full bg-white dark:bg-stone-900 border rounded-xl px-3.5 py-2.5 text-xs text-heritage-brown dark:text-white font-semibold focus:outline-none focus:border-heritage-terracotta ${
                        urlErrors.facebook ? 'border-rose-500' : 'border-heritage-brown/10 dark:border-stone-800'
                      }`}
                    />
                    {urlErrors.facebook && (
                      <span className="text-[9px] text-rose-500 block mt-1">{urlErrors.facebook}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-heritage-brown/60 dark:text-stone-400 block mb-1">
                      X / Twitter URL
                    </label>
                    <input
                      type="text"
                      value={socialX}
                      onChange={(e) => setSocialX(e.target.value)}
                      placeholder="E.g. https://x.com/username"
                      className={`w-full bg-white dark:bg-stone-900 border rounded-xl px-3.5 py-2.5 text-xs text-heritage-brown dark:text-white font-semibold focus:outline-none focus:border-heritage-terracotta ${
                        urlErrors.x ? 'border-rose-500' : 'border-heritage-brown/10 dark:border-stone-800'
                      }`}
                    />
                    {urlErrors.x && (
                      <span className="text-[9px] text-rose-500 block mt-1">{urlErrors.x}</span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-black uppercase text-heritage-brown/60 dark:text-stone-400 block mb-1">
                      Personal Website URL
                    </label>
                    <input
                      type="text"
                      value={socialWebsite}
                      onChange={(e) => setSocialWebsite(e.target.value)}
                      placeholder="E.g. https://example.com"
                      className={`w-full bg-white dark:bg-stone-900 border rounded-xl px-3.5 py-2.5 text-xs text-heritage-brown dark:text-white font-semibold focus:outline-none focus:border-heritage-terracotta ${
                        urlErrors.website ? 'border-rose-500' : 'border-heritage-brown/10 dark:border-stone-800'
                      }`}
                    />
                    {urlErrors.website && (
                      <span className="text-[9px] text-rose-500 block mt-1">{urlErrors.website}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alerts Channels */}
              <div className="bg-heritage-brown/5 dark:bg-stone-950 p-5 rounded-2xl border border-heritage-brown/5 space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-heritage-brown dark:text-heritage-sand flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-heritage-terracotta" />
                  <span>Dispatch Alert Subscriptions</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'articles', label: 'New Historical Chronicles' },
                    { key: 'exhibitions', label: 'Exhibitions & Digital Galleries' },
                    { key: 'events', label: 'Assembly & Council Gatherings' },
                    { key: 'announcements', label: 'Council Notices & Dispatches' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 rounded-xl cursor-pointer select-none">
                      <span className="text-[11px] font-bold text-heritage-brown/80 dark:text-stone-300">{item.label}</span>
                      <input 
                        type="checkbox"
                        checked={notifPref[item.key as keyof typeof notifPref]}
                        onChange={(e) => setNotifPref(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="accent-heritage-terracotta cursor-pointer w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-heritage-brown/10 dark:border-stone-800">
                <p className="text-[10px] text-heritage-brown/50 dark:text-stone-500 font-semibold max-w-sm">
                  *Changes will update your session and persist across all regional devices securely.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-heritage-terracotta hover:bg-heritage-brown text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-55"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown dark:text-heritage-sand mb-4 pb-2 border-b border-heritage-brown/5 dark:border-stone-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-heritage-olive" />
              <span>Personal Activity Archives</span>
            </h3>

            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3.5 p-3 rounded-2xl bg-heritage-cream/15 dark:bg-stone-950/40 border border-heritage-brown/5">
                  <div className="p-2 bg-white dark:bg-stone-900 border border-heritage-brown/5 rounded-xl shrink-0">
                    <Clock className="w-3.5 h-3.5 text-heritage-terracotta" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-heritage-brown/5 dark:bg-stone-800 text-heritage-brown dark:text-heritage-sand rounded-full">
                        {act.category}
                      </span>
                      <span className="text-[10px] text-heritage-brown/40 dark:text-stone-500 font-bold">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-heritage-brown dark:text-stone-200">
                      {act.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
