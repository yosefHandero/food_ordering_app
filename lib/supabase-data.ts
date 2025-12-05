import { supabase, TABLES } from './supabase';
import { GetMenuParams, MenuItem, Category } from '@/type';

/**
 * Get menu items with optional category and search filters
 */
export const getMenu = async ({ category, query, limit = 50 }: GetMenuParams & { limit?: number }) => {
  try {
    let queryBuilder = supabase
      .from(TABLES.MENU_ITEMS)
      .select('*')
      .limit(limit);

    // Filter by category if provided
    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category);
    }

    // Search by name if query provided
    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match MenuItem interface
    return (data || []).map((item) => ({
      $id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      description: item.description,
      calories: item.calories,
      protein: item.protein,
      rating: item.rating || 0,
      type: item.type || 'food',
      category_id: item.category_id,
      restaurant_id: item.restaurant_id,
    })) as MenuItem[];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch menu items');
  }
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((cat) => ({
      $id: cat.id,
      name: cat.name,
      description: cat.description || '',
    })) as Category[];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch categories');
  }
};

/**
 * Get restaurants with filters
 */
export const getRestaurants = async ({
  limit = 20,
  cuisine,
  rating,
}: {
  limit?: number;
  cuisine?: string;
  rating?: number;
} = {}) => {
  try {
    let queryBuilder = supabase
      .from(TABLES.RESTAURANTS)
      .select('*')
      .limit(limit);

    if (cuisine) {
      queryBuilder = queryBuilder.eq('cuisine', cuisine);
    }

    if (rating) {
      queryBuilder = queryBuilder.gte('rating', rating);
    }

    const { data, error } = await queryBuilder.order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch restaurants');
  }
};

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.RESTAURANTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch restaurant');
  }
};

/**
 * Get menu items for a specific restaurant
 */
export const getRestaurantMenu = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MENU_ITEMS)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch restaurant menu');
  }
};

/**
 * Get dish by ID
 */
export const getDishById = async (dishId: string) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MENU_ITEMS)
      .select('*')
      .eq('id', dishId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch dish');
  }
};

/**
 * Create an order
 */
export const createOrder = async (orderData: {
  user_id: string;
  restaurant_id: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    price: number;
    customizations?: any[];
  }>;
  total: number;
  delivery_address: string;
  delivery_fee: number;
}) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .insert({
        user_id: orderData.user_id,
        restaurant_id: orderData.restaurant_id,
        total: orderData.total,
        delivery_address: orderData.delivery_address,
        delivery_fee: orderData.delivery_fee,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
      customizations: item.customizations || [],
    }));

    const { error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create order');
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        restaurant:restaurants(*),
        order_items:order_items(*, menu_item:menu_items(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        restaurant:restaurants(*),
        order_items:order_items(*, menu_item:menu_items(*))
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch order');
  }
};

