import { Category } from "@/type";
import cn from "clsx";
import { router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Badge } from "./ui/Badge";

const AnimatedTouchable = Animated.createAnimatedComponent(
  require("react-native").TouchableOpacity
);

// Separate component for filter items to use hooks properly - MUST be outside renderItem
const FilterItem = memo(
  ({
    item,
    isActive,
    onPress,
  }: {
    item: Category | { $id: string; name: string };
    isActive: boolean;
    onPress: (id: string) => void;
  }) => {
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
        onPress={() => onPress(item.$id)}
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
          variant={isActive ? "primary" : "neutral"}
          size="md"
          className={cn(
            isActive && "shadow-glow",
            Platform.OS === "android" &&
              isActive && {
                elevation: 4,
              }
          )}
        />
      </AnimatedTouchable>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.item.$id === nextProps.item.$id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.onPress === nextProps.onPress
    );
  }
);

FilterItem.displayName = 'FilterItem';

const Filter = ({ categories }: { categories: Category[] }) => {
  const searchParams = useLocalSearchParams();
  const [active, setActive] = useState(searchParams.category || "all");

  useEffect(() => {
    setActive(searchParams.category || "all");
  }, [searchParams.category]);

  const handlePress = useCallback((id: string) => {
    setActive(id);

    if (id === "all") {
      router.setParams({ category: undefined });
    } else {
      router.setParams({ category: id });
    }
  }, []);

  const filterData: (Category | { $id: string; name: string })[] = useMemo(
    () =>
      categories && Array.isArray(categories)
        ? [{ $id: "all", name: "All" }, ...categories]
        : [{ $id: "all", name: "All" }],
    [categories]
  );

  return (
    <FlatList
      data={filterData}
      keyExtractor={(item) => item.$id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
      renderItem={({ item }) => (
        <FilterItem
          item={item}
          isActive={active === item.$id}
          onPress={handlePress}
        />
      )}
    />
  );
};

export default Filter;
