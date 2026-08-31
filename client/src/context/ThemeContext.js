import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('system'); // 'system' | 'light' | 'dark'

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const storedPref = await AsyncStorage.getItem('@theme_pref');
      if (storedPref) {
        setThemePreference(storedPref);
      }
    } catch (e) {
      console.error('[Theme] Failed to load local theme preference', e);
    }
  };

  const updateTheme = async (preference, isLoggedIn = false) => {
    try {
      setThemePreference(preference);
      await AsyncStorage.setItem('@theme_pref', preference);

      if (isLoggedIn) {
        await api.patch('/theme', { themePreference: preference });
      }
    } catch (e) {
      console.error('[Theme] Failed to update theme', e);
    }
  };

  const getActiveTheme = () => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themePreference === 'dark' ? darkTheme : lightTheme;
  };

  const activeTheme = getActiveTheme();

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themePreference,
        setThemePreference: updateTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
