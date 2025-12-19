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

  // Generate unique image URL based on food name
  const generatedImageUrl = getFoodImageUrlSync(menuItem.name, 80, 80);
  const [imageUrl, setImageUrl] = useState<string>(generatedImageUrl);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    // If generated image fails, show placeholder
    setImageError(true);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      className="bg-bg-tertiary rounded-3xl p-4 mb-4 border border-bg-elevated/50"
    >
      {/* Restaurant Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="h3-bold text-text-primary mb-1">
            {restaurant.name}
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#808080" />
              <Text className="paragraph-small text-text-tertiary ml-1">
                {distance}
              </Text>
            </View>
            {restaurant.rating !== undefined && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text className="paragraph-small text-text-tertiary ml-1">
                  {restaurant.rating.toFixed(1)}
                </Text>
              </View>
            )}
            {restaurant.deliveryTime && (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#808080" />
                <Text className="paragraph-small text-text-tertiary ml-1">
                  {restaurant.deliveryTime}
                </Text>
              </View>
            )}
          </View>
        </View>
        {onSwap && (
          <TouchableOpacity
            onPress={onSwap}
            className="bg-bg-primary rounded-full p-2 border border-bg-elevated/50"
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={18}
              color="#FF6B35"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Item */}
      <View className="flex-row gap-3 mb-3">
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-20 h-20 rounded-2xl"
            resizeMode="cover"
            onError={handleImageError}
          />
        ) : (
          <View className="w-20 h-20 rounded-2xl bg-bg-elevated items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#808080" />
          </View>
        )}
        <View className="flex-1">
          <Text className="paragraph-bold text-text-primary mb-1">
            {menuItem.name}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {menuItem.calories !== undefined && (
              <View className="bg-bg-primary rounded-full px-3 py-1">
                <Text className="paragraph-small text-text-secondary">
                  {menuItem.calories} cal
                </Text>
              </View>
            )}
            {menuItem.protein !== undefined && (
              <View className="bg-bg-primary rounded-full px-3 py-1">
                <Text className="paragraph-small text-text-secondary">
                  {menuItem.protein}g protein
                </Text>
              </View>
            )}
            {menuItem.health_score !== undefined && (
              <View className="bg-accent-primary/20 rounded-full px-3 py-1">
                <Text className="paragraph-small text-accent-primary">
                  Health: {menuItem.health_score}
                </Text>
              </View>
            )}
            <View className="bg-bg-primary rounded-full px-3 py-1">
              <Text className="paragraph-small text-text-secondary font-quicksand-semibold">
                ${menuItem.price.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Why */}
      <View className="bg-bg-primary rounded-2xl p-3 border border-accent-primary/20">
        <View className="flex-row items-start gap-2">
          <Ionicons name="bulb-outline" size={16} color="#FF6B35" />
          <Text className="paragraph-small text-text-secondary flex-1">
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
        className="bg-accent-primary rounded-full py-3 mt-3"
        style={{
          ...(Platform.OS === "android" && {
            elevation: 4,
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }),
        }}
      >
        <Text className="text-center font-quicksand-semibold text-white">
          View Details
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
