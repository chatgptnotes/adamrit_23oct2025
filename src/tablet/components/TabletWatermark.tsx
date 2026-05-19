import { useAuth } from "@/contexts/AuthContext";

/**
 * Faint Hope-branded logo watermark for the tablet "lobby" screens
 * (home dashboard). Decorative only — pointer events are disabled and it is
 * hidden from assistive tech.
 *
 * Renders nothing unless the signed-in user's hospital is Hope, so the
 * Ayushman tenant is completely unaffected.
 *
 * The parent screen must be a positioned stacking context (`relative isolate`)
 * so the `-z-10` watermark sits behind the content but above the page bg.
 */
export function TabletWatermark() {
  const { user } = useAuth();
  if (user?.hospitalType !== "hope") return null;

  return (
    <img
      src="/hope-hospital-logo-mark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="tablet-watermark pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[min(92%,880px)] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.09]"
    />
  );
}
