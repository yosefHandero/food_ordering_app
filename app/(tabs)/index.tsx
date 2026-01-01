import { HealthyPicksForm } from "@/components/HealthyPicksForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/Button";
import { images } from "@/constants";
import {
  HealthGoal,
  RecommendationRequest,
  RecommendationResult,
  TimeOfDay,
} from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
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
  const [contextGuidance, setContextGuidance] = useState<string | null>(null);
  const [hasWarning, setHasWarning] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // Helper function to set test location (for debugging)
  // You can call this from console: window.setTestLocation()
  if (typeof window !== "undefined") {
    (window as any).setTestLocation = (lat: number, lng: number) => {
      setLocation({ lat, lng });
      console.log(`[Test] Location set to: ${lat}, ${lng}`);
    };
  }
  const getFormDataRef = useRef<
    | (() => {
        goal: HealthGoal;
        timeOfDay: TimeOfDay;
        lastMeal: string | null;
        lastMealTime: string | null;
        budgetMax: number;
        radiusMiles: number;
      })
    | null
  >(null);

  // Stable callback for form data getter
  const handleGetFormData = useCallback(
    (
      getData: () => {
        goal: HealthGoal;
        timeOfDay: TimeOfDay;
        lastMeal: string | null;
        lastMealTime: string | null;
        budgetMax: number;
        radiusMiles: number;
      }
    ) => {
      getFormDataRef.current = getData;
    },
    []
  );

  const handleGetLocation = async () => {
    try {
      if (Platform.OS === "web") {
        if (!navigator.geolocation) {
          Alert.alert("Error", "Geolocation is not supported by your browser");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            Alert.alert("Error", `Failed to get location: ${error.message}`);
          }
        );
      } else {
        // For React Native, we'll use a mock location for now
        // In production, you'd use expo-location
        Alert.alert(
          "Info",
          "Please install expo-location for native geolocation. Using default location for demo."
        );
        setLocation({ lat: 40.7505, lng: -73.9934 }); // Default NYC location
      }
    } catch (error: any) {
      Alert.alert("Error", `Failed to get location: ${error.message}`);
    }
  };

  const handleSubmit = () => {
    if (!getFormDataRef.current) {
      Alert.alert("Error", "Form data not available");
      return;
    }

    const formData = getFormDataRef.current();

    // If location is not set, use a random Kansas location as default
    // But inform the user first
    if (!location) {
      // Kansas approximate bounds:
      // Latitude: 37.0 to 40.0
      // Longitude: -102.0 to -94.6
      const kansasLat = 37.0 + Math.random() * (40.0 - 37.0);
      const kansasLng = -102.0 + Math.random() * (-94.6 - -102.0);
      const defaultLocation = { lat: kansasLat, lng: kansasLng };

      // Inform user that default location will be used
      Alert.alert(
        "Using Default Location",
        "No location was set. Recommendations will be based on a random location in Kansas. For more accurate results, please use 'Use My Location' to set your actual location.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Continue",
            onPress: () => {
              handleGetRecommendations({
                goal: formData.goal,
                timeOfDay: formData.timeOfDay,
                lastMeal: formData.lastMeal,
                lastMealTime: formData.lastMealTime,
                activityLevel: null,
                lastMealHeaviness: null,
                budgetMax: formData.budgetMax,
                radiusMiles: formData.radiusMiles,
                lat: defaultLocation.lat,
                lng: defaultLocation.lng,
              });
            },
          },
        ]
      );
      return;
    }

    // Location is set, use it
    handleGetRecommendations({
      goal: formData.goal,
      timeOfDay: formData.timeOfDay,
      lastMeal: formData.lastMeal,
      lastMealTime: formData.lastMealTime,
      activityLevel: null,
      lastMealHeaviness: null,
      budgetMax: formData.budgetMax,
      radiusMiles: formData.radiusMiles,
      lat: location.lat,
      lng: location.lng,
    });
  };

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

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });
      } catch (fetchError: any) {
        console.error("[Recommendations] Fetch error:", fetchError);
        throw new Error(
          `Network error: ${fetchError.message}. Make sure the API server is running and accessible at ${apiUrl}`
        );
      }

      console.log(
        "[Recommendations] Response status:",
        response.status,
        response.ok
      );

      // Read response body once - as text first, then try to parse as JSON
      const responseText = await response.text();

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          // Not JSON, use text as error message
          console.error("[Recommendations] Error response text:", responseText);

          // Provide helpful error message for 404
          if (response.status === 404) {
            throw new Error(
              `API endpoint not found (404). The route ${apiUrl} does not exist. ` +
                `Make sure:\n` +
                `1. The API route file exists at app/api/recommendations+api.ts\n` +
                `2. The development server is running\n` +
                `3. For web, ensure Expo Router is properly configured\n` +
                `Response: ${responseText.substring(0, 200)}`
            );
          }

          throw new Error(
            `Request failed with status ${
              response.status
            }: ${responseText.substring(0, 200)}`
          );
        }
        console.error("[Recommendations] Error response:", error);
        throw new Error(
          error.error || `Failed to get recommendations (${response.status})`
        );
      }

      let result;
      try {
        result = JSON.parse(responseText);
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
      if (result.context !== undefined) {
        // New format with context (may have empty results)
        const results = result.results || [];
        console.log(
          "[Recommendations] Setting recommendations:",
          results.length
        );
        setRecommendations(results);

        // Extract context string - handle both string and object formats for safety
        let contextString: string | null = null;
        if (typeof result.context === "string") {
          contextString = result.context;
        } else if (
          result.context &&
          typeof result.context === "object" &&
          "guidancePreview" in result.context
        ) {
          contextString = (result.context as any).guidancePreview;
        }
        setContextGuidance(contextString);
        setHasWarning(!!result.warning);

        // Show warning if database connection was unavailable
        if (result.warning) {
          Alert.alert(
            "Limited Recommendations",
            "Unable to connect to the database. Showing general guidance only. Please check your internet connection.",
            [{ text: "OK" }]
          );
        }
      } else if (Array.isArray(result.results)) {
        // Old format or direct results array
        console.log(
          "[Recommendations] Setting recommendations (old format):",
          result.results.length
        );
        setRecommendations(result.results);
        setContextGuidance(null);
        setHasWarning(false);
      } else {
        console.warn("[Recommendations] Unexpected response format:", result);
        setRecommendations([]);
        setContextGuidance(null);
        setHasWarning(false);
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
                      backgroundColor: "#FAF9F6",
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
                <Ionicons name="hourglass-outline" size={64} color="#878787" />
                <Text className="h3-bold text-text-primary mt-4 mb-2">
                  Finding the best meals...
                </Text>
              </View>
            ) : recommendations.length > 0 ? (
              <>
                <View
                  className="flex-row flex-wrap"
                  style={{
                    gap: 8,
                    justifyContent: "space-between",
                  }}
                >
                  {recommendations.map((rec, index) => (
                    <View
                      key={`${rec.restaurant.id}-${rec.item.id}-${index}`}
                      style={{
                        width: "31%",
                        flexBasis: "31%",
                      }}
                    >
                      <RecommendationCard recommendation={rec} index={index} />
                    </View>
                  ))}
                </View>
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
              <View className="items-center justify-center py-8 px-5">
                <Ionicons name="restaurant-outline" size={64} color="#878787" />
                <Text className="h3-bold text-text-primary mt-4 mb-2">
                  No recommendations found
                </Text>

                {hasWarning && (
                  <View className="bg-accent-primary/10 border border-accent-primary/30 rounded-2xl p-4 mb-4 w-full">
                    <View className="flex-row items-start gap-2 mb-2">
                      <Ionicons
                        name="warning-outline"
                        size={20}
                        color="#E63946"
                      />
                      <Text className="paragraph-semibold text-accent-primary flex-1">
                        Database Connection Unavailable
                      </Text>
                    </View>
                    <Text className="paragraph-small text-text-secondary">
                      Unable to connect to the database. Please check your
                      internet connection.
                    </Text>
                  </View>
                )}

                {contextGuidance && (
                  <View className="bg-bg-secondary border border-accent-primary/20 rounded-2xl p-4 mb-4 w-full">
                    <View className="flex-row items-start gap-2 mb-2">
                      <Ionicons name="bulb-outline" size={20} color="#2A9D8F" />
                      <Text className="paragraph-semibold text-accent-tertiary flex-1">
                        General Guidance
                      </Text>
                    </View>
                    <Text className="paragraph-small text-text-secondary whitespace-pre-line">
                      {contextGuidance}
                    </Text>
                  </View>
                )}

                {!contextGuidance && !hasWarning && (
                  <Text className="paragraph-medium text-text-tertiary text-center mb-4">
                    Try adjusting your filters or location
                  </Text>
                )}

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
                      backgroundColor: "#FAF9F6",
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
          </AnimatedView>

          {/* Side by Side Layout: Search and Healthy Picks Form */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120,
            }}
            style={{ flex: 1 }}
          >
            <View className="flex-row gap-4" style={{ width: "100%" }}>
              {/* Search Section */}
              <View style={{ flex: 1 }}>
                <AnimatedView entering={FadeIn.duration(300)}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="small-bold uppercase text-accent-primary mb-1">
                        Search
                      </Text>
                      <Text className="h3-bold text-text-primary">
                        Find your favorite food
                      </Text>
                    </View>
                  </View>

                  {/* Search Bar */}
                  <View className="mb-4">
                    <SearchBar />
                  </View>

                  {/* Location Button */}
                  <View className="mb-4 items-center">
                    <View style={{ maxWidth: 280 }}>
                      <Button
                        title={
                          location
                            ? `Location: ${location.lat.toFixed(
                                4
                              )}, ${location.lng.toFixed(4)}`
                            : "Use My Location (Recommended)"
                        }
                        onPress={handleGetLocation}
                        variant="secondary"
                        leftIcon="location"
                      />
                      {!location && (
                        <Text className="paragraph-small text-text-tertiary text-center mt-2 px-2">
                          Location not set. Default location will be used if you
                          proceed without setting one.
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Submit Button */}
                  <View className="items-center mb-2">
                    <View style={{ maxWidth: 280, width: "100%" }}>
                      <Button
                        title="Suggest the best healthy meal"
                        onPress={handleSubmit}
                        variant="primary"
                        isLoading={isLoadingRecommendations}
                        fullWidth
                      />
                    </View>
                  </View>
                </AnimatedView>
              </View>

              {/* Healthy Picks Form */}
              <View style={{ flex: 1 }}>
                <HealthyPicksForm
                  isLoading={isLoadingRecommendations}
                  location={location}
                  onGetFormData={handleGetFormData}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

export default Search;
