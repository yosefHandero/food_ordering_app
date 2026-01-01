import { getFoodImageUrlSync } from "@/lib/food-images";
import { useCartStore } from "@/store/cart.store";
import { CartItemType } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
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

    // Generate unique image URL based on food name
    const generatedImageUrl = getFoodImageUrlSync(item.name, 80, 80);
    const [imageUrl, setImageUrl] = useState<string>(
      item.image_url || generatedImageUrl
    );
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      // If stored image fails, try the generated one
      if (!imageError && imageUrl === item.image_url && item.image_url) {
        setImageUrl(generatedImageUrl);
        setImageError(false);
      } else {
        setImageError(true);
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 15 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 });
    };

    const itemTotal = item.price * item.quantity;

    return (
      <Animated.View style={animatedStyle}>
        <Card variant="elevated" className="mb-4">
          <View className="flex-row items-center gap-4">
            <View className="cart-item__image">
              {imageUrl && !imageError ? (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                  onError={handleImageError}
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
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.quantity === nextProps.item.quantity
    );
  }
);

CartItem.displayName = "CartItem";

export default CartItem;
