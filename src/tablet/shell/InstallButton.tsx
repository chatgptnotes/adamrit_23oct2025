import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "@/tablet/hooks/useInstallPrompt";

/**
 * One-tap "Install app" button for the tablet top bar.
 * - Chromium (HTTPS): triggers the native install dialog directly.
 * - iOS Safari: shows a short Share → Add to Home Screen hint.
 * - Hidden when already installed/standalone or when install is unavailable.
 */
export function InstallButton() {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [showHint, setShowHint] = useState(false);

  if (isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  const btnClass =
    "flex h-11 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-95";

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={promptInstall}
        aria-label="Install app"
        className={btnClass}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">INSTALL</span>
      </button>
    );
  }

  // iOS fallback — Safari has no beforeinstallprompt.
  return (
    <>
      <button
        type="button"
        onClick={() => setShowHint(true)}
        aria-label="How to install app"
        className={btnClass}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">INSTALL</span>
      </button>

      {showHint ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowHint(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Install on iPhone / iPad</h2>
              <button
                type="button"
                onClick={() => setShowHint(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-foreground">
                  1
                </span>
                <span className="flex items-center gap-1">
                  Tap the Share icon
                  <Share className="inline h-4 w-4" />
                  in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-foreground">
                  2
                </span>
                <span>
                  Choose <strong className="text-foreground">Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-foreground">
                  3
                </span>
                <span>
                  Tap <strong className="text-foreground">Add</strong> — the app opens fullscreen.
                </span>
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}
