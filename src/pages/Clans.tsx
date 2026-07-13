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

      {/* Ancestral History Modal */}
      <AnimatePresence>
        {selectedClan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClan(null)}
              className="absolute inset-0 bg-heritage-brown/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-heritage-cream w-full max-w-2xl rounded-[32px] overflow-hidden border-2 border-heritage-terracotta/20 shadow-2xl z-10 text-left"
            >
              <div className="bg-heritage-brown p-8 text-white relative">
                <div className="absolute inset-0 cultural-pattern opacity-10" />
                <button 
                  onClick={() => setSelectedClan(null)}
                  className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors text-lg cursor-pointer font-bold"
                >
                  ✕
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-heritage-terracotta/20 flex items-center justify-center shrink-0 border border-heritage-terracotta/30">
                    <Shield className="w-6 h-6 text-heritage-terracotta" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-heritage-sand">Bakenyi Lineage Group</span>
                    <h3 className="text-3xl font-serif font-bold text-white">{selectedClan.name}</h3>
                  </div>
                </div>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 border border-heritage-brown/5 rounded-2xl p-4 flex gap-3 items-center">
                    <Sparkles className="w-5 h-5 text-heritage-terracotta shrink-0" />
                    <div>
                      <h5 className="text-[10px] font-bold text-heritage-brown/40 uppercase tracking-wider">Totem / Emblem</h5>
                      <p className="text-xs font-bold text-heritage-brown">{selectedClan.totem || 'None'}</p>
                    </div>
                  </div>

                  <div className="bg-white/80 border border-heritage-brown/5 rounded-2xl p-4 flex gap-3 items-center">
                    <User className="w-5 h-5 text-heritage-terracotta shrink-0" />
                    <div>
                      <h5 className="text-[10px] font-bold text-heritage-brown/40 uppercase tracking-wider">Assigned Custodian</h5>
                      <p className="text-xs font-bold text-heritage-brown">{selectedClan.custodian || 'No custodian assigned'}</p>
                    </div>
                  </div>

                  {selectedClan.origin && (
                    <div className="bg-white/80 border border-heritage-brown/5 rounded-2xl p-4 flex gap-3 items-center md:col-span-2">
                      <MapPin className="w-5 h-5 text-heritage-terracotta shrink-0" />
                      <div>
                        <h5 className="text-[10px] font-bold text-heritage-brown/40 uppercase tracking-wider">Geographic Settlement Origin</h5>
                        <p className="text-xs font-bold text-heritage-brown">{selectedClan.origin}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedClan.motto && (
                  <div className="bg-white border-l-4 border-heritage-terracotta p-4 rounded-r-2xl italic text-heritage-brown/70 font-medium">
                    "{selectedClan.motto}"
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-heritage-terracotta flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Origins & Descriptive Summary</span>
                  </h4>
                  <p className="text-sm text-heritage-brown/70 leading-relaxed font-medium">
                    {selectedClan.desc || selectedClan.description || 'Traditional Bakenyi lineage group with deep historical bonds.'}
                  </p>
                </div>

                {selectedClan.history && (
                  <div className="space-y-2 pt-4 border-t border-heritage-brown/5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-heritage-terracotta flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Detailed Ancestral History & Timeline</span>
                    </h4>
                    <p className="text-sm text-heritage-brown/70 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedClan.history}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
