import { BurgerLogo } from "@/components/BurgerLogo";
import { HealthyPicksForm } from "@/components/HealthyPicksForm";
import { LocationPicker } from "@/components/LocationPicker";
import { RecommendationCard } from "@/components/RecommendationCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/Button";
import { getLocationDisplayName } from "@/lib/location-utils";
import {
  HealthGoal,
  RecommendationRequest,
  RecommendationResult,
  TimeOfDay,
} from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

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
  const [locationDisplayName, setLocationDisplayName] = useState<string | null>(
    null
  );
  const [isLoadingLocationName, setIsLoadingLocationName] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRequestInProgressRef = useRef(false);
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation for pulsing location icon
  const locationIconScale = useSharedValue(1);
  // Animation for shaking location button
  const locationShakeX = useSharedValue(0);
  // Animation for location button press effect
  const locationButtonScale = useSharedValue(1);
  const locationButtonShadowOffsetY = useSharedValue(1);
  const locationButtonShadowOpacity = useSharedValue(
    showLocationError ? 0.2 : 0.05
  );
  const locationButtonShadowRadius = useSharedValue(showLocationError ? 8 : 4);
  const locationButtonElevation = useSharedValue(showLocationError ? 4 : 2);

  useEffect(() => {
    if (isLoadingLocationName) {
      locationIconScale.value = withRepeat(
        withTiming(1.2, { duration: 800 }),
        -1,
        true
      );
    } else {
      locationIconScale.value = withTiming(1, { duration: 200 });
    }
  }, [isLoadingLocationName, locationIconScale]);

  const animatedLocationIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: locationIconScale.value }],
  }));

  // Shake animation for location button
  const animatedLocationButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: locationShakeX.value },
      { scale: locationButtonScale.value },
    ],
    shadowOffset: { width: 0, height: locationButtonShadowOffsetY.value },
    shadowOpacity: locationButtonShadowOpacity.value,
    shadowRadius: locationButtonShadowRadius.value,
    ...(Platform.OS === "android" && {
      elevation: locationButtonElevation.value,
    }),
  }));

  const handleLocationButtonPressIn = () => {
    locationButtonScale.value = withSpring(0.97, {
      damping: 18,
      stiffness: 300,
    });
    locationButtonShadowOffsetY.value = withTiming(0.5, { duration: 150 });
    locationButtonShadowOpacity.value = withTiming(
      showLocationError ? 0.12 : 0.03,
      { duration: 150 }
    );
    locationButtonShadowRadius.value = withTiming(showLocationError ? 6 : 3, {
      duration: 150,
    });
    locationButtonElevation.value = withTiming(showLocationError ? 2 : 1, {
      duration: 150,
    });
  };

  const handleLocationButtonPressOut = () => {
    locationButtonScale.value = withSpring(1, { damping: 18, stiffness: 300 });
    locationButtonShadowOffsetY.value = withTiming(1, { duration: 200 });
    locationButtonShadowOpacity.value = withTiming(
      showLocationError ? 0.2 : 0.05,
      { duration: 200 }
    );
    locationButtonShadowRadius.value = withTiming(showLocationError ? 8 : 4, {
      duration: 200,
    });
    locationButtonElevation.value = withTiming(showLocationError ? 4 : 2, {
      duration: 200,
    });
  };

  if (typeof window !== "undefined") {
    (window as any).setTestLocation = (lat: number, lng: number) => {
      setLocation({ lat, lng });
    };
  }

  useEffect(() => {
    if (location) {
      setIsLoadingLocationName(true);
      getLocationDisplayName(location.lat, location.lng)
        .then((name) => {
          setLocationDisplayName(name);
          setIsLoadingLocationName(false);
        })
        .catch(() => {
          setIsLoadingLocationName(false);
        });
    } else {
      setLocationDisplayName(null);
      setIsLoadingLocationName(false);
    }
  }, [location]);

  // Reset to search form when home tab is focused (but not during active loading or when we have results)
  useFocusEffect(
    useCallback(() => {
      // Only reset if we're viewing recommendations AND not currently loading AND we have no recommendations AND no active request
      // This prevents resetting during the initial request or when results are displayed
      // Note: We allow resetting even with contextGuidance (error messages) so users can start a new search
      if (
        showRecommendations &&
        !isLoadingRecommendations &&
        recommendations.length === 0 &&
        !isRequestInProgressRef.current
      ) {
        setShowRecommendations(false);
      }
    }, [showRecommendations, isLoadingRecommendations, recommendations.length])
  );
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

  const handleGetLocation = () => {
    setShowLocationPicker(true);
  };

  const handleLocationSelected = (selectedLocation: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  }) => {
    setLocation({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    });
    setShowLocationPicker(false);

    // Clear any pending error timeout and reset error state
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setShowLocationError(false); // Reset error state when location is set
  };

  const handleSubmit = () => {
    if (!getFormDataRef.current) {
      Alert.alert("Error", "Form data not available");
      return;
    }

    const formData = getFormDataRef.current();

    if (!location) {
      // Clear any existing timeout to prevent premature error state clearing
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }

      // Trigger shake animation with red border
      setShowLocationError(true);

      // Calculate exact animation duration: 100ms initial + (6 steps × 100ms) = 700ms
      const animationDuration = 100 + 6 * 100; // 700ms

      locationShakeX.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withRepeat(
          withSequence(
            withTiming(10, { duration: 100 }),
            withTiming(-10, { duration: 100 }),
            withTiming(10, { duration: 100 }),
            withTiming(-10, { duration: 100 }),
            withTiming(10, { duration: 100 }),
            withTiming(0, { duration: 100 })
          ),
          1
        )
      );

      // Reset error state after animation completes (with small buffer for safety)
      // Store timeout ID to allow cancellation on rapid submissions
      errorTimeoutRef.current = setTimeout(() => {
        setShowLocationError(false);
        errorTimeoutRef.current = null;
      }, animationDuration + 50); // 750ms total
      return;
    }

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
    // Clear any pending timeout from previous requests to prevent race conditions
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }

    isRequestInProgressRef.current = true;
    setIsLoadingRecommendations(true);
    setShowRecommendations(true);

    try {
      let apiUrl: string;

      if (process.env.EXPO_PUBLIC_API_URL) {
        apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/recommendations`;
      } else if (typeof window !== "undefined") {
        const origin = window.location.origin;
        apiUrl = `${origin}/api/recommendations`;
      } else {
        const apiBase =
          process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8081";
        apiUrl = `${apiBase}/api/recommendations`;
      }

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
        throw new Error(
          `Network error: ${fetchError.message}. Make sure the API server is running and accessible at ${apiUrl}`
        );
      }

      // Read response body once - as text first, then try to parse as JSON
      const responseText = await response.text();

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          // Not JSON, use text as error message
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
        throw new Error(
          error.error || `Failed to get recommendations (${response.status})`
        );
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid JSON response from server");
      }

      // Handle both old and new response formats
      if (result.context !== undefined) {
        // New format with context (may have empty results)
        const results = result.results || [];
        setRecommendations(results);

        // Ensure showRecommendations stays true when we have results or context
        if (results.length > 0 || result.context) {
          setShowRecommendations(true);
        }

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
        setRecommendations(result.results);
        // Ensure showRecommendations stays true when we have results
        if (result.results.length > 0) {
          setShowRecommendations(true);
        }
        setContextGuidance(null);
        setHasWarning(false);
      } else {
        setRecommendations([]);
        setContextGuidance(null);
        setHasWarning(false);
      }
    } catch (error: any) {
      console.error("[Recommendations] Error:", error);

      // Set error state for better UX
      setRecommendations([]);
      setContextGuidance(null);

      // Determine error type for better messaging
      const errorMessage = error.message || "Unknown error occurred";
      const isNetworkError =
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Network request failed");

      if (isNetworkError) {
        setHasWarning(true);
        Alert.alert(
          "Connection Error",
          "Unable to connect to our servers. Please check your internet connection and try again.",
          [
            { text: "OK" },
            {
              text: "Retry",
              onPress: () => {
                // Rebuild request data from form and location
                if (!getFormDataRef.current) {
                  Alert.alert("Error", "Form data not available");
                  return;
                }
                const formData = getFormDataRef.current();
                const currentLocation = location || { lat: 38.5, lng: -98.0 }; // Default Kansas location
                handleGetRecommendations({
                  goal: formData.goal,
                  timeOfDay: formData.timeOfDay,
                  lastMeal: formData.lastMeal,
                  lastMealTime: formData.lastMealTime,
                  activityLevel: null,
                  lastMealHeaviness: null,
                  budgetMax: formData.budgetMax,
                  radiusMiles: formData.radiusMiles,
                  lat: currentLocation.lat,
                  lng: currentLocation.lng,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error Getting Recommendations",
          errorMessage || "Something went wrong. Please try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoadingRecommendations(false);
      // Keep the ref true for a brief moment to prevent race conditions with useFocusEffect
      // Clear any existing timeout first to handle rapid successive requests
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      requestTimeoutRef.current = setTimeout(() => {
        isRequestInProgressRef.current = false;
        requestTimeoutRef.current = null;
      }, 100);
    }
  };

  return (
    <SafeAreaView className="bg-bg-primary h-full" edges={["top"]}>
      {showRecommendations ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <AnimatedView entering={FadeIn.duration(300)} className="mb-4">
            {/* Centered MealHop Branding - Tighter */}
            <View className="items-center justify-center py-4 mb-4">
              <View className="flex-row items-center gap-3">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#FAF9F6",
                    padding: 5,
                    width: 56,
                    height: 56,
                  }}
                >
                  <BurgerLogo size={46} />
                </View>
                <View>
                  <Text
                    className="font-quicksand-bold text-text-primary"
                    style={{ fontSize: 28, lineHeight: 34 }}
                  >
                    MealHop
                  </Text>
                  <Text
                    className="text-text-tertiary font-quicksand-medium"
                    style={{ fontSize: 14, lineHeight: 18, marginTop: 2 }}
                  >
                    Find Your Perfect Meal
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between px-5 py-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="small-bold uppercase text-accent-primary" style={{ fontSize: 10 }}>
                    Healthy Picks
                  </Text>
                  <View className="flex-row items-center justify-center bg-accent-primary/10 px-1.5 py-1 rounded-full">
                    <Ionicons name="sparkles" size={10} color="#E63946" />
                  </View>
                </View>
                <Text className="h3-bold text-text-primary" style={{ fontSize: 20 }}>
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
                {contextGuidance && (
                  <View className="bg-bg-secondary border border-accent-primary/15 rounded-lg p-3 mb-3">
                    <View className="flex-row items-start gap-2 mb-1">
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color="#2A9D8F"
                      />
                      <Text
                        className="paragraph-semibold text-accent-tertiary flex-1"
                        style={{ fontSize: 12 }}
                      >
                        Recommendation Context
                      </Text>
                    </View>
                    <Text
                      className="paragraph-small text-text-secondary whitespace-pre-line"
                      style={{ fontSize: 11, lineHeight: 16 }}
                    >
                      {contextGuidance}
                    </Text>
                  </View>
                )}
                <View
                  className="flex-row flex-wrap"
                  style={{
                    gap: 12,
                    justifyContent: "flex-start",
                  }}
                >
                  {recommendations.map((rec, index) => {
                    const screenWidth = Dimensions.get("window").width;
                    const padding = 20; // px-5 = 20px on each side
                    const availableWidth = screenWidth - padding * 2;
                    const gap = 12;
                    // Responsive: 3 cols (wide), 2 cols (medium), 1 col (small)
                    const cols = availableWidth > 768 ? 3 : availableWidth > 480 ? 2 : 1;
                    const cardWidth = (availableWidth - gap * (cols - 1)) / cols;
                    
                    return (
                      <View
                        key={`${rec.restaurant.id}-${rec.item.id}-${index}`}
                        style={{
                          width: cardWidth,
                        }}
                      >
                        <RecommendationCard recommendation={rec} index={index} />
                      </View>
                    );
                  })}
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
              <View className="items-center justify-center py-12 px-5">
                <Ionicons name="restaurant-outline" size={72} color="#878787" />
                <Text
                  className="h3-bold text-text-primary mt-6 mb-3"
                  style={{ fontSize: 22 }}
                >
                  No recommendations found
                </Text>

                {hasWarning && (
                  <View className="bg-accent-primary/10 border border-accent-primary/30 rounded-2xl p-5 mb-4 w-full">
                    <View className="flex-row items-start gap-3 mb-3">
                      <Ionicons
                        name="warning-outline"
                        size={24}
                        color="#E63946"
                      />
                      <View className="flex-1">
                        <Text
                          className="paragraph-semibold text-accent-primary mb-1"
                          style={{ fontSize: 15 }}
                        >
                          Connection Issue
                        </Text>
                        <Text
                          className="paragraph-small text-text-secondary"
                          style={{ fontSize: 13, lineHeight: 18 }}
                        >
                          Unable to connect to our services. Please check your
                          internet connection and try again.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={handleSubmit}
                      className="bg-accent-primary rounded-full py-2.5 px-4"
                    >
                      <Text
                        className="text-center text-white font-quicksand-semibold"
                        style={{ fontSize: 13 }}
                      >
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {contextGuidance && (
                  <View className="bg-bg-secondary border border-accent-primary/20 rounded-2xl p-5 mb-4 w-full">
                    <View className="flex-row items-start gap-3 mb-2">
                      <Ionicons name="bulb-outline" size={24} color="#2A9D8F" />
                      <Text
                        className="paragraph-semibold text-accent-tertiary flex-1"
                        style={{ fontSize: 15 }}
                      >
                        General Guidance
                      </Text>
                    </View>
                    <Text
                      className="paragraph-small text-text-secondary whitespace-pre-line"
                      style={{ fontSize: 13, lineHeight: 20 }}
                    >
                      {contextGuidance}
                    </Text>
                  </View>
                )}

                {!contextGuidance && !hasWarning && (
                  <View className="bg-bg-secondary border border-bg-elevated/50 rounded-2xl p-5 mb-4 w-full">
                    <Text
                      className="paragraph-medium text-text-secondary text-center mb-3"
                      style={{ fontSize: 14, lineHeight: 20 }}
                    >
                      We couldn&apos;t find any restaurants matching your
                      criteria in this area.
                    </Text>
                    <View className="gap-2">
                      <Text
                        className="paragraph-small text-text-tertiary text-center"
                        style={{ fontSize: 12 }}
                      >
                        • Try increasing your search radius
                      </Text>
                      <Text
                        className="paragraph-small text-text-tertiary text-center"
                        style={{ fontSize: 12 }}
                      >
                        • Adjust your budget range
                      </Text>
                      <Text
                        className="paragraph-small text-text-tertiary text-center"
                        style={{ fontSize: 12 }}
                      >
                        • Try a different health goal
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setShowRecommendations(false)}
                  className="bg-bg-primary rounded-full px-6 py-3 border border-bg-elevated/50"
                >
                  <Text
                    className="text-center text-accent-primary font-quicksand-semibold"
                    style={{ fontSize: 14 }}
                  >
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
          <AnimatedView entering={FadeIn.duration(300)} className="mb-4">
            {/* Centered MealHop Branding - Tighter */}
            <View className="items-center justify-center py-4 mb-4">
              <View className="flex-row items-center gap-3">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#FAF9F6",
                    padding: 5,
                    width: 56,
                    height: 56,
                  }}
                >
                  <BurgerLogo size={46} />
                </View>
                <View>
                  <Text
                    className="font-quicksand-bold text-text-primary"
                    style={{ fontSize: 28, lineHeight: 34 }}
                  >
                    MealHop
                  </Text>
                  <Text
                    className="text-text-tertiary font-quicksand-medium"
                    style={{ fontSize: 14, lineHeight: 18, marginTop: 2 }}
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
                  <View className="mb-3">
                    <Text className="small-bold uppercase text-accent-primary mb-1">
                      Search
                    </Text>
                    <Text className="h3-bold text-text-primary">
                      Find your favorite food
                    </Text>
                  </View>

                  {/* Search Bar */}
                  <View className="mb-4">
                    <SearchBar />
                  </View>

                  {/* Location Display */}
                  <View className="mb-4 items-center">
                    <View
                      style={{
                        maxWidth: Math.min(
                          280,
                          Dimensions.get("window").width - 80
                        ),
                        width: "100%",
                      }}
                    >
                      <AnimatedTouchableOpacity
                        onPress={handleGetLocation}
                        onPressIn={handleLocationButtonPressIn}
                        onPressOut={handleLocationButtonPressOut}
                        className={`flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-white ${
                          showLocationError
                            ? "border-2 border-accent-primary"
                            : "border border-bg-elevated/30"
                        }`}
                        style={[
                          animatedLocationButtonStyle,
                          {
                            ...Platform.select({
                              ios: {
                                shadowColor: showLocationError
                                  ? "#E63946"
                                  : "#000",
                              },
                            }),
                          },
                        ]}
                        activeOpacity={1}
                      >
                        <Animated.View style={animatedLocationIconStyle}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={
                              isLoadingLocationName ? "#E63946" : "#878787"
                            }
                          />
                        </Animated.View>
                        {isLoadingLocationName ? (
                          <View className="flex-row items-center gap-1.5 flex-1">
                            <ActivityIndicator size="small" color="#E63946" />
                            <Text
                              className="text-xs font-quicksand-medium text-text-secondary"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              Finding location...
                            </Text>
                          </View>
                        ) : location && locationDisplayName ? (
                          <View className="flex-row items-center gap-1.5 flex-1">
                            <Text
                              className="text-xs font-quicksand-medium text-text-secondary"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {locationDisplayName}
                            </Text>
                            <TouchableOpacity
                              onPress={handleGetLocation}
                              hitSlop={{
                                top: 8,
                                bottom: 8,
                                left: 8,
                                right: 8,
                              }}
                            >
                              <Text className="text-[10px] font-quicksand-medium text-accent-primary">
                                Change
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1.5 flex-1">
                            <Text
                              className="text-xs font-quicksand-medium text-text-tertiary"
                              numberOfLines={1}
                            >
                              Location not set
                            </Text>
                            <Text className="text-[10px] font-quicksand-medium text-accent-primary">
                              Set location
                            </Text>
                          </View>
                        )}
                      </AnimatedTouchableOpacity>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <View className="items-center mb-2">
                    <View style={{ maxWidth: 280, width: "100%" }}>
                      <Button
                        title={
                          isLoadingRecommendations
                            ? "Analyzing nutrition & menus…"
                            : "Get my best healthy pick"
                        }
                        onPress={handleSubmit}
                        variant="primary"
                        isLoading={isLoadingRecommendations}
                        leftIcon={isLoadingRecommendations ? undefined : "star"}
                        fullWidth
                      />
                      <View className="flex-row items-center justify-center gap-1.5 mt-3">
                        <Text className="paragraph-small text-text-tertiary text-center">
                          Powered by USDA nutrition data & local menus
                        </Text>
                        <View className="flex-row items-center justify-center bg-accent-primary/10 px-1 py-1 rounded-full">
                          <Ionicons name="sparkles" size={10} color="#E63946" />
                        </View>
                      </View>
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

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelected}
      />
    </SafeAreaView>
  );
}

export default Search;
