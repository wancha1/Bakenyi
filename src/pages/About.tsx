import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Anchor, 
  Waves, 
  Compass, 
  Shield, 
  BookOpen, 
  Users, 
  Volume2, 
  Image as ImageIcon, 
  ArrowRight, 
  Sparkles, 
  Heart, 
  Info, 
  Globe, 
  MapPin, 
  Eye, 
  History, 
  CheckCircle2, 
  HelpCircle,
  Award,
  Zap,
  Bookmark,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  getArticles, 
  getContributions, 
  getClans, 
  getLeaders, 
  getVocabulary, 
  getGalleryImages 
} from '../lib/supabase';
import SEO from '../components/SEO';
import { Button, Card, Badge, FadeIn, ListStagger, ListItem, HoverScale } from '../components/ui';

// ============================================================================
// ANIMATED COUNTER COMPONENT FOR MUSEUM STATS
// ============================================================================
function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, { once: true, margin: '-20px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    
    const totalMilliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / Math.max(end, 1)), 16); // cap at 60fps
    const step = end / (totalMilliseconds / incrementTime);

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return <span ref={elementRef} className="font-serif font-black">{count}</span>;
}

// ============================================================================
// MAIN MUSEUM ABOUT PAGE COMPONENT
// ============================================================================
export default function About() {
  const [isLoading, setIsLoading] = useState(true);
  const [counterStats, setCounterStats] = useState({
    stories: 0,
    clans: 0,
    leaders: 0,
    photos: 0,
    videos: 0,
    vocabulary: 0,
    contributors: 0
  });

  const [galleryPreview, setGalleryPreview] = useState<any[]>([]);

  useEffect(() => {
    async function loadStatsAndMedia() {
      try {
        setIsLoading(true);
        const [
          articlesData,
          contribsData,
          clansData,
          leadersData,
          vocabData,
          galleryData
        ] = await Promise.all([
          getArticles(true).catch(() => []),
          getContributions().catch(() => []),
          getClans(true).catch(() => []),
          getLeaders(true).catch(() => []),
          getVocabulary(true).catch(() => []),
          getGalleryImages(false).catch(() => [])
        ]);

        const approvedStories = contribsData.filter((c: any) => c.status === 'approved' || c.status === 'vouched');
        const uniqueContributors = new Set([
          ...approvedStories.map((c: any) => c.userEmail),
          ...articlesData.map((a: any) => a.author || a.userEmail)
        ].filter(Boolean));

        const photosCount = galleryData.filter((g: any) => g.fileType === 'image' || g.type === 'photo').length;
        const videosCount = galleryData.filter((g: any) => g.fileType === 'video' || g.type === 'video').length;

        setCounterStats({
          stories: approvedStories.length + articlesData.length,
          clans: clansData.length,
          leaders: leadersData.length,
          photos: photosCount,
          videos: videosCount,
          vocabulary: vocabData.length,
          contributors: uniqueContributors.size
        });

        // Slice up to 4 items for gallery preview
        const imgGallery = galleryData.filter((g: any) => g.fileType === 'image' || g.type === 'photo');
        if (imgGallery && imgGallery.length > 0) {
          setGalleryPreview(imgGallery.slice(0, 4));
        } else {
          // Curated high quality fallback photos
          setGalleryPreview([
            {
              id: 'fallback-g1',
              title: 'Canoe Craftsmanship',
              category: 'Craft',
              fileUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=600',
              description: 'Hand-carved canoes used for lake navigation'
            },
            {
              id: 'fallback-g2',
              title: 'Floating Reeds of Kyoga',
              category: 'Landscape',
              fileUrl: 'https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=600',
              description: 'The beautiful papyrus shorelines of Buyende'
            },
            {
              id: 'fallback-g3',
              title: 'Weaving Traditional Nets',
              category: 'Tradition',
              fileUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
              description: 'Traditional weaving patterns of local fishers'
            },
            {
              id: 'fallback-g4',
              title: 'Elder Consultation Council',
              category: 'History',
              fileUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600',
              description: 'Oral storytelling session under the ancestral tree'
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching about page stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStatsAndMedia();
  }, []);

  // Structured Core Values with local Lukenye titles
  const values = [
    {
      icon: Shield,
      title: "Respect",
      lukenye: "Engero",
      desc: "Ancestral honor, respecting the laws of the lake-dwellers, and preserving the sanctity of traditional wisdom."
    },
    {
      icon: Users,
      title: "Community",
      lukenye: "Obumu",
      desc: "Communal solidarity. Empowering clans through collective support, shared resources, and mutual aid."
    },
    {
      icon: BookOpen,
      title: "Oral Tradition",
      lukenye: "Okugera",
      desc: "Transmitting ancestral epics, migratory history, and family line genealogies through continuous oral storytelling."
    },
    {
      icon: Anchor,
      title: "Stewardship",
      lukenye: "Okukuuma",
      desc: "Conserving Lake Kyoga's waterways, safeguarding its biodiversity, and farming the floating islands sustainably."
    },
    {
      icon: Compass,
      title: "Knowledge",
      lukenye: "Okumanya",
      desc: "Upholding the specialized sciences of maritime navigation, boat carving, and traditional medicine."
    },
    {
      icon: Heart,
      title: "Unity",
      lukenye: "Okwegatta",
      desc: "Uniting the Bakenyi people across different districts to form a robust, modern digital network."
    }
  ];

  // Structured schema.org markup for SEO and Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "About Bakenye Cultural Heritage Preservation",
    "description": "Learn about the Bantu-speaking Bakenye people of Lake Kyoga, Uganda, their floating islands, maritime culture, and language archives.",
    "publisher": {
      "@type": "Organization",
      "name": "Bakenye Cultural Council",
      "logo": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=200"
      }
    },
    "about": {
      "@type": "Place",
      "name": "Lake Kyoga",
      "description": "The historical homeland and ecological cradle of the Bakenyi people in Eastern and Central Uganda."
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-heritage-cream dark:bg-stone-950 transition-colors duration-300">
      <SEO 
        title="Our Cultural Voyage - About Bakenye"
        description="Redesigned digital museum of the Bakenye people. Explore their migration, floating island technology, core values, and Lake Kyoga ecosystem."
        keywords="About Bakenye, Bakenyi history, Lake Kyoga, floating islands, Bantu migration, Lukenye, preservation mission"
      />

      {/* JSON-LD Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* =========================================================================
          1. HERO BANNER
          ========================================================================= */}
      <section 
        id="museum-about-hero" 
        className="relative min-h-[70vh] flex items-center justify-center bg-stone-950 text-white overflow-hidden py-24 text-center"
      >
        {/* Background Visual Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=1600" 
            alt="Scenic Lake Kyoga Waters" 
            className="w-full h-full object-cover opacity-25 filter grayscale contrast-125 select-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-heritage-cream via-stone-950/85 to-stone-950 dark:from-stone-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-heritage-terracotta/15 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          {/* Breadcrumbs */}
          <FadeIn direction="down" delay={0.1}>
            <nav className="flex justify-center items-center gap-2 font-mono text-[10px] tracking-widest text-heritage-sand uppercase">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="opacity-40">/</span>
              <span className="text-white">About the Bakenye</span>
            </nav>
          </FadeIn>

          {/* Heading */}
          <FadeIn direction="up" delay={0.2}>
            <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.3em] text-heritage-terracotta block mb-2">
              The Digital Museum Exhibit
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black text-white leading-tight tracking-tight">
              About the <span className="text-heritage-sand italic font-normal font-serif">Bakenye</span>
            </h1>
          </FadeIn>

          {/* Short Introduction */}
          <FadeIn direction="up" delay={0.3}>
            <p className="text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-sans font-medium">
              We are the water-farers of Uganda—keepers of the floating islands, guardians of the papyrus channels, and children of Lake Kyoga. Discover our ancestral voyage through time.
            </p>
          </FadeIn>

          {/* Prompt Arrow */}
          <FadeIn direction="none" delay={0.5} className="pt-6">
            <div className="animate-bounce inline-flex items-center gap-1.5 text-xs text-heritage-sand font-mono tracking-widest uppercase">
              Scroll to enter exhibit <Waves className="w-4 h-4" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* =========================================================================
          2. WHO ARE THE BAKENYE?
          ========================================================================= */}
      <section 
        id="who-are-bakenye" 
        className="py-24 bg-white dark:bg-stone-900 transition-colors text-left relative overflow-hidden"
      >
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-heritage-sand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Exhibit Title Card */}
            <div className="lg:col-span-5 space-y-6">
              <FadeIn direction="right">
                <Badge variant="sand" className="mb-2">
                  Historical Roots
                </Badge>
                <h2 className="text-3xl sm:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                  Who Are the Bakenye?
                </h2>
                <div className="w-16 h-1.5 bg-heritage-terracotta rounded-full mt-4 mb-6" />
              </FadeIn>

              {/* Museum Text Plate */}
              <FadeIn direction="up" delay={0.15}>
                <div className="p-6 bg-heritage-cream dark:bg-stone-950 border-l-4 border-heritage-terracotta rounded-r-2xl shadow-xs">
                  <span className="text-[10px] font-mono uppercase font-black text-heritage-terracotta tracking-wider block mb-2">
                    Exhibition Plate #01 / Origin Overview
                  </span>
                  <p className="text-xs sm:text-sm text-heritage-brown/80 dark:text-stone-300 italic leading-relaxed">
                    "Unlike groups whose identity is tied exclusively to ancestral highlands, our clan lineage flows dynamically alongside the currents of Uganda's lake shores."
                  </p>
                  <p className="text-[10px] font-mono text-heritage-brown/50 dark:text-stone-500 mt-2 text-right">
                    — Elder Council Archive
                  </p>
                </div>
              </FadeIn>
            </div>

            {/* Right Column: Detailed Narrative */}
            <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-heritage-brown/80 dark:text-stone-300 leading-relaxed font-medium">
              <FadeIn direction="left">
                <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-black first-letter:text-heritage-terracotta first-letter:mr-3 first-letter:float-left">
                  The Bakenye (sometimes known as Bakenyi) are a unique Bantu-speaking community historically inhabiting the lake shores and floating papyrus islands of Eastern and Central Uganda. Originating from migrations within the interlacustrine region, they found a sanctuary along the intricate shorelines of Lake Kyoga and the river networks connected to the Nile.
                </p>
              </FadeIn>
              
              <FadeIn direction="left" delay={0.1}>
                <p>
                  Their traditional homeland stretches across the districts of <strong>Buyende, Paliisa, Budaka, Kayunga, Kaliro, and Namutumba</strong>. For centuries, they established highly specialized aquatic civilizations, navigating the complex wetlands with wooden vessels carved from selected forest logs.
                </p>
              </FadeIn>

              <FadeIn direction="left" delay={0.2}>
                <p>
                  Today, safeguarding Bakenye history is of urgent cultural importance. As urbanization and climate trends alter the delicate wetlands, preserving the endangered <strong>Lukenye dialect</strong>, their lineage clans, and maritime crafts guarantees that future generations stay anchored to their remarkable water-faring ancestry.
                </p>
              </FadeIn>

              <FadeIn direction="none" delay={0.3} className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-heritage-brown/5 dark:border-white/5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-xs text-heritage-brown dark:text-white">Homeland</h5>
                    <p className="text-[10px] text-heritage-brown/60 dark:text-stone-400 mt-0.5">Lake Kyoga Basin, Uganda</p>
                  </div>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-heritage-brown/5 dark:border-white/5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-heritage-olive/10 text-heritage-olive flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-xs text-heritage-brown dark:text-white">Dialect</h5>
                    <p className="text-[10px] text-heritage-brown/60 dark:text-stone-400 mt-0.5">Lukenye (Bantu Orthography)</p>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. LAKE KYOGA: THE AQUATIC SANCTUARY
          ========================================================================= */}
      <section 
        id="lake-kyoga-showcase" 
        className="py-24 bg-stone-50 dark:bg-stone-950 transition-colors relative overflow-hidden border-t border-b border-heritage-brown/5 dark:border-white/5"
      >
        {/* Subtle Water Waves Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10 dark:opacity-5">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wave-pattern" width="80" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 Q 20 0, 40 10 T 80 10" fill="none" stroke="#BC6C25" strokeWidth="1.5" className="animate-pulse" style={{ animationDuration: '4s' }} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          {/* Section Header */}
          <div className="max-w-3xl mb-16">
            <FadeIn direction="up">
              <Badge variant="olive" className="mb-2">
                Ecological Cradle
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                Lake Kyoga: Cradle of Life
              </h2>
              <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-3 max-w-xl leading-relaxed">
                Explore the five key dimensions of Bakenye lake-dwelling civilizations, built around the complex wetlands of central-eastern Uganda.
              </p>
            </FadeIn>
          </div>

          {/* Interactive Illustrated Cards */}
          <ListStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Floating Islands",
                native: "Ebiswa / Kasiise",
                icon: Waves,
                image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=400",
                desc: "Moving masses of papyrus and rich peat soil. Families built temporary dwellings and cultivated crops directly on these floating rafts."
              },
              {
                title: "Traditional Fishing",
                native: "Okuloba",
                icon: Anchor,
                image: "https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=400",
                desc: "A highly sustainable livelihood focusing on Lungfish (Mamba) and Tilapia. Traditional Bakenye traps leave small fingerlings unharmed."
              },
              {
                title: "Dugout Canoes",
                native: "Amato g'Embaawo",
                icon: Compass,
                image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=400",
                desc: "Hand-crafted vessels hollowed from single hardwood trunks, seasoned on the lakeside, and blessed by clan elders before long voyages."
              },
              {
                title: "Papyrus Wetlands",
                native: "Ebisagazi",
                icon: Shield,
                image: "https://images.unsplash.com/photo-1501535033-a593e6afb94d?auto=format&fit=crop&q=80&w=400",
                desc: "The dense reeds provide both structural shelter and premium craft materials. Papyrus stalks are expertly woven into screens and rafts."
              },
              {
                title: "Biodiversity",
                native: "Ensolo y'Amadzi",
                icon: Sparkles,
                image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400",
                desc: "An ecosystem shared with Crested Cranes, rare waterbirds, and specialized fish. Bakenye laws forbid destroying bird nesting areas."
              }
            ].map((item, idx) => (
              <ListItem key={idx}>
                <Card 
                  variant="default"
                  hoverEffect="translate"
                  className="p-5 flex flex-col h-full justify-between group overflow-hidden border border-heritage-brown/5 dark:border-white/5 relative"
                >
                  <div className="space-y-4">
                    {/* Illustrated Header */}
                    <div className="h-28 rounded-xl overflow-hidden relative bg-stone-100">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs p-1.5 rounded-lg text-heritage-sand">
                        <item.icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase font-black text-heritage-terracotta dark:text-heritage-sand block">
                        {item.native}
                      </span>
                      <h4 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-xs text-heritage-brown/70 dark:text-stone-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              </ListItem>
            ))}
          </ListStagger>
        </div>
      </section>

      {/* =========================================================================
          4. CULTURAL PRESERVATION MISSION
          ======================================================================== */}
      <section 
        id="preservation-mission" 
        className="py-24 bg-white dark:bg-stone-900 transition-colors text-left"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <FadeIn direction="up">
              <Badge variant="sand" className="mb-2">
                Our Guardianship
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                Cultural Preservation Mission
              </h2>
              <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-3 max-w-xl mx-auto leading-relaxed">
                Through direct support from the Council of Elder Custodians, we utilize technology to safeguard our ancestral heritage.
              </p>
            </FadeIn>
          </div>

          {/* Premium Cards */}
          <ListStagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Oral Tradition Archive",
                subtitle: "The Living Voice",
                icon: Volume2,
                desc: "We gather and digitize field recordings of songs, riddles, and family lineages. Preserving the exact cadence, vocal inflections, and emotional depth of Bakenye storytelling."
              },
              {
                title: "Linguistic Restoration",
                subtitle: "Preserving Lukenye",
                icon: BookOpen,
                desc: "With fewer fluent speakers in urban areas, we built a digital glossary with phonetics, sample usage sentences, and audio pronunciation tabs verified by fluent elders."
              },
              {
                title: "Interactive Cartography",
                subtitle: "Migration Mapping",
                icon: Globe,
                desc: "Tracing traditional settlement hubs, migratory routes along the Victoria Nile, and clan borders across districts to build a robust physical and spiritual atlas of Bakenye ancestry."
              }
            ].map((mission, idx) => (
              <ListItem key={idx}>
                <Card 
                  variant="default"
                  className="p-8 h-full flex flex-col justify-between hover:border-heritage-terracotta/30 border border-heritage-brown/10 dark:border-stone-800 transition-all duration-300"
                >
                  <div className="space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-heritage-cream dark:bg-stone-950 flex items-center justify-center border border-heritage-brown/10 dark:border-stone-800 text-heritage-terracotta">
                      <mission.icon className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-heritage-brown/50 dark:text-stone-500">
                        {mission.subtitle}
                      </span>
                      <h4 className="text-xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                        {mission.title}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-heritage-brown/70 dark:text-stone-300 leading-relaxed">
                      {mission.desc}
                    </p>
                  </div>
                </Card>
              </ListItem>
            ))}
          </ListStagger>
        </div>
      </section>

      {/* =========================================================================
          5. CORE VALUES
          ========================================================================= */}
      <section 
        id="core-values-section" 
        className="py-24 bg-stone-50 dark:bg-stone-950/40 transition-colors border-t border-b border-heritage-brown/5 dark:border-stone-800 text-left"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-16 max-w-xl">
            <FadeIn direction="up">
              <Badge variant="sand" className="mb-2">Our Living Compass</Badge>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                Our Core Values
              </h2>
              <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-3 leading-relaxed">
                These six foundational principles form the spiritual and ethical compass directing our preservation efforts.
              </p>
            </FadeIn>
          </div>

          {/* Staggered values list */}
          <ListStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, idx) => (
              <ListItem key={idx}>
                <HoverScale>
                  <Card 
                    variant="default"
                    className="p-6 border border-heritage-brown/5 dark:border-stone-800 flex items-start gap-4 h-full"
                  >
                    <div className="p-3 bg-heritage-cream dark:bg-stone-950 border border-heritage-brown/10 dark:border-stone-800 rounded-xl text-heritage-terracotta shrink-0">
                      <v.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-black text-base text-heritage-brown dark:text-white">
                          {v.title}
                        </h4>
                        <span className="font-mono text-[9px] font-black uppercase tracking-wider text-heritage-terracotta dark:text-heritage-sand bg-heritage-terracotta/5 dark:bg-heritage-sand/5 px-2 py-0.5 rounded">
                          {v.lukenye}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-heritage-brown/70 dark:text-stone-300 leading-relaxed pt-1.5">
                        {v.desc}
                      </p>
                    </div>
                  </Card>
                </HoverScale>
              </ListItem>
            ))}
          </ListStagger>
        </div>
      </section>

      {/* =========================================================================
          6. HISTORICAL JOURNEY PREVIEW
          ========================================================================= */}
      <section 
        id="historical-journey-preview" 
        className="py-24 bg-white dark:bg-stone-900 transition-colors text-left"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-16">
            <FadeIn direction="up">
              <Badge variant="olive" className="mb-2">Historical Journey Preview</Badge>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-heritage-brown dark:text-white mt-2 mb-4 leading-tight">
                Our Path Through Time
              </h2>
              <p className="text-xs sm:text-sm text-heritage-brown/60 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
                A brief glimpse into the historic milestones of the Bakenyi water-farers.
              </p>
            </FadeIn>
          </div>

          {/* Mini-timeline */}
          <div className="relative border-l-2 border-heritage-terracotta/30 ml-4 md:ml-32 space-y-12">
            {[
              {
                period: "14th - 16th Century",
                title: "Interlacustrine Migrations",
                desc: "Bantu maritime groups migrate from the core Congo basins and larger lakes, tracking wetland channels into eastern Uganda."
              },
              {
                period: "17th - 18th Century",
                title: "Lake Kyoga Settlements",
                desc: "Constructing early floating island harbors (Ebigiri) and establishing fishing grounds around Paliisa, Kayunga, and Buyende."
              },
              {
                period: "19th Century",
                title: "Consolidation of Water Clans",
                desc: "Traditional maritime treaties are formed between various clans, allocating sustainable fishing boundaries and canoe crest colors."
              },
              {
                period: "Modern Era",
                title: "The Digital Renaissance",
                desc: "Launching the digital archive platform with elder backing, ensuring Lukenye stories and vocabulary outlive environmental changes."
              }
            ].map((milestone, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-8 md:pl-12 group"
              >
                {/* Period tag left of line on desktop */}
                <div className="hidden md:block absolute -left-32 top-1.5 w-24 text-right text-xs font-mono font-black text-heritage-terracotta tracking-wider uppercase">
                  {milestone.period}
                </div>

                {/* Bullet point on line */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-stone-900 border-2 border-heritage-terracotta group-hover:bg-heritage-terracotta transition-colors duration-300" />

                <div className="p-6 bg-stone-50 dark:bg-stone-950 border border-heritage-brown/5 dark:border-stone-800 rounded-2xl group-hover:shadow-md transition-shadow">
                  <span className="inline-block md:hidden text-[9px] font-mono font-black text-heritage-terracotta mb-1 tracking-wider uppercase">
                    {milestone.period}
                  </span>
                  <h4 className="text-base font-serif font-black text-heritage-brown dark:text-white">
                    {milestone.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-heritage-brown/70 dark:text-stone-300 leading-relaxed mt-2">
                    {milestone.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Button to full history */}
          <div className="text-center mt-12">
            <FadeIn direction="up">
              <Link to="/history">
                <Button variant="primary" className="font-mono text-xs uppercase tracking-widest gap-2">
                  Explore Full History Timeline <History className="w-4 h-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. CULTURAL STATISTICS
          ========================================================================= */}
      <section 
        id="cultural-statistics" 
        className="bg-stone-950 border-t border-b border-stone-800 py-16 relative z-20 text-white text-left"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-12 text-center">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-heritage-sand block mb-1">
              Archival Inventory
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-200">
              Verified Heritage Metrics
            </h3>
            <p className="text-[11px] text-stone-400 mt-1">Live preservation metrics authenticated by our regional archivists.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { label: 'Articles Logged', value: counterStats.stories, icon: BookOpen },
              { label: 'Ancient Clans', value: counterStats.clans, icon: Shield },
              { label: 'Council Elders', value: counterStats.leaders, icon: Users },
              { label: 'Dictionary Words', value: counterStats.vocabulary, icon: Volume2 },
              { label: 'Archival Photos', value: counterStats.photos, icon: ImageIcon },
              { label: 'Active Keepers', value: counterStats.contributors, icon: Globe },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-5 bg-stone-900/40 border border-stone-800 rounded-2xl text-white hover:border-heritage-sand/40 transition-all flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-stone-950/80 border border-stone-800 flex items-center justify-center text-heritage-sand group-hover:scale-105 transition-transform">
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-black text-heritage-sand">
                  <AnimatedCounter value={stat.value} />
                </div>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider line-clamp-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. IMAGE GALLERY PREVIEW
          ========================================================================= */}
      <section 
        id="gallery-preview-section" 
        className="py-24 bg-stone-50 dark:bg-stone-950/10 transition-colors text-left border-b border-heritage-brown/5 dark:border-stone-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <Badge variant="olive" className="mb-2">Visual Vault</Badge>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                Heritage Gallery
              </h2>
              <p className="text-xs sm:text-sm text-heritage-brown/65 dark:text-stone-400 mt-2 max-w-md leading-relaxed">
                Take a visual voyage through preserved photographs and historical plates depicting the traditional crafts of Lake Kyoga.
              </p>
            </div>
            
            <Link to="/gallery">
              <Button variant="outline" className="font-mono text-xs uppercase tracking-widest gap-1 border-heritage-brown/20 text-heritage-brown dark:text-stone-300 dark:border-stone-700">
                Enter Full Gallery <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Premium gallery grid */}
          <ListStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryPreview.map((item, idx) => (
              <ListItem key={item.id || idx}>
                <Card 
                  variant="default"
                  hoverEffect="translate"
                  className="p-4 flex flex-col justify-between h-full group"
                >
                  <div className="space-y-4">
                    <div className="h-44 rounded-2xl overflow-hidden relative bg-stone-100 border border-heritage-brown/5 dark:border-stone-800">
                      <img 
                        src={item.fileUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 filter contrast-105"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-stone-950/85 backdrop-blur-xs text-heritage-sand font-mono text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                        {item.category || 'Archive'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-sm text-heritage-brown dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-heritage-brown/60 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {item.description || 'Verified archival asset.'}
                      </p>
                    </div>
                  </div>
                </Card>
              </ListItem>
            ))}
          </ListStagger>
        </div>
      </section>

      {/* =========================================================================
          9. CALL TO ACTION
          ========================================================================= */}
      <section 
        id="exhibit-exit-cta" 
        className="py-24 bg-stone-950 text-white relative overflow-hidden text-center border-t border-stone-900"
      >
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-heritage-olive/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-8">
          <FadeIn direction="up">
            <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.3em] text-heritage-sand block mb-3">
              Safeguard the Legacy
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black leading-tight">
              Begin Your Exploration
            </h2>
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed mt-4">
              Explore our digitized history, trace your clan lineage, or learn the ancestral Lukenye dialect today to support our ongoing preservation efforts.
            </p>
          </FadeIn>

          {/* Core Action Grid */}
          <ListStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 max-w-5xl mx-auto">
            {[
              {
                title: "Explore History",
                desc: "Walk through complete migratory timelines.",
                path: "/history",
                badge: "Archives",
                icon: History
              },
              {
                title: "Discover Clans",
                desc: "Register and trace your totem lineage.",
                path: "/clans",
                badge: "Lineage",
                icon: Shield
              },
              {
                title: "Learn Lukenye",
                desc: "Listen to native spoken vocabulary.",
                path: "/language",
                badge: "Linguistics",
                icon: Volume2
              },
              {
                title: "Support Project",
                desc: "Submit archival photos or stories.",
                path: "/contribute",
                badge: "Custodians",
                icon: Sparkles
              }
            ].map((action, idx) => (
              <ListItem key={idx}>
                <Link to={action.path} className="block h-full">
                  <Card 
                    variant="default"
                    hoverEffect="translate"
                    className="p-5 text-left bg-stone-900/60 border border-stone-800 hover:border-heritage-sand/40 h-full flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-mono font-black uppercase text-heritage-sand tracking-widest">
                          {action.badge}
                        </span>
                        <action.icon className="w-4 h-4 text-stone-500 group-hover:text-heritage-sand transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-serif font-black text-sm text-stone-100 group-hover:text-heritage-sand transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                          {action.desc}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 flex items-center gap-1 text-[10px] font-mono font-black uppercase text-heritage-sand tracking-wider">
                      Enter &rarr;
                    </div>
                  </Card>
                </Link>
              </ListItem>
            ))}
          </ListStagger>
        </div>
      </section>
    </div>
  );
}
