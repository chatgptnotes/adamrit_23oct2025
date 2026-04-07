import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { HospitalType, getHospitalConfig } from '@/types/hospital';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, comparePassword, validateEmail, sanitizeInput, signupRateLimiter } from '@/utils/auth';
import { logActivity } from '@/lib/activity-logger';

// Separate anon client for User table lookups — not affected by OAuth session RLS
const supabaseAnon = createClient(
  'https://xvkxccqaopbnkvwgyfjv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

interface User {
  id?: string;
  email: string;
  username: string;
  role: 'superadmin' | 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'user' | 'marketing_manager' | 'receptionist' | 'lab_technician' | 'pharmacy' | 'pharmacist' | 'radiology' | 'radiology_tech' | 'ot_tech' | 'cath_lab_tech' | 'billing' | 'housekeeping' | 'security' | 'driver' | 'physiotherapist' | 'lab' | 'reception' | 'maintenance' | 'hr' | 'quality' | 'consultant' | 'front_office';
  hospitalType: HospitalType;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  signup: (userData: { email: string; password: string; role: string; hospitalType: HospitalType }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hospitalType: HospitalType | null;
  hospitalConfig: ReturnType<typeof getHospitalConfig>;
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
  showHospitalSelection: boolean;
  setShowHospitalSelection: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showHospitalSelection, setShowHospitalSelection] = useState<boolean>(false);

  // Handle Google OAuth session - look up email in User table using anon client to bypass RLS
  const handleGoogleSession = async (email: string) => {
    const googleEmail = email.toLowerCase();
    console.log('Processing Google session for:', googleEmail);

    const { data, error } = await supabaseAnon
      .from('User')
      .select('*')
      .ilike('email', googleEmail)
      .single();

    if (error || !data) {
      console.error('Google user not found in User table:', googleEmail, error);
      // Do NOT aggressively sign out — just stop loading and let login page show
      setIsAuthLoading(false);
      return;
    }

    const appUser: User = {
      id: data.id,
      email: data.email,
      username: data.email.split('@')[0],
      role: data.role,
      hospitalType: data.hospital_type || 'hope'
    };

    setUser(appUser);
    localStorage.setItem('hmis_user', JSON.stringify(appUser));
    localStorage.setItem('hmis_visited', 'true');
    setShowLanding(false);
    setIsAuthLoading(false);

    // Clean up the URL after processing OAuth callback (hash tokens or PKCE code)
    if (window.location.hash.includes('access_token') || new URLSearchParams(window.location.search).has('code')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    (supabase as any).from('User').update({ last_login_at: new Date().toISOString() }).eq('id', data.id).then(() => {});
    logActivity('user_login', { email: appUser.email, role: appUser.role, hospital: appUser.hospitalType, method: 'google' });
  };

  // Single unified initialization effect
  useEffect(() => {
    // Step 1: Restore saved session from localStorage
    const savedUser = localStorage.getItem('hmis_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Backward compatibility: add hospitalType if missing
        if (!parsed.hospitalType) {
          if (parsed.username === 'ayushman') {
            parsed.hospitalType = 'ayushman';
            parsed.hospitalName = 'ayushman';
          } else {
            parsed.hospitalType = 'hope';
            parsed.hospitalName = 'hope';
          }
        }
        if (!parsed.role) {
          parsed.role = parsed.username === 'admin' ? 'admin' : 'user';
        }
        setUser(parsed);
      } catch {
        localStorage.removeItem('hmis_user');
      }
    }

    // Step 2: Handle landing page visibility
    const hasVisited = localStorage.getItem('hmis_visited');
    if (hasVisited) setShowLanding(false);

    // Step 3: If we already have a saved user, stop loading immediately
    if (savedUser) {
      setIsAuthLoading(false);
      return;
    }

    // Step 4: No saved user — check for Supabase auth session (Google OAuth)
    // This handles BOTH fresh OAuth callbacks and existing sessions
    let resolved = false;

    const processOAuthSession = async (email: string) => {
      if (resolved) return;
      resolved = true;
      await handleGoogleSession(email);
    };

    const finishLoading = () => {
      if (!resolved) {
        resolved = true;
        setIsAuthLoading(false);
      }
    };

    // Register auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.email);
      if (session?.user?.email && !resolved) {
        await processOAuthSession(session.user.email);
      }
    });

    // Also check existing session (covers case where exchange already completed)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email && !resolved) {
        await processOAuthSession(session.user.email);
      } else if (!resolved) {
        // Give onAuthStateChange 1.5 seconds to fire SIGNED_IN
        // This covers PKCE exchange that's still in progress
        setTimeout(async () => {
          if (resolved) return;
          // Final check
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (finalSession?.user?.email) {
            await processOAuthSession(finalSession.user.email);
          } else {
            finishLoading();
          }
        }, 1500);
      }
    });

    // Safety timeout
    const safetyTimeout = setTimeout(finishLoading, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Database authentication
  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      // Staff pin login: blank email + @XXXX password
      const isStaffPin = !credentials.email.trim() && credentials.password.startsWith('@') && credentials.password.length === 5;

      let data: any = null;
      let error: any = null;

      if (isStaffPin) {
        const pin = credentials.password.substring(1); // Remove @ prefix
        console.log('Staff pin login attempt');
        const result = await supabase
          .from('User')
          .select('*')
          .eq('staff_pin', pin)
          .eq('hospital_type', 'ayushman')
          .single();
        data = result.data;
        error = result.error;
      } else {
        console.log('Login attempt for:', credentials.email);
        const result = await supabase
          .from('User')
          .select('*')
          .ilike('email', credentials.email.trim())
          .single();
        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        console.error('Login error:', error);
        return false;
      }

      // Staff pin login: pin already verified by the query, skip password check
      if (!isStaffPin) {
        console.log('User found, checking password...');

        // Check if password is hashed (new users) or plain text (existing users)
        let isPasswordValid = false;

        if (data.password.startsWith('$2')) {
          // Hashed password - use bcrypt compare with setTimeout to prevent UI blocking
          isPasswordValid = await new Promise<boolean>((resolve) => {
            setTimeout(async () => {
              const result = await comparePassword(credentials.password, data.password);
              resolve(result);
            }, 10);
          });
        } else {
          // Plain text password - direct comparison (for backward compatibility)
          isPasswordValid = data.password === credentials.password;
        }

        if (!isPasswordValid) {
          console.error('Invalid password');
          return false;
        }
      }

      const appUser: User = {
        id: data.id,
        email: data.email,
        username: data.email.split('@')[0], // Use email prefix as username
        role: data.role,
        hospitalType: data.hospital_type || 'hope'
      };

      setUser(appUser);
      localStorage.setItem('hmis_user', JSON.stringify(appUser));

      // Update last_login_at
      (supabase as any).from('User').update({ last_login_at: new Date().toISOString() }).eq('id', data.id).then(() => {});

      // Log activity
      logActivity('user_login', { email: appUser.email, role: appUser.role, hospital: appUser.hospitalType });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Google OAuth login
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      console.error('Google login error:', error);
    }
  }, []);

  // Signup functionality
  const signup = async (userData: { email: string; password: string; role: string; hospitalType: HospitalType }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Rate limiting check
      const clientIP = 'default'; // In production, get actual client IP
      if (!signupRateLimiter.isAllowed(clientIP)) {
        const remainingTime = Math.ceil(signupRateLimiter.getRemainingTime(clientIP) / 1000 / 60);
        return { success: false, error: `Too many signup attempts. Please try again in ${remainingTime} minutes.` };
      }

      // Validate email
      const emailValidation = validateEmail(userData.email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(userData.email.toLowerCase());
      const sanitizedRole = sanitizeInput(userData.role);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', sanitizedEmail)
        .single();

      if (existingUser) {
        return { success: false, error: 'Email already exists. Please use a different email.' };
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Insert new user
      const { error } = await supabase
        .from('User')
        .insert([
          {
            email: sanitizedEmail,
            password: hashedPassword,
            role: sanitizedRole,
            hospital_type: userData.hospitalType
          }
        ]);

      if (error) {
        console.error('Signup error:', error);
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Email already exists. Please use a different email.' };
        }
        return { success: false, error: error.message || 'Failed to create account' };
      }

      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hmis_user');
    setShowHospitalSelection(false);
    // Also sign out of Supabase Auth (for Google OAuth sessions)
    supabase.auth.signOut().catch(() => {});
  }, []);

  const hospitalConfig = useMemo(() => getHospitalConfig(user?.hospitalType), [user?.hospitalType]);

  const value: AuthContextType = useMemo(() => ({
    user,
    login,
    loginWithGoogle,
    signup,
    logout,
    isAuthenticated: !!user,
    isAuthLoading,
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    hospitalType: user?.hospitalType || null,
    hospitalConfig,
    showLanding,
    setShowLanding,
    showHospitalSelection,
    setShowHospitalSelection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, isAuthLoading, hospitalConfig, showLanding, showHospitalSelection]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
