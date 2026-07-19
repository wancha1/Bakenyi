import { Link } from 'react-router-dom';
import { Globe, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Smartphone, Download } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-stone-950 text-heritage-cream pt-12 pb-6 overflow-hidden border-t border-stone-900">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 grayscale invert opacity-90">
              <Globe className="w-7 h-7 text-heritage-terracotta" />
              <div className="flex flex-col">
                <span className="text-lg font-serif font-black leading-tight tracking-tight">BAKENYI</span>
                <span className="text-[9px] font-sans font-semibold uppercase tracking-[0.2em] leading-none">Heritage Platform</span>
              </div>
            </Link>
            <p className="text-heritage-cream/70 text-xs leading-relaxed max-w-xs font-medium">
              Dedicated to the preservation, documentation, and promotion of the rich cultural heritage of the Bakenyi people.
            </p>
            <div className="flex space-x-4 pt-1">
              <a href="#" className="text-heritage-cream/60 hover:text-heritage-terracotta transition-colors" aria-label="Facebook Page">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="text-heritage-cream/60 hover:text-heritage-terracotta transition-colors" aria-label="Twitter Profile">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-heritage-cream/60 hover:text-heritage-terracotta transition-colors" aria-label="Instagram Account">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-sans font-black uppercase tracking-widest text-white mb-4 border-b border-heritage-cream/10 pb-1.5">Quick Links</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-medium">
              <li><Link to="/about" className="text-heritage-cream/70 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/history" className="text-heritage-cream/70 hover:text-white transition-colors">Our History</Link></li>
              <li><Link to="/clans" className="text-heritage-cream/70 hover:text-white transition-colors">Bakenyi Clans</Link></li>
              <li><Link to="/gallery" className="text-heritage-cream/70 hover:text-white transition-colors">Photo Archive</Link></li>
              <li><Link to="/language" className="text-heritage-cream/70 hover:text-white transition-colors">Lukenye Dialect</Link></li>
              <li><Link to="/articles" className="text-heritage-cream/70 hover:text-white transition-colors">Published Articles</Link></li>
              <li><Link transition-colors="true" to="/contribute" className="text-heritage-cream/70 hover:text-white">Join Archive</Link></li>
              <li><Link to="/admin" className="text-heritage-cream/50 hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Culture Section */}
          <div>
            <h4 className="text-xs font-sans font-black uppercase tracking-widest text-white mb-4 border-b border-heritage-cream/10 pb-1.5">Our Culture</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li className="text-heritage-cream/70 italic">"Waita muno" — The art of fishing</li>
              <li className="text-heritage-cream/70 italic">"Embaire" — Traditional music</li>
              <li className="text-heritage-cream/70 italic">"Obutenyi" — Unity & Identity</li>
              <li className="text-heritage-cream/70 italic">"Ebiswa" — Oral Traditions</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-sans font-black uppercase tracking-widest text-white mb-4 border-b border-heritage-cream/10 pb-1.5">Get in Touch</h4>
            <ul className="space-y-3 text-xs font-medium">
              <li className="flex items-start space-x-2.5 text-heritage-cream/70">
                <MapPin className="w-4 h-4 text-heritage-terracotta shrink-0" />
                <span>Kyoga Region, Uganda</span>
              </li>
              <li className="flex items-center space-x-2.5 text-heritage-cream/70">
                <Mail className="w-4 h-4 text-heritage-terracotta shrink-0" />
                <span>heritage@bakenyi.org</span>
              </li>
              <li className="flex items-center space-x-2.5 text-heritage-cream/70">
                <Phone className="w-4 h-4 text-heritage-terracotta shrink-0" />
                <span>+256 700 000000</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Web App CTA Banner */}
        <div className="mt-6 mb-8 p-5 rounded-xl bg-heritage-olive/10 border border-heritage-cream/5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 cultural-pattern opacity-5 pointer-events-none" />
          <div className="relative z-10 flex items-center space-x-4">
            <div className="p-3 bg-heritage-terracotta text-white rounded-xl shrink-0">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-left">
              <h5 className="font-serif font-bold text-base text-white">Bakenyi System Compatibility & Installer</h5>
              <p className="text-xs text-heritage-cream/70 max-w-xl mt-1 leading-relaxed">
                Our platform automatically profiles your device's architecture and installs an optimized, offline-ready cultural archive package on your home screen or dock.
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-app-install'))}
            className="relative z-10 w-full md:w-auto px-6 py-2.5 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Analyze & Install</span>
          </button>
        </div>

        <div className="pt-8 border-t border-heritage-cream/10 text-center text-xs text-heritage-cream/50 tracking-widest uppercase">
          <p>© {currentYear} Bakenyi Cultural Heritage Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
