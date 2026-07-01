import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Map, 
  MessageCircle, 
  BookOpen,
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Search, 
  Clock, 
  User, 
  Globe, 
  Sparkles, 
  ListMusic, 
  Volume1, 
  Volume,
  Headphones,
  Languages
} from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  elder: string;
  clan: string;
  role: string;
  topic: 'Migration' | 'Language' | 'Tradition' | 'Crafts';
  duration: string;
  durationSeconds: number;
  imageUrl: string;
  audioUrl: string;
  recordingDate: string;
  transcription: {
    time: number;
    textLukenye: string;
    textEnglish: string;
  }[];
}

const oralHistoryTracks: AudioTrack[] = [
  {
    id: "track-1",
    title: "The Legend of the Floating Islands (Ebiswa)",
    elder: "Mzee Yosefu Mwula",
    clan: "Abakenge Clan",
    role: "Preserver of the Clan Staff",
    topic: "Migration",
    duration: "2:45",
    durationSeconds: 165,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    recordingDate: "September 2023",
    transcription: [
      { time: 0, textLukenye: "Bakenyi baali bantu ba mazzi n'ebiswa eby'omunyanja.", textEnglish: "The Bakenyi were always people of the water and the floating marsh islands." },
      { time: 10, textLukenye: "Twatunga ebiswa mulyango lwa Kyoga okwetangira ebitongole eby'amaani.", textEnglish: "We constructed floating islands (ebiswa) on Lake Kyoga to shelter ourselves from hostile groups." },
      { time: 25, textLukenye: "Ebiswa bino byali bityo, byatutwalanga buli wamu w'enyanja we twaba twagala okugoba ebyennyanja...", textEnglish: "These islands were mobile, drifting with the wind, allowing us to follow fish migrations safely." },
      { time: 45, textLukenye: "Abakulembeze baffe baasomanga ebigere n'empewo n'okusala ebiswa eby'amaato...", textEnglish: "Our elders read the waves and wind currents, guiding our floating homes to calm and fertile bays." },
      { time: 65, textLukenye: "N'olwekyo, amaka gaffe gaasigalanga mu mirembe, ku mazzi amatendo agatuwa emmere n'obukuumi.", textEnglish: "Thus, our families remained at peace upon the glorious waters that provided both sustenance and safety." },
      { time: 85, textLukenye: "Buli mwana we kika kyaffe ateekwa okukoppa ebyo eby'edda...", textEnglish: "Every child of our clan must remember these ancient ways of navigation..." },
      { time: 105, textLukenye: "Ne baka mbeera ku ttaka kaakano, emmeeme yaffe eri ku nyanja Kyoga.", textEnglish: "Even though we live on the mainland now, our spirits belong to the tides of Lake Kyoga." }
    ]
  },
  {
    id: "track-2",
    title: "Secrets of Lukenye Language Preservation",
    elder: "Mama Grace Namutosi",
    clan: "Abasenyi Clan",
    role: "Elder Storyteller",
    topic: "Language",
    duration: "3:12",
    durationSeconds: 192,
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    recordingDate: "November 2024",
    transcription: [
      { time: 0, textLukenye: "Olunimi lwaffe Lukenye n'olulimi lwa banyasaye n'abakuru baffe.", textEnglish: "Our language, Lukenye, is the voice of our creators and our ancestors." },
      { time: 15, textLukenye: "Twagamba abana baffe nti mwebere olunimi luno, kubanga bwe twogera, abakuru baffe batuwulira.", textEnglish: "We teach our children to speak this language with pride, for when we speak, the ancestors listen." },
      { time: 32, textLukenye: "Buli bigambo, buli 'Engero' biriko amakulu amagobansolo ag'obulamu.", textEnglish: "Every word and proverb holds deep teachings about the interconnectedness of all life." },
      { time: 50, textLukenye: "Tusaba abavubuka obutaba na nsonyi kwogera lulimi lwabwe mu bantu bangi.", textEnglish: "We plead with the youth never to feel ashamed of speaking our tongue in public spaces." },
      { time: 68, textLukenye: "Kubanga obugagga bwaffe we buli. Bwe lufaa, n'omwoyo gwa Bakenyi gugenda nagwo.", textEnglish: "For our language is our true wealth. If it fades, the very soul of the Bakenyi fades with it." },
      { time: 90, textLukenye: "Ka tukume ekitangaala kya Lukenye okuyaka mu myaka egijja.", textEnglish: "Let us keep the light of Lukenye burning brightly for all generations to come." }
    ]
  },
  {
    id: "track-3",
    title: "Clan Totems & Sacred Water Spirits",
    elder: "Mzee Peter Mukama",
    clan: "Abagaya Clan",
    role: "Traditional Ritual Custodian",
    topic: "Tradition",
    duration: "2:18",
    durationSeconds: 138,
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    recordingDate: "January 2026",
    transcription: [
      { time: 0, textLukenye: "Abagaya n'abantu abesiga ebyennyanja ebikulu.", textEnglish: "The Abagaya clan is the guardian of the deep waters." },
      { time: 10, textLukenye: "Akanyoni n'omuziro gwaffe gwa mazzi, ate omuziiro gwe mamba gutukuma.", textEnglish: "Our totem is the lungfish, and we respect the currents that shield us from harm." },
      { time: 25, textLukenye: "Bwe tulaba mamba e Lake Kyoga, tituyinza okugirya kubanga ye muganda waffe.", textEnglish: "When we see the lungfish in Lake Kyoga, we do not harm it, for it is our brother." },
      { time: 42, textLukenye: "Ennyanja Kyoga terina mutima mubi, naye bwe wejjula emiziro, ekyama kyakugoba.", textEnglish: "Lake Kyoga has a generous spirit, but if you disrespect the ancient taboos, the waters will turn silent." },
      { time: 60, textLukenye: "Bwe twesigama ku buyigirize bwa bajjajja, ennyanja etuwa emmeere n'amaato bulijjo.", textEnglish: "When we honor the teachings of our grandparents, the lake grants us abundant harvest and safe passage." },
      { time: 80, textLukenye: "Obulombolombo buno bwe bulamu bwaffe obw'obusungufu.", textEnglish: "These sacred customs are what define our harmonious co-existence with nature." }
    ]
  },
  {
    id: "track-4",
    title: "Traditional Canoe Crafting Techniques",
    elder: "Mzee Kadhiri Waako",
    clan: "Abanyele Clan",
    role: "Master Boatbuilder",
    topic: "Crafts",
    duration: "3:45",
    durationSeconds: 225,
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    recordingDate: "March 2026",
    transcription: [
      { time: 0, textLukenye: "Okubajja amaato kye mulimu gwa kika gye twatunga okuva edda.", textEnglish: "Carving traditional canoes is a sacred lineage craft we inherited from long ago." },
      { time: 15, textLukenye: "Twatema emiti eminene mu kibira eginaamalamu emyaka mingi mu mazzi.", textEnglish: "We select massive trees from the lakeside forest that can withstand the waters for decades." },
      { time: 35, textLukenye: "Tukozesa emizigo gye mpeke okusiiga amaato gano, okugatangira okuyingiza amaizi.", textEnglish: "We apply natural oils and resins to coat the canoes, making them waterproof and resilient." },
      { time: 55, textLukenye: "Omubajji buli lwayambuka mu lyato lye, asaba ebiswa okumuwa obulyo.", textEnglish: "A canoe-carver always sings prayers to the floating papyrus to grant them swift, gliding paths." },
      { time: 75, textLukenye: "Lwakuba ebintu bino bikyuse kaakano, twagala nnyo abavubuka okubiyiga buli lukya.", textEnglish: "Even though modern methods exist, we wish for our youth to learn these master carving arts." },
      { time: 95, textLukenye: "Kubanga amaato gaffe g'ennyanja gegaleese eggwanga lya Bakenyi wano.", textEnglish: "For our water vessels are what carried the Bakenyi nation through the waves of time to this day." }
    ]
  }
];

