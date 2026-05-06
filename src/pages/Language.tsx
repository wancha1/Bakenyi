import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Book, MessageSquare, Headphones, Pause, Play, Music } from 'lucide-react';

const phrases = [
  { id: 1, lukenye: "Waita muno", english: "Welcome / Greetings", usage: "General greeting" },
  { id: 2, lukenye: "Oli mulyo?", english: "How are you?", usage: "Polite inquiry" },
  { id: 3, lukenye: "Ndi mulyo", english: "I am well", usage: "Response to greeting" },
  { id: 4, lukenye: "Mwebele muno", english: "Thank you very much", usage: "Expressing gratitude" },
  { id: 5, lukenye: "Izina lyange nze...", english: "My name is...", usage: "Introduction" },
  { id: 6, lukenye: "Wa-va-wa?", english: "Where are you from?", usage: "Inquiry about origin" },
  { id: 7, lukenye: "Eizoba", english: "Sun", usage: "Common noun" },
  { id: 8, lukenye: "Amadhi", english: "Water", usage: "Common noun (crucial for riverine life)" }
];

const counts = [
  { id: 9, lukenye: "Eno", english: "One" },
  { id: 10, lukenye: "Iviiri", english: "Two" },
  { id: 11, lukenye: "Ishatu", english: "Three" },
  { id: 12, lukenye: "Ina", english: "Four" },
  { id: 13, lukenye: "Itaano", english: "Five" }
];

