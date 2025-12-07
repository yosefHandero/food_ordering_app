import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import CartButton from "@/components/CartButton";
import { images, offers } from "@/constants";
import useAuthStore from "@/store/auth.state";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AnimatedPressable = Animated.createAnimatedComponent(
  require("react-native").Pressable
);

// Move OfferCard outside to prevent recreation on every render
const OfferCard = ({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress: (index: number) => void;
}) => {
  const isEven = index % 2 === 0;
  const scale = useSharedValue(1);
  const imageScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    imageScale.value = withSequence(
      withTiming(1.1, { duration: 600 }),
      withTiming(1, { duration: 600 })
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={() => onPress(index)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          marginBottom: 24,
          borderRadius: 28,
          overflow: "hidden",
          ...Platform.select({
            ios: {
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
            },
            android: {
              elevation: 12,
            },
          }),
        },
      ]}
    >
      <View
        style={{
          backgroundColor: item.color,
          height: 220,
          flexDirection: isEven ? "row-reverse" : "row",
          alignItems: "center",
          paddingHorizontal: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient overlay effect */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        />
        {/* Glow effect */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "#FFFFFF",
              opacity: 0.1,
              top: -50,
              right: isEven ? -50 : undefined,
              left: isEven ? undefined : -50,
            },
            glowAnimatedStyle,
          ]}
        />

        <View
          className="flex-1 justify-center z-10"
          style={{ paddingRight: isEven ? 0 : 24 }}
        >
          <View className="mb-2">
            <Text
              className="h2-bold text-white mb-1"
              style={{
                letterSpacing: 0.5,
                textShadowColor: "rgba(0, 0, 0, 0.3)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              {item.title}
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                <Text className="text-white text-xs font-quicksand-semibold">
                  Special Offer
                </Text>
              </View>
            </View>
          </View>
          <AnimatedPressable
            onPress={() => onPress(index)}
            className="flex-row items-center mt-4 bg-white/20 px-4 py-2.5 rounded-full self-start"
            style={[
              {
                backdropFilter: "blur(10px)",
              },
            ]}
          >
            <Text className="text-white text-base font-quicksand-semibold mr-2">
              Explore Now
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </AnimatedPressable>
        </View>

        <Animated.View
          className="w-36 h-36 items-center justify-center z-10"
          style={imageAnimatedStyle}
        >
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              position: "absolute",
            }}
          />
          <Image
            source={item.image}
            className="w-full h-full"
            resizeMode="contain"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
};

export default function Index() {
  // Use selector to only subscribe to user changes, preventing unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const scrollY = useSharedValue(0);
  const searchBarScale = useSharedValue(1);

  const handlePress = React.useCallback((index: number) => {
    const categoryMap = [
      "686d9c28003d73b1c74a", // Sandwiches
      "686d9c270012c9b070ef", // Burgers
      "686d9c280013d6219054", // Pizzas
      "686d9c2800352e8da868", // Burritos
    ];

    const selectedCategoryId = categoryMap[index];
    if (selectedCategoryId) {
      router.push(`/search?category=${selectedCategoryId}`);
    } else {
      router.push("/search");
    }
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0.98],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 80],
      [0, -5],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  const searchBarPressAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: searchBarScale.value }],
    };
  });

  const renderOfferCard = React.useCallback(
    ({ item, index }: { item: any; index: number }) => {
      return <OfferCard item={item} index={index} onPress={handlePress} />;
    },
    [handlePress]
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Modern Header with Gradient */}
      <Animated.View
        style={[headerAnimatedStyle]}
        className="px-5 pt-2 pb-4 bg-bg-primary"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <View
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: "#FF6B35",
                  opacity: 0.2,
                  transform: [{ scale: 1.5 }],
                }}
              />
              <Image
                source={images.logo}
                className="size-10 rounded-full"
                resizeMode="contain"
                style={{
                  backgroundColor: "#1A1A1A",
                  padding: 4,
                }}
              />
            </View>
            <View>
              <Text className="h3-bold text-text-primary">MealHop</Text>
              <Text className="text-xs text-text-tertiary font-quicksand-medium">
                Delicious meals delivered
              </Text>
            </View>
          </View>
          <CartButton />
        </View>

        {/* Search Bar */}
        <Animated.View style={searchBarAnimatedStyle}>
          <AnimatedPressable
            onPress={() => router.push("/search")}
            onPressIn={() => {
              searchBarScale.value = withSpring(0.98, { damping: 15 });
            }}
            onPressOut={() => {
              searchBarScale.value = withSpring(1, { damping: 15 });
            }}
            style={searchBarPressAnimatedStyle}
          >
            <View className="searchbar">
              <Ionicons
                name="search-outline"
                size={20}
                color="#808080"
                style={{ marginRight: 8 }}
              />
              <Text className="flex-1 text-base font-quicksand-medium text-text-tertiary">
                Search for pizzas, burgers, sushi...
              </Text>
              <Ionicons name="mic-outline" size={20} color="#808080" />
            </View>
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>

      <FlatList
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View className="mb-8">
            <View className="flex-row items-end justify-between mb-3">
              <View className="flex-1">
                <Text className="h1-bold text-text-primary mb-1">
                  Hey {user?.name?.split(" ")[0] || "there"}! 👋
                </Text>
                <Text className="paragraph-medium text-text-secondary">
                  What are you craving today?
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1 bg-bg-tertiary rounded-2xl p-4 border border-bg-elevated/50">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="flash-outline" size={20} color="#FF6B35" />
                  <Text className="text-xs text-text-tertiary font-quicksand-medium">
                    Fast
                  </Text>
                </View>
                <Text className="text-lg font-quicksand-bold text-text-primary">
                  15-30 min
                </Text>
                <Text className="text-xs text-text-tertiary font-quicksand-medium mt-1">
                  Delivery time
                </Text>
              </View>

              <View className="flex-1 bg-bg-tertiary rounded-2xl p-4 border border-bg-elevated/50">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="star-outline" size={20} color="#FFB800" />
                  <Text className="text-xs text-text-tertiary font-quicksand-medium">
                    Top Rated
                  </Text>
                </View>
                <Text className="text-lg font-quicksand-bold text-text-primary">
                  4.8+
                </Text>
                <Text className="text-xs text-text-tertiary font-quicksand-medium mt-1">
                  Average rating
                </Text>
              </View>
            </View>

            {/* Section Title */}
            <View className="flex-row items-center justify-between mt-8 mb-4">
              <Text className="h3-bold text-text-primary">Featured Offers</Text>
              <AnimatedPressable
                onPress={() => router.push("/search")}
                className="flex-row items-center"
              >
                <Text className="text-sm text-accent-primary font-quicksand-semibold mr-1">
                  See All
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
              </AnimatedPressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
