import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Shield, 
  Info, 
  Filter, 
  Sparkles, 
  User, 
  Calendar, 
  BookOpen, 
  MapPin, 
  Compass, 
  Award, 
  Heart, 
  Scale, 
  X, 
  ChevronRight, 
  ArrowRight,
  Grid,
  ArrowUpDown,
  CheckCircle2,
  Users,
  Languages,
  BookMarked,
  Layers,
  History as HistoryIcon
} from 'lucide-react';
import { getClans, Clan, getLeaders, getArticles } from '../lib/supabase';
import SEO from '../components/SEO';
import { 
  CLAN_EXHIBITION_METADATA, 
  INTER_CLAN_RELATIONSHIPS, 
  CULTURAL_LAWS, 
  ADJACENT_EXHIBITION_WINGS,
  ClanMetadata
} from '../data/clansExhibitionData';

export default function Clans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  
  // Dynamic statistics state
  const [clanStats, setClanStats] = useState<any[]>([
    { label: 'Registered Clans', value: '0', suffix: ' Clans', description: 'Sovereign lineages documented in the high registry.' },
    { label: 'Active Elders', value: '0', suffix: '+', description: 'Council representatives keeping oral lore alive.' },
    { label: 'Sacred Totems', value: '0', suffix: ' Totems', description: 'Protective animal and botanical symbols.' },
    { label: 'Historic Regions', value: '0', suffix: ' Regions', description: 'Traditional territories and floating bays.' },
    { label: 'Archived Chronicles', value: '0', suffix: ' Records', description: 'Verified historical documents and treaties.' }
  ]);

  // Custom Filter & Interactive States
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('alphabetical');
  const [activeRelationTab, setActiveRelationTab] = useState<string>('rel-1');
  const [spotlightClanId, setSpotlightClanId] = useState<string>('clan-1');

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
  }, [searchParams]);

  useEffect(() => {
    async function fetchClansAndStats() {
      setLoading(true);
      try {
        const [clansData, leadersData, articlesData] = await Promise.all([
          getClans(true).catch(() => []),
          getLeaders(true).catch(() => []),
          getArticles(true).catch(() => [])
        ]);

        setClans(clansData);

        const uniqueTotemsCount = new Set(clansData.map(c => c.totem).filter(Boolean)).size;
        const uniqueRegionsCount = new Set(clansData.map(c => c.origin).filter(Boolean)).size;

        setClanStats([
          {
            label: 'Registered Clans',
            value: String(clansData.length),
            description: 'Sovereign lineages documented in the high registry.',
            suffix: ' Clans'
          },
          {
            label: 'Active Elders',
            value: String(leadersData.length),
            description: 'Council representatives keeping oral lore alive.',
            suffix: '+'
          },
          {
            label: 'Sacred Totems',
            value: String(uniqueTotemsCount),
            description: 'Protective animal and botanical symbols.',
            suffix: ' Totems'
          },
          {
            label: 'Historic Regions',
            value: String(uniqueRegionsCount || 1),
            description: 'Traditional territories and floating bays.',
            suffix: ' Regions'
          },
          {
            label: 'Archived Chronicles',
            value: String(articlesData.length),
            description: 'Verified historical documents and treaties.',
            suffix: ' Records'
          }
        ]);
      } catch (e) {
        console.error('Clans: failed to fetch clans and stats:', e);
        setClans([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClansAndStats();
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  // Helper to extract exhibition-specific metadata
  const getClanExhibitionData = (clan: Clan): ClanMetadata => {
    const metadata = CLAN_EXHIBITION_METADATA[clan.id];
    if (metadata) return metadata;
    
    // Generous fallback for custom clans added through Supabase admin panels
    return {
      imageUrl: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&q=80&w=800', // default calm lake
      historicalRecordsCount: 15,
      activeEldersCount: 3,
      specialization: 'Lineage Custodians',
      heritageStory: clan.desc || 'A proud and sovereign Bakenye lineage group with deep historical bonds to the lands and waters of Lake Kyoga.',
      sacredDuties: [
        'Preservation of lineage oral histories and ancestral genealogies.',
        'Active participation in the Council of Elders assemblies.',
        'Protection of the local environmental habitat associated with the clan totem.'
      ],
      clanColor: 'amber'
    };
  };

  // Extract unique regions dynamically from the database clans
  const uniqueRegions = ['All', ...Array.from(new Set(clans.map(c => c.origin).filter(Boolean) as string[]))];

  // Filtering Logic
  const filteredClans = clans.filter(clan => {
    const matchesSearch = 
      (clan.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clan.totem || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clan.motto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clan.desc || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRegion = selectedRegion === 'All' || clan.origin === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

  // Sorting Logic
  const sortedClans = [...filteredClans].sort((a, b) => {
    if (selectedSort === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (selectedSort === 'totem') {
      return (a.totem || '').localeCompare(b.totem || '');
    }
    if (selectedSort === 'records') {
      const aRecords = getClanExhibitionData(a).historicalRecordsCount;
      const bRecords = getClanExhibitionData(b).historicalRecordsCount;
      return bRecords - aRecords; // descending
    }
    return 0;
  });

  // Get the featured clan based on spotlight state
  const spotlightClan = clans.find(c => c.id === spotlightClanId) || clans[0];
  const spotlightExhibition = spotlightClan ? getClanExhibitionData(spotlightClan) : null;

  // Staggered motion configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } }
  };

  // Helper to map icon names to Lucide icons
  const renderRelationIcon = (name: string) => {
    switch (name) {
      case 'Heart': return <Heart className="w-6 h-6 text-rose-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-amber-500" />;
      case 'Shield': return <Shield className="w-6 h-6 text-blue-500" />;
      default: return <Award className="w-6 h-6 text-amber-600" />;
    }
  };

  const renderWingIcon = (name: string) => {
    switch (name) {
      case 'Calendar': return <HistoryIcon className="w-5 h-5 text-heritage-terracotta" />;
      case 'Languages': return <Languages className="w-5 h-5 text-heritage-terracotta" />;
      case 'Users': return <Users className="w-5 h-5 text-heritage-terracotta" />;
      default: return <Compass className="w-5 h-5 text-heritage-terracotta" />;
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-[#faf8f5] text-stone-900 selection:bg-heritage-terracotta/10">
      <SEO 
        title="Clans Directory & Totem Exhibition"
        description="Explore the sovereign clans, respective totems, regional lineages, and traditional navigators of the Bakenye digital museum."
        keywords="Clans, totems, Crested Crane, Nile Perch, Lungfish, navigation lineages, Bakenye ancestral trees, Lake Kyoga"
      />

      {/* EXHIBITION HERO */}
      <section className="relative bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 py-24 px-4 overflow-hidden text-left">
        {/* Decorative backdrop elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#321c0b]/20 via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 cultural-pattern opacity-[0.06] pointer-events-none" />
        
        {/* Soft amber lights */}
        <div className="absolute -top-40 -left-4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-heritage-terracotta/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs font-mono tracking-wider uppercase text-white/50 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            <span className="text-white/30">Museum Wings</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            <span className="text-amber-400">Clans Directory</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full mb-4">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
                    Sovereign Lineage Pavilion
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-6 tracking-tight leading-none">
                  Clans Directory <span className="font-light italic text-amber-100">& Totem Exhibition</span>
                </h1>
                
                <p className="text-stone-300 max-w-2xl text-base md:text-lg font-light leading-relaxed mb-8">
                  The Bakenye society is anchored by sovereign lineages (<span className="text-amber-200 font-semibold font-serif italic">Abika</span>), each holding ancestral marine territories, dedicated community duties, and sacred totems. This digital exhibition hall archives the lineage chronicles, sacred duties, and traditional guardians authorized by the Council of Elders.
                </p>
              </motion.div>

              {/* Instant Search Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="relative max-w-xl shadow-2xl rounded-2xl bg-white/5 p-1.5 border border-white/10"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-amber-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by clan name, totem, motto, or duties..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-stone-900/80 border border-stone-800 text-white placeholder-stone-400 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none transition-all font-sans text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </motion.div>
              
              {/* Search shortcuts */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-4 flex flex-wrap gap-2 items-center text-xs text-white/50"
              >
                <span className="font-mono uppercase tracking-wider">Suggested:</span>
                {['Crested Crane', 'Mugaya', 'Net Weaving', 'Baise-Igaga'].map((shortcut) => (
                  <button
                    key={shortcut}
                    onClick={() => handleSearchChange(shortcut)}
                    className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 transition-colors cursor-pointer font-medium"
                  >
                    "{shortcut}"
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Quick Navigation Panel */}
            <div className="lg:col-span-4 hidden lg:block bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 cultural-pattern opacity-5" />
              <h3 className="text-amber-400 font-serif font-black text-xl mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
                <span>Exhibition Guide</span>
              </h3>
              <ul className="space-y-3.5 text-xs text-stone-300 font-medium font-sans">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Interactive Clan Lineage Cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Sovereign Spotlight Exhibition</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Inter-Clan Alliance Covenants</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Traditional Marine Sanctuaries & Laws</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-white/10">
                <a 
                  href="#clans-grid" 
                  className="inline-flex items-center text-xs font-bold text-amber-300 hover:text-amber-100 transition-colors"
                >
                  Jump to Gallery <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS BAR */}
      <section className="relative z-20 -mt-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white shadow-2xl border border-stone-200/60 p-6 rounded-[28px]">
            {clanStats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col text-left p-2 ${
                  idx < clanStats.length - 1 ? 'md:border-r border-stone-100' : ''
                } ${idx % 2 === 0 ? 'col-span-1' : 'col-span-1'} ${idx === clanStats.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-serif font-black text-heritage-terracotta tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs font-bold text-stone-500 uppercase">
                    {stat.suffix}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mt-1">
                  {stat.label}
                </h4>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5 font-medium">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SPOTLIGHT CLIN */}
      {spotlightClan && spotlightExhibition && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center md:text-left mb-10">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-heritage-terracotta uppercase tracking-widest mb-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Sovereign Spotlight Exhibition</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight">
              Featured Lineage Showcase
            </h2>
            <p className="text-stone-500 text-sm md:text-base max-w-xl mt-1 font-medium">
              A deep, museum-grade dive into the historical significance, physical habitat, and duties of preeminent Bakenye lineages.
            </p>
          </div>

          <motion.div 
            layoutId="spotlight-panel"
            className="bg-stone-950 rounded-[40px] overflow-hidden border border-stone-800 shadow-2xl flex flex-col lg:flex-row relative text-left"
          >
            {/* Visual Column */}
            <div className="lg:w-1/2 relative min-h-[350px] lg:min-h-full overflow-hidden flex flex-col justify-end p-8 md:p-12">
              <img 
                src={spotlightExhibition.imageUrl} 
                alt={spotlightClan.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20" />
              
              <div className="relative z-10 max-w-md">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4 uppercase tracking-wider">
                  Traditional Emblem
                </span>
                
                <h3 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight mb-2">
                  {spotlightClan.name}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-semibold text-amber-300 uppercase tracking-widest">
                    Totem: {spotlightClan.totem}
                  </p>
                </div>

                {spotlightClan.motto && (
                  <p className="text-stone-300 italic text-base bg-black/40 backdrop-blur-xs p-4 rounded-xl border border-white/5 inline-block">
                    "{spotlightClan.motto}"
                  </p>
                )}
              </div>
            </div>

            {/* Narrative Column */}
            <div className="lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between space-y-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-stone-900/60 via-stone-950 to-stone-950">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    MUSEUM CATALOGUE SUMMARY
                  </h4>
                  <div className="text-2xl font-serif font-black text-stone-100 mt-1">
                    {spotlightExhibition.specialization}
                  </div>
                </div>

                <p className="text-stone-300 leading-relaxed text-sm md:text-base font-light">
                  {spotlightExhibition.heritageStory}
                </p>

                {/* Duties list */}
                <div className="space-y-3.5">
                  <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Sacred Lineage Duties</span>
                  </h5>
                  <ul className="space-y-2.5">
                    {spotlightExhibition.sacredDuties.map((duty, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs text-stone-300 leading-relaxed font-medium">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{duty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Spotlight footer controls */}
              <div className="pt-8 border-t border-stone-800/60 flex flex-wrap gap-6 justify-between items-center">
                <div className="flex gap-4">
                  <div>
                    <h6 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Custodians</h6>
                    <p className="text-xs font-semibold text-stone-200 mt-0.5">{spotlightClan.custodian || 'Elder Council'}</p>
                  </div>
                  <div className="border-r border-stone-800" />
                  <div>
                    <h6 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Geographic Center</h6>
                    <p className="text-xs font-semibold text-stone-200 mt-0.5">{spotlightClan.origin || 'Kyoga Waters'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/clans/${spotlightClan.id}`}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition-all flex items-center gap-2 text-xs cursor-pointer shadow-lg hover:shadow-amber-500/20 text-center"
                  >
                    <span>Open Full Archive</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setSelectedClan(spotlightClan)}
                    className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition-all flex items-center gap-2 text-xs cursor-pointer shadow-lg text-center"
                  >
                    <span>Quick Preview</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* CLANS GALLERY (INTERACTIVE DIRECTORY) */}
      <section id="clans-grid" className="py-20 px-4 bg-[#f4f1ea] border-y border-stone-200/50">
        <div className="max-w-7xl mx-auto">
          
          {/* Controls Bar (Filter, Sort, Search stats) */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-10 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-stone-200/60 shadow-sm">
            
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2 text-left">
              <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5 px-2">
                <Filter className="w-4 h-4 text-heritage-terracotta" />
                <span>Filter Territory:</span>
              </span>
              
              {uniqueRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedRegion === region
                      ? 'bg-heritage-brown text-white shadow-md'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/80'
                  }`}
                >
                  {region === 'All' ? 'All Territories' : region}
                </button>
              ))}
            </div>

            {/* Sort & Stats */}
            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-stone-200/60">
              <div className="flex items-center gap-2 text-left">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sort:</span>
                </span>
                
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                >
                  <option value="alphabetical">A-Z (Alphabetical)</option>
                  <option value="totem">Totem Name</option>
                  <option value="records">Historical Records Volume</option>
                </select>
              </div>

              <div className="text-xs font-mono font-bold text-stone-500 px-3 py-1.5 bg-stone-100 rounded-lg shrink-0">
                Found: {sortedClans.length}
              </div>
            </div>
          </div>

          {/* Exhibition Grid Layout */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-heritage-terracotta/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-heritage-terracotta border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-5 text-xs font-black text-heritage-brown/60 tracking-widest uppercase animate-pulse">
                Accessing Bakenyi Lineage Registries...
              </p>
            </div>
          ) : clans.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-stone-200 max-w-3xl mx-auto px-6 shadow-xs">
              <Shield className="w-16 h-16 text-stone-300 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-black text-heritage-brown mb-2">No Registered Lineages Found</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
                Our cultural registrars have not published any clans to this portal wing. Please verify your connection or check back later.
              </p>
            </div>
          ) : sortedClans.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left"
            >
              <AnimatePresence mode="popLayout">
                {sortedClans.map((clan) => {
                  const exhibition = getClanExhibitionData(clan);
                  const isSpotlighted = clan.id === spotlightClanId;
                  
                  return (
                    <motion.div 
                      layout
                      variants={itemVariants}
                      key={clan.id || clan.name}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setSelectedClan(clan)}
                      className="bg-white rounded-[28px] overflow-hidden border border-stone-200/80 hover:border-heritage-terracotta/35 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between min-h-[460px]"
                    >
                      <div>
                        {/* Header Image Cover */}
                        <div className="h-44 relative overflow-hidden bg-stone-900">
                          <img 
                            src={exhibition.imageUrl} 
                            alt={clan.name} 
                            className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                          <div className="absolute inset-0 cultural-pattern opacity-[0.04]" />
                          
                          {/* Totem floating badge */}
                          <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <Compass className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                              Totem: {clan.totem || "Unregistered"}
                            </span>
                          </div>

                          {/* Council Approved Floating Tag */}
                          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-emerald-500/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-emerald-400/20 shadow-lg">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">
                              Verified
                            </span>
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-6 md:p-8 space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-serif font-black text-stone-900 leading-tight group-hover:text-heritage-terracotta transition-colors">
                              {clan.name}
                            </h3>
                            <div className="text-xs font-bold text-heritage-terracotta uppercase tracking-widest flex items-center gap-1.5">
                              <span>{exhibition.specialization}</span>
                            </div>
                          </div>

                          {clan.motto && (
                            <div className="bg-stone-50 border-l-2 border-amber-500 px-3.5 py-2 rounded-r-lg italic text-stone-600 font-medium text-xs">
                              "{clan.motto}"
                            </div>
                          )}

                          <p className="text-xs md:text-sm text-stone-500 leading-relaxed line-clamp-3 font-medium">
                            {clan.desc || clan.description || 'Traditional Bakenyi lineage group with deep historical maritime bonds.'}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 md:px-8 pb-6 md:pb-8 pt-4 border-t border-stone-100/80">
                        {/* Micro stats metrics */}
                        <div className="flex justify-between items-center text-[11px] text-stone-500 font-bold mb-4">
                          <span className="flex items-center gap-1">
                            <BookMarked className="w-3.5 h-3.5 text-amber-600" />
                            <span>{exhibition.historicalRecordsCount} Chronicles</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            <span>{exhibition.activeEldersCount} Lineage Elders</span>
                          </span>
                        </div>

                        <div className="flex gap-2 items-center">
                          <Link 
                            to={`/clans/${clan.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="flex-1 py-2 rounded-lg bg-heritage-terracotta hover:bg-[#a33719] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>Full Archive</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClan(clan);
                            }}
                            className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-heritage-brown text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Quick View</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSpotlightClanId(clan.id);
                              const featuredSec = document.getElementById('clans-grid');
                              if (featuredSec) {
                                featuredSec.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            title="Spotlight this clan on top page"
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isSpotlighted 
                                ? 'bg-amber-100 border-amber-400 text-amber-700' 
                                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-700'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-stone-200 max-w-2xl mx-auto px-6">
              <Search className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-700 text-lg font-serif font-black">No Lineages Found Matching "{searchTerm}"</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
                Verify the spelling or adjust your geographical region filter to discover different branches.
              </p>
              <button 
                onClick={() => {
                  handleSearchChange("");
                  setSelectedRegion('All');
                }}
                className="px-5 py-2.5 bg-heritage-terracotta hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Reset All Exhibition Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* INTER-CLAN COVENANTS & PROTOCOLS (CULTURAL RELATIONSHIPS) */}
      <section className="py-24 px-4 bg-white text-stone-900 relative">
        <div className="absolute inset-0 bg-stone-50/50 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-1 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full mb-3">
              <Layers className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                Inter-Clan Kinships & Treaties
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 tracking-tight leading-tight">
              Kinship, Covenants & <span className="font-light italic text-heritage-terracotta">Inter-Clan Protocols</span>
            </h2>
            
            <p className="text-stone-500 text-sm md:text-base leading-relaxed mt-4 font-medium">
              Social cohesion in Bakenye society was maintained through strict oral treaties, specialized labor barters, and matrimonial laws. This interactive map displays the traditional alliances and covenants authorized by ancestral councils.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Left sidebar selectors */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {INTER_CLAN_RELATIONSHIPS.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => setActiveRelationTab(rel.id)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-4 ${
                    activeRelationTab === rel.id
                      ? 'bg-stone-950 border-stone-950 text-white shadow-xl'
                      : 'bg-[#faf8f5] hover:bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-white/10 shrink-0 shadow-sm border border-stone-200/5 dark:border-white/5">
                    {renderRelationIcon(rel.iconName)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                      {rel.protocolType} Protocol
                    </span>
                    <h4 className="text-lg font-serif font-bold leading-snug mt-0.5">
                      {rel.title}
                    </h4>
                  </div>
                </button>
              ))}
            </div>

            {/* Right details display */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {INTER_CLAN_RELATIONSHIPS.map((rel) => {
                  if (rel.id !== activeRelationTab) return null;
                  
                  return (
                    <motion.div
                      key={rel.id}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#faf8f5] rounded-3xl border border-stone-200 p-8 md:p-10 flex flex-col justify-between h-full relative"
                    >
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase tracking-wider">
                            Alliance Covenants ({rel.protocolType})
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-400">
                            ID: {rel.id}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl md:text-3xl font-serif font-black text-stone-900 tracking-tight leading-tight">
                            {rel.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-stone-500">
                            <span>Involved Lineages:</span>
                            {rel.clansInvolved.map((c, i) => (
                              <span key={i} className="text-heritage-terracotta bg-white px-2.5 py-0.5 rounded border border-stone-200/60 shadow-2xs">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-stone-600 leading-relaxed text-sm md:text-base font-medium">
                          {rel.description}
                        </p>

                        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-3xs space-y-2.5">
                          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4 text-heritage-terracotta" />
                            <span>Traditional Ritual Practices</span>
                          </h4>
                          <p className="text-xs md:text-sm text-stone-500 leading-relaxed font-medium">
                            {rel.ritualDetails}
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-stone-200 flex gap-3 items-start text-[11px] text-stone-500 leading-normal mt-8 font-medium">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Inter-clan alliances are highly sacred. Breaking a shoreline covenant is believed to bring ecological imbalance to the offender's marine channel.
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* SACRED LAWS & ENVIRONMENTAL SANCTUARIES */}
      <section className="py-24 px-4 bg-[#f4f1ea] border-t border-stone-200/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight leading-tight">
              Traditional Aquatic Laws <span className="font-light italic text-heritage-terracotta">& Sanctuaries</span>
            </h2>
            <p className="text-stone-500 text-xs md:text-sm max-w-xl mx-auto mt-2 font-medium">
              Environmental conservation of the Lake Kyoga wetlands was written directly into the spiritual laws of Bakenye clans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {CULTURAL_LAWS.map((law, idx) => (
              <div key={idx} className="bg-white rounded-[32px] p-8 border border-stone-200 shadow-xs hover:shadow-lg transition-shadow relative">
                <div className="absolute top-8 right-8 text-3xl font-serif font-black text-stone-100 select-none">
                  0{idx+1}
                </div>
                
                <h3 className="text-xl font-serif font-black text-heritage-brown mb-3 pr-8">
                  {law.title}
                </h3>
                
                <p className="text-xs md:text-sm text-stone-600 leading-relaxed mb-6 font-medium">
                  {law.description}
                </p>

                <div className="space-y-3.5 pt-4 border-t border-stone-100">
                  <div className="flex gap-2.5 items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded shrink-0">
                      Consequence
                    </span>
                    <p className="text-[11px] font-medium text-stone-600 leading-relaxed">
                      {law.consequence}
                    </p>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                      Practice
                    </span>
                    <p className="text-[11px] font-medium text-stone-600 leading-relaxed">
                      {law.sacredPractice}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTINUOUS EXPLORATION WINGS */}
      <section className="py-24 px-4 bg-gradient-to-b from-stone-900 to-stone-950 text-white relative">
        <div className="absolute inset-0 cultural-pattern opacity-5" />
        <div className="max-w-7xl mx-auto text-center">
          
          <div className="max-w-xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight">
              Continue Your Exhibition Walk
            </h2>
            <p className="text-stone-400 text-xs md:text-sm mt-2 leading-relaxed font-medium">
              Enter other halls of the Bakenye digital museum to discover our deep temporal history, language dictations, and elder advisory leadership records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ADJACENT_EXHIBITION_WINGS.map((wing, i) => (
              <Link 
                to={wing.link} 
                key={i}
                className="group relative h-80 rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-end p-8 text-left shadow-2xl"
              >
                <img 
                  src={wing.bannerImage} 
                  alt={wing.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                
                <div className="relative z-10 space-y-3">
                  <div className="p-2.5 bg-white/10 border border-white/10 rounded-xl inline-block backdrop-blur-md">
                    {renderWingIcon(wing.iconName)}
                  </div>
                  
                  <h3 className="text-2xl font-serif font-black text-white group-hover:text-amber-300 transition-colors">
                    {wing.title}
                  </h3>
                  
                  <p className="text-stone-300 text-xs leading-relaxed line-clamp-2 font-medium">
                    {wing.description}
                  </p>
                  
                  <div className="inline-flex items-center text-xs font-bold text-amber-300 gap-1 pt-1 group-hover:translate-x-1.5 transition-transform">
                    <span>Enter Wing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* CLAN EXHIBITION CHRONICLE DETAIL MODAL */}
      <AnimatePresence>
        {selectedClan && (() => {
          const exhibition = getClanExhibitionData(selectedClan);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              
              {/* Backdrop Blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedClan(null)}
                className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
              />
              
              {/* Exhibition Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 180 }}
                className="relative bg-[#faf8f5] w-full max-w-4xl rounded-[40px] overflow-hidden border border-heritage-terracotta/15 shadow-2xl z-10 text-left flex flex-col md:flex-row"
              >
                
                {/* Left Column - Visual Emblem & Custodian Panel */}
                <div className="md:w-2/5 bg-stone-950 text-white p-8 relative flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#321c0b]/15 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 cultural-pattern opacity-[0.04] pointer-events-none" />
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Header info */}
                  <div className="relative space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                        Lineage Registry
                      </span>
                      <button 
                        onClick={() => setSelectedClan(null)}
                        className="md:hidden text-white/50 hover:text-white transition-colors text-lg cursor-pointer font-sans p-1 hover:bg-white/5 rounded-lg"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Large Icon Crest */}
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative group mx-auto md:mx-0">
                      <div className="absolute inset-2 border border-dashed border-white/10 rounded-2xl pointer-events-none" />
                      <Shield className="w-12 h-12 text-amber-500" />
                    </div>
                    
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight">
                        {selectedClan.name}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/25">
                        <Compass className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Totem: {selectedClan.totem || "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custodian details at bottom */}
                  <div className="relative mt-8 pt-6 border-t border-white/10 space-y-4">
                    <div className="flex gap-3 items-center">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-sm">
                        <User className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-white/40 leading-none mb-1">Registered Custodian</h5>
                        <p className="text-xs font-bold text-white">{selectedClan.custodian || "Council of Elders"}</p>
                      </div>
                    </div>

                    {selectedClan.origin && (
                      <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-sm">
                          <MapPin className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h5 className="text-[9px] font-mono font-black uppercase tracking-wider text-white/40 leading-none mb-1">Geographic Center</h5>
                          <p className="text-xs font-bold text-white">{selectedClan.origin}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Story & Chronicles Narrative */}
                <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-between max-h-[80vh] md:max-h-[640px] overflow-y-auto space-y-8 bg-white text-left relative">
                  
                  {/* Close Button on Desktop */}
                  <button 
                    onClick={() => setSelectedClan(null)}
                    className="hidden md:block absolute top-6 right-8 text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-2 rounded-xl transition-all cursor-pointer font-bold"
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-6">
                    {/* Motto if registered */}
                    {selectedClan.motto && (
                      <div className="bg-[#faf8f5] border-l-4 border-heritage-terracotta p-5 rounded-r-2xl italic text-stone-700 font-medium text-sm shadow-2xs">
                        "{selectedClan.motto}"
                      </div>
                    )}

                    {/* Summary narratives */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta flex items-center gap-2">
                        <BookOpen className="w-4.5 h-4.5" />
                        <span>Lineage Chronicle & Specialized Duty</span>
                      </h4>
                      <p className="text-sm text-stone-700 leading-relaxed font-medium">
                        {exhibition.heritageStory}
                      </p>
                    </div>

                    {/* Detailed History chronicles */}
                    {selectedClan.history && (
                      <div className="space-y-2.5 pt-6 border-t border-stone-100">
                        <h4 className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta flex items-center gap-2">
                          <Calendar className="w-4.5 h-4.5" />
                          <span>Sacred History & Oral Records</span>
                        </h4>
                        <p className="text-xs md:text-sm text-stone-600 leading-relaxed whitespace-pre-wrap font-medium">
                          {selectedClan.history}
                        </p>
                      </div>
                    )}

                    {/* Duties bullet points inside modal */}
                    <div className="space-y-3.5 pt-6 border-t border-stone-100">
                      <h4 className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta flex items-center gap-2">
                        <Award className="w-4.5 h-4.5" />
                        <span>Preserved Guild Duties</span>
                      </h4>
                      <ul className="grid grid-cols-1 gap-2.5">
                        {exhibition.sacredDuties.map((duty, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-stone-600 font-medium leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{duty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Open Full Archive Button inside Modal */}
                    <div className="pt-6 border-t border-stone-100">
                      <Link
                        to={`/clans/${selectedClan.id}`}
                        onClick={() => setSelectedClan(null)}
                        className="w-full py-3.5 bg-heritage-terracotta hover:bg-[#a33719] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-colors text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Open Full Archive Page</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Disclaimer/Advisory block */}
                  <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-[10px] text-stone-400 font-bold mt-8">
                    <div className="flex gap-2 items-start max-w-sm">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="font-sans leading-normal">
                        This archival registry is sealed and certified by the Supreme Elder council. Descendants may request correction through direct lineage custodians.
                      </span>
                    </div>

                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-wider text-center">
                      Seal Verified
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
