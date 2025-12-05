import { Redirect, Slot, Tabs } from 'expo-router';
import { Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import cn from 'clsx';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedView = Animated.createAnimatedComponent(View);

const TabBarIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) => {
  const scale = useSharedValue(focused ? 1.1 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 15 });
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
          color={focused ? '#FF6B35' : '#808080'}
        />
      </AnimatedView>
      <Text
        className={cn(
          'text-xs font-quicksand-semibold mt-1',
          focused ? 'text-accent-primary' : 'text-text-tertiary'
        )}
      >
        {title}
      </Text>
    </View>
  );
};

export default function TabLayout() {
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
          position: 'absolute',
          bottom: 0,
          backgroundColor: '#1A1A1A',
          borderTopWidth: 1,
          borderTopColor: '#242424',
          paddingTop: 12,
          paddingBottom: 24,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#808080',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Home" icon="home-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Search" icon="search-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Cart" icon="bag-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Profile" icon="person-outline" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}