export default function History() {
  const [searchParams] = useSearchParams();
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [translationLang, setTranslationLang] = useState<'lukenye' | 'english' | 'both'>('both');

  // Parse track parameter to select and play specific oral history recording
  useEffect(() => {
    const trackParam = searchParams.get('track');
    if (trackParam) {
      const index = oralHistoryTracks.findIndex(t => t.id === trackParam);
      if (index !== -1) {
        setActiveTrackIndex(index);
        setIsPlaying(true);
        
        // Use timeout to ensure DOM has rendered
        setTimeout(() => {
          const sectionEl = document.getElementById('oral-history-archive');
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [searchParams]);

  // Parse section parameter to scroll to specific history timeline event
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      setTimeout(() => {
        const timelineEl = document.getElementById('history-timeline');
        if (timelineEl) {
          timelineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [searchParams]);

  const sectionParam = searchParams.get('section');
  const getSectionIndex = (section: string | null) => {
    if (section === 'roots') return 0;
    if (section === 'islands') return 1;
    if (section === 'expansion') return 2;
    if (section === 'colonial') return 3;
    return -1;
  };
  const activeSectionIdx = getSectionIndex(sectionParam);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptionContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTrack = oralHistoryTracks[activeTrackIndex];

  const activeSegmentIndex = currentTrack.transcription.findIndex((seg, i) => {
    const nextSeg = currentTrack.transcription[i + 1];
    return currentTime >= seg.time && (!nextSeg || currentTime < nextSeg.time);
  });

  useEffect(() => {
    if (transcriptionContainerRef.current) {
      const activeElement = transcriptionContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeSegmentIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackRate;
      
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;

      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay blocked or audio load error:", err);
          setIsPlaying(false);
        });
      } else {
        setCurrentTime(0);
      }
    }
  }, [activeTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Play failed:", err);
      });
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    let newTime = audioRef.current.currentTime + seconds;
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioRef.current.muted = newMute;
    if (audioRef.current) {
      audioRef.current.volume = newMute ? 0 : volume;
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackRate(nextSpeed);
  };

  const handleSeekToSegment = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredTracks = oralHistoryTracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          track.elder.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.clan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'All' || track.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });
  const timelineEvents = [
    {
      period: "15th - 16th Century",
      title: "Ancient Roots & Migration",
      desc: "The Bakenyi precursors evolved from the wider Bantu-speaking groups around Lake Victoria and the Bunyoro-Kitara Empire, eventually settling along the Nile-Kyoga waterways."
    },
    {
      period: "17th Century",
      title: "Establishment on floating islands",
      desc: "Survival through adaptation. The Bakenyi became famous for living on 'Ebiswa' (floating islands formed by papyrus), which provided natural defense and immediate access to fishing grounds."
    },
    {
      period: "18th - 19th Century",
      title: "Regional Expansion",
      desc: "Migration further into current districts like Paliisa, Kamuli, and Budaka. Establishing relationships with the Baganda, Basoga, and Bagwere while maintaining a distinct linguistic identity."
    },
    {
      period: "1900s - Colonial Era",
      title: "Administrative Recognition",
      desc: "Formal recording of Bakenyi as a distinct ethnic group under the Uganda Protectorate documentation. Settlement patterns moved more towards stable land-based villages."
    },
    {
      period: "Present Day",
      title: "Cultural Digital Era",
      desc: "A focus on educational revival and digital documentation of the Lukenye language and clan systems to prevent cultural erosion."
    }
  ];

  return (
    <div className="pt-24 min-h-screen bg-heritage-cream">
      {/* Hero Header */}
      <section className="bg-heritage-olive py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6"
          >
            Chronicles of the Bakenyi
          </motion.h1>
          <p className="text-heritage-sand max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide uppercase">
            A journey through time, water, and resilience.
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column - Historical Narratives */}
          <div className="lg:col-span-7 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 text-heritage-terracotta mb-4">
                <Map className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest">The Great Migration</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-6">Migration from the Lakeshores</h2>
              <p className="text-heritage-brown/70 leading-relaxed mb-6 text-lg">
                Historical oral traditions suggest that the Bakenyi entered the Kyoga region from multiple directions. One significant route traces ancestry to the ancestors of the Baganda and Basoga near Lake Victoria, while another branch shares lineage roots with the people of Bunyoro.
              </p>
              <p className="text-heritage-brown/70 leading-relaxed text-lg">
                Known as the 'Water People', the Bakenyi were the masters of Lake Kyoga long before modern navigation. They were recognized for their unique dugout canoes and their reliance on the papyrus floating islands, which acted as mobile homes and protective fortress.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 text-heritage-olive mb-4">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-widest">Oral Tradition</span>
              </div>
              <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-6">The Power of the Word</h2>
              <p className="text-heritage-brown/70 leading-relaxed mb-6 text-lg">
                For centuries, Bakenyi history was preserved through 'Engero' (proverbs) and epic storytelling sessions around fires at night. Elders would recount the heroic acts of clan leaders who navigated the treacherous storms of Lake Kyoga and successfully negotiated peace with neighboring tribes.
              </p>
              <div className="bg-heritage-olive/5 p-8 rounded-2xl border-l-4 border-heritage-olive italic text-heritage-brown/80">
                "We do not write on paper alone; we write on the hearts of our children. When an elder dies, it is as if a whole library has burned down." 
                <span className="block mt-4 font-bold text-xs uppercase not-italic text-heritage-olive">— Traditional Wisdom</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Timeline */}
          <div id="history-timeline" className="lg:col-span-5 relative">
            <h3 className="text-2xl font-serif font-bold text-heritage-brown mb-12 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-heritage-terracotta" />
              Timeline of Milestones
            </h3>
            
            <div className="relative pl-8 border-l-2 border-heritage-brown/10 ml-4 space-y-12">
              {timelineEvents.map((event, idx) => {
                const isSectionHighlighted = idx === activeSectionIdx;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative p-4 rounded-2xl transition-all duration-500 ${
                      isSectionHighlighted ? 'bg-heritage-terracotta/10 ring-2 ring-heritage-terracotta shadow-md scale-[1.02]' : ''
                    }`}
                  >
                    {isSectionHighlighted && (
                      <span className="absolute -top-3 right-4 bg-heritage-terracotta text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                        Timeline Match
                      </span>
                    )}
                    {/* Dot */}
                    <div className={`absolute -left-[41px] w-4 h-4 rounded-full border-4 border-heritage-cream transition-colors ${
                      isSectionHighlighted ? 'bg-heritage-terracotta scale-110' : 'bg-heritage-terracotta'
                    }`} style={{ top: isSectionHighlighted ? '22px' : '22px' }} />
                    
                    <span className="text-xs font-bold text-heritage-terracotta uppercase tracking-tighter block mb-1">
                      {event.period}
                    </span>
                    <h4 className="text-lg font-bold text-heritage-brown mb-2">{event.title}</h4>
                    <p className="text-sm text-heritage-brown/60 leading-relaxed tracking-tight font-medium">
                      {event.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Oral History Archive Section */}
      <section id="oral-history-archive" className="py-24 bg-heritage-brown text-white relative overflow-hidden">
        <div className="absolute inset-0 cultural-pattern opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 text-heritage-sand mb-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Headphones className="w-5 h-5 animate-pulse text-heritage-sand" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">The Oral History Archive</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
              Voices of our Elders
            </h2>
            <p className="text-heritage-sand/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">
              Traditionally shared around open fires on Lake Kyoga’s shores, Bakenyi chronicles are woven of words and memory. Hear Lukenye elders speak of migrations, clan totems, and island-crafts, and follow along with synchronized translations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: ACTIVE MEDIA PLAYER & SYNCHRONIZED TRANSCRIPTION */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              <div className="bg-[#443022] rounded-[40px] p-8 md:p-10 border border-heritage-sand/20 shadow-2xl relative overflow-hidden flex flex-col h-full justify-between">
                
                {/* Hidden Audio element */}
                <audio 
                  ref={audioRef}
                  onTimeUpdate={() => {
                    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                  }}
                  onDurationChange={() => {
                    if (audioRef.current) setDuration(audioRef.current.duration);
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                />

                {/* Elder Portrait & Quick info */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/10">
                  <div className="relative shrink-0">
                    <img 
                      src={currentTrack.imageUrl} 
                      alt={currentTrack.elder}
                      className="w-24 h-24 rounded-3xl object-cover border-4 border-heritage-sand shadow-lg"
                    />
                    {isPlaying && (
                      <div className="absolute -bottom-2 -right-2 bg-heritage-terracotta text-white p-1.5 rounded-full shadow-md animate-bounce">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center sm:text-left flex-grow">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-heritage-terracotta/20 text-heritage-sand border border-heritage-terracotta/40">
                        {currentTrack.topic}
                      </span>
                      <span className="text-xs text-white/40 font-mono flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {currentTrack.recordingDate}
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-1">{currentTrack.title}</h3>
                    <p className="text-heritage-sand font-semibold text-sm flex items-center justify-center sm:justify-start">
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      {currentTrack.elder}
                      <span className="text-white/40 mx-2">•</span>
                      <span className="text-white/70 font-normal">{currentTrack.clan}</span>
                    </p>
                    <p className="text-white/50 text-xs mt-1 italic font-medium">{currentTrack.role}</p>
                  </div>
                </div>

                {/* Animated Wave visualizer when playing */}
                <div className="py-6 flex items-center justify-center bg-black/10 rounded-2xl border border-white/5 my-6 min-h-[50px]">
                  {isPlaying ? (
                    <div className="flex items-center space-x-1.5 h-8">
                      {[...Array(16)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: ["20%", "100%", "20%"] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6 + (i % 5) * 0.15,
                            ease: "easeInOut"
                          }}
                          className="w-1 bg-heritage-sand rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 h-8 opacity-40">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-heritage-sand/40 rounded-full" />
                      ))}
                      <span className="text-xs text-heritage-sand/60 uppercase font-black tracking-widest ml-4">Player Paused</span>
                    </div>
                  )}
                </div>

                {/* Media Player Seek Slider Controls */}
                <div className="space-y-4">
                  
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <input 
                      type="range"
                      min={0}
                      max={duration || currentTrack.durationSeconds}
                      step={0.1}
                      value={currentTime}
                      onChange={handleProgressChange}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-heritage-sand focus:outline-none transition-all"
                    />
                    <div className="flex justify-between text-xs text-white/50 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration || currentTrack.durationSeconds)}</span>
                    </div>
                  </div>

                  {/* Operational Controls Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    
                    {/* Left speed option */}
                    <button 
                      onClick={handleSpeedChange}
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-heritage-sand tracking-wide border border-white/5 transition-all"
                      title="Adjust playback speed"
                    >
                      {playbackRate}x
                    </button>

                    <div className="flex items-center space-x-5">
                      <button 
                        onClick={() => handleSkip(-10)}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/5 transition-all"
                        title="Skip backward 10s"
                      >
                        <SkipBack className="w-5 h-5 text-heritage-sand" />
                      </button>

                      <button 
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-heritage-terracotta hover:bg-heritage-sand hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all border border-white/10 group"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="w-7 h-7 fill-white text-white group-hover:scale-95 transition-transform" />
                        ) : (
                          <Play className="w-7 h-7 fill-white text-white translate-x-0.5 group-hover:scale-105 transition-transform" />
                        )}
                      </button>

                      <button 
                        onClick={() => handleSkip(10)}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/5 transition-all"
                        title="Skip forward 10s"
                      >
                        <SkipForward className="w-5 h-5 text-heritage-sand" />
                      </button>
                    </div>

                    {/* Mute toggle with small slider */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={toggleMute}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-heritage-sand transition-all"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4" />
                        ) : volume < 0.4 ? (
                          <Volume className="w-4 h-4" />
                        ) : volume < 0.7 ? (
                          <Volume1 className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input 
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-heritage-sand focus:outline-none hidden sm:block"
                      />
                    </div>

                  </div>
                </div>

              </div>

              {/* SYNCHRONIZED TRANSCRIPTION BOX */}
              <div className="bg-[#443022] rounded-[32px] p-6 border border-white/10 flex flex-col h-[280px]">
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
                  <div className="flex items-center space-x-2 text-heritage-sand">
                    <Languages className="w-4 h-4 text-heritage-sand" />
                    <span className="text-xs font-black uppercase tracking-widest">Interactive Transcript</span>
                  </div>

                  {/* Language switch toggles */}
                  <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setTranslationLang('lukenye')}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        translationLang === 'lukenye' ? 'bg-heritage-terracotta text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Lukenye
                    </button>
                    <button 
                      onClick={() => setTranslationLang('english')}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        translationLang === 'english' ? 'bg-heritage-terracotta text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => setTranslationLang('both')}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        translationLang === 'both' ? 'bg-heritage-terracotta text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Both
                    </button>
                  </div>
                </div>

                {/* Subtitle scroll box */}
                <div 
                  ref={transcriptionContainerRef}
                  className="flex-grow overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10"
                >
                  {currentTrack.transcription.map((seg, i) => {
                    const isActive = i === activeSegmentIndex;
                    return (
                      <div 
                        key={i}
                        onClick={() => handleSeekToSegment(seg.time)}
                        data-active={isActive ? "true" : "false"}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-300 border text-left flex items-start gap-3 group/line ${
                          isActive 
                            ? 'bg-heritage-terracotta/20 border-heritage-sand text-white shadow-md' 
                            : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-heritage-sand text-heritage-brown font-bold' : 'bg-white/5 text-white/40'
                        }`}>
                          {formatTime(seg.time)}
                        </div>
                        <div className="space-y-1.5 flex-grow">
                          {(translationLang === 'lukenye' || translationLang === 'both') && (
                            <p className={`text-sm leading-relaxed ${isActive ? 'font-serif font-bold text-heritage-sand' : 'font-serif'}`}>
                              {seg.textLukenye}
                            </p>
                          )}
                          {(translationLang === 'english' || translationLang === 'both') && (
                            <p className={`text-xs leading-relaxed ${isActive ? 'text-white font-medium' : 'text-white/50'}`}>
                              {seg.textEnglish}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: SEARCH & TRACK PLAYLIST */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              
              <div className="bg-[#443022] rounded-[40px] p-6 md:p-8 border border-white/10 flex flex-col h-full justify-between">
                
                {/* Search and filtering */}
                <div className="space-y-4 pb-6 border-b border-white/10 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ListMusic className="w-5 h-5 text-heritage-sand" />
                      <span className="text-sm font-black uppercase tracking-widest">Story Collection</span>
                    </div>
                    <span className="text-xs text-white/40 font-mono font-bold uppercase">
                      {filteredTracks.length} recordings
                    </span>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text"
                      placeholder="Search elders, clans, titles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-heritage-sand/50 transition-all"
                    />
                  </div>

                  {/* Pill filters */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['All', 'Migration', 'Language', 'Tradition', 'Crafts'].map((topic) => {
                      const count = topic === 'All' 
                        ? oralHistoryTracks.length 
                        : oralHistoryTracks.filter(t => t.topic === topic).length;
                      return (
                        <button
                          key={topic}
                          onClick={() => setSelectedTopic(topic)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                            selectedTopic === topic 
                              ? 'bg-heritage-sand text-heritage-brown border-heritage-sand font-bold' 
                              : 'bg-white/5 hover:bg-white/10 text-white/60 border-white/5'
                          }`}
                        >
                          {topic} <span className="opacity-40 ml-1 font-mono">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Playlist Tracks List */}
                <div className="flex-grow overflow-y-auto max-h-[380px] pr-2 space-y-3.5 mt-6 scrollbar-thin scrollbar-thumb-white/10">
                  {filteredTracks.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                      <p className="text-sm font-medium">No archived histories match your search.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedTopic('All'); }}
                        className="text-xs text-heritage-sand font-bold uppercase tracking-wider mt-2 hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    filteredTracks.map((track) => {
                      const isSelected = oralHistoryTracks[activeTrackIndex].id === track.id;
                      const trackIndexInMaster = oralHistoryTracks.findIndex(t => t.id === track.id);
                      return (
                        <div 
                          key={track.id}
                          onClick={() => {
                            setActiveTrackIndex(trackIndexInMaster);
                            if (!isPlaying) setIsPlaying(true);
                          }}
                          className={`p-4 rounded-[24px] cursor-pointer transition-all duration-300 border text-left flex items-center gap-4 group/item ${
                            isSelected 
                              ? 'bg-heritage-terracotta text-white border-heritage-sand shadow-lg' 
                              : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {/* Image Thumbnail with overlay hover */}
                          <div className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden shadow-md">
                            <img 
                              src={track.imageUrl} 
                              alt={track.elder} 
                              className="w-full h-full object-cover transition-transform group-hover/item:scale-105"
                            />
                            <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-all ${
                              isSelected ? 'opacity-100 bg-heritage-terracotta/40' : 'opacity-0 group-hover/item:opacity-100'
                            }`}>
                              {isSelected && isPlaying ? (
                                <Pause className="w-5 h-5 text-white fill-white animate-pulse" />
                              ) : (
                                <Play className="w-5 h-5 text-white fill-white" />
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-heritage-sand/20 text-heritage-sand'
                              }`}>
                                {track.topic}
                              </span>
                              <span className="text-[10px] text-white/40 font-mono font-medium">{track.duration}</span>
                            </div>
                            <h4 className={`text-base font-serif font-bold truncate ${isSelected ? 'text-white' : 'text-white'}`}>
                              {track.title}
                            </h4>
                            <p className={`text-xs truncate ${isSelected ? 'text-heritage-sand font-semibold' : 'text-white/60'}`}>
                              {track.elder} <span className="opacity-40">•</span> <span className="font-normal opacity-80">{track.clan}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Simulated listener community notes section */}
                <div className="pt-6 border-t border-white/10 mt-6 shrink-0 flex items-center justify-between text-xs text-white/40 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heritage-sand opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-heritage-sand"></span>
                    </span>
                    <span>Broadcasting Preservation</span>
                  </div>
                  <span className="text-heritage-sand/60">Bakenyi Heritage Project</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Featured Quote Section */}
      <section className="py-24 bg-heritage-cream border-t border-heritage-brown/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-heritage-terracotta/30 mx-auto mb-8" />
          <h2 className="text-3xl font-serif font-bold text-heritage-brown mb-6">Historical Challenges</h2>
          <p className="text-heritage-brown/70 leading-relaxed mb-8 text-lg italic">
            "Through climatic shifts that affected the water levels of Lake Kyoga and the political changes of various Ugandan empires, the Bakenyi maintained a distinct identity by keeping their language and clan systems alive despite being small in number."
          </p>
          <div className="w-16 h-1 bg-heritage-terracotta mx-auto" />
        </div>
      </section>
    </div>
  );
}
