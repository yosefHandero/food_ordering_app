import { HealthGoal, TimeOfDay, HealthyPicksFormProps } from "@/type";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Time of Day Button Component with depth effects and hover-like interactions
const TimeOfDayButton = ({
  time,
  isSelected,
  onPress,
}: {
  time: TimeOfDay;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shadowOffsetY = useSharedValue(isSelected ? 4 : 2);
  const shadowOpacity = useSharedValue(isSelected ? 0.3 : 0.1);
  const shadowRadius = useSharedValue(isSelected ? 12 : 8);
  const elevation = useSharedValue(isSelected ? 6 : 3);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowColor: isSelected ? "#E63946" : "#000",
    shadowOffset: { width: 0, height: shadowOffsetY.value },
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
    ...(Platform.OS === "android" && {
      elevation: elevation.value,
    }),
  }));

  const handlePressIn = () => {
    // Hover-like effect: lift up with enhanced shadow, then press down
    translateY.value = withSequence(
      withSpring(-1.5, { damping: 20, stiffness: 400 }),
      withDelay(60, withSpring(1, { damping: 18, stiffness: 300 }))
    );
    scale.value = withSequence(
      withSpring(1.03, { damping: 20, stiffness: 400 }),
      withDelay(60, withSpring(0.96, { damping: 18, stiffness: 300 }))
    );
    // Shadow: increase for hover, then decrease for press
    shadowOffsetY.value = withSequence(
      withTiming(isSelected ? 5 : 3, { duration: 120 }),
      withDelay(60, withTiming(isSelected ? 2 : 1, { duration: 150 }))
    );
    shadowOpacity.value = withSequence(
      withTiming(isSelected ? 0.35 : 0.15, { duration: 120 }),
      withDelay(60, withTiming(isSelected ? 0.2 : 0.06, { duration: 150 }))
    );
    shadowRadius.value = withSequence(
      withTiming(isSelected ? 14 : 10, { duration: 120 }),
      withDelay(60, withTiming(isSelected ? 8 : 6, { duration: 150 }))
    );
    elevation.value = withSequence(
      withTiming(isSelected ? 7 : 4, { duration: 120 }),
      withDelay(60, withTiming(isSelected ? 3 : 2, { duration: 150 }))
    );
  };

  const handlePressOut = () => {
    // Restore to normal state with smooth animation
    translateY.value = withSpring(0, { damping: 18, stiffness: 300 });
    scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    shadowOffsetY.value = withTiming(isSelected ? 4 : 2, { duration: 200 });
    shadowOpacity.value = withTiming(isSelected ? 0.3 : 0.1, { duration: 200 });
    shadowRadius.value = withTiming(isSelected ? 12 : 8, { duration: 200 });
    elevation.value = withTiming(isSelected ? 6 : 3, { duration: 200 });
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`px-5 py-2.5 rounded-full border ${
        isSelected
          ? "bg-accent-primary border-accent-primary"
          : "bg-bg-primary border-bg-elevated/50"
      }`}
      style={[
        {
          minWidth: 90,
        },
        animatedStyle,
        animatedShadowStyle,
      ]}
      activeOpacity={1}
    >
      <Text
        className={`text-sm font-quicksand-semibold capitalize ${
          isSelected ? "text-white" : "text-text-primary"
        }`}
        style={{ fontSize: 13 }}
      >
        {time}
      </Text>
    </AnimatedTouchable>
  );
};

