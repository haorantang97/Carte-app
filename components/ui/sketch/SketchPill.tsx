import { ReactNode } from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';

import { BRAND } from '@/lib/constants';
import tw from '@/lib/tw';

import { HandPathBorder } from './HandPathBorder';
import { WobbleLevel } from './handPath';

interface Props {
  children?: ReactNode;
  /** When provided, renders as a pressable; tap fires this. */
  onPress?: () => void;
  active?: boolean;
  seed?: number;
  wobble?: WobbleLevel;
  /** Override label color (defaults to brand text). */
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Hand-drawn pill (radius=999). Renders text children as a centered label and
 * forwards object/array children unmodified for callers that want icons too.
 */
export function SketchPill({
  children,
  onPress,
  active = false,
  seed = 1,
  wobble = 'soft',
  color = BRAND.textPrimary,
  style,
  testID,
}: Props) {
  const inner = (
    <View
      style={[
        tw`px-3.5 flex-row items-center`,
        { paddingTop: 6, paddingBottom: 6, gap: 6, alignSelf: 'flex-start' },
        style,
      ]}
    >
      <HandPathBorder
        radius={999}
        seed={seed}
        strokeWidth={active ? 2 : 1.3}
        wobble={wobble}
        color={color}
      />
      {active ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, opacity: 0.55 }}
        >
          <HandPathBorder
            radius={999}
            seed={seed + 1}
            strokeWidth={1}
            wobble={wobble}
            color={color}
          />
        </View>
      ) : null}
      {typeof children === 'string' ? (
        <Text
          style={[
            { color, fontSize: 14, fontWeight: active ? '700' : '400' },
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={6}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}
