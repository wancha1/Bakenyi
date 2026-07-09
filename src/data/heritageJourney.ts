import { 
  Shield, Users, BookOpen, Volume2, FileText, 
  Image as ImageIcon, Calendar, PenTool 
} from 'lucide-react';

export interface JourneyStep {
  stepNumber: number;
  title: string;
  desc: string;
  path: string;
  iconName: string;
  image: string;
  stat: string;
  color: string;
}

export const journeySteps: JourneyStep[] = [
  {
    stepNumber: 1,
    title: 'Discover the Clans',
    desc: 'Begin your voyage by exploring the ancestral Bakenyi clans, their symbolic totems, and historical riverine lineages.',
    path: '/clans',
    iconName: 'Shield',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=600',
    stat: '12 Active Clans Vouched',
    color: 'from-emerald-600/20 to-emerald-700/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    stepNumber: 2,
    title: 'Meet the Elders',
    desc: 'Unveil the Elder Council—the traditional guardians, storytellers, and deep repository keepers of oral memory.',
    path: '/leadership',
    iconName: 'Users',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600',
    stat: '8 Elder Custodians Listed',
    color: 'from-blue-600/20 to-blue-700/5 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  {
    stepNumber: 3,
    title: 'Learn the Language',
    desc: 'Preserve the native Lukenye language with our interactive dialect charts, pronunciation logs, and dictionary.',
    path: '/language',
    iconName: 'Volume2',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
    stat: '125+ Vocabulary Entries',
    color: 'from-rose-600/20 to-rose-700/5 text-rose-600 dark:text-rose-400 border-rose-500/20'
  },
  {
    stepNumber: 4,
    title: 'Read Community Stories',
    desc: 'Immerse yourself in approved historical records, written memoirs, and translations approved by the Council.',
    path: '/articles',
    iconName: 'FileText',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600',
    stat: '20+ Narratives & Lore Papers',
    color: 'from-amber-600/20 to-amber-700/5 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  {
    stepNumber: 5,
    title: 'Listen to Oral Histories',
    desc: 'Play raw audio recordings and transcripts directly recorded in field interviews along Lake Kyoga shores.',
    path: '/gallery',
    iconName: 'Volume2',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600',
    stat: '6 Interactive Audio Logs',
    color: 'from-indigo-600/20 to-indigo-700/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
  },
  {
    stepNumber: 6,
    title: 'Explore Historic Galleries',
    desc: 'Examine the visual museum of ancient dugout canoes, weaving craft, river landmarks, and historic photos.',
    path: '/gallery',
    iconName: 'ImageIcon',
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=600',
    stat: '30+ Archival Photographs',
    color: 'from-purple-600/20 to-purple-700/5 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  {
    stepNumber: 7,
    title: 'Attend Cultural Events',
    desc: 'Join Bakenyi circles, language learning groups, and community weaving circles to learn directly from practitioners.',
    path: '/contact',
    iconName: 'Calendar',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600',
    stat: 'Join Next Handcraft Circle',
    color: 'from-emerald-600/20 to-emerald-700/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    stepNumber: 8,
    title: 'Become a Heritage Contributor',
    desc: 'The archive belongs to the community. Add your clan\'s lineage, share family stories, or record elder audio.',
    path: '/contribute',
    iconName: 'PenTool',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=600',
    stat: '9 Active Guardians Posting',
    color: 'from-sky-600/20 to-sky-700/5 text-sky-600 dark:text-sky-400 border-sky-500/20'
  }
];

export const getJourneyIcon = (iconName: string) => {
  switch (iconName) {
    case 'Shield': return Shield;
    case 'Users': return Users;
    case 'BookOpen': return BookOpen;
    case 'Volume2': return Volume2;
    case 'ImageIcon': return ImageIcon;
    case 'Calendar': return Calendar;
    case 'PenTool': return PenTool;
    default: return FileText;
  }
};
