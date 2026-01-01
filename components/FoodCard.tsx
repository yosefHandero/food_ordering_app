import { getFoodImageUrlSync } from "@/lib/food-images";
import { MenuItem } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import cn from "clsx";
import React, { useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

interface FoodCardProps {
  item: MenuItem;
  onPress?: () => void;
  variant?: "default" | "large";
  showRating?: boolean;
}

const AnimatedCard = Animated.createAnimatedComponent(Card);

const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onPress,
  variant = "default",
  showRating = true,
}) => {
  const isLarge = variant === "large";
  const imageSize = isLarge ? 140 : 120;

  // Generate unique image URL based on food name (prioritize this)
  const generatedImageUrl = getFoodImageUrlSync(
    item.name,
    imageSize,
    imageSize
  );

  // Use generated image URL first, fallback to stored image_url if generation fails
  const [imageUrl, setImageUrl] = useState<string>(generatedImageUrl);
  const [imageError, setImageError] = useState(false);

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

  const handleImageError = () => {
    // If generated image fails, try the stored image_url as fallback
    if (!imageError && imageUrl === generatedImageUrl && item?.image_url) {
      setImageUrl(item.image_url);
      setImageError(false); // Reset error to try fallback
    } else {
      // Both images failed, show placeholder
      setImageError(true);
    }
  };

  return (
    <AnimatedCard
      onPress={onPress}
      variant="elevated"
      className={cn("relative", isLarge ? "pt-32 pb-6" : "pt-24 pb-5")}
      style={[
        animatedStyle,
        Platform.OS === "android" && {
          elevation: 6,
        },
      ]}
    >
      {/* Food Image */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: isLarge ? -40 : -30,
            alignSelf: "center",
            width: isLarge ? 140 : 120,
            height: isLarge ? 140 : 120,
            zIndex: 10,
          },
          imageAnimatedStyle,
        ]}
      >
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="contain"
            style={{ borderRadius: 100 }}
            onError={handleImageError}
          />
        ) : (
          <View className="w-full h-full bg-bg-elevated items-center justify-center rounded-full">
            <Ionicons name="image-outline" size={40} color="#878787" />
          </View>
        )}
      </Animated.View>

      {/* Content */}
      <View className="items-center mt-auto">
        <Text
          className={cn(
            "font-quicksand-bold text-text-primary text-center mb-1.5",
            isLarge ? "text-lg" : "text-base"
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
            <Badge label={`${item.calories} cal`} variant="neutral" size="sm" />
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

FoodCard.displayName = "FoodCard";

export { FoodCard };
