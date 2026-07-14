import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Shield, Award, Coffee, Compass, Volume2, ChevronRight } from 'lucide-react';

interface FeaturedHeritageProps {
  featuredItems: {
    clan: {
      name: string;
      totem: string;
      desc: string;
    };
    leader: {
      name: string;
      role: string;
      bio: string;
    };
    food: {
      title: string;
      desc: string;
    };
    artifact: {
      title: string;
      desc: string;
    };
    oralHistory: {
      title: string;
      desc: string;
    };
  };
}

export default function FeaturedHeritage({ featuredItems }: FeaturedHeritageProps) {
  return (
    <section id="curated-exhibits-bento" className="py-24 bg-stone-50 dark:bg-stone-900/40 border-b border-stone-200/50 dark:border-stone-800 relative text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <span className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
            Curated Museum Exhibits
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white leading-tight">
            Featured Cultural Spotlights
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 max-w-xl">
            Immerse yourself in authentic pieces of Bakenyi memory, vetted and presented by our digital keepers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Box 1: Clan of the Week */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            id="bento-clan-of-the-week"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Clan of the Week
                </span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                {featuredItems.clan.name}
              </h3>
              <div className="mt-2 inline-block px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg font-mono">
                Totem: {featuredItems.clan.totem}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed text-left">
                {featuredItems.clan.desc}
              </p>
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-medium">Settled around Kyoga basin</span>
              <Link to="/clans" className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline flex items-center font-bold">
                Discover Clans <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Box 2: Elder Spotlight */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            id="bento-elder-spotlight"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Elder Spotlight
                </span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                {featuredItems.leader.name}
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                {featuredItems.leader.role}
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed text-left">
                {featuredItems.leader.bio}
              </p>
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-medium">Active Council Member</span>
              <Link to="/leadership" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline flex items-center font-bold">
                Meet Elders <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Box 3: Traditional Food */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            id="bento-dietary-spotlight"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-full" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Coffee className="w-5 h-5 text-orange-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Gastronomy & Diet
                </span>
              </div>
              <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                {featuredItems.food.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed text-left">
                {featuredItems.food.desc}
              </p>
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-medium">Kyoga Basin Cuisine</span>
              <Link to="/history" className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 hover:underline flex items-center font-bold">
                Read History <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Box 4: Cultural Artifact */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full lg:col-span-2 relative overflow-hidden"
            id="bento-artifact-spotlight"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                    Ancestral Artifacts
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white">
                  {featuredItems.artifact.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 leading-relaxed text-left">
                  {featuredItems.artifact.desc}
                </p>
              </div>
              <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
                <img 
                  src="https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=600" 
                  alt="Dugout canoe visual representative" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-stone-900/10" />
              </div>
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-medium">Lake Navigation Tech</span>
              <Link to="/gallery" className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline flex items-center font-bold">
                Examine Gallery <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Box 5: Oral Legend */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full relative overflow-hidden"
            id="bento-oral-legend"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full" />
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Volume2 className="w-5 h-5 text-rose-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                  Oral Legend
                </span>
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white line-clamp-1">
                {featuredItems.oralHistory.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 leading-relaxed line-clamp-4 text-left">
                {featuredItems.oralHistory.desc}
              </p>
            </div>
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800/80 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-medium">Floating worlds of Kyoga</span>
              <Link to="/articles" className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:underline flex items-center font-bold">
                Read Memoirs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
