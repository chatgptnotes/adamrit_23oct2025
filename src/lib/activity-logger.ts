import { supabase } from "@/integrations/supabase/client";

/**
 * Derive a human-readable description of the current device/browser so audit
 * logs can answer "which device was this saved from". The raw user-agent is
 * always stored on the log row; this returns a friendlier summary that can be
 * embedded in a log's `details` (the Activity Log page renders `details`).
 */
export function getDeviceInfo(): Record<string, string> {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent;

  let os = "Unknown OS";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  const screenSize =
    typeof window !== "undefined" && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : "";

  return {
    label: `${browser} on ${os}`,
    os,
    browser,
    screen: screenSize,
    language: navigator.language || "",
    userAgent: ua,
  };
}

export async function logActivity(action: string, details?: Record<string, any>) {
  try {
    const raw = localStorage.getItem('hmis_user');
    if (!raw) return;
    const user = JSON.parse(raw);
    await (supabase as any).from('user_activity_log').insert({
      user_id: user.id || null,
      user_email: user.email || user.username,
      user_role: user.role,
      hospital_type: user.hospitalType,
      action,
      details: details || {},
      page: window.location.pathname,
      ip_address: null,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
}
