import React, { useState } from 'react';
import { TextInput, View, Text, TextInputProps, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import cn from 'clsx';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName,
  className,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: borderColor.value === 1 ? '#E63946' : error ? '#E63946' : '#F0EFEB',
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderColor.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderColor.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className="text-sm font-quicksand-semibold text-text-secondary mb-2">
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          animatedBorderStyle,
          {
            borderWidth: 1,
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            minHeight: 56,
          },
          isFocused && {
            shadowColor: '#E63946',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            ...(Platform.OS === 'android' && { elevation: 4 }),
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? '#E63946' : '#878787'}
            style={{ marginRight: 12 }}
          />
        )}
        <TextInput
          className={cn(
            'flex-1 text-base font-quicksand-medium text-text-primary',
            className
          )}
          placeholderTextColor="#878787"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={isFocused ? '#E63946' : '#878787'}
            onPress={onRightIconPress}
            style={{ marginLeft: 12 }}
          />
        )}
      </Animated.View>
      {error && (
        <Text className="text-xs font-quicksand-medium text-accent-error mt-1.5">
          {error}
        </Text>
      )}
    </View>
  );
};

