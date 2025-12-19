import { Ionicons } from "@expo/vector-icons";
import cn from "clsx";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const baseClasses = cn(
    "flex-row items-center justify-center rounded-full",
    {
      "bg-accent-primary": variant === "primary" && !disabled,
      "bg-bg-elevated": variant === "primary" && disabled,
      "bg-bg-tertiary border border-accent-primary/30": variant === "secondary",
      "bg-transparent border border-text-tertiary/30": variant === "ghost",
      "opacity-50": isLoading,
      "w-full": fullWidth,
      "px-4 py-2.5": size === "sm",
      "px-6 py-4": size === "md",
      "px-8 py-5": size === "lg",
    },
    className
  );

  const textClasses = cn(
    "font-quicksand-semibold",
    {
      "text-white": variant === "primary",
      "text-accent-primary": variant === "secondary",
      "text-text-primary": variant === "ghost",
      "text-sm": size === "sm",
      "text-base": size === "md",
      "text-lg": size === "lg",
    },
    textClassName
  );

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={[
        animatedStyle,
        Platform.OS === "android" &&
          variant === "primary" && {
            elevation: 4,
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
      ]}
      className={baseClasses}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#FFFFFF" : "#FF6B35"}
        />
      ) : (
        <>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={size === "sm" ? 16 : size === "md" ? 20 : 24}
              color={variant === "primary" ? "#FFFFFF" : "#FF6B35"}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={textClasses}>{title}</Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={size === "sm" ? 16 : size === "md" ? 20 : 24}
              color={variant === "primary" ? "#FFFFFF" : "#FF6B35"}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </AnimatedTouchable>
  );
};
