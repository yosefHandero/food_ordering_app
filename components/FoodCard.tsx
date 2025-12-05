import React from 'react';
import { Text, Image, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MenuItem } from '@/type';
// Image URL handling - update based on your Supabase storage setup
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import cn from 'clsx';

interface FoodCardProps {
  item: MenuItem;
  onPress?: () => void;
  variant?: 'default' | 'large';
  showRating?: boolean;
}

const AnimatedCard = Animated.createAnimatedComponent(Card);

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onPress,
  variant = 'default',
  showRating = true,
}) => {
  const imageUrl = item.image_url || '';
  const scale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  React.useEffect(() => {
    imageOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.95, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const isLarge = variant === 'large';

  return (
    <AnimatedCard
      onPress={onPress}
      variant="elevated"
      className={cn(
        'relative overflow-hidden',
        isLarge ? 'pt-32 pb-6' : 'pt-24 pb-5'
      )}
      style={[
        animatedStyle,
        Platform.OS === 'android' && {
          elevation: 6,
        },
      ]}
    >
      {/* Food Image */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: isLarge ? -40 : -30,
            alignSelf: 'center',
            width: isLarge ? 140 : 120,
            height: isLarge ? 140 : 120,
            zIndex: 10,
          },
          imageAnimatedStyle,
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="contain"
        />
      </Animated.View>

      {/* Content */}
      <View className="items-center mt-auto">
        <Text
          className={cn(
            'font-quicksand-bold text-text-primary text-center mb-1.5',
            isLarge ? 'text-lg' : 'text-base'
          )}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {item.description && (
          <Text
            className="text-xs font-quicksand text-text-tertiary text-center mb-2 px-2"
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        <View className="flex-row items-center gap-2 mb-3">
          {showRating && item.rating && (
            <Badge
              label={`${item.rating.toFixed(1)} ⭐`}
              variant="warning"
              size="sm"
            />
          )}
          {item.calories && (
            <Badge
              label={`${item.calories} cal`}
              variant="neutral"
              size="sm"
            />
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-quicksand-bold text-accent-primary">
            ${item.price.toFixed(2)}
          </Text>
        </View>
      </View>
    </AnimatedCard>
  );
};

