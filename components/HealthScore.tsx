import {
  getHealthScoreColor,
  getHealthScoreLabel,
  HealthScoreBreakdown,
} from "@/lib/scoring";
import { HealthScoreProps } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Card } from "./ui/Card";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Health Score Component
 * Displays HEI-inspired health score with prominent visual hierarchy
 */
export function HealthScore({
  score,
  breakdown,
  size = "md",
  showLabel = true,
  variant = "badge",
}: HealthScoreProps) {
  const [showDetails, setShowDetails] = useState(false);
  const scale = useSharedValue(1);

  const color = getHealthScoreColor(score);
  const label = getHealthScoreLabel(score);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(1.4, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 300 });
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "px-3 py-1.5",
      scoreText: "text-sm",
      labelText: "text-xs",
      iconSize: 14,
      ringSize: 40,
    },
    md: {
      container: "px-4 py-2",
      scoreText: "text-base",
      labelText: "text-sm",
      iconSize: 16,
      ringSize: 56,
    },
    lg: {
      container: "px-5 py-3",
      scoreText: "text-lg",
      labelText: "text-base",
      iconSize: 18,
      ringSize: 72,
    },
  };

  const config = sizeConfig[size];

  // Compact variant - minimal display (score only, no label or icon)
  if (variant === "compact") {
    return (
      <>
        <Pressable
          onPress={() => breakdown && setShowDetails(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View
            style={[
              animatedStyle,
              {
                backgroundColor: `${color}15`,
                borderWidth: 1,
                borderColor: `${color}40`,
              },
            ]}
            className={`rounded-full flex-row items-center justify-center ${config.container}`}
          >
            <Text
              className={`font-quicksand-bold ${config.scoreText}`}
              style={{ color }}
            >
              {score}
            </Text>
          </Animated.View>
        </Pressable>

        {/* Details Modal - same as badge variant */}
        {breakdown && (
          <Modal
            visible={showDetails}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDetails(false)}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
              onPress={() => setShowDetails(false)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Card
                  variant="elevated"
                  className="w-full"
                  style={{
                    maxWidth: 360,
                    maxHeight: SCREEN_HEIGHT * 0.75,
                  }}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
                    contentContainerStyle={{ paddingBottom: 12 }}
                  >
                    {/* Header */}
                    <View className="mb-2">
                      <Text className="h3-bold text-text-primary mb-1" style={{ fontSize: 18 }}>
                        Nutrition Quality Score
                      </Text>
                      <Text className="paragraph-small text-text-secondary mb-2" style={{ fontSize: 11 }}>
                        HEI-Inspired Health Score (USDA-Based)
                      </Text>
                      <View
                        className="rounded-full px-3 py-1.5 self-start"
                        style={{
                          backgroundColor: `${color}15`,
                          borderWidth: 1.5,
                          borderColor: `${color}40`,
                        }}
                      >
                        <Text
                          className="h2-bold"
                          style={{ color, fontSize: 24 }}
                        >
                          {score}
                        </Text>
                        <Text
                          className="paragraph-small font-quicksand-semibold"
                          style={{ color, fontSize: 11 }}
                        >
                          {label}
                        </Text>
                      </View>
                    </View>

                    {/* Disclaimer */}
                    <View className="bg-bg-secondary rounded-lg p-2 mb-2 border border-bg-elevated">
                      <Text
                        className="paragraph-small text-text-secondary italic"
                        style={{ fontSize: 10 }}
                      >
                        Calculated using USDA nutrition data and public dietary
                        guidelines. This is not an official USDA or HEI rating.
                      </Text>
                    </View>

                    {/* Score Breakdown */}
                    <View className="mb-2">
                      <Text className="h3-bold text-text-primary mb-2" style={{ fontSize: 16 }}>
                        How This Score Is Calculated
                      </Text>

                      {/* Component breakdown */}
                      {Object.entries(breakdown.components).map(
                        ([key, component]) => {
                          const percentage = Math.round(
                            (component.points / component.maxPoints) * 100
                          );
                          const isPositive = component.points >= 0;

                          return (
                            <View
                              key={key}
                              className="mb-1.5 p-2 bg-bg-secondary rounded-lg border border-bg-elevated"
                            >
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="paragraph-semibold text-text-primary capitalize" style={{ fontSize: 12 }}>
                                  {key === "saturatedFat"
                                    ? "Saturated Fat"
                                    : key === "sodium"
                                    ? "Sodium"
                                    : key.charAt(0).toUpperCase() +
                                      key.slice(1)}
                                </Text>
                                <Text
                                  className="paragraph-semibold"
                                  style={{
                                    color: isPositive ? "#2A9D8F" : "#E63946",
                                    fontSize: 12,
                                  }}
                                >
                                  {component.points > 0 ? "+" : ""}
                                  {component.points.toFixed(1)} /{" "}
                                  {component.maxPoints}
                                </Text>
                              </View>
                              <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-1">
                                <View
                                  style={{
                                    width: `${Math.max(0, percentage)}%`,
                                    height: "100%",
                                    backgroundColor: isPositive
                                      ? "#2A9D8F"
                                      : "#E63946",
                                  }}
                                />
                              </View>
                              <Text
                                className="paragraph-small text-text-secondary"
                                style={{ fontSize: 10 }}
                              >
                                {component.explanation}
                              </Text>
                            </View>
                          );
                        }
                      )}
                    </View>

                    {/* Positive Factors */}
                    {breakdown.positiveFactors.length > 0 && (
                      <View className="mb-2">
                        <Text className="h3-bold text-text-primary mb-1" style={{ fontSize: 14 }}>
                          Positive Contributors
                        </Text>
                        {breakdown.positiveFactors.map((factor, index) => (
                          <View
                            key={index}
                            className="flex-row items-start gap-1.5 mb-1"
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#2A9D8F"
                            />
                            <Text
                              className="paragraph-small text-text-primary flex-1"
                              style={{ fontSize: 11 }}
                            >
                              {factor}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Negative Factors */}
                    {breakdown.negativeFactors.length > 0 && (
                      <View className="mb-2">
                        <Text className="h3-bold text-text-primary mb-1" style={{ fontSize: 14 }}>
                          Areas for Improvement
                        </Text>
                        {breakdown.negativeFactors.map((factor, index) => (
                          <View
                            key={index}
                            className="flex-row items-start gap-1.5 mb-1"
                          >
                            <Ionicons
                              name="alert-circle"
                              size={16}
                              color="#E63946"
                            />
                            <Text
                              className="paragraph-small text-text-primary flex-1"
                              style={{ fontSize: 11 }}
                            >
                              {factor}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Close Button */}
                    <Pressable
                      onPress={() => setShowDetails(false)}
                      className="bg-accent-primary rounded-full py-2 mt-2"
                    >
                      <Text className="text-center font-quicksand-bold text-white text-sm">
                        Close
                      </Text>
                    </Pressable>
                  </ScrollView>
                </Card>
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </>
    );
  }

  // Ring variant - circular progress indicator
  if (variant === "ring") {
    // Calculate rotation based on score (0-360 degrees)
    const rotation = (score / 100) * 360;

    return (
      <Pressable
        onPress={() => breakdown && setShowDetails(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={animatedStyle} className="items-center">
          <View
            style={{
              width: config.ringSize,
              height: config.ringSize,
              position: "relative",
            }}
          >
            {/* Background circle */}
            <View
              style={{
                width: config.ringSize,
                height: config.ringSize,
                borderRadius: config.ringSize / 2,
                borderWidth: 4,
                borderColor: "#F0EFEB",
                position: "absolute",
              }}
            />
            {/* Progress circle - using rotation */}
            <View
              style={{
                width: config.ringSize,
                height: config.ringSize,
                borderRadius: config.ringSize / 2,
                borderWidth: 4,
                borderColor: color,
                borderTopColor: "transparent",
                borderRightColor: score > 25 ? color : "transparent",
                borderBottomColor: score > 50 ? color : "transparent",
                borderLeftColor: score > 75 ? color : "transparent",
                position: "absolute",
                transform: [{ rotate: `${rotation - 90}deg` }],
              }}
            />
            {/* Score text */}
            <View
              style={{
                position: "absolute",
                width: config.ringSize,
                height: config.ringSize,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                className={`font-quicksand-bold ${config.scoreText}`}
                style={{ color }}
              >
                {score}
              </Text>
            </View>
          </View>
          {showLabel && (
            <Text
              className={`font-quicksand-medium ${config.labelText} mt-1`}
              style={{ color }}
            >
              {label}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  // Badge variant - default prominent display
  return (
    <>
      <Pressable
        onPress={() => breakdown && setShowDetails(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: `${color}15`,
              borderWidth: 2,
              borderColor: `${color}40`,
            },
          ]}
          className={`rounded-full flex-row items-center gap-2 ${config.container}`}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <Text
            className={`font-quicksand-bold ${config.scoreText}`}
            style={{ color }}
          >
            {score}
          </Text>
          {showLabel && (
            <>
              <Text
                className={`font-quicksand-medium ${config.labelText}`}
                style={{ color: `${color}CC` }}
              >
                •
              </Text>
              <Text
                className={`font-quicksand-medium ${config.labelText}`}
                style={{ color }}
              >
                {label}
              </Text>
            </>
          )}
          {breakdown && (
            <Ionicons
              name="information-circle-outline"
              size={config.iconSize}
              color={color}
            />
          )}
        </Animated.View>
      </Pressable>

      {/* Details Modal */}
      {breakdown && (
        <Modal
          visible={showDetails}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetails(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
            onPress={() => setShowDetails(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Card
                variant="elevated"
                className="w-full"
                style={{
                  maxWidth: 360,
                  maxHeight: SCREEN_HEIGHT * 0.75,
                }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  {/* Header */}
                  <View className="mb-2">
                    <Text className="h3-bold text-text-primary mb-1" style={{ fontSize: 18 }}>
                      Nutrition Quality Score
                    </Text>
                    <Text className="paragraph-small text-text-secondary mb-2" style={{ fontSize: 11 }}>
                      HEI-Inspired Health Score (USDA-Based)
                    </Text>
                    <View
                      className="rounded-full px-3 py-1.5 self-start"
                      style={{
                        backgroundColor: `${color}15`,
                        borderWidth: 1.5,
                        borderColor: `${color}40`,
                      }}
                    >
                      <Text className="h2-bold" style={{ color, fontSize: 24 }}>
                        {score}
                      </Text>
                      <Text
                        className="paragraph-small font-quicksand-semibold"
                        style={{ color, fontSize: 11 }}
                      >
                        {label}
                      </Text>
                    </View>
                  </View>

                  {/* Disclaimer */}
                  <View className="bg-bg-secondary rounded-lg p-2 mb-2 border border-bg-elevated">
                    <Text className="paragraph-small text-text-secondary italic" style={{ fontSize: 10 }}>
                      Calculated using USDA nutrition data and public dietary
                      guidelines. This is not an official USDA or HEI rating.
                    </Text>
                  </View>

                  {/* Score Breakdown */}
                  <View className="mb-2">
                    <Text className="h3-bold text-text-primary mb-2" style={{ fontSize: 16 }}>
                      How This Score Is Calculated
                    </Text>

                    {/* Component breakdown */}
                    {Object.entries(breakdown.components).map(
                      ([key, component]) => {
                        const percentage = Math.round(
                          (component.points / component.maxPoints) * 100
                        );
                        const isPositive = component.points >= 0;

                        return (
                          <View
                            key={key}
                            className="mb-1.5 p-2 bg-bg-secondary rounded-lg border border-bg-elevated"
                          >
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="paragraph-semibold text-text-primary capitalize" style={{ fontSize: 12 }}>
                                {key === "saturatedFat"
                                  ? "Saturated Fat"
                                  : key === "sodium"
                                  ? "Sodium"
                                  : key.charAt(0).toUpperCase() + key.slice(1)}
                              </Text>
                              <Text
                                className="paragraph-semibold"
                                style={{
                                  color: isPositive ? "#2A9D8F" : "#E63946",
                                  fontSize: 12,
                                }}
                              >
                                {component.points > 0 ? "+" : ""}
                                {component.points.toFixed(1)} /{" "}
                                {component.maxPoints}
                              </Text>
                            </View>
                            <View className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-1">
                              <View
                                style={{
                                  width: `${Math.max(0, percentage)}%`,
                                  height: "100%",
                                  backgroundColor: isPositive
                                    ? "#2A9D8F"
                                    : "#E63946",
                                }}
                              />
                            </View>
                            <Text className="paragraph-small text-text-secondary" style={{ fontSize: 10 }}>
                              {component.explanation}
                            </Text>
                          </View>
                        );
                      }
                    )}
                  </View>

                  {/* Positive Factors */}
                  {breakdown.positiveFactors.length > 0 && (
                    <View className="mb-2">
                      <Text className="h3-bold text-text-primary mb-1" style={{ fontSize: 14 }}>
                        Positive Contributors
                      </Text>
                      {breakdown.positiveFactors.map((factor, index) => (
                        <View
                          key={index}
                          className="flex-row items-start gap-1.5 mb-1"
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#2A9D8F"
                          />
                          <Text className="paragraph-small text-text-primary flex-1" style={{ fontSize: 11 }}>
                            {factor}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Negative Factors */}
                  {breakdown.negativeFactors.length > 0 && (
                    <View className="mb-2">
                      <Text className="h3-bold text-text-primary mb-1" style={{ fontSize: 14 }}>
                        Areas for Improvement
                      </Text>
                      {breakdown.negativeFactors.map((factor, index) => (
                        <View
                          key={index}
                          className="flex-row items-start gap-1.5 mb-1"
                        >
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color="#E63946"
                          />
                          <Text className="paragraph-small text-text-primary flex-1" style={{ fontSize: 11 }}>
                            {factor}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Close Button */}
                  <Pressable
                    onPress={() => setShowDetails(false)}
                    className="bg-accent-primary rounded-full py-2 mt-2"
                  >
                    <Text className="text-center font-quicksand-bold text-white text-sm">
                      Close
                    </Text>
                  </Pressable>
                </ScrollView>
              </Card>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
