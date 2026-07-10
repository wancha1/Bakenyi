import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Globe, Search, Shield, User, Clock, BookOpen, Volume2, 
  ArrowRight, Sun, Moon, SlidersHorizontal, ChevronDown, LogOut, 
  LayoutDashboard, LogIn, FileText, Users, PenTool 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase, checkIsAdmin } from '../../lib/supabaseClient';
import { useTheme } from '../../context/ThemeContext';

const heritageItems = [
  { 
    name: 'History & Timeline', 
    desc: 'Journey through our migrations, Kyoga settlements, and oral accounts.', 
    path: '/history', 
    icon: Clock, 
    color: 'text-amber-600 bg-amber-500/10' 
  },
  { 
    name: 'Lukenye Language', 
    desc: 'Preserve the native dialect with interactive vocabulary and audio.', 
    path: '/language', 
    icon: BookOpen, 
    color: 'text-emerald-600 bg-emerald-500/10' 
  },
  { 
    name: 'Cultural Gallery', 
    desc: 'Explore historical photographs, ancient instruments, and archive documents.', 
    path: '/gallery', 
    icon: Globe, 
    color: 'text-blue-600 bg-blue-500/10' 
  },
  { 
    name: 'Heritage Articles', 
    desc: 'Read research publications, oral history narratives, and journals.', 
    path: '/articles', 
    icon: FileText, 
    color: 'text-heritage-terracotta bg-heritage-terracotta/10' 
  },
  { 
    name: 'Search Archives', 
    desc: 'Search across all clans, leaders, oral histories, and articles in real-time.', 
    path: '/search', 
    icon: Search, 
    color: 'text-purple-600 bg-purple-500/10' 
  },
];

