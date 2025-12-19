import { MenuItem } from "@/type";
import { router } from "expo-router";
import { memo } from "react";
import { View } from "react-native";
import { FoodCard } from "./FoodCard";

const MenuCard = memo(
  ({ item }: { item: MenuItem }) => {
    return (
      <View className="relative">
        <FoodCard
          item={item}
          onPress={() => router.push(`/restaurants/1/menu/${item.$id}`)}
          variant="default"
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.$id === nextProps.item.$id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.price === nextProps.item.price
    );
  }
);

MenuCard.displayName = "MenuCard";

export default MenuCard;
