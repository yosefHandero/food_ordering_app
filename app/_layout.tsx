import {SplashScreen, Stack} from "expo-router";
import "./global.css"
import {useFonts} from "expo-font";
import {useEffect} from "react";

 export default function RootLayout() {
   const [fontsLoaded, error] = useFonts({
     "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
     "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
     "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
     "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
     "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
   });
   useEffect(() => {
     if (error) throw error;
     if(fontsLoaded) SplashScreen.hideAsync();
   }, [fontsLoaded, error]);

   return <Stack screenOptions={{headerShown:false}}/>
}
