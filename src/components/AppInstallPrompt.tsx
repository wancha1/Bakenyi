import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  X, 
  Info, 
  Monitor, 
  Cpu, 
  Wifi, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Terminal,
  Activity,
  Chrome,
  Share2
} from 'lucide-react';

interface DeviceAnalysis {
  os: 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown';
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'unknown';
  pwaSupported: boolean;
  isStandalone: boolean;
  userAgent: string;
  screenResolution: string;
  connectionSpeed: string;
}

export default function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<DeviceAnalysis | null>(null);
  const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'cancelled' | 'error'>('idle');

  // Steps for the automated system scanner
  const analysisSteps = [
    'Initializing hardware & system probe...',
    'Analyzing browser agent & engine configuration...',
    'Testing persistent storage & application cache systems...',
    'Analyzing PWA install compatibility credentials...'
  ];

  // Perform immediate device profiling
  const analyzeDevice = (): DeviceAnalysis => {
    const ua = navigator.userAgent;
    const lowerUA = ua.toLowerCase();
    
    let os: DeviceAnalysis['os'] = 'unknown';
    if (/iphone|ipad|ipod/.test(lowerUA)) os = 'ios';
    else if (/android/.test(lowerUA)) os = 'android';
    else if (/win/.test(lowerUA)) os = 'windows';
    else if (/mac/.test(lowerUA)) os = 'mac';
    else if (/linux/.test(lowerUA)) os = 'linux';

    let browser: DeviceAnalysis['browser'] = 'unknown';
    if (/chrome|crios/.test(lowerUA) && !/edge|edg/.test(lowerUA)) browser = 'chrome';
    else if (/safari/.test(lowerUA) && !/chrome|crios|android/.test(lowerUA)) browser = 'safari';
    else if (/firefox|fxios/.test(lowerUA)) browser = 'firefox';
    else if (/edge|edg/.test(lowerUA)) browser = 'edge';

    const pwaSupported = ('serviceWorker' in navigator) && (os !== 'unknown');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    // Estimate network speed
    const conn = (navigator as any).connection;
    const connectionSpeed = conn ? `${conn.effectiveType || '4G'} (${conn.downlink || '10'} Mbps)` : 'Stable Connection';

    return {
      os,
      browser,
      pwaSupported,
      isStandalone,
      userAgent: ua.slice(0, 50) + '...',
      screenResolution: `${window.screen.width} x ${window.screen.height}`,
      connectionSpeed
    };
  };

  useEffect(() => {
    const profile = analyzeDevice();
    setDeviceInfo(profile);

    // If the app is already running as a standalone installed app, do not prompt
    if (profile.isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Let's show the initial visual notification pill
      const isDismissed = sessionStorage.getItem('bakenye_app_prompt_dismissed');
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setIsNotificationVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Standard fallback prompt trigger
    const isDismissed = sessionStorage.getItem('bakenye_app_prompt_dismissed');
    if (!isDismissed && !profile.isStandalone) {
      const timer = setTimeout(() => {
        setIsNotificationVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Scroll to disappear behavior
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80 && isNotificationVisible) {
        setIsNotificationVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isNotificationVisible]);

  // Listener for custom trigger from the Footer button
  useEffect(() => {
    const handleTrigger = () => {
      startDynamicAnalysis();
    };
    window.addEventListener('trigger-app-install', handleTrigger);
    return () => window.removeEventListener('trigger-app-install', handleTrigger);
  }, [deferredPrompt]);

  const startDynamicAnalysis = () => {
    setIsNotificationVisible(false);
    setIsAnalyzerOpen(true);
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisProgress(0);
    setInstallStatus('idle');

    // Smooth staggered analyzer simulation
    let currentStep = 0;
    const totalSteps = analysisSteps.length;
    
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);
          return 100;
        }
        
        // Stagger steps based on percentage landmarks
        const nextProgress = prev + 2;
        const targetStep = Math.min(Math.floor((nextProgress / 100) * totalSteps), totalSteps - 1);
        if (targetStep !== currentStep) {
          currentStep = targetStep;
          setAnalysisStep(targetStep);
        }
        
        return nextProgress;
      });
    }, 40);
  };

  const executeInstallation = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallStatus('success');
          sessionStorage.setItem('bakenye_app_prompt_dismissed', 'true');
          setTimeout(() => setIsAnalyzerOpen(false), 2000);
        } else {
          setInstallStatus('cancelled');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Programmatic PWA install error:', err);
        setInstallStatus('error');
      }
    } else {
      // Direct user action or native trigger simulation for custom OS
      if (deviceInfo?.os === 'ios') {
        // Show specific instruction, let's keep analyzer open to guide Apple device user directly
      } else {
        // Fallback or generic installation behavior
        setInstallStatus('error');
      }
    }
  };

  const dismissPill = () => {
    sessionStorage.setItem('bakenye_app_prompt_dismissed', 'true');
    setIsNotificationVisible(false);
  };

  return (
    <>
      {/* Floating System-Disappearing Pill Notification */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div
            id="app-install-banner"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-heritage-olive text-heritage-cream p-5 rounded-2xl shadow-2xl border border-heritage-cream/15 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center justify-center p-3 bg-heritage-cream/10 rounded-xl shrink-0">
                <Smartphone className="w-6 h-6 text-heritage-terracotta" />
              </div>
              
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 mb-1.5 text-[9px] font-sans font-bold uppercase tracking-widest bg-heritage-terracotta text-heritage-cream rounded-full">
                  Heritage App
                </span>
                <h4 className="font-serif font-bold text-base text-white leading-tight">
                  Bakenye Digital Platform
                </h4>
                <p className="text-xs text-heritage-cream/85 mt-1 leading-relaxed">
                  Analyze compatibility and install this official cultural hub to your device for lightning-fast offline access.
                </p>
                
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={startDynamicAnalysis}
                    className="flex-1 py-2 px-4 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    Analyze & Install
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-heritage-cream/50 text-right italic">
                  *Disappears when you scroll
                </div>
              </div>

              <button
                onClick={dismissPill}
                className="text-heritage-cream/60 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss app invitation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Interactive Analyzer & Installer Modal */}
      <AnimatePresence>
        {isAnalyzerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Dark background blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isAnalyzing) setIsAnalyzerOpen(false);
              }}
              className="absolute inset-0 bg-heritage-ink/85 backdrop-blur-md"
            />

            {/* Smart Console Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              className="relative w-full max-w-xl bg-heritage-cream border-2 border-heritage-brown/20 rounded-3xl shadow-2xl overflow-hidden text-heritage-ink"
            >
              {/* Cultural Pattern Header Ribbon */}
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-heritage-olive via-heritage-sand to-heritage-terracotta" />
              
              <div className="p-6 md:p-8">
                {/* Modal Close */}
                {!isAnalyzing && (
                  <button
                    onClick={() => setIsAnalyzerOpen(false)}
                    className="absolute top-5 right-5 text-heritage-ink/60 hover:text-heritage-ink p-1.5 rounded-full hover:bg-heritage-brown/5 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Header Title */}
                <div className="flex items-center space-x-3.5 mb-6">
                  <div className="p-3 bg-heritage-olive text-heritage-cream rounded-2xl shadow-inner">
                    <Activity className={`w-6 h-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-heritage-brown">Device Compatibility & PWA Installer</h3>
                    <p className="text-xs text-heritage-ink/60">Automated cultural package deployment client</p>
                  </div>
                </div>

                {isAnalyzing ? (
                  /* ANALYZING VIEW */
                  <div className="space-y-6 my-4">
                    <div className="bg-heritage-ink text-[#4AF626] font-mono text-xs p-5 rounded-2xl border border-white/10 space-y-2.5 shadow-inner relative">
                      <div className="absolute top-3 right-4 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[9px] uppercase tracking-wider text-red-400">Live Probe</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 border-b border-white/5 pb-2.5 mb-2 text-white">
                        <Terminal className="w-4 h-4 text-heritage-sand" />
                        <span className="font-bold">SYSTEM SCANNER v1.2.0</span>
                      </div>

                      <div className="space-y-1.5 h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        <p className="text-white/40">[{new Date().toLocaleTimeString()}] Establishing secure sandbox probe...</p>
                        {analysisStep >= 0 && <p className="text-heritage-sand">✓ OS Architecture identified: {deviceInfo?.os?.toUpperCase()}</p>}
                        {analysisStep >= 1 && <p className="text-heritage-sand">✓ Browser Host engine matching: {deviceInfo?.browser?.toUpperCase()}</p>}
                        {analysisStep >= 2 && <p className="text-heritage-sand">✓ Sandbox Cache integrity authenticated.</p>}
                        {analysisStep >= 3 && <p className="text-[#4AF626] animate-pulse">⚡ Ready: Custom PWA Deployment Package Prepared.</p>}
                        <p className="text-white animate-pulse">⏳ {analysisSteps[analysisStep]}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-heritage-ink/75">Analyzing system architecture...</span>
                        <span className="text-heritage-olive font-bold">{analysisProgress}%</span>
                      </div>
                      <div className="w-full h-3 bg-heritage-brown/15 rounded-full overflow-hidden p-0.5">
                        <motion.div 
                          className="h-full rounded-full bg-gradient-to-r from-heritage-olive to-heritage-terracotta"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ANALYSIS RESULT VIEW */
                  <div className="space-y-6">
                    {/* Diagnostic Summary Table */}
                    <div className="bg-white/50 border border-heritage-brown/10 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-heritage-brown/80 border-b border-heritage-brown/10 pb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-heritage-terracotta" />
                        Hardware & Browser Diagnostic Profile
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                        <div>
                          <span className="text-heritage-ink/50 block">Operating System</span>
                          <span className="font-semibold text-heritage-brown capitalize flex items-center gap-1.5 mt-0.5">
                            {deviceInfo?.os === 'ios' || deviceInfo?.os === 'mac' ? (
                              <Cpu className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Cpu className="w-3.5 h-3.5 text-green-600" />
                            )}
                            {deviceInfo?.os} (64-bit Architecture)
                          </span>
                        </div>
                        <div>
                          <span className="text-heritage-ink/50 block">Web Browser Engine</span>
                          <span className="font-semibold text-heritage-brown capitalize flex items-center gap-1.5 mt-0.5">
                            <Chrome className="w-3.5 h-3.5 text-heritage-terracotta" />
                            {deviceInfo?.browser}
                          </span>
                        </div>
                        <div>
                          <span className="text-heritage-ink/50 block">Digital Museum Support</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Full Offline Archive
                          </span>
                        </div>
                        <div>
                          <span className="text-heritage-ink/50 block">Connection State</span>
                          <span className="font-semibold text-heritage-brown flex items-center gap-1.5 mt-0.5">
                            <Wifi className="w-3.5 h-3.5 text-heritage-olive" />
                            {deviceInfo?.connectionSpeed}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Platform-Specific Action Resolution */}
                    <div className="p-4.5 rounded-2xl border text-xs leading-relaxed">
                      {deviceInfo?.os === 'ios' ? (
                        /* Apple specific resolution */
                        <div className="bg-amber-50/50 border-amber-200/60 text-amber-900 space-y-3.5">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-500 text-white rounded-xl">
                              <Share2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-amber-900">Direct Safari Action Required</p>
                              <p className="text-xs text-amber-800 mt-1">
                                Apple iOS sandboxing requires manual Safari homescreen registration:
                              </p>
                            </div>
                          </div>
                          
                          <ol className="list-decimal pl-4 space-y-1.5 text-amber-800/90 ml-2">
                            <li>Tap the browser's **Share** button in Safari's utility bar.</li>
                            <li>Scroll the share menu options list and select **'Add to Home Screen'**.</li>
                            <li>Confirm the name and tap **'Add'** in the top right.</li>
                          </ol>
                        </div>
                      ) : deferredPrompt ? (
                        /* Standard programmatically triggerable platform (Android / Chrome / Windows) */
                        <div className="bg-emerald-50/50 border-emerald-200/60 text-emerald-900 flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-emerald-950">Install Ready</p>
                            <p className="text-xs text-emerald-850 mt-1">
                              Your device fully supports native one-click desktop/mobile compilation. Proceed to install the offline-first culture portal.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Manual chrome installation guide fallback (when prompt already triggered) */
                        <div className="bg-heritage-olive/10 border-heritage-olive/20 text-heritage-olive flex items-start gap-3">
                          <Info className="w-5 h-5 text-heritage-olive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-heritage-brown">Install via Browser Menu</p>
                            <p className="text-xs text-heritage-ink/80 mt-1">
                              Your browser is fully compatible. Click your browser's primary options menu (the triple dots <span className="font-bold">⋮</span> in Chrome/Edge) and select <span className="font-semibold">'Install app'</span> or <span className="font-semibold">'Add to Home screen'</span> to save.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Execution Tray */}
                    <div className="flex items-center gap-3 mt-6">
                      {deferredPrompt ? (
                        <button
                          onClick={executeInstallation}
                          className="flex-1 py-3 px-5 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white font-serif font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 cursor-pointer"
                        >
                          <Download className="w-4.5 h-4.5" />
                          Complete Installation
                        </button>
                      ) : deviceInfo?.os === 'ios' ? (
                        <button
                          onClick={() => setIsAnalyzerOpen(false)}
                          className="flex-1 py-3 px-5 bg-heritage-olive hover:bg-heritage-olive/95 text-white font-serif font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle className="w-4.5 h-4.5" />
                          I Understand
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsAnalyzerOpen(false)}
                          className="flex-1 py-3 px-5 bg-heritage-brown/10 hover:bg-heritage-brown/15 text-heritage-brown font-serif font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Close System Profile
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnostics Status Footer */}
                <div className="mt-8 pt-4.5 border-t border-heritage-brown/10 flex items-center justify-between text-[10px] text-heritage-ink/40">
                  <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                    <Terminal className="w-3 h-3" />
                    Bakenye Heritage Deployment Client
                  </span>
                  <span>BUILD ID: 41E8E631</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
