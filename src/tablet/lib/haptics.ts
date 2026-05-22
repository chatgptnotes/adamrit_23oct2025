/**
 * Tiny haptic-feedback helper for the tablet edition. `navigator.vibrate` is
 * supported on Android/Chromium only — iOS Safari ignores it, so these calls
 * are silent no-ops there (progressive enhancement, never throws).
 */
function vibrate(pattern: number | number[]): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore — vibration is best-effort */
    }
  }
}

export const haptics = {
  /** Light tick — taps, tab switches. */
  tap: () => vibrate(8),
  /** Confirmation — a refresh completed, a save succeeded. */
  success: () => vibrate([10, 30, 10]),
  /** Warning — destructive or blocked action. */
  warn: () => vibrate([20, 40, 20]),
};
