import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Palette definitions ──────────────────────────────────────────────────────
export type PaletteKey =
  | 'coral'
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'teal';

export interface Palette {
  key: PaletteKey;
  label: string;
  /** Main background gradient top colour */
  bg: string;
  /** Slightly darker shade used for card accents */
  bgDark: string;
  /** Swatch colour shown in the picker */
  swatch: string;
  /** Text / icon colour on top of bg */
  onBg: string;
  /** Bottom sheet / card background */
  sheet: string;
  /** Active tab accent */
  tabActive: string;
}

export const PALETTES: Palette[] = [
  {
    key: 'coral',
    label: 'Coral',
    bg: '#F8A090',
    bgDark: '#F47860',
    swatch: '#F8A090',
    onBg: '#FFFFFF',
    sheet: '#F9F4EE',
    tabActive: '#E8685A',
  },
  {
    key: 'violet',
    label: 'Violet',
    bg: '#9B8EF8',
    bgDark: '#7B6BF0',
    swatch: '#9B8EF8',
    onBg: '#FFFFFF',
    sheet: '#F0EFFE',
    tabActive: '#6C5CE7',
  },
  {
    key: 'sky',
    label: 'Sky',
    bg: '#5BC4F5',
    bgDark: '#2FA8E0',
    swatch: '#5BC4F5',
    onBg: '#FFFFFF',
    sheet: '#EBF8FF',
    tabActive: '#0EA5E9',
  },
  {
    key: 'mint',
    label: 'Mint',
    bg: '#4ACA8C',
    bgDark: '#2EAD72',
    swatch: '#4ACA8C',
    onBg: '#FFFFFF',
    sheet: '#EDFBF3',
    tabActive: '#16A34A',
  },
  {
    key: 'amber',
    label: 'Amber',
    bg: '#F5C842',
    bgDark: '#D4A820',
    swatch: '#F5C842',
    onBg: '#5C3D00',
    sheet: '#FFFBEB',
    tabActive: '#D97706',
  },
  {
    key: 'rose',
    label: 'Rose',
    bg: '#F472B6',
    bgDark: '#E14EA0',
    swatch: '#F472B6',
    onBg: '#FFFFFF',
    sheet: '#FFF0F6',
    tabActive: '#DB2777',
  },
  {
    key: 'indigo',
    label: 'Indigo',
    bg: '#6466F1',
    bgDark: '#4446D8',
    swatch: '#6466F1',
    onBg: '#FFFFFF',
    sheet: '#EEF2FF',
    tabActive: '#4F46E5',
  },
  {
    key: 'teal',
    label: 'Teal',
    bg: '#2DD4BF',
    bgDark: '#0FB4A0',
    swatch: '#2DD4BF',
    onBg: '#FFFFFF',
    sheet: '#F0FDFA',
    tabActive: '#0D9488',
  },
];

// ── Context ──────────────────────────────────────────────────────────────────
interface ThemeCtx {
  palette: Palette;
  setPalette: (key: PaletteKey) => void;
}

const STORAGE_KEY = '@skm_palette';

const ThemeContext = createContext<ThemeCtx>({
  palette: PALETTES[0],
  setPalette: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(PALETTES[0]);

  // Restore saved palette on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((key) => {
      if (key) {
        const found = PALETTES.find((p) => p.key === key);
        if (found) setPaletteState(found);
      }
    });
  }, []);

  const setPalette = (key: PaletteKey) => {
    const found = PALETTES.find((p) => p.key === key);
    if (found) {
      setPaletteState(found);
      AsyncStorage.setItem(STORAGE_KEY, key);
    }
  };

  return (
    <ThemeContext.Provider value={{ palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
