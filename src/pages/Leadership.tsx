import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Mail, 
  Linkedin, 
  User, 
  ShieldCheck, 
  Award, 
  Users, 
  Search, 
  MessageSquare, 
  Send, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { getLeaders, Leader, getElderQuestions, submitElderQuestion, ElderQuestion } from '../lib/supabase';
import SEO from '../components/SEO';

export default function Leadership() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-tabs state: 'custodians' | 'qna'
  const [activeTab, setActiveTab] = useState<'custodians' | 'qna'>('custodians');

  // Q&A States
  const [questions, setQuestions] = useState<ElderQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [qnaFilter, setQnaFilter] = useState<string>('All');
  const [qnaSearch, setQnaSearch] = useState<string>('');

  // Ask Question Form States
  const [askerName, setAskerName] = useState('');
  const [askerEmail, setAskerEmail] = useState('');
  const [askerCategory, setAskerCategory] = useState('History');
  const [askerQuestion, setAskerQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    async function fetchLeaders() {
      setLoading(true);
      try {
        const data = await getLeaders(true); // fetch approved leaders
        setLeaders(data);
      } catch (e) {
        console.error('Leadership: failed to fetch leaders:', e);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaders();
  }, []);

  // Fetch approved questions
  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const data = await getElderQuestions(true); // true = only answered questions for public view
      setQuestions(data);
    } catch (e) {
      console.error('Failed to load elder questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'qna') {
      loadQuestions();
    }
  }, [activeTab]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askerName || !askerEmail || !askerQuestion) {
      setSubmitError('Please complete all fields before sending.');
      return;
    }

    setSubmittingQuestion(true);
    setSubmitError('');
    try {
      const { error } = await submitElderQuestion({
        name: askerName,
        email: askerEmail,
        category: askerCategory,
        question: askerQuestion
      });

      if (error) throw error;

      setSubmitSuccess(true);
      setAskerName('');
      setAskerEmail('');
      setAskerQuestion('');
      // Reload questions in case they are instant or local
      loadQuestions();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit question. Please try again.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const filteredLeaders = leaders.filter(leader => 
    (leader.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (leader.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (leader.expertise || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (leader.clan || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = qnaFilter === 'All' || q.category.toLowerCase() === qnaFilter.toLowerCase();
    const matchesSearch = qnaSearch === '' || 
      q.question.toLowerCase().includes(qnaSearch.toLowerCase()) ||
      (q.answer || '').toLowerCase().includes(qnaSearch.toLowerCase()) ||
      q.name.toLowerCase().includes(qnaSearch.toLowerCase()) ||
      (q.answered_by || '').toLowerCase().includes(qnaSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesList = ['All', 'History', 'Traditions', 'Language', 'Social Laws'];

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      <SEO 
        title="Community Custodians & Elder Council"
        description="Meet the honourable Elders, spiritual guardians, and story keepers of the Bakenye community preserving our cultural laws and knowledge."
        keywords="Elders, leadership, chief historians, community guardians, Bakenye council, consult an elder, Q&A"
      />
      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-stone-950 via-stone-900 to-[#2c1d11] py-24 px-4 overflow-hidden border-b border-stone-800/60 text-center">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-heritage-terracotta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-black text-white mb-6 tracking-tight leading-tight"
          >
            Custodians of Culture
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-sm md:text-base font-black tracking-widest uppercase mb-10">
            {activeTab === 'custodians' 
              ? 'The committee dedicated to steering the Bakenyi Heritage Platform.' 
              : 'Submit questions about Bakenyi history, customs, or clans for Elder response.'}
          </p>

          {activeTab === 'custodians' ? (
            /* Search Bar for Custodians */
            <div className="relative max-w-xl mx-auto shadow-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search elders by name, role, expertise..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white dark:bg-stone-900 border border-stone-200/10 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-stone-900 dark:text-white transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          ) : (
            /* Search Bar for Q&As */
            <div className="relative max-w-xl mx-auto shadow-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search answered questions or topics..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white dark:bg-stone-900 border border-stone-200/10 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-stone-900 dark:text-white transition-all font-medium text-sm"
                value={qnaSearch}
                onChange={(e) => setQnaSearch(e.target.value)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Tabs Selector */}
      <div className="flex justify-center pt-16 pb-4 px-4">
        <div className="inline-flex bg-white/85 dark:bg-stone-900/95 p-1.5 rounded-2xl border border-heritage-brown/10 shadow-xs max-w-full overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('custodians')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'custodians'
                ? 'bg-heritage-terracotta text-white shadow-sm'
                : 'text-heritage-brown hover:text-heritage-terracotta'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Council Custodians</span>
          </button>
          <button
            onClick={() => setActiveTab('qna')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'qna'
                ? 'bg-heritage-terracotta text-white shadow-sm'
                : 'text-heritage-brown hover:text-heritage-terracotta'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consult an Elder Q&A</span>
          </button>
        </div>
      </div>

      {activeTab === 'custodians' ? (
        /* ======================================================================
           CUSTODIANS VIEW
           ====================================================================== */
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-12 h-12">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-heritage-terracotta/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-t-heritage-terracotta border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-xs font-bold text-heritage-brown/60 tracking-wider uppercase animate-pulse">
                  Summoning the Bakenyi elders...
                </p>
              </div>
            ) : leaders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-heritage-brown/10 max-w-3xl mx-auto px-6">
                <Users className="w-16 h-16 text-heritage-brown/20 mx-auto mb-6" />
                <h3 className="text-xl font-serif font-bold text-heritage-brown mb-2">No cultural leaders found</h3>
                <p className="text-sm text-heritage-brown/50 max-w-md mx-auto">
                  No verified cultural council custodians have been registered to the platform.
                </p>
              </div>
            ) : filteredLeaders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-heritage-brown/10 max-w-3xl mx-auto px-6">
                <Search className="w-16 h-16 text-heritage-brown/20 mx-auto mb-6" />
                <h3 className="text-xl font-serif font-bold text-heritage-brown mb-2">No matches found</h3>
                <p className="text-sm text-heritage-brown/50 max-w-md mx-auto mb-4">
                  No verified elders matched your search query "{searchTerm}".
                </p>
                <button 
                  onClick={() => handleSearchChange('')}
                  className="text-heritage-terracotta font-bold text-xs uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredLeaders.map((leader, i) => {
                  const isHighlighted = query !== '' && (leader.name || '').toLowerCase().includes(query.toLowerCase());
                  return (
                    <motion.div
                      key={leader.id || i}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`heritage-card flex flex-col items-center p-8 bg-white relative transition-all duration-500 ${
                        isHighlighted ? 'ring-4 ring-heritage-terracotta border-heritage-terracotta shadow-2xl scale-105 z-10' : ''
                      }`}
                    >
                      {isHighlighted && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-heritage-terracotta text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-bounce">
                          Search Match
                        </span>
                      )}
                      <div className="w-32 h-32 rounded-full bg-heritage-cream mb-6 overflow-hidden flex items-center justify-center border-4 border-heritage-terracotta/20 shrink-0">
                        {leader.photo_url || leader.imageUrl ? (
                          <img 
                            src={leader.photo_url || leader.imageUrl} 
                            alt={leader.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-16 h-16 text-heritage-brown/20" />
                        )}
                      </div>
                      <h3 className="text-xl font-serif font-bold text-heritage-brown text-center mb-1">{leader.name}</h3>
                      <p className="text-heritage-terracotta text-xs font-bold uppercase tracking-widest mb-4 text-center">{leader.role || 'Committee Member'}</p>
                      <p className="text-heritage-brown/60 text-sm text-center mb-6 leading-relaxed flex-grow font-medium">
                        {leader.bio || 'Verifying authentic oral narratives and supervising digital language programs.'}
                      </p>
                      <div className="w-full pt-4 border-t border-heritage-brown/5 flex flex-col items-center">
                        <div className="flex items-center text-heritage-olive text-[10px] font-bold uppercase tracking-wider mb-3">
                          <Award className="w-3 h-3 mr-1" />
                          {leader.expertise || 'Cultural Custodian'}
                        </div>
                        
                        {leader.clan && (
                          <div className="text-[10px] text-heritage-brown/40 font-bold uppercase tracking-wider mb-3">
                            Clan: {leader.clan}
                          </div>
                        )}

                        <Link 
                          to={`/leadership/${leader.id}`}
                          className="w-full py-2 px-4 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white rounded-xl text-xs font-bold text-center transition-all duration-200 mb-4 hover:shadow-md block"
                        >
                          Explore Chronicle
                        </Link>

                        <div className="flex space-x-3">
                          {leader.contact_email ? (
                            <a 
                              href={`mailto:${leader.contact_email}`}
                              className="p-2 rounded-full bg-heritage-cream text-heritage-brown hover:bg-heritage-terracotta hover:text-white transition-colors cursor-pointer"
                              title={`Email ${leader.name}`}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          ) : (
                            <button 
                              disabled 
                              className="p-2 rounded-full bg-heritage-cream text-heritage-brown/20 cursor-not-allowed"
                              title="No email registered"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-2 rounded-full bg-heritage-cream text-heritage-brown hover:bg-heritage-terracotta hover:text-white transition-colors cursor-pointer">
                            <Linkedin className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ======================================================================
           CONSULT AN ELDER Q&A VIEW
           ====================================================================== */
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Form Panel: Ask Question */}
              <div className="lg:col-span-5 bg-white p-8 rounded-[32px] border border-heritage-brown/10 shadow-xs sticky top-32">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-heritage-terracotta/10 text-heritage-terracotta rounded-xl">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-heritage-brown">Consult Bakenyi Elders</h3>
                    <p className="text-xs text-heritage-brown/40 font-bold uppercase tracking-wider">Direct Q&A Gateway</p>
                  </div>
                </div>

                <p className="text-heritage-brown/70 text-xs leading-relaxed mb-6 font-medium">
                  The Elder Council welcomes inquiries on lineages, historical migrations, vocabulary, and sacred traditions. Your question will be vetted, archived, and replied to by verified custodians.
                </p>

                {submitSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-150 p-6 rounded-2xl text-center"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3 animate-bounce" />
                    <h4 className="text-emerald-900 font-serif font-bold text-lg mb-2">Question Submitted!</h4>
                    <p className="text-emerald-700 text-xs leading-relaxed font-medium mb-4">
                      Your inquiry has been queued in the Elder Council registry. Once approved and answered by a council historian, it will be published in this portal.
                    </p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Ask Another Question
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleAskSubmit} className="space-y-4">
                    {submitError && (
                      <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/60 mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Waiswa Aaron"
                        required
                        value={askerName}
                        onChange={(e) => setAskerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-heritage-cream/40 border border-heritage-brown/15 focus:outline-none focus:border-heritage-terracotta text-xs font-medium text-heritage-ink"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/60 mb-1.5">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. user@domain.com"
                        required
                        value={askerEmail}
                        onChange={(e) => setAskerEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-heritage-cream/40 border border-heritage-brown/15 focus:outline-none focus:border-heritage-terracotta text-xs font-medium text-heritage-ink"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/60 mb-1.5">
                        Inquiry Category
                      </label>
                      <select
                        value={askerCategory}
                        onChange={(e) => setAskerCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-heritage-cream/40 border border-heritage-brown/15 focus:outline-none focus:border-heritage-terracotta text-xs font-bold text-heritage-ink"
                      >
                        <option value="History">History & Origins</option>
                        <option value="Traditions">Traditions & Totems</option>
                        <option value="Language">Lukenye Language</option>
                        <option value="Social Laws">Social Laws & Customs</option>
                        <option value="General">General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-heritage-brown/60 mb-1.5">
                        Your Question
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Write your question about Bakenyi heritage here with as much context as possible..."
                        required
                        maxLength={1000}
                        value={askerQuestion}
                        onChange={(e) => setAskerQuestion(e.target.value)}
                        className="w-full p-4 rounded-xl bg-heritage-cream/40 border border-heritage-brown/15 focus:outline-none focus:border-heritage-terracotta text-xs font-medium text-heritage-ink leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuestion}
                      className="w-full py-3.5 bg-heritage-terracotta hover:bg-heritage-terracotta/95 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {submittingQuestion ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Consulting Registry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Question to Elders</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Panel: Answered Q&As Feed */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Q&A Categories Quick Filter */}
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setQnaFilter(cat)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                        qnaFilter === cat
                          ? 'bg-heritage-olive text-white border-heritage-olive shadow-xs'
                          : 'bg-white text-heritage-brown border-heritage-brown/10 hover:border-heritage-brown/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {loadingQuestions ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-heritage-brown/10">
                    <div className="w-10 h-10 border-4 border-heritage-terracotta/20 border-t-heritage-terracotta rounded-full animate-spin" />
                    <p className="mt-4 text-xs font-bold text-heritage-brown/40 uppercase tracking-widest animate-pulse">
                      Consulting elder archives...
                    </p>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="bg-white rounded-[32px] border-2 border-dashed border-heritage-brown/10 p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-heritage-brown/20 mx-auto mb-4" />
                    <h4 className="text-lg font-serif font-bold text-heritage-brown mb-1">No Q&As matching filters</h4>
                    <p className="text-xs text-heritage-brown/50 max-w-sm mx-auto">
                      There are no answered questions matching your search "{qnaSearch}" or category "{qnaFilter}". Be the first to ask!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredQuestions.map((q, i) => (
                      <motion.div
                        key={q.id || i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-3xl border border-heritage-brown/10 overflow-hidden shadow-xs hover:shadow-sm transition-all"
                      >
                        {/* Question Top Section */}
                        <div className="p-6 md:p-8 border-b border-heritage-brown/5">
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-heritage-cream text-heritage-terracotta text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-heritage-brown/5">
                              {q.category}
                            </span>
                            <div className="flex items-center text-heritage-brown/40 text-[10px] font-bold uppercase tracking-wider gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(q.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>

                          <h4 className="text-md md:text-lg font-serif font-bold text-heritage-brown leading-snug">
                            "{q.question}"
                          </h4>
                          <p className="text-[10px] text-heritage-brown/50 font-bold uppercase tracking-wider mt-3">
                            Inquired by: <span className="text-heritage-brown">{q.name}</span>
                          </p>
                        </div>

                        {/* Elder Response Section */}
                        <div className="p-6 md:p-8 bg-[#faf7f3] border-l-4 border-heritage-terracotta">
                          <div className="flex items-center space-x-2 text-heritage-terracotta text-[10px] font-black uppercase tracking-wider mb-3">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verified Elder Council Decree</span>
                          </div>

                          <p className="text-heritage-brown/80 text-xs md:text-sm font-serif italic leading-relaxed mb-4">
                            {q.answer}
                          </p>

                          <div className="flex items-center justify-between border-t border-heritage-brown/5 pt-4 mt-2">
                            <div className="text-[10px] text-heritage-brown/50 font-black uppercase tracking-wider">
                              Spoken by: <span className="text-heritage-terracotta">{q.answered_by || 'Elder Council Custodian'}</span>
                            </div>
                            {q.answered_at && (
                              <span className="text-[9px] font-mono text-heritage-brown/30">
                                Ref: #{q.id.slice(0, 8).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          </div>
        </section>
      )}

      {/* Organizational Structure */}
      <section className="py-24 bg-white px-4 border-t border-heritage-brown/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-heritage-terracotta font-bold text-xs uppercase tracking-widest block mb-4">Our Structure</span>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-8">Committed to Transparency and Heritage</h2>
              <p className="text-heritage-brown/70 text-lg leading-relaxed mb-8">
                The Platform is governed by a multi-disciplinary committee including elders, academics, and community organizers. We ensure that every piece of documentation is verified for accuracy against known oral and written records.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-heritage-brown font-medium">Verified Oral Research</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-heritage-brown font-medium">Community-Led Governance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-heritage-brown font-medium">Youth Mentorship Programs</span>
                </div>
              </div>
            </div>
            <div className="bg-heritage-cream p-12 rounded-3xl relative">
              <div className="absolute inset-0 cultural-pattern opacity-10" />
              <div className="relative z-10 text-center">
                <p className="text-lg text-heritage-brown/80 font-serif italic mb-8">
                  "Leadership in Bakenyi culture has always been about service to the collective, ensuring that the legacy of those who walked before us is carried with dignity by those who come after us."
                </p>
                <div className="w-12 h-1 bg-heritage-terracotta mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-heritage-brown">Cultural Council Manifesto</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
