import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
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
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { LongCang_400Regular } from '@expo-google-fonts/long-cang';
import { ZCOOLXiaoWei_400Regular } from '@expo-google-fonts/zcool-xiaowei';
import { ZCOOLKuaiLe_400Regular } from '@expo-google-fonts/zcool-kuaile';
import { MaShanZheng_400Regular } from '@expo-google-fonts/ma-shan-zheng';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Kalam_400Regular, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { ensureSession, ensureProfile } from '@/lib/auth';
import i18n, { initI18n } from '@/lib/i18n';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { useRealtimeOrderStatus } from '@/hooks/realtime/useRealtimeOrderStatus';
import { useRealtimeOrders } from '@/hooks/realtime/useRealtimeOrders';
import { useChefOrders } from '@/hooks/chef/useChefOrders';

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

/**
 * Chef-side realtime bridge — 永远活跃。订阅 chef 的所有 menu_group 新订单,
 * 推 toast + 本地通知 + invalidate cache。这样 chef 在任何 tab(kitchen/orders/...)
 * 都能即时收到新订单。
 */
function ChefRealtimeBridge() {
  const { data: orders } = useChefOrders();
  const groupIds = useMemo(
    () => Array.from(new Set((orders ?? []).map((o) => o.menu_group_id))),
    [orders],
  );
  useRealtimeOrders(groupIds);
  return null;
}

export default function RootLayout() {
  const [bootDone, setBootDone] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    LongCang_400Regular,
    ZCOOLXiaoWei_400Regular,
    ZCOOLKuaiLe_400Regular,
    MaShanZheng_400Regular,
    Caveat_400Regular,
    Caveat_700Bold,
    Kalam_400Regular,
    Kalam_700Bold,
  });

  // Once fonts load, set Inter as the default fontFamily for every <Text>
  // (and TextInput, since RN routes its text through Text). Avoids touching
  // every component while still letting individual styles override.
  useEffect(() => {
    if (!fontsLoaded) return;
    const TextAny = Text as unknown as {
      defaultProps?: { style?: unknown };
    };
    TextAny.defaultProps = TextAny.defaultProps ?? {};
    TextAny.defaultProps.style = [
      { fontFamily: 'Inter_400Regular' },
      TextAny.defaultProps.style,
    ];
  }, [fontsLoaded]);

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

  const showSplash = !bootDone || !splashDone || !fontsLoaded;

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
              <ChefRealtimeBridge />
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
