import { GovernancePage, ContentItem, PageAuditLog } from './types';

export const WEBPAGES: GovernancePage[] = [
  { id: 'overview', label: 'Overview', category: 'General', icon: 'Activity' },
  
  // Home Pages
  { id: 'home-hero', label: 'Hero Section', parent: 'home', category: 'Home', icon: 'Sparkles' },
  { id: 'home-featured', label: 'Featured Heritage', parent: 'home', category: 'Home', icon: 'BookOpen' },
  { id: 'home-activity', label: 'Homepage Activity', parent: 'home', category: 'Home', icon: 'Activity' },
  
  // About Pages
  { id: 'about-origin', label: 'Origin', parent: 'about', category: 'About', icon: 'Compass' },
  { id: 'about-culture', label: 'Culture', parent: 'about', category: 'About', icon: 'Globe' },
  { id: 'about-traditions', label: 'Traditions', parent: 'about', category: 'About', icon: 'Flame' },
  { id: 'about-leadership', label: 'Leadership', parent: 'about', category: 'About', icon: 'Shield' },
  
  // Heritage Pages
  { id: 'heritage-articles', label: 'Articles', parent: 'heritage', category: 'Heritage', icon: 'FileText' },
  { id: 'heritage-collections', label: 'Collections', parent: 'heritage', category: 'Heritage', icon: 'FolderOpen' },
  { id: 'heritage-exhibitions', label: 'Exhibitions', parent: 'heritage', category: 'Heritage', icon: 'Eye' },
  
  // Clans Pages
  { id: 'clans-records', label: 'Clan Records', parent: 'clans', category: 'Clans', icon: 'Scroll' },
  { id: 'clans-totems', label: 'Totems', parent: 'clans', category: 'Clans', icon: 'Heart' },
  { id: 'clans-leaders', label: 'Leaders', parent: 'clans', category: 'Clans', icon: 'Users' },
  
  // Language Pages
  { id: 'language-dictionary', label: 'Dictionary', parent: 'language', category: 'Language', icon: 'Book' },
  { id: 'language-proverbs', label: 'Proverbs', parent: 'language', category: 'Language', icon: 'Quote' },
  { id: 'language-songs', label: 'Songs', parent: 'language', category: 'Language', icon: 'Music' },
  { id: 'language-names', label: 'Names', parent: 'language', category: 'Language', icon: 'Smile' },
  
  // Miscellaneous
  { id: 'timeline', label: 'Timeline', category: 'Timeline', icon: 'Clock' },
  
  // Gallery Pages
  { id: 'gallery-images', label: 'Images', parent: 'gallery', category: 'Gallery', icon: 'Image' },
  { id: 'gallery-videos', label: 'Videos', parent: 'gallery', category: 'Gallery', icon: 'Video' },
  { id: 'gallery-audio', label: 'Audio', parent: 'gallery', category: 'Gallery', icon: 'Volume2' },
  
  // Direct Pages
  { id: 'events', label: 'Events', category: 'Events', icon: 'Calendar' },
  { id: 'news', label: 'News', category: 'News', icon: 'Newspaper' },
  { id: 'research', label: 'Research', category: 'Research', icon: 'FileSpreadsheet' },
  { id: 'contact', label: 'Contact', category: 'Contact', icon: 'Phone' },
  
  // Systems
  { id: 'users', label: 'Users', category: 'System', icon: 'UserCheck' },
  { id: 'roles', label: 'Roles', category: 'System', icon: 'Lock' },
  { id: 'notifications', label: 'Notifications', category: 'System', icon: 'Bell' },
  { id: 'reports', label: 'Reports', category: 'Analytics', icon: 'BarChart2' },
  { id: 'audit-logs', label: 'Audit Logs', category: 'System', icon: 'FileCode' },
  { id: 'settings', label: 'Settings', category: 'System', icon: 'Sliders' },
];

