import { ButtonProps } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import cn from "clsx";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

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
  const shadowOffsetY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);
  const androidElevation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isAnimatingRef = React.useRef(false);

  // Initialize base shadow values based on variant (enhanced for depth)
  // Use withTiming to avoid interrupting ongoing animations
  React.useEffect(() => {
    // Only update if not currently animating (no press in progress)
    if (!isAnimatingRef.current) {
      if (variant === "primary" && !disabled) {
        shadowOffsetY.value = withTiming(6, { duration: 0 });
        shadowOpacity.value = withTiming(0.3, { duration: 0 });
        shadowRadius.value = withTiming(16, { duration: 0 });
        androidElevation.value = withTiming(8, { duration: 0 });
      } else if (variant === "secondary") {
        shadowOffsetY.value = withTiming(3, { duration: 0 });
        shadowOpacity.value = withTiming(0.12, { duration: 0 });
        shadowRadius.value = withTiming(10, { duration: 0 });
        androidElevation.value = withTiming(4, { duration: 0 });
      } else {
        // Reset for ghost variant or disabled state
        shadowOffsetY.value = withTiming(0, { duration: 0 });
        shadowOpacity.value = withTiming(0, { duration: 0 });
        shadowRadius.value = withTiming(0, { duration: 0 });
        androidElevation.value = withTiming(0, { duration: 0 });
      }
    }
  }, [variant, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const animatedShadowStyle = useAnimatedStyle(() => {
    const shadowColor = variant === "primary" && !disabled ? "#E63946" : "#000";
    
    return {
      shadowColor,
      shadowOffset: { width: 0, height: shadowOffsetY.value },
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
      ...(Platform.OS === "android" && {
        elevation: androidElevation.value,
      }),
    };
  });

  const handlePressIn = () => {
    isAnimatingRef.current = true;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
    opacity.value = withTiming(0.85, { duration: 150 });
    translateY.value = withSpring(1, { damping: 18, stiffness: 300 });
    
    // Reduce shadows on press (button pressed down effect)
    if (variant === "primary" && !disabled) {
      shadowOffsetY.value = withTiming(3, { duration: 150 });
      shadowOpacity.value = withTiming(0.2, { duration: 150 });
      shadowRadius.value = withTiming(12, { duration: 150 });
      androidElevation.value = withTiming(5, { duration: 150 });
    } else if (variant === "secondary") {
      shadowOffsetY.value = withTiming(2, { duration: 150 });
      shadowOpacity.value = withTiming(0.08, { duration: 150 });
      shadowRadius.value = withTiming(8, { duration: 150 });
      androidElevation.value = withTiming(3, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 300 });
    
    // Reset shadows to enhanced base values
    if (variant === "primary" && !disabled) {
      shadowOffsetY.value = withTiming(6, { duration: 150 });
      shadowOpacity.value = withTiming(0.3, { duration: 150 });
      shadowRadius.value = withTiming(16, { duration: 150 });
      androidElevation.value = withTiming(8, { duration: 150 });
    } else if (variant === "secondary") {
      shadowOffsetY.value = withTiming(3, { duration: 150 });
      shadowOpacity.value = withTiming(0.12, { duration: 150 });
      shadowRadius.value = withTiming(10, { duration: 150 });
      androidElevation.value = withTiming(4, { duration: 150 });
    }
    
    // Reset animation flag after animation completes (150ms + small buffer)
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 200);
  };

  const baseClasses = cn(
    "flex-row items-center justify-center rounded-full",
    {
      "bg-accent-primary": variant === "primary" && !disabled,
      "bg-text-disabled": variant === "primary" && disabled,
      "bg-white border-2 border-accent-primary": variant === "secondary",
      "bg-transparent border border-text-tertiary/20": variant === "ghost",
      "opacity-50": isLoading || disabled,
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
        animatedShadowStyle,
      ]}
      className={baseClasses}
      activeOpacity={1}
    >
      {isLoading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? "#FFFFFF" : "#E63946"}
          />
          {title && (
            <Text className={textClasses} style={{ opacity: 0.8 }}>
              {title}
            </Text>
          )}
        </View>
      ) : (
        <>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={size === "sm" ? 16 : size === "md" ? 20 : 24}
              color={variant === "primary" ? "#FFFFFF" : "#E63946"}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={textClasses}>{title}</Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={size === "sm" ? 16 : size === "md" ? 20 : 24}
              color={variant === "primary" ? "#FFFFFF" : "#E63946"}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </AnimatedTouchable>
  );
};
