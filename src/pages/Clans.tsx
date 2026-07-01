import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Shield, Info, Filter } from 'lucide-react';

const bakenyiClans = [
  { name: "BaiseMugosa", totem: "Leopard (Egoonzu)", motto: "Strength & Swiftness", desc: "One of the largest clans, traditionally known for their leadership and tactical skills." },
  { name: "BaiseIgoola", totem: "Egrets (Ennyaange)", motto: "Purity & Unity", desc: "Known for their diplomatic skills and mediating conflicts within the community." },
  { name: "BaiseMusuusu", totem: "Bird (Enfulu)", motto: "Resourcefulness", desc: "Experts in navigating the complex waterways of Lake Kyoga." },
  { name: "BaiseMunana", totem: "Colobus Monkey", motto: "Wisdom of the Tree", desc: "Historically provided many of the community's advisors and storytellers." },
  { name: "BaiseKiingi", totem: "Lion", motto: "Royalty & Courage", desc: "A clan with deep roots in the original leadership structures of the Bakenyi people." },
  { name: "BaiseMuduma", totem: "Hippopotamus", motto: "Power over Water", desc: "Respected for their bravery in protecting the floating islands from threats." },
  { name: "BaiseNume", totem: "Bull", motto: "Stability & Wealth", desc: "Known for their early adoption of land-based agriculture alongside fishing." },
  { name: "BaiseMpina", totem: "Fish (Emputa)", motto: "Sustenance", desc: "The masters of the net; traditionally the most successful fishers in the Kyoga basin." }
];

export default function Clans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  const filteredClans = bakenyiClans.filter(clan => 
    clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clan.totem.toLowerCase().includes(searchTerm.toLowerCase())
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
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white border-2 border-heritage-terracotta/20 focus:border-heritage-terracotta focus:outline-none text-heritage-brown transition-all"
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
          {filteredClans.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredClans.map((clan, idx) => (
                  <motion.div 
                    layout
                    key={clan.name}
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
                      <p className="text-sm text-heritage-brown/70 italic mb-4">"{clan.motto}"</p>
                      <p className="text-sm text-heritage-brown/60 leading-relaxed">
                        {clan.desc}
                      </p>
                      
                      <button className="mt-6 w-full py-2 border border-heritage-brown/10 rounded-lg text-xs font-bold text-heritage-brown hover:bg-heritage-brown hover:text-white transition-colors flex items-center justify-center uppercase tracking-widest">
                        <Info className="w-3 h-3 mr-2" />
                        Clan Details
                      </button>
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
                className="mt-4 text-heritage-terracotta font-bold hover:underline"
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
