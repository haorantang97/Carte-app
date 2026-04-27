import { forwardRef } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import tw from '@/lib/tw';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, hint, style, ...rest },
  ref,
) {
  return (
    <View>
      {label ? (
        <Text style={tw`text-xs font-medium text-gray-700 mb-1.5`}>{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#A3A3A3"
        style={[
          tw.style(
            'bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-900',
            error ? 'border-red-400' : 'border-gray-300',
          ),
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={tw`mt-1 text-[11px] text-red-600`}>{error}</Text>
      ) : hint ? (
        <Text style={tw`mt-1 text-[11px] text-gray-500`}>{hint}</Text>
      ) : null}
    </View>
  );
});
