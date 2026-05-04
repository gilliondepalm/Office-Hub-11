import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ConnectionErrorScreen } from "@/components/ConnectionErrorScreen";
import { ConnectionLostBanner } from "@/components/ConnectionLostBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PendingQueueBadge } from "@/components/PendingQueueBadge";
import { QueueReplayToast } from "@/components/QueueReplayToast";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ConnectionBannerProvider } from "@/lib/ConnectionBannerContext";
import { OfflineQueueProvider } from "@/lib/OfflineQueueContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthGate() {
  const { user, loading, connectionError, retryConnection } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || connectionError) return;
    const inAuth = segments[0] === "login";
    if (!user && !inAuth) {
      router.replace("/login");
    } else if (user && inAuth) {
      router.replace("/");
    }
  }, [user, loading, connectionError, segments, router]);

  if (connectionError) {
    return <ConnectionErrorScreen onRetry={retryConnection} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
      <ConnectionLostBanner />
      <PendingQueueBadge />
      <QueueReplayToast />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <ConnectionBannerProvider>
                  <OfflineQueueProvider>
                    <AuthGate />
                  </OfflineQueueProvider>
                </ConnectionBannerProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
