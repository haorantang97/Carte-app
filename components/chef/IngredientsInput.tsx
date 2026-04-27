import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react-native';
import tw from '@/lib/tw';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}

export function IngredientsInput({ value, onChange, label }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  };

  const remove = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  return (
    <View>
      {label ? (
        <Text style={tw`text-xs font-medium text-gray-700 mb-1.5`}>{label}</Text>
      ) : null}

      {value.length > 0 ? (
        <View style={tw`flex-row flex-wrap gap-1.5 mb-2`}>
          {value.map((item) => (
            <Pressable
              key={item}
              onPress={() => remove(item)}
              style={tw`flex-row items-center bg-gray-100 rounded-full pl-3 pr-2 py-1.5`}
            >
              <Text style={tw`text-xs text-gray-700`}>{item}</Text>
              <View style={tw`ml-1.5 w-4 h-4 rounded-full bg-gray-300 items-center justify-center`}>
                <X size={10} color="#525252" />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={tw`flex-row items-center gap-2`}>
        <View style={tw`flex-1`}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('chef.continueAdding')}
            placeholderTextColor="#A3A3A3"
            onSubmitEditing={add}
            blurOnSubmit={false}
            returnKeyType="done"
            style={tw`bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900`}
          />
        </View>
        <Pressable
          onPress={add}
          disabled={!draft.trim()}
          style={({ pressed }) => [
            tw`w-12 h-12 items-center justify-center bg-gray-900 rounded-lg`,
            { opacity: !draft.trim() ? 0.4 : pressed ? 0.7 : 1 },
          ]}
        >
          <Plus size={16} color="white" />
        </Pressable>
      </View>
      <Text style={tw`mt-1 text-[11px] text-gray-500`}>
        {t('chef.clickToAddIngredient')}
      </Text>
    </View>
  );
}
