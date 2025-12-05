import { View, Text, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCartStore } from '@/store/cart.store';
import { createOrder } from '@/lib/supabase-data';
import useAuthStore from '@/store/auth.state';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useState } from 'react';
import { Alert } from 'react-native';

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
      className={
        isTotal
          ? 'paragraph-bold text-text-primary'
          : 'paragraph-medium text-text-secondary'
      }
    >
      {label}
    </Text>
    <Text
      className={
        isTotal
          ? 'h3-bold text-text-primary'
          : 'paragraph-semibold text-text-primary'
      }
    >
      {value}
    </Text>
  </View>
);

export default function Checkout() {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [promoCode, setPromoCode] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const deliveryFee = 5.0;
  const discount = promoCode === 'SAVE10' ? totalPrice * 0.1 : 0;
  const finalTotal = totalPrice + deliveryFee - discount;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to place an order');
      router.push('/sign-in');
      return;
    }

    try {
      // Get restaurant ID from first item (you may need to adjust this logic)
      const restaurantId = items[0]?.restaurant_id || 'default-restaurant-id';

      await createOrder({
        user_id: user.$id,
        restaurant_id: restaurantId,
        items: items.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customization || [],
        })),
        total: finalTotal,
        delivery_address: deliveryAddress,
        delivery_fee: deliveryFee,
      });

      Alert.alert(
        'Order Placed!',
        `Your order of $${finalTotal.toFixed(2)} has been placed successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              router.replace('/');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-bg-elevated">
        <Button
          title=""
          onPress={() => router.back()}
          variant="ghost"
          leftIcon="arrow-back"
          size="sm"
        />
        <Text className="h2-bold text-text-primary">Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-6">
          {/* Delivery Address */}
          <AnimatedView entering={FadeIn.delay(100)}>
            <Card variant="elevated" className="mb-6">
              <Text className="h3-bold text-text-primary mb-4">
                Delivery Address
              </Text>
              <Input
                placeholder="Enter your delivery address"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                leftIcon="location-outline"
              />
            </Card>
          </AnimatedView>

          {/* Promo Code */}
          <AnimatedView entering={FadeIn.delay(200)}>
            <Card variant="elevated" className="mb-6">
              <Text className="h3-bold text-text-primary mb-4">
                Promo Code
              </Text>
              <View className="flex-row gap-3">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  leftIcon="ticket-outline"
                  containerClassName="flex-1"
                />
                {promoCode === 'SAVE10' && (
                  <View className="items-center justify-center">
                    <Ionicons name="checkmark-circle" size={24} color="#00FF88" />
                  </View>
                )}
              </View>
              {promoCode === 'SAVE10' && (
                <Text className="text-xs font-quicksand-medium text-accent-success mt-2">
                  🎉 10% discount applied!
                </Text>
              )}
            </Card>
          </AnimatedView>

          {/* Order Summary */}
          <AnimatedView entering={FadeIn.delay(300)}>
            <Card variant="elevated" className="mb-6">
              <Text className="h3-bold text-text-primary mb-4">
                Order Summary
              </Text>
              <PaymentInfoRow
                label={`Items (${totalItems})`}
                value={`$${totalPrice.toFixed(2)}`}
              />
              <PaymentInfoRow label="Delivery Fee" value={`$${deliveryFee.toFixed(2)}`} />
              {discount > 0 && (
                <PaymentInfoRow
                  label="Discount"
                  value={`- $${discount.toFixed(2)}`}
                />
              )}
              <View className="border-t border-bg-elevated my-3" />
              <PaymentInfoRow
                label="Total"
                value={`$${finalTotal.toFixed(2)}`}
                isTotal={true}
              />
            </Card>
          </AnimatedView>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
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
              Total
            </Text>
            <Text className="h2-bold text-text-primary">
              ${finalTotal.toFixed(2)}
            </Text>
          </View>
          <Button
            title="Place Order"
            onPress={handlePlaceOrder}
            variant="primary"
            size="lg"
            rightIcon="checkmark"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

