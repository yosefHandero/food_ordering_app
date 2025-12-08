/**
 * Supabase Database Seeding Script
 * 
 * This script seeds the food ordering app database with realistic mock data.
 * It uses the Supabase service role key to bypass RLS policies.
 * 
 * Usage: npm run seed:db
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (from Settings > API)
 * 
 * Note: This script uses upsert operations, so it can be run multiple times safely.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add these to your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to generate random UUID-like string (for consistent seeding)
function generateId(seed: string): string {
  // Simple hash function to generate consistent IDs
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to UUID-like format (simplified)
  return `${Math.abs(hash).toString(16).padStart(8, '0')}-${Math.abs(hash * 2).toString(16).padStart(4, '0')}-${Math.abs(hash * 3).toString(16).padStart(4, '0')}-${Math.abs(hash * 4).toString(16).padStart(4, '0')}-${Math.abs(hash * 5).toString(16).padStart(12, '0')}`;
}

// Mock data generators
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const streets = ['Main St', 'Oak Ave', 'Park Blvd', 'Elm St', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'First St', 'Second Ave', 'Third St'];

const cuisines = ['Italian', 'American', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'Japanese', 'Thai', 'French', 'BBQ', 'Seafood', 'Vegetarian'];
const restaurantNames = [
  'Bella Italia', 'Burger Paradise', 'Taco Fiesta', 'Sushi Zen', 'Mediterranean Delight',
  'Curry House', 'Ramen Express', 'Thai Garden', 'Paris Bistro', 'Smokehouse BBQ',
  'Ocean Fresh', 'Green Leaf Cafe', 'Pizza Corner', 'Noodle Bar', 'Wings & Things'
];

const categoryNames = [
  'Burgers', 'Pizza', 'Pasta', 'Salads', 'Desserts', 'Drinks', 'Appetizers', 'Main Courses'
];

const menuItemNames = {
  'Burgers': ['Classic Burger', 'Cheese Burger', 'Bacon Burger', 'Veggie Burger', 'Chicken Burger', 'BBQ Burger', 'Mushroom Swiss Burger', 'Double Deluxe Burger'],
  'Pizza': ['Margherita', 'Pepperoni', 'Hawaiian', 'Vegetarian', 'Meat Lovers', 'BBQ Chicken', 'Supreme', 'White Pizza'],
  'Pasta': ['Spaghetti Carbonara', 'Fettuccine Alfredo', 'Penne Arrabbiata', 'Lasagna', 'Ravioli', 'Mac & Cheese', 'Penne Vodka', 'Linguine Clam'],
  'Salads': ['Caesar Salad', 'Greek Salad', 'Cobb Salad', 'Garden Salad', 'Caprese Salad', 'Asian Salad', 'Quinoa Salad', 'Spinach Salad'],
  'Desserts': ['Chocolate Cake', 'Cheesecake', 'Ice Cream', 'Tiramisu', 'Brownie', 'Apple Pie', 'Chocolate Chip Cookie', 'Creme Brulee'],
  'Drinks': ['Coca Cola', 'Pepsi', 'Orange Juice', 'Lemonade', 'Iced Tea', 'Coffee', 'Smoothie', 'Water'],
  'Appetizers': ['Mozzarella Sticks', 'Onion Rings', 'Chicken Wings', 'Nachos', 'Bruschetta', 'Spring Rolls', 'Garlic Bread', 'Soup'],
  'Main Courses': ['Grilled Chicken', 'Salmon', 'Steak', 'Pork Chops', 'Fish & Chips', 'Ribs', 'Shrimp Scampi', 'Lamb Chops']
};

const statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

// Generate realistic data
function generateUser(index: number) {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
  return {
    id: generateId(`user-${index}`),
    email,
    name: `${firstName} ${lastName}`,
    avatar_url: `https://i.pravatar.cc/150?img=${index + 1}`,
  };
}

function generateAddress(userId: string, index: number, isDefault: boolean = false) {
  const city = cities[index % cities.length];
  const streetNum = Math.floor(Math.random() * 9999) + 1;
  const street = streets[index % streets.length];
  const addressText = `${streetNum} ${street}`;
  return {
    id: generateId(`address-${userId}-${index}`),
    user_id: userId,
    address: addressText, // Schema uses 'address' (TEXT) field
    city,
    postal_code: `${Math.floor(Math.random() * 90000) + 10000}`,
    is_default: isDefault,
  };
}

function generateCategory(index: number) {
  const name = categoryNames[index];
  return {
    id: generateId(`category-${name}`),
    name,
    description: `Delicious ${name.toLowerCase()} for every taste`,
    image_url: `https://images.unsplash.com/photo-${1500000000 + index}?w=400`,
  };
}

function generateRestaurant(index: number, ownerId: string) {
  const cuisine = cuisines[index % cuisines.length];
  const name = restaurantNames[index % restaurantNames.length];
  return {
    id: generateId(`restaurant-${name}-${index}`),
    name: `${name} ${index > 12 ? index - 12 : ''}`.trim(),
    description: `Authentic ${cuisine.toLowerCase()} cuisine with fresh ingredients and traditional recipes.`,
    image_url: `https://images.unsplash.com/photo-${1500000000 + index + 100}?w=800`,
    cuisine,
    rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(2)),
    delivery_time: `${15 + Math.floor(Math.random() * 20)}-${35 + Math.floor(Math.random() * 20)} min`,
    distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
    address: `${Math.floor(Math.random() * 9999) + 1} ${streets[index % streets.length]}, ${cities[index % cities.length]}`,
    phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    owner_id: ownerId,
  };
}

function generateMenuItem(restaurantId: string, categoryId: string, index: number, categoryName: string) {
  const items = menuItemNames[categoryName as keyof typeof menuItemNames] || menuItemNames['Main Courses'];
  const itemName = items[index % items.length];
  return {
    id: generateId(`menu-item-${restaurantId}-${categoryId}-${index}`),
    restaurant_id: restaurantId,
    category_id: categoryId,
    name: itemName,
    description: `Delicious ${itemName.toLowerCase()} made with fresh ingredients and authentic flavors.`,
    price: parseFloat((Math.random() * 30 + 5).toFixed(2)),
    image_url: `https://images.unsplash.com/photo-${1500000000 + index + 200}?w=400`,
    calories: Math.floor(Math.random() * 800 + 200),
    protein: parseFloat((Math.random() * 40 + 10).toFixed(1)),
    rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(2)),
    type: categoryName === 'Drinks' ? 'drink' : 'food',
  };
}

function generateOrder(userId: string, restaurantId: string, addressId: string, index: number) {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const subtotal = parseFloat((Math.random() * 80 + 15).toFixed(2));
  const deliveryFee = 5.0;
  const total = subtotal + deliveryFee;
  
  return {
    id: generateId(`order-${userId}-${index}`),
    user_id: userId,
    restaurant_id: restaurantId,
    delivery_address_id: addressId,
    delivery_fee: deliveryFee,
    status,
    total,
  };
}

function generateOrderItem(orderId: string, menuItemId: string, index: number) {
  const quantity = Math.floor(Math.random() * 3) + 1;
  const basePrice = parseFloat((Math.random() * 25 + 8).toFixed(2));
  return {
    id: generateId(`order-item-${orderId}-${menuItemId}-${index}`),
    order_id: orderId,
    menu_item_id: menuItemId,
    quantity,
    price: basePrice,
    customizations: index % 3 === 0 ? [{ name: 'Extra cheese', price: 1.5 }] : [],
  };
}

function generateReview(userId: string, restaurantId: string, menuItemId: string, index: number) {
  return {
    id: generateId(`review-${userId}-${menuItemId}-${index}`),
    user_id: userId,
    restaurant_id: restaurantId,
    menu_item_id: menuItemId,
    rating: Math.floor(Math.random() * 5) + 1,
    comment: [
      'Great food, highly recommend!',
      'Delicious and fresh ingredients.',
      'Amazing flavors, will order again.',
      'Good value for money.',
      'Could be better, but still decent.',
      'Excellent quality and service.',
      'Not bad, but expected more.',
      'Perfect! Exactly as described.',
    ][index % 8],
  };
}

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Users (in auth.users and public.users)
    console.log('📝 Seeding users...');
    const users = Array.from({ length: 10 }, (_, i) => generateUser(i));
    
    // Note: We can't directly create auth.users via the API without admin privileges
    // For seeding, we'll create records in public.users table
    // In production, users should be created through the auth flow
    // For now, we'll insert directly into public.users (assuming auth.users exist or will be created)
    
    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'id' })
      .select();

    if (usersError) {
      console.warn('⚠️  Warning inserting users:', usersError.message);
      console.warn('   This might be because auth.users entries don\'t exist yet.');
      console.warn('   Users should be created through the app\'s sign-up flow first.\n');
    } else {
      console.log(`✅ Inserted ${insertedUsers?.length || 0} users\n`);
    }

    // Use the generated user IDs for seeding
    const userIds = users.map(u => u.id);

    // 2. Seed Addresses
    console.log('📍 Seeding addresses...');
    const addresses: any[] = [];
    userIds.forEach((userId, userIndex) => {
      // Each user gets 1-3 addresses
      const addressCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < addressCount; i++) {
        addresses.push(generateAddress(userId, i, i === 0));
      }
    });

    const { data: insertedAddresses, error: addressesError } = await supabase
      .from('addresses')
      .upsert(addresses, { onConflict: 'id' })
      .select();

    if (addressesError) {
      throw new Error(`Failed to insert addresses: ${addressesError.message}`);
    }
    console.log(`✅ Inserted ${insertedAddresses?.length || 0} addresses\n`);

    // 3. Seed Categories
    console.log('📂 Seeding categories...');
    const categories = Array.from({ length: 8 }, (_, i) => generateCategory(i));
    
    const { data: insertedCategories, error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'id' })
      .select();

    if (categoriesError) {
      throw new Error(`Failed to insert categories: ${categoriesError.message}`);
    }
    console.log(`✅ Inserted ${insertedCategories?.length || 0} categories\n`);

    const categoryMap = new Map(insertedCategories!.map(c => [c.name, c.id]));

    // 4. Seed Restaurants
    console.log('🍽️  Seeding restaurants...');
    const restaurants = Array.from({ length: 12 }, (_, i) => 
      generateRestaurant(i, userIds[i % userIds.length])
    );

    const { data: insertedRestaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .upsert(restaurants, { onConflict: 'id' })
      .select();

    if (restaurantsError) {
      throw new Error(`Failed to insert restaurants: ${restaurantsError.message}`);
    }
    console.log(`✅ Inserted ${insertedRestaurants?.length || 0} restaurants\n`);

    // 5. Seed Menu Items
    console.log('🍕 Seeding menu items...');
    const menuItems: any[] = [];
    insertedRestaurants!.forEach((restaurant) => {
      // Each restaurant gets 10-15 menu items across different categories
      const itemsPerRestaurant = Math.floor(Math.random() * 6) + 10;
      for (let i = 0; i < itemsPerRestaurant; i++) {
        const categoryName = categoryNames[i % categoryNames.length];
        const categoryId = categoryMap.get(categoryName);
        if (categoryId) {
          menuItems.push(generateMenuItem(restaurant.id, categoryId, i, categoryName));
        }
      }
    });

    const { data: insertedMenuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .upsert(menuItems, { onConflict: 'id' })
      .select();

    if (menuItemsError) {
      throw new Error(`Failed to insert menu items: ${menuItemsError.message}`);
    }
    console.log(`✅ Inserted ${insertedMenuItems?.length || 0} menu items\n`);

    // 6. Seed Orders
    console.log('📦 Seeding orders...');
    const orders: any[] = [];
    for (let i = 0; i < 30; i++) {
      const userId = userIds[i % userIds.length];
      const restaurant = insertedRestaurants![i % insertedRestaurants!.length];
      // Get a random address for this user
      const userAddresses = insertedAddresses!.filter(a => a.user_id === userId);
      if (userAddresses.length > 0) {
        const address = userAddresses[Math.floor(Math.random() * userAddresses.length)];
        orders.push(generateOrder(userId, restaurant.id, address.id, i));
      }
    }

    // Note: Current schema uses delivery_address (TEXT) not delivery_address_id (UUID)
    // Convert address_id to address string for insertion
    const ordersToInsert = orders.map(order => {
      const address = insertedAddresses!.find(a => a.id === order.delivery_address_id);
      const addressString = address 
        ? `${address.address}, ${address.city || ''}, ${address.postal_code || ''}`.trim()
        : 'Unknown Address';
      
      return {
        id: order.id,
        user_id: order.user_id,
        restaurant_id: order.restaurant_id,
        delivery_address: addressString, // Schema uses TEXT field (not delivery_address_id UUID)
        delivery_fee: order.delivery_fee,
        status: order.status,
        total: order.total,
      };
    });

    const { data: insertedOrders, error: ordersError } = await supabase
      .from('orders')
      .upsert(ordersToInsert, { onConflict: 'id' })
      .select();

    if (ordersError) {
      throw new Error(`Failed to insert orders: ${ordersError.message}`);
    }
    console.log(`✅ Inserted ${insertedOrders?.length || 0} orders\n`);

    // 7. Seed Order Items
    console.log('🛒 Seeding order items...');
    const orderItems: any[] = [];
    insertedOrders!.forEach((order, orderIndex) => {
      // Each order gets 1-4 items
      const itemsPerOrder = Math.floor(Math.random() * 4) + 1;
      const restaurantMenuItems = insertedMenuItems!.filter(
        mi => mi.restaurant_id === order.restaurant_id
      );
      
      for (let i = 0; i < itemsPerOrder && restaurantMenuItems.length > 0; i++) {
        const menuItem = restaurantMenuItems[Math.floor(Math.random() * restaurantMenuItems.length)];
        orderItems.push(generateOrderItem(order.id, menuItem.id, i));
      }
    });

    const { data: insertedOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .upsert(orderItems, { onConflict: 'id' })
      .select();

    if (orderItemsError) {
      throw new Error(`Failed to insert order items: ${orderItemsError.message}`);
    }
    console.log(`✅ Inserted ${insertedOrderItems?.length || 0} order items\n`);

    // 8. Seed Reviews
    console.log('⭐ Seeding reviews...');
    const reviews: any[] = [];
    // Generate reviews for some menu items
    insertedMenuItems!.slice(0, 50).forEach((menuItem, index) => {
      const userId = userIds[index % userIds.length];
      const restaurant = insertedRestaurants!.find(r => r.id === menuItem.restaurant_id);
      if (restaurant) {
        reviews.push(generateReview(userId, restaurant.id, menuItem.id, index));
      }
    });

    const { data: insertedReviews, error: reviewsError } = await supabase
      .from('reviews')
      .upsert(reviews, { onConflict: 'id' })
      .select();

    if (reviewsError) {
      throw new Error(`Failed to insert reviews: ${reviewsError.message}`);
    }
    console.log(`✅ Inserted ${insertedReviews?.length || 0} reviews\n`);

    console.log('🎉 Seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Addresses: ${insertedAddresses!.length}`);
    console.log(`  - Categories: ${insertedCategories!.length}`);
    console.log(`  - Restaurants: ${insertedRestaurants!.length}`);
    console.log(`  - Menu Items: ${insertedMenuItems!.length}`);
    console.log(`  - Orders: ${insertedOrders?.length || 0}`);
    console.log(`  - Order Items: ${insertedOrderItems!.length}`);
    console.log(`  - Reviews: ${insertedReviews!.length}\n`);

  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding
seed();
