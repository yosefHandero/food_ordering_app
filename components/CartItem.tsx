import { useCartStore } from '@/store/cart.store';
import { CartItemType } from '@/type';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Card } from './ui/Card';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CartItem = memo(({ item }: { item: CartItemType }) => {
  const { increaseQty, decreaseQty, removeItem } = useCartStore();
  const scale = useSharedValue(1);

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
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                className="w-full h-full rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-bg-elevated items-center justify-center">
                <Ionicons name="image-outline" size={24} color="#808080" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="base-bold text-text-primary mb-1" numberOfLines={1}>
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
                <Ionicons name="remove" size={16} color="#FF6B35" />
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
                <Ionicons name="add" size={16} color="#FF6B35" />
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
            <Ionicons name="trash-outline" size={20} color="#FF3366" />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.quantity === nextProps.item.quantity;
});

CartItem.displayName = 'CartItem';

export default CartItem;