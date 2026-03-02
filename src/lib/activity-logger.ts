import { supabase } from "@/integrations/supabase/client";

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
