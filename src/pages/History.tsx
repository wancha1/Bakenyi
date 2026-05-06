import { motion } from 'motion/react';
import { Calendar, Map, MessageCircle, BookOpen } from 'lucide-react';

export default function History() {
  const timelineEvents = [
    {
      period: "15th - 16th Century",
      title: "Ancient Roots & Migration",
      desc: "The Bakenyi precursors evolved from the wider Bantu-speaking groups around Lake Victoria and the Bunyoro-Kitara Empire, eventually settling along the Nile-Kyoga waterways."
    },
    {
      period: "17th Century",
      title: "Establishment on floating islands",
      desc: "Survival through adaptation. The Bakenyi became famous for living on 'Ebiswa' (floating islands formed by papyrus), which provided natural defense and immediate access to fishing grounds."
    },
    {
      period: "18th - 19th Century",
      title: "Regional Expansion",
      desc: "Migration further into current districts like Paliisa, Kamuli, and Budaka. Establishing relationships with the Baganda, Basoga, and Bagwere while maintaining a distinct linguistic identity."
    },
    {
      period: "1900s - Colonial Era",
      title: "Administrative Recognition",
      desc: "Formal recording of Bakenyi as a distinct ethnic group under the Uganda Protectorate documentation. Settlement patterns moved more towards stable land-based villages."
    },
    {
      period: "Present Day",
      title: "Cultural Digital Era",
      desc: "A focus on educational revival and digital documentation of the Lukenye language and clan systems to prevent cultural erosion."
    }
  ];

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Hero Header */}
      <section className="bg-heritage-olive py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            Chronicles of the Bakenyi
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            A journey through time, water, and resilience.
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column - Historical Narratives */}
          <div className="lg:col-span-7 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 text-heritage-terracotta mb-4">
                <Map className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest">The Great Migration</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-6">Migration from the Lakeshores</h2>
              <p className="text-heritage-brown/70 leading-relaxed mb-6 text-lg">
                Historical oral traditions suggest that the Bakenyi entered the Kyoga region from multiple directions. One significant route traces ancestry to the ancestors of the Baganda and Basoga near Lake Victoria, while another branch shares lineage roots with the people of Bunyoro.
              </p>
              <p className="text-heritage-brown/70 leading-relaxed text-lg">
                Known as the 'Water People', the Bakenyi were the masters of Lake Kyoga long before modern navigation. They were recognized for their unique dugout canoes and their reliance on the papyrus floating islands, which acted as mobile homes and protective fortress.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 text-heritage-olive mb-4">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest">Oral Tradition</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-6">The Power of the Word</h2>
              <p className="text-heritage-brown/70 leading-relaxed mb-6 text-lg">
                For centuries, Bakenyi history was preserved through 'Engero' (proverbs) and epic storytelling sessions around fires at night. Elders would recount the heroic acts of clan leaders who navigated the treacherous storms of Lake Kyoga and successfully negotiated peace with neighboring tribes.
              </p>
              <div className="bg-heritage-olive/5 p-8 rounded-2xl border-l-4 border-heritage-olive italic text-heritage-brown/80">
                "We do not write on paper alone; we write on the hearts of our children. When an elder dies, it is as if a whole library has burned down." 
                <span className="block mt-4 font-bold text-xs uppercase not-italic text-heritage-olive">— Traditional Wisdom</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-5 relative">
            <h3 className="text-2xl font-serif font-bold text-heritage-brown mb-12 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-heritage-terracotta" />
              Timeline of Milestones
            </h3>
            
            <div className="relative pl-8 border-l-2 border-heritage-brown/10 ml-4 space-y-12">
              {timelineEvents.map((event, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-heritage-terracotta border-4 border-heritage-cream" />
                  
                  <span className="text-xs font-bold text-heritage-terracotta uppercase tracking-tighter block mb-1">
                    {event.period}
                  </span>
                  <h4 className="text-lg font-bold text-heritage-brown mb-2">{event.title}</h4>
                  <p className="text-sm text-heritage-brown/60 leading-relaxed tracking-tight font-medium">
                    {event.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Quote Section */}
      <section className="py-24 bg-heritage-cream border-t border-heritage-brown/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-heritage-terracotta/30 mx-auto mb-8" />
          <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-6">Historical Challenges</h2>
          <p className="text-heritage-brown/70 leading-relaxed mb-8 text-lg italic">
            "Through climatic shifts that affected the water levels of Lake Kyoga and the political changes of various Ugandan empires, the Bakenyi maintained a distinct identity by keeping their language and clan systems alive despite being small in number."
          </p>
          <div className="w-16 h-1 bg-heritage-terracotta mx-auto" />
        </div>
      </section>
    </div>
  );
}
