import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, Search, Shield, User, Clock, BookOpen, Volume2, Command, ArrowRight, Sun, Moon, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchDatabase, SearchItem } from '../../data/searchDb';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'History', path: '/history' },
  { name: 'Clans', path: '/clans' },
  { name: 'Leadership', path: '/leadership' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Language', path: '/language' },
  { name: 'Articles', path: '/articles' },
  { name: 'Contribute', path: '/contribute' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'cream' | 'dark'>(() => {
    return (localStorage.getItem('bakenyi-theme') as 'cream' | 'dark') || 'cream';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bakenyi-theme', theme);
  }, [theme]);

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

  // Keyboard listener for Cmd+K / Ctrl+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Block scroll when search is active, and reset category filter
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setSelectedCategory('All');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen]);

  const rawFilteredResults = searchQuery.trim() === '' 
    ? [] 
    : searchDatabase.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const filteredResults = selectedCategory === 'All'
    ? rawFilteredResults
    : rawFilteredResults.filter(item => item.category === selectedCategory);

  const popularSearches = [
    { title: "BaiseMugosa Clan", path: "/clans?q=BaiseMugosa" },
    { title: "Floating Islands (Ebiswa)", path: "/history?track=track-1" },
    { title: "Elder Moses Musuusu", path: "/leadership?q=Moses" },
    { title: "Lukenye Language Preservation", path: "/history?track=track-2" },
    { title: "Canoe Crafting Techniques", path: "/history?track=track-4" }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Clan':
        return <Shield className="w-5 h-5 text-heritage-terracotta" />;
      case 'Leader':
        return <User className="w-5 h-5 text-heritage-olive" />;
      case 'History Timeline':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'Oral History':
        return <Volume2 className="w-5 h-5 text-heritage-terracotta animate-pulse" />;
      default:
        return <BookOpen className="w-5 h-5 text-heritage-brown/60" />;
    }
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-heritage-cream/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <Globe className="w-8 h-8 text-heritage-terracotta" />
              <div className="flex flex-col">
                <span className="text-xl font-serif font-bold text-heritage-brown leading-tight tracking-tight">BAKENYI</span>
                <span className="text-[10px] font-sans font-semibold text-heritage-terracotta uppercase tracking-[0.2em] leading-none">Heritage Platform</span>
              </div>
            </Link>

            {/* Desktop Navigation & Search Group */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-6 lg:space-x-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className="relative group py-2"
                  >
                    <span className={`nav-link ${location.pathname === item.path ? 'text-heritage-terracotta font-semibold' : ''}`}>
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

              {/* Desktop Search Trigger Button */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-1.5 bg-heritage-brown/5 hover:bg-heritage-brown/10 rounded-full border border-heritage-brown/10 text-heritage-brown/50 hover:text-heritage-brown/80 transition-all text-xs font-semibold cursor-pointer shrink-0"
                title="Search (Cmd+K)"
              >
                <Search className="w-3.5 h-3.5 text-heritage-brown/50" />
                <span className="hidden lg:inline">Search...</span>
                <kbd className="hidden lg:flex items-center gap-0.5 bg-heritage-brown/10 text-[9px] font-mono px-1.5 py-0.5 rounded text-heritage-brown/60 border border-heritage-brown/5 select-none leading-none">
                  ⌘K
                </kbd>
              </button>

              {/* Theme Switcher Button */}
              <button
                onClick={() => setTheme(prev => prev === 'cream' ? 'dark' : 'cream')}
                className="p-2 hover:bg-heritage-brown/5 rounded-full border border-heritage-brown/10 text-heritage-brown/70 hover:text-heritage-brown transition-all cursor-pointer shrink-0"
                title={theme === 'cream' ? 'Switch to High-Contrast Dark' : 'Switch to Cream Theme'}
                id="theme-switcher-desktop"
              >
                {theme === 'cream' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-heritage-sand" />}
              </button>
            </div>

            {/* Mobile Actions (Search + Theme Switcher + Hamburger) */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-heritage-brown hover:text-heritage-terracotta focus:outline-none p-2 rounded-full hover:bg-heritage-brown/5 transition-all"
                aria-label="Open Search"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setTheme(prev => prev === 'cream' ? 'dark' : 'cream')}
                className="text-heritage-brown hover:text-heritage-terracotta focus:outline-none p-2 rounded-full hover:bg-heritage-brown/5 transition-all cursor-pointer"
                aria-label="Toggle Theme"
                title={theme === 'cream' ? 'Switch to High-Contrast Dark' : 'Switch to Cream Theme'}
                id="theme-switcher-mobile"
              >
                {theme === 'cream' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-heritage-sand" />}
              </button>

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

      {/* Global Search Spotlight Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-heritage-brown/80 backdrop-blur-md flex items-start justify-center p-4 md:p-12 overflow-y-auto"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="w-full max-w-2xl bg-heritage-cream rounded-[32px] border border-heritage-sand/30 shadow-2xl overflow-hidden mt-8 md:mt-16 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header/Input area */}
              <div className="relative p-6 border-b border-heritage-brown/10 flex items-center shrink-0">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-brown/40" />
                <input 
                  type="text"
                  placeholder="Search clans, leaders, oral histories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/50 border border-heritage-brown/10 rounded-2xl pl-12 pr-12 py-4 text-base text-heritage-brown placeholder-heritage-brown/40 focus:bg-white focus:border-heritage-terracotta focus:outline-none transition-all font-medium"
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-heritage-brown/40 hover:text-heritage-brown hover:scale-105 active:scale-95 transition-all p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter Pills (Visible when there is search text) */}
              {searchQuery.trim() !== '' && (
                <div className="px-6 py-3 border-b border-heritage-brown/10 bg-heritage-brown/5 flex gap-2 overflow-x-auto scrollbar-none shrink-0 select-none">
                  {[
                    { label: 'All', value: 'All' },
                    { label: 'Clans', value: 'Clan' },
                    { label: 'Leaders', value: 'Leader' },
                    { label: 'Timeline', value: 'History Timeline' },
                    { label: 'Oral', value: 'Oral History' },
                    { label: 'Articles', value: 'Article' }
                  ].map((cat) => {
                    const isSelected = selectedCategory === cat.value;
                    const count = cat.value === 'All'
                      ? rawFilteredResults.length
                      : rawFilteredResults.filter(item => item.category === cat.value).length;

                    return (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-heritage-brown text-white border-heritage-brown shadow-sm'
                            : 'bg-white hover:bg-heritage-brown/5 text-heritage-brown/70 border-heritage-brown/10'
                        }`}
                        id={`modal-category-${cat.value.replace(' ', '-')}`}
                      >
                        <span>{cat.label}</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-heritage-brown/10 text-heritage-brown/60'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Content area */}
              <div className="p-6 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-heritage-brown/10">
                {searchQuery.trim() === '' ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">Popular Searches</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {popularSearches.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleItemClick(item.path)}
                          className="flex items-center justify-between p-3.5 bg-white/50 hover:bg-white rounded-xl text-left border border-heritage-brown/5 text-sm text-heritage-brown hover:text-heritage-terracotta font-semibold hover:shadow-sm transition-all group animate-fade-in"
                        >
                          <span>{item.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-heritage-terracotta" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-heritage-brown/40">
                        Search Results ({filteredResults.length})
                      </h3>
                      <button 
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
                          setSearchQuery('');
                        }}
                        className="text-xs text-heritage-terracotta font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Advanced search <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    {filteredResults.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleItemClick(item.targetPath)}
                        className="flex items-start gap-4 p-4 bg-white hover:bg-heritage-terracotta/5 border border-heritage-brown/5 hover:border-heritage-terracotta/20 rounded-2xl cursor-pointer transition-all duration-200 group"
                      >
                        <div className="p-3 bg-heritage-cream rounded-xl group-hover:bg-white transition-colors shrink-0">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-heritage-cream border border-heritage-brown/5 text-heritage-brown/60">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-base font-serif font-bold text-heritage-brown group-hover:text-heritage-terracotta transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs font-semibold text-heritage-brown/80 mt-0.5">{item.subtitle}</p>
                          <p className="text-xs text-heritage-brown/50 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                        </div>
                        <div className="self-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-heritage-terracotta shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
                          setSearchQuery('');
                        }}
                        className="w-full py-3.5 bg-heritage-brown hover:bg-heritage-brown/95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow flex items-center justify-center gap-2"
                      >
                        <span>View All results on full-screen Search Page</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : rawFilteredResults.length > 0 ? (
                  <div className="text-center py-10">
                    <SlidersHorizontal className="w-10 h-10 text-heritage-brown/20 mx-auto mb-3" />
                    <p className="text-heritage-brown font-semibold">No results in category "{selectedCategory}"</p>
                    <p className="text-xs text-heritage-brown/40 mt-1 mb-4">But we found {rawFilteredResults.length} matching items in other categories!</p>
                    <button 
                      onClick={() => setSelectedCategory('All')}
                      className="px-4 py-2 bg-heritage-brown text-white hover:bg-heritage-brown/90 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Show All Categories
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Search className="w-10 h-10 text-heritage-brown/20 mx-auto mb-3 animate-bounce" />
                    <p className="text-heritage-brown font-semibold">No results found matching "{searchQuery}"</p>
                    <p className="text-xs text-heritage-brown/40 mt-1">Try searching for generic terms like "Baise", "elder", or "Kyoga".</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-heritage-brown/5 px-6 py-4 border-t border-heritage-brown/5 text-[10px] text-heritage-brown/40 font-bold uppercase tracking-widest flex justify-between items-center shrink-0">
                <span>Esc to Close</span>
                <span>Bakenyi Heritage Platform</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

