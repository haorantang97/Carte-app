import { forwardRef } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { SketchBox } from '@/components/ui/sketch';
import { palette, handFont, noteFont } from '@/lib/palette';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Sketch seed for stable wobble shape */
  seed?: number;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, hint, style, seed = 5, ...rest },
  ref,
) {
  return (
    <View>
      {label ? (
        <Text
          style={{
            fontFamily: handFont,
            fontSize: 16,
            color: palette.ink,
            marginBottom: 6,
            lineHeight: 18,
          }}
        >
          {label}
        </Text>
      ) : null}
      <SketchBox
        radius={12}
        seed={seed}
        color={error ? '#A30000' : palette.ink}
        fillColor={palette.paper}
        style={{ paddingHorizontal: 14, paddingVertical: 10 }}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={palette.inkMute}
          style={[
            {
              fontFamily: handFont,
              fontSize: 18,
              color: palette.ink,
              padding: 0,
              minHeight: 24,
            },
            style,
          ]}
          {...rest}
        />
      </SketchBox>
      {error ? (
        <Text
          style={{
            fontFamily: noteFont,
            fontSize: 12,
            color: '#A30000',
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={{
            fontFamily: noteFont,
            fontSize: 12,
            color: palette.inkSoft,
            marginTop: 4,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
