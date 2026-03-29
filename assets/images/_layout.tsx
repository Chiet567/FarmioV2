import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/authcontext";

// --------------------------------------------
// PROTECTION DES ROUTES
// --------------------------------------------
const RouteGuard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const segment = segments[0] as string;

    if (!user && segment === "(tabs)") {
      //
      router.replace("./screens/loginscreen");
    } else if (user && segment === "screens") {
      // ✅ Connecté → redirige vers home
      router.replace("/");
    }
  }, [user, segments]);

  return null;
};

// --------------------------------------------
// LAYOUT PRINCIPAL
// --------------------------------------------
export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Pages principales */}
        <Stack.Screen name="(tabs)" />

        {/* Pages auth */}
        <Stack.Screen name="screens/loginscreen" />
        <Stack.Screen name="screens/registerscreen" />
        <Stack.Screen name="screens/forgetpassword" />
      </Stack>
    </AuthProvider>
  );
}
