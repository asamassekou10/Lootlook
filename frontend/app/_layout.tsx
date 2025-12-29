/**
 * Root Layout - Premium dark theme with providers
 */

import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import { useOnboardingStore } from "../src/stores/onboardingStore";
import { colors } from "../src/theme";

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to let Zustand hydrate from AsyncStorage
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inOnboarding = segments[0] === "onboarding";
    const inTabs = segments[0] === "(tabs)";

    if (!hasCompletedOnboarding && !inOnboarding) {
      // First-time user - redirect to onboarding
      router.replace("/onboarding");
    } else if (hasCompletedOnboarding && inOnboarding) {
      // Returning user on onboarding screen - redirect to main app
      router.replace("/(tabs)");
    }
  }, [hasCompletedOnboarding, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: "slide_from_bottom",
      }}
    >
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="result"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootLayoutNav />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
