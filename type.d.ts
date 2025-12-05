// Updated for Supabase - removed Models.Document dependency

export interface MenuItem {
    $id: string; // Supabase uses 'id' but we keep $id for compatibility
    id?: string; // Supabase native id
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
    $id: string; // Supabase uses 'id' but we keep $id for compatibility
    id?: string; // Supabase native id
    name: string;
    description?: string;
    image_url?: string;
    created_at?: string;
}

export interface User {
    $id: string; // Supabase uses 'id' but we keep $id for compatibility
    id?: string; // Supabase native id
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
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
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
    category: string;
    query: string;
}