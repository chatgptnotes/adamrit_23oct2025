/**
 * Device-aware routing — decides whether a browser sees the desktop full site
 * or the touch (tablet) edition. Same URL for both; this is the only switch.
 *
 * Pure and synchronous so it can be called during render in App.tsx without a
 * flash. A manual override (localStorage) always wins over auto-detection.
 */

export type DeviceClass = "mobile" | "tablet" | "desktop";

/** localStorage key for the manual override: 'full' | 'tablet'. */
const OVERRIDE_KEY = "adamrit_ui_mode";

/**
 * Classify the current device from screen width, pointer type and userAgent.
 * Touch laptops (coarse pointer, wide screen) classify as desktop by design —
 * the manual override covers that exception.
 */
export function classifyDevice(): DeviceClass {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const ua = navigator.userAgent;

  // iPadOS 13+ reports a Mac userAgent — a real Mac has maxTouchPoints 0.
  const isIpad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const isAndroidPhone = /Android/.test(ua) && /Mobile/.test(ua);
  const isIphone = /iPhone|iPod/.test(ua);

  if (isIphone || isAndroidPhone || (coarse && w <= 600)) return "mobile";
  if (isIpad || (/Android/.test(ua) && coarse) || (coarse && w <= 1024)) {
    return "tablet";
  }
  return "desktop";
}

/** Read the saved manual override, if any. */
export function readOverride(): "full" | "tablet" | null {
  try {
    const v = localStorage.getItem(OVERRIDE_KEY);
    return v === "full" || v === "tablet" ? v : null;
  } catch {
    return null;
  }
}

/** Save (or clear) the manual override. Pass null to return to auto-detection. */
export function setOverride(mode: "full" | "tablet" | null): void {
  try {
    if (mode) localStorage.setItem(OVERRIDE_KEY, mode);
    else localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    /* localStorage unavailable — fall back to auto-detection */
  }
}

/** Device class with the manual override applied. */
export function getEffectiveDeviceClass(): DeviceClass {
  const o = readOverride();
  if (o === "full") return "desktop";
  if (o === "tablet") return "tablet";
  return classifyDevice();
}

/** True when this device should see the touch (tablet) edition. */
export function shouldUseTabletEdition(): boolean {
  return getEffectiveDeviceClass() !== "desktop";
}
