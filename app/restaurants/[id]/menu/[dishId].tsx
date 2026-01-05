import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HealthScore } from "@/components/HealthScore";
import { getFoodImage } from "@/lib/food-images";
import {
  calculateHEIHealthScore,
  getHealthScoreBreakdown,
} from "@/lib/scoring";
import { DishData } from "@/type";
import useAuthStore from "@/store/auth.state";
import { useCartStore } from "@/store/cart.store";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Generate ingredients based on dish name and description
 */
function generateIngredients(name: string, description?: string): string[] {
  const nameLower = name.toLowerCase();
  const descLower = (description || "").toLowerCase();
  const combined = `${nameLower} ${descLower}`;

  const ingredients: string[] = [];

  // Common ingredients based on dish type
  if (nameLower.includes("burger") || nameLower.includes("sandwich")) {
    // Check for specific meat types first
    if (combined.includes("turkey")) {
      ingredients.push("Turkey", "Bun", "Lettuce", "Tomato");
    } else if (combined.includes("chicken")) {
      ingredients.push("Chicken", "Bun", "Lettuce", "Tomato");
    } else if (combined.includes("ham")) {
      ingredients.push("Ham", "Bun", "Lettuce", "Tomato");
    } else if (combined.includes("roast beef") || (combined.includes("roast") && combined.includes("beef"))) {
      ingredients.push("Roast beef", "Bun", "Lettuce", "Tomato");
    } else if (nameLower.includes("burger") && combined.includes("beef")) {
      ingredients.push("Beef patty", "Bun", "Lettuce", "Tomato", "Onion");
    } else if (nameLower.includes("burger")) {
      // Default for burgers without specific meat mentioned
      ingredients.push("Beef patty", "Bun", "Lettuce", "Tomato", "Onion");
    } else {
      // Default for sandwiches without specific meat mentioned
      ingredients.push("Bun", "Lettuce", "Tomato");
    }
    if (combined.includes("cheese")) ingredients.push("Cheese");
    if (combined.includes("bacon")) ingredients.push("Bacon");
    if (combined.includes("pickle")) ingredients.push("Pickles");
    if (combined.includes("mayo") || combined.includes("mayonnaise")) ingredients.push("Mayonnaise");
    if (combined.includes("club")) {
      // Club sandwiches typically have multiple meats
      if (!ingredients.some(i => i.toLowerCase().includes("turkey") || i.toLowerCase().includes("chicken") || i.toLowerCase().includes("ham"))) {
        // If no specific meat detected, add turkey as default for club
        if (!ingredients.includes("Turkey")) ingredients.push("Turkey");
      }
      ingredients.push("Bacon");
    }
  } else if (nameLower.includes("salad")) {
    ingredients.push("Mixed greens", "Lettuce");
    if (combined.includes("chicken")) ingredients.push("Grilled chicken");
    if (combined.includes("tomato")) ingredients.push("Cherry tomatoes");
    if (combined.includes("cucumber")) ingredients.push("Cucumber");
    if (combined.includes("carrot")) ingredients.push("Carrots");
    if (combined.includes("dressing") || combined.includes("vinaigrette"))
      ingredients.push("Dressing");
  } else if (nameLower.includes("pizza")) {
    ingredients.push("Pizza dough", "Tomato sauce", "Mozzarella cheese");
    if (combined.includes("pepperoni")) ingredients.push("Pepperoni");
    if (combined.includes("mushroom")) ingredients.push("Mushrooms");
    if (combined.includes("pepper")) ingredients.push("Bell peppers");
  } else if (nameLower.includes("pasta")) {
    ingredients.push("Pasta", "Tomato sauce");
    if (combined.includes("chicken")) ingredients.push("Chicken");
    if (combined.includes("cream") || combined.includes("alfredo"))
      ingredients.push("Heavy cream", "Parmesan cheese");
    if (combined.includes("basil")) ingredients.push("Fresh basil");
  } else if (nameLower.includes("soup")) {
    ingredients.push("Vegetable broth");
    if (combined.includes("chicken"))
      ingredients.push("Chicken", "Carrots", "Celery");
    if (combined.includes("tomato"))
      ingredients.push("Tomatoes", "Onion", "Garlic");
    if (combined.includes("miso"))
      ingredients.push("Miso paste", "Tofu", "Seaweed", "Green onions");
  } else if (nameLower.includes("wrap") || nameLower.includes("burrito")) {
    ingredients.push("Tortilla");
    if (combined.includes("chicken")) ingredients.push("Grilled chicken");
    if (combined.includes("beef")) ingredients.push("Beef");
    if (combined.includes("vegetable") || combined.includes("veggie"))
      ingredients.push("Mixed vegetables");
    ingredients.push("Lettuce", "Cheese");
  } else if (nameLower.includes("taco")) {
    ingredients.push("Tortilla", "Lettuce", "Tomato", "Cheese");
    if (combined.includes("chicken")) ingredients.push("Chicken");
    if (combined.includes("beef")) ingredients.push("Ground beef");
  } else if (nameLower.includes("sushi") || nameLower.includes("roll")) {
    ingredients.push("Sushi rice", "Nori");
    if (combined.includes("salmon")) ingredients.push("Salmon");
    if (combined.includes("tuna")) ingredients.push("Tuna");
    if (combined.includes("avocado")) ingredients.push("Avocado");
    if (combined.includes("cucumber")) ingredients.push("Cucumber");
  } else if (nameLower.includes("bowl")) {
    ingredients.push("Rice", "Mixed vegetables");
    if (combined.includes("chicken")) ingredients.push("Grilled chicken");
    if (combined.includes("salmon")) ingredients.push("Salmon");
    if (combined.includes("quinoa")) ingredients.push("Quinoa");
  } else if (combined.includes("salmon") || nameLower.includes("salmon")) {
    // Salmon dishes
    ingredients.push("Salmon fillet");
    if (combined.includes("grilled") || nameLower.includes("grilled")) {
      ingredients.push("Olive oil", "Lemon", "Herbs", "Black pepper");
    } else if (combined.includes("baked") || nameLower.includes("baked")) {
      ingredients.push("Olive oil", "Lemon", "Herbs", "Garlic");
    } else {
      ingredients.push("Olive oil", "Lemon", "Seasonings");
    }
    if (combined.includes("vegetable") || combined.includes("veggie") || combined.includes("asparagus") || combined.includes("broccoli")) {
      ingredients.push("Mixed vegetables");
    }
  } else if (combined.includes("tuna") || nameLower.includes("tuna")) {
    // Tuna dishes
    if (combined.includes("grilled") || nameLower.includes("grilled")) {
      ingredients.push("Tuna steak", "Olive oil", "Lemon", "Herbs", "Black pepper");
    } else {
      ingredients.push("Tuna", "Olive oil", "Lemon", "Seasonings");
    }
  } else if (combined.includes("fish") || nameLower.includes("fish")) {
    // Generic fish dishes - try to be more specific
    if (combined.includes("grilled") || nameLower.includes("grilled")) {
      ingredients.push("Fish fillet", "Olive oil", "Lemon", "Herbs", "Black pepper");
    } else if (combined.includes("fried") || nameLower.includes("fried")) {
      ingredients.push("Fish fillet", "Breadcrumbs", "Flour", "Oil");
    } else {
      ingredients.push("Fish fillet", "Olive oil", "Lemon", "Seasonings");
    }
  } else if (combined.includes("steak") || nameLower.includes("steak")) {
    // Steak dishes
    ingredients.push("Beef steak");
    if (combined.includes("grilled") || nameLower.includes("grilled")) {
      ingredients.push("Butter", "Garlic", "Herbs", "Black pepper");
    } else {
      ingredients.push("Butter", "Garlic", "Seasonings");
    }
  } else if (combined.includes("chicken") && (combined.includes("grilled") || nameLower.includes("grilled"))) {
    // Grilled chicken dishes
    ingredients.push("Chicken breast", "Olive oil", "Lemon", "Herbs", "Garlic", "Black pepper");
  } else if (combined.includes("chicken")) {
    // Other chicken dishes
    ingredients.push("Chicken");
    if (combined.includes("roasted") || nameLower.includes("roasted")) {
      ingredients.push("Herbs", "Garlic", "Butter");
    }
  } else if (combined.includes("beef")) {
    // Beef dishes
    ingredients.push("Beef");
    if (combined.includes("roasted") || nameLower.includes("roasted")) {
      ingredients.push("Herbs", "Garlic", "Black pepper");
    }
  } else {
    // Generic ingredients based on description
    if (combined.includes("vegetable") || combined.includes("veggie"))
      ingredients.push("Mixed vegetables");
    if (combined.includes("rice")) ingredients.push("Rice");
    if (combined.includes("cheese")) ingredients.push("Cheese");
  }

  // Extract additional ingredients from description
  const commonIngredients = [
    "onion",
    "garlic",
    "tomato",
    "lettuce",
    "cheese",
    "bacon",
    "avocado",
    "mushroom",
    "pepper",
    "carrot",
    "celery",
    "spinach",
    "kale",
    "broccoli",
    "cucumber",
    "olive",
    "pickle",
    "mayonnaise",
    "mustard",
    "ketchup",
    "lemon",
    "herbs",
    "asparagus",
    "zucchini",
    "bell pepper",
    "bell peppers",
  ];

  commonIngredients.forEach((ing) => {
    if (
      combined.includes(ing) &&
      !ingredients.some((i) => i.toLowerCase().includes(ing))
    ) {
      const capitalized = ing.charAt(0).toUpperCase() + ing.slice(1);
      ingredients.push(capitalized);
    }
  });

  // If no ingredients found, provide default
  if (ingredients.length === 0) {
    ingredients.push("Fresh ingredients", "Seasonings", "Spices");
  }

  return ingredients;
}

