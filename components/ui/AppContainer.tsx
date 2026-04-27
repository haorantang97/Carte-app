import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '@/lib/tw';

interface Props extends ViewProps {
  children: ReactNode;
  topInset?: boolean;
  bottomInset?: boolean;
}

export function AppContainer({
  children,
  topInset = true,
  bottomInset = true,
  style,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        tw`flex-1 bg-bg`,
        {
          paddingTop: topInset ? insets.top : 0,
          paddingBottom: bottomInset ? insets.bottom : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