export const INITIAL_CONTENT_ITEMS: ContentItem[] = [
  // Home
  {
    id: 'item_hero_01',
    pageId: 'home-hero',
    title: 'Welcome to the Cradle of Bakenyi Wisdom',
    summary: 'Subtitle text for the primary landing experience',
    content: 'Preserving the rich oral narratives, clan heritages, customary guidelines, and the unique Lukenye language of the Bakenyi people of Eastern Uganda.',
    status: 'published',
    author: 'Elder Council',
    type: 'article',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString(),
    views: 1240,
    likes: 85,
    version: 2,
    extraFields: {
      ctaLabel: 'Explore Chronicles',
      bgUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200'
    }
  },
  {
    id: 'item_feat_01',
    pageId: 'home-featured',
    title: 'Legendary Canoe Craftsmanship of Paliisa',
    summary: 'A highlight of Bakenyi wooden shipbuilding mastery',
    content: 'Tracing the engineering methods used by Bakenyi shipwrights to craft buoyant wooden canoes capable of traversing Lake Kyoga floating islands.',
    status: 'published',
    author: 'Historian Joseph N.',
    type: 'article',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 14).toISOString(),
    views: 650,
    likes: 42,
    version: 1,
    extraFields: {
      category: 'Tradition',
      slug: 'canoe-craftsmanship-paliisa'
    }
  },
  {
    id: 'item_act_01',
    pageId: 'home-activity',
    title: 'Paliisa Clan Assembly convened',
    summary: 'Elders gather to log Abade oral histories',
    content: 'Reverent assembly under the sacred fig tree where Elders documented historical settlements and certified five new Lukenye proverbs for dictionary recording.',
    status: 'published',
    author: 'Reporter Sarah N.',
    type: 'article',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
    views: 310,
    likes: 19,
    version: 1,
    extraFields: {
      location: 'Paliisa District',
      reporterEmail: 'sarah.reporter@bakenye.com'
    }
  },

  // About
  {
    id: 'item_orig_01',
    pageId: 'about-origin',
    title: 'Ancestral Origins from Congo and Nile Basin',
    summary: 'The migration narrative of the Bakenyi people',
    content: 'Historical compilation detailing the centuries-old migration paths of the Bakenyi people through floating marshes and riverine highways of East Africa.',
    status: 'published',
    author: 'Elder Council',
    type: 'article',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 40).toISOString(),
    views: 840,
    likes: 56,
    version: 1,
    extraFields: {
      era: 'Pre-colonial migration',
      primaryEvidence: 'Oral narratives and archaeological fishing hooks'
    }
  },
  {
    id: 'item_cult_01',
    pageId: 'about-culture',
    title: 'The Social Tapestry of Lukenye Speakers',
    summary: 'How language holds the customary fabric',
    content: 'Analysis of how the Lukenye language coordinates clan interactions, wedding ceremonies, and communal island boat assignments.',
    status: 'published',
    author: 'Elder David K.',
    type: 'article',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 25).toISOString(),
    views: 450,
    likes: 29,
    version: 1
  },

  // Language Dictionary
  {
    id: 'item_dict_01',
    pageId: 'language-dictionary',
    title: 'Okukubira',
    summary: 'To Row / Propel a wooden canoe',
    content: 'Action verb detailing the rhythmic rowing motions with specialized wide-leaf paddles traditional to Bakenyi sailors.',
    status: 'published',
    author: 'Linguistics Committee',
    type: 'dictionary',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 12).toISOString(),
    views: 920,
    likes: 64,
    version: 1,
    extraFields: {
      partOfSpeech: 'Verb',
      translation: 'To Row / Paddle',
      example: 'Abavubuka bakubira eryato (The youths are rowing the boat).'
    }
  },

  // Language Proverbs
  {
    id: 'item_prov_01',
    pageId: 'language-proverbs',
    title: 'Abagurusi nibo bikwatira enanga ya Bakenye',
    summary: 'The elders hold the harp of Bakenyi wisdom',
    content: 'This proverb underscores the critical, non-delegable duty of Elders to act as keepers of historical, musical, and oral records.',
    status: 'published',
    author: 'Elder Council',
    type: 'proverb',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 1).toISOString(),
    views: 1540,
    likes: 112,
    version: 2,
    extraFields: {
      translation: 'Elders are the keepers of the Bakenyi musical harp.',
      metaphor: 'The enanga (harp) represents ancestral lore and values.'
    }
  },

  // Clan Records
  {
    id: 'item_clan_01',
    pageId: 'clans-records',
    title: 'The Abade Clan Chronicle',
    summary: 'Lineage of traditional shipwrights and boat-builders',
    content: 'Dating back to ancestral settlements, the Abade clan has served as the custodian of boat building designs and maritime navigation rituals.',
    status: 'published',
    author: 'Clans Registrar',
    type: 'totem',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 50).toISOString(),
    views: 710,
    likes: 38,
    version: 1,
    extraFields: {
      seat: 'Paliisa High Seat',
      totem: 'The Crested Crane (Engooli)',
      membersCount: '1,450 families'
    }
  },

  // Totems
  {
    id: 'item_totem_01',
    pageId: 'clans-totems',
    title: 'The Crested Crane (Engooli)',
    summary: 'Totem of elegance and unity',
    content: 'The bird representing elegance, community surveillance, and the primary totem for several boat-builder clans.',
    status: 'published',
    author: 'Clans Registrar',
    type: 'totem',
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 40).toISOString(),
    views: 890,
    likes: 54,
    version: 1,
    extraFields: {
      representedAnimal: 'Balearica regulorum',
      prohibition: 'Never harm, eat, or disturb its breeding marshes.'
    }
  }
];

