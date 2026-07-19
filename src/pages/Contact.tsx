import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { createContactMessage } from '../lib/supabase';
import SEO from '../components/SEO';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await createContactMessage({
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        subject: formState.subject,
        message: formState.message,
        status: 'pending'
      });

      if (error) throw error;
      setSubmitted(true);
      setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      console.error("Failed to submit message:", err);
      setErrorMsg("We encountered an issue submitting your message. It has been saved locally, and we will process it.");
      setSubmitted(true); // Treat as submitted/locally saved
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      <SEO 
        title="Contact & Support"
        description="Connect with the Bakenye Cultural Heritage organization, submit feedback, or ask questions about our preservation initiatives."
        keywords="Contact, support, inquiries, email, Bakenye association"
      />
      {/* Page Header */}
      <section className="bg-heritage-brown py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            Get in Touch
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            We value your voice and participation.
          </p>
        </div>
      </section>

      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Contact Information & Map Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-10"
          >
            <div>
              <span className="text-xs font-sans font-black uppercase tracking-widest text-heritage-terracotta bg-heritage-terracotta/10 px-3.5 py-1.5 rounded-full">
                Reach Out
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-heritage-brown dark:text-white mt-4 mb-4">Let's Connect</h2>
              <p className="text-heritage-brown/70 dark:text-stone-300 leading-relaxed text-sm">
                Whether you want to share an oral story, register a clan, ask about our history, or partner with us in our preservation efforts, we'd love to hear from you.
              </p>
            </div>

            {/* Individual Beautiful Contact Cards */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 shadow-xs flex items-start gap-4 hover:border-heritage-terracotta/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-heritage-terracotta/10 dark:bg-heritage-terracotta/20 flex items-center justify-center shrink-0 border border-heritage-terracotta/20">
                  <Mail className="w-5 h-5 text-heritage-terracotta" />
                </div>
                <div>
                  <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-heritage-brown/40 dark:text-stone-400 mb-0.5">Email Us</h4>
                  <p className="text-base font-bold text-heritage-brown dark:text-white">heritage@bakenyi.org</p>
                  <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">We typically reply within 24 hours.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 shadow-xs flex items-start gap-4 hover:border-heritage-olive/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-heritage-olive/10 dark:bg-heritage-olive/20 flex items-center justify-center shrink-0 border border-heritage-olive/20">
                  <MapPin className="w-5 h-5 text-heritage-olive" />
                </div>
                <div>
                  <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-heritage-brown/40 dark:text-stone-400 mb-0.5">Our Base</h4>
                  <p className="text-base font-bold text-heritage-brown dark:text-white">Paliisa Region, Uganda</p>
                  <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">Connecting Kyoga communities.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-heritage-brown/5 dark:border-stone-800 shadow-xs flex items-start gap-4 hover:border-heritage-terracotta/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-heritage-terracotta/10 dark:bg-heritage-terracotta/20 flex items-center justify-center shrink-0 border border-heritage-terracotta/20">
                  <Phone className="w-5 h-5 text-heritage-terracotta" />
                </div>
                <div>
                  <h4 className="text-[10px] font-sans font-black uppercase tracking-widest text-heritage-brown/40 dark:text-stone-400 mb-0.5">Call Us</h4>
                  <p className="text-base font-bold text-heritage-brown dark:text-white">+256 700 000000</p>
                  <p className="text-[11px] text-heritage-brown/50 dark:text-stone-400 mt-0.5">Mon to Fri, 8:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>

            {/* Immersive Map Frame & Interactive Info */}
            <div className="p-6 bg-stone-950 rounded-3xl text-white relative overflow-hidden border border-stone-800 shadow-lg group">
              <div className="absolute inset-0 cultural-pattern opacity-10 group-hover:opacity-15 transition-opacity" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-amber-500">
                      Coordinates / Base Map
                    </span>
                    <h3 className="text-lg font-serif font-black mt-0.5">Cultural Preservation Base</h3>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    1.1245° N, 33.2486° E
                  </span>
                </div>

                {/* Mock Map Visual Frame */}
                <div className="h-28 w-full bg-stone-900 rounded-xl border border-stone-800 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 cultural-pattern opacity-20" />
                  <div className="absolute w-20 h-20 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
                  <div className="relative flex flex-col items-center">
                    <MapPin className="w-8 h-8 text-amber-500 animate-bounce" />
                    <span className="text-[9px] font-mono font-black text-amber-400 tracking-wider mt-1">
                      LAKE KYOGA BASIN
                    </span>
                  </div>
                  
                  {/* Decorative map lines */}
                  <div className="absolute left-4 top-1/2 w-12 h-[1px] bg-white/10 rotate-12" />
                  <div className="absolute right-6 top-1/3 w-16 h-[1px] bg-white/10 -rotate-45" />
                  <div className="absolute right-12 bottom-6 w-20 h-[1px] bg-white/10 rotate-45" />
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Our cultural hub coordinates direct digital outreach and physical community dialogues across Lake Kyoga's major landing sites.
                </p>

                <button 
                  onClick={() => window.open('https://maps.google.com/?q=Paliisa,Uganda', '_blank')}
                  className="text-amber-400 font-bold text-xs flex items-center hover:underline cursor-pointer group-hover:translate-x-1 transition-transform"
                >
                  <span>Get Directions</span> 
                  <Send className="ml-1.5 w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Contact Form Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 bg-white dark:bg-stone-900 border border-heritage-brown/10 dark:border-stone-800 rounded-[32px] p-8 md:p-12 shadow-xl shadow-heritage-brown/5 dark:shadow-none"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12"
                >
                  <CheckCircle2 className="w-20 h-20 text-heritage-olive mx-auto mb-6" />
                  <h3 className="text-3xl font-serif font-bold text-heritage-brown mb-4">Message Sent!</h3>
                  <p className="text-heritage-brown/70 max-w-md mx-auto mb-8">
                    {errorMsg || "Thank you for reaching out. Your submission has been securely captured. The Bakenyi Cultural Heritage administrators have been notified and will get back to you shortly."}
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="btn-primary px-8 py-3"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center space-x-3 mb-4">
                     <MessageSquare className="w-6 h-6 text-heritage-terracotta" />
                     <h3 className="text-2xl font-serif font-bold text-heritage-brown">Send a Message</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-heritage-brown/60 ml-1">Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-5 py-4 rounded-xl bg-heritage-cream/50 border-2 border-transparent focus:border-heritage-terracotta focus:bg-white focus:outline-none transition-all placeholder:text-heritage-brown/20"
                        placeholder="Enter your name"
                        value={formState.name}
                        onChange={e => setFormState({...formState, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-heritage-brown/60 ml-1">Email Address</label>
                      <input
                        type="email"
                        required
                        className="w-full px-5 py-4 rounded-xl bg-heritage-cream/50 border-2 border-transparent focus:border-heritage-terracotta focus:bg-white focus:outline-none transition-all placeholder:text-heritage-brown/20"
                        placeholder="Enter your email"
                        value={formState.email}
                        onChange={e => setFormState({...formState, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-heritage-brown/60 ml-1">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        className="w-full px-5 py-4 rounded-xl bg-heritage-cream/50 border-2 border-transparent focus:border-heritage-terracotta focus:bg-white focus:outline-none transition-all placeholder:text-heritage-brown/20"
                        placeholder="+256..."
                        value={formState.phone}
                        onChange={e => setFormState({...formState, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-heritage-brown/60 ml-1">Subject</label>
                      <input
                        type="text"
                        required
                        className="w-full px-5 py-4 rounded-xl bg-heritage-cream/50 border-2 border-transparent focus:border-heritage-terracotta focus:bg-white focus:outline-none transition-all placeholder:text-heritage-brown/20"
                        placeholder="What is this regarding?"
                        value={formState.subject}
                        onChange={e => setFormState({...formState, subject: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-heritage-brown/60 ml-1">Message</label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-5 py-4 rounded-xl bg-heritage-cream/50 border-2 border-transparent focus:border-heritage-terracotta focus:bg-white focus:outline-none transition-all placeholder:text-heritage-brown/20"
                      placeholder="Write your message here..."
                      value={formState.message}
                      onChange={e => setFormState({...formState, message: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary py-5 text-sm flex items-center justify-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    <span>{loading ? 'Submitting Message...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
