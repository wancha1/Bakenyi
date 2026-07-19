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

export const FALLBACK_EVENTS: TimelineEvent[] = [
  {
    id: 'timeline-early-beginnings',
    period: '14th Century',
    title: 'Early Riverine Settlements',
    desc: 'The ancestors of the Bakenyi people began settling along the marshlands of major river basins in Eastern Uganda.',
    detailedDesc: 'During the early 14th century, the ancestors of the Bakenyi people settled along the rivers of eastern and central Uganda. Moving along waterways, they developed highly specialized riverine skills, including deep-water fishing and building stable platforms over marshy land. This lifestyle allowed them to remain secure from landlocked conflicts, establishing their unique identity as the "Water People" of Uganda.',
    category: 'Pre-Colonial',
    theme: 'Settlement',
    location: 'Victoria Nile',
    relatedClans: ['Baise-Igaga'],
    relatedLeaders: ['Elder Florence Nabakooza'],
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
    year_order: 1300
  },
  {
    id: 'timeline-clan-formation',
    period: '15th–16th Century',
    title: 'Emergence of Water-Based Clans',
    desc: 'Bakenyi river groups migrated northward and diverged into structured, lineage-based clans with aquatic totems.',
    detailedDesc: 'As families multiplied, they migrated towards the vast wetlands and established distinct clans. Each clan took on key duties for the community—from canoe construction to net crafting. They adopted sacred totems based on river creatures, like the Crested Crane (Nnali), the lungfish, and the water lily, cementing their ecological bonds and creating a tight social safety net.',
    category: 'Pre-Colonial',
    theme: 'Tradition',
    location: 'Lake Kyoga',
    relatedClans: ['Baise-Mugaya', 'Baise-Musuuba'],
    relatedLeaders: ['Elder Christopher Kyega', 'Honourable Jackson Mukasa'],
    image: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=800',
    year_order: 1500
  },
  {
    id: 'timeline-ebiswa-settlements',
    period: 'c. 1650s',
    title: 'Pioneering "Ebiswa" Sanctuaries',
    desc: 'Bakenyi groups developed the technique of building stable temporary shelters on floating papyrus reed islands.',
    detailedDesc: 'To guard against rising conflicts on mainland shores, Bakenyi families pioneered building shelters on "Ebiswa"—mobile floating islands composed of dense papyrus root structures. These giant natural rafts drifted across Lake Kyoga, functioning as floating fortresses that could be cut loose to float away from danger, making Bakenyi settlements virtually unreachable by land warriors.',
    category: 'Pre-Colonial',
    theme: 'Settlement',
    location: 'Lake Kyoga',
    relatedClans: ['Baise-Musuuba'],
    relatedLeaders: ['Honourable Jackson Mukasa'],
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    elderQuote: '“The reed islands are our shields. They bend with the storm but they never sink under our feet.” — Traditional Proverb',
    relatedTrackId: '2',
    year_order: 1650
  },
  {
    id: 'timeline-nile-crossing',
    period: '1720',
    title: 'The Great Crossing of the Victoria Nile',
    desc: 'Led by legendary lineage chiefs, a great fleet of dugout canoes crossed the mists of the Nile to establish Namasale.',
    detailedDesc: 'In the year 1720, a heavy regional drought led several water clans to search for deeper waters. Led by historic lineage commanders, a great flotilla of heart-shaped dugout canoes (Eisiga) navigated the heavy morning mists of the Victoria Nile, successfully crossing into Lake Kyoga to establish the first permanent Bakenyi fishing settlements in Namasale and Kagwara.',
    category: 'Pre-Colonial',
    theme: 'Migration',
    location: 'Namasale',
    relatedClans: ['Baise-Mugaya'],
    relatedLeaders: ['Elder Christopher Kyega'],
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800',
    elderQuote: '“A fleet of mists, a heart of wood. That day, Lake Kyoga welcomed the paddle of our grandfathers.” — Namasale Storyteller',
    relatedTrackId: '1',
    year_order: 1720
  },
  {
    id: 'timeline-lukenye-codification',
    period: '1800s',
    title: 'Flourishing of the Lukenye Language',
    desc: 'The Lukenye language solidified as a distinct Bantu dialect, preserved via traditional storytelling and rhythmic paddle chants.',
    detailedDesc: 'During the 1800s, the Lukenye language fully emerged as a distinct, expressive Bantu dialect. Isolated from deep inland tribes, Bakenyi communities preserved Lukenye by embedding grammar, historical records, and moral laws into rhythmic paddling chants and lakeside melodies that could travel across the quiet water.',
    category: 'Pre-Colonial',
    theme: 'Tradition',
    location: 'Lake Kyoga',
    relatedClans: ['Baise-Mugaya', 'Baise-Musuuba', 'Baise-Igaga'],
    relatedLeaders: ['Elder Christopher Kyega', 'Honourable Jackson Mukasa', 'Elder Florence Nabakooza'],
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
    elderQuote: '“We did not write our words in stone. We sang them to the winds, and the water carried them to our children.”',
    relatedTrackId: '3',
    year_order: 1800
  },
  {
    id: 'timeline-colonial-resistance',
    period: '1890s',
    title: 'Colonial Shore boundaries & Autonomy',
    desc: 'Bakenyi clans resisted colonial administration boundaries, maintaining absolute autonomy over Lake Kyoga’s waterways.',
    detailedDesc: 'When colonial surveyors arrived in East Africa and attempted to divide land and waterways into districts, Bakenyi chiefs stood firm. They refused to recognize administrative borders that restricted their fishing and canoe trade, maintaining their age-old autonomy over Lake Kyoga’s waters through strategic mobility and passive resistance.',
    category: 'Colonial',
    theme: 'Leadership',
    location: 'Lake Kyoga',
    relatedClans: ['Baise-Mugaya'],
    relatedLeaders: ['Elder Christopher Kyega'],
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
    elderQuote: '“How do you draw lines on the water? The lake belongs to the birds and the canoes, not to the ink of your papers.” — Chief of the Baise-Mugosa',
    year_order: 1890
  },
  {
    id: 'timeline-water-trade-boom',
    period: '1940s–1950s',
    title: 'The Great Lake Kyoga Trade Boom',
    desc: 'Bakenyi boat builders and fishermen became the primary trading link across Lake Kyoga, connecting major regional markets.',
    detailedDesc: 'During the mid-20th century, Bakenyi merchants became essential to the region’s economy. Utilizing large freight dugout boats, they ferried cotton, fish, hand-braided papyrus mats, and metalwork between the Langi, Basoga, and Bagwere peoples, transforming Lake Kyoga from a natural barrier into a highly active trade highway.',
    category: 'Colonial',
    theme: 'Settlement',
    location: 'Kagwara',
    relatedClans: ['Baise-Musuuba'],
    relatedLeaders: ['Honourable Jackson Mukasa'],
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800',
    year_order: 1940
  },
  {
    id: 'timeline-ecological-changes',
    period: '1980s',
    title: 'Ecological Shifts & Preservation Push',
    desc: 'Introduction of the Nile Perch and rising water levels altered lake lifestyles, sparking the first oral archive initiatives.',
    detailedDesc: 'The 1980s brought rapid changes. The introduction of the Nile Perch altered Lake Kyoga’s ecosystem, and climate-induced water level shifts flooded traditional shoreline ports. Recognizing these environmental pressures and the migration of youth to cities, community elders began holding formal storytelling circles to transcribe oral records and preserve Lukenye vocabulary.',
    category: 'Modern',
    theme: 'Tradition',
    location: 'Lake Kyoga',
    relatedClans: ['Baise-Igaga'],
    relatedLeaders: ['Elder Florence Nabakooza'],
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800',
    elderQuote: '“The fish changed, the water rose, and our old paths vanished. But the words of our ancestors remain dry and safe in our minds.”',
    year_order: 1980
  },
  {
    id: 'timeline-digital-renaissance',
    period: 'Present Day',
    title: 'The Digital Bakenyi Heritage Project',
    desc: 'A modern renaissance powered by digital archives, keeping ancestral lineages and language alive for generations.',
    detailedDesc: 'Today, the Bakenyi people are undergoing a powerful digital renaissance. By launching cultural portals, digital audio maps, and clan registries, Bakenyi youth and elders are ensuring that their ancient riverine history, the Lukenye language, and the lineage structures are preserved and accessible to the entire world, bridging the gap between historical water islands and global digital networks.',
    category: 'Modern',
    theme: 'Leadership',
    location: 'Lake Kyoga',
    relatedClans: ['Baise-Mugaya', 'Baise-Musuuba', 'Baise-Igaga'],
    relatedLeaders: ['Elder Christopher Kyega', 'Honourable Jackson Mukasa', 'Elder Florence Nabakooza'],
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    year_order: 2026
  }
];

