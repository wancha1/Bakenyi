import { motion } from 'motion/react';
import { UserPlus, Mic, Upload, CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Register as a Contributor",
    desc: "Create your cultural profile to start documenting history. We welcome elders, students, and community members.",
    icon: UserPlus,
    action: "Sign Up Now",
    color: "heritage-terracotta"
  },
  {
    id: 2,
    title: "Collect Cultural Data",
    desc: "Use your phone or recorder to capture oral histories, Lukenye pronunciations, or photos of historical artifacts.",
    icon: Mic,
    action: "Recording Guide",
    color: "heritage-olive"
  },
  {
    id: 3,
    title: "Submit to the Archive",
    desc: "Upload your findings through our secure portal. Our committee will verify and add them to the public platform.",
    icon: Upload,
    action: "Upload Portal",
    color: "heritage-terracotta"
  }
];

export default function Contribute() {
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
            Join the Preservation
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            Your voice is our history. Follow these steps to get started.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="space-y-12">
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex flex-col md:flex-row gap-8 items-center group"
            >
              {/* Step Number */}
              <div className="hidden md:flex flex-col items-center justify-start h-full absolute -left-16 top-0 bottom-0">
                <div className="w-10 h-10 rounded-full bg-heritage-brown text-white flex items-center justify-center font-bold font-serif text-lg z-10 border-4 border-heritage-cream">
                  {step.id}
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-grow w-0.5 bg-heritage-brown/10 my-2" />
                )}
              </div>

              {/* Content Card */}
              <div className="heritage-card p-10 bg-white flex-grow hover:border-heritage-terracotta/30 transition-all duration-500">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className={`w-20 h-20 rounded-2xl bg-${step.color}/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                    <step.icon className={`w-10 h-10 text-${step.color}`} />
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-heritage-brown mb-4">
                      {step.title}
                    </h3>
                    <p className="text-heritage-brown/60 text-lg leading-relaxed mb-8">
                      {step.desc}
                    </p>
                    <button className={`btn-primary flex items-center mx-auto md:mx-0 group`}>
                      {step.action}
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-2" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Indicator (Checkmark) */}
              <div className="hidden lg:flex items-center space-x-2 text-heritage-brown/20 group-hover:text-heritage-olive transition-colors">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest bg-heritage-cream px-2 py-1 rounded">Ready</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 bg-white px-4 border-t border-heritage-brown/5">
        <div className="max-w-4xl mx-auto">
          <div className="bg-heritage-olive p-12 rounded-[40px] text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 cultural-pattern opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Need more guidance?</h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Download our "Cultural Documentation Toolkit" (PDF) designed for community volunteers.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="px-8 py-4 bg-white text-heritage-olive rounded-full font-bold uppercase tracking-widest text-sm hover:bg-heritage- sand transition-all">
                  Download Toolkit
                </button>
                <button className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all">
                  Join Discord
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
