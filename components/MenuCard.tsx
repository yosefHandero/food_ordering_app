import { Text, Image, Platform, Alert, TouchableOpacity, View } from 'react-native';
import { MenuItem } from '@/type';
// Image URL handling - update based on your Supabase storage setup
import { useCartStore } from '@/store/cart.store';
import useAuthStore from '@/store/auth.state';
import { router } from 'expo-router';
import { FoodCard } from './FoodCard';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const MenuCard = ({ item }: { item: MenuItem }) => {
  const { addItem } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const checkmarkScale = useSharedValue(0);

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please log in to order items.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/sign-in') },
        ]
      );
      return;
    }

    addItem({
      id: item.$id,
      name: item.name,
      price: item.price,
      image_url: item.image_url || '',
      customization: [],
    });

    // Animate checkmark
    setShowCheckmark(true);
    checkmarkScale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1, { damping: 8 }),
      withTiming(0, { duration: 300 }, () => {
        setShowCheckmark(false);
      })
    );
  };

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkScale.value > 0 ? 1 : 0,
  }));

  return (
    <View className="relative">
      <FoodCard
        item={item}
        onPress={() => router.push(`/restaurants/1/menu/${item.$id}`)}
        variant="default"
      />
      <TouchableOpacity
        onPress={handleAddToCart}
        className="absolute bottom-4 right-4 bg-accent-primary rounded-full p-2.5"
        style={{
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          ...(Platform.OS === 'android' && { elevation: 6 }),
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      {showCheckmark && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -25,
              marginTop: -25,
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#00FF88',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            },
            checkmarkStyle,
          ]}
        >
          <Ionicons name="checkmark" size={28} color="#000" />
        </Animated.View>
      )}
    </View>
  );
};

export default MenuCard;