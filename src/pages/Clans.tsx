import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Shield, Info, Filter, Sparkles } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

export default function Clans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
  }, [searchParams]);

  useEffect(() => {
    async function fetchClans() {
      setLoading(true);
      const client = getSupabase();
      if (!client) {
        setClans([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await client
          .from('clans')
          .select('*')
          .order('name', { ascending: true });
        
        if (!error && data) {
          setClans(data);
        } else {
          setClans([]);
        }
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
      {/* Search Header */}
      <section className="bg-heritage-brown py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
            >
              The Bakenyi Clans
            </motion.h1>
            <p className="text-heritage-sand max-w-2xl mx-auto mb-10 text-lg">
              Our clans (Abika) are the pillars of Bakenyi identity, defining our origins, kinships, and cultural responsibilities.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by clan name or totem..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white border-2 border-heritage-terracotta/20 focus:border-heritage-terracotta focus:outline-none text-heritage-brown transition-all font-semibold"
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
                    className="heritage-card group"
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
                      <p className="text-sm text-heritage-brown/60 leading-relaxed">
                        {clan.desc || clan.description || 'Traditional Bakenyi lineage group with deep historical bonds.'}
                      </p>
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
    </div>
  );
}
