import { useCartStore } from '@/store/cart.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const CartButton = () => {
  // Use selector to only subscribe to items, preventing unnecessary re-renders
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(1);
  // Initialize with default value, update in useEffect
  const badgeOpacity = useSharedValue(0);

  useEffect(() => {
    if (totalItems > 0) {
      badgeOpacity.value = withTiming(1, { duration: 200 });
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
    } else {
      badgeOpacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedTouchable
      className="cart-btn"
      onPress={() => router.push('/cart')}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        Platform.OS === 'android' && {
          elevation: 4,
        },
      ]}
      activeOpacity={0.8}
    >
      <Ionicons name="bag-outline" size={22} color="#FF6B35" />
      {totalItems > 0 && (
        <AnimatedView className="cart-badge" style={badgeAnimatedStyle}>
          <Text className="text-xs font-quicksand-bold text-white">
            {totalItems > 99 ? '99+' : totalItems}
          </Text>
        </AnimatedView>
      )}
    </AnimatedTouchable>
  );
};

export default CartButton;