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
      scale.value = withSpring(focused ? 1.08 : 1, { damping: 18, stiffness: 300 });
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
            color={focused ? "#E63946" : "#878787"}
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

TabBarIcon.displayName = "TabBarIcon";

export default function TabLayout() {
  // Memoize tab bar icon functions to prevent infinite re-renders
  const renderHomeIcon = useCallback(
    ({ focused }: { focused: boolean }) => (
      <TabBarIcon title="Home" icon="home-outline" focused={focused} />
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
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F0EFEB",
          paddingTop: 12,
          paddingBottom: 24,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarActiveTintColor: "#E63946",
        tabBarInactiveTintColor: "#878787",
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
          href: null, // Hide from tab bar, route redirects to index
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Hide from tab bar but keep route accessible for navigation
        }}
      />
    </Tabs>
  );
}
