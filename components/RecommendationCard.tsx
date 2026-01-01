import { getFoodImageUrlSync } from "@/lib/food-images";
import { RecommendationResult } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface RecommendationCardProps {
  recommendation: RecommendationResult;
  index: number;
  onSwap?: () => void;
}

export function RecommendationCard({
  recommendation,
  index,
  onSwap,
}: RecommendationCardProps) {
  // Handle both old and new format
  const restaurant = recommendation.restaurant;
  const menuItem = recommendation.item;
  const why = recommendation.why;
  const distance = restaurant.distanceMiles
    ? `${restaurant.distanceMiles.toFixed(1)} mi`
    : "N/A";

  // Generate unique image URL based on food name - ensure it matches the item
  const generatedImageUrl = getFoodImageUrlSync(menuItem.name, 60, 60);
  const [imageUrl, setImageUrl] = useState<string>(generatedImageUrl);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    // If generated image fails, show placeholder
    setImageError(true);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      className="bg-white rounded-2xl p-3 mb-3 border border-bg-elevated/50 shadow-md"
      style={{ flex: 1, minHeight: 400 }}
    >
      {/* Restaurant Header with Image */}
      <View className="flex-row gap-2 mb-2">
        <View className="flex-1">
          <Text 
            className="paragraph-bold text-text-primary mb-1"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {restaurant.name}
          </Text>
          <View className="flex-row items-center gap-2 flex-wrap">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={12} color="#878787" />
              <Text className="paragraph-small text-text-tertiary ml-1" numberOfLines={1}>
                {distance}
              </Text>
            </View>
            {restaurant.rating !== undefined && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text className="paragraph-small text-text-tertiary ml-1">
                  {restaurant.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Menu Item Image - Smaller, next to title */}
        <View>
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              className="rounded-xl"
              style={{ width: 60, height: 60 }}
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <View className="rounded-xl bg-bg-elevated items-center justify-center" style={{ width: 60, height: 60 }}>
              <Ionicons name="image-outline" size={20} color="#878787" />
            </View>
          )}
        </View>
      </View>

      {/* Menu Item Name */}
      <View className="mb-2">
        <Text 
          className="paragraph-semibold text-text-primary mb-1"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {menuItem.name}
        </Text>
      </View>

      {/* Nutritional Info - Compact */}
      <View className="flex-row flex-wrap gap-1.5 mb-2">
        {menuItem.calories !== undefined && (
          <View className="bg-bg-primary rounded-full px-2 py-0.5">
            <Text className="paragraph-small text-text-secondary" style={{ fontSize: 10 }}>
              {menuItem.calories} cal
            </Text>
          </View>
        )}
        {menuItem.protein !== undefined && (
          <View className="bg-bg-primary rounded-full px-2 py-0.5">
            <Text className="paragraph-small text-text-secondary" style={{ fontSize: 10 }}>
              {menuItem.protein}g protein
            </Text>
          </View>
        )}
        {menuItem.health_score !== undefined && (
          <View className="bg-accent-primary/20 rounded-full px-2 py-0.5">
            <Text className="paragraph-small text-accent-primary" style={{ fontSize: 10 }}>
              Health: {menuItem.health_score}
            </Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View className="mb-2">
        <Text className="paragraph-bold text-text-primary">
          ${menuItem.price.toFixed(2)}
        </Text>
      </View>

      {/* Why - Compact */}
      <View className="bg-bg-secondary rounded-xl p-2 border border-accent-primary/20 mb-2 flex-1">
        <View className="flex-row items-start gap-1.5">
          <Ionicons name="bulb-outline" size={14} color="#E63946" />
          <Text 
            className="paragraph-small text-text-secondary flex-1"
            numberOfLines={3}
            ellipsizeMode="tail"
            style={{ fontSize: 11 }}
          >
            {why}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() => {
          // Navigate to restaurant menu item
          // Note: Adjust route based on your app structure
          router.push(
            `/restaurants/${restaurant.id}/menu/${menuItem.id}` as any
          );
        }}
        className="bg-accent-primary rounded-full py-2"
        style={{
          ...(Platform.OS === "android" && {
            elevation: 4,
            shadowColor: "#E63946",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }),
        }}
      >
        <Text className="text-center font-quicksand-semibold text-white" style={{ fontSize: 12 }}>
          View Details
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
