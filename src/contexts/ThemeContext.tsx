import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SiteTheme = 'dark' | 'light';

export interface ThemeOption {
  id: SiteTheme;
  label: string;
  swatch: string[];
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'dark', label: 'Classic Dark', swatch: ['#12161f', '#4a8bf0', '#1c2230', '#e8edf5'] },
  { id: 'light', label: 'Light / White', swatch: ['#ffffff', '#2848b8', '#e5e9f0', '#16223a'] },
];

const DARK_THEMES: SiteTheme[] = ['dark'];
const VALID_THEMES = THEME_OPTIONS.map((t) => t.id);

interface ThemeContextType {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => Promise<void>;
  options: ThemeOption[];
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeToDom = (theme: SiteTheme) => {
  const root = window.document.documentElement;
  root.setAttribute('data-theme', theme);
  const isDark = DARK_THEMES.includes(theme);
  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
};

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: SiteTheme;
}> = ({ children, defaultTheme = 'dark' }) => {
  const [theme, setThemeState] = useState<SiteTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('site-theme') as SiteTheme | null;
      if (stored && VALID_THEMES.includes(stored)) return stored;
    }
    return defaultTheme;
  });

  // Apply instantly on change (first paint uses localStorage value)
  useEffect(() => {
    applyThemeToDom(theme);
    localStorage.setItem('site-theme', theme);
  }, [theme]);

  // Load global theme + subscribe to realtime updates
  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('active_theme')
        .eq('id', 1)
        .maybeSingle();
      if (active && data?.active_theme && VALID_THEMES.includes(data.active_theme as SiteTheme)) {
        setThemeState(data.active_theme as SiteTheme);
      }
    };
    load();

    const channel = supabase
      .channel('site-settings-theme')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          const next = (payload.new as { active_theme?: string })?.active_theme;
          if (next && VALID_THEMES.includes(next as SiteTheme)) {
            setThemeState(next as SiteTheme);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const setTheme = useCallback(async (newTheme: SiteTheme) => {
    // optimistic local apply
    setThemeState(newTheme);
    const { error } = await supabase
      .from('site_settings')
      .update({ active_theme: newTheme })
      .eq('id', 1);
    if (error) {
      toast.error('Failed to update theme. Only Master Admin can change it.');
    }
  }, []);

  const resolvedTheme: 'light' | 'dark' = DARK_THEMES.includes(theme) ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, options: THEME_OPTIONS, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
