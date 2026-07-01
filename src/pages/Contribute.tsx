import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Mic, Upload, CheckCircle2, ArrowRight, LogIn, Camera, Loader2, Check, Globe, Image as ImageIcon, History } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface UserContribution {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  imageUrl: string;
  type: string;
}

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [myContributions, setMyContributions] = useState<UserContribution[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'photo'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setMyContributions([]);
      return;
    }

    const q = query(
      collection(db, 'contributions'),
      where('userId', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserContribution[];
      setMyContributions(items);
    }, (error) => {
      console.error("Error fetching my contributions:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to ~800KB for Firestore safety
        alert("Photo is too large for the demo database (Limit 800KB). Please select a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const path = 'contributions';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        userEmail: user.email,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'pending',
        submittedAt: serverTimestamp(),
        // Storing the base64 string in Firestore for this demo
        imageUrl: previewUrl || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800" 
      });
      setSubmitted(true);
      setFormData({ title: '', description: '', type: 'photo' });
      setPreviewUrl(null);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
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
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-heritage-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <LogIn className="w-10 h-10 text-heritage-terracotta" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-4">First, Sign In</h2>
              <p className="text-heritage-brown/60 mb-10 max-w-md mx-auto">
                To keep our archive secure and credit our contributors, we require a verified account.
              </p>
              <button 
                onClick={handleLogin}
                className="btn-primary flex items-center mx-auto space-x-3 px-10 py-4 shadow-lg shadow-heritage-terracotta/20"
              >
                <Globe className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-12 pb-8 border-b border-heritage-brown/10">
                <div className="flex items-center space-x-4">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-12 h-12 rounded-full border-2 border-heritage-terracotta" alt="Profile" />
                  ) : (
                    <div className="w-12 h-12 bg-heritage-brown rounded-full flex items-center justify-center text-white">
                      {user.displayName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-heritage-terracotta">Logged in as</p>
                    <p className="font-serif font-bold text-heritage-brown">{user.displayName || user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => auth.signOut()}
                  className="text-xs font-black uppercase tracking-widest text-heritage-brown/40 hover:text-heritage-terracotta transition-colors"
                >
                  Log Out
                </button>
              </div>

              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-8 flex items-center">
                <Camera className="w-8 h-8 mr-4 text-heritage-terracotta" />
                Submit a Local Photo
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Title of Item</label>
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
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-6 py-4 bg-heritage-cream/30 border-2 border-transparent focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown appearance-none"
                    >
                      <option value="photo">Photograph</option>
                      <option value="story">Oral Story (Text)</option>
                      <option value="audio">Audio Clip</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 ml-1">Description / History</label>
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
                      {previewUrl ? (
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
                    By submitting, you agree to allow the Bakenyi Heritage Committee to archive and display this content publicly.
                  </p>
                  <button 
                    disabled={loading || submitted}
                    type="submit"
                    className={`btn-primary flex items-center space-x-3 px-12 py-4 transition-all ${
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
                        <span>Submitted!</span>
                      </>
                    ) : (
                      <>
                        <span>Submit to Archive</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
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
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-heritage-brown/5 flex flex-col">
                  <div className="aspect-video relative overflow-hidden bg-heritage-cream/50">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
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
                      {item.submittedAt?.toDate().toLocaleDateString()}
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
            <div key={step.id} className="relative p-8 bg-white border border-heritage-brown/5 rounded-3xl hover:shadow-lg transition-all group">
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


