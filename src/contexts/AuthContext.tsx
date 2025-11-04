import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HospitalType, getHospitalConfig } from '@/types/hospital';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, comparePassword, validateEmail, sanitizeInput, signupRateLimiter } from '@/utils/auth';

interface User {
  id?: string;
  email: string;
  username: string;
  role: 'admin' | 'doctor' | 'nurse' | 'user';
  hospitalType: HospitalType;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  signup: (userData: { email: string; password: string; role: 'admin' | 'doctor' | 'nurse' | 'user'; hospitalType: HospitalType }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
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
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showHospitalSelection, setShowHospitalSelection] = useState<boolean>(false);

  // Check for saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('hmis_user');
    const hasVisitedBefore = localStorage.getItem('hmis_visited');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Add hospitalType if missing (for backward compatibility)
      if (!parsedUser.hospitalType) {
        // For backward compatibility, determine hospital type from username
        if (parsedUser.username === 'ayushman') {
          parsedUser.hospitalType = 'ayushman';
          parsedUser.hospitalName = 'ayushman';
        } else {
          parsedUser.hospitalType = 'hope'; // default fallback
          parsedUser.hospitalName = 'hope';
        }
      }
      if (!parsedUser.role) {
        parsedUser.role = parsedUser.username === 'admin' ? 'admin' : 'user';
      }
      setUser(parsedUser);
    }
    
    // Show landing page only for first-time visitors
    if (hasVisitedBefore) {
      setShowLanding(false);
    }
  }, []);

  // Database authentication
  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .single();

      if (error || !data) {
        console.error('Login error:', error);
        return false;
      }

      // Check if password is hashed (new users) or plain text (existing users)
      let isPasswordValid = false;
      
      if (data.password.startsWith('$2')) {
        // Hashed password - use bcrypt compare
        isPasswordValid = await comparePassword(credentials.password, data.password);
      } else {
        // Plain text password - direct comparison (for backward compatibility)
        isPasswordValid = data.password === credentials.password;
      }

      if (!isPasswordValid) {
        console.error('Invalid password');
        return false;
      }

      const user: User = {
        id: data.id,
        email: data.email,
        username: data.email.split('@')[0], // Use email prefix as username
        role: data.role,
        hospitalType: data.hospital_type || 'hope'
      };

      setUser(user);
      localStorage.setItem('hmis_user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Signup functionality
  const signup = async (userData: { email: string; password: string; role: 'admin' | 'doctor' | 'nurse' | 'user'; hospitalType: HospitalType }): Promise<{ success: boolean; error?: string }> => {
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hmis_user');
    setShowHospitalSelection(false);
  };

  // 🚨 DEBUG: Check hospital config creation
  console.log('🔍 AUTH DEBUG: user =', user);
  console.log('🔍 AUTH DEBUG: user?.hospitalType =', user?.hospitalType);
  const hospitalConfig = getHospitalConfig(user?.hospitalType);
  console.log('🔍 AUTH DEBUG: hospitalConfig =', hospitalConfig);

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hospitalType: user?.hospitalType || null,
    hospitalConfig,
    showLanding,
    setShowLanding,
    showHospitalSelection,
    setShowHospitalSelection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};