import { ImageSourcePropType } from 'react-native';

export interface MenuItem {
    $id: string;
    id?: string;
    name: string;
    price: number;
    image_url: string;
    description?: string;
    calories?: number;
    protein?: number;
    rating?: number;
    type?: string;
    category_id?: string;
    restaurant_id?: string;
    created_at?: string;
    updated_at?: string;
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

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType | string;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType | string;
}

interface CreateUserParams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category?: string;
    query?: string;
}

// Healthy Picks Recommendation Types
export type HealthGoal = 'high-protein' | 'low-cal' | 'balanced' | 'low-carb';
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
  };
  item: {
    id: string;
    name: string;
    price: number;
    calories?: number;
    protein?: number;
    sodium_mg?: number;
    sugar?: number;
    health_score?: number;
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

export interface Offer {
  id: number;
  title: string;
  image: any; // ImageSourcePropType from react-native
  color: string;
}