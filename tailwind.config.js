/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [  "./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Legacy support
        primary: "#E63946",
        white: {
          DEFAULT: "#ffffff",
          100: "#FAF9F6",
          200: "#F4A261",
        },
        gray: {
          100: "#878787",
          200: "#878787",
        },
        dark: {
          100: "#1E1E1E",
        },
        error: "#E63946",
        success: "#2A9D8F",
        
        // Premium food app palette
        bg: {
          primary: "#FAF9F6",      // Soft Cream - main background
          secondary: "#F5F4F1",    // Slightly darker cream for cards
          tertiary: "#FFFFFF",      // White for elevated surfaces
          elevated: "#F0EFEB",     // Subtle elevation
        },
        accent: {
          primary: "#E63946",      // Deep Tomato Red - primary CTAs, hunger appeal
          secondary: "#F4A261",    // Warm Orange - secondary actions, highlights
          tertiary: "#2A9D8F",     // Fresh Green - freshness indicators, success states
          success: "#2A9D8F",       // Fresh Green for success
          error: "#E63946",         // Deep Tomato Red for errors
        },
        text: {
          primary: "#1E1E1E",      // Charcoal Black - main text
          secondary: "#4A4A4A",   // Dark gray for secondary text
          tertiary: "#878787",      // Medium gray for tertiary text
          disabled: "#B3B3B3",     // Light gray for disabled states
        },
        food: {
          warm: "#F4A261",         // Warm Orange
          hot: "#E63946",          // Deep Tomato Red
          fresh: "#2A9D8F",        // Fresh Green
          sweet: "#F4A261",        // Warm Orange for sweet items
        },
      },
      fontFamily: {
        quicksand: ["Quicksand-Regular", "sans-serif"],
        "quicksand-bold": ["Quicksand-Bold", "sans-serif"],
        "quicksand-semibold": ["Quicksand-SemiBold", "sans-serif"],
        "quicksand-light": ["Quicksand-Light", "sans-serif"],
        "quicksand-medium": ["Quicksand-Medium", "sans-serif"],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(230, 57, 70, 0.4)',
        'glow-lg': '0 0 40px rgba(230, 57, 70, 0.5)',
        'glow-orange': '0 0 20px rgba(244, 162, 97, 0.4)',
        'glow-green': '0 0 20px rgba(42, 157, 143, 0.4)',
      },
    },
  },
  plugins: [],
};