export default function DishDetail() {
  const { dishId, dish: dishParam } = useLocalSearchParams<{
    dishId: string;
    restaurantId: string;
    dish?: string;
  }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [dish, setDish] = useState<DishData | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const imageScale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  useEffect(() => {
    // Try to get dish data from route params (passed from RecommendationCard)
    if (dishParam) {
      try {
        // Data passed via route params as JSON string
        const dishData = JSON.parse(dishParam) as DishData;
        if (!dishData.ingredients) {
          dishData.ingredients = generateIngredients(
            dishData.name,
            dishData.description
          );
        }
        setDish(dishData);
        setLoading(false);
        return;
      } catch {
        // If parsing fails, continue to fallback
      }
    }

    // Fallback: Try to fetch from API or use mock data
    // For now, we'll use a basic structure based on the dishId
    const mockDish: DishData = {
      id: dishId || "1",
      name: "Menu Item",
      price: 12.99,
      description: "Delicious dish made with fresh ingredients",
      calories: 500,
      protein: 25,
      ingredients: generateIngredients(
        "Menu Item",
        "Delicious dish made with fresh ingredients"
      ),
    };
    setDish(mockDish);
    setLoading(false);
  }, [dishId, dishParam]);

  const handleAddToCart = () => {
    if (!dish) return;

    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please log in to order items.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/sign-in") },
      ]);
      return;
    }

    const extrasPrice = selectedExtras.reduce((total, extraName) => {
      const extra = (dish as any).customization?.extras?.find(
        (e: any) => e.name === extraName
      );
      return total + (extra?.price || 0);
    }, 0);

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: dish.id,
        name: dish.name,
        price: dish.price + extrasPrice,
        image_url: dish.image_url || "", // Local images handled by CartItem component
        // Preserve all nutrition data for consistency
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat,
        fiber: dish.fiber,
        sodium_mg: dish.sodium_mg,
        sugar: dish.sugar,
        health_score: dish.health_score,
        description: dish.description,
        customization: selectedExtras.map((name) => ({
          id: name,
          name,
          price:
            (dish as any).customization?.extras?.find(
              (e: any) => e.name === name
            )?.price || 0,
          type: "extra",
        })),
      });
    }

    // Animate success
    imageScale.value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );

    Alert.alert(
      "Added to Cart",
      `${quantity} ${dish.name} added to your cart!`,
      [
        { text: "Continue Shopping", style: "cancel" },
        {
          text: "View Cart",
          onPress: () => router.push("/(tabs)/cart" as any),
        },
      ]
    );
  };

  const totalPrice = dish
    ? (dish.price +
        selectedExtras.reduce((sum, name) => {
          const extra = (dish as any).customization?.extras?.find(
            (e: any) => e.name === name
          );
          return sum + (extra?.price || 0);
        }, 0)) *
      quantity
    : 0;

  // Get food image for hero image
  const [foodImage, setFoodImage] = useState<{ kind: 'local' | 'remote'; source?: any; url?: string } | null>(null);
  
  useEffect(() => {
    if (dish) {
      getFoodImage(dish)
        .then((result) => {
          setFoodImage(result);
        })
        .catch((error) => {
          console.warn("[DishDetail] Failed to get image:", error);
          setFoodImage({ kind: 'local', source: require('@/assets/images/food-spread-background.png') });
        });
    }
  }, [dish?.name]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E63946" />
        </View>
      </SafeAreaView>
    );
  }

  if (!dish) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={48} color="#878787" />
          <Text className="h3-bold text-text-primary mt-4 mb-2">
            Item Not Found
          </Text>
          <Text className="paragraph-medium text-text-secondary text-center">
            The menu item you&apos;re looking for doesn&apos;t exist.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1 bg-bg-primary">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Image - Smaller for better viewing */}
          <Animated.View
            style={[
              {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 0.18,
                backgroundColor: "#FAF9F6",
              },
              animatedStyle,
            ]}
          >
            {foodImage?.kind === 'remote' && foodImage.url ? (
              <Image
                source={{ uri: foodImage.url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : foodImage?.kind === 'local' && foodImage.source ? (
              <Image
                source={foodImage.source}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-bg-elevated items-center justify-center">
                <Ionicons name="restaurant-outline" size={48} color="#878787" />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                top: Platform.OS === "ios" ? 50 : 20,
                left: 0,
                right: 0,
                paddingHorizontal: 20,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Button
                title=""
                onPress={() => router.back()}
                variant="ghost"
                leftIcon="arrow-back"
                size="sm"
              />
              <View className="bg-black/30 rounded-full px-3 py-1.5">
                <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
              </View>
            </View>
          </Animated.View>

          {/* Content - Tighter spacing */}
          <View className="px-5 pt-4" style={{ paddingBottom: 120 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="h2-bold text-text-primary flex-1 mr-2" style={{ fontSize: 24 }}>
              {dish.name}
            </Text>
            {dish.rating && (
              <Badge
                label={`${dish.rating.toFixed(1)} ⭐`}
                variant="warning"
                size="sm"
              />
            )}
          </View>

          {dish.description && (
            <Text className="paragraph-medium text-text-secondary mb-3" style={{ fontSize: 14 }}>
              {dish.description}
            </Text>
          )}

          {/* Health Score - Elevated, prominent section */}
          {(dish.calories !== undefined ||
            dish.protein !== undefined ||
            dish.fiber !== undefined) && (
            <Card variant="elevated" className="mb-3">
              <View className="items-center py-3">
                <Text className="h3-bold text-text-primary mb-2 text-center" style={{ fontSize: 18 }}>
                  Nutrition Quality Score
                </Text>
                <HealthScore
                  score={calculateHEIHealthScore(
                    {
                      calories: dish.calories,
                      protein: dish.protein,
                      fiber: dish.fiber,
                      fat: dish.fat,
                      sugar: dish.sugar,
                      sodium_mg: dish.sodium_mg,
                      saturatedFat: dish.saturatedFat,
                    },
                    dish.name
                  )}
                  breakdown={getHealthScoreBreakdown(
                    {
                      calories: dish.calories,
                      protein: dish.protein,
                      fiber: dish.fiber,
                      fat: dish.fat,
                      sugar: dish.sugar,
                      sodium_mg: dish.sodium_mg,
                      saturatedFat: dish.saturatedFat,
                    },
                    dish.name
                  )}
                  size="lg"
                  variant="badge"
                  showLabel={true}
                />
                <View className="bg-bg-secondary rounded-lg p-2 mt-3 w-full border border-bg-elevated/50">
                  <Text className="paragraph-small text-text-secondary italic text-center" style={{ fontSize: 10 }}>
                    Calculated using USDA nutrition data and public dietary
                    guidelines. This is not an official USDA or HEI rating.
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Nutritional Info - Compact chips */}
          <View className="flex-row flex-wrap items-center gap-1.5 mb-3">
            {dish.calories !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.calories} cal
                </Text>
              </View>
            )}
            {dish.protein !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.protein}g protein
                </Text>
              </View>
            )}
            {dish.carbs !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.carbs}g carbs
                </Text>
              </View>
            )}
            {dish.fat !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.fat}g fat
                </Text>
              </View>
            )}
            {dish.fiber !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.fiber}g fiber
                </Text>
              </View>
            )}
            {dish.sodium_mg !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.sodium_mg}mg sodium
                </Text>
              </View>
            )}
            {dish.sugar !== undefined && (
              <View className="bg-white border border-bg-elevated/50 rounded-full px-3 py-1.5">
                <Text className="paragraph-semibold text-text-primary" style={{ fontSize: 12 }}>
                  {dish.sugar}g sugar
                </Text>
              </View>
            )}
          </View>

          {/* Ingredients - Compact chips */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <Card variant="elevated" className="mb-3">
              <View className="flex-row items-center gap-2 mb-2.5">
                <Ionicons name="restaurant-outline" size={16} color="#E63946" />
                <Text className="h3-bold text-text-primary" style={{ fontSize: 16 }}>
                  Ingredients
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {dish.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    className="bg-white border border-bg-elevated/50 rounded-full px-2.5 py-1"
                  >
                    <Text className="paragraph-small text-text-primary" style={{ fontSize: 11 }}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Customization */}
          {(dish as any).customization?.extras?.length > 0 && (
            <Card variant="elevated" className="mb-3">
              <Text className="h3-bold text-text-primary mb-3" style={{ fontSize: 16 }}>
                Add Extras
              </Text>
              {(dish as any).customization.extras.map((extra: any) => {
                const isSelected = selectedExtras.includes(extra.name);
                return (
                  <View
                    key={extra.name}
                    className="flex-row items-center justify-between py-2.5 border-b border-bg-elevated/50 last:border-b-0"
                  >
                    <Text className="paragraph-medium text-text-primary" style={{ fontSize: 14 }}>
                      {extra.name}
                    </Text>
                    <View className="flex-row items-center gap-2.5">
                      <Text className="paragraph-semibold text-accent-primary" style={{ fontSize: 13 }}>
                        +${extra.price.toFixed(2)}
                      </Text>
                      <Button
                        title=""
                        onPress={() => {
                          if (isSelected) {
                            setSelectedExtras(
                              selectedExtras.filter((e) => e !== extra.name)
                            );
                          } else {
                            setSelectedExtras([...selectedExtras, extra.name]);
                          }
                        }}
                        variant={isSelected ? "primary" : "ghost"}
                        leftIcon={isSelected ? "checkmark" : "add"}
                        size="sm"
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Quantity Selector */}
          <Card variant="elevated" className="mb-3">
            <Text className="h3-bold text-text-primary mb-3" style={{ fontSize: 16 }}>
              Quantity
            </Text>
            <View className="flex-row items-center justify-between">
              <Button
                title=""
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                variant="ghost"
                leftIcon="remove"
                size="sm"
              />
              <Text className="h3-bold text-text-primary" style={{ fontSize: 20 }}>
                {quantity}
              </Text>
              <Button
                title=""
                onPress={() => setQuantity(quantity + 1)}
                variant="ghost"
                leftIcon="add"
                size="sm"
              />
            </View>
          </Card>

          {/* Add to Cart Button */}
          <Button
            title={`Add to Cart • $${totalPrice.toFixed(2)}`}
            onPress={handleAddToCart}
            variant="primary"
            fullWidth
            size="lg"
            rightIcon="bag"
          />
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
