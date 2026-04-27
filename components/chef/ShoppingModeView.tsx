import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShoppingBasket } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ChefOrderRow } from '@/hooks/chef/useChefOrders';
import tw from '@/lib/tw';

interface Props {
  orders: ChefOrderRow[];
}

export function ShoppingModeView({ orders }: Props) {
  const { t } = useTranslation();

  const aggregated = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const ings = o.dish_ingredients;
      for (const ing of ings) {
        const key = ing.trim().toLowerCase();
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + o.quantity);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [orders]);

  if (aggregated.length === 0) {
    return (
      <EmptyState
        title={t('chef.shoppingList')}
        subtitle={t('chef.noActiveOrders')}
        icon={<ShoppingBasket size={28} color="#A3A3A3" strokeWidth={1.5} />}
      />
    );
  }

  return (
    <View style={tw`px-4 gap-2`}>
      {aggregated.map((row) => (
        <View
          key={row.name}
          style={tw`flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3`}
        >
          <Text style={tw`text-sm text-gray-900 flex-1 capitalize`}>{row.name}</Text>
          <View style={tw`px-2 py-1 rounded-full bg-gray-100`}>
            <Text style={tw`text-xs text-gray-700 font-medium`}>×{row.count}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
