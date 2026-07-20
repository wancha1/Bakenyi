import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Coffee, Compass, Volume2, ChevronRight } from 'lucide-react';
import { Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, FadeIn } from '../ui';

interface FeaturedHeritageProps {
  featuredItems: {
    clan: {
      id?: string;
      name: string;
      totem: string;
      desc: string;
    };
    leader: {
      id?: string;
      name: string;
      role: string;
      bio: string;
    };
    food: {
      id?: string;
      title: string;
      desc: string;
    };
    artifact: {
      id?: string;
      title: string;
      desc: string;
    };
    oralHistory: {
      id?: string;
      title: string;
      desc: string;
    };
  };
}

export default function FeaturedHeritage({ featuredItems }: FeaturedHeritageProps) {
  return (
    <section 
      id="curated-exhibits-bento" 
      className="py-24 bg-stone-50 dark:bg-stone-900/40 border-b border-heritage-brown/5 dark:border-white/5 relative text-left"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="mb-16">
          <FadeIn direction="up">
            <Badge variant="sand" size="sm" className="mb-2">
              Curated Museum Exhibits
            </Badge>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
              Featured Cultural Spotlights
            </h2>
            <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">
              Immerse yourself in authentic pieces of Bakenyi memory, vetted and presented by our digital keepers.
            </p>
          </FadeIn>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Clan of the Week */}
          <FadeIn direction="up" delay={0.05}>
            <Card 
              variant="default"
              hoverEffect="translate"
              className="h-full flex flex-col justify-between relative overflow-hidden p-8"
              id="bento-clan-of-the-week"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-heritage-terracotta/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-heritage-terracotta" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-heritage-brown/70 dark:text-stone-300">
                    Clan of the Week
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-heritage-brown dark:text-white drop-shadow-xs">
                  {featuredItems.clan.name}
                </h3>
                <div className="mt-2.5 inline-block px-3 py-1 bg-heritage-terracotta/10 border border-heritage-terracotta/30 text-heritage-terracotta dark:bg-heritage-sand/20 dark:border-heritage-sand/40 dark:text-heritage-sand text-[10px] font-extrabold rounded-lg font-mono uppercase tracking-wider">
                  Totem: {featuredItems.clan.totem}
                </div>
                <p className="text-xs sm:text-sm text-heritage-brown/85 dark:text-stone-200 mt-4 leading-relaxed text-left font-medium">
                  {featuredItems.clan.desc}
                </p>
              </div>
              <div className="pt-6 border-t border-heritage-brown/5 dark:border-white/5 mt-6 flex justify-between items-center text-[10px]">
                <span className="text-heritage-brown/45 dark:text-stone-500 font-medium">Settled around Kyoga basin</span>
                <Link 
                  to={featuredItems.clan.id ? `/clans/${featuredItems.clan.id}` : "/clans"} 
                  className="font-black uppercase tracking-widest text-heritage-terracotta hover:text-heritage-brown dark:text-heritage-sand dark:hover:text-white flex items-center font-bold"
                >
                  Discover Clan <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </FadeIn>

          {/* Card 2: Elder Spotlight */}
          <FadeIn direction="up" delay={0.1}>
            <Card 
              variant="default"
              hoverEffect="translate"
              className="h-full flex flex-col justify-between relative overflow-hidden p-8"
              id="bento-elder-spotlight"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-heritage-olive/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-heritage-olive" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-stone-500">
                    Elder Spotlight
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-heritage-brown dark:text-white">
                  {featuredItems.leader.name}
                </h3>
                <span className="text-[10px] font-mono text-heritage-olive font-bold uppercase tracking-wider mt-1 block">
                  {featuredItems.leader.role}
                </span>
                <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-4 leading-relaxed text-left">
                  {featuredItems.leader.bio}
                </p>
              </div>
              <div className="pt-6 border-t border-heritage-brown/5 dark:border-white/5 mt-6 flex justify-between items-center text-[10px]">
                <span className="text-heritage-brown/45 dark:text-stone-500 font-medium">Active Council Member</span>
                <Link 
                  to={featuredItems.leader.id ? `/leadership/${featuredItems.leader.id}` : "/leadership"} 
                  className="font-black uppercase tracking-widest text-heritage-olive hover:text-heritage-brown dark:text-heritage-olive/80 flex items-center font-bold"
                >
                  Meet Elder <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </FadeIn>

          {/* Card 3: Gastronomy & Diet */}
          <FadeIn direction="up" delay={0.15}>
            <Card 
              variant="default"
              hoverEffect="translate"
              className="h-full flex flex-col justify-between relative overflow-hidden p-8"
              id="bento-dietary-spotlight"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Coffee className="w-5 h-5 text-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-stone-500">
                    Gastronomy & Diet
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-heritage-brown dark:text-white">
                  {featuredItems.food.title}
                </h3>
                <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-4 leading-relaxed text-left">
                  {featuredItems.food.desc}
                </p>
              </div>
              <div className="pt-6 border-t border-heritage-brown/5 dark:border-white/5 mt-6 flex justify-between items-center text-[10px]">
                <span className="text-heritage-brown/45 dark:text-stone-500 font-medium">Kyoga Basin Cuisine</span>
                <Link to="/history" className="font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center font-bold">
                  Read History <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </FadeIn>

          {/* Card 4: Ancestral Artifact (Double wide on desktop) */}
          <FadeIn direction="up" delay={0.2} className="md:col-span-2">
            <Card 
              variant="default"
              hoverEffect="translate"
              className="h-full flex flex-col justify-between relative overflow-hidden p-8"
              id="bento-artifact-spotlight"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-heritage-terracotta/5 to-transparent rounded-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-heritage-terracotta" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-stone-500">
                      Ancestral Artifacts
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-heritage-brown dark:text-white">
                    {featuredItems.artifact.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 leading-relaxed text-left">
                    {featuredItems.artifact.desc}
                  </p>
                </div>
                
                <div className="relative h-44 rounded-2xl overflow-hidden border border-heritage-brown/5 dark:border-white/5 shadow-inner">
                  <img 
                    src="https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=600" 
                    alt="Dugout canoe visual representative" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/10" />
                </div>
              </div>
              <div className="pt-6 border-t border-heritage-brown/5 dark:border-white/5 mt-6 flex justify-between items-center text-[10px]">
                <span className="text-heritage-brown/45 dark:text-stone-500 font-medium">Lake Navigation Tech</span>
                <Link to="/gallery" className="font-black uppercase tracking-widest text-heritage-terracotta hover:text-heritage-brown dark:text-heritage-sand flex items-center font-bold">
                  Examine Gallery <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </FadeIn>

          {/* Card 5: Oral Legend */}
          <FadeIn direction="up" delay={0.25}>
            <Card 
              variant="default"
              hoverEffect="translate"
              className="h-full flex flex-col justify-between relative overflow-hidden p-8"
              id="bento-oral-legend"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Volume2 className="w-5 h-5 text-rose-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-stone-500">
                    Oral Legend
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-heritage-brown dark:text-white line-clamp-1">
                  {featuredItems.oralHistory.title}
                </h3>
                <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-4 leading-relaxed line-clamp-4 text-left">
                  {featuredItems.oralHistory.desc}
                </p>
              </div>
              <div className="pt-6 border-t border-heritage-brown/5 dark:border-white/5 mt-6 flex justify-between items-center text-[10px]">
                <span className="text-heritage-brown/45 dark:text-stone-500 font-medium">Floating worlds of Kyoga</span>
                <Link 
                  to={featuredItems.oralHistory.id ? `/oral-history/${featuredItems.oralHistory.id}` : "/history"} 
                  className="font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 flex items-center font-bold"
                >
                  Read Memoirs <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
