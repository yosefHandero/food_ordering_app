import { HealthGoal, TimeOfDay } from "@/type";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface HealthyPicksFormProps {
  isLoading: boolean;
  location: { lat: number; lng: number } | null;
  onGetFormData: (
    getData: () => {
      goal: HealthGoal;
      timeOfDay: TimeOfDay;
      lastMeal: string | null;
      lastMealTime: string | null;
      budgetMax: number;
      radiusMiles: number;
    }
  ) => void;
}

export function HealthyPicksForm({
  isLoading,
  location,
  onGetFormData,
}: HealthyPicksFormProps) {
  const [goal, setGoal] = useState<HealthGoal>("balanced");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getDefaultTimeOfDay());
  const [lastMeal, setLastMeal] = useState("");
  const [lastMealTime, setLastMealTime] = useState("");
  const [budgetMax, setBudgetMax] = useState("30");
  const [radius, setRadius] = useState("5");

  function getDefaultTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 15) return "lunch";
    if (hour >= 15 && hour < 21) return "dinner";
    return "snack";
  }

  // Expose form data getter for parent component
  const getFormData = useCallback(
    () => ({
      goal,
      timeOfDay,
      lastMeal: lastMeal.trim() || null,
      lastMealTime: lastMealTime.trim() || null,
      budgetMax: parseFloat(budgetMax) || 30,
      radiusMiles: parseFloat(radius) || 5,
    }),
    [goal, timeOfDay, lastMeal, lastMealTime, budgetMax, radius]
  );

  // Expose getFormData to parent via callback
  useEffect(() => {
    onGetFormData(getFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFormData]); // onGetFormData is stable from parent, no need to include

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
            placeholderTextColor="#878787"
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
            placeholderTextColor="#878787"
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
            placeholderTextColor="#878787"
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
            placeholderTextColor="#878787"
            className="bg-bg-primary rounded-2xl p-3 text-text-primary border border-bg-elevated/50"
          />
        </View>
      </ScrollView>
    </View>
  );
}
