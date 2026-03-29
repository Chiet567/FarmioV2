import React, { createContext, ReactNode, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export const lightTheme = {
  dark: false,
  bg: "#f9fafb",
  card: "#ffffff",
  text: "#111827",
  muted: "#9ca3af",
  border: "#e5e7eb",
  divider: "#f3f4f6",
  headerBg: "#16a34a",
  inputBg: "#f9fafb",
  tabBar: "#ffffff",
  tabBarBorder: "#f3f4f6",
  textLight: "#6b7280",
  cardBg: "#ffffff",
  primary: "#10b981",
};

export const darkTheme = {
  dark: true,
  bg: "#0f172a",
  card: "#1e293b",
  text: "#f1f5f9",
  muted: "#64748b",
  border: "#334155",
  divider: "#1e293b",
  headerBg: "#14532d",
  inputBg: "#0f172a",
  tabBar: "#1e293b",
  tabBarBorder: "#334155",
  textLight: "#9ca3af",
  cardBg: "#1f2937",
  primary: "#10b981",
};

export type AppTheme = typeof lightTheme;

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  const toggleTheme = () => setIsDark((prev) => !prev);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