const communityItems = [
  { 
    name: 'Clans & Lineages', 
    desc: 'Discover Bakenyi clans, ancestral lineages, and traditional totems.', 
    path: '/clans', 
    icon: Shield, 
    color: 'text-purple-600 bg-purple-500/10' 
  },
  { 
    name: 'Elders & Leaders', 
    desc: 'Meet our traditional guardians, community leaders, and elder storytellers.', 
    path: '/leadership', 
    icon: Users, 
    color: 'text-teal-600 bg-teal-500/10' 
  },
  { 
    name: 'Contribute Story', 
    desc: 'Share ancestral knowledge, oral history, or historical photographs.', 
    path: '/contribute', 
    icon: PenTool, 
    color: 'text-rose-600 bg-rose-500/10' 
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchDatabase, setSearchDatabase] = useState<any[]>([]);
  
  // Hover & Dropdown states
  const [activeMenu, setActiveMenu] = useState<'heritage' | 'community' | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Mobile Accordion states
  const [mobileHeritageOpen, setMobileHeritageOpen] = useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(false);

  // Auth states
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const heritageMenuRef = useRef<HTMLDivElement>(null);
  const communityMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { theme: appTheme, toggleTheme } = useTheme();
  const theme = appTheme === 'light' ? 'cream' : 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile and dropdown menus on route change
  useEffect(() => {
    setIsOpen(false);
    setActiveMenu(null);
    setIsProfileOpen(false);
    setMobileHeritageOpen(false);
    setMobileCommunityOpen(false);
  }, [location]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen to Supabase auth status
  useEffect(() => {
    const client = getSupabase();
    if (client) {
      client.auth.getSession().then(({ data: { session } }: any) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          checkIsAdmin(currentUser).then(setIsAdmin);
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          checkIsAdmin(currentUser).then(setIsAdmin);
        } else {
          setIsAdmin(false);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      // Sandbox fallback checking
      const stored = localStorage.getItem('bakenye_sandbox_session');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setUser(u);
          checkIsAdmin(u).then(setIsAdmin);
        } catch (e) {}
      }
    }
  }, []);

  // Handle Logout action
  const handleLogout = async () => {
    const client = getSupabase();
    if (client) {
      await client.auth.signOut();
    } else {
      localStorage.removeItem('bakenye_sandbox_session');
      setUser(null);
      setIsAdmin(false);
    }
    setIsProfileOpen(false);
    navigate('/');
  };

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
      
      // Load search database dynamically
      async function loadSearchData() {
        const client = getSupabase();
        if (!client) return;
        
        const items: any[] = [];
        try {
          const { data } = await client.from('articles').select('id, title, summary, content');
          if (data) {
            data.forEach((row: any) => {
              items.push({
                id: `article-${row.id}`,
                category: 'Article',
                title: row.title,
                subtitle: row.summary || 'Heritage Article',
                description: row.content || '',
                targetPath: `/articles/${row.id}`
              });
            });
          }
        } catch (e) {}

        try {
          const { data } = await client.from('clans').select('*');
          if (data) {
            data.forEach((row: any) => {
              items.push({
                id: `clan-${row.id || row.name}`,
                category: 'Clan',
                title: row.name,
                subtitle: row.totem || '',
                description: row.desc || row.motto || '',
                targetPath: `/clans?q=${row.name}`
              });
            });
          }
        } catch (e) {}

        try {
          const { data } = await client.from('leaders').select('*');
          if (data) {
            data.forEach((row: any) => {
              items.push({
                id: `leader-${row.id || row.name}`,
                category: 'Leader',
                title: row.name,
                subtitle: row.role || '',
                description: row.bio || row.expertise || '',
                targetPath: `/leadership?q=${row.name}`
              });
            });
          }
        } catch (e) {}

        setSearchDatabase(items);
      }
      
      if (searchDatabase.length === 0) {
        loadSearchData();
      }
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
          scrolled ? 'bg-heritage-cream/95 backdrop-blur-md shadow-md py-3 border-b border-heritage-brown/5' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Branding Logo */}
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <Globe className="w-8 h-8 text-heritage-terracotta" />
              <div className="flex flex-col">
                <span className="text-xl font-serif font-bold text-heritage-brown leading-tight tracking-tight">BAKENYI</span>
                <span className="text-[10px] font-sans font-semibold text-heritage-terracotta uppercase tracking-[0.2em] leading-none">Heritage Platform</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <div className="flex items-center space-x-1 lg:space-x-2 mr-4">
                {/* Home Link */}
                <Link 
                  to="/"
                  className={`relative px-3 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-heritage-brown/5 ${
                    location.pathname === '/' ? 'text-heritage-terracotta font-bold' : 'text-heritage-brown/80'
                  }`}
                >
                  Home
                </Link>

                {/* Heritage Dropdown */}
                <div 
                  className="relative"
                  ref={heritageMenuRef}
                  onMouseEnter={() => setActiveMenu('heritage')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-heritage-brown/5 cursor-pointer ${
                      ['/history', '/language', '/gallery', '/articles'].includes(location.pathname)
                        ? 'text-heritage-terracotta font-bold'
                        : 'text-heritage-brown/80'
                    }`}
                  >
                    <span>Discover Heritage</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-250 ${activeMenu === 'heritage' ? 'rotate-180 text-heritage-terracotta' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeMenu === 'heritage' && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-80 bg-heritage-cream rounded-2xl border border-heritage-brown/10 shadow-xl overflow-hidden p-3 z-50"
                      >
                        <div className="grid gap-1">
                          {heritageItems.map((subItem) => {
                            const IconComp = subItem.icon;
                            const isActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                  isActive ? 'bg-heritage-terracotta/5' : 'hover:bg-heritage-brown/5'
                                }`}
                              >
                                <div className={`p-2 rounded-lg shrink-0 ${subItem.color}`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className={`text-xs font-bold leading-none ${isActive ? 'text-heritage-terracotta' : 'text-heritage-brown'}`}>
                                    {subItem.name}
                                  </div>
                                  <p className="text-[10.5px] text-heritage-brown/50 mt-1 leading-normal font-medium">
                                    {subItem.desc}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Community Dropdown */}
                <div 
                  className="relative"
                  ref={communityMenuRef}
                  onMouseEnter={() => setActiveMenu('community')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-heritage-brown/5 cursor-pointer ${
                      ['/clans', '/leadership', '/contribute'].includes(location.pathname)
                        ? 'text-heritage-terracotta font-bold'
                        : 'text-heritage-brown/80'
                    }`}
                  >
                    <span>Community</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-250 ${activeMenu === 'community' ? 'rotate-180 text-heritage-terracotta' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeMenu === 'community' && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-80 bg-heritage-cream rounded-2xl border border-heritage-brown/10 shadow-xl overflow-hidden p-3 z-50"
                      >
                        <div className="grid gap-1">
                          {communityItems.map((subItem) => {
                            const IconComp = subItem.icon;
                            const isActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                  isActive ? 'bg-heritage-terracotta/5' : 'hover:bg-heritage-brown/5'
                                }`}
                              >
                                <div className={`p-2 rounded-lg shrink-0 ${subItem.color}`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className={`text-xs font-bold leading-none ${isActive ? 'text-heritage-terracotta' : 'text-heritage-brown'}`}>
                                    {subItem.name}
                                  </div>
                                  <p className="text-[10.5px] text-heritage-brown/50 mt-1 leading-normal font-medium">
                                    {subItem.desc}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* About Link */}
                <Link 
                  to="/about"
                  className={`relative px-3 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-heritage-brown/5 ${
                    location.pathname === '/about' ? 'text-heritage-terracotta font-bold' : 'text-heritage-brown/80'
                  }`}
                >
                  About
                </Link>

                {/* Contact Link */}
                <Link 
                  to="/contact"
                  className={`relative px-3 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-heritage-brown/5 ${
                    location.pathname === '/contact' ? 'text-heritage-terracotta font-bold' : 'text-heritage-brown/80'
                  }`}
                >
                  Contact
                </Link>

                {/* Admin Link (Directly visible if Administrator or Elder) */}
                {isAdmin && (
                  <Link 
                    to="/admin"
                    className={`relative px-3 py-2 text-sm font-semibold transition-all rounded-lg hover:bg-heritage-brown/5 text-amber-600 dark:text-amber-400 font-bold`}
                  >
                    Admin Panel
                  </Link>
                )}
              </div>

              {/* Action Utilities Group */}
              <div className="flex items-center space-x-2 pl-4 border-l border-heritage-brown/10">
                {/* Desktop Search Trigger */}
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-heritage-brown/5 hover:bg-heritage-brown/10 rounded-full border border-heritage-brown/10 text-heritage-brown/50 hover:text-heritage-brown/80 transition-all text-xs font-semibold cursor-pointer shrink-0"
                  title="Search (Cmd+K)"
                >
                  <Search className="w-3.5 h-3.5 text-heritage-brown/50" />
                  <span className="hidden lg:inline">Search...</span>
                  <kbd className="hidden lg:flex items-center gap-0.5 bg-heritage-brown/10 text-[9px] font-mono px-1.5 py-0.5 rounded text-heritage-brown/60 border border-heritage-brown/5 select-none leading-none">
                    ⌘K
                  </kbd>
                </button>

                {/* Theme Switcher */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 hover:bg-heritage-brown/5 rounded-full border border-heritage-brown/10 text-heritage-brown/70 hover:text-heritage-brown transition-all cursor-pointer shrink-0"
                  title={theme === 'cream' ? 'Switch to High-Contrast Dark' : 'Switch to Cream Theme'}
                >
                  {theme === 'cream' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-heritage-sand" />}
                </button>

                {/* Supabase User Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  {user ? (
                    <>
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-1.5 p-1 bg-heritage-terracotta/10 hover:bg-heritage-terracotta/15 rounded-full border border-heritage-terracotta/20 cursor-pointer shrink-0 transition-all focus:outline-none"
                        title="User Session options"
                      >
                        <div className="w-7 h-7 rounded-full bg-heritage-terracotta text-white font-bold flex items-center justify-center text-xs tracking-wider uppercase">
                          {user.email ? user.email.substring(0, 2) : 'A'}
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-heritage-brown/70 mr-1" />
                      </button>

                      <AnimatePresence>
                        {isProfileOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-64 bg-heritage-cream rounded-2xl border border-heritage-brown/10 shadow-xl overflow-hidden p-2 z-50"
                          >
                            <div className="p-3 border-b border-heritage-brown/5 mb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/40 block">Signed In As</span>
                              <span className="text-xs font-bold text-heritage-brown break-all">{user.email}</span>
                              {isAdmin && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 rounded">
                                  ADMIN ACCESS
                                </span>
                              )}
                            </div>

                            {isAdmin && (
                              <Link
                                to="/admin"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-heritage-brown hover:bg-heritage-brown/5 transition-all"
                              >
                                <LayoutDashboard className="w-4 h-4 text-heritage-terracotta" />
                                <span>Admin Dashboard</span>
                              </Link>
                            )}

                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-left cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out Session</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 rounded-full text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Actions Toolbar */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-heritage-brown hover:text-heritage-terracotta focus:outline-none p-1.5 rounded-full hover:bg-heritage-brown/5 transition-all"
                aria-label="Open Search"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="text-heritage-brown hover:text-heritage-terracotta focus:outline-none p-1.5 rounded-full hover:bg-heritage-brown/5 transition-all cursor-pointer"
                aria-label="Toggle Theme"
              >
                {theme === 'cream' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-heritage-sand" />}
              </button>

              {/* Collapsible Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-heritage-brown hover:text-heritage-terracotta focus:outline-none p-1.5"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 bg-heritage-cream border-b border-heritage-brown/10 shadow-xl overflow-hidden z-40 max-h-[85vh] overflow-y-auto"
            >
              <div className="px-4 pt-3 pb-8 space-y-2">
                {/* Home Link */}
                <Link
                  to="/"
                  className={`block px-3 py-3 text-sm font-bold border-b border-heritage-brown/5 ${
                    location.pathname === '/' ? 'text-heritage-terracotta bg-heritage-terracotta/5 rounded-lg' : 'text-heritage-brown/80'
                  }`}
                >
                  Home
                </Link>

                {/* Heritage Group (Collapsible) */}
                <div className="border-b border-heritage-brown/5">
                  <button
                    onClick={() => setMobileHeritageOpen(!mobileHeritageOpen)}
                    className="w-full flex justify-between items-center px-3 py-3 text-sm font-bold text-heritage-brown/80 cursor-pointer"
                  >
                    <span>Discover Heritage</span>
                    <ChevronDown className={`w-4 h-4 text-heritage-brown/60 transition-transform ${mobileHeritageOpen ? 'rotate-180 text-heritage-terracotta' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {mobileHeritageOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-heritage-brown/5 rounded-lg my-1 px-2 py-1 space-y-1"
                      >
                        {heritageItems.map((subItem) => {
                          const IconComp = subItem.icon;
                          const isActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                                isActive ? 'text-heritage-terracotta bg-heritage-terracotta/5 font-bold' : 'text-heritage-brown/70'
                              }`}
                            >
                              <IconComp className="w-4 h-4 shrink-0 opacity-80" />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Community Group (Collapsible) */}
                <div className="border-b border-heritage-brown/5">
                  <button
                    onClick={() => setMobileCommunityOpen(!mobileCommunityOpen)}
                    className="w-full flex justify-between items-center px-3 py-3 text-sm font-bold text-heritage-brown/80 cursor-pointer"
                  >
                    <span>Community Links</span>
                    <ChevronDown className={`w-4 h-4 text-heritage-brown/60 transition-transform ${mobileCommunityOpen ? 'rotate-180 text-heritage-terracotta' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {mobileCommunityOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-heritage-brown/5 rounded-lg my-1 px-2 py-1 space-y-1"
                      >
                        {communityItems.map((subItem) => {
                          const IconComp = subItem.icon;
                          const isActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                                isActive ? 'text-heritage-terracotta bg-heritage-terracotta/5 font-bold' : 'text-heritage-brown/70'
                              }`}
                            >
                              <IconComp className="w-4 h-4 shrink-0 opacity-80" />
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* About Link */}
                <Link
                  to="/about"
                  className={`block px-3 py-3 text-sm font-bold border-b border-heritage-brown/5 ${
                    location.pathname === '/about' ? 'text-heritage-terracotta bg-heritage-terracotta/5 rounded-lg' : 'text-heritage-brown/80'
                  }`}
                >
                  About
                </Link>

                {/* Contact Link */}
                <Link
                  to="/contact"
                  className={`block px-3 py-3 text-sm font-bold border-b border-heritage-brown/5 ${
                    location.pathname === '/contact' ? 'text-heritage-terracotta bg-heritage-terracotta/5 rounded-lg' : 'text-heritage-brown/80'
                  }`}
                >
                  Contact
                </Link>

                {/* Mobile Auth Actions Box */}
                <div className="pt-4 mt-4 border-t border-heritage-brown/10">
                  {user ? (
                    <div className="bg-heritage-brown/5 p-4 rounded-xl space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-heritage-terracotta text-white font-bold flex items-center justify-center text-sm uppercase">
                          {user.email ? user.email.substring(0, 2) : 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-heritage-brown truncate">{user.email}</p>
                          <p className="text-[10px] font-black uppercase tracking-wider text-heritage-terracotta mt-0.5">Active Session</p>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center justify-center gap-2 py-2.5 bg-heritage-brown text-white rounded-lg text-xs font-bold transition-all"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out Session</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-heritage-terracotta text-white rounded-xl text-sm font-bold shadow-sm"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In Account</span>
                    </Link>
                  )}
                </div>
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

              {/* Category Filter Pills */}
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
