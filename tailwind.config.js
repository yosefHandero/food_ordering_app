/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [  "./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Legacy support
        primary: "#FF6B35",
        white: {
          DEFAULT: "#ffffff",
          100: "#fafafa",
          200: "#FE8C00",
        },
        gray: {
          100: "#878787",
          200: "#878787",
        },
        dark: {
          100: "#181C2E",
        },
        error: "#FF3366",
        success: "#00FF88",
        
        // Modern dark-first palette
        bg: {
          primary: "#0A0A0A",
          secondary: "#121212",
          tertiary: "#1A1A1A",
          elevated: "#242424",
        },
        accent: {
          primary: "#FF6B35",
          secondary: "#FFB800",
          tertiary: "#00D4FF",
          success: "#00FF88",
          error: "#FF3366",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          tertiary: "#808080",
          disabled: "#4A4A4A",
        },
        food: {
          warm: "#FF8C42",
          hot: "#FF4444",
          fresh: "#4ECDC4",
          sweet: "#FFB6C1",
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
        'glow': '0 0 20px rgba(255, 107, 53, 0.5)',
        'glow-lg': '0 0 40px rgba(255, 107, 53, 0.6)',
      },
    },
  },
  plugins: [],
};

