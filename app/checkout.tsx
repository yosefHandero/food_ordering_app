import { PaymentInfoRow } from "@/components/PaymentInfoRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import useAuthStore from "@/store/auth.state";
import { useCartStore } from "@/store/cart.store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

export default function Checkout() {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  // Use selectors to only subscribe to needed state, preventing unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [promoCode, setPromoCode] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const deliveryFee = 5.0;
  const discount = promoCode === "SAVE10" ? totalPrice * 0.1 : 0;
  const finalTotal = totalPrice + deliveryFee - discount;

  // Redirect to cart if cart is empty
  React.useEffect(() => {
    if (items.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Your cart is empty. Please add items before checkout.",
        [{ text: "OK", onPress: () => router.replace("/cart") }]
      );
    }
  }, [items.length]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert("Error", "Please enter a delivery address");
      return;
    }

    // Require authentication to place order
    if (!user || !isAuthenticated) {
      Alert.alert("Login Required", "Please sign in to place an order.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/sign-in") },
      ]);
      return;
    }

    try {
      // Get restaurant ID from first menu item
      if (items.length === 0) {
        Alert.alert("Error", "Your cart is empty");
        return;
      }

      // Order creation functionality has been removed (Supabase dependency removed)
      // For now, just show a success message
      // TODO: Implement order creation with your new backend

      Alert.alert(
        "Order Placed!",
        `Your order of $${finalTotal.toFixed(2)} has been placed successfully.`,
        [
          {
            text: "OK",
            onPress: () => {
              clearCart();
              router.replace("/");
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to place order");
    }
  };

  // Don't render checkout UI if cart is empty
  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
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
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="bag-outline" size={80} color="#878787" />
          <Text className="h3-bold text-text-primary mt-6 mb-2">
            Your cart is empty
          </Text>
          <Text className="paragraph-medium text-text-tertiary text-center mb-6">
            Please add items to your cart before checkout
          </Text>
          <Button
            title="Go to Cart"
            onPress={() => router.replace("/cart")}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
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
              <Text className="h3-bold text-text-primary mb-4">Promo Code</Text>
              <View className="flex-row gap-3">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  leftIcon="ticket-outline"
                  containerClassName="flex-1"
                />
                {promoCode === "SAVE10" && (
                  <View className="items-center justify-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#2A9D8F"
                    />
                  </View>
                )}
              </View>
              {promoCode === "SAVE10" && (
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
              <PaymentInfoRow
                label="Delivery Fee"
                value={`$${deliveryFee.toFixed(2)}`}
              />
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
          paddingBottom: Platform.OS === "ios" ? 40 : 24,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
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