export const INITIAL_PENDING_ITEMS: ContentItem[] = [
  {
    id: 'pending_clan_01',
    pageId: 'clans-records',
    title: 'The Abatenga Clan Lineage Registry',
    summary: 'Lineage tracing Abatenga fishermen and weavers',
    content: 'A comprehensive document tracing Abatenga families, ancestral fishing grounds near Lake Kyoga, and their traditional pottery designs.',
    status: 'pending',
    author: 'Historian Sarah Nak',
    authorEmail: 'sarah.nak@example.com',
    type: 'totem',
    createdAt: new Date(Date.now() - 1000 * 3600 * 1.5).toISOString(), // 1.5 hours ago
    updatedAt: new Date(Date.now() - 1000 * 3600 * 1.5).toISOString(),
    views: 0,
    likes: 0,
    version: 1,
    extraFields: {
      seat: 'Kyoga East settlement',
      totem: 'The Nile Perch (Mputa)',
      descendants: 'Approx. 850 registered members'
    }
  },
  {
    id: 'pending_prov_01',
    pageId: 'language-proverbs',
    title: 'Enyanja tebula mugere',
    summary: 'The lake is never without its waves / ripples',
    content: 'This traditional proverb is cited during hardships, reminding the community that life will always present challenges, but buoyancy overcomes waves.',
    status: 'pending',
    author: 'Community Leader Moses O.',
    authorEmail: 'moses.leader@gmail.com',
    type: 'proverb',
    createdAt: new Date(Date.now() - 1000 * 3600 * 4).toISOString(), // 4h ago
    updatedAt: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    views: 0,
    likes: 0,
    version: 1,
    extraFields: {
      translation: 'The lake is never without waves.',
      metaphor: 'Waves represent adversity; a good boat represents community strength.'
    }
  },
  {
    id: 'pending_dict_01',
    pageId: 'language-dictionary',
    title: 'Obusinge',
    summary: 'State of tranquility / peace',
    content: 'Noun representing a harmonious state of community and individual peace, historically declared when clans settled floating island disputes.',
    status: 'pending',
    author: 'Youth Leader Aaron W.',
    authorEmail: 'aaron.w@bakenyi.org',
    type: 'dictionary',
    createdAt: new Date(Date.now() - 1000 * 3600 * 12).toISOString(), // 12h ago
    updatedAt: new Date(Date.now() - 1000 * 3600 * 12).toISOString(),
    views: 0,
    likes: 0,
    version: 1,
    extraFields: {
      partOfSpeech: 'Noun',
      translation: 'Tranquility, Harmony, Peace',
      example: 'Twenda obusinge mu Bakenye (We want peace in the Bakenyi lands).'
    }
  },
  {
    id: 'pending_img_01',
    pageId: 'gallery-images',
    title: 'Elder Curing Papyrus Reed Mats',
    summary: 'A photography documentation of traditional weaving',
    content: 'High-definition photograph of Elder Mary Nak curing papyrus reeds on Paliisa shores, preparatory to weaving floating home mats.',
    status: 'pending',
    author: 'Reporter James T.',
    authorEmail: 'james.reporter@bakenye.com',
    type: 'image',
    createdAt: new Date(Date.now() - 1000 * 3600 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 3600 * 20).toISOString(),
    views: 0,
    likes: 0,
    version: 1,
    mediaUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200',
    extraFields: {
      photographer: 'James T.',
      location: 'Paliisa marshes',
      camera: 'Sony Alpha A7'
    }
  }
];

export const SEEDED_AUDIT_LOGS: PageAuditLog[] = [
  {
    id: 'p_aud_01',
    pageId: 'home-hero',
    timestamp: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString(),
    actor: 'Elder Aaron Wancha',
    action: 'Hero Title Modification',
    details: 'Updated landing title to "Cradle of Bakenyi Wisdom" to reflect council decision.',
    status: 'Success'
  },
  {
    id: 'p_aud_02',
    pageId: 'language-proverbs',
    timestamp: new Date(Date.now() - 1000 * 3600 * 24 * 1).toISOString(),
    actor: 'Elder David K.',
    action: 'Proverb Approved & Vetted',
    details: 'Vetted and approved proverb "Abagurusi nibo bikwatira enanga" from pending community entries.',
    status: 'Success'
  }
];
