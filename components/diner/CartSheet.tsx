import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useCart } from '@/stores/cartStore';
import { useCreateOrder } from '@/hooks/orders/useCreateOrder';
import { formatPrice, parsePrice } from '@/lib/price';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
}

export function CartSheet({ visible, onClose, groupId }: Props) {
  const { t } = useTranslation();
  const items = useCart((s) => s.cartByGroup[groupId] ?? []);
  const setQty = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
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
          <View style={tw`py-8 items-center`}>
            <Text style={tw`text-sm text-gray-500`}>{t('diner.addToCart')}</Text>
          </View>
        ) : (
          <View style={tw`gap-2`}>
            {items.map((it) => (
              <View
                key={it.dishId}
                style={tw`flex-row items-center bg-white rounded-lg border border-gray-200 p-2`}
              >
                {it.imageUrl ? (
                  <Image
                    source={{ uri: it.imageUrl }}
                    style={tw`w-12 h-12 rounded bg-gray-100`}
                    contentFit="cover"
                  />
                ) : (
                  <View style={tw`w-12 h-12 rounded bg-gray-100`} />
                )}
                <View style={tw`flex-1 ml-3`}>
                  <Text style={tw`text-sm font-medium text-gray-900`} numberOfLines={1}>
                    {it.dishName}
                  </Text>
                  <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                    {formatPrice(it.price)} × {it.quantity} = {formatPrice(it.price * it.quantity)}
                  </Text>
                </View>
                <View style={tw`flex-row items-center gap-1`}>
                  <Pressable
                    onPress={() => setQty(groupId, it.dishId, it.quantity - 1)}
                    style={tw`w-7 h-7 rounded-full border border-gray-200 items-center justify-center`}
                  >
                    {it.quantity === 1 ? (
                      <Trash2 size={12} color="#A30000" />
                    ) : (
                      <Minus size={12} color="#404040" />
                    )}
                  </Pressable>
                  <Text style={tw`text-sm w-5 text-center`}>{it.quantity}</Text>
                  <Pressable
                    onPress={() => setQty(groupId, it.dishId, it.quantity + 1)}
                    style={tw`w-7 h-7 rounded-full bg-gray-900 items-center justify-center`}
                  >
                    <Plus size={12} color="white" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={tw`mt-4 gap-3`}>
          <Input
            label={t('chef.shoppingList')}
            value={notes}
            onChangeText={setNotes}
            placeholder=""
            multiline
            numberOfLines={2}
            style={tw`min-h-16 py-2`}
          />
          <Input
            label="Tip"
            value={tipStr}
            onChangeText={setTipStr}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <View style={tw`mt-4 pt-3 border-t border-gray-200`}>
          <View style={tw`flex-row justify-between mb-1`}>
            <Text style={tw`text-xs text-gray-500`}>Subtotal</Text>
            <Text style={tw`text-xs text-gray-700`}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-xs text-gray-500`}>Tip</Text>
            <Text style={tw`text-xs text-gray-700`}>{formatPrice(tip)}</Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-sm font-semibold text-gray-900`}>Total</Text>
            <Text style={tw`text-sm font-semibold text-gray-900`}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={tw`mt-4`}>
          <Button
            label={t('diner.placeOrder')}
            fullWidth
            loading={submit.isPending}
            disabled={items.length === 0}
            onPress={onPlace}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
