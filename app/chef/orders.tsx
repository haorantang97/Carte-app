import { Text, View } from 'react-native';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import tw from '@/lib/tw';

export default function ChefOrders() {
  return (
    <AppContainer>
      <View style={tw`px-4 flex-row items-center`}>
        <BackButton />
        <Text style={tw`ml-2 text-xl text-gray-900`}>Active Orders</Text>
      </View>
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`text-sm text-gray-500`}>(Phase E)</Text>
      </View>
    </AppContainer>
  );
}
