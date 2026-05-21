import { useCallback, useEffect, useState } from "react";

/**
 * The `beforeinstallprompt` event (Chromium). Not in the standard lib DOM types,
 * so we declare the minimal shape we use.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface InstallPromptState {
  /** True when the browser can show a native install dialog (Chromium, HTTPS). */
  canInstall: boolean;
  /** iOS Safari — no `beforeinstallprompt`; user installs via Share → Add to Home Screen. */
  isIOS: boolean;
  /** App is already running as an installed/standalone app. */
  isStandalone: boolean;
  /** Trigger the native install dialog. No-op if unavailable. */
  promptInstall: () => Promise<void>;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Macintosh but has touch.
  const iPadOS = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches;
  // iOS exposes navigator.standalone.
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mql || iosStandalone;
}

/**
 * Surfaces install state for an in-app "Install app" button. The deferred
 * `beforeinstallprompt` event is captured early by an inline script in
 * index.html (it can fire before React mounts) and stashed on `window`.
 */
export function useInstallPrompt(): InstallPromptState {
  const [canInstall, setCanInstall] = useState<boolean>(
    typeof window !== "undefined" && !!window.__deferredInstallPrompt,
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone());
  const isIOS = detectIOS();

  useEffect(() => {
    const onReady = () => setCanInstall(true);
    const onInstalled = () => {
      setCanInstall(false);
      setIsStandalone(true);
    };
    window.addEventListener("installpromptready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    // Re-check in case the event arrived before this effect ran.
    if (window.__deferredInstallPrompt) setCanInstall(true);
    setIsStandalone(detectStandalone());
    return () => {
      window.removeEventListener("installpromptready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const evt = window.__deferredInstallPrompt;
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice;
    } finally {
      window.__deferredInstallPrompt = null;
      setCanInstall(false);
    }
  }, []);

  return { canInstall, isIOS, isStandalone, promptInstall };
}
