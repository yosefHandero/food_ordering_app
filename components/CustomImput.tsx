import { CustomInputProps } from "@/type";
import { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedView = Animated.createAnimatedComponent(View);

const CustomInput = ({
  placeholder = "Enter text",
  value,
  onChangeText,
  label,
  secureTextEntry = false,
  keyboardType = "default",
}: CustomInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor:
        borderColor.value === 1 ? "#FF6B35" : "rgba(255, 255, 255, 0.1)",
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(0, { duration: 200 });
  };

  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-quicksand-semibold text-text-secondary mb-2">
          {label}
        </Text>
      )}

      <AnimatedView
        style={[
          animatedBorderStyle,
          {
            borderWidth: 1,
            borderRadius: 16,
            backgroundColor: "#1A1A1A",
            paddingHorizontal: 16,
            minHeight: 56,
            justifyContent: "center",
          },
          isFocused && {
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            ...(Platform.OS === "android" && { elevation: 4 }),
          },
        ]}
      >
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#808080"
          className="flex-1 text-base font-quicksand-medium text-text-primary"
        />
      </AnimatedView>
    </View>
  );
};
export default CustomInput;
