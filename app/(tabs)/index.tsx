import { HealthyPicksForm } from "@/components/HealthyPicksForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import SearchBar from "@/components/SearchBar";
import { images } from "@/constants";
import { RecommendationRequest, RecommendationResult } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

function Search() {
  const [recommendations, setRecommendations] = useState<
    RecommendationResult[]
  >([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  const handleGetRecommendations = async (
    requestData: RecommendationRequest
  ) => {
    setIsLoadingRecommendations(true);
    setShowRecommendations(true);

    try {
      // Determine API URL - adjust based on your deployment
      let apiUrl: string;

      if (process.env.EXPO_PUBLIC_API_URL) {
        apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/recommendations`;
      } else if (typeof window !== "undefined") {
        // Web - use current origin for Expo Router API route
        const origin = window.location.origin;
        apiUrl = `${origin}/api/recommendations`;
      } else {
        // Native - use relative path for Expo Router API route
        // This works when running with Expo Go or in development
        // For production, set EXPO_PUBLIC_API_URL to your deployed API URL
        const apiBase =
          process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8081";
        apiUrl = `${apiBase}/api/recommendations`;
      }

      console.log("[Recommendations] Calling API:", apiUrl);
      console.log("[Recommendations] Request data:", {
        goal: requestData.goal,
        timeOfDay: requestData.timeOfDay,
        lat: requestData.lat,
        lng: requestData.lng,
        budgetMax: requestData.budgetMax,
        radiusMiles: requestData.radiusMiles,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log(
        "[Recommendations] Response status:",
        response.status,
        response.ok
      );

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          const text = await response.text();
          console.error("[Recommendations] Error response text:", text);
          throw new Error(
            `Request failed with status ${response.status}: ${text.substring(
              0,
              200
            )}`
          );
        }
        console.error("[Recommendations] Error response:", error);
        throw new Error(
          error.error || `Failed to get recommendations (${response.status})`
        );
      }

      let result;
      try {
        result = await response.json();
        console.log("[Recommendations] Response received:", {
          hasContext: !!result.context,
          resultsCount: result.results?.length || 0,
          hasResults: Array.isArray(result.results),
        });
      } catch (parseError: any) {
        console.error("[Recommendations] JSON parse error:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      // Handle both old and new response formats
      if (result.context && result.results) {
        // New format with context
        const results = result.results || [];
        console.log(
          "[Recommendations] Setting recommendations:",
          results.length
        );
        setRecommendations(results);
      } else if (Array.isArray(result.results)) {
        // Old format or direct results array
        console.log(
          "[Recommendations] Setting recommendations (old format):",
          result.results.length
        );
        setRecommendations(result.results);
      } else {
        console.warn("[Recommendations] Unexpected response format:", result);
        setRecommendations([]);
      }
    } catch (error: any) {
      console.error(
        "[Recommendations] Error in handleGetRecommendations:",
        error
      );
      console.error("[Recommendations] Error stack:", error.stack);
      Alert.alert(
        "Error Getting Recommendations",
        error.message ||
          "Failed to get recommendations. Please check your connection and try again."
      );
      // Don't hide the view on error - let user see the error state
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <SafeAreaView className="bg-bg-primary h-full" edges={["top"]}>
      {showRecommendations ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <AnimatedView entering={FadeIn.duration(300)} className="mb-6">
            {/* Centered MealHop Branding */}
            <View className="items-center justify-center py-6 mb-6">
              <View className="flex-row items-center gap-4">
                <View>
                  <Image
                    source={images.logo}
                    className="rounded-full"
                    resizeMode="contain"
                    style={{
                      backgroundColor: "#1A1A1A",
                      padding: 6,
                      width: 64,
                      height: 64,
                    }}
                  />
                </View>
                <View>
                  <Text
                    className="font-quicksand-bold text-text-primary"
                    style={{ fontSize: 32, lineHeight: 38 }}
                  >
                    MealHop
                  </Text>
                  <Text
                    className="text-text-tertiary font-quicksand-medium"
                    style={{ fontSize: 16, lineHeight: 20, marginTop: 4 }}
                  >
                    Find Your Perfect Meal
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between px-5 py-4">
              <View>
                <Text className="small-bold uppercase text-accent-primary mb-1">
                  Healthy Picks
                </Text>
                <Text className="h3-bold text-text-primary">
                  Ranked Recommendations
                </Text>
              </View>
            </View>
          </AnimatedView>

          <View className="px-5">
            {isLoadingRecommendations ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="hourglass-outline" size={64} color="#808080" />
                <Text className="h3-bold text-text-primary mt-4 mb-2">
                  Finding the best meals...
                </Text>
              </View>
            ) : recommendations.length > 0 ? (
              <>
                {recommendations.map((rec, index) => (
                  <RecommendationCard
                    key={`${rec.restaurant.id}-${rec.item.id}-${index}`}
                    recommendation={rec}
                    index={index}
                  />
                ))}
                <View className="mt-4 mb-4">
                  <TouchableOpacity
                    onPress={() => setShowRecommendations(false)}
                  >
                    <Text className="text-center text-accent-primary font-quicksand-semibold">
                      ← Back to Search
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="restaurant-outline" size={64} color="#808080" />
                <Text className="h3-bold text-text-primary mt-4 mb-2">
                  No recommendations found
                </Text>
                <Text className="paragraph-medium text-text-tertiary text-center mb-4">
                  Try adjusting your filters or location
                </Text>
                <TouchableOpacity onPress={() => setShowRecommendations(false)}>
                  <Text className="text-center text-accent-primary font-quicksand-semibold">
                    ← Back to Search
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header Section */}
          <AnimatedView entering={FadeIn.duration(300)} className="mb-6">
            {/* Centered MealHop Branding */}
            <View className="items-center justify-center py-6 mb-6">
              <View className="flex-row items-center gap-4">
                <View>
                  <Image
                    source={images.logo}
                    className="rounded-full"
                    resizeMode="contain"
                    style={{
                      backgroundColor: "#1A1A1A",
                      padding: 6,
                      width: 64,
                      height: 64,
                    }}
                  />
                </View>
                <View>
                  <Text
                    className="font-quicksand-bold text-text-primary"
                    style={{ fontSize: 32, lineHeight: 38 }}
                  >
                    MealHop
                  </Text>
                  <Text
                    className="text-text-tertiary font-quicksand-medium"
                    style={{ fontSize: 16, lineHeight: 20, marginTop: 4 }}
                  >
                    Find Your Perfect Meal!
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between px-5 py-4">
              <View>
                <Text className="small-bold uppercase text-accent-primary mb-1">
                  Search
                </Text>
                <Text className="h3-bold text-text-primary">
                  Find your favorite food
                </Text>
              </View>
            </View>

            {/* Search Bar - Positioned right under "Find your favorite food" */}
            <View className="px-5 mb-4">
              <SearchBar />
            </View>
          </AnimatedView>

          {/* Healthy Picks Form */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120,
            }}
          >
            <HealthyPicksForm
              onSubmit={handleGetRecommendations}
              isLoading={isLoadingRecommendations}
            />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

export default Search;
