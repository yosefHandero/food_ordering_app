import { Ionicons } from "@expo/vector-icons";
import cn from "clsx";
import { Tabs } from "expo-router";
import { memo, useCallback, useEffect } from "react";
import { Platform, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedView = Animated.createAnimatedComponent(View);

const TabBarIcon = memo(
  ({
    focused,
    icon,
    title,
  }: {
    focused: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
  }) => {
    // Initialize with default value, don't depend on focused prop
    const scale = useSharedValue(1);

    useEffect(() => {
      scale.value = withSpring(focused ? 1.1 : 1, { damping: 15 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <View className="tab-icon">
        <AnimatedView style={animatedStyle}>
          <Ionicons
            name={icon}
            size={24}
            color={focused ? "#FF6B35" : "#808080"}
          />
        </AnimatedView>
        <Text
          className={cn(
            "text-xs font-quicksand-semibold mt-1",
            focused ? "text-accent-primary" : "text-text-tertiary"
          )}
        >
          {title}
        </Text>
      </View>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.focused === nextProps.focused &&
      prevProps.icon === nextProps.icon &&
      prevProps.title === nextProps.title
    );
  }
);

export default function TabLayout() {
  // Memoize tab bar icon functions to prevent infinite re-renders
  const renderHomeIcon = useCallback(
    ({ focused }: { focused: boolean }) => (
      <TabBarIcon title="Home" icon="home-outline" focused={focused} />
    ),
    []
  );

  const renderSearchIcon = useCallback(
    ({ focused }: { focused: boolean }) => (
      <TabBarIcon title="Search" icon="search-outline" focused={focused} />
    ),
    []
  );

  const renderCartIcon = useCallback(
    ({ focused }: { focused: boolean }) => (
      <TabBarIcon title="Cart" icon="bag-outline" focused={focused} />
    ),
    []
  );

  const renderProfileIcon = useCallback(
    ({ focused }: { focused: boolean }) => (
      <TabBarIcon title="Profile" icon="person-outline" focused={focused} />
    ),
    []
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          marginHorizontal: 0,
          height: 90,
          position: "absolute",
          bottom: 0,
          backgroundColor: "#1A1A1A",
          borderTopWidth: 1,
          borderTopColor: "#242424",
          paddingTop: 12,
          paddingBottom: 24,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "#808080",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: renderSearchIcon,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: renderCartIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: renderProfileIcon,
        }}
      />
    </Tabs>
  );
}
