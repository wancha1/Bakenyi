import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, HelpCircle, ArrowRight, Share2, Info, Monitor, Layers } from 'lucide-react';

export default function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // Detect Device Type
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show the pop-up notification if they haven't explicitly dismissed it this session
      const isDismissed = sessionStorage.getItem('bakenye_app_prompt_dismissed');
      if (!isDismissed) {
        // Delay the presentation slightly for better user experience
        const timer = setTimeout(() => {
          setIsNotificationVisible(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also trigger public prompt availability even without native beforeinstallprompt 
    // (e.g. for iOS or Safari where the native event doesn't fire but PWA is supported)
    const isDismissed = sessionStorage.getItem('bakenye_app_prompt_dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsNotificationVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Hide pop-up notification on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80 && isNotificationVisible) {
        setIsNotificationVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isNotificationVisible]);

  // Listen for custom trigger from the Footer or elsewhere
  useEffect(() => {
    const handleTriggerInstall = () => {
      triggerInstall();
    };

    window.addEventListener('trigger-app-install', handleTriggerInstall);
    return () => window.removeEventListener('trigger-app-install', handleTriggerInstall);
  }, [deferredPrompt]);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          sessionStorage.setItem('bakenye_app_prompt_dismissed', 'true');
          setIsNotificationVisible(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA prompt execution failed, fallback to modal:', err);
        setIsInstructionModalOpen(true);
      }
    } else {
      // Fallback instruction modal for iOS or unsupported browsers
      setIsInstructionModalOpen(true);
    }
  };

  const dismissNotification = () => {
    sessionStorage.setItem('bakenye_app_prompt_dismissed', 'true');
    setIsNotificationVisible(false);
  };

  return (
    <>
      {/* Scroll-Disappearing Floating Pop-up Notification */}
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
                  Add this digital archive to your home screen for lightning-fast offline access and a full museum experience.
                </p>
                
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={triggerInstall}
                    className="flex-1 py-2 px-4 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install Web App
                  </button>
                  <button
                    onClick={() => setIsInstructionModalOpen(true)}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-heritage-cream rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Guide
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-heritage-cream/50 text-right italic">
                  *Disappears when you scroll
                </div>
              </div>

              <button
                onClick={dismissNotification}
                className="text-heritage-cream/60 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss app invitation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Step-by-Step Installation Instruction Modal */}
      <AnimatePresence>
        {isInstructionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Modal Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInstructionModalOpen(false)}
              className="absolute inset-0 bg-heritage-ink/80 backdrop-blur-sm"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-heritage-cream border border-heritage-brown/20 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden text-heritage-ink"
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-heritage-olive via-heritage-sand to-heritage-terracotta" />
              
              <button
                onClick={() => setIsInstructionModalOpen(false)}
                className="absolute top-5 right-5 text-heritage-ink/60 hover:text-heritage-ink p-1.5 rounded-full hover:bg-heritage-brown/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-heritage-olive text-heritage-cream rounded-xl">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-heritage-brown">Install Bakenye App</h3>
                  <p className="text-xs text-heritage-ink/60">Follow these instructions to download our cultural hub.</p>
                </div>
              </div>

              {/* Tabs for different operating systems */}
              <div className="flex bg-heritage-brown/5 p-1 rounded-xl gap-1 mb-6">
                <button
                  onClick={() => setDeviceType('ios')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deviceType === 'ios' 
                      ? 'bg-heritage-olive text-white shadow-sm' 
                      : 'text-heritage-ink/70 hover:text-heritage-ink hover:bg-heritage-brown/5'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  iPhone & iPad
                </button>
                <button
                  onClick={() => setDeviceType('android')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deviceType === 'android' 
                      ? 'bg-heritage-olive text-white shadow-sm' 
                      : 'text-heritage-ink/70 hover:text-heritage-ink hover:bg-heritage-brown/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Android Phone
                </button>
                <button
                  onClick={() => setDeviceType('desktop')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    deviceType === 'desktop' 
                      ? 'bg-heritage-olive text-white shadow-sm' 
                      : 'text-heritage-ink/70 hover:text-heritage-ink hover:bg-heritage-brown/5'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop Mac/PC
                </button>
              </div>

              {/* Content dynamically loaded based on active device type */}
              <div className="space-y-6">
                {deviceType === 'ios' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        On Apple iOS, standard progressive apps must be installed manually through the native **Safari web browser**.
                      </p>
                    </div>
                    
                    <ol className="space-y-4 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Open in Safari</p>
                          <p className="text-xs text-heritage-ink/75">Ensure you are currently reading this platform in Safari.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown flex items-center gap-1.5">
                            Tap the Share Button <Share2 className="w-4 h-4 text-heritage-terracotta inline" />
                          </p>
                          <p className="text-xs text-heritage-ink/75">Locate the Share icon in Safari's lower navigation tray (or upper top on iPad).</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Select 'Add to Home Screen'</p>
                          <p className="text-xs text-heritage-ink/75">Scroll down the share menu list and tap 'Add to Home Screen'.</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {deviceType === 'android' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-heritage-olive/10 border border-heritage-olive/20 rounded-xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-heritage-olive shrink-0 mt-0.5" />
                      <p className="text-xs text-heritage-olive leading-relaxed">
                        Android browsers (such as Chrome, Samsung Internet, and Firefox) support native, clean one-tap installations.
                      </p>
                    </div>

                    <ol className="space-y-4 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Tap Option Dots</p>
                          <p className="text-xs text-heritage-ink/75">Look at the browser toolbar's top-right corner and click the triple dots menu.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Select 'Install app'</p>
                          <p className="text-xs text-heritage-ink/75">Find and tap **'Install app'** or **'Add to Home Screen'** in the list.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Confirm and Create</p>
                          <p className="text-xs text-heritage-ink/75">Click 'Install' or accept the pop-up to place the Bakenyi icon in your app drawer.</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {deviceType === 'desktop' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-heritage-olive/10 border border-heritage-olive/20 rounded-xl flex items-start gap-2.5">
                      <Monitor className="w-4 h-4 text-heritage-olive shrink-0 mt-0.5" />
                      <p className="text-xs text-heritage-olive leading-relaxed">
                        Run our digital archives in a standalone, borderless desktop window directly from your dock or taskbar.
                      </p>
                    </div>

                    <ol className="space-y-4 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Check the Address Bar</p>
                          <p className="text-xs text-heritage-ink/75">Look at the right side of Chrome or Edge's URL bar for a computer screen with an arrow icon.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-heritage-olive text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <div className="mt-0.5">
                          <p className="font-semibold text-heritage-brown">Or Click Install Below</p>
                          <p className="text-xs text-heritage-ink/75">If your browser supports it, click the manual installer directly:</p>
                          {deferredPrompt ? (
                            <button
                              onClick={triggerInstall}
                              className="mt-2.5 py-1.5 px-4 bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Install Custom App
                            </button>
                          ) : (
                            <p className="mt-1.5 text-[11px] text-heritage-ink/50 italic">
                              *Native installer is hidden (if already installed or running on an older browser).
                            </p>
                          )}
                        </div>
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Footer info in Modal */}
              <div className="mt-8 pt-5 border-t border-heritage-brown/10 flex items-center justify-between text-xs text-heritage-ink/50">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Supports offline reading
                </span>
                <span>Version 1.2.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
