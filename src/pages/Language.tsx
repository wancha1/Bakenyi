import { motion } from 'motion/react';
import { Volume2, Book, MessageSquare, Headphones } from 'lucide-react';

const phrases = [
  { lukenye: "Waita muno", english: "Welcome / Greetings", usage: "General greeting" },
  { lukenye: "Oli mulyo?", english: "How are you?", usage: "Polite inquiry" },
  { lukenye: "Ndi mulyo", english: "I am well", usage: "Response to greeting" },
  { lukenye: "Mwebele muno", english: "Thank you very much", usage: "Expressing gratitude" },
  { lukenye: "Izina lyange nze...", english: "My name is...", usage: "Introduction" },
  { lukenye: "Wa-va-wa?", english: "Where are you from?", usage: "Inquiry about origin" },
  { lukenye: "Eizoba", english: "Sun", usage: "Common noun" },
  { lukenye: "Amadhi", english: "Water", usage: "Common noun (crucial for riverine life)" }
];

const counts = [
  { lukenye: "Eno", english: "One" },
  { lukenye: "Iviiri", english: "Two" },
  { lukenye: "Ishatu", english: "Three" },
  { lukenye: "Ina", english: "Four" },
  { lukenye: "Itaano", english: "Five" }
];

export default function Language() {
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
              className="bg-white rounded-3xl p-8 shadow-sm border border-heritage-brown/5"
            >
              <h3 className="text-2xl font-serif font-bold text-heritage-brown mb-8 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-heritage-terracotta" />
                Common Phrases
              </h3>
              <div className="space-y-4">
                {phrases.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-heritage-cream/30 rounded-xl hover:bg-heritage-cream/60 transition-colors group">
                    <div>
                      <h4 className="font-bold text-heritage-brown text-lg">{p.lukenye}</h4>
                      <p className="text-sm text-heritage-brown/50 italic">{p.english}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="hidden group-hover:block text-[10px] uppercase font-bold text-heritage-brown/30 mr-4 tracking-widest">{p.usage}</span>
                      <button className="p-2 rounded-full bg-white text-heritage-terracotta hover:bg-heritage-terracotta hover:text-white transition-all">
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Numbers & Tips */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-heritage-olive p-10 rounded-3xl text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 cultural-pattern opacity-10" />
                <h3 className="text-2xl font-serif font-bold mb-8 relative z-10">Counting in Lukenye</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  {counts.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-white/20">
                      <span className="font-bold text-lg">{c.lukenye}</span>
                      <span className="text-white/60 text-sm uppercase font-bold tracking-widest">{c.english}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-10 rounded-3xl border border-heritage-brown/5"
              >
                <h3 className="text-2xl font-serif font-bold text-heritage-brown mb-6">Pronunciation Tips</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 font-bold text-sm">A</div>
                    <p className="text-heritage-brown/70 text-sm">Vowels are generally 'pure' (like in Italian or Spanish). 'A' is always like 'father'.</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 font-bold text-sm">DH</div>
                    <p className="text-heritage-brown/70 text-sm">The 'DH' sound is similar to the English 'th' in 'there', often found in words like 'Amadhi' (water).</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-heritage-cream/30 rounded-2xl mt-8">
                     <div className="flex items-center mb-4 sm:mb-0">
                       <Headphones className="w-10 h-10 text-heritage-olive mr-4" />
                       <div className="text-left">
                         <h5 className="font-bold text-heritage-brown">Listen to Audio</h5>
                         <p className="text-xs text-heritage-brown/50">Full pronunciation guide coming soon.</p>
                       </div>
                     </div>
                     <button className="btn-secondary whitespace-nowrap !py-2 !px-4">Coming Soon</button>
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
          <h2 className="text-3xl font-serif font-bold mb-6">Contribute to the Glossary</h2>
          <p className="text-heritage-cream/60 leading-relaxed mb-8">
            Are you a fluent Lukenye speaker? Help us build the first complete digital dictionary for the Bakenyi people. Your knowledge is vital for our future.
          </p>
          <button className="btn-primary !bg-heritage-sand !text-heritage-brown hover:!bg-white">Submit New Phrases</button>
        </div>
      </section>
    </div>
  );
}
