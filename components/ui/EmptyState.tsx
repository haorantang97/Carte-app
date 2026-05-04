import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { palette, handFont, noteFont } from '@/lib/palette';

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
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
      }}
    >
      {icon ? <View style={{ marginBottom: 12, opacity: 0.4 }}>{icon}</View> : null}
      <Text
        style={{
          fontFamily: handFont,
          fontSize: 22,
          color: palette.inkSoft,
          textAlign: 'center',
          lineHeight: 26,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            marginTop: 6,
            fontFamily: noteFont,
            fontSize: 13,
            color: palette.inkMute,
            textAlign: 'center',
            lineHeight: 19,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
