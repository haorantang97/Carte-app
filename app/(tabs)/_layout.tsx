import { Tabs } from 'expo-router';

/**
 * Tabs layout — but the visible tab bar is rendered inside each screen via
 * <SketchBottomTabs /> to match the Vite prototype's sticky sketch-pill
 * design. We simply hide the default expo-router tab bar here.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="kitchen" />
      <Tabs.Screen name="orders" />
    </Tabs>
  );
}
