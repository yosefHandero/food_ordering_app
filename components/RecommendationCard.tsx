import { HealthScore } from "@/components/HealthScore";
import {
  calculateHEIHealthScore,
  getHealthScoreBreakdown,
} from "@/lib/scoring";
import { RecommendationCardProps } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Normalize URL to ensure it has a protocol prefix
 * React Native's Linking API requires URLs to start with http:// or https://
 */
function normalizeUrl(url: string): string {
  if (!url) return url;

  // Remove any leading/trailing whitespace
  const trimmed = url.trim();

  // If already has a protocol, return as is
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }

  // If starts with //, add https:
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // Otherwise, add https:// prefix
  return `https://${trimmed}`;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

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

  // Animation values for card press effect
  const cardScale = useSharedValue(1);
  const cardShadowOffsetY = useSharedValue(2);
  const cardShadowOpacity = useSharedValue(0.08);
  const cardShadowRadius = useSharedValue(12);
  const cardElevation = useSharedValue(4);

  // Animation values for action button
  const buttonScale = useSharedValue(1);
  const buttonShadowOffsetY = useSharedValue(2);
  const buttonShadowOpacity = useSharedValue(0.25);
  const buttonShadowRadius = useSharedValue(8);
  const buttonElevation = useSharedValue(4);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: cardShadowOffsetY.value },
    shadowOpacity: cardShadowOpacity.value,
    shadowRadius: cardShadowRadius.value,
    ...(Platform.OS === "android" && {
      elevation: cardElevation.value,
    }),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    shadowColor: "#E63946",
    shadowOffset: { width: 0, height: buttonShadowOffsetY.value },
    shadowOpacity: buttonShadowOpacity.value,
    shadowRadius: buttonShadowRadius.value,
    ...(Platform.OS === "android" && {
      elevation: buttonElevation.value,
    }),
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 18, stiffness: 300 });
    buttonShadowOffsetY.value = withTiming(1, { duration: 150 });
    buttonShadowOpacity.value = withTiming(0.15, { duration: 150 });
    buttonShadowRadius.value = withTiming(6, { duration: 150 });
    buttonElevation.value = withTiming(2, { duration: 150 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 18, stiffness: 300 });
    buttonShadowOffsetY.value = withTiming(2, { duration: 200 });
    buttonShadowOpacity.value = withTiming(0.25, { duration: 200 });
    buttonShadowRadius.value = withTiming(8, { duration: 200 });
    buttonElevation.value = withTiming(4, { duration: 200 });
  };

  // Calculate health score once
  const hasNutritionData =
    menuItem.calories !== undefined ||
    menuItem.protein !== undefined ||
    menuItem.fiber !== undefined;

  const healthScore = hasNutritionData
    ? calculateHEIHealthScore(
        {
          calories: menuItem.calories,
          protein: menuItem.protein,
          fiber: menuItem.fiber,
          fat: menuItem.fat,
          sugar: menuItem.sugar,
          sodium_mg: menuItem.sodium_mg,
          saturatedFat: (menuItem as any).saturatedFat,
        },
        menuItem.name
      )
    : null;

  const healthScoreBreakdown = hasNutritionData
    ? getHealthScoreBreakdown(
        {
          calories: menuItem.calories,
          protein: menuItem.protein,
          fiber: menuItem.fiber,
          fat: menuItem.fat,
          sugar: menuItem.sugar,
          sodium_mg: menuItem.sodium_mg,
          saturatedFat: (menuItem as any).saturatedFat,
        },
        menuItem.name
      )
    : null;

  return (
    <AnimatedView
      entering={FadeInDown.delay(index * 50).springify()}
      className="bg-white rounded-xl border border-bg-elevated/40"
      style={[
        {
          flex: 1,
          padding: 12,
        },
        cardAnimatedStyle,
      ]}
    >
      {/* Title */}
      <View className="mb-1.5">
        <Text
          className="paragraph-semibold text-text-primary"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}
        >
          {menuItem.name}
        </Text>
      </View>

      {/* Restaurant info - Compact */}
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <TouchableOpacity
          onPress={async () => {
            if (restaurant.website) {
              try {
                const normalizedUrl = normalizeUrl(restaurant.website);
                const canOpen = await Linking.canOpenURL(normalizedUrl);
                if (canOpen) {
                  await Linking.openURL(normalizedUrl);
                } else {
                  Alert.alert("Error", "Unable to open website");
                }
              } catch {
                Alert.alert("Error", "Failed to open website");
              }
            } else {
              router.push(`/restaurants/${restaurant.id}` as any);
            }
          }}
          activeOpacity={0.7}
        >
          <Text
            className="paragraph-small text-accent-primary"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ fontSize: 11, fontWeight: "500" }}
          >
            {restaurant.name}
          </Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-1">
          <Ionicons name="location-outline" size={10} color="#878787" />
          <Text
            className="paragraph-small text-text-tertiary"
            style={{ fontSize: 9 }}
          >
            {distance}
          </Text>
          {restaurant.rating !== undefined && (
            <>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text
                className="paragraph-small text-text-tertiary"
                style={{ fontSize: 9 }}
              >
                {restaurant.rating.toFixed(1)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Health Score - Elevated, prominent */}
      {healthScore !== null && healthScoreBreakdown && (
        <View className="mb-1.5">
          <HealthScore
            score={healthScore}
            breakdown={healthScoreBreakdown}
            size="sm"
            variant="badge"
            showLabel={true}
          />
        </View>
      )}

      {/* Nutrition badges - Compact, grouped */}
      <View className="flex-row flex-wrap gap-1 mb-1.5">
        {menuItem.calories !== undefined && (
          <View className="bg-bg-primary rounded-full px-1.5 py-0.5 border border-bg-elevated/50">
            <Text
              className="paragraph-small text-text-secondary"
              style={{ fontSize: 8 }}
            >
              {menuItem.calories} cal
            </Text>
          </View>
        )}
        {menuItem.protein !== undefined && (
          <View className="bg-bg-primary rounded-full px-1.5 py-0.5 border border-bg-elevated/50">
            <Text
              className="paragraph-small text-text-secondary"
              style={{ fontSize: 8 }}
            >
              {menuItem.protein}g protein
            </Text>
          </View>
        )}
      </View>

      {/* Price - Clear */}
      <View className="mb-1.5">
        <Text
          className="paragraph-bold text-text-primary"
          style={{ fontSize: 13 }}
        >
          ${menuItem.price.toFixed(2)}
        </Text>
      </View>

      {/* Why - Compact insight */}
      <View className="bg-bg-secondary rounded-lg p-1.5 border border-accent-primary/10 mb-1.5 flex-1 min-h-[50px]">
        <View className="flex-row items-start gap-1.5">
          <Ionicons name="bulb-outline" size={11} color="#E63946" />
          <Text
            className="paragraph-small text-text-secondary flex-1"
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{ fontSize: 9, lineHeight: 13 }}
          >
            {why}
          </Text>
        </View>
      </View>

      {/* Action Button - Clear CTA */}
      <AnimatedTouchable
        onPress={() => {
          const dishData = {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            description: recommendation.why,
            calories: menuItem.calories,
            protein: menuItem.protein,
            carbs: menuItem.carbs,
            fat: menuItem.fat,
            fiber: menuItem.fiber,
            sodium_mg: menuItem.sodium_mg,
            sugar: menuItem.sugar,
            health_score: menuItem.health_score,
            image_url: "",
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            restaurant_distance: restaurant.distanceMiles,
            restaurant_rating: restaurant.rating,
          };

          router.push({
            pathname: `/restaurants/[id]/menu/[dishId]` as any,
            params: {
              id: restaurant.id,
              dishId: menuItem.id,
              dish: JSON.stringify(dishData),
            },
          });
        }}
        onPressIn={handleButtonPressIn}
        onPressOut={handleButtonPressOut}
        className="bg-accent-primary rounded-full"
        style={[
          buttonAnimatedStyle,
          {
            paddingVertical: 8,
            minHeight: 36,
          },
        ]}
        activeOpacity={1}
      >
        <Text
          className="text-center font-quicksand-semibold text-white"
          style={{ fontSize: 11 }}
        >
          View Details
        </Text>
      </AnimatedTouchable>
    </AnimatedView>
  );
}
