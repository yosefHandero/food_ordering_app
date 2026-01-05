import { ImageSourcePropType, TextInputProps } from 'react-native';


// ============================================================================
// Core Domain Types
// ============================================================================

export interface MenuItem {
  $id: string;
  id?: string;
  name: string;
  price: number;
  image_url: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium_mg?: number;
  sugar?: number;
  saturatedFat?: number;
  health_score?: number;
  rating?: number;
  type?: string;
  category_id?: string;
  restaurant_id?: string;
  created_at?: string;
  updated_at?: string;
  ingredients?: string[];
}

export interface Category {
  $id: string;
  id?: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
}

export interface User {
  $id: string;
  id?: string;
  name: string;
  email: string;
  avatar: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  rating?: number;
  distanceMiles?: number;
  deliveryTime?: string;
  address?: string;
  website?: string;
  imageUrl?: string;
  priceLevel?: number;
  lat?: number;
  lng?: number;
}

export interface Offer {
  id: number;
  title: string;
  image: any; // ImageSourcePropType from react-native
  color: string;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface CartCustomization {
  id: string;
  name: string;
  price: number;
  type: string;
}

export interface CartItemType {
  id: string; // menu item id
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  customization?: CartCustomization[];
  // Nutrition data for consistency across views
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium_mg?: number;
  sugar?: number;
  health_score?: number;
  description?: string;
}

export interface CartStore {
  items: CartItemType[];
  addItem: (item: Omit<CartItemType, "quantity">) => void;
  removeItem: (id: string, customization: CartCustomization[]) => void;
  increaseQty: (id: string, customization: CartCustomization[]) => void;
  decreaseQty: (id: string, customization: CartCustomization[]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export type HealthGoal = 'high-protein' | 'low-calorie' | 'balanced' | 'low-carb' | 'high-fiber' | 'heart-healthy' | 'energy-boost' | 'weight-loss' | 'muscle-gain' | 'clean-eating';
export type TimeOfDay = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface RecommendationRequest {
  goal: HealthGoal;
  timeOfDay: TimeOfDay;
  lastMeal?: string | null;
  lastMealTime?: string | null; // e.g., "2h ago", "10:30am", etc
  activityLevel?: "sedentary" | "light" | "workout" | null;
  lastMealHeaviness?: "light" | "medium" | "heavy" | null;
  budgetMax: number;
  radiusMiles: number; // in miles (renamed from radius)
  lat: number; // renamed from latitude
  lng: number; // renamed from longitude
}

export interface RecommendationResponse {
  context: string; // Guidance text (extracted from generateContextGuidance)
  results: RecommendationResult[];
  warning?: string; // Optional warning message
}

export interface RecommendationResult {
  restaurant: {
    id: string;
    name: string;
    cuisine?: string;
    rating?: number;
    distanceMiles?: number;
    deliveryTime?: string;
    website?: string;
  };
  item: {
    id: string;
    name: string;
    price: number;
    calories?: number;
    protein?: number;
    sodium_mg?: number;
    sugar?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    health_score?: number;
    description?: string;
    ingredients?: string[];
    image_url?: string;
  };
  why: string; // 1–2 lines
  scores: {
    total: number;
    health: number;
    goalFit: number;
    timeFit: number;
    lastMealFit: number;
    priceFit: number;
    distanceFit: number;
  };
}

// ============================================================================
// Nutrition & Health Score Types
// ============================================================================

export interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium_mg?: number;
  saturatedFat?: number;
  name?: string;
}

export interface HealthScoreBreakdown {
  score: number;
  components: {
    protein: { points: number; maxPoints: number; explanation: string };
    fiber: { points: number; maxPoints: number; explanation: string };
    calories: { points: number; maxPoints: number; explanation: string };
    saturatedFat: { points: number; maxPoints: number; explanation: string };
    sodium: { points: number; maxPoints: number; explanation: string };
    sugar: { points: number; maxPoints: number; explanation: string };
  };
  positiveFactors: string[];
  negativeFactors: string[];
}

// ============================================================================
// Food Image Matching Types
// ============================================================================

export type Provider = never;
export type FoodType = 'salad' | 'bowl' | 'wrap' | 'sub' | 'sandwich' | 'burger' | 'pizza' | 'other';
export type PrimaryProtein =
  | 'chicken'
  | 'steak'
  | 'tuna'
  | 'turkey'
  | 'salmon'
  | 'beef'
  | 'pork'
  | 'fish'
  | 'veggie'
  | 'unknown';

export type ClassifiedItem = {
  foodType: FoodType;
  primaryProtein: PrimaryProtein;
  canonicalName: string;
  modifiers: string[];
};

export type ResolvedImage = {
  url: string;
  score: number;
  reused: boolean;
  similarityKey: string;
  provider: Provider;
};

export type FoodImage =
  | { kind: 'local'; source: import('react-native').ImageSourcePropType }
  | { kind: 'remote'; url: string; provider: Provider; score: number };

// ============================================================================
// Location Types
// ============================================================================

export interface LocationInfo {
  lat: number;
  lng: number;
  displayName?: string;
}

// ============================================================================
// API & External Service Types
// ============================================================================

export interface NormalizedFood {
  id: string;
  name: string;
  brand?: string;
  ingredients?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  imageUrl?: string;
}

export interface ExternalAPIResult {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
}

// ============================================================================
// Test & QA Types
// ============================================================================

export interface TestResult {
  item: MenuItem;
  similarityKey: string;
  classified: ClassifiedItem;
  image: ResolvedImage;
  passed: boolean;
  failures: string[];
  score: number;
  attempt?: number;
}

export interface TestReport {
  totalItems: number;
  passed: number;
  failed: number;
  results: TestResult[];
  cacheStats: { imageCount: number; classificationCount: number };
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface FoodCardProps {
  item: MenuItem;
  onPress?: () => void;
  variant?: "default" | "large";
  showRating?: boolean;
}

export interface RecommendationCardProps {
  recommendation: RecommendationResult;
  index: number;
  onSwap?: () => void;
}

export interface HealthScoreProps {
  score: number;
  breakdown?: HealthScoreBreakdown;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "badge" | "ring" | "compact";
}

export interface HealthyPicksFormProps {
  isLoading: boolean;
  location: { lat: number; lng: number } | null;
  onGetFormData: (
    getData: () => {
      goal: HealthGoal;
      timeOfDay: TimeOfDay;
      lastMeal: string | null;
      lastMealTime: string | null;
      budgetMax: number;
      radiusMiles: number;
    }
  ) => void;
}

export interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  }) => void;
}

