"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff, Download, X, HeartPulse, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 2. Register Service Worker safely
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log("[MediPulse PWA] New version available.");
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn("[MediPulse PWA] Service Worker registration skipped/failed:", error);
          });
      });
    }

    // 3. Online/Offline network state handlers
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored.", {
        icon: <Wifi className="h-4 w-4 text-emerald-500" />,
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are offline. Server & DB operations require network.", {
        icon: <WifiOff className="h-4 w-4 text-rose-500" />,
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 4. Capture beforeinstallprompt event for PWA installation
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user previously dismissed within 7 days
      const dismissedTime = localStorage.getItem("medipulse_pwa_dismissed_at");
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < sevenDays) {
        setShowPrompt(false);
      } else {
        // Delay display slightly so it doesn't disrupt initial load
        setTimeout(() => {
          setShowPrompt(true);
        }, 2500);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.removeItem("medipulse_pwa_dismissed_at");
      toast.success("MediPulse App successfully installed!", {
        icon: <CheckCircle2 className="h-4 w-4 text-teal-500" />,
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowPrompt(false);
      } else {
        localStorage.setItem("medipulse_pwa_dismissed_at", Date.now().toString());
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("Install prompt failed:", err);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("medipulse_pwa_dismissed_at", Date.now().toString());
    setShowPrompt(false);
  };

  // Do not render anything if running standalone or prompt is inactive
  if (isStandalone || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-teal-500/30 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md dark:border-teal-500/40 dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-md shadow-brand-500/20">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold tracking-tight text-white">
                  Install MediPulse App
                </h4>
                <span className="rounded-md bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300">
                  PWA
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300">
                Install on your device for seamless, fast hospital access & offline resilience.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleInstallClick}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-teal-500/20 transition-all hover:brightness-110 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Install Application
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
