// Smart Kid Meals — Design Tokens
// Keep in sync with web's Tailwind config for consistent branding

export const Colors = {
  // Brand
  primary: '#10b981',      // emerald-500
  primaryDark: '#059669',  // emerald-600
  primaryLight: '#d1fae5', // emerald-100
  accent: '#f59e0b',       // amber-500
  accentLight: '#fef3c7',  // amber-100

  // Backgrounds
  background: '#fafaf9',   // warm stone
  surface: '#ffffff',
  surfaceAlt: '#f5f5f4',   // stone-100
  card: '#ffffff',

  // Text
  text: '#1c1917',         // stone-900
  textSecondary: '#78716c', // stone-500
  textMuted: '#a8a29e',    // stone-400

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // UI
  border: '#e7e5e4',       // stone-200
  divider: '#f5f5f4',      // stone-100
  overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
