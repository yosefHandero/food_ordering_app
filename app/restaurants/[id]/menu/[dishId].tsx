import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import useAuthStore from "@/store/auth.state";
import { useCartStore } from "@/store/cart.store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock dish data - replace with actual API call
const mockDish = {
  id: "1",
  name: "Classic Burger",
  price: 12.99,
  imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add",
  description:
    "Juicy beef patty with fresh lettuce, tomatoes, onions, and our special sauce",
  rating: 4.8,
  calories: 650,
  protein: 35,
  customization: {
    size: ["Regular", "Large"],
    extras: [
      { name: "Extra Cheese", price: 1.5 },
      { name: "Bacon", price: 2.0 },
      { name: "Avocado", price: 1.5 },
    ],
  },
};

export default function DishDetail() {
  // dishId available if needed for API calls
  // const { dishId } = useLocalSearchParams<{ dishId: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const { addItem } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const imageScale = useSharedValue(1);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to order items.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/sign-in") },
      ]);
      return;
    }

    const extrasPrice = selectedExtras.reduce((total, extraName) => {
      const extra = mockDish.customization.extras.find(
        (e) => e.name === extraName
      );
      return total + (extra?.price || 0);
    }, 0);

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: mockDish.id,
        name: mockDish.name,
        price: mockDish.price + extrasPrice,
        image_url: mockDish.imageUrl,
        customization: selectedExtras.map((name) => ({
          id: name,
          name,
          price:
            mockDish.customization.extras.find((e) => e.name === name)?.price ||
            0,
          type: "extra",
        })),
      });
    }

    // Animate success
    imageScale.value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );

    Alert.alert(
      "Added to Cart",
      `${quantity} ${mockDish.name} added to your cart!`
    );
  };

  const totalPrice =
    (mockDish.price +
      selectedExtras.reduce((sum, name) => {
        const extra = mockDish.customization.extras.find(
          (e) => e.name === name
        );
        return sum + (extra?.price || 0);
      }, 0)) *
    quantity;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Animated.View
          style={[
            {
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT * 0.4,
            },
            useAnimatedStyle(() => ({
              transform: [{ scale: imageScale.value }],
            })),
          ]}
        >
          <Image
            source={{ uri: mockDish.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? 50 : 20,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Button
              title=""
              onPress={() => router.back()}
              variant="ghost"
              leftIcon="arrow-back"
              size="sm"
            />
            <View className="bg-black/40 rounded-full px-3 py-1.5">
              <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <View className="px-5 pt-6" style={{ paddingBottom: 120 }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="h1-bold text-text-primary">{mockDish.name}</Text>
            <Badge
              label={`${mockDish.rating} ⭐`}
              variant="warning"
              size="sm"
            />
          </View>

          <Text className="paragraph-medium text-text-secondary mb-4">
            {mockDish.description}
          </Text>

          <View className="flex-row items-center gap-4 mb-6">
            <Badge
              label={`${mockDish.calories} cal`}
              variant="neutral"
              size="sm"
            />
            <Badge
              label={`${mockDish.protein}g protein`}
              variant="neutral"
              size="sm"
            />
          </View>

          {/* Customization */}
          {mockDish.customization.extras.length > 0 && (
            <Card variant="elevated" className="mb-6">
              <Text className="h3-bold text-text-primary mb-4">Add Extras</Text>
              {mockDish.customization.extras.map((extra) => {
                const isSelected = selectedExtras.includes(extra.name);
                return (
                  <View
                    key={extra.name}
                    className="flex-row items-center justify-between py-3 border-b border-bg-elevated last:border-b-0"
                  >
                    <Text className="paragraph-medium text-text-primary">
                      {extra.name}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="paragraph-semibold text-accent-primary">
                        +${extra.price.toFixed(2)}
                      </Text>
                      <Button
                        title=""
                        onPress={() => {
                          if (isSelected) {
                            setSelectedExtras(
                              selectedExtras.filter((e) => e !== extra.name)
                            );
                          } else {
                            setSelectedExtras([...selectedExtras, extra.name]);
                          }
                        }}
                        variant={isSelected ? "primary" : "ghost"}
                        leftIcon={isSelected ? "checkmark" : "add"}
                        size="sm"
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Quantity Selector */}
          <Card variant="elevated" className="mb-6">
            <Text className="h3-bold text-text-primary mb-4">Quantity</Text>
            <View className="flex-row items-center justify-between">
              <Button
                title=""
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                variant="ghost"
                leftIcon="remove"
                size="sm"
              />
              <Text className="h3-bold text-text-primary">{quantity}</Text>
              <Button
                title=""
                onPress={() => setQuantity(quantity + 1)}
                variant="ghost"
                leftIcon="add"
                size="sm"
              />
            </View>
          </Card>

          {/* Add to Cart Button */}
          <Button
            title={`Add to Cart • $${totalPrice.toFixed(2)}`}
            onPress={handleAddToCart}
            variant="primary"
            fullWidth
            size="lg"
            rightIcon="bag"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
