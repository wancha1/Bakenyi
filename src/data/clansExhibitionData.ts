export interface ClanMetadata {
  imageUrl: string;
  historicalRecordsCount: number;
  activeEldersCount: number;
  specialization: string;
  heritageStory: string;
  sacredDuties: string[];
  clanColor: string; // Tailwind color class or hex
}

export interface InterClanRelationship {
  id: string;
  title: string;
  description: string;
  clansInvolved: string[];
  protocolType: 'Marriage' | 'Alliance' | 'Arbitration' | 'Craftsmanship';
  ritualDetails: string;
  iconName: string;
}

export interface CulturalLaw {
  id: string;
  title: string;
  description: string;
  consequence: string;
  sacredPractice: string;
}

export interface ExhibitionStat {
  label: string;
  value: string;
  description: string;
  suffix?: string;
}

export interface AdjacentWing {
  title: string;
  description: string;
  link: string;
  iconName: string;
  bannerImage: string;
}

export const CLAN_EXHIBITION_METADATA: Record<string, ClanMetadata> = {
  'clan-1': {
    imageUrl: 'https://images.unsplash.com/photo-1591824438708-ce405f36ba3d?auto=format&fit=crop&q=80&w=800', // Crowned Crane
    historicalRecordsCount: 42,
    activeEldersCount: 9,
    specialization: 'Navigators & Canoe Crafters',
    heritageStory: 'The Baise-Mugaya are the sovereign navigators of the Lake Kyoga waterways. Legends say their ancestors could read the flight patterns of the Crested Crane to predict violent storms hours before they hit. They were tasked with crafting the great canoes (Abaato) used for migration, diplomatic journeys, and long-range exploration.',
    sacredDuties: [
      'Stewardship of the water channels and safe passage routes across the Lake Kyoga marshes.',
      'Sovereign craftsmanship of ceremonial royal canoes and sea-faring vessels.',
      'Maintaining oral navigation charts based on stellar alignment and wind currents.',
      'Leading emergency rescue operations during sudden aquatic squalls.'
    ],
    clanColor: 'amber'
  },
  'clan-2': {
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800', // Lake net weaving / fishing
    historicalRecordsCount: 35,
    activeEldersCount: 8,
    specialization: 'Master Net Weavers & Sustainable Harvesters',
    heritageStory: 'The Baise-Musuuba hold the ancient secrets of the floating islands. As master net weavers and marine ecologists, they developed the "Obumu netting" technique, a system of spacing knots that ensures only mature Nile Perch are caught, leaving younger populations to flourish. They reside mainly on the Kyoga Floating Archipelago, building modular floating reed dwellings.',
    sacredDuties: [
      'Preservation of biodegradable net-weaving techniques using wild Kyoga marsh papyrus.',
      'Enforcing sustainable fishing seasons and spawning-zone protection protocols.',
      'Engineering and maintaining the floating reed islands (Ebisangazi) that house Bakenye families.',
      'Managing the distribution of aquatic harvests to prevent hunger in inland settlements.'
    ],
    clanColor: 'emerald'
  },
  'clan-3': {
    imageUrl: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&q=80&w=800', // Swamp forest / wetland reeds
    historicalRecordsCount: 29,
    activeEldersCount: 7,
    specialization: 'Spiritual Guardians & Botanical Herbalists',
    heritageStory: 'The Baise-Igaga are the custodians of the sacred swamp forests and herbal medicine. They have documented over 140 wetland plant species capable of curing tropical fevers, neutralising snake venom, and healing bone fractures. It is said that they communicate with the guardian spirits of the marshes to protect the flora and fauna from desecration.',
    sacredDuties: [
      'Stewardship of the sacred swamp sanctuaries and ancient ancestral burial shores.',
      'Formulating traditional medicine from rare wetland root and moss species.',
      'Officiating inter-clan peace treaties and acting as neutral judges in boundary disputes.',
      'Leading seasonal rituals of thanksgiving to honor the spirits of Lake Kyoga.'
    ],
    clanColor: 'rose'
  }
};

