import { View, Text, TouchableOpacity, Platform } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useCartStore } from '@/store/cart.store';
import { router } from 'expo-router';
import { useEffect } from 'react';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const CartButton = () => {
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(1);
  const badgeOpacity = useSharedValue(totalItems > 0 ? 1 : 0);

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