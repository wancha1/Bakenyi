import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'History', path: '/history' },
  { name: 'Clans', path: '/clans' },
  { name: 'Leadership', path: '/leadership' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Language', path: '/language' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-heritage-cream/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Globe className="w-8 h-8 text-heritage-terracotta" />
            <div className="flex flex-col">
              <span className="text-xl font-serif font-bold text-heritage-brown leading-tight tracking-tight">BAKENYI</span>
              <span className="text-[10px] font-sans font-semibold text-heritage-terracotta uppercase tracking-[0.2em] leading-none">Heritage Platform</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className="relative group py-2"
              >
                <span className={`nav-link ${location.pathname === item.path ? 'text-heritage-terracotta' : ''}`}>
                  {item.name}
                </span>
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-heritage-terracotta"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-heritage-terracotta/40 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-heritage-brown hover:text-heritage-terracotta focus:outline-none p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-heritage-cream border-b border-heritage-brown/10 shadow-xl overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-4 text-base font-medium border-b border-heritage-brown/5 ${
                    location.pathname === item.path ? 'text-heritage-terracotta' : 'text-heritage-brown/70 hover:text-heritage-terracotta'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
