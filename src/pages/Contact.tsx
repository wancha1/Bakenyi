import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message! This is a demo form.");
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-8">Let's connect</h2>
            <p className="text-heritage-brown/70 leading-relaxed mb-12 text-lg">
              Whether you want to share a story, ask about our history, or partner with us in our preservation efforts, we'd love to hear from you.
            </p>

            <div className="space-y-10">
              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-heritage-terracotta" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-heritage-brown/40 mb-1">Email Us</h4>
                  <p className="text-xl font-bold text-heritage-brown">heritage@bakenyi.org</p>
                  <p className="text-sm text-heritage-brown/50 mt-1">We typically reply within 24 hours.</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-heritage-olive" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-heritage-brown/40 mb-1">Our Base</h4>
                  <p className="text-xl font-bold text-heritage-brown">Paliisa Region, Uganda</p>
                  <p className="text-sm text-heritage-brown/50 mt-1">Connecting the Kyoga communities.</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-heritage-terracotta" />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-heritage-brown/40 mb-1">Call Us</h4>
                  <p className="text-xl font-bold text-heritage-brown">+256 700 000000</p>
                </div>
              </div>
            </div>

            <div className="mt-16 p-8 bg-heritage-brown rounded-3xl text-white relative overflow-hidden group">
               <div className="absolute inset-0 cultural-pattern opacity-10 group-hover:opacity-20 transition-opacity" />
               <h3 className="text-xl font-serif font-bold mb-4 relative z-10">Visit our Cultural Center</h3>
               <p className="text-heritage-cream/60 mb-6 relative z-10">Experience the Lukenye music and see our historical artifacts in person.</p>
               <button className="text-heritage-sand font-bold flex items-center hover:underline relative z-10">
                 Get Directions <Send className="ml-2 w-4 h-4" />
               </button>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl shadow-heritage-brown/5"
          >
            <div className="flex items-center space-x-3 mb-8">
               <MessageSquare className="w-6 h-6 text-heritage-terracotta" />
               <h3 className="text-2xl font-serif font-bold text-heritage-brown">Send a Message</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <button type="submit" className="w-full btn-primary py-5 text-sm">
                Send Message
              </button>
            </form>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
