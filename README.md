# MealHop - Food Ordering App

A modern, dark-first food ordering app built with Expo, React Native, and Supabase.

## Features

- 🍕 Browse restaurants and menu items
- 🔍 Search and filter by category
- 🛒 Shopping cart with persistent state
- 💳 Secure checkout flow
- 🎯 Healthy Picks - AI-powered meal recommendations
- 👤 User authentication (Supabase Auth)
- 📱 Cross-platform (iOS, Android, Web)

## Tech Stack

- **Framework**: Expo Router (file-based routing)
- **UI**: React Native + NativeWind (Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Animations**: React Native Reanimated
- **TypeScript**: Strict mode enabled

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)
- (Optional) OpenAI API key for Healthy Picks feature

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

Optional (for Healthy Picks):

- `OPENAI_API_KEY` - OpenAI API key for AI recommendations

### 3. Set Up Supabase Database

1. Create a Supabase project at https://app.supabase.com
2. Run `setup-database.sql` in Supabase SQL Editor to create tables
3. Run `setup-rls-policies.sql` to set up Row Level Security
4. (Optional) Run `seed-data.sql` to seed sample data

See `SEEDING_GUIDE.md` for detailed seeding instructions.

### 4. Start the App

```bash
npx expo start
```

Then press:

- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## Project Structure

```
app/
  (auth)/          # Authentication screens
  (tabs)/          # Main app tabs (Home, Search, Cart)
  api/             # API routes (recommendations)
  restaurants/     # Restaurant detail pages
  checkout.tsx     # Checkout screen
components/        # Reusable UI components
  ui/              # Base UI components (Button, Card, etc.)
lib/               # Utilities and data fetching
  supabase.ts      # Supabase client setup
  supabase-data.ts # Data fetching functions
  supabase-auth.ts # Authentication functions
store/             # Zustand state stores
constants/         # App constants and theme
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Open on Android
- `npm run ios` - Open on iOS
- `npm run web` - Open in web browser
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed:db` - Seed database (requires SUPABASE_SERVICE_ROLE_KEY)

## Environment Variables

See `.env.example` for all available environment variables.

| Variable                        | Required | Description                         |
| ------------------------------- | -------- | ----------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key              |
| `OPENAI_API_KEY`                | No       | OpenAI API key (for Healthy Picks)  |
| `SUPABASE_SERVICE_ROLE_KEY`     | No       | Service role key (for seeding only) |

## API Setup (Optional - for Healthy Picks)

The Healthy Picks feature requires an API endpoint. See `API_SETUP.md` for setup instructions.

**For Web**: Expo Router API routes work automatically (`app/api/recommendations.ts`)

**For Native**: Requires a separate server or API deployment.

## Database Seeding

See `SEEDING_GUIDE.md` for complete seeding instructions.

Quick start:

1. Run `setup-database.sql` in Supabase SQL Editor
2. Run `seed-data.sql` to seed categories, restaurants, and menu items
3. (Optional) Run `scripts/seed.ts` for programmatic seeding

## Migration from Appwrite

If you're migrating from Appwrite, see `SUPABASE_MIGRATION.md` for detailed migration steps.

## Troubleshooting

### "Missing Supabase environment variables"

- Ensure `.env.local` exists with required variables
- Restart the Expo dev server after adding env variables

### Tables not created

- Check Supabase SQL Editor for errors
- Run `setup-database.sql` in parts if needed
- See `SEEDING_GUIDE.md` for troubleshooting

### TypeScript errors

- Run `npm run typecheck` to see all errors
- Ensure all dependencies are installed

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [NativeWind](https://www.nativewind.dev/)

## License

Private project
