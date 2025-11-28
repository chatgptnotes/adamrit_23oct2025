import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { HospitalConfig } from '@/types/hospital';

interface ThemeContextType {
  hospitalConfig: HospitalConfig;
  applyHospitalTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { hospitalConfig } = useAuth();

  const applyHospitalTheme = React.useCallback(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for hospital theme
    root.style.setProperty('--hospital-primary', hospitalConfig.primaryColor);
    root.style.setProperty('--hospital-secondary', hospitalConfig.secondaryColor);
    root.style.setProperty('--hospital-accent', hospitalConfig.accentColor);
    root.style.setProperty('--hospital-sidebar-bg', hospitalConfig.theme.sidebarBg);
    root.style.setProperty('--hospital-header-bg', hospitalConfig.theme.headerBg);
    root.style.setProperty('--hospital-card-bg', hospitalConfig.theme.cardBg);
    root.style.setProperty('--hospital-text-primary', hospitalConfig.theme.textPrimary);
    root.style.setProperty('--hospital-text-secondary', hospitalConfig.theme.textSecondary);
    
    // Update document title and favicon
    document.title = `${hospitalConfig.name} - Hospital Management System`;
    
    // Update favicon if it exists
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = hospitalConfig.favicon;
    }
  }, [hospitalConfig]);

  // Apply theme on mount and when hospital config changes
  React.useEffect(() => {
    applyHospitalTheme();
  }, [applyHospitalTheme]);

  const value: ThemeContextType = {
    hospitalConfig,
    applyHospitalTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};