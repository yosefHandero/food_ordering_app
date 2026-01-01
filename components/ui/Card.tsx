import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import cn from 'clsx';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  className?: string;
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  className,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const baseClasses = cn(
    'rounded-3xl p-5',
    {
      'bg-white': variant === 'default',
      'bg-white': variant === 'elevated',
      'bg-white border border-bg-elevated/50': variant === 'outlined',
    },
    className
  );

  const shadowStyle =
    Platform.OS === 'android'
      ? {
          elevation: variant === 'elevated' ? 8 : 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: variant === 'elevated' ? 8 : 4 },
          shadowOpacity: 0.2,
          shadowRadius: variant === 'elevated' ? 16 : 8,
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: variant === 'elevated' ? 8 : 4 },
          shadowOpacity: 0.2,
          shadowRadius: variant === 'elevated' ? 16 : 8,
        };

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, shadowStyle, style]}
        className={baseClasses}
        activeOpacity={0.9}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedView style={[shadowStyle, style]} className={baseClasses}>
      {children}
    </AnimatedView>
  );
};

