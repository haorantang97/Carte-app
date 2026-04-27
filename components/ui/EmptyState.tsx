import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import tw from '@/lib/tw';

export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <View style={tw`flex-1 items-center justify-center px-6 py-12`}>
      {icon && <View style={tw`mb-3 opacity-40`}>{icon}</View>}
      <Text style={tw`text-base text-gray-700 text-center`}>{title}</Text>
      {subtitle && (
        <Text style={tw`mt-1 text-xs text-gray-500 text-center`}>{subtitle}</Text>
      )}
    </View>
  );
}
