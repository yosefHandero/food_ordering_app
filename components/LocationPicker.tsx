import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LocationPickerProps } from "@/type";
import { Card } from "./ui/Card";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export function LocationPicker({
  visible,
  onClose,
  onSelectLocation,
}: LocationPickerProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  // Animation for pulsing location icon
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      setSelectedState(null);
      setCitySearch("");
      setIsGeocoding(false);
      setLoadingStep("");
    }
  }, [visible]);

  useEffect(() => {
    if (isGeocoding) {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isGeocoding, pulseScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleStateSelect = (stateCode: string) => {
    setSelectedState(stateCode);
    setCitySearch("");
  };

  const handleCitySelect = async (city: string) => {
    if (!selectedState) return;

    setIsGeocoding(true);
    setLoadingStep("Searching for location...");
    try {
      // Use OpenStreetMap Nominatim for geocoding
      const stateName = US_STATES.find((s) => s.code === selectedState)?.name;
      setLoadingStep("Getting coordinates...");
      const query = encodeURIComponent(`${city}, ${stateName}, USA`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "MealHop/1.0",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to geocode location");
      }

      const data = await response.json();
      if (data.length === 0) {
        setIsGeocoding(false);
        setLoadingStep("");
        Alert.alert("Error", "Could not find coordinates for this location");
        return;
      }

      setLoadingStep("Finalizing...");
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      onSelectLocation({
        lat,
        lng,
        city,
        state: stateName || selectedState,
      });
      onClose();
      setSelectedState(null);
      setCitySearch("");
      setLoadingStep("");
    } catch (error: any) {
      console.error("Geocoding error:", error);
      setIsGeocoding(false);
      setLoadingStep("");
      Alert.alert(
        "Error",
        `Failed to get location: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsGeocoding(false);
      setLoadingStep("");
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGeocoding(true);
    setLoadingStep("Requesting location access...");

    if (Platform.OS === "web") {
      if (!navigator.geolocation) {
        setIsGeocoding(false);
        setLoadingStep("");
        Alert.alert("Error", "Geolocation is not supported by your browser");
        return;
      }

      setLoadingStep("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            setLoadingStep("Looking up address...");
            // Get city/state from coordinates
            const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
            const response = await fetch(reverseUrl, {
              headers: {
                "User-Agent": "MealHop/1.0",
              },
            });

            if (response.ok) {
              const data = await response.json();
              const city =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "Unknown";
              const state = data.address?.state || "Unknown";

              onSelectLocation({ lat, lng, city, state });
              onClose();
            } else {
              onSelectLocation({
                lat,
                lng,
                city: "Current Location",
                state: "Unknown",
              });
              onClose();
            }
          } catch (error: any) {
            Alert.alert("Error", `Failed to get address: ${error.message}`);
          } finally {
            setIsGeocoding(false);
            setLoadingStep("");
          }
        },
        (error) => {
          setIsGeocoding(false);
          setLoadingStep("");
          Alert.alert("Error", `Failed to get location: ${error.message}`);
        }
      );
    } else {
      setIsGeocoding(false);
      setLoadingStep("");
      Alert.alert(
        "Info",
        "Please install expo-location for native geolocation."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card variant="elevated" className="w-full max-w-md max-h-[80vh]">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="h2-bold text-text-primary">
                  Select Location
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#878787" />
                </TouchableOpacity>
              </View>

              {/* Use Current Location Button */}
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={isGeocoding}
                className="flex-row items-center justify-center gap-2 px-6 py-4 rounded-full bg-accent-primary mb-4"
                style={{
                  opacity: isGeocoding ? 0.8 : 1,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#E63946",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                    },
                    android: {
                      elevation: 6,
                    },
                  }),
                }}
              >
                {isGeocoding ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text className="text-sm font-quicksand-medium text-white/90">
                      {loadingStep || "Getting location..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Animated.View style={animatedIconStyle}>
                      <Ionicons name="location" size={20} color="#FFFFFF" />
                    </Animated.View>
                    <Text className="text-base font-quicksand-semibold text-white">
                      Use My Location
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center gap-3 mb-4">
                <View className="flex-1 h-px bg-bg-elevated" />
                <Text className="text-xs font-quicksand-medium text-text-tertiary">
                  OR
                </Text>
                <View className="flex-1 h-px bg-bg-elevated" />
              </View>

              {!selectedState ? (
                <>
                  {/* State Selection */}
                  <Text className="paragraph-medium text-text-secondary mb-3">
                    Select a State
                  </Text>
                  {US_STATES.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => handleStateSelect(item.code)}
                      className="px-4 py-3 rounded-xl bg-white border border-bg-elevated/40 mb-2"
                      style={{
                        ...Platform.select({
                          ios: {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                          },
                          android: {
                            elevation: 2,
                          },
                        }),
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-quicksand-medium text-text-primary">
                          {item.name}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#878787"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  {/* City Input */}
                  <View className="mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedState(null);
                          setCitySearch("");
                        }}
                        className="p-2"
                      >
                        <Ionicons name="arrow-back" size={20} color="#878787" />
                      </TouchableOpacity>
                      <Text className="text-base font-quicksand-semibold text-text-primary">
                        {US_STATES.find((s) => s.code === selectedState)?.name}
                      </Text>
                    </View>
                    <Text className="paragraph-small text-text-secondary mb-2">
                      Enter city name
                    </Text>
                    <TextInput
                      className="px-4 py-3 rounded-xl bg-white border border-bg-elevated/40 text-base font-quicksand-medium text-text-primary"
                      placeholder="e.g., Kansas City, Wichita..."
                      placeholderTextColor="#878787"
                      value={citySearch}
                      onChangeText={setCitySearch}
                      autoCapitalize="words"
                      style={{
                        ...Platform.select({
                          ios: {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                          },
                          android: {
                            elevation: 2,
                          },
                        }),
                      }}
                    />
                  </View>

                  {/* Submit Button */}
                  {citySearch.trim() && (
                    <TouchableOpacity
                      onPress={() => handleCitySelect(citySearch.trim())}
                      disabled={isGeocoding}
                      className="flex-row items-center justify-center gap-2 px-6 py-4 rounded-full bg-accent-primary mb-4"
                      style={{
                        opacity: isGeocoding ? 0.8 : 1,
                        ...Platform.select({
                          ios: {
                            shadowColor: "#E63946",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                          },
                          android: {
                            elevation: 6,
                          },
                        }),
                      }}
                    >
                      {isGeocoding ? (
                        <View className="flex-row items-center gap-2">
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text className="text-sm font-quicksand-medium text-white/90">
                            {loadingStep || "Finding location..."}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text className="text-base font-quicksand-semibold text-white">
                            Select Location
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
