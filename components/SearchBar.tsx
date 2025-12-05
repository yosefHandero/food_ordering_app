import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useDebounce } from 'use-debounce';
import { Input } from './ui/Input';

const AnimatedView = Animated.createAnimatedComponent(View);

const Searchbar = () => {
  const params = useLocalSearchParams<{ query: string }>();
  const [query, setQuery] = useState(params.query || '');
  const [debouncedQuery] = useDebounce(query, 500);
  const [isFocused, setIsFocused] = useState(false);
  const borderGlow = useSharedValue(0);

  React.useEffect(() => {
    if (debouncedQuery !== params.query) {
      if (debouncedQuery.trim()) {
        router.setParams({ query: debouncedQuery });
      } else {
        router.setParams({ query: undefined });
      }
    }
  }, [debouncedQuery]);

  React.useEffect(() => {
    borderGlow.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value * 0.3,
  }));

  const handleClear = () => {
    setQuery('');
    router.setParams({ query: undefined });
  };

  return (
    <View className="relative">
      <AnimatedView
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            backgroundColor: '#FF6B35',
            ...Platform.select({
              ios: {
                shadowColor: '#FF6B35',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 12,
              },
              android: {
                elevation: 8,
              },
            }),
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <View className="searchbar relative z-10">
        <Ionicons
          name="search-outline"
          size={20}
          color={isFocused ? '#FF6B35' : '#808080'}
          style={{ marginRight: 8 }}
        />
        <TextInput
          className="flex-1 text-base font-quicksand-medium text-text-primary"
          placeholder="Search for pizzas, burgers, sushi..."
          placeholderTextColor="#808080"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (query.trim()) {
              router.setParams({ query });
            }
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="ml-2">
            <Ionicons name="close-circle" size={20} color="#808080" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Searchbar;