import { Tabs } from 'expo-router';
import { ChefHat, Compass, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BOTTOM_NAV_HEIGHT, BRAND } from '@/lib/constants';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.textPrimary,
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarStyle: {
          backgroundColor: BRAND.background,
          borderTopColor: BRAND.border,
          height: BOTTOM_NAV_HEIGHT + 16,
          paddingTop: 6,
          paddingBottom: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="kitchen"
        options={{
          title: t('tabs.kitchen'),
          tabBarIcon: ({ color, size }) => <ChefHat size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
