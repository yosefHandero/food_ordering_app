import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_HEIGHT = 300;

// Mock restaurant data - replace with actual API call
const mockRestaurant = {
  id: "1",
  name: "Burger Paradise",
  imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add",
  rating: 4.8,
  deliveryTime: "25-35 min",
  distance: "2.5 km",
  cuisine: "American",
  description: "Juicy burgers, crispy fries, and refreshing drinks",
  menu: [
    { id: "1", name: "Classic Burger", price: 12.99, image: "" },
    { id: "2", name: "Cheese Burger", price: 14.99, image: "" },
  ],
};

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("popular");
  const scrollY = useSharedValue(0);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT - 100],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [1, 1.2],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_HEIGHT - 100, HEADER_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  const tabs = ["Popular", "Meals", "Drinks", "Dessert"];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Sticky Header */}
      <Animated.View
        style={[
          stickyHeaderStyle,
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            paddingTop: Platform.OS === "ios" ? 50 : 20,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: "#FAF9F6",
            borderBottomWidth: 1,
            borderBottomColor: "#F0EFEB",
          },
        ]}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Button
              title=""
              onPress={() => router.back()}
              variant="ghost"
              leftIcon="arrow-back"
              size="sm"
            />
            <Text className="h3-bold text-text-primary" numberOfLines={1}>
              {mockRestaurant.name}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <Animated.View
          style={[
            {
              height: HEADER_HEIGHT,
              width: SCREEN_WIDTH,
            },
            headerAnimatedStyle,
          ]}
        >
          <Image
            source={{ uri: mockRestaurant.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? 50 : 20,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              title=""
              onPress={() => router.back()}
              variant="ghost"
              leftIcon="arrow-back"
              size="sm"
            />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
            }}
          >
            <Text className="h1-bold text-white mb-2">
              {mockRestaurant.name}
            </Text>
            <View className="flex-row items-center gap-3 flex-wrap">
              <Badge
                label={`${mockRestaurant.rating} ⭐`}
                variant="warning"
                size="sm"
              />
              <Badge
                label={mockRestaurant.deliveryTime}
                variant="primary"
                size="sm"
                icon="time-outline"
              />
              <Badge
                label={mockRestaurant.distance}
                variant="neutral"
                size="sm"
                icon="location-outline"
              />
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <View className="px-5 pt-6 pb-32" style={{ paddingBottom: 120 }}>
          <Text className="paragraph-medium text-text-secondary mb-6">
            {mockRestaurant.description}
          </Text>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {tabs.map((tab) => (
              <Button
                key={tab}
                title={tab}
                onPress={() => setActiveTab(tab.toLowerCase())}
                variant={activeTab === tab.toLowerCase() ? "primary" : "ghost"}
                size="sm"
              />
            ))}
          </ScrollView>

          {/* Menu Items */}
          <View className="gap-4">
            {mockRestaurant.menu.map((item, index) => (
              <Card
                key={item.id}
                variant="elevated"
                onPress={() =>
                  router.push(`/restaurants/${id}/menu/${item.id}`)
                }
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-20 h-20 bg-bg-elevated rounded-xl" />
                  <View className="flex-1">
                    <Text className="base-bold text-text-primary mb-1">
                      {item.name}
                    </Text>
                    <Text className="paragraph-semibold text-accent-primary">
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#878787" />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
