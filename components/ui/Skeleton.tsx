import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import cn from 'clsx';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
  variant?: 'default' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  className,
  variant = 'default',
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circular') return 9999;
    if (variant === 'rounded') return 12;
    return 8;
  };

  return (
    <View
      className={cn('overflow-hidden bg-bg-elevated', className)}
      style={{
        width,
        height,
        borderRadius: getBorderRadius(),
      }}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: '#242424',
          },
          animatedStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: '50%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: [{ skewX: '-20deg' }],
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