export default function Language() {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = (id: number) => {
    // Stop current if playing
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      return;
    }

    // In a real app, 'phrases' would have a 'soundUrl' property.
    // For now, using a short placeholder beep.
    const placeholderSound = "https://www.soundjay.com/button/button-1.mp3";
    
    if (audioRef.current) {
      audioRef.current.src = placeholderSound;
      audioRef.current.play().catch(err => console.log("Audio play error:", err));
    }
    
    setPlayingId(id);
  };

  const onAudioEnded = () => {
    setPlayingId(null);
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={onAudioEnded} 
        className="hidden" 
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
            The Lukenye Language
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            Preserving the rhythmic voice of our ancestors.
          </p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="inline-flex items-center space-x-2 text-heritage-terracotta font-bold text-xs uppercase tracking-widest mb-4">
            <Book className="w-4 h-4" />
            <span>Linguistic Heritage</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown mb-8 leading-tight">
            Why Lukenye Matters
          </h2>
          <p className="text-lg text-heritage-brown/70 leading-relaxed text-center mb-8">
            Lukenye is a unique Bantu language spoken by the Bakenyi people. It shares similarities with neighboring languages like Lusoga and Lugwere but retains distinct phonetic patterns and vocabulary specifically related to riverine and lacustrine (lake-based) life.
          </p>
          <div className="flex justify-center space-x-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-heritage-brown">~50k</span>
              <span className="text-xs text-heritage-brown/40 uppercase font-bold tracking-tighter">Native Speakers</span>
            </div>
            <div className="w-px h-10 bg-heritage-brown/10" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-heritage-brown">4+</span>
              <span className="text-xs text-heritage-brown/40 uppercase font-bold tracking-tighter">Major Regions</span>
            </div>
          </div>
        </div>

        {/* Phrases Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Common Phrases */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-heritage-brown/5"
            >
              <h3 className="text-3xl font-serif font-bold text-heritage-brown mb-10 flex items-center">
                <MessageSquare className="w-8 h-8 mr-4 text-heritage-terracotta" />
                Common Phrases
              </h3>
              <div className="space-y-4">
                {phrases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-5 bg-heritage-cream/30 rounded-2xl hover:bg-heritage-cream/60 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {playingId === p.id && (
                          <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1.2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute inset-0 bg-heritage-terracotta rounded-full"
                          />
                        )}
                        <button 
                          onClick={() => handlePlay(p.id)}
                          className={`relative z-10 p-3 rounded-full transition-all duration-300 ${
                            playingId === p.id 
                            ? 'bg-heritage-terracotta text-white' 
                            : 'bg-white text-heritage-brown group-hover:bg-heritage-brown group-hover:text-white shadow-sm'
                          }`}
                        >
                          {playingId === p.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                      <div>
                        <h4 className="font-bold text-heritage-brown text-lg">{p.lukenye}</h4>
                        <p className="text-sm text-heritage-brown/50">{p.english}</p>
                      </div>
                    </div>
                    <span className="hidden md:block text-[10px] uppercase font-black text-heritage-brown/20 tracking-[0.2em]">{p.usage}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Numbers & Tips */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-heritage-olive p-12 rounded-[40px] text-white relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 w-48 h-48 cultural-pattern opacity-10" />
                <h3 className="text-2xl font-serif font-bold mb-8 relative z-10 flex items-center">
                  <Music className="w-6 h-6 mr-3 text-heritage-sand" />
                  Counting in Lukenye
                </h3>
                <div className="grid grid-cols-1 gap-1 relative z-10">
                  {counts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-4 border-b border-white/10 hover:bg-white/5 transition-colors px-2 rounded-lg group">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handlePlay(c.id)}
                          className={`p-2 rounded-full transition-all ${
                            playingId === c.id ? 'bg-white text-heritage-olive' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {playingId === c.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                        <span className="font-bold text-xl">{c.lukenye}</span>
                      </div>
                      <span className="text-white/60 text-xs font-black uppercase tracking-widest">{c.english}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-12 rounded-[40px] border border-heritage-brown/5 shadow-sm"
              >
                <h3 className="text-2xl font-serif font-bold text-heritage-brown mb-8 flex items-center">
                  <Headphones className="w-6 h-6 mr-3 text-heritage-terracotta" />
                  Pronunciation Tool
                </h3>
                <div className="space-y-8">
                  <div className="flex items-start space-x-5">
                    <div className="w-10 h-10 rounded-2xl bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 font-black text-sm border border-heritage-terracotta/20">A</div>
                    <p className="text-heritage-brown/70 text-sm leading-relaxed">Vowels are generally 'pure' (like in Italian or Spanish). 'A' is always like 'father'.</p>
                  </div>
                  <div className="flex items-start space-x-5">
                    <div className="w-10 h-10 rounded-2xl bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 font-black text-sm border border-heritage-terracotta/20">DH</div>
                    <p className="text-heritage-brown/70 text-sm leading-relaxed">The 'DH' sound is similar to the English 'th' in 'there', often found in words like 'Amadhi' (water).</p>
                  </div>
                  
                  {/* Interactive Player Placeholder */}
                  <div className="p-8 bg-heritage-cream/30 rounded-[30px] border border-heritage-brown/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center text-left">
                      <div className="w-14 h-14 rounded-full bg-heritage-olive flex items-center justify-center text-white mr-4 shadow-lg shadow-heritage-olive/20">
                        <Volume2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h5 className="font-bold text-heritage-brown">Voice Archive</h5>
                        <p className="text-xs text-heritage-brown/50 leading-relaxed">Click any phrase above to hear recordings from native speakers.</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                       <div className="w-1 h-8 bg-heritage-olive/20 rounded-full animate-pulse" />
                       <div className="w-1 h-12 bg-heritage-olive/40 rounded-full animate-pulse delay-75" />
                       <div className="w-1 h-6 bg-heritage-olive/20 rounded-full animate-pulse delay-150" />
                       <div className="w-1 h-10 bg-heritage-olive/40 rounded-full animate-pulse delay-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Footer */}
      <section className="py-24 bg-heritage-brown text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-8">Contribute to the Glossary</h2>
          <p className="text-heritage-cream/60 text-lg leading-relaxed mb-12">
            Are you a fluent Lukenye speaker? Help us build the first complete digital dictionary for the Bakenyi people. Your recorded voice can help future generations learn our tongue correctly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button className="btn-primary !bg-heritage-sand !text-heritage-brown hover:!bg-white px-10 py-4 uppercase font-black tracking-widest text-xs">
              Record Phrases
            </button>
            <button className="btn-secondary !text-white !border-white/20 hover:!border-white px-10 py-4 uppercase font-black tracking-widest text-xs">
              Review Glossary
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
