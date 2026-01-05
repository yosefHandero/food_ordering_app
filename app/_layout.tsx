import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import useAuthStore from "@/store/auth.state";
import "./global.css";

export default function RootLayout() {
  // Use selector to only get the function, not subscribe to state changes
  const fetchAuthenticatedUser = useAuthStore(
    (state) => state.fetchAuthenticatedUser
  );

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
  });

  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      // Don't throw - allow app to continue with system fonts
    }
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch((err) => {
        console.error("Error hiding splash screen:", err);
      });
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    fetchAuthenticatedUser().catch((err) => {
      console.error("Error fetching authenticated user:", err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only wait for fonts, not authentication
  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