export const INTER_CLAN_RELATIONSHIPS: InterClanRelationship[] = [
  {
    id: 'rel-1',
    title: 'The Great Exogamy Covenant',
    description: 'In Bakenye custom, marrying within one\'s own paternal or maternal clan is strictly forbidden. This rule strengthens the social fabric, ensuring that every marriage forms a permanent, cooperative bridge between different clans.',
    clansInvolved: ['All Bakenye Clans'],
    protocolType: 'Marriage',
    ritualDetails: 'Before any wedding is sanctioned, the Elders of both clans meet at the shoreline. They exchange traditional clay pots filled with lake water, symbolizing the merging of two distinct currents into a single, strong river.',
    iconName: 'Heart'
  },
  {
    id: 'rel-2',
    title: 'The Navigation & Harvest Pact',
    description: 'The Baise-Mugaya (navigators) and Baise-Musuuba (fishers) share an ancient pact of mutual survival. Since navigation and harvesting are interdependent, no fisher can set sail without a navigator\'s blessing, and no navigator lacks food while nets are full.',
    clansInvolved: ['Baise-Mugaya', 'Baise-Musuuba'],
    protocolType: 'Craftsmanship',
    ritualDetails: 'At the start of the equinox, the Baise-Mugaya present a newly crafted ceremonial paddle to the Baise-Musuuba elders. In return, they receive the "first harvest net" woven from the strongest lake fibers.',
    iconName: 'Sparkles'
  },
  {
    id: 'rel-3',
    title: 'The Sanctuary Arbitration protocol',
    description: 'When disputes arise regarding fishing grounds or shoreline boundaries, the Baise-Igaga (spiritual guardians) step in as neutral arbiters. Because they do not engage in commercial fishing or trade, their word is considered untainted and final.',
    clansInvolved: ['Baise-Igaga', 'All disputing clans'],
    protocolType: 'Arbitration',
    ritualDetails: 'Arbitration takes place on a floating council platform. The Baise-Igaga elders place a spear horizontally between the parties, and both sides must present their cases while holding a sacred water-lily stem.',
    iconName: 'Shield'
  }
];

export const CULTURAL_LAWS: CulturalLaw[] = [
  {
    id: 'law-1',
    title: 'Totemic Inviolability (Ennono)',
    description: 'Every Bakenye is strictly prohibited from hunting, eating, harming, or disrespecting their clan\'s totem. To harm a totem is to harm the lineage itself.',
    consequence: 'Immediate loss of elder council standing, followed by a purification ritual requiring community service on the marshes.',
    sacredPractice: 'Teaching children to recognize and protect the physical habitat of their totem bird, animal, or plant.'
  },
  {
    id: 'law-2',
    title: 'Sanctuary Integrity (Ekiwala)',
    description: 'No fishing or papyrus harvesting is permitted within the designated fish breeding sanctuaries (the deep bays mapped by the Baise-Igaga).',
    consequence: 'Seizure of fishing gear and a mandatory contribution of three newly woven nets to the shared community reserves.',
    sacredPractice: 'Marking the sanctuary boundaries with floating papyrus floats painted with natural white-clay markers.'
  }
];

export const CLAN_STATS: ExhibitionStat[] = [
  {
    label: 'Registered Clans',
    value: '18',
    description: 'Sovereign lineages documented in the high registry.',
    suffix: ' Clans'
  },
  {
    label: 'Active Elders',
    value: '46',
    description: 'Council representatives keeping oral lore alive.',
    suffix: '+'
  },
  {
    label: 'Sacred Totems',
    value: '12',
    description: 'Protective animal and botanical symbols.',
    suffix: ' Totems'
  },
  {
    label: 'Historic Regions',
    value: '5',
    description: 'Traditional territories and floating bays.',
    suffix: ' Regions'
  },
  {
    label: 'Archived Chronicles',
    value: '142',
    description: 'Verified historical documents and treaties.',
    suffix: ' Records'
  }
];

export const ADJACENT_EXHIBITION_WINGS: AdjacentWing[] = [
  {
    title: 'History & Timeline',
    description: 'Walk through the historical narrative of migrations, floating wars, and the sovereign resilience of the Bakenye people.',
    link: '/history',
    iconName: 'Calendar',
    bannerImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: 'Language & Vocabulary',
    description: 'Explore the Lukenye dictionary, maritime terminologies, boat-building chants, and fish-tracking vocabulary.',
    link: '/language',
    iconName: 'Languages',
    bannerImage: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: 'Leadership & Council',
    description: 'Meet the current Council of Elders, clan heads, spiritual custodians, and lineage lineage record keepers.',
    link: '/leadership',
    iconName: 'Users',
    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600'
  }
];
