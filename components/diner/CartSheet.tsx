import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tappable } from '@/components/ui/Tappable';
import { showToast } from '@/components/ui/Toast';
import { SketchBox, SketchCircle, SketchPhoto } from '@/components/ui/sketch';
import { useCart, type CartItem } from '@/stores/cartStore';
import { useCreateOrder } from '@/hooks/orders/useCreateOrder';
import { formatPrice, parsePrice } from '@/lib/price';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
}

// Stable empty-array reference — see diner/group/[id].tsx for why this matters.
const EMPTY_CART: CartItem[] = [];

export function CartSheet({ visible, onClose, groupId }: Props) {
  const { t } = useTranslation();
  const itemsRaw = useCart((s) => s.cartByGroup[groupId]);
  const items = itemsRaw ?? EMPTY_CART;
  const setQty = useCart((s) => s.setQuantity);
  const submit = useCreateOrder();

  const [tipStr, setTipStr] = useState('');
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((n, i) => n + i.quantity * i.price, 0);
  const tip = parsePrice(tipStr);
  const total = subtotal + tip;

  const onPlace = async () => {
    if (items.length === 0) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    try {
      await submit.mutateAsync({ groupId, tip, notes });
      showToast.success(t('diner.placeOrder'));
      setTipStr('');
      setNotes('');
      onClose();
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('diner.placeOrder')}>
      <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text
              style={{ fontFamily: handFont, fontSize: 18, color: palette.inkSoft }}
            >
              购物车是空的
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {items.map((it, i) => (
              <SketchBox
                key={it.dishId}
                radius={14}
                seed={i + 30}
                fillColor={palette.paper}
                style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}
              >
                {it.imageUrl ? (
                  <SketchPhoto
                    src={it.imageUrl}
                    radius={8}
                    seed={i + 40}
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: palette.inkPale,
                    }}
                  />
                )}
                <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 16,
                      color: palette.ink,
                      lineHeight: 18,
                    }}
                    numberOfLines={1}
                  >
                    {it.dishName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 12,
                      color: palette.inkSoft,
                      marginTop: 2,
                    }}
                  >
                    {formatPrice(it.price)} × {it.quantity} ={' '}
                    {formatPrice(it.price * it.quantity)}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Tappable
                    feedback="press"
                    onPress={() => setQty(groupId, it.dishId, it.quantity - 1)}
                  >
                    <SketchCircle size={26} seed={i + 50}>
                      {it.quantity === 1 ? (
                        <Trash2 size={12} color="#A30000" strokeWidth={1.6} />
                      ) : (
                        <Minus size={12} color={palette.ink} strokeWidth={1.6} />
                      )}
                    </SketchCircle>
                  </Tappable>
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 16,
                      color: palette.ink,
                      width: 18,
                      textAlign: 'center',
                    }}
                  >
                    {it.quantity}
                  </Text>
                  <Tappable
                    feedback="press"
                    onPress={() => setQty(groupId, it.dishId, it.quantity + 1)}
                  >
                    <SketchCircle size={26} seed={i + 60}>
                      <Plus size={12} color={palette.ink} strokeWidth={1.6} />
                    </SketchCircle>
                  </Tappable>
                </View>
              </SketchBox>
            ))}
          </View>
        )}

        <View style={{ marginTop: 16, gap: 12 }}>
          <Input
            label={t('chef.shoppingList')}
            value={notes}
            onChangeText={setNotes}
            placeholder=""
            multiline
            numberOfLines={2}
            style={{ minHeight: 56 }}
            seed={70}
          />
          <Input
            label="Tip"
            value={tipStr}
            onChangeText={setTipStr}
            keyboardType="decimal-pad"
            placeholder="0.00"
            seed={71}
          />
        </View>

        <View
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: palette.inkPale,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text
              style={{ fontFamily: noteFont, fontSize: 12, color: palette.inkSoft }}
            >
              小计
            </Text>
            <Text
              style={{ fontFamily: noteFont, fontSize: 12, color: palette.ink }}
            >
              {formatPrice(subtotal)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{ fontFamily: noteFont, fontSize: 12, color: palette.inkSoft }}
            >
              小费
            </Text>
            <Text
              style={{ fontFamily: noteFont, fontSize: 12, color: palette.ink }}
            >
              {formatPrice(tip)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{ fontFamily: handFont, fontSize: 18, color: palette.ink }}
            >
              合计
            </Text>
            <Text
              style={{
                fontFamily: titleFont,
                fontStyle: 'italic',
                fontSize: 22,
                color: palette.ink,
                fontWeight: '700',
              }}
            >
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Button
            label={t('diner.placeOrder')}
            fullWidth
            loading={submit.isPending}
            disabled={items.length === 0}
            onPress={onPlace}
            seed={80}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
