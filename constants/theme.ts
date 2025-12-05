/**
 * Modern Gen-Z Design System
 * Dark-first, vibrant, premium UI theme
 */

export const theme = {
  colors: {
    // Dark mode first
    background: {
      primary: '#0A0A0A',      // Deep black
      secondary: '#121212',     // Slightly lighter
      tertiary: '#1A1A1A',      // Card backgrounds
      elevated: '#242424',      // Elevated surfaces
    },
    
    // Vibrant accent colors
    accent: {
      primary: '#FF6B35',       // Warm orange (food-friendly)
      secondary: '#FFB800',     // Golden yellow
      tertiary: '#00D4FF',      // Cyan blue
      success: '#00FF88',       // Neon green
      error: '#FF3366',         // Pink-red
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',       // Pure white
      secondary: '#B3B3B3',    // Light gray
      tertiary: '#808080',      // Medium gray
      disabled: '#4A4A4A',     // Dark gray
    },
    
    // Food-specific warm tones
    food: {
      warm: '#FF8C42',         // Warm orange
      hot: '#FF4444',           // Spicy red
      fresh: '#4ECDC4',         // Fresh teal
      sweet: '#FFB6C1',         // Sweet pink
    },
    
    // Overlays & effects
    overlay: {
      dark: 'rgba(0, 0, 0, 0.7)',
      medium: 'rgba(0, 0, 0, 0.5)',
      light: 'rgba(0, 0, 0, 0.3)',
      blur: 'rgba(10, 10, 10, 0.8)',
    },
    
    // Gradients
    gradients: {
      primary: ['#FF6B35', '#FF8C42', '#FFB800'],
      dark: ['#0A0A0A', '#121212', '#1A1A1A'],
      food: ['#FF6B35', '#FF4444'],
      success: ['#00FF88', '#00D4FF'],
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  typography: {
    fontFamily: {
      regular: 'QuickSand-Regular',
      medium: 'QuickSand-Medium',
      semibold: 'QuickSand-SemiBold',
      bold: 'QuickSand-Bold',
      light: 'QuickSand-Light',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
    glow: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 0,
    },
  },
  
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;

export type Theme = typeof theme;

