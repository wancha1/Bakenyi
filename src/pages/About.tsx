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
      <section className="bg-heritage-brown py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            About the Platform
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase"
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

      {/* Overview Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown">Our Purpose</h2>
              <p className="text-heritage-brown/70 leading-relaxed text-lg">
                The Bakenyi Cultural Heritage Platform was founded on the realization that our rich cultural tapestry—woven over centuries along the lakes and rivers of Uganda—is at risk of fading as modern influences reshape our social landscape.
              </p>
              <p className="text-heritage-brown/70 leading-relaxed text-lg">
                We believe that technology can be a powerful ally in cultural preservation. By creating a centralized, accessible digital archive, we bridge the gap between our elders who hold the oral traditions and our tech-savvy youth who are the future custodians of our heritage.
              </p>
              <div className="p-6 bg-white border-l-4 border-heritage-terracotta rounded-r-xl shadow-sm italic text-heritage-brown/80">
                "Our ancestors lived on floating islands (Ebiswa) not because they were lost, but because they understood the delicate balance between the land and the life-giving waters of Lake Kyoga."
              </div>
            </motion.div>

            <div className="relative">
              <div className="heritage-card">
                <img 
                  src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1200" 
                  alt="Cultural preservation" 
                  className="w-full h-[500px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-heritage-olive rounded-full flex items-center justify-center p-4 text-center">
                <p className="text-white text-xs font-bold leading-tight uppercase">Safeguarding Roots</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Grid */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown mb-4">Our Core Values</h2>
            <p className="text-heritage-brown/60 max-w-xl mx-auto">These principles guide our efforts in documenting and sharing the Bakenyi heritage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="heritage-card p-10 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-heritage-cream flex items-center justify-center mb-6">
                  <v.icon className={`w-8 h-8 ${i % 2 === 0 ? 'text-heritage-terracotta' : 'text-heritage-olive'}`} />
                </div>
                <h3 className="text-xl font-bold text-heritage-brown mb-4">{v.title}</h3>
                <p className="text-heritage-brown/60 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown mb-8">Join Our Community</h2>
          <p className="text-heritage-brown/70 max-w-2xl mx-auto mb-12 text-lg">
            This platform is for everyone. Whether you are a researcher, a student, or a proud member of the Bakenyi community, we welcome your contribution.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login" className="btn-primary inline-block text-center">Become a Member</Link>
            <Link to="/contribute" className="btn-secondary inline-block text-center">Contribute Information</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
