import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Target, Heart, Shield, Users, BookOpen, Globe, Volume2, Video, Image as ImageIcon } from 'lucide-react';
import { getArticles, getContributions, getClans, getLeaders, getVocabulary, getGalleryImages } from '../lib/supabase';
import SEO from '../components/SEO';

export default function About() {
  const [counterStats, setCounterStats] = useState({
    stories: 18,
    clans: 6,
    leaders: 5,
    photos: 12,
    videos: 3,
    vocabulary: 45,
    contributors: 9
  });

  useEffect(() => {
    async function loadStats() {
      try {
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

        const approvedStories = contribsData.filter((c: any) => c.status === 'approved');
        const uniqueContributors = new Set([
          ...approvedStories.map((c: any) => c.userEmail),
          ...articlesData.map((a: any) => a.author)
        ]);

        setCounterStats({
          stories: approvedStories.length + articlesData.length,
          clans: clansData.length || 12,
          leaders: leadersData.length || 8,
          photos: galleryData.filter((g: any) => g.type === 'photo').length || 24,
          videos: galleryData.filter((g: any) => g.type === 'video').length || 6,
          vocabulary: vocabData.length || 125,
          contributors: uniqueContributors.size || 15
        });
      } catch (err) {
        console.error('Error fetching about page stats:', err);
      }
    }
    loadStats();
  }, []);

  const values = [
    {
      icon: Target,
      title: "Preservation",
      desc: "Documenting our history, genealogy, and language to ensure they remain accessible for future generations."
    },
    {
      icon: Heart,
      title: "Unity",
      desc: "Bringing together Bakenyi from different regions (Paliisa, Budaka, Buyende, Kayunga) through a shared digital space."
    },
    {
      icon: Shield,
      title: "Identity",
      desc: "Promoting a strong sense of cultural identity among the youth and the diaspora."
    },
    {
      icon: Users,
      title: "Community",
      desc: "Empowering the community by sharing knowledge and stories that define who we are."
    }
  ];

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      <SEO 
        title="About the Heritage Project"
        description="Learn about the Bakenye Cultural Heritage preservation initiative, our mission to document oral tradition, and our core community values."
        keywords="About Bakenye, cultural preservation project, digital archives, Bantu history, community outreach"
      />
      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-stone-950 via-stone-900 to-[#2c1d11] py-24 px-4 overflow-hidden border-b border-stone-800/60 text-center">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-heritage-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-black text-white mb-6 tracking-tight leading-tight"
          >
            About the Platform
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-heritage-sand max-w-2xl mx-auto text-sm md:text-base font-black tracking-widest uppercase"
          >
            Preserving tradition, uniting a people, safeguarding the future.
          </motion.p>
        </div>
      </section>

      {/* QUICK STATS STRIP */}
      <section className="bg-stone-950 border-t border-b border-stone-800 relative z-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 text-center">
            {[
              { label: 'Stories Preserved', value: counterStats.stories, icon: BookOpen },
              { label: 'Ancient Clans', value: counterStats.clans, icon: Shield },
              { label: 'Elders Vouched', value: counterStats.leaders, icon: Users },
              { label: 'Historical Photos', value: counterStats.photos, icon: ImageIcon },
              { label: 'Authentic Videos', value: counterStats.videos, icon: Video },
              { label: 'Vocabulary Logs', value: counterStats.vocabulary, icon: Volume2 },
              { label: 'Active Custodians', value: counterStats.contributors, icon: Globe },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-3 bg-stone-900/50 border border-stone-800/60 rounded-2xl text-white hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <stat.icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xl sm:text-2xl font-serif font-black text-amber-400">
                    {stat.value}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview, Mission & Vision Section */}
      <section className="py-24 px-4 bg-white dark:bg-stone-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Mission & Vision Bento Cards */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <span className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-3.5 py-1.5 rounded-full">
                Core Foundations
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown leading-tight">
                Our Mission & Vision
              </h2>
              <p className="text-heritage-brown/75 dark:text-stone-300 text-sm md:text-base leading-relaxed">
                We bridge ancient ancestry with contemporary digital tools, ensuring the heritage of the Bakenyi people thrives in the modern era.
              </p>

              {/* Bento cards */}
              <div className="grid grid-cols-1 gap-6 pt-4">
                <div className="p-6 rounded-2xl bg-heritage-cream dark:bg-stone-800 border border-heritage-brown/10 dark:border-stone-700 shadow-xs hover:shadow-md transition-all">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-heritage-terracotta text-white rounded-xl">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-serif font-bold text-heritage-brown dark:text-amber-500 mb-2">Our Mission</h4>
                      <p className="text-xs text-heritage-brown/70 dark:text-stone-300 leading-relaxed">
                        To systematically record, verify, and digitize the oral records, lineage histories, and clan traditions of the lake-dwellers under the direct custodianship of the Council of Elders.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-heritage-cream dark:bg-stone-800 border border-heritage-brown/10 dark:border-stone-700 shadow-xs hover:shadow-md transition-all">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-heritage-olive text-white rounded-xl">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-serif font-bold text-heritage-brown dark:text-amber-500 mb-2">Our Vision</h4>
                      <p className="text-xs text-heritage-brown/70 dark:text-stone-300 leading-relaxed">
                        A globally accessible, high-fidelity cultural platform where descendants, historians, and language learners can immerse themselves in the authentic riverine culture of Uganda's lakes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Story & Purpose */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-heritage-brown dark:text-white">
                  The Purpose Behind the Platform
                </h3>
                <p className="text-heritage-brown/70 dark:text-stone-300 leading-relaxed text-base md:text-lg">
                  The Bakenyi Cultural Heritage Platform was founded on the realization that our rich cultural tapestry—woven over centuries along the lakes and rivers of Uganda—is at risk of fading as modern influences reshape our social landscape.
                </p>
                <p className="text-heritage-brown/70 dark:text-stone-300 leading-relaxed text-base">
                  We believe that technology can be a powerful ally in cultural preservation. By creating a centralized, accessible digital archive, we bridge the gap between our elders who hold the oral traditions and our tech-savvy youth who are the future custodians of our heritage.
                </p>
              </div>

              {/* Enhanced image placement with caption */}
              <div className="relative group overflow-hidden rounded-3xl border border-heritage-brown/10 shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1200" 
                  alt="Scenic view representing cultural roots" 
                  className="w-full h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-[10px] font-sans font-black uppercase tracking-widest text-amber-500">
                    Riverine Preservation
                  </span>
                  <p className="text-sm font-serif font-semibold mt-1">
                    "Our ancestors navigated Lake Kyoga on custom-crafted vessels, anchoring in floating islands."
                  </p>
                </div>
              </div>

              <div className="p-6 bg-heritage-cream dark:bg-stone-800 border-l-4 border-heritage-terracotta rounded-r-2xl italic text-heritage-brown/80 dark:text-stone-200">
                "Our ancestors lived on floating islands (Ebiswa) not because they were lost, but because they understood the delicate balance between the land and the life-giving waters of Lake Kyoga."
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROJECT JOURNEY TIMELINE */}
      <section className="py-24 px-4 bg-heritage-cream dark:bg-stone-950 transition-colors border-t border-b border-heritage-brown/5 dark:border-stone-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-3.5 py-1.5 rounded-full">
              Project Milestones
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white mt-4 mb-4">
              The Path to Preservation
            </h2>
            <p className="text-heritage-brown/60 dark:text-stone-400 max-w-xl mx-auto text-sm">
              How the platform transitioned from community oral collection into a modern digital platform.
            </p>
          </div>

          <div className="relative border-l-2 border-heritage-terracotta/30 ml-4 md:ml-32 space-y-12">
            {[
              {
                year: "2024",
                title: "Oral Heritage Gathering & Approvals",
                desc: "Active field-recording with elders in Paliisa, Budaka, and Buyende districts. Authorized with the backing of the Bakenye Council of Elder Custodians."
              },
              {
                year: "2025",
                title: "Platform Conception & Architecture",
                desc: "Designing a specialized Bantu orthography dictionary, custom audio engines for voice capture, and a lineage database to preserve clans."
              },
              {
                year: "2026",
                title: "Global Launch & Public Submissions",
                desc: "Releasing the public archive, enabling vetted contributions, and connecting Bakenye in the diaspora to ancestral lineages."
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
                {/* Year tag left of line on desktop */}
                <div className="hidden md:block absolute -left-32 top-1 w-24 text-right text-lg font-serif font-black text-heritage-terracotta">
                  {milestone.year}
                </div>

                {/* Bullet point on line */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-heritage-cream dark:bg-stone-950 border-2 border-heritage-terracotta group-hover:bg-heritage-terracotta transition-colors duration-300" />

                <div className="bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 p-6 rounded-2xl shadow-xs group-hover:shadow-md transition-shadow">
                  <span className="inline-block md:hidden text-xs font-serif font-black text-heritage-terracotta mb-1">
                    {milestone.year}
                  </span>
                  <h4 className="text-lg font-bold text-heritage-brown dark:text-amber-500 mb-2">
                    {milestone.title}
                  </h4>
                  <p className="text-xs text-heritage-brown/70 dark:text-stone-300 leading-relaxed">
                    {milestone.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 px-4 bg-white dark:bg-stone-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-3.5 py-1.5 rounded-full">
              Our Compass
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white mt-4 mb-4">Our Core Values</h2>
            <p className="text-heritage-brown/60 dark:text-stone-400 max-w-xl mx-auto text-sm">These principles guide our efforts in documenting and sharing the Bakenyi heritage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="heritage-card p-8 text-center flex flex-col items-center hover:border-heritage-terracotta/40 dark:border-stone-800 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-heritage-cream dark:bg-stone-800 flex items-center justify-center mb-6">
                  <v.icon className={`w-8 h-8 ${i % 2 === 0 ? 'text-heritage-terracotta' : 'text-heritage-olive'}`} />
                </div>
                <h3 className="text-xl font-bold text-heritage-brown dark:text-amber-500 mb-3">{v.title}</h3>
                <p className="text-heritage-brown/70 dark:text-stone-300 text-xs leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY IMPACT METRICS */}
      <section className="py-24 px-4 bg-heritage-cream dark:bg-stone-950 transition-colors border-t border-heritage-brown/5 dark:border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-3.5 py-1.5 rounded-full">
                Preservation Footprint
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white leading-tight">
                Our Community Impact
              </h2>
              <p className="text-heritage-brown/70 dark:text-stone-300 text-sm md:text-base leading-relaxed">
                We measure our success not by digital metrics alone, but by our contribution to cultural survival and educational enrichment.
              </p>

              {/* Progress meters */}
              <div className="space-y-4 pt-4">
                {[
                  { label: "Lukenye vocabulary recorded & verified", value: 85, metric: "125+ words" },
                  { label: "Clan ancestral lineages mapped", value: 92, metric: "12 clans" },
                  { label: "Community submissions approved", value: 78, metric: "Approved archives" }
                ].map((stat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-heritage-brown dark:text-stone-300">
                      <span>{stat.label}</span>
                      <span className="text-heritage-terracotta">{stat.metric}</span>
                    </div>
                    <div className="w-full h-2 bg-heritage-brown/10 dark:bg-stone-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${stat.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-heritage-terracotta to-heritage-sand"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-3xl p-8 shadow-sm">
              <h4 className="text-xl font-serif font-bold text-heritage-brown dark:text-white mb-6">
                Core Digital Archival Goals
              </h4>
              <ul className="space-y-4">
                {[
                  "Complete integration of audio pronunciation widgets for Lukenye words",
                  "Comprehensive visual mapping of geographical settlements across Lake Kyoga",
                  "Encrypted cloud backups of historical image and document uploads",
                  "Regular live consultation reviews hosted with district Elder councils"
                ].map((goal, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-xs text-heritage-brown/80 dark:text-stone-300 leading-relaxed font-medium">
                    <div className="w-5 h-5 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Community Call to Action Section */}
      <section className="py-24 px-4 relative bg-stone-950 overflow-hidden border-t border-stone-900">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight">
            Join the Preservers of Bakenyi History
          </h2>
          <p className="text-heritage-sand max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            This platform is for everyone. Whether you are a researcher, a student, or a proud member of the Bakenyi community, we welcome your contribution. Let's record the history together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link to="/login" className="btn-primary inline-block text-center shadow-lg">Become a Member</Link>
            <Link to="/contribute" className="btn-secondary border-white/20 text-white hover:bg-white hover:text-stone-950 inline-block text-center">Contribute Information</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
