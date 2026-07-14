import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Mic, Upload, CheckCircle2, ArrowRight, LogIn, Camera, Loader2, Check, Globe, Image as ImageIcon, History, Mail, Lock, User as UserIcon, HelpCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { getSupabase, checkIsAdmin } from '../lib/supabaseClient';
import { getContributions, createContribution, uploadMedia, Contribution, getStoryCategories, StoryCategory } from '../lib/supabase';
import OralHistoryRecorder from '../components/OralHistoryRecorder';
import SEO from '../components/SEO';

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
  const supabase = getSupabase();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'photo'
  });

  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory | null>(null);

  // Oral History Recording States
  const [contributionTab, setContributionTab] = useState<'photo' | 'audio'>('photo');
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);

  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm') 
        ? { mimeType: 'audio/webm' } 
        : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setPreviewUrl(audioUrl);
        setRecordedAudioBlob(audioBlob);
        setRecordingStatus('stopped');
      };

      mediaRecorder.start();
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setAudioRecorder(mediaRecorder);
      setRecordingStatus('recording');
    } catch (err: any) {
      alert("Microphone access is required to record oral history stories. Please enable permissions and try again.");
    }
  };

  const pauseRecording = () => {
    if (audioRecorder && recordingStatus === 'recording') {
      audioRecorder.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (audioRecorder && recordingStatus === 'paused') {
      audioRecorder.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingStatus('recording');
    }
  };

  const stopRecording = () => {
    if (audioRecorder && (recordingStatus === 'recording' || recordingStatus === 'paused')) {
      audioRecorder.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      audioRecorder.stream.getTracks().forEach(track => track.stop());
      setRecordingStatus('stopped');
    }
  };

  const discardRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRecorder) {
      try {
        audioRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    setRecordingStatus('idle');
    setRecordedAudioBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  // Fetch story categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getStoryCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, type: cats[0].id }));
          setSelectedCategory(cats[0]);
        }
      } catch (err) {
        console.error("Failed to load story categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Update selected category details when selection changes
  const handleCategoryChange = (catId: string) => {
    setFormData(prev => ({ ...prev, type: catId }));
    const found = categories.find(c => c.id === catId);
    setSelectedCategory(found || null);
  };

  // Track Auth state
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        checkIsAdmin(u).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        checkIsAdmin(u).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Load contributions
  useEffect(() => {
    if (!user) {
      setMyContributions([]);
      return;
    }

    async function loadMyContributions() {
      const list = await getContributions(user.id);
      setMyContributions(list);
    }
    loadMyContributions();
  }, [user, submitted]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    if (isSignUp && authPassword.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
        
        // Auto insert profile row
        await supabase.from('profiles').upsert({
          id: data.user?.id,
          email: authEmail,
          role: 'member',
          is_admin: false,
          updated_at: new Date().toISOString()
        });

        alert("Sign up successful! You are now logged in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/contribute'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("OAuth login failed:", error);
      setAuthError("Google Sign-In is unavailable or blocked in this context. Please use the email form.");
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      try {
        const { url, error } = await uploadMedia(file, 'images');
        if (error) throw error;
        setPreviewUrl(url);
      } catch (err: any) {
        alert(err.message || "Failed to upload image. Using local preview fallback.");
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let mediaUrl = '';
      if (contributionTab === 'audio') {
        if (!recordedAudioBlob) {
          alert("Please record your ancestry story first before submitting.");
          setLoading(false);
          return;
        }
        setUploadingFile(true);
        const audioFile = new File([recordedAudioBlob], `oral_history_${Date.now()}.webm`, { type: 'audio/webm' });
        const { url, error: uploadErr } = await uploadMedia(audioFile, 'images');
        if (uploadErr) throw uploadErr;
        mediaUrl = url;
        setUploadingFile(false);
      } else {
        mediaUrl = previewUrl || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800";
      }

      const { error } = await createContribution(
        formData.title || (contributionTab === 'audio' ? "Recorded Oral History" : "Untitled Contribution"),
        formData.description,
        contributionTab === 'audio' ? 'audio' : formData.type,
        mediaUrl,
        user.email || 'anonymous@bakenyi.org',
        user.id,
        isAdmin ? 'approved' : 'pending'
      );

      if (error) throw error;

      setSubmitted(true);
      setFormData({ title: '', description: '', type: 'photo' });
      setPreviewUrl(null);
      setRecordedAudioBlob(null);
      setRecordingStatus('idle');
      setRecordingTime(0);
      audioChunksRef.current = [];
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error: any) {
      alert(error.message || "Failed to submit contribution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      <SEO 
        title="Join the Preservation Efforts"
        description="Contribute oral history recordings, ancestral photographs, or vocabulary translations to help safeguard the Bakenye cultural heritage."
        keywords="Contribute, upload archives, oral history recording, submit artifacts"
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
            Join the Preservation
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            Your voice is our history. Contribute locally, archive globally.
          </p>
        </div>
      </section>

      {/* Contribution Form / Login */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <div className="heritage-card bg-white p-8 md:p-12 shadow-xl rounded-[40px] border-2 border-heritage-brown/5">
          {!user ? (
            <div className="max-w-md mx-auto py-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-heritage-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-heritage-terracotta" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-heritage-brown">Sign In to Contribute</h2>
                <p className="text-sm text-heritage-brown/60 mt-2">
                  To keep our archive secure and credit our contributors, we require a verified account.
                </p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-left">
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-heritage-brown/60">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-brown/40" />
                    <input 
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-12 pr-6 py-3.5 bg-heritage-cream/30 border-2 border-transparent focus:border-heritage-terracotta/20 rounded-xl outline-none font-medium text-heritage-brown"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-heritage-brown/60">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-heritage-brown/40" />
                    <input 
                      required
                      type={showAuthPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-heritage-cream/30 border-2 border-transparent focus:border-heritage-terracotta/20 rounded-xl outline-none font-medium text-heritage-brown"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-heritage-brown/40 hover:text-heritage-terracotta transition-colors focus:outline-none"
                    >
                      {showAuthPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full btn-primary py-4 font-bold flex items-center justify-center space-x-2 mt-6 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  <span>{isSignUp ? 'Create Cultural Profile' : 'Sign In Now'}</span>
                </button>
              </form>

              <div className="mt-6 text-center space-y-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold uppercase tracking-widest text-heritage-terracotta hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-heritage-brown/10"></div>
                  <span className="flex-shrink mx-4 text-xs font-black uppercase tracking-widest text-heritage-brown/30">Or</span>
                  <div className="flex-grow border-t border-heritage-brown/10"></div>
                </div>

                <button 
                  onClick={handleLoginWithGoogle}
                  className="w-full py-3 px-6 bg-white border-2 border-heritage-brown/10 hover:border-heritage-terracotta/30 text-heritage-brown font-bold rounded-xl flex items-center justify-center space-x-3 transition-colors cursor-pointer"
                >
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-12 pb-8 border-b border-heritage-brown/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-heritage-terracotta rounded-full flex items-center justify-center text-white font-bold uppercase">
                    {user.email?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-heritage-terracotta">Logged in as</p>
                    <p className="font-serif font-bold text-heritage-brown">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-xs font-black uppercase tracking-widest text-heritage-brown/40 hover:text-heritage-terracotta transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>

              {/* CONTRIBUTION TYPE SELECTOR TABS */}
              <div className="flex flex-col sm:flex-row bg-heritage-cream/40 p-2.5 rounded-[32px] sm:rounded-3xl border border-heritage-brown/10 mb-10 gap-2 sm:gap-0">
                <button
                  type="button"
                  onClick={() => {
                    setContributionTab('photo');
                    discardRecording();
                  }}
                  className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                    contributionTab === 'photo'
                      ? 'bg-heritage-terracotta text-white shadow-md shadow-heritage-terracotta/10 font-black'
                      : 'text-heritage-brown/60 hover:text-heritage-brown'
                  }`}
                >
                  <Camera className="w-4.5 h-4.5" />
                  <span>Photo / Artifact</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContributionTab('audio');
                    setPreviewUrl(null);
                  }}
                  className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                    contributionTab === 'audio'
                      ? 'bg-heritage-terracotta text-white shadow-md shadow-heritage-terracotta/10 font-black'
                      : 'text-heritage-brown/60 hover:text-heritage-brown'
                  }`}
                >
                  <Mic className="w-4.5 h-4.5" />
                  <span>Record Oral History</span>
                </button>
              </div>

              {contributionTab === 'audio' ? (
                <OralHistoryRecorder onRecordingSubmitted={() => {
                  setSubmitted(true);
                  setTimeout(() => setSubmitted(false), 5000);
                }} />
              ) : (
                <>
                  <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-8 flex items-center text-left">
                    <Camera className="w-8 h-8 mr-4 text-heritage-terracotta" />
                    <span>Submit Photographic/Written Artifact</span>
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Title of Story / Artifact</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. Traditional Basketry"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full px-6 py-4 bg-heritage-cream/30 border-2 border-transparent focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Category</label>
                        <select 
                          value={formData.type}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-6 py-4 bg-heritage-cream/30 border-2 border-transparent focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown appearance-none"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                          {categories.length === 0 && (
                            <>
                              <option value="photo">Photograph</option>
                              <option value="story">Oral Story (Text)</option>
                              <option value="audio">Audio Clip</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {selectedCategory && (
                      <div className="bg-heritage-cream/20 border border-heritage-terracotta/10 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-heritage-terracotta uppercase tracking-wider">
                          <HelpCircle className="w-4 h-4 shrink-0" />
                          <span>{selectedCategory.name} Guidelines</span>
                        </div>
                        <p className="text-xs text-heritage-brown/60 italic leading-relaxed">
                          "{selectedCategory.description}"
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-heritage-brown/5 text-xs font-medium">
                          {selectedCategory.validation_rules && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-heritage-terracotta/60">Verification Criteria:</span>
                              <p className="text-heritage-brown/70">{selectedCategory.validation_rules}</p>
                            </div>
                          )}
                          {selectedCategory.upload_requirements && (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-heritage-terracotta/60">Attachment Checklist:</span>
                              <p className="text-heritage-brown/70">{selectedCategory.upload_requirements}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">
                        Description / History
                      </label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Share the significance or history of this item..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-6 py-4 bg-heritage-cream/30 border-2 border-transparent focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown resize-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className={`p-8 border-2 border-dashed rounded-3xl bg-heritage-cream/10 text-center group transition-all ${
                        previewUrl ? 'border-heritage-olive/30' : 'border-heritage-brown/10 hover:border-heritage-terracotta/30'
                      }`}>
                        <input 
                          type="file" 
                          className="hidden" 
                          id="file-upload" 
                          accept="image/*" 
                          onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer block">
                          {uploadingFile ? (
                            <div className="py-8">
                              <Loader2 className="w-8 h-8 text-heritage-terracotta animate-spin mx-auto mb-2" />
                              <p className="text-xs font-bold text-heritage-brown/50 uppercase tracking-widest">Uploading to Cloud...</p>
                            </div>
                          ) : previewUrl ? (
                            <div className="relative group">
                              <img src={previewUrl} className="max-h-64 mx-auto rounded-xl shadow-lg border-4 border-white" alt="Preview" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                <Upload className="text-white w-8 h-8" />
                              </div>
                              <p className="mt-4 text-xs font-bold text-heritage-olive uppercase tracking-widest">Image ready for submission</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-heritage-terracotta" />
                              </div>
                              <p className="text-heritage-brown font-bold mb-1">Select Local Photo</p>
                              <p className="text-xs text-heritage-brown/40 font-medium">JPEG, PNG up to 10MB</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6">
                      <p className="text-[10px] text-heritage-brown/40 max-w-sm leading-relaxed font-medium">
                        By submitting, you agree to allow the Bakenyi Heritage Committee & Elder Council to review, verify and publish this ancestry data.
                      </p>
                      <button 
                        disabled={loading || submitted || uploadingFile}
                        type="submit"
                        className={`btn-primary flex items-center space-x-3 px-12 py-4 transition-all cursor-pointer ${
                          submitted ? 'bg-heritage-olive ring-4 ring-heritage-olive/20' : ''
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : submitted ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>{isAdmin ? 'Published!' : 'Submitted!'}</span>
                          </>
                        ) : (
                          <>
                            <span>{isAdmin ? 'Publish Instantly' : 'Submit to Elder Council'}</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Your Recent Contributions Section */}
      <AnimatePresence>
        {user && myContributions.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-24 px-4 max-w-7xl mx-auto"
          >
            <div className="flex items-center space-x-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-heritage-terracotta/10 flex items-center justify-center">
                <History className="w-6 h-6 text-heritage-terracotta" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown">Your Recent Submissions</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myContributions.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-heritage-brown/5 flex flex-col text-left">
                  <div className="aspect-video relative overflow-hidden bg-heritage-cream/50 flex items-center justify-center">
                    {item.imageUrl && (item.imageUrl.startsWith('data:audio/') || item.imageUrl.endsWith('.webm') || item.imageUrl.endsWith('.mp3') || item.imageUrl.endsWith('.wav') || item.type === 'audio') ? (
                      <div className="p-4 w-full flex flex-col items-center justify-center gap-2 bg-heritage-cream/15 h-full">
                        <div className="w-10 h-10 rounded-full bg-heritage-terracotta/10 flex items-center justify-center text-heritage-terracotta animate-pulse">
                          <Mic className="w-5 h-5" />
                        </div>
                        <audio src={item.imageUrl} controls className="w-full max-w-[200px] h-8 scale-90" />
                      </div>
                    ) : (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                         item.status === 'approved' ? 'bg-heritage-olive/10 text-heritage-olive border-heritage-olive/20' :
                         item.status === 'rejected' ? 'bg-red-50 text-red-500 border-red-500/20' :
                         'bg-heritage-terracotta/10 text-heritage-terracotta border-heritage-terracotta/20'
                       }`}>
                         {item.status}
                       </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[9px] font-black uppercase tracking-widest text-heritage-terracotta mb-1">{item.type}</div>
                    <h4 className="font-serif font-bold text-heritage-brown truncate">{item.title}</h4>
                    <p className="text-[10px] text-heritage-brown/40 mt-2">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Steps List */}
      <section className="pb-24 px-4 max-w-5xl mx-auto border-t border-heritage-brown/5 pt-24">
        <h3 className="text-center text-heritage-brown/40 text-[10px] font-black uppercase tracking-[0.5em] mb-16">The Archiving Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="relative p-8 bg-white border border-heritage-brown/5 rounded-3xl hover:shadow-lg transition-all group text-left">
              <div className="text-4xl font-serif font-black text-heritage-brown/5 absolute top-4 right-6">{step.id}</div>
              <div className={`w-14 h-14 rounded-2xl bg-${step.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className={`w-7 h-7 text-${step.color}`} />
              </div>
              <h4 className="text-xl font-serif font-bold text-heritage-brown mb-3">{step.title}</h4>
              <p className="text-sm text-heritage-brown/60 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
