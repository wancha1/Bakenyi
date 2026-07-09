import { 
  BookOpen, Volume2, Clock, Users, Shield, 
  ImageIcon, Music, Coffee, Compass, Award 
} from 'lucide-react';

export interface SpotlightItem {
  id: string;
  type: 'Proverb' | 'Vocabulary' | 'History' | 'Elder' | 'Clan' | 'Photo' | 'Audio' | 'Practice' | 'Food' | 'Artifact';
  title: string;
  subtitle?: string;
  lukenye?: string;
  desc: string;
  image: string;
  path: string;
  iconName: string;
  metadata?: string;
}

export const dailySpotlights: SpotlightItem[] = [
  {
    id: 'spotlight-proverb',
    type: 'Proverb',
    title: 'Proverb of the Day',
    subtitle: 'Respect for Ancestral Counsel',
    lukenye: '“Amato agatasiga nnyange, galisangula amabaale.”',
    desc: '“A canoe that does not listen to the egrets will eventually strike the hidden stones.” This timeless Lukenye proverb warns that failing to seek and respect the wisdom of elders and community guardians leads to unavoidable danger.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    path: '/language',
    iconName: 'Compass',
    metadata: 'Lukenye Proverb • Oral Wisdom'
  },
  {
    id: 'spotlight-vocab',
    type: 'Vocabulary',
    title: 'Vocabulary of the Day',
    subtitle: 'The Floating Reed Sanctuaries',
    lukenye: 'Ebiswa (singular: Ekiswa)',
    desc: 'The native term for the mobile floating islands of papyrus reeds that drift across Lake Kyoga. Historically, Bakenyi ancestors constructed temporary shelters on these islands, turning them into defensive fortresses and trading outposts.',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
    path: '/language',
    iconName: 'Volume2',
    metadata: 'Dialect Term • Ecological Tech'
  },
  {
    id: 'spotlight-history',
    type: 'History',
    title: 'On This Day in Bakenyi History',
    subtitle: 'The 1720 Crossing of the Nile',
    desc: 'According to elders\' direct lineages, a fleet of dugout canoes crossed the heavy mists of the Victoria Nile during this week of the calendar, establishing the very first permanent Bakenyi fishing settlements in Namasale.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800',
    path: '/history',
    iconName: 'Clock',
    metadata: '18th Century Migration Chronicle'
  },
  {
    id: 'spotlight-elder',
    type: 'Elder',
    title: 'Featured Council Elder',
    subtitle: 'Elder Christopher Kyega',
    desc: 'At 92 years of age, Elder Christopher is the chief guardian of the Baise-Mugaya lineage records. He holds in his memory over 300 ancestral paddle songs and the exact GPS-like oral coordinates of 15 lost settlements.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800',
    path: '/leadership',
    iconName: 'Users',
    metadata: 'Council Member • Lineage Guardian'
  },
  {
    id: 'spotlight-clan',
    type: 'Clan',
    title: 'Featured Ancestral Clan',
    subtitle: 'The Baise-Mugosa Clan',
    desc: 'Traditionally serving as the architects of the waters, the Baise-Mugosa developed the unique multi-layered reed piling technique that allows Bakenyi homes to withstand floating island collisions and strong lake storms.',
    image: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=800',
    path: '/clans',
    iconName: 'Shield',
    metadata: 'Totem: Crested Crane (Nnali)'
  },
  {
    id: 'spotlight-photo',
    type: 'Photo',
    title: 'Photo of the Day',
    subtitle: 'Traditional Papyrus Silt Weaving',
    desc: 'An evocative photo capturing the precise finger-loop weaving method utilized by our craft circles to create fishing traps, sleeping mats, and the thatched roofs of lakefront homesteads.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
    path: '/gallery',
    iconName: 'ImageIcon',
    metadata: 'Visual Archive • Lake Kyoga shores'
  },
  {
    id: 'spotlight-audio',
    type: 'Audio',
    title: 'Audio Story of the Day',
    subtitle: 'Paddling Chants of the Kyoga Basin',
    desc: 'Listen to a remastered live recording of the Baise-Mugaya paddle craft builders. This specific chant synchronizes the paddle rhythm to maintain a high speed across Lake Kyoga\'s wide waterways.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800',
    path: '/gallery',
    iconName: 'Music',
    metadata: '1974 Field Recording Archive'
  },
  {
    id: 'spotlight-practice',
    type: 'Practice',
    title: 'Featured Cultural Practice',
    subtitle: 'The River Naming Ceremony',
    desc: 'A sacred Bakenyi rite of passage. Newborn children are gently presented to the morning mists of Lake Kyoga at sunrise. The child is blessed with lake water and is given their protective water clan lineage name.',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800',
    path: '/history',
    iconName: 'Award',
    metadata: 'Sacred Rite of Passage'
  },
  {
    id: 'spotlight-food',
    type: 'Food',
    title: 'Traditional Gastronomy',
    subtitle: 'Papyrus-Smoked Kyoga Catfish',
    desc: 'Smoked Kyoga Catfish (Embaata) is cured inside a specially ventilated earthen dome over slow-burning dried papyrus stalks. This method imparts a delicate sweet-woody fragrance that preserves the meat for month-long lake voyages.',
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800',
    path: '/history',
    iconName: 'Coffee',
    metadata: 'Lake Basin Culinary Arts'
  },
  {
    id: 'spotlight-artifact',
    type: 'Artifact',
    title: 'Curated Cultural Artifact',
    subtitle: 'The Heart-Shaped Paddle (Eisiga)',
    desc: 'Hand-carved from water-resistant Musizi wood, this unique paddle features a wide, heart-shaped blade. It is designed to maximize water displacement while gliding silently over shallow, weed-choked water lily fields.',
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=800',
    path: '/gallery',
    iconName: 'Compass',
    metadata: 'Ancient River Navigation Tech'
  }
];

export const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'BookOpen': return BookOpen;
    case 'Volume2': return Volume2;
    case 'Clock': return Clock;
    case 'Users': return Users;
    case 'Shield': return Shield;
    case 'ImageIcon': return ImageIcon;
    case 'Music': return Music;
    case 'Coffee': return Coffee;
    case 'Award': return Award;
    default: return Compass;
  }
};
