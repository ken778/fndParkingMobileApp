import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'appTheme'; // "light" | "dark"

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!mounted) return;
        setIsDark(saved === 'dark');
      } catch (e) {
        // If storage read fails, just stay on default.
        console.warn('Failed to load theme:', e);
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = async (nextIsDark) => {
    setIsDark(nextIsDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  };

  const toggleTheme = () => setTheme(!isDark);

  const colors = useMemo(() => {
    if (isDark) {
      return {
        background: '#0B0F14',
        surface: '#121922',
        card: '#151E29',
        text: '#E8EEF6',
        subtext: '#A8B3C2',
        border: '#263244',
        primary: '#6EA8FF',
        danger: '#FF6B6B',
      };
    }
    return {
      background: '#f5f5f5',
      surface: '#ffffff',
      card: '#ffffff',
      text: '#222222',
      subtext: '#666666',
      border: '#eeeeee',
      primary: '#4285F4',
      danger: '#ff4444',
    };
  }, [isDark]);

  const value = useMemo(
    () => ({ isDark, hydrated, colors, setTheme, toggleTheme }),
    [isDark, hydrated, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

