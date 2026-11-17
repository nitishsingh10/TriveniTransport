import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Appearance } from 'react-native';
import { DarkColors, LightColors, type ThemeColors, type ThemeMode } from '@/constants/theme';

interface AppThemeValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'triveni_customer_theme_mode';
const ThemeContext = createContext<AppThemeValue>({
  mode: 'light',
  colors: LightColors,
  setMode: async () => {},
});

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(() => Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
  const userChangedMode = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedMode) => {
        if (!active || userChangedMode.current) return;
        if (savedMode === 'light' || savedMode === 'dark') setModeState(savedMode);
      })
      .catch((error) => console.warn('Could not load theme preference:', error));
    return () => { active = false; };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    userChangedMode.current = true;
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn('Could not save theme preference:', error);
    }
  }, []);

  const colors = useMemo(() => mode === 'dark' ? DarkColors : LightColors, [mode]);
  const value = useMemo(() => ({ mode, colors, setMode }), [mode, colors, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppThemeValue {
  return useContext(ThemeContext);
}

export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T): T {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
