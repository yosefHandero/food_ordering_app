import { View, Text, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cart.store';
import cn from 'clsx';
import CartItem from '@/components/CartItem';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import CartButton from '@/components/CartButton';

const AnimatedView = Animated.createAnimatedComponent(View);

const PaymentInfoRow = ({
  label,
  value,
  isTotal = false,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
}) => (
  <View className="flex-row items-center justify-between my-2">
    <Text
      className={cn(
        'paragraph-medium',
        isTotal ? 'text-text-primary font-quicksand-bold' : 'text-text-secondary'
      )}
    >
      {label}
    </Text>
    <Text
      className={cn(
        'paragraph-semibold',
        isTotal ? 'text-text-primary' : 'text-text-primary'
      )}
    >
      {value}
    </Text>
  </View>
);

const Cart = () => {
  const { items, getTotalItems, getTotalPrice } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const deliveryFee = 5.0;
  const discount = 0.5;
  const finalTotal = totalPrice + deliveryFee - discount;

  return (
    <SafeAreaView className="bg-bg-primary h-full" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="h2-bold text-text-primary">Your Cart</Text>
        <CartButton />
      </View>

      <FlatList
        data={items}
        renderItem={({ item, index }) => (
          <AnimatedView entering={FadeInDown.delay(index * 50)} className="px-5">
            <CartItem item={item} />
          </AnimatedView>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 200 }}
        ListEmptyComponent={() => (
          <AnimatedView
            entering={FadeIn.duration(300)}
            className="items-center justify-center py-32 px-5"
          >
            <Ionicons name="bag-outline" size={80} color="#808080" />
            <Text className="h3-bold text-text-primary mt-6 mb-2">
              Your cart is empty
            </Text>
            <Text className="paragraph-medium text-text-tertiary text-center mb-6">
              Start adding delicious items to your cart!
            </Text>
            <Button
              title="Browse Menu"
              onPress={() => router.push('/search')}
              variant="primary"
            />
          </AnimatedView>
        )}
        ListFooterComponent={() =>
          totalItems > 0 && (
            <AnimatedView entering={FadeIn.delay(200)} className="px-5 mt-4">
              <Card variant="elevated" className="mb-4">
                <Text className="h3-bold text-text-primary mb-4">
                  Payment Summary
                </Text>

                <PaymentInfoRow
                  label={`Total Items (${totalItems})`}
                  value={`$${totalPrice.toFixed(2)}`}
                />
                <PaymentInfoRow label="Delivery Fee" value={`$${deliveryFee.toFixed(2)}`} />
                <PaymentInfoRow
                  label="Discount"
                  value={`- $${discount.toFixed(2)}`}
                />
                <View className="border-t border-bg-elevated my-3" />
                <PaymentInfoRow
                  label="Total"
                  value={`$${finalTotal.toFixed(2)}`}
                  isTotal={true}
                />
              </Card>

              <Button
                title="Proceed to Checkout"
                onPress={() => router.push('/checkout')}
                variant="primary"
                fullWidth
                rightIcon="arrow-forward"
              />
            </AnimatedView>
          )
        }
      />

      {/* Persistent Bottom Cart Bar */}
      {totalItems > 0 && (
        <AnimatedView
          entering={FadeIn.duration(300)}
          className="absolute bottom-0 left-0 right-0 bg-bg-elevated border-t border-bg-tertiary px-5 py-4"
          style={{
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              },
              android: {
                elevation: 12,
              },
            }),
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs font-quicksand-medium text-text-tertiary">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Text>
              <Text className="h3-bold text-text-primary">
                ${finalTotal.toFixed(2)}
              </Text>
            </View>
            <Button
              title="Checkout"
              onPress={() => router.push('/checkout')}
              variant="primary"
              size="md"
            />
          </View>
        </AnimatedView>
      )}
    </SafeAreaView>
  );
};

export default Cart;