export function HealthyPicksForm({
  isLoading,
  location,
  onGetFormData,
}: HealthyPicksFormProps) {
  const [goal, setGoal] = useState<HealthGoal>("balanced");

  const goalOptions: {
    value: HealthGoal;
    label: string;
    description: string;
  }[] = [
    {
      value: "high-protein",
      label: "High Protein",
      description: "Muscle-building & satiety-focused",
    },
    {
      value: "low-calorie",
      label: "Low Calorie",
      description: "Light, calorie-controlled meals",
    },
    {
      value: "balanced",
      label: "Balanced",
      description: "Well-rounded nutrition",
    },
    {
      value: "low-carb",
      label: "Low Carb",
      description: "Reduced carbs, higher protein/fats",
    },
    {
      value: "high-fiber",
      label: "High Fiber",
      description: "Gut-friendly, filling meals",
    },
    {
      value: "heart-healthy",
      label: "Heart Healthy",
      description: "Low sodium, healthy fats",
    },
    {
      value: "energy-boost",
      label: "Energy Boost",
      description: "Energizing meals for performance",
    },
    {
      value: "weight-loss",
      label: "Weight Loss",
      description: "Optimized for calorie deficit",
    },
    {
      value: "muscle-gain",
      label: "Muscle Gain",
      description: "Protein-dense, nutrient-rich meals",
    },
    {
      value: "clean-eating",
      label: "Clean Eating",
      description: "Minimal processing, whole foods",
    },
  ];
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

    // Low Calorie goal → avoid sugary drinks, fried
    if (goal === "low-calorie" || goal === "weight-loss") {
      if (!chips.includes("sugary drinks")) chips.push("sugary drinks");
      if (!chips.includes("fried")) chips.push("fried");
    }

    // Limit to 3 chips
    return chips.slice(0, 3);
  };

  const guidancePreview = getGuidancePreview();
  const avoidChips = getAvoidChips();

  // Goal Button Component with Depth Effect and hover-like interactions
  const GoalButton = ({
    option,
    isSelected,
    onPress,
  }: {
    option: { value: HealthGoal; label: string };
    isSelected: boolean;
    onPress: () => void;
  }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const shadowOffsetY = useSharedValue(isSelected ? 4 : 2);
    const shadowOpacity = useSharedValue(isSelected ? 0.3 : 0.1);
    const shadowRadius = useSharedValue(isSelected ? 12 : 8);
    const elevation = useSharedValue(isSelected ? 6 : 3);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    const animatedShadowStyle = useAnimatedStyle(() => ({
      shadowColor: isSelected ? "#E63946" : "#000",
      shadowOffset: { width: 0, height: shadowOffsetY.value },
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
      ...(Platform.OS === "android" && {
        elevation: elevation.value,
      }),
    }));

    const handlePressIn = () => {
      // Hover-like effect: lift up with enhanced shadow, then press down
      translateY.value = withSequence(
        withSpring(-1.5, { damping: 20, stiffness: 400 }),
        withDelay(60, withSpring(1, { damping: 18, stiffness: 300 }))
      );
      scale.value = withSequence(
        withSpring(1.03, { damping: 20, stiffness: 400 }),
        withDelay(60, withSpring(0.96, { damping: 18, stiffness: 300 }))
      );
      // Shadow: increase for hover, then decrease for press
      shadowOffsetY.value = withSequence(
        withTiming(isSelected ? 5 : 3, { duration: 120 }),
        withDelay(60, withTiming(isSelected ? 2 : 1, { duration: 150 }))
      );
      shadowOpacity.value = withSequence(
        withTiming(isSelected ? 0.35 : 0.15, { duration: 120 }),
        withDelay(60, withTiming(isSelected ? 0.2 : 0.06, { duration: 150 }))
      );
      shadowRadius.value = withSequence(
        withTiming(isSelected ? 14 : 10, { duration: 120 }),
        withDelay(60, withTiming(isSelected ? 8 : 6, { duration: 150 }))
      );
      elevation.value = withSequence(
        withTiming(isSelected ? 7 : 4, { duration: 120 }),
        withDelay(60, withTiming(isSelected ? 3 : 2, { duration: 150 }))
      );
    };

    const handlePressOut = () => {
      // Restore to normal state with smooth animation
      translateY.value = withSpring(0, { damping: 18, stiffness: 300 });
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
      shadowOffsetY.value = withTiming(isSelected ? 4 : 2, { duration: 200 });
      shadowOpacity.value = withTiming(isSelected ? 0.3 : 0.1, {
        duration: 200,
      });
      shadowRadius.value = withTiming(isSelected ? 12 : 8, { duration: 200 });
      elevation.value = withTiming(isSelected ? 6 : 3, { duration: 200 });
    };

    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className={`px-4 py-2.5 rounded-full border ${
          isSelected
            ? "bg-accent-primary border-accent-primary"
            : "bg-white border-bg-elevated/40"
        }`}
        style={[
          {
            minWidth: 100,
          },
          animatedStyle,
          animatedShadowStyle,
        ]}
      >
        <Text
          className={`text-sm font-quicksand-semibold ${
            isSelected ? "text-white" : "text-text-primary"
          }`}
          style={{ fontSize: 12 }}
        >
          {option.label}
        </Text>
      </AnimatedTouchable>
    );
  };

  return (
    <View className="bg-bg-tertiary rounded-3xl p-6 mb-4 border border-bg-elevated/50 shadow-sm">
      <Text className="h3-bold text-text-primary mb-5" style={{ fontSize: 22 }}>
        Healthy Picks Near Me
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Goal */}
        <View className="mb-5">
          <Text
            className="paragraph-medium text-text-secondary mb-3"
            style={{ fontSize: 14, fontWeight: "600" }}
          >
            Health Goal
          </Text>
          {/* First row: 5 items */}
          <View className="flex-row flex-wrap gap-2.5 mb-2.5">
            {goalOptions.slice(0, 5).map((option) => (
              <GoalButton
                key={option.value}
                option={option}
                isSelected={goal === option.value}
                onPress={() => setGoal(option.value)}
              />
            ))}
          </View>
          {/* Second row: 5 items */}
          <View className="flex-row flex-wrap gap-2.5">
            {goalOptions.slice(5, 10).map((option) => (
              <GoalButton
                key={option.value}
                option={option}
                isSelected={goal === option.value}
                onPress={() => setGoal(option.value)}
              />
            ))}
          </View>
        </View>

        {/* Time of Day */}
        <View className="mb-5">
          <Text
            className="paragraph-medium text-text-secondary mb-3"
            style={{ fontSize: 14, fontWeight: "600" }}
          >
            Time of Day
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {(["breakfast", "lunch", "dinner", "snack"] as TimeOfDay[]).map(
              (t) => (
                <TimeOfDayButton
                  key={t}
                  time={t}
                  isSelected={timeOfDay === t}
                  onPress={() => setTimeOfDay(t)}
                />
              )
            )}
          </View>
        </View>

        {/* Last Meal */}
        <View className="mb-5">
          <Text
            className="paragraph-medium text-text-secondary mb-2.5"
            style={{ fontSize: 14, fontWeight: "600" }}
          >
            Last Meal (optional)
          </Text>
          <TextInput
            value={lastMeal}
            onChangeText={setLastMeal}
            placeholder="e.g., pizza"
            placeholderTextColor="#878787"
            className="bg-bg-primary rounded-2xl p-3.5 text-text-primary border border-bg-elevated/50"
            style={{ fontSize: 14 }}
          />
        </View>

        {/* Last Meal Time */}
        <View className="mb-5">
          <Text
            className="paragraph-medium text-text-secondary mb-2.5"
            style={{ fontSize: 14, fontWeight: "600" }}
          >
            Last Meal Time (optional)
          </Text>
          <TextInput
            value={lastMealTime}
            onChangeText={setLastMealTime}
            placeholder="e.g., 2h ago"
            placeholderTextColor="#878787"
            className="bg-bg-primary rounded-2xl p-3.5 text-text-primary border border-bg-elevated/50"
            style={{ fontSize: 14 }}
          />
        </View>

        {/* Guidance Preview */}
        <View className="mb-4 bg-accent-primary/10 rounded-xl p-3 border border-accent-primary/20">
          <Text
            className="paragraph-small text-text-secondary"
            style={{ fontSize: 12, lineHeight: 18 }}
          >
            {guidancePreview}
          </Text>
        </View>

        {/* Avoid Chips */}
        {avoidChips.length > 0 && (
          <View className="mb-5">
            <Text
              className="paragraph-small text-text-tertiary mb-2.5"
              style={{ fontSize: 13, fontWeight: "600" }}
            >
              Avoid today:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {avoidChips.map((chip, index) => (
                <View
                  key={index}
                  className="bg-bg-primary rounded-full px-3.5 py-2 border border-bg-elevated/50"
                >
                  <Text
                    className="paragraph-small text-text-tertiary"
                    style={{ fontSize: 12 }}
                  >
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Budget */}
        <View className="mb-5">
          <Text
            className="paragraph-medium text-text-secondary mb-2.5"
            style={{ fontSize: 14, fontWeight: "600" }}
          >
            Budget Max: ${budgetMax}
          </Text>
          <TextInput
            value={budgetMax}
            onChangeText={setBudgetMax}
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor="#878787"
            className="bg-bg-primary rounded-2xl p-3.5 text-text-primary border border-bg-elevated/50"
            style={{ fontSize: 14 }}
          />
        </View>

        {/* Radius */}
        <View className="mb-4">
          <Text
            className="paragraph-medium text-text-secondary mb-2.5"
            style={{ fontSize: 14, fontWeight: "600" }}
          >
            Radius: {radius} miles
          </Text>
          <TextInput
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#878787"
            className="bg-bg-primary rounded-2xl p-3.5 text-text-primary border border-bg-elevated/50"
            style={{ fontSize: 14 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
