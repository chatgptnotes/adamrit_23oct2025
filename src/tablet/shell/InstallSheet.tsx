import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { useInstallPrompt } from "@/tablet/hooks/useInstallPrompt";

const DISMISS_KEY = "adamrit_install_nudge_dismissed";

/**
 * One-time bottom sheet nudging the user to install the app to their home
 * screen. Shows once (remembered in localStorage), only when install is
 * available and the app isn't already running standalone. Chromium gets a
 * one-tap install button; iOS gets the Share → Add to Home Screen steps.
 */
export function InstallSheet() {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone) return;
    if (!canInstall && !isIOS) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    // Let the app settle before interrupting.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [canInstall, isIOS, isStandalone]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const handleInstall = async () => {
    await promptInstall();
    dismiss();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
              <Smartphone className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold">Install Adamrit</h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Add Adamrit to your home screen for a full-screen, app-like experience
          that launches instantly.
        </p>

        {canInstall ? (
          <button
            type="button"
            onClick={handleInstall}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-all active:scale-95"
          >
            <Download className="h-5 w-5" />
            Install app
          </button>
        ) : (
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
                Choose{" "}
                <strong className="text-foreground">Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-foreground">
                3
              </span>
              <span>
                Tap <strong className="text-foreground">Add</strong> — it opens
                fullscreen.
              </span>
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 h-10 w-full rounded-xl text-sm font-medium text-muted-foreground active:scale-95"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
