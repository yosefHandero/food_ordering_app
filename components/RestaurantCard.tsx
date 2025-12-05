import React from 'react';
import { Text, Image, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import cn from 'clsx';

interface RestaurantCardProps {
  name: string;
  imageUrl?: string;
  rating?: number;
  deliveryTime?: string;
  distance?: string;
  cuisine?: string;
  onPress?: () => void;
  variant?: 'default' | 'wide' | 'hero';
}

const AnimatedCard = Animated.createAnimatedComponent(Card);

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  name,
  imageUrl,
  rating,
  deliveryTime,
  distance,
  cuisine,
  onPress,
  variant = 'default',
}) => {
  const scale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  React.useEffect(() => {
    imageOpacity.value = withTiming(1, { duration: 400 });
  }, []);

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

  const isWide = variant === 'wide';
  const isHero = variant === 'hero';

  return (
    <AnimatedCard
      onPress={onPress}
      variant="elevated"
      className={cn(
        'overflow-hidden',
        isHero ? 'h-64' : isWide ? 'h-40' : 'h-48'
      )}
      style={[
        animatedStyle,
        Platform.OS === 'android' && {
          elevation: 6,
        },
      ]}
    >
      {/* Background Image with Gradient Overlay */}
      {imageUrl && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            imageAnimatedStyle,
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Gradient Overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
            }}
            className="bg-gradient-to-t from-black/90 via-black/50 to-transparent"
          />
        </Animated.View>
      )}

      {/* Content */}
      <View className="flex-1 justify-end p-4 z-10">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className={cn(
              'font-quicksand-bold text-white',
              isHero ? 'text-2xl' : 'text-xl'
            )}
            numberOfLines={1}
          >
            {name}
          </Text>
          {rating && (
            <View className="flex-row items-center bg-black/40 px-2 py-1 rounded-full">
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text className="text-white text-xs font-quicksand-semibold ml-1">
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 flex-wrap">
          {cuisine && (
            <Badge label={cuisine} variant="neutral" size="sm" />
          )}
          {deliveryTime && (
            <Badge
              label={deliveryTime}
              variant="primary"
              size="sm"
              icon="time-outline"
            />
          )}
          {distance && (
            <Badge
              label={distance}
              variant="neutral"
              size="sm"
              icon="location-outline"
            />
          )}
        </View>
      </View>
    </AnimatedCard>
  );
};

