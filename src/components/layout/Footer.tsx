import { Link } from 'react-router-dom';
import { Globe, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-heritage-brown text-heritage-cream pt-16 pb-8 overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2 grayscale invert opacity-90">
              <Globe className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="text-xl font-serif font-bold leading-tight tracking-tight">BAKENYI</span>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] leading-none">Heritage Platform</span>
              </div>
            </Link>
            <p className="text-heritage-cream/70 text-sm leading-relaxed max-w-xs">
              Dedicated to the preservation, documentation, and promotion of the rich cultural heritage of the Bakenyi people.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-heritage-terracotta transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-heritage-terracotta transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-heritage-terracotta transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-6 border-b border-heritage-cream/20 pb-2">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link to="/history" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">Our History</Link></li>
              <li><Link to="/clans" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">Bakenyi Clans</Link></li>
              <li><Link to="/gallery" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">Photo Archive</Link></li>
              <li><Link to="/language" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">Lukenye Language</Link></li>
              <li><Link to="/articles" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">Published Articles</Link></li>
              <li><Link to="/contribute" className="text-heritage-cream/70 hover:text-white transition-colors text-sm">Join the Archive</Link></li>
              <li><Link to="/admin" className="text-heritage-cream/70 hover:text-white transition-colors text-sm opacity-20 hover:opacity-100">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Culture Section */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-6 border-b border-heritage-cream/20 pb-2">Our Culture</h4>
            <ul className="space-y-3">
              <li className="text-heritage-cream/70 text-sm italic">"Waita muno" — The art of fishing</li>
              <li className="text-heritage-cream/70 text-sm italic">"Embaire" — Traditional music</li>
              <li className="text-heritage-cream/70 text-sm italic">"Obutenyi" — Unity & Identity</li>
              <li className="text-heritage-cream/70 text-sm italic">"Ebiswa" — Oral Traditions</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-6 border-b border-heritage-cream/20 pb-2">Get in Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm text-heritage-cream/70">
                <MapPin className="w-5 h-5 text-heritage-terracotta shrink-0" />
                <span>Kyoga Region, Uganda</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-heritage-cream/70">
                <Mail className="w-4 h-4 text-heritage-terracotta shrink-0" />
                <span>heritage@bakenyi.org</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-heritage-cream/70">
                <Phone className="w-4 h-4 text-heritage-terracotta shrink-0" />
                <span>+256 700 000000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-heritage-cream/10 text-center text-xs text-heritage-cream/50 tracking-widest uppercase">
          <p>© {currentYear} Bakenyi Cultural Heritage Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
