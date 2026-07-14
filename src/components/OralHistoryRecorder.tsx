import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Trash2, 
  CloudLightning, 
  CheckCircle2, 
  User, 
  Users, 
  BookOpen, 
  FileAudio, 
  Loader2, 
  ShieldAlert,
  AlertCircle,
  Clock,
  AudioLines
} from 'lucide-react';
import { getSupabase, getSupabaseConfig } from '../lib/supabaseClient';
import { createContribution, uploadAudioFile } from '../lib/supabase';

interface ElderMetadata {
  elderName: string;
  clanName: string;
  approxAge: string;
  topic: string;
  location: string;
  description: string;
  contributorName: string;
}

const BAKENYI_CLANS = [
  'Abanyalye', 'Abasinda', 'Abasoko', 'Abagweri', 'Abakerenge', 
  'Abakoma', 'Abasaba', 'Abawungwe', 'Abasongora', 'Other'
];

export default function OralHistoryRecorder({ onRecordingSubmitted }: { onRecordingSubmitted?: () => void }) {
  const supabase = getSupabase();
  const { isConfigured } = getSupabaseConfig();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Form state
  const [metadata, setMetadata] = useState<ElderMetadata>({
    elderName: '',
    clanName: BAKENYI_CLANS[0],
    approxAge: '',
    topic: '',
    location: '',
    description: '',
    contributorName: ''
  });

  // Recorder states
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback states
  const [isPlayingBack, setIsPlayingBack] = useState(false);

  // Refs for audio capturing & visualizing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync current user session
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUser(session?.user || null);
        if (session?.user?.email) {
          setMetadata(prev => ({ 
            ...prev, 
            contributorName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '' 
          }));
        }
        setIsAuthChecking(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user || null);
        if (session?.user?.email) {
          setMetadata(prev => ({ 
            ...prev, 
            contributorName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '' 
          }));
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      setIsAuthChecking(false);
    }
  }, [supabase]);

  // Handle timer ticks
  useEffect(() => {
    if (recordingStatus === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recordingStatus]);

  // Clean up canvas and media stream on unmount
  useEffect(() => {
    return () => {
      stopCanvasVisualization();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start microphone capture & MediaRecorder
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyzing API for drawing
      setupCanvasVisualization(stream);

      const options = MediaRecorder.isTypeSupported('audio/webm') 
        ? { mimeType: 'audio/webm' } 
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const playbackUrl = URL.createObjectURL(recordedBlob);
        setAudioBlob(recordedBlob);
        setPreviewUrl(playbackUrl);
        setRecordingStatus('stopped');
        stopCanvasVisualization();
      };

      mediaRecorder.start();
      setRecordingTime(0);
      setRecordingStatus('recording');
    } catch (err: any) {
      console.error('Audio recording failed:', err);
      setErrorMessage("Could not access microphone. Please allow microphone permissions and try again.");
    }
  };

  // Pause ongoing recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
    }
  };

  // Resume paused recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
    }
  };

  // Stop recording and process chunks
  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingStatus === 'recording' || recordingStatus === 'paused')) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Discard and reset
  const discardRecording = () => {
    stopCanvasVisualization();
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setAudioBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    setRecordingStatus('idle');
    setIsPlayingBack(false);
  };

  // Live Wave Visualizer via canvas API
  const setupCanvasVisualization = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      drawWaveform();
    } catch (e) {
      console.error('Failed to configure audio visualizer:', e);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = analyser.frequencyBinCount;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgba(253, 251, 247, 0.9)'; // Heritage soft cream background
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Custom Terracotta gradient bar coloring
        canvasCtx.fillStyle = `rgb(${211 - barHeight}, ${91 + barHeight / 2}, 68)`; 
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  const stopCanvasVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  // Preview Player play/pause toggle
  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingBack) {
      audioPlayerRef.current.pause();
      setIsPlayingBack(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingBack(true);
    }
  };

  // Submit Oral History to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBlob) {
      setErrorMessage("Please capture an audio recording before submitting.");
      return;
    }
    if (!metadata.elderName.trim() || !metadata.topic.trim()) {
      setErrorMessage("Elder's Name and Topic are required fields.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMessage(null);

    try {
      const cleanElderName = metadata.elderName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `elder_interview_${cleanElderName}_${Date.now()}.webm`;
      
      setUploadProgress(50);
      
      // Upload audio file blob
      const { url: audioUrl, error: uploadErr } = await uploadAudioFile(audioBlob, fileName);
      if (uploadErr) throw uploadErr;

      setUploadProgress(80);

      // Create rich contribution metadata
      const descBlock = `
        🗣️ INTERVIEWEE: ${metadata.elderName}
        🛡️ CLAN / TOTEM: ${metadata.clanName}
        🎂 ESTIMATED AGE: ${metadata.approxAge || 'Unknown'}
        📍 GEOGRAPHIC ORIGIN: ${metadata.location || 'Bakenyi Territory'}
        
        📜 CONTEXT SUMMARY:
        ${metadata.description || 'No summary text provided.'}
        
        🎤 CONSOLIDATED BY: ${metadata.contributorName || 'Heritage Contributor'}
      `.trim().replace(/ {2,}/g, ' ');

      const title = `[Oral History] ${metadata.topic} (by ${metadata.elderName})`;
      
      const { error: dbErr } = await createContribution(
        title,
        descBlock,
        'audio',
        audioUrl,
        currentUser?.email || 'contributor@bakenye.com',
        currentUser?.id || 'anonymous_elder_session'
      );

      if (dbErr) throw dbErr;

      setUploadProgress(100);
      setIsUploading(false);
      setUploadSuccess(true);
      
      if (onRecordingSubmitted) {
        onRecordingSubmitted();
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || "Failed to submit oral history recording. Using offline emulated sandbox save.");
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    discardRecording();
    setMetadata({
      elderName: '',
      clanName: BAKENYI_CLANS[0],
      approxAge: '',
      topic: '',
      location: '',
      description: '',
      contributorName: currentUser?.email?.split('@')[0] || ''
    });
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  return (
    <div id="oral-history-container" className="bg-white dark:bg-slate-900 border border-heritage-brown/5 dark:border-slate-800/60 rounded-[32px] p-6 md:p-10 shadow-sm overflow-hidden text-left max-w-4xl mx-auto">
      
      {/* Dynamic Progress Indicator */}
      {isUploading && (
        <div className="mb-6 bg-heritage-cream/20 dark:bg-slate-800/40 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-heritage-terracotta animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-heritage-brown/60 dark:text-slate-400">
              Archiving Story and Uploading Audio Clip ({uploadProgress}%)
            </span>
          </div>
          <div className="w-32 bg-heritage-brown/10 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className="bg-heritage-terracotta h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {uploadSuccess ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-6 space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-serif font-black text-heritage-brown dark:text-slate-200">Interview Submitted Successfully!</h3>
            <p className="text-sm text-heritage-brown/60 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your audio interview with <strong>{metadata.elderName}</strong> has been secured in the Supabase media vault. The Elder Council will review and approve the transcript shortly.
            </p>
          </div>
          <button 
            onClick={handleReset}
            className="px-8 py-3 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-md cursor-pointer"
          >
            Record Another Interview
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section A: Description and Header */}
          <div className="border-b border-heritage-brown/5 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <AudioLines className="w-6 h-6 text-heritage-terracotta" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-heritage-terracotta">Elder Council Archive Initiative</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-heritage-brown dark:text-slate-100">Oral History Recorder</h2>
            <p className="text-sm text-heritage-brown/60 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Preserve the fading wisdom of Bakenyi cultural custodians. Connect a microphone, enter the elder's details, capture the discussion, and broadcast it to the digital library database.
            </p>
          </div>

          {/* Errors */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400 font-semibold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Core Recording Interface Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Visualizer & Tape Controls */}
            <div className="lg:col-span-5 bg-heritage-cream/20 dark:bg-slate-800/20 border border-heritage-brown/10 dark:border-slate-800 rounded-[28px] p-6 flex flex-col justify-between space-y-6 relative overflow-hidden min-h-[340px]">
              
              {/* Dynamic blinking record status tag */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/40 dark:text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Interview Length
                </span>
                
                <div className="flex items-center gap-2">
                  {recordingStatus === 'recording' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    recordingStatus === 'recording' ? 'text-red-500' :
                    recordingStatus === 'paused' ? 'text-amber-500' :
                    'text-heritage-brown/40 dark:text-slate-500'
                  }`}>
                    {recordingStatus}
                  </span>
                </div>
              </div>

              {/* Time display */}
              <div className="text-center py-4">
                <h1 className="text-5xl font-mono font-bold tracking-tight text-heritage-brown dark:text-slate-100">
                  {formatDuration(recordingTime)}
                </h1>
              </div>

              {/* Visualizer Frame */}
              <div className="relative h-28 bg-heritage-cream/30 dark:bg-slate-800/40 border border-heritage-brown/5 dark:border-slate-700/40 rounded-2xl overflow-hidden flex items-center justify-center">
                {recordingStatus === 'recording' || recordingStatus === 'paused' ? (
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={300} height={112} />
                ) : previewUrl ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center">
                    <FileAudio className="w-8 h-8 text-heritage-olive animate-pulse" />
                    <p className="text-[10px] font-black text-heritage-olive uppercase tracking-widest">Audio Track Recorded & Ready</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 text-center text-heritage-brown/30 dark:text-slate-500">
                    <Mic className="w-8 h-8 opacity-60" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Audio Input</p>
                  </div>
                )}
              </div>

              {/* Tape Controller Buttons */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-heritage-brown/5 dark:border-slate-800">
                {recordingStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2.5 shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span>Begin Recording</span>
                  </button>
                )}

                {recordingStatus === 'recording' && (
                  <>
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex-1 py-4.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex-1 py-4.5 bg-heritage-brown dark:bg-slate-700 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Finish</span>
                    </button>
                  </>
                )}

                {recordingStatus === 'paused' && (
                  <>
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex-1 py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex-1 py-4.5 bg-heritage-brown dark:bg-slate-700 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Finish</span>
                    </button>
                  </>
                )}

                {recordingStatus === 'stopped' && (
                  <div className="w-full space-y-4">
                    {previewUrl && (
                      <div className="bg-white dark:bg-slate-800 border border-heritage-brown/5 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={togglePlayback}
                          className="w-12 h-12 rounded-full bg-heritage-olive/10 hover:bg-heritage-olive/20 text-heritage-olive flex items-center justify-center transition-all cursor-pointer"
                        >
                          {isPlayingBack ? <Pause className="w-5 h-5 fill-heritage-olive" /> : <Play className="w-5 h-5 fill-heritage-olive ml-0.5" />}
                        </button>
                        <div className="flex-grow">
                          <p className="text-[10px] font-black uppercase tracking-wider text-heritage-brown/50 dark:text-slate-400">Preview Recorded Interview</p>
                          <audio 
                            ref={audioPlayerRef} 
                            src={previewUrl} 
                            onPlay={() => setIsPlayingBack(true)}
                            onPause={() => setIsPlayingBack(false)}
                            onEnded={() => setIsPlayingBack(false)}
                            className="hidden" 
                          />
                          <p className="text-[11px] text-heritage-brown/30 dark:text-slate-500 font-mono">Tap player to listen</p>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="w-full py-4.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Discard & Re-Record</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Elder Profile Metadata Intake Form */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="flex items-center gap-2.5 pb-2 border-b border-heritage-brown/5 dark:border-slate-800">
                <Users className="w-4 h-4 text-heritage-terracotta" />
                <span className="text-[10px] font-black uppercase tracking-widest text-heritage-brown/60 dark:text-slate-400">Elder Profile & Context</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Elder's Full Name *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Mzee Wanume Moses"
                    value={metadata.elderName}
                    onChange={(e) => setMetadata({ ...metadata, elderName: e.target.value })}
                    className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Clan / Lineage *</label>
                  <select 
                    value={metadata.clanName}
                    onChange={(e) => setMetadata({ ...metadata, clanName: e.target.value })}
                    className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200"
                  >
                    {BAKENYI_CLANS.map(clan => (
                      <option key={clan} value={clan}>{clan}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Approximate Age (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 78 years"
                    value={metadata.approxAge}
                    onChange={(e) => setMetadata({ ...metadata, approxAge: e.target.value })}
                    className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Geographic Origin / Territory</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Namasagali, Kamuli District"
                    value={metadata.location}
                    onChange={(e) => setMetadata({ ...metadata, location: e.target.value })}
                    className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Historical Topic of Discussion *</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. The settlement along Lake Kyoga basin in the early 1900s"
                  value={metadata.topic}
                  onChange={(e) => setMetadata({ ...metadata, topic: e.target.value })}
                  className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Interview Log / Detailed Description</label>
                <textarea 
                  rows={4}
                  placeholder="Summarize the core lineage stories, key names, wars, migration paths, or traditional sayings discussed in this segment..."
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-heritage-brown/60 dark:text-slate-400 ml-1">Recorded By (Your Name)</label>
                <input 
                  type="text" 
                  placeholder="Enter your name"
                  value={metadata.contributorName}
                  onChange={(e) => setMetadata({ ...metadata, contributorName: e.target.value })}
                  className="w-full px-5 py-3.5 bg-heritage-cream/10 dark:bg-slate-800/40 border-2 border-heritage-brown/5 dark:border-slate-700/60 focus:border-heritage-terracotta/20 rounded-2xl outline-none transition-all font-medium text-heritage-brown dark:text-slate-200"
                />
              </div>

            </div>

          </div>

          {/* Guidelines info callout */}
          <div className="bg-heritage-olive/10 dark:bg-slate-800/40 p-5 rounded-2xl flex items-start gap-3 border border-heritage-olive/10">
            <BookOpen className="w-5 h-5 text-heritage-olive shrink-0 mt-0.5" />
            <div className="text-xs text-heritage-brown/70 dark:text-slate-400 space-y-1">
              <p className="font-bold text-heritage-olive">Interview Guide & Ethical Guidelines</p>
              <p className="leading-relaxed">
                Ensure proper verbal consent is captured at the beginning of the interview. Speak clearly, minimize wind and background noise, and avoid speaking over the elder.
              </p>
            </div>
          </div>

          {/* Form Actions footer */}
          <div className="pt-6 border-t border-heritage-brown/5 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-heritage-brown/40 dark:text-slate-500 max-w-sm leading-relaxed">
              Upon submission, the audio will be saved securely to the Supabase Media storage bucket and mapped to a pending contribution registry.
            </p>
            
            <button
              type="submit"
              disabled={isUploading || !audioBlob}
              className={`w-full sm:w-auto px-10 py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                !audioBlob 
                  ? 'bg-heritage-brown/10 text-heritage-brown/30 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
                  : 'bg-heritage-terracotta text-white hover:bg-heritage-terracotta/90 shadow-lg shadow-heritage-terracotta/15 hover:shadow-xl'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Interview...</span>
                </>
              ) : (
                <>
                  <span>Submit Oral History Archive</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