export const FALLBACK_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: '1',
    title: 'The Great Canoe Migration of 1720',
    elder: 'Elder Christopher Kyega',
    clan: 'Baise-Mugaya',
    role: 'Council Elder & Chief Historian (Age 92)',
    topic: 'Migration',
    duration: '2:15',
    durationSeconds: 135,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    recordingDate: 'September 2023',
    transcription: [
      { time: 0, textLukenye: 'Abaato ya Bakenyi eri na mwoyo gw’amaadhi, mwoyo ogutasobola kusaanawo.', textEnglish: 'The canoe of the Bakenyi carries the spirit of the water, a spirit that can never fade.' },
      { time: 10, textLukenye: 'Mu mpewo n’ez’omugga ogwo Victoria Nile, abakulu baffe baasimbula mu mirembe.', textEnglish: 'Through the morning mists of the Victoria Nile, our ancestral commanders launched their voyage in peace.' },
      { time: 24, textLukenye: 'Baasala ennyanja Kyoga, ne baggulawo ekkubo lya Namasale erikyali ery’emirembe leero.', textEnglish: 'They crossed Lake Kyoga, opening up the path to Namasale Peninsula which remains a sanctuary of peace to this day.' },
      { time: 42, textLukenye: 'Omugumu gw’eito lyaffe, gw’amaanyi gaffe ag’ekika.', textEnglish: 'The strength of our boats is the strength of our lineages.' },
      { time: 58, textLukenye: 'Olukenye terikyusibwa ne makuulo ag’amaanyi.', textEnglish: 'Our language is not broken by the highest waves.' },
      { time: 75, textLukenye: 'Buli kigambo kye twogeza abalere, twokukikuuma obulungi.', textEnglish: 'Every word we speak to the youth is meant to be guarded with care.' },
      { time: 95, textLukenye: 'Mugaya wa Bakenyi tajja kulekera paddlo eyo.', textEnglish: 'A Bakenyi navigator will never let go of the paddle.' },
      { time: 115, textLukenye: 'Naye twongere okuyiga ebikwata ku bajjajja baffe ab’edda.', textEnglish: 'We must continue to learn from the ancient deeds of our grandfathers.' }
    ]
  },
  {
    id: '2',
    title: 'The Legend of the Floating Islands (Ebiswa)',
    elder: 'Elder Florence Nabakooza',
    clan: 'Baise-Igaga',
    role: 'Traditional Ecological Custodian',
    topic: 'Tradition',
    duration: '3:05',
    durationSeconds: 185,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    recordingDate: 'October 2023',
    transcription: [
      { time: 0, textLukenye: 'Ebiswa bino byali bisinga okuba ebifo eby’emirembe gy’ekitundu kyaffe.', textEnglish: 'These floating papyrus reed islands were the safest sanctuaries for our communities.' },
      { time: 12, textLukenye: 'Bwe twawuliranga omulabe, twasalanga emiguwa egisibiddwa ku ttaka negiseeyeeya.', textEnglish: 'Whenever we sensed incoming danger, we would cut the papyrus anchor-ropes and drift silently away.' },
      { time: 28, textLukenye: 'Ennyanja Kyoga yali nnyina waffe yennyini, eyatuwa emmere n’obukuumi.', textEnglish: 'Lake Kyoga was our true mother, providing us with abundant food and perfect protection.' },
      { time: 45, textLukenye: 'Kumbe abalere ba leero beeyiba mu ngeri endala.', textEnglish: 'But the youth of today are finding their pathways in different ways.' },
      { time: 65, textLukenye: 'Tusaanidde okugumya omutima n’obujajja bwaffe.', textEnglish: 'We must strengthen our hearts with ancestral pride.' },
      { time: 85, textLukenye: 'Emamba n’olunyago bintu bikulu eby’olubiri luno.', textEnglish: 'The lungfish and the reeds are sacred elements of our heritage.' },
      { time: 108, textLukenye: 'Tutusobola okwebala amatafali gonna agaayambako.', textEnglish: 'We can never forget the foundations that built our safety.' },
      { time: 135, textLukenye: 'Kyoga ejja kukuuma eby’omunda byonna eby’olukenye.', textEnglish: 'Kyoga will guard all the internal treasures of the Lukenye tongue.' },
      { time: 160, textLukenye: 'Weebale bulungi nnyo abajajja baffe abaasooka.', textEnglish: 'Praise be to our pioneering grandfathers who showed the way.' }
    ]
  },
  {
    id: '3',
    title: 'The Art of Lukenye Paddle Chants',
    elder: 'Honourable Jackson Mukasa',
    clan: 'Baise-Musuuba',
    role: 'Chief Craft Navigator (Age 78)',
    topic: 'Language',
    duration: '1:50',
    durationSeconds: 110,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    recordingDate: 'November 2023',
    transcription: [
      { time: 0, textLukenye: 'Ennyimba z’okuzaasulya ze zaalinda olulimi lwaffe emyaka n’emyaka.', textEnglish: 'Our traditional paddling chants are what preserved our Lukenye language through centuries of isolation.' },
      { time: 12, textLukenye: 'Buli mugaya bwe yakuba omulaasi mu mazzi, yayimbanga nti ennyanja tugigabana.', textEnglish: 'Every navigator, as they struck their wooden paddle into the water, sang that we share the lake as brothers.' },
      { time: 28, textLukenye: 'Olukenye lulina amaloboozi agasobola okutambula okugenda ewala mu mpewo.', textEnglish: 'The Lukenye language contains deep phonetic tones designed to travel long distances across quiet water mists.' },
      { time: 46, textLukenye: 'Abaana baffe tebasaanidde kusembayo njigiriza ey’ebweru nebaleka olubiri luno.', textEnglish: 'Our children should not merely embrace foreign education and abandon our ancestral home.' },
      { time: 68, textLukenye: 'Mamba ya Bakenyi teri mu nnyanja yonna endala.', textEnglish: 'The spirit of the Bakenyi lungfish is unique to our waters.' },
      { time: 88, textLukenye: 'Tuyimbe ne paddlo yaffe egenda mu maaso buli lukya.', textEnglish: 'Let us sing as our paddles move forward day after day.' }
    ]
  }
];

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
