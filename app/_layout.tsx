import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { I18nextProvider } from 'react-i18next';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { ensureSession, ensureProfile } from '@/lib/auth';
import i18n, { initI18n } from '@/lib/i18n';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { useRealtimeOrderStatus } from '@/hooks/realtime/useRealtimeOrderStatus';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24,
});

function RealtimeBridge() {
  useRealtimeOrderStatus();
  return null;
}

export default function RootLayout() {
  const [bootDone, setBootDone] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initI18n();
        const session = await ensureSession();
        if (session?.user.id) {
          await ensureProfile(session.user.id).catch(() => {});
        }
      } catch (e) {
        console.warn('[boot]', e);
      } finally {
        if (mounted) setBootDone(true);
        ExpoSplashScreen.hideAsync().catch(() => {});
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const showSplash = !bootDone || !splashDone;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="chef" />
                <Stack.Screen name="diner" />
                <Stack.Screen name="dish/[id]" />
                <Stack.Screen name="profile/edit" />
              </Stack>
              <RealtimeBridge />
              {showSplash && <SplashScreen onDone={() => setSplashDone(true)} />}
              <StatusBar style="dark" />
              <Toast />
            </BottomSheetModalProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
