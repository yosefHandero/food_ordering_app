import { Button } from "@/components/ui/Button";
import { HealthGoal, TimeOfDay } from "@/type";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface HealthyPicksFormProps {
  onSubmit: (data: {
    goal: HealthGoal;
    timeOfDay: TimeOfDay;
    lastMeal?: string | null;
    lastMealTime?: string | null;
    activityLevel?: "sedentary" | "light" | "workout" | null;
    lastMealHeaviness?: "light" | "medium" | "heavy" | null;
    budgetMax: number;
    radiusMiles: number;
    lat: number;
    lng: number;
  }) => void;
  isLoading: boolean;
}

export function HealthyPicksForm({
  onSubmit,
  isLoading,
}: HealthyPicksFormProps) {
  const [goal, setGoal] = useState<HealthGoal>("balanced");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getDefaultTimeOfDay());
  const [lastMeal, setLastMeal] = useState("");
  const [lastMealTime, setLastMealTime] = useState("");
  const [budgetMax, setBudgetMax] = useState("30");
  const [radius, setRadius] = useState("5");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  function getDefaultTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 15) return "lunch";
    if (hour >= 15 && hour < 21) return "dinner";
    return "snack";
  }

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
              onSubmit({
                goal,
                timeOfDay,
                lastMeal: lastMeal.trim() || null,
                lastMealTime: lastMealTime.trim() || null,
                activityLevel: null,
                lastMealHeaviness: null,
                budgetMax: parseFloat(budgetMax) || 30,
                radiusMiles: parseFloat(radius) || 5,
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
    onSubmit({
      goal,
      timeOfDay,
      lastMeal: lastMeal.trim() || null,
      lastMealTime: lastMealTime.trim() || null,
      activityLevel: null, // Not adding new inputs per requirements
      lastMealHeaviness: null, // Not adding new inputs per requirements
      budgetMax: parseFloat(budgetMax) || 30,
      radiusMiles: parseFloat(radius) || 5,
      lat: location.lat,
      lng: location.lng,
    });
  };

  // Generate guidance preview text
  const getGuidancePreview = (): string => {
    const parts: string[] = [];

    // Check last meal context
    if (lastMeal && lastMealTime) {
      const lastMealLower = lastMeal.toLowerCase();
      const isHeavy =
        lastMealLower.includes("pizza") ||
        lastMealLower.includes("burger") ||
        lastMealLower.includes("fried") ||
        lastMealLower.includes("heavy");

      // Parse time (simple: check if contains "h ago" or "m ago")
      const timeMatch = lastMealTime.match(/(\d+)\s*(h|m|hour|minute)/i);
      const isRecent =
        timeMatch &&
        ((timeMatch[2].toLowerCase().startsWith("h") &&
          parseInt(timeMatch[1]) < 3) ||
          (timeMatch[2].toLowerCase().startsWith("m") &&
            parseInt(timeMatch[1]) < 180));

      if (isHeavy && isRecent) {
        parts.push(
          "Last meal was heavy and recent → lighter, lower-sodium picks ranked higher."
        );
      }
    }

    // Check lunch + workout (activityLevel would be here if we had it)
    if (timeOfDay === "lunch") {
      parts.push(
        "Lunch + workout → protein-forward balanced meals ranked higher."
      );
    }

    // Check late dinner
    const hour = new Date().getHours();
    if (timeOfDay === "dinner" && hour >= 20) {
      parts.push(
        "Late dinner → lighter portions and lower sodium prioritized."
      );
    }

    // Default if no specific guidance
    if (parts.length === 0) {
      return "Recommendations optimized for your goal and time of day.";
    }

    return parts[0]; // Return first matching guidance
  };

  // Generate avoid chips
  const getAvoidChips = (): string[] => {
    const chips: string[] = [];
    const hour = new Date().getHours();

    // Late day → avoid high sodium, fried, heavy portions
    if (hour >= 20 || (timeOfDay === "dinner" && hour >= 18)) {
      chips.push("very high sodium");
      chips.push("fried");
      chips.push("heavy portions");
    }

    // Heavy/recent last meal → avoid heavy portions, fried
    if (lastMeal) {
      const lastMealLower = lastMeal.toLowerCase();
      const isHeavy =
        lastMealLower.includes("pizza") ||
        lastMealLower.includes("burger") ||
        lastMealLower.includes("fried") ||
        lastMealLower.includes("heavy");
      const timeMatch = lastMealTime?.match(/(\d+)\s*(h|m|hour|minute)/i);
      const isRecent =
        timeMatch &&
        ((timeMatch[2].toLowerCase().startsWith("h") &&
          parseInt(timeMatch[1]) < 3) ||
          (timeMatch[2].toLowerCase().startsWith("m") &&
            parseInt(timeMatch[1]) < 180));

      if (isHeavy || isRecent) {
        if (!chips.includes("heavy portions")) chips.push("heavy portions");
        if (!chips.includes("fried")) chips.push("fried");
      }
    }

    // Low Cal goal → avoid sugary drinks, fried
    if (goal === "low-cal") {
      if (!chips.includes("sugary drinks")) chips.push("sugary drinks");
      if (!chips.includes("fried")) chips.push("fried");
    }

    // Limit to 3 chips
    return chips.slice(0, 3);
  };

  const guidancePreview = getGuidancePreview();
  const avoidChips = getAvoidChips();

  return (
    <View className="bg-bg-tertiary rounded-3xl p-5 mb-4 border border-bg-elevated/50">
      <Text className="h3-bold text-text-primary mb-4">
        Healthy Picks Near Me
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Goal */}
        <View className="mb-4">
          <Text className="paragraph-medium text-text-secondary mb-2">
            Goal
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                "high-protein",
                "low-cal",
                "balanced",
                "low-carb",
              ] as HealthGoal[]
            ).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGoal(g)}
                className={`px-4 py-2 rounded-full border ${
                  goal === g
                    ? "bg-accent-primary border-accent-primary"
                    : "bg-bg-primary border-bg-elevated/50"
                }`}
              >
                <Text
                  className={`text-sm font-quicksand-medium ${
                    goal === g ? "text-white" : "text-text-primary"
                  }`}
                >
                  {g === "high-protein"
                    ? "High Protein"
                    : g === "low-cal"
                    ? "Low Cal"
                    : g === "low-carb"
                    ? "Low Carb"
                    : "Balanced"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time of Day */}
        <View className="mb-4">
          <Text className="paragraph-medium text-text-secondary mb-2">
            Time of Day
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(["breakfast", "lunch", "dinner", "snack"] as TimeOfDay[]).map(
              (t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTimeOfDay(t)}
                  className={`px-4 py-2 rounded-full border ${
                    timeOfDay === t
                      ? "bg-accent-primary border-accent-primary"
                      : "bg-bg-primary border-bg-elevated/50"
                  }`}
                >
                  <Text
                    className={`text-sm font-quicksand-medium capitalize ${
                      timeOfDay === t ? "text-white" : "text-text-primary"
                    }`}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Last Meal */}
        <View className="mb-4">
          <Text className="paragraph-medium text-text-secondary mb-2">
            Last Meal (optional)
          </Text>
          <TextInput
            value={lastMeal}
            onChangeText={setLastMeal}
            placeholder="e.g., pizza"
            placeholderTextColor="#808080"
            className="bg-bg-primary rounded-2xl p-3 text-text-primary border border-bg-elevated/50"
          />
        </View>

        {/* Last Meal Time */}
        <View className="mb-4">
          <Text className="paragraph-medium text-text-secondary mb-2">
            Last Meal Time (optional)
          </Text>
          <TextInput
            value={lastMealTime}
            onChangeText={setLastMealTime}
            placeholder="e.g., 2h ago"
            placeholderTextColor="#808080"
            className="bg-bg-primary rounded-2xl p-3 text-text-primary border border-bg-elevated/50"
          />
        </View>

        {/* Guidance Preview */}
        <View className="mb-3">
          <Text className="paragraph-small text-text-secondary italic">
            {guidancePreview}
          </Text>
        </View>

        {/* Avoid Chips */}
        {avoidChips.length > 0 && (
          <View className="mb-4">
            <Text className="paragraph-small text-text-tertiary mb-2">
              Avoid today:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {avoidChips.map((chip, index) => (
                <View
                  key={index}
                  className="bg-bg-primary rounded-full px-3 py-1.5 border border-bg-elevated/50"
                >
                  <Text className="paragraph-small text-text-tertiary">
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Budget */}
        <View className="mb-4">
          <Text className="paragraph-medium text-text-secondary mb-2">
            Budget Max: ${budgetMax}
          </Text>
          <TextInput
            value={budgetMax}
            onChangeText={setBudgetMax}
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor="#808080"
            className="bg-bg-primary rounded-2xl p-3 text-text-primary border border-bg-elevated/50"
          />
        </View>

        {/* Radius */}
        <View className="mb-4">
          <Text className="paragraph-medium text-text-secondary mb-2">
            Radius: {radius} miles
          </Text>
          <TextInput
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#808080"
            className="bg-bg-primary rounded-2xl p-3 text-text-primary border border-bg-elevated/50"
          />
        </View>

        {/* Location */}
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
                Location not set. Default location will be used if you proceed
                without setting one.
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
              isLoading={isLoading}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
