import { Text, FlatList, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import cn from 'clsx';
import { Category } from '@/type';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Badge } from './ui/Badge';

const AnimatedTouchable = Animated.createAnimatedComponent(
  require('react-native').TouchableOpacity
);

const Filter = ({ categories }: { categories: Category[] }) => {
  const searchParams = useLocalSearchParams();
  const [active, setActive] = useState(searchParams.category || 'all');

  useEffect(() => {
    setActive(searchParams.category || 'all');
  }, [searchParams.category]);

  const handlePress = (id: string) => {
    setActive(id);

    if (id === 'all') {
      router.setParams({ category: undefined });
    } else {
      router.setParams({ category: id });
    }
  };

  const filterData: (Category | { $id: string; name: string })[] =
    categories && Array.isArray(categories)
      ? [{ $id: 'all', name: 'All' }, ...categories]
      : [{ $id: 'all', name: 'All' }];

  return (
    <FlatList
      data={filterData}
      keyExtractor={(item) => item.$id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
      renderItem={({ item }) => {
        const isActive = active === item.$id;
        const scale = useSharedValue(1);

        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
        }));

        const handlePressIn = () => {
          scale.value = withSpring(0.95, { damping: 15 });
        };

        const handlePressOut = () => {
          scale.value = withSpring(1, { damping: 15 });
        };

        return (
          <AnimatedTouchable
            onPress={() => handlePress(item.$id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              animatedStyle,
              {
                marginRight: 12,
              },
            ]}
            activeOpacity={0.8}
          >
            <Badge
              label={item.name}
              variant={isActive ? 'primary' : 'neutral'}
              size="md"
              className={cn(
                isActive && 'shadow-glow',
                Platform.OS === 'android' &&
                  isActive && {
                    elevation: 4,
                  }
              )}
            />
          </AnimatedTouchable>
        );
      }}
    />
  );
};

export default Filter;