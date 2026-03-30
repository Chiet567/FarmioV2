// app/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/authcontext";
import { ThemeProvider } from "../src/themecontext";

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || isLoading) return;

    const firstSegment  = segments[0];
    const secondSegment = segments[1] || "";
    const inAuthGroup   = firstSegment === "screens";
    const inTabsGroup   = firstSegment === "(tabs)";

    const protectedScreens = ["addproduit", "forgetpassword", "profilpro", "admindashboard"];
    const inProtectedScreen = inAuthGroup && protectedScreens.includes(secondSegment);

    if (!user && !inAuthGroup) {
      router.replace("/screens/loginscreen");
    } else if (user) {
      // Admin → admin dashboard
      if (user.role === "admin" && !inAuthGroup) {
        router.replace("/screens/admindashboard");
        return;
      }
      // All other logged-in users → tabs
      if (!inTabsGroup && !inProtectedScreen) {
        router.replace("/(tabs)");
      }
    }
  }, [user, segments, isReady, isLoading]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#16a34a" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <>{children}</>;
};

const AppLayout = () => (
  <RouteGuard>
    <Slot />
  </RouteGuard>
);

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
