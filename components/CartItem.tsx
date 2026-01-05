import { getFoodImage } from "@/lib/food-images";
import { useCartStore } from "@/store/cart.store";
import { CartItemType } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Card } from "./ui/Card";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CartItem = memo(
  ({ item }: { item: CartItemType }) => {
    const { increaseQty, decreaseQty, removeItem } = useCartStore();
    const scale = useSharedValue(1);

    // State for food image
    const [foodImage, setFoodImage] = useState<{ kind: 'local' | 'remote'; source?: any; url?: string } | null>(null);
    const [imageError, setImageError] = useState(false);

    // Resolve image
    useEffect(() => {
      getFoodImage(item)
        .then((result) => {
          setFoodImage(result);
        })
        .catch((error) => {
          console.warn("[CartItem] Failed to get image:", error);
          // Fallback to local
          setFoodImage({ kind: 'local', source: require('@/assets/images/food-spread-background.png') });
        });
    }, [item.name]);

    // Handle image load error
    const handleImageError = () => {
      setImageError(true);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    };

    const itemTotal = item.price * item.quantity;

    return (
      <Animated.View style={animatedStyle}>
        <Card variant="elevated" className="mb-4">
          <View className="flex-row items-center gap-4">
            <View className="cart-item__image">
              {foodImage?.kind === 'remote' && foodImage.url && !imageError ? (
                <Image
                  source={{ uri: foodImage.url }}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                  onError={handleImageError}
                />
              ) : foodImage?.kind === 'local' && foodImage.source ? (
                <Image
                  source={foodImage.source}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-bg-elevated items-center justify-center rounded-xl">
                  <Ionicons name="image-outline" size={24} color="#878787" />
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text
                className="base-bold text-text-primary mb-1"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className="paragraph-semibold text-accent-primary mb-3">
                ${item.price.toFixed(2)} each
              </Text>

              <View className="flex-row items-center gap-4">
                <AnimatedTouchable
                  onPress={() => decreaseQty(item.id, item.customization || [])}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  className="cart-item__actions"
                >
                  <Ionicons name="remove" size={16} color="#E63946" />
                </AnimatedTouchable>

                <Text className="base-bold text-text-primary min-w-[24px] text-center">
                  {item.quantity}
                </Text>

                <AnimatedTouchable
                  onPress={() => increaseQty(item.id, item.customization || [])}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  className="cart-item__actions"
                >
                  <Ionicons name="add" size={16} color="#E63946" />
                </AnimatedTouchable>

                <Text className="paragraph-bold text-text-primary ml-auto">
                  ${itemTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => removeItem(item.id, item.customization || [])}
              className="p-2"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#E63946" />
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Compare all properties that affect rendering, including name and description
    // (which affect image resolution via similarityKey)
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.description === nextProps.item.description &&
      prevProps.item.price === nextProps.item.price
    );
  }
);

CartItem.displayName = "CartItem";

export default CartItem;
