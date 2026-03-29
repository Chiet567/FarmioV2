import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/authcontext";
import { ThemeProvider } from "../src/themecontext";

// --------------------------------------------
// PROTECTION DES ROUTES
// --------------------------------------------
const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // ici tu peux garder ton useEffect de navigation...

  if (!isReady || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#16a34a",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <>{children}</>;
};

// --------------------------------------------
// APP LAYOUT
// --------------------------------------------
const AppLayout = () => {
  return (
    <RouteGuard>
      <Slot />
    </RouteGuard>
  );
};

// --------------------------------------------
// ROOT LAYOUT
// --------------------------------------------
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}
