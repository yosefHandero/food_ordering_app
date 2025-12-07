import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

import useAuthStore from "@/store/auth.state";
import './global.css';



export default function RootLayout() {
  // Use selector to only get the function, not subscribe to state changes
  const fetchAuthenticatedUser = useAuthStore((state) => state.fetchAuthenticatedUser);

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  // Fetch user in background - don't block app access
  useEffect(() => {
    fetchAuthenticatedUser().catch(() => {
      // Silently fail - user can browse without auth
    });
    // fetchAuthenticatedUser is a stable function reference from Zustand, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only wait for fonts, not authentication
  if (!fontsLoaded) return null;

  return <Stack screenOptions={{headerShown: false}}/>
}
