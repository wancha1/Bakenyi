export interface TimelineEvent {
  id: string;
  period: string; // e.g. "14th Century"
  title: string;
  desc: string;
  detailedDesc: string;
  category: 'Pre-Colonial' | 'Colonial' | 'Modern';
  theme: 'Migration' | 'Settlement' | 'Tradition' | 'Leadership';
  location: string;
  relatedClans: string[];
  relatedLeaders: string[];
  image: string;
  year_order: number;
  elderQuote?: string;
  relatedTrackId?: string; // Links to an oral history track ID
}

export interface AudioTrack {
  id: string;
  title: string;
  elder: string;
  clan: string;
  role: string;
  topic: 'Migration' | 'Language' | 'Tradition' | 'Crafts';
  duration: string;
  durationSeconds: number;
  imageUrl: string;
  audioUrl: string;
  recordingDate: string;
  transcription: {
    time: number;
    textLukenye: string;
    textEnglish: string;
  }[];
}

export interface MigrationNode {
  id: string;
  title: string;
  label: string;
  year: string;
  x: number;
  y: number;
  description: string;
  clansInvolved: string[];
  leadersInvolved: string[];
  relatedTrackId?: string;
}

export interface HistoricalDocument {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  excerpt: string;
  downloadSize: string;
  permitted: boolean;
}


export const MIGRATION_NODES: MigrationNode[] = [
  {
    id: 'node-origin',
    title: 'Ancestral Origins',
    label: 'Lake Victoria Basin',
    year: 'c. 13th–14th Century',
    x: 350,
    y: 410,
    description: 'Ancestral Bakenyi lineages resided along the north-western wetlands of Lake Victoria, living as autonomous river-faring fishers and marsh-land builders prior to regional migrations.',
    clansInvolved: ['Baise-Igaga', 'Baise-Musuuba'],
    leadersInvolved: ['Historic Lineage Commanders'],
    relatedTrackId: '1'
  },
  {
    id: 'node-nile-crossing',
    title: 'The Nile Crossing',
    label: 'Victoria Nile Waters',
    year: 'c. 1650s–1720',
    x: 180,
    y: 300,
    description: 'Fleeing expansionist territorial conflicts on the dry mainland, Bakenyi clans launched fleets of dugout canoes (Abaato) to cross the Victoria Nile, heading north-east.',
    clansInvolved: ['Baise-Mugaya'],
    leadersInvolved: ['Chief Lineage Commanders'],
    relatedTrackId: '1'
  },
  {
    id: 'node-namasale',
    title: 'Namasale Peninsula',
    label: 'Primary Kyoga Anchor',
    year: '1720',
    x: 420,
    y: 200,
    description: 'Led by legendary boat builders, the fleet landed on the Namasale Peninsula, establishing the first permanent shoreside communes and pioneering floating island (Ebiswa) forts.',
    clansInvolved: ['Baise-Mugaya', 'Baise-Musuuba'],
    leadersInvolved: ['Elder Christopher Kyega'],
    relatedTrackId: '1'
  },
  {
    id: 'node-kagwara',
    title: 'Kagwara Port',
    label: 'Kyoga Trade Highway',
    year: 'c. 1940s',
    x: 650,
    y: 230,
    description: 'Kagwara became the primary deep-water shipping port and marketplace, where Bakenyi freight traders ferried regional crops and fish, bridging three distinct tribal territories.',
    clansInvolved: ['Baise-Musuuba'],
    leadersInvolved: ['Honourable Jackson Mukasa'],
    relatedTrackId: '3'
  },
  {
    id: 'node-modern',
    title: 'Modern Kyoga Basin',
    label: 'Present-day Communes',
    year: 'Present Day',
    x: 520,
    y: 110,
    description: 'Today, the Bakenyi dwell in permanent shoreline peninsulas across Buyende, Kaliro, Amolatar, and Kaberamaido, leading conservation, language codification, and digital archiving.',
    clansInvolved: ['Baise-Mugaya', 'Baise-Musuuba', 'Baise-Igaga'],
    leadersInvolved: ['Elder Florence Nabakooza', 'Council Representatives'],
    relatedTrackId: '2'
  }
];

export const HISTORICAL_DOCUMENTS: HistoricalDocument[] = [
  {
    id: 'doc-1',
    title: 'The Water-Dwellers of Lake Kyoga: An Ethnographic Survey',
    category: 'Colonial Survey',
    author: 'C. W. Hatton (Colonial Records Office)',
    date: '1954',
    excerpt: 'Detailed recording of the maritime skills, dugout canoe engineering, and autonomous trade systems maintained by Bakenyi shoreline and floating island residents.',
    downloadSize: '4.8 MB',
    permitted: true
  },
  {
    id: 'doc-2',
    title: 'Lukenye Lexicon and Grammatical Codification Registers',
    category: 'Grammar Codex',
    author: 'Elders Council Language Committee',
    date: '1988',
    excerpt: 'A historic preservation manual transcribing 1,200 ancestral paddle verbs, maritime nouns, and traditional greeting phrases of the distinct Lukenye dialect.',
    downloadSize: '12.4 MB',
    permitted: true
  },
  {
    id: 'doc-3',
    title: 'Aquatic Adaptations & Ebiswa Architecture of Lake Kyoga',
    category: 'Ecological Study',
    author: 'Makerere Dept of Historical Archeology',
    date: '2012',
    excerpt: 'An architectural and botanical analysis mapping the traditional construction of mobile floating islands from papyrus roots and marsh grasses.',
    downloadSize: '8.1 MB',
    permitted: true
  },
  {
    id: 'doc-4',
    title: 'Genealogical Scrolls and Lineage Totems of Bakenyi Clans',
    category: 'Genealogical Roll',
    author: 'Bakenyi Cultural Guardians Council',
    date: '2021',
    excerpt: 'A comprehensive database recording the lineage structures, sacred animal totems, ancestral taboos, and chief custodians of the Baise-Mugaya, Baise-Musuuba, and Baise-Igaga clans.',
    downloadSize: '15.6 MB',
    permitted: false
  }
];
