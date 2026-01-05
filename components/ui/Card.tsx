import { CardProps } from '@/type';
import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import cn from 'clsx';

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
  const shadowOffsetY = useSharedValue(variant === 'elevated' ? 4 : variant === 'default' ? 2 : 1);
  const shadowOpacity = useSharedValue(
    variant === 'elevated' ? 0.1 : variant === 'default' ? 0.06 : 0.04
  );
  const shadowRadius = useSharedValue(
    variant === 'elevated' ? 16 : variant === 'default' ? 8 : 4
  );
  const elevation = useSharedValue(
    variant === 'elevated' ? 6 : variant === 'default' ? 3 : 2
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: shadowOffsetY.value },
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
    ...(Platform.OS === 'android' && {
      elevation: elevation.value,
    }),
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 20, stiffness: 350 });
      // Reduce shadow on press for depth effect
      shadowOffsetY.value = withTiming(
        variant === 'elevated' ? 2 : variant === 'default' ? 1 : 0.5,
        { duration: 150 }
      );
      shadowOpacity.value = withTiming(
        variant === 'elevated' ? 0.06 : variant === 'default' ? 0.04 : 0.02,
        { duration: 150 }
      );
      shadowRadius.value = withTiming(
        variant === 'elevated' ? 10 : variant === 'default' ? 6 : 3,
        { duration: 150 }
      );
      elevation.value = withTiming(
        variant === 'elevated' ? 3 : variant === 'default' ? 2 : 1,
        { duration: 150 }
      );
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 20, stiffness: 350 });
      // Restore shadow on release
      shadowOffsetY.value = withTiming(
        variant === 'elevated' ? 4 : variant === 'default' ? 2 : 1,
        { duration: 200 }
      );
      shadowOpacity.value = withTiming(
        variant === 'elevated' ? 0.1 : variant === 'default' ? 0.06 : 0.04,
        { duration: 200 }
      );
      shadowRadius.value = withTiming(
        variant === 'elevated' ? 16 : variant === 'default' ? 8 : 4,
        { duration: 200 }
      );
      elevation.value = withTiming(
        variant === 'elevated' ? 6 : variant === 'default' ? 3 : 2,
        { duration: 200 }
      );
    }
  };

  const baseClasses = cn(
    'rounded-3xl p-5',
    {
      'bg-white': variant === 'default' || variant === 'elevated',
      'bg-white border border-bg-elevated/40': variant === 'outlined',
    },
    className
  );

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, animatedShadowStyle, style]}
        className={baseClasses}
        activeOpacity={1}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  // Static shadow for non-pressable cards
  const staticShadowStyle =
    variant === 'elevated'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          ...(Platform.OS === 'android' && { elevation: 6 }),
        }
      : variant === 'default'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          ...(Platform.OS === 'android' && { elevation: 3 }),
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          ...(Platform.OS === 'android' && { elevation: 2 }),
        };

  return (
    <AnimatedView style={[staticShadowStyle, style]} className={baseClasses}>
      {children}
    </AnimatedView>
  );
};

