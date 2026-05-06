import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Compass, Globe } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax-style intro */}
        <motion.div 
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=2000" 
            alt="African landscape" 
            className="w-full h-full object-cover grayscale-[20%] brightness-[0.4]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-heritage-brown/30 backdrop-blur-[1px]" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-block px-5 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-heritage-sand text-[10px] font-black uppercase tracking-[0.4em]"
            >
              Riverine Cultural Archive
            </motion.span>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-serif font-bold mb-10 leading-[1] tracking-tighter">
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="block"
                >
                  Preserving the
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                  className="block text-heritage-sand"
                >
                  Bakenyi Spirit
                </motion.span>
              </span>
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="max-w-2xl mx-auto text-lg md:text-2xl text-heritage-cream/70 mb-12 font-sans font-light leading-relaxed tracking-wide"
            >
              Documenting the floating worlds and riverine wisdom of the Kyoga basin for generations to come.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/history" className="btn-primary flex items-center group relative px-10 py-4">
                <span className="relative z-10">Explore History</span>
                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2 relative z-10" />
              </Link>
              <Link to="/about" className="btn-secondary !text-white !border-white/40 hover:!border-white hover:!bg-white hover:!text-heritage-brown transition-all duration-500 px-10 py-4">
                Our Mission
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
        >
          <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto" />
        </motion.div>
      </section>

      {/* Introduction Section */}
      <section className="py-24 bg-heritage-cream relative">
        <div className="absolute inset-0 cultural-pattern pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-heritage-terracotta font-bold text-xs uppercase tracking-widest block mb-4">Our Foundation</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-heritage-brown mb-8 leading-tight">
                Guardians of the Lake Kyoga Traditions
              </h2>
              <p className="text-lg text-heritage-brown/70 mb-6 leading-relaxed">
                The Bakenyi people have for centuries thrived along the shores and floating islands of Lake Kyoga and the River Nile. Our culture is intertwined with the waters, defined by a spirit of resilience and a rich oral tradition.
              </p>
              <p className="text-lg text-heritage-brown/70 mb-8 leading-relaxed">
                This platform serves as a living library, ensuring that the Lukenye language, our clan lineages, and our ancestral wisdom are never lost to time.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-heritage-olive/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-heritage-olive" />
                  </div>
                  <div>
                    <h4 className="font-bold text-heritage-brown">Unity</h4>
                    <p className="text-sm text-heritage-brown/60">Connecting communities across regions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-heritage-terracotta/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-heritage-terracotta" />
                  </div>
                  <div>
                    <h4 className="font-bold text-heritage-brown">Education</h4>
                    <p className="text-sm text-heritage-brown/60">Teaching the Lukenye language.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative p-4"
            >
              <div className="absolute top-0 right-0 w-2/3 h-2/3 border-t-2 border-r-2 border-heritage-terracotta opacity-20" />
              <div className="absolute bottom-0 left-0 w-2/3 h-2/3 border-b-2 border-l-2 border-heritage-olive opacity-20" />
              <img 
                src="https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&q=80&w=1000" 
                alt="Community life" 
                className="relative z-10 w-full h-[500px] object-cover rounded-sm shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown mb-4">Discover Our Heritage</h2>
            <div className="w-24 h-1 bg-heritage-terracotta mx-auto mb-6" />
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div variants={item} className="heritage-card p-8 group">
              <Compass className="w-10 h-10 text-heritage-terracotta mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-heritage-brown mb-3">Our History</h3>
              <p className="text-heritage-brown/60 text-sm mb-6 leading-relaxed">
                From the islands of Lake Kyoga to the heart of Uganda. Trace our migration journeys.
              </p>
              <Link to="/history" className="text-heritage-terracotta font-bold text-xs uppercase tracking-widest flex items-center hover:underline">
                Read More <ArrowRight className="ml-2 w-3 h-3" />
              </Link>
            </motion.div>

            <motion.div variants={item} className="heritage-card p-8 group">
              <Users className="w-10 h-10 text-heritage-olive mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-heritage-brown mb-3">The Clans</h3>
              <p className="text-heritage-brown/60 text-sm mb-6 leading-relaxed">
                Discover the lineages that form the backbone of Bakenyi identity and their totems.
              </p>
              <Link to="/clans" className="text-heritage-olive font-bold text-xs uppercase tracking-widest flex items-center hover:underline">
                View Clans <ArrowRight className="ml-2 w-3 h-3" />
              </Link>
            </motion.div>

            <motion.div variants={item} className="heritage-card p-8 group">
              <Globe className="w-10 h-10 text-heritage-terracotta mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-heritage-brown mb-3">Our Language</h3>
              <p className="text-heritage-brown/60 text-sm mb-6 leading-relaxed">
                Preserving the rhythmic Lukenye language through basic phrases and oral history.
              </p>
              <Link to="/language" className="text-heritage-terracotta font-bold text-xs uppercase tracking-widest flex items-center hover:underline">
                Learn Lukenye <ArrowRight className="ml-2 w-3 h-3" />
              </Link>
            </motion.div>

            <motion.div variants={item} className="heritage-card p-8 group">
              <BookOpen className="w-10 h-10 text-heritage-olive mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-heritage-brown mb-3">Archives</h3>
              <p className="text-heritage-brown/60 text-sm mb-6 leading-relaxed">
                A visual journey through a collection of cultural photographs and documents.
              </p>
              <Link to="/gallery" className="text-heritage-olive font-bold text-xs uppercase tracking-widest flex items-center hover:underline">
                Explore Gallery <ArrowRight className="ml-2 w-3 h-3" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 bg-heritage-brown relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <span className="text-6xl font-serif text-heritage-terracotta block mb-6">"</span>
            <p className="text-2xl md:text-3xl font-serif italic mb-8 leading-relaxed">
              "A people without the knowledge of their past history, origin and culture is like a tree without roots."
            </p>
            <p className="text-heritage-sand font-bold tracking-widest uppercase text-sm">Marcus Garvey</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
