import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StartupScreen />
    </ClerkProvider>
  );
}

function StartupScreen() {
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    const startApp = async () => {
      // Hide the native Expo splash
      await SplashScreen.hideAsync();

      // Show your custom splash screen
      setTimeout(() => {
        setIsStarting(false);
      }, 1000);
    };

    startApp();
  }, []);

  if (isStarting) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Image
          source={require("../assets/images/splash2.png")}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </View>
    );
  }

  return <Slot />;
}
