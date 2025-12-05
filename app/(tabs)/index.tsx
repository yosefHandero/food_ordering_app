import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlatList,
  Image,
  Text,
  View,
  Platform,
  Dimensions,
} from 'react-native';
import { useState } from 'react';
import cn from 'clsx';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import CartButton from '@/components/CartButton';
import { images, offers } from '@/constants';
import { router } from 'expo-router';
import useAuthStore from '@/store/auth.state';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable
);

export default function Index() {
  const { user } = useAuthStore();
  const scrollY = useSharedValue(0);

  const handlePress = (index: number) => {
    const categoryMap = [
      '686d9c28003d73b1c74a', // Sandwiches
      '686d9c270012c9b070ef', // Burgers
      '686d9c280013d6219054', // Pizzas
      '686d9c2800352e8da868', // Burritos
    ];

    const selectedCategoryId = categoryMap[index];
    if (selectedCategoryId) {
      router.push(`/search?category=${selectedCategoryId}`);
    } else {
      router.push('/search');
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  const renderOfferCard = ({ item, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 15 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 });
    };

    return (
      <AnimatedPressable
        onPress={() => handlePress(index)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          animatedStyle,
          {
            marginBottom: 20,
            borderRadius: 24,
            overflow: 'hidden',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
              },
              android: {
                elevation: 8,
              },
            }),
          },
        ]}
      >
        <View
          style={{
            backgroundColor: item.color,
            height: 200,
            flexDirection: isEven ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View className="flex-1 justify-center" style={{ paddingRight: isEven ? 0 : 20 }}>
            <Text className="h2-bold text-white mb-3" style={{ letterSpacing: 1 }}>
              {item.title}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-white/90 text-base font-quicksand-medium mr-2">
                Explore
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
          <View className="w-32 h-32 items-center justify-center">
            <Image
              source={item.image}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={['top']}>
      <Animated.View
        style={[headerAnimatedStyle]}
        className="flex-row items-center justify-between px-5 py-4 bg-bg-primary"
      >
        <View className="flex-row items-center gap-2">
          <Image source={images.logo} className="size-8" resizeMode="contain" />
          <Text className="h3-bold text-text-primary">MealHop</Text>
        </View>
        <CartButton />
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
          <View className="mb-6">
            <Text className="h1-bold text-text-primary mb-2">
              Hey {user?.name?.split(' ')[0] || 'there'}! 👋
            </Text>
            <Text className="paragraph-medium text-text-secondary mb-6">
              What are you craving today?
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
