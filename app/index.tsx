import { Redirect } from 'expo-router';

/**
 * Entry route: bounces straight to the (tabs) group.
 * The Splash overlay (rendered in _layout.tsx) covers the brief redirect.
 */
export default function Index() {
  return <Redirect href="/(tabs)/kitchen" />;
}