export interface DishData {
  id: string;
  name: string;
  price: number;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium_mg?: number;
  sugar?: number;
  saturatedFat?: number;
  health_score?: number;
  ingredients?: string[];
  image_url?: string;
  rating?: number;
}

export interface BurgerLogoProps {
  size?: number;
  color?: string;
}

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  rightIcon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  className?: string;
  style?: any;
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  rightIcon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export interface BadgeProps {
  label: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  className?: string;
}

export interface SkeletonProps {
  width?: import('react-native').DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
  variant?: "default" | "circular" | "rounded";
}

export interface PaymentInfoRowProps {
  label: string;
  value: string;
  isTotal?: boolean;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// Internal/Utility Types
// ============================================================================

export interface TabBarIconProps {
  focused: boolean;
  icon: ImageSourcePropType | string;
  title: string;
}

export interface PaymentInfoStripeProps {
  label: string;
  value: string;
  labelStyle?: string;
  valueStyle?: string;
}

export interface ProfileFieldProps {
  label: string;
  value: string;
  icon: ImageSourcePropType | string;
}

export interface CreateUserParams {
  email: string;
  password: string;
  name: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface GetMenuParams {
  category?: string;
  query?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (value: boolean) => void;
  fetchAuthenticatedUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

// Internal types for external APIs
export interface CandidateItem {
  restaurant: {
    id: string;
    name: string;
    distanceMiles?: number;
    rating?: number;
    deliveryTime?: string;
    cuisine?: string;
    website?: string;
  };
  item: {
    id: string;
    name: string;
    calories?: number;
    protein?: number;
    price: number;
    sodium_mg?: number;
    sugar?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    healthScore?: number;
    description?: string;
  };
}

export interface Suggestion {
  name: string;
  description?: string;
  price: number;
}

export interface Request {
  goal?: string;
  timeOfDay?: string;
  lastMeal?: string | null;
  lastMealTime?: string | null;
}

// USDA API internal types
export interface USDASearchResponse {
  foods: USDASearchResult[];
  totalHits?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface USDASearchResult {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients?: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

export interface USDAFoodDetail {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients?: USDANutrient[];
  foodCategory?: {
    id: number;
    code: string;
    description: string;
  };
}

export interface ExtendedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
}

// Internal config type for health scoring
export interface HealthScoreConfig {
  proteinTarget: number;
  fiberTarget: number;
  sodiumTarget: number;
  satFatTarget: number;
  sugarTarget: number;
  saladBonus: number;
  calorieRanges: { min: number; max: number; points: number }[];
  satFatRanges: { max: number; points: number }[];
  sodiumRanges: { max: number; points: number }[];
}
