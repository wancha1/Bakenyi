import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Linkedin, User, ShieldCheck, Award, Users } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

export default function Leadership() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      setLoading(true);
      const client = getSupabase();
      if (!client) {
        setLeaders([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await client
          .from('leaders')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          setLeaders(data);
        } else {
          setLeaders([]);
        }
      } catch (e) {
        console.error('Leadership: failed to fetch leaders:', e);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaders();
  }, []);

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Page Header */}
      <section className="bg-heritage-brown py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            Custodians of Culture
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            The committee dedicated to steering the Bakenyi Heritage Platform.
          </p>
        </div>
      </section>

      {/* Leadership Grid */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-heritage-terracotta/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-heritage-terracotta border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-xs font-bold text-heritage-brown/60 tracking-wider uppercase animate-pulse">
                Summoning the Bakenyi elders...
              </p>
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-heritage-brown/10 max-w-3xl mx-auto px-6">
              <Users className="w-16 h-16 text-heritage-brown/20 mx-auto mb-6" />
              <h3 className="text-xl font-serif font-bold text-heritage-brown mb-2">No cultural leaders found</h3>
              <p className="text-sm text-heritage-brown/50 max-w-md mx-auto">
                No verified cultural council custodians have been registered to the platform.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {leaders.map((leader, i) => {
                const isHighlighted = query !== '' && (leader.name || '').toLowerCase().includes(query.toLowerCase());
                return (
                  <motion.div
                    key={leader.id || i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`heritage-card flex flex-col items-center p-8 bg-white relative transition-all duration-500 ${
                      isHighlighted ? 'ring-4 ring-heritage-terracotta border-heritage-terracotta shadow-2xl scale-105 z-10' : ''
                    }`}
                  >
                    {isHighlighted && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-heritage-terracotta text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-bounce">
                        Search Match
                      </span>
                    )}
                    <div className="w-32 h-32 rounded-full bg-heritage-cream mb-6 overflow-hidden flex items-center justify-center border-4 border-heritage-terracotta/20">
                      {leader.photo_url || leader.imageUrl ? (
                        <img 
                          src={leader.photo_url || leader.imageUrl} 
                          alt={leader.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-16 h-16 text-heritage-brown/20" />
                      )}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-heritage-brown text-center mb-1">{leader.name}</h3>
                    <p className="text-heritage-terracotta text-xs font-bold uppercase tracking-widest mb-4 text-center">{leader.role || 'Committee Member'}</p>
                    <p className="text-heritage-brown/60 text-sm text-center mb-6 leading-relaxed flex-grow">
                      {leader.bio || 'Verifying authentic oral narratives and supervising digital language programs.'}
                    </p>
                    <div className="w-full pt-4 border-t border-heritage-brown/5 flex flex-col items-center">
                      <div className="flex items-center text-heritage-olive text-[10px] font-bold uppercase tracking-wider mb-4">
                        <Award className="w-3 h-3 mr-1" />
                        {leader.expertise || 'Cultural Custodian'}
                      </div>
                      <div className="flex space-x-3">
                        <button className="p-2 rounded-full bg-heritage-cream text-heritage-brown hover:bg-heritage-terracotta hover:text-white transition-colors cursor-pointer">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-full bg-heritage-cream text-heritage-brown hover:bg-heritage-terracotta hover:text-white transition-colors cursor-pointer">
                          <Linkedin className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Organizational Structure */}
      <section className="py-24 bg-white px-4 border-t border-heritage-brown/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-heritage-terracotta font-bold text-xs uppercase tracking-widest block mb-4">Our Structure</span>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-8">Committed to Transparency and Heritage</h2>
              <p className="text-heritage-brown/70 text-lg leading-relaxed mb-8">
                The Platform is governed by a multi-disciplinary committee including elders, academics, and community organizers. We ensure that every piece of documentation is verified for accuracy against known oral and written records.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-heritage-brown font-medium">Verified Oral Research</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-heritage-brown font-medium">Community-Led Governance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-heritage-brown font-medium">Youth Mentorship Programs</span>
                </div>
              </div>
            </div>
            <div className="bg-heritage-cream p-12 rounded-3xl relative">
              <div className="absolute inset-0 cultural-pattern opacity-10" />
              <div className="relative z-10 text-center">
                <p className="text-lg text-heritage-brown/80 font-serif italic mb-8">
                  "Leadership in Bakenyi culture has always been about service to the collective, ensuring that the legacy of those who walked before us is carried with dignity by those who come after us."
                </p>
                <div className="w-12 h-1 bg-heritage-terracotta mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-heritage-brown">Cultural Council Manifesto</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
