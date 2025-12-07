import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDebounce } from "use-debounce";

const AnimatedView = Animated.createAnimatedComponent(View);

const Searchbar = () => {
  const params = useLocalSearchParams<{ query: string }>();
  const initialQuery = params.query || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, 500);
  const [isFocused, setIsFocused] = useState(false);
  const borderGlow = useSharedValue(0);
  const isInternalUpdate = useRef(false);
  const lastParamsQuery = useRef(initialQuery);

  // Sync local state with URL params when they change externally (e.g., from Filter)
  useEffect(() => {
    const currentParamsQuery = params.query || "";
    // Only update if params changed externally (not from our own update)
    if (
      !isInternalUpdate.current &&
      currentParamsQuery !== lastParamsQuery.current
    ) {
      setQuery(currentParamsQuery);
      lastParamsQuery.current = currentParamsQuery;
    }
  }, [params.query]);

  // Update URL params when debounced query changes (but avoid loops)
  useEffect(() => {
    const currentParamsQuery = params.query || "";
    if (debouncedQuery !== currentParamsQuery) {
      isInternalUpdate.current = true;
      if (debouncedQuery.trim()) {
        router.setParams({ query: debouncedQuery });
        lastParamsQuery.current = debouncedQuery;
      } else {
        router.setParams({ query: undefined });
        lastParamsQuery.current = "";
      }
      // Reset flag after router updates
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 200);
    }
  }, [debouncedQuery, params.query]);

  useEffect(() => {
    borderGlow.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, borderGlow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: borderGlow.value * 0.3,
  }));

  const handleClear = useCallback(() => {
    setQuery("");
    isInternalUpdate.current = true;
    router.setParams({ query: undefined });
    lastParamsQuery.current = "";
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 200);
  }, []);

  return (
    <View className="relative">
      <AnimatedView
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 16,
            backgroundColor: "#FF6B35",
            ...Platform.select({
              ios: {
                shadowColor: "#FF6B35",
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
          color={isFocused ? "#FF6B35" : "#808080"}
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
