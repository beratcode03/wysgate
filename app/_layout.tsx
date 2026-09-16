import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { VaultProvider } from '@/components/VaultProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Geri', animation: 'fade', animationDuration: 220, presentation: 'card', contentStyle: { backgroundColor: '#09090B' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="vault" />
      <Stack.Screen name="new" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="security" />
      <Stack.Screen name="generator" />
      <Stack.Screen name="entry/[id]" />
    </Stack>
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
        <VaultProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            {Platform.OS === 'web' ? <RootLayoutNav /> : <KeyboardProvider><RootLayoutNav /></KeyboardProvider>}
          </GestureHandlerRootView>
        </VaultProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
