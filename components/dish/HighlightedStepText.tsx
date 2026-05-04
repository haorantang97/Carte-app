import { useMemo } from 'react';
import { Text } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';
import { getAliases } from '@/lib/units';
import tw from '@/lib/tw';

export interface IngredientLike {
  name: string;
  quantity?: string;
  note?: string;
}

interface Props {
  text: string;
  ingredients: (string | IngredientLike)[];
  baseStyle?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  /** 点击高亮的食材 token 时回调。不传则 token 仅高亮不可点。 */
  onIngredientPress?: (ingredient: IngredientLike) => void;
}

/**
 * 把 step.instruction 里出现的食材名 token 化高亮(默认红色加粗)。
 * 通过 lib/units 的别名表识别同义词:chef 写"番茄",step 里写"西红柿"也会高亮。
 * 长 alias 优先匹配,避免短 alias 先吃掉长 alias(如"葱"吃掉"葱花")。
 *
 * RN 限制:Pressable 不能嵌套在 Text 里(会断文本流),所以可点 token 用 Text onPress
 * (RN 的 Text 支持 onPress,跟 Web 不同)。
 */
export function HighlightedStepText({
  text,
  ingredients,
  baseStyle,
  highlightStyle,
  onIngredientPress,
}: Props) {
  const ingObjs = useMemo<IngredientLike[]>(() => {
    return ingredients
      .map((i) => (typeof i === 'string' ? { name: i } : i))
      .filter((i): i is IngredientLike => !!i.name && i.name.length >= 1);
  }, [ingredients]);

  // 展开每个 ingredient 的别名,长 alias 优先(避免"葱"切碎"葱花")
  type AliasEntry = { alias: string; ingredient: IngredientLike };
  const aliasEntries = useMemo<AliasEntry[]>(() => {
    const arr: AliasEntry[] = [];
    for (const ing of ingObjs) {
      for (const alias of getAliases(ing.name)) {
        arr.push({ alias, ingredient: ing });
      }
    }
    return arr.sort((a, b) => b.alias.length - a.alias.length);
  }, [ingObjs]);

  type Seg = { text: string; ingredient: IngredientLike | null };
  const segments = useMemo<Seg[]>(() => {
    if (aliasEntries.length === 0) return [{ text, ingredient: null }];
    let segs: Seg[] = [{ text, ingredient: null }];
    for (const entry of aliasEntries) {
      const next: Seg[] = [];
      for (const seg of segs) {
        if (seg.ingredient || !seg.text.includes(entry.alias)) {
          next.push(seg);
          continue;
        }
        const parts = seg.text.split(entry.alias);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) next.push({ text: parts[i], ingredient: null });
          if (i < parts.length - 1) next.push({ text: entry.alias, ingredient: entry.ingredient });
        }
      }
      segs = next;
    }
    return segs;
  }, [text, aliasEntries]);

  const finalBase = baseStyle ?? tw`text-sm text-gray-900 leading-relaxed`;
  const finalHighlight = highlightStyle ?? tw`text-[#C44536] font-semibold`;

  return (
    <Text style={finalBase}>
      {segments.map((s, i) =>
        s.ingredient ? (
          <Text
            key={i}
            onPress={
              onIngredientPress
                ? () => onIngredientPress(s.ingredient!)
                : undefined
            }
            style={finalHighlight}
          >
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        ),
      )}
    </Text>
  );
}
