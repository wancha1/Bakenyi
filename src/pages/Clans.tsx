import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Shield, Info, Filter, Sparkles, User, Calendar, BookOpen, MapPin } from 'lucide-react';
import { getClans, Clan } from '../lib/supabase';
import SEO from '../components/SEO';

export default function Clans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
  }, [searchParams]);

  useEffect(() => {
    async function fetchClans() {
      setLoading(true);
      try {
        const data = await getClans(true); // fetch approved clans
        setClans(data);
      } catch (e) {
        console.error('Clans: failed to fetch:', e);
        setClans([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClans();
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  const filteredClans = clans.filter(clan => 
    (clan.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clan.totem || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      <SEO 
        title="Clans & Totems Directory"
        description="Discover the sacred clans, respective totems, regional lineages, and traditional navigators of the Bakenye community."
        keywords="Clans, totems, crest crane, navigation lineages, Bakenye ancestral trees"
      />
      {/* Search Header */}
      <section className="relative bg-gradient-to-br from-stone-950 via-stone-900 to-[#2c1d11] py-20 px-4 overflow-hidden border-b border-stone-800/60 text-left">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-heritage-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-serif font-black text-white mb-6 tracking-tight leading-tight"
            >
              The Bakenyi Clans
            </motion.h1>
            <p className="text-heritage-sand max-w-2xl mx-auto mb-10 text-base md:text-lg font-light leading-relaxed">
              Our clans (Abika) are the pillars of Bakenyi identity, defining our origins, kinships, and cultural responsibilities.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto shadow-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by clan name or totem..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white dark:bg-stone-900 border border-stone-200/10 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-stone-900 dark:text-white transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Clans Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-heritage-terracotta/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-heritage-terracotta border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-xs font-bold text-heritage-brown/60 tracking-wider uppercase animate-pulse">
                Accessing Bakenyi Clan registries...
              </p>
            </div>
          ) : clans.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-heritage-brown/10 max-w-3xl mx-auto px-6">
              <Shield className="w-16 h-16 text-heritage-brown/20 mx-auto mb-6" />
              <h3 className="text-xl font-serif font-bold text-heritage-brown mb-2">No clans have been registered yet</h3>
              <p className="text-sm text-heritage-brown/50 max-w-md mx-auto mb-6">
                Our cultural registrars have not published any clans to the portal. Please check back later.
              </p>
            </div>
          ) : filteredClans.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredClans.map((clan) => (
                  <motion.div 
                    layout
                    key={clan.id || clan.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedClan(clan)}
                    className="heritage-card group cursor-pointer hover:border-heritage-terracotta/40 transition-colors"
                  >
                    <div className="h-32 bg-heritage-brown/5 flex items-center justify-center relative overflow-hidden">
                      <Shield className="w-16 h-16 text-heritage-terracotta/10 group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 cultural-pattern opacity-10" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-heritage-brown">{clan.name}</h3>
                          <p className="text-xs font-bold text-heritage-terracotta uppercase tracking-wider">{clan.totem}</p>
                        </div>
                      </div>
                      {clan.motto && <p className="text-sm text-heritage-brown/70 italic mb-4">"{clan.motto}"</p>}
                      <p className="text-sm text-heritage-brown/60 leading-relaxed line-clamp-3">
                        {clan.desc || clan.description || 'Traditional Bakenyi lineage group with deep historical bonds.'}
                      </p>
                      
                      <div className="mt-4 pt-4 border-t border-heritage-brown/5 flex items-center justify-between text-xs font-bold text-heritage-terracotta uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        <span>Learn History</span>
                        <span>→</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-heritage-brown/10">
              <Search className="w-12 h-12 text-heritage-brown/20 mx-auto mb-4" />
              <p className="text-heritage-brown/60 text-lg">No clans found matching "{searchTerm}"</p>
              <button 
                onClick={() => handleSearchChange("")}
                className="mt-4 text-heritage-terracotta font-bold hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Clan Protocol Section */}
      <section className="py-24 px-4 bg-white border-t border-heritage-brown/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-24 h-24 bg-heritage-terracotta/10 rounded-full flex items-center justify-center shrink-0">
              <Filter className="w-10 h-10 text-heritage-terracotta" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-4">Clan Responsibilities</h2>
              <p className="text-heritage-brown/60 leading-relaxed mb-6">
                In Bakenyi society, every clan had a dedicated role—from canoe building to diplomatic relations between clans. Protecting the totem (symbolic animal or object) is sacred, signifying the clan's respect for nature and ancestry.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-sm text-heritage-brown/70">
                  <span className="w-2 h-2 bg-heritage-terracotta rounded-full" />
                  <span>Exogamous marriage rules</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-heritage-brown/70">
                  <span className="w-2 h-2 bg-heritage-terracotta rounded-full" />
                  <span>Sacred Burial Grounds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Immersive Museum-Quality Clan Exhibition Board */}
      <AnimatePresence>
        {selectedClan && (
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
              className="relative bg-heritage-cream dark:bg-stone-900 w-full max-w-4xl rounded-[32px] overflow-hidden border border-heritage-terracotta/20 dark:border-stone-800 shadow-2xl z-10 text-left flex flex-col md:flex-row"
            >
              
              {/* Left Column - Visual Emblem & Custodian Panel */}
              <div className="md:w-2/5 bg-heritage-brown dark:bg-stone-950 text-white p-8 relative flex flex-col justify-between border-b md:border-b-0 md:border-r border-heritage-terracotta/10 overflow-hidden">
                <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-heritage-terracotta/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header info */}
                <div className="relative space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-sans font-black uppercase tracking-widest text-heritage-sand bg-white/10 px-2.5 py-1 rounded-full">
                      Lineage Registry
                    </span>
                    <button 
                      onClick={() => setSelectedClan(null)}
                      className="md:hidden text-white/70 hover:text-white transition-colors text-lg cursor-pointer"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Large Icon Crest */}
                  <div className="w-24 h-24 rounded-3xl bg-heritage-cream/5 border border-white/10 flex items-center justify-center shadow-inner relative group mx-auto md:mx-0">
                    <div className="absolute inset-2 border border-dashed border-white/15 rounded-2xl pointer-events-none" />
                    <Shield className="w-12 h-12 text-heritage-terracotta" />
                  </div>
                  
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight">
                      {selectedClan.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-heritage-sand uppercase tracking-widest">
                      {selectedClan.totem ? `Totem: ${selectedClan.totem}` : "No totem registered"}
                    </p>
                  </div>
                </div>

                {/* Custodian detail at bottom */}
                <div className="relative mt-8 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <User className="w-4 h-4 text-heritage-sand" />
                    </div>
                    <div>
                      <h5 className="text-[9px] font-black uppercase tracking-wider text-white/40">Registered Custodian</h5>
                      <p className="text-xs font-semibold text-white/90">{selectedClan.custodian || "Council of Elders"}</p>
                    </div>
                  </div>

                  {selectedClan.origin && (
                    <div className="flex gap-3 items-center">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <MapPin className="w-4 h-4 text-heritage-sand" />
                      </div>
                      <div>
                        <h5 className="text-[9px] font-black uppercase tracking-wider text-white/40">Geographic Center</h5>
                        <p className="text-xs font-semibold text-white/90">{selectedClan.origin}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Story & Chronicles Narrative */}
              <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-between max-h-[85vh] md:max-h-[600px] overflow-y-auto space-y-8 bg-white/50 dark:bg-stone-900/40">
                
                {/* Close Button on Desktop */}
                <button 
                  onClick={() => setSelectedClan(null)}
                  className="hidden md:block absolute top-6 right-8 text-heritage-brown/50 hover:text-heritage-brown dark:text-stone-400 dark:hover:text-white transition-colors text-lg cursor-pointer font-bold self-end"
                  aria-label="Close panel"
                >
                  ✕
                </button>

                <div className="space-y-6">
                  {/* Motto if registered */}
                  {selectedClan.motto && (
                    <div className="bg-heritage-cream dark:bg-stone-800 border-l-4 border-heritage-terracotta p-5 rounded-r-2xl italic text-heritage-brown/80 dark:text-stone-200 font-medium text-sm shadow-xs">
                      "{selectedClan.motto}"
                    </div>
                  )}

                  {/* Summary narratives */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Lineage Chronicle</span>
                    </h4>
                    <p className="text-sm text-heritage-brown/75 dark:text-stone-300 leading-relaxed font-medium">
                      {selectedClan.desc || selectedClan.description || "Traditional Bakenyi lineage group with deep historical bonds."}
                    </p>
                  </div>

                  {/* Detailed History chronicles */}
                  {selectedClan.history && (
                    <div className="space-y-3 pt-6 border-t border-heritage-brown/5 dark:border-stone-800">
                      <h4 className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Sacred History & Oral Records</span>
                      </h4>
                      <p className="text-sm text-heritage-brown/75 dark:text-stone-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedClan.history}
                      </p>
                    </div>
                  )}
                </div>

                {/* Disclaimer/Advisory block */}
                <div className="pt-6 border-t border-heritage-brown/5 dark:border-stone-800 flex gap-3 items-start text-[11px] text-heritage-brown/50 dark:text-stone-400 font-medium">
                  <Info className="w-4 h-4 text-heritage-terracotta shrink-0 mt-0.5" />
                  <span>
                    This archival registry was authorized directly by the Council of Elder Custodians. Descendants may request correction through their clan leader.
                  </span>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
