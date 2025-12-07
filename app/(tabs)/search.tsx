import CartButton from "@/components/CartButton";
import Filter from "@/components/Filter";
import MenuCard from "@/components/MenuCard";
import SearchBar from "@/components/SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCategories, getMenu } from "@/lib/supabase-data";
import useSupabase from "@/lib/useSupabase";
import { Category, MenuItem } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import cn from "clsx";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

const Search = () => {
  const { category, query } = useLocalSearchParams<{
    query: string;
    category: string;
  }>();

  // Normalize params - convert empty strings to undefined
  const normalizedCategory =
    category && category.trim() !== "" ? category : undefined;
  const normalizedQuery = query && query.trim() !== "" ? query : undefined;

  const { data, refetch, loading } = useSupabase({
    fn: getMenu,
    params: { category: normalizedCategory, query: normalizedQuery, limit: 6 },
    skip: true, // Skip initial fetch, we'll call refetch manually when params change
  });
  const { data: categories, loading: categoriesLoading } = useSupabase({
    fn: getCategories,
  });

  // Fetch data when category or query changes
  useEffect(() => {
    refetch({ category: normalizedCategory, query: normalizedQuery, limit: 6 });
  }, [normalizedCategory, normalizedQuery, refetch]);

  const renderItem = ({ item, index }: { item: MenuItem; index: number }) => {
    const isFirstRightColItem = index % 2 === 0;

    return (
      <AnimatedView
        entering={FadeInDown.delay(index * 50).springify()}
        className={cn(
          "flex-1 max-w-[48%]",
          !isFirstRightColItem ? "mt-10" : "mt-0"
        )}
      >
        <MenuCard item={item} />
      </AnimatedView>
    );
  };

  const renderSkeleton = () => (
    <View className="flex-row flex-wrap gap-4 px-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} className="flex-1 max-w-[48%]">
          <Skeleton height={200} borderRadius={24} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="bg-bg-primary h-full" edges={["top"]}>
      <FlatList
        data={data || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <AnimatedView entering={FadeIn.duration(300)} className="mb-6">
            <View className="flex-row items-center justify-between px-5 py-4">
              <View>
                <Text className="small-bold uppercase text-accent-primary mb-1">
                  Search
                </Text>
                <Text className="h3-bold text-text-primary">
                  Find your favorite food
                </Text>
              </View>
              <CartButton />
            </View>

            <View className="px-5 mb-4">
              <SearchBar />
            </View>

            {!categoriesLoading && (
              <View className="px-5 mb-2">
                <Filter categories={(categories as Category[]) || []} />
              </View>
            )}
          </AnimatedView>
        )}
        ListEmptyComponent={() =>
          !loading && (
            <View className="items-center justify-center py-20 px-5">
              <Ionicons name="search-outline" size={64} color="#808080" />
              <Text className="h3-bold text-text-primary mt-4 mb-2">
                No results found
              </Text>
              <Text className="paragraph-medium text-text-tertiary text-center">
                Try adjusting your search or filters
              </Text>
            </View>
          )
        }
        ListFooterComponent={() => loading && renderSkeleton()}
      />
    </SafeAreaView>
  );
};

export default Search;
