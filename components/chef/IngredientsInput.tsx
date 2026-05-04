import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react-native';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchPill, SketchCircle } from '@/components/ui/sketch';
import { palette, handFont, noteFont } from '@/lib/palette';

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
        <Text
          style={{
            fontFamily: handFont,
            fontSize: 16,
            color: palette.ink,
            marginBottom: 8,
            lineHeight: 18,
          }}
        >
          {label}
        </Text>
      ) : null}

      {value.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10,
          }}
        >
          {value.map((item, i) => (
            <Tappable
              key={item}
              feedback="press"
              onPress={() => remove(item)}
            >
              <SketchPill seed={600 + i} style={{ paddingTop: 4, paddingBottom: 4 }}>
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 14,
                    color: palette.ink,
                  }}
                >
                  {item}
                </Text>
                <X size={11} color={palette.inkSoft} strokeWidth={2} />
              </SketchPill>
            </Tappable>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SketchBox
            radius={12}
            seed={650}
            fillColor={palette.paper}
            style={{ paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('chef.continueAdding')}
              placeholderTextColor={palette.inkMute}
              onSubmitEditing={add}
              blurOnSubmit={false}
              returnKeyType="done"
              style={{
                fontFamily: handFont,
                fontSize: 16,
                color: palette.ink,
                padding: 0,
                minHeight: 24,
              }}
            />
          </SketchBox>
        </View>
        <Tappable
          feedback="press"
          onPress={add}
          disabled={!draft.trim()}
        >
          <View style={{ opacity: !draft.trim() ? 0.4 : 1 }}>
            <SketchCircle size={44} seed={651}>
              <Plus size={16} color={palette.ink} strokeWidth={1.6} />
            </SketchCircle>
          </View>
        </Tappable>
      </View>
      <Text
        style={{
          marginTop: 6,
          fontFamily: noteFont,
          fontSize: 11,
          color: palette.inkMute,
        }}
      >
        {t('chef.clickToAddIngredient')}
      </Text>
    </View>
  );
}
