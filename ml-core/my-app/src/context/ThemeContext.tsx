import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName, useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  activeColorScheme: "light" | "dark";
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = "@auralis_theme_mode";

export const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  activeColorScheme: "dark",
  isDark: true,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemHookScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  // Track device native appearance in React state so re-renders occur when device appearance is ready
  const [deviceScheme, setDeviceScheme] = useState<"light" | "dark">(() => {
    const direct = Appearance.getColorScheme();
    if (direct === "dark" || direct === "light") return direct;
    if (systemHookScheme === "dark" || systemHookScheme === "light") return systemHookScheme;
    return "dark";
  });

  // Keep deviceScheme synchronized with native OS appearance
  useEffect(() => {
    const updateScheme = (scheme?: ColorSchemeName | null) => {
      const direct = scheme || Appearance.getColorScheme() || systemHookScheme;
      if (direct === "dark" || direct === "light") {
        setDeviceScheme(direct);
      }
    };

    // Immediate check
    updateScheme();

    // Check again after 100ms in case Android native bridge was initializing
    const timer = setTimeout(() => {
      updateScheme();
    }, 100);

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      updateScheme(colorScheme);
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [systemHookScheme]);

  // Load user saved preference on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.error("Error loading theme preference:", e);
      }
    };
    loadTheme();
  }, []);

  // Compute effective scheme
  const activeColorScheme: "light" | "dark" =
    themeMode === "system" ? deviceScheme : themeMode;
  const isDark = activeColorScheme === "dark";

  // Keep NativeWind in sync
  useEffect(() => {
    setColorScheme(activeColorScheme);
  }, [activeColorScheme, setColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      const target = mode === "system" ? deviceScheme : mode;
      setColorScheme(target);
    } catch (e) {
      console.error("Error setting theme mode:", e);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeColorScheme,
        isDark,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);

