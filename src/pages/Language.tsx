import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Book, MessageSquare, Headphones, Pause, Play, Music, AlertCircle, Plus, Check, X, ShieldAlert, FileAudio, Loader2 } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import { getVocabulary, createVocabulary, updateVocabularyStatus, Vocabulary } from '../lib/supabase';

export default function Language() {
  const [playingId, setPlayingId] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phrases, setPhrases] = useState<Vocabulary[]>([]);
  const [counts, setCounts] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication & Roles
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewList, setReviewList] = useState<Vocabulary[]>([]);
  const [submittingPhrase, setSubmittingPhrase] = useState(false);

  // Form State
  const [newPhrase, setNewPhrase] = useState({
    lukenye: '',
    english: '',
    category: 'phrase',
    usage: 'conversational',
    example_sentence: '',
    audio_url: ''
  });

  const supabase = getSupabase();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        checkUserAdmin(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        checkUserAdmin(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkUserAdmin = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('profiles').select('role, is_admin').eq('id', userId).single();
      if (data && (data.role === 'super_admin' || data.role === 'admin' || data.is_admin)) {
        setIsAdmin(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVocabularyList = async () => {
    setLoading(true);
    try {
      const allVocab = await getVocabulary(true); // Only approved
      const numbersList = allVocab.filter(item => item.category === 'number' || item.usage?.toLowerCase() === 'number');
      const commonList = allVocab.filter(item => item.category !== 'number' && item.usage?.toLowerCase() !== 'number');
      
      setPhrases(commonList);
      setCounts(numbersList);
    } catch (e) {
      console.error('Language: failed to fetch vocabulary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabularyList();
  }, []);

  const handlePlay = (id: any, audioUrl?: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      return;
    }

    const soundUrl = audioUrl || "https://www.soundjay.com/button/button-1.mp3";
    
    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.play().catch(err => console.log("Audio play error:", err));
    }
    
    setPlayingId(id);
  };

  const onAudioEnded = () => {
    setPlayingId(null);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPhrase(true);

    try {
      const { error } = await createVocabulary({
        lukenye: newPhrase.lukenye,
        english: newPhrase.english,
        category: newPhrase.category,
        usage: newPhrase.usage,
        audio_url: newPhrase.audio_url || 'https://www.soundjay.com/button/button-3.mp3',
        example_sentence: newPhrase.example_sentence,
        status: 'pending'
      });

      if (error) throw error;
      alert("Phrase successfully submitted for verification! Thank you for preserving Lukenye.");
      setShowRecordModal(false);
      setNewPhrase({
        lukenye: '',
        english: '',
        category: 'phrase',
        usage: 'conversational',
        example_sentence: '',
        audio_url: ''
      });
      fetchVocabularyList();
    } catch (err: any) {
      alert(err.message || "Failed to submit phrase.");
    } finally {
      setSubmittingPhrase(false);
    }
  };

  const handleOpenReview = async () => {
    // Fetch all pending vocabulary items for approval
    const allPending = await getVocabulary(false); // get ALL including unapproved
    const pendingList = allPending.filter(item => item.status === 'pending');
    setReviewList(pendingList);
    setShowReviewModal(true);
  };

  const handleApprove = async (vocabId: string) => {
    const success = await updateVocabularyStatus(vocabId, 'approved');
    if (success) {
      setReviewList(prev => prev.filter(p => p.id !== vocabId));
      fetchVocabularyList();
    }
  };

  const handleReject = async (vocabId: string) => {
    const success = await updateVocabularyStatus(vocabId, 'rejected');
    if (success) {
      setReviewList(prev => prev.filter(p => p.id !== vocabId));
      fetchVocabularyList();
    }
  };


  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={onAudioEnded} 
        className="hidden" 
      />

      {/* Page Header */}
      <section className="bg-heritage-brown py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            The Lukenye Language
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            Preserving the rhythmic voice of our ancestors.
          </p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="inline-flex items-center space-x-2 text-heritage-terracotta font-bold text-xs uppercase tracking-widest mb-4">
            <Book className="w-4 h-4" />
            <span>Linguistic Heritage</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-heritage-brown mb-8 leading-tight">
            Why Lukenye Matters
          </h2>
          <p className="text-lg text-heritage-brown/70 leading-relaxed text-center mb-8">
            Lukenye is a unique Bantu language spoken by the Bakenyi people. It shares similarities with neighboring languages like Lusoga and Lugwere but retains distinct phonetic patterns and vocabulary specifically related to riverine and lacustrine (lake-based) life.
          </p>
          <div className="flex justify-center space-x-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-heritage-brown">~50k</span>
              <span className="text-xs text-heritage-brown/40 uppercase font-bold tracking-tighter">Native Speakers</span>
            </div>
            <div className="w-px h-10 bg-heritage-brown/10" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-heritage-brown">4+</span>
              <span className="text-xs text-heritage-brown/40 uppercase font-bold tracking-tighter">Major Regions</span>
            </div>
          </div>
        </div>

        {/* Phrases Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-heritage-brown/10 max-w-3xl mx-auto">
              <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-heritage-terracotta/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-heritage-terracotta border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-xs font-bold text-heritage-brown/60 tracking-wider uppercase animate-pulse">
                Accessing Bakenyi Linguistic registers...
              </p>
            </div>
          ) : phrases.length === 0 && counts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-heritage-brown/10 max-w-3xl mx-auto px-6 shadow-sm">
              <Volume2 className="w-16 h-16 text-heritage-brown/20 mx-auto mb-6" />
              <h3 className="text-xl font-serif font-bold text-heritage-brown mb-2">No phrases have been added to the glossary yet</h3>
              <p className="text-sm text-heritage-brown/50 max-w-md mx-auto">
                Linguistic entries are currently being authenticated by our cultural council. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Common Phrases */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-heritage-brown/5"
              >
                <h3 className="text-3xl font-serif font-bold text-heritage-brown mb-10 flex items-center">
                  <MessageSquare className="w-8 h-8 mr-4 text-heritage-terracotta" />
                  Common Phrases
                </h3>
                {phrases.length === 0 ? (
                  <p className="text-sm text-heritage-brown/40 italic">No common conversational phrases published yet.</p>
                ) : (
                  <div className="space-y-4">
                    {phrases.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-5 bg-heritage-cream/30 rounded-2xl hover:bg-heritage-cream/60 transition-all group">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {playingId === p.id && (
                              <motion.div 
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1.2, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="absolute inset-0 bg-heritage-terracotta rounded-full"
                              />
                            )}
                            <button 
                              onClick={() => handlePlay(p.id, p.audio_url)}
                              className={`relative z-10 p-3 rounded-full transition-all duration-300 ${
                                playingId === p.id 
                                ? 'bg-heritage-terracotta text-white' 
                                : 'bg-white text-heritage-brown group-hover:bg-heritage-brown group-hover:text-white shadow-sm cursor-pointer'
                              }`}
                            >
                              {playingId === p.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                          </div>
                          <div>
                            <h4 className="font-bold text-heritage-brown text-lg">{p.lukenye}</h4>
                            <p className="text-sm text-heritage-brown/50">{p.english}</p>
                          </div>
                        </div>
                        {p.usage && (
                          <span className="hidden md:block text-[10px] uppercase font-black text-heritage-brown/20 tracking-[0.2em]">
                            {p.usage}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Numbers & Tips */}
              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-heritage-olive p-12 rounded-[40px] text-white relative overflow-hidden shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 cultural-pattern opacity-10" />
                  <h3 className="text-2xl font-serif font-bold mb-8 relative z-10 flex items-center">
                    <Music className="w-6 h-6 mr-3 text-heritage-sand" />
                    Counting in Lukenye
                  </h3>
                  {counts.length === 0 ? (
                    <p className="text-sm text-white/50 italic">No counting systems published yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 relative z-10">
                      {counts.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-4 border-b border-white/10 hover:bg-white/5 transition-colors px-2 rounded-lg group">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handlePlay(c.id, c.audio_url)}
                              className={`p-2 rounded-full transition-all cursor-pointer ${
                                playingId === c.id ? 'bg-white text-heritage-olive' : 'text-white/40 hover:text-white'
                              }`}
                            >
                              {playingId === c.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>
                            <span className="font-bold text-xl">{c.lukenye}</span>
                          </div>
                          <span className="text-white/60 text-xs font-black uppercase tracking-widest">{c.english}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-12 rounded-[40px] border border-heritage-brown/5 shadow-sm"
                >
                  <h3 className="text-2xl font-serif font-bold text-heritage-brown mb-8 flex items-center">
                    <Headphones className="w-6 h-6 mr-3 text-heritage-terracotta" />
                    Pronunciation Tool
                  </h3>
                  <div className="space-y-8">
                    <div className="flex items-start space-x-5">
                      <div className="w-10 h-10 rounded-2xl bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 font-black text-sm border border-heritage-terracotta/20">A</div>
                      <p className="text-heritage-brown/70 text-sm leading-relaxed">Vowels are generally 'pure' (like in Italian or Spanish). 'A' is always like 'father'.</p>
                    </div>
                    <div className="flex items-start space-x-5">
                      <div className="w-10 h-10 rounded-2xl bg-heritage-terracotta/10 text-heritage-terracotta flex items-center justify-center shrink-0 font-black text-sm border border-heritage-terracotta/20">DH</div>
                      <p className="text-heritage-brown/70 text-sm leading-relaxed">The 'DH' sound is similar to the English 'th' in 'there', often found in words like 'Amadhi' (water).</p>
                    </div>
                    
                    {/* Interactive Player Placeholder */}
                    <div className="p-8 bg-heritage-cream/30 rounded-[30px] border border-heritage-brown/5 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center text-left">
                        <div className="w-14 h-14 rounded-full bg-heritage-olive flex items-center justify-center text-white mr-4 shadow-lg shadow-heritage-olive/20">
                          <Volume2 className="w-7 h-7" />
                        </div>
                        <div>
                          <h5 className="font-bold text-heritage-brown">Voice Archive</h5>
                          <p className="text-xs text-heritage-brown/50 leading-relaxed">Click any phrase above to hear recordings from native speakers.</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                         <div className="w-1 h-8 bg-heritage-olive/20 rounded-full animate-pulse" />
                         <div className="w-1 h-12 bg-heritage-olive/40 rounded-full animate-pulse delay-75" />
                         <div className="w-1 h-6 bg-heritage-olive/20 rounded-full animate-pulse delay-150" />
                         <div className="w-1 h-10 bg-heritage-olive/40 rounded-full animate-pulse delay-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Educational Footer */}
      <section className="py-24 bg-heritage-brown text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-8">Contribute to the Glossary</h2>
          <p className="text-heritage-cream/60 text-lg leading-relaxed mb-12">
            Are you a fluent Lukenye speaker? Help us build the first complete digital dictionary for the Bakenyi people. Your recorded voice can help future generations learn our tongue correctly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              onClick={() => setShowRecordModal(true)}
              className="btn-primary !bg-heritage-sand !text-heritage-brown hover:!bg-white px-10 py-4 uppercase font-black tracking-widest text-xs cursor-pointer"
            >
              Record Phrases
            </button>
            <button 
              onClick={handleOpenReview}
              className="btn-secondary !text-white !border-white/20 hover:!border-white px-10 py-4 uppercase font-black tracking-widest text-xs cursor-pointer"
            >
              Review Glossary
            </button>
          </div>
        </div>
      </section>

      {/* Record Phrases Modal */}
      <AnimatePresence>
        {showRecordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full relative shadow-2xl border border-heritage-brown/10 text-left"
            >
              <button 
                onClick={() => setShowRecordModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-heritage-cream/50 text-heritage-brown/50 hover:text-heritage-brown transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-heritage-terracotta/10 rounded-2xl">
                  <Volume2 className="w-6 h-6 text-heritage-terracotta" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-heritage-brown">Record & Propose Phrase</h3>
                  <p className="text-xs text-heritage-brown/50">Submit a Lukenye phrase for verification</p>
                </div>
              </div>

              <form onSubmit={handleRecordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-heritage-brown/60">Lukenye Spelling</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Amadhi gasinga omuliro"
                    value={newPhrase.lukenye}
                    onChange={e => setNewPhrase({...newPhrase, lukenye: e.target.value})}
                    className="w-full px-4 py-3 bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl outline-none text-heritage-brown font-semibold focus:border-heritage-terracotta transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-heritage-brown/60">English Translation</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Water is stronger than fire"
                    value={newPhrase.english}
                    onChange={e => setNewPhrase({...newPhrase, english: e.target.value})}
                    className="w-full px-4 py-3 bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl outline-none text-heritage-brown font-semibold focus:border-heritage-terracotta transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-heritage-brown/60">Category</label>
                    <select 
                      value={newPhrase.category}
                      onChange={e => setNewPhrase({...newPhrase, category: e.target.value})}
                      className="w-full px-4 py-3 bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl outline-none text-heritage-brown font-semibold focus:border-heritage-terracotta transition-colors"
                    >
                      <option value="phrase">Phrase</option>
                      <option value="number">Number / Counting</option>
                      <option value="idiom">Proverb / Sayings</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-heritage-brown/60">Usage</label>
                    <input 
                      type="text"
                      placeholder="e.g. Greetings"
                      value={newPhrase.usage}
                      onChange={e => setNewPhrase({...newPhrase, usage: e.target.value})}
                      className="w-full px-4 py-3 bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl outline-none text-heritage-brown font-semibold focus:border-heritage-terracotta transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-heritage-brown/60">Example Sentence</label>
                  <textarea 
                    rows={2}
                    placeholder="Provide a sentence demonstrating how this is used..."
                    value={newPhrase.example_sentence}
                    onChange={e => setNewPhrase({...newPhrase, example_sentence: e.target.value})}
                    className="w-full px-4 py-3 bg-heritage-cream/30 border border-heritage-brown/10 rounded-xl outline-none text-heritage-brown font-semibold focus:border-heritage-terracotta transition-colors resize-none"
                  />
                </div>

                <div className="p-4 bg-heritage-cream/50 rounded-2xl border border-dashed border-heritage-brown/20 text-center">
                  <p className="text-xs font-bold text-heritage-brown mb-2 uppercase tracking-widest">Audio Pronunciation</p>
                  <div className="flex items-center justify-center space-x-3">
                    <button 
                      type="button" 
                      className="p-3 rounded-full bg-heritage-terracotta text-white flex items-center justify-center shadow-md shadow-heritage-terracotta/20 hover:scale-105 transition-transform"
                      onClick={() => alert("Simulating high-fidelity micro-recording...")}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-heritage-brown/60 font-bold uppercase">Click to Record Voice Pronunciation</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submittingPhrase}
                  className="w-full btn-primary py-4 font-bold flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {submittingPhrase ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  <span>Submit to Cultural Council</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Glossary Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl border border-heritage-brown/10 text-left"
            >
              <button 
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-heritage-cream/50 text-heritage-brown/50 hover:text-heritage-brown transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-heritage-olive/10 rounded-2xl">
                  <Book className="w-6 h-6 text-heritage-olive" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-heritage-brown">Linguistic Approval Queue</h3>
                  <p className="text-xs text-heritage-brown/50">Authenticate entries prior to public release</p>
                </div>
              </div>

              {reviewList.length === 0 ? (
                <div className="text-center py-12 bg-heritage-cream/30 rounded-2xl border-2 border-dashed border-heritage-brown/10">
                  <Check className="w-12 h-12 text-heritage-olive mx-auto mb-3" />
                  <h4 className="font-bold text-heritage-brown">All Caught Up!</h4>
                  <p className="text-xs text-heritage-brown/50">There are no pending phrases awaiting verification.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {reviewList.map((item) => (
                    <div key={item.id} className="p-5 bg-heritage-cream/30 rounded-2xl border border-heritage-brown/5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-heritage-terracotta bg-heritage-terracotta/5 px-2 py-0.5 rounded-full mb-1 inline-block">
                          {item.category} • {item.usage || 'Common'}
                        </span>
                        <h4 className="font-bold text-lg text-heritage-brown">{item.lukenye}</h4>
                        <p className="text-sm text-heritage-brown/60 mb-2">{item.english}</p>
                        {item.example_sentence && (
                          <p className="text-xs text-heritage-brown/50 italic">Context: "{item.example_sentence}"</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button 
                          onClick={() => handlePlay(item.id, item.audio_url)}
                          className="p-3 bg-white text-heritage-brown border border-heritage-brown/10 hover:bg-heritage-brown hover:text-white rounded-xl transition-colors cursor-pointer"
                          title="Listen Pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleApprove(item.id)}
                          className="p-3 bg-heritage-olive text-white rounded-xl hover:bg-heritage-olive/80 transition-colors cursor-pointer"
                          title="Approve & Publish"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReject(item.id)}
                          className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors cursor-pointer"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-heritage-brown/10 flex items-center justify-between text-xs text-heritage-brown/50">
                <span className="flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-1 text-heritage-terracotta" />
                  Only certified committee members can publish to the dictionary.
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
