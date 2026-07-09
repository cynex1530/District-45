// Design tokens ported 1:1 from the District 45 design handoff.
// Two themes (dark default, light alternate); the glass treatment is
// approximated in React Native with the same translucent fills, borders
// and shadows (backdrop blur is not available in RN core).

export type ThemeName = 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  divider: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accentBg: string;
  accentText: string;
  disabledBg: string;
  disabledText: string;
  glassBg: string;
  glassBgStrong: string;
  glassBorder: string;
  shadowColor: string;
  stripeA: string;
  stripeB: string;
  closedBg: string;
  closedBorder: string;
  closedText: string;
  closedTextSub: string;
  dotMuted: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    bg: '#1e1e20',
    surface: '#242426',
    surface2: '#2c2c2e',
    border: '#3a3a3d',
    divider: '#2c2c2e',
    text: '#f2f2f0',
    textMuted: '#9d9d9b',
    textFaint: '#7a7a78',
    accentBg: '#f2f2f0',
    accentText: '#1a1a1a',
    disabledBg: '#2c2c2e',
    disabledText: '#7a7a78',
    glassBg: 'rgba(255,255,255,0.055)',
    glassBgStrong: 'rgba(255,255,255,0.085)',
    glassBorder: 'rgba(255,255,255,0.11)',
    shadowColor: 'rgba(0,0,0,0.28)',
    stripeA: '#2a2a2d',
    stripeB: '#333335',
    closedBg: '#1c1c1e',
    closedBorder: '#26262a',
    closedText: '#5a5a5c',
    closedTextSub: '#444446',
    dotMuted: '#4a4a4c',
  },
  light: {
    name: 'light',
    bg: '#efeeec',
    surface: '#ffffff',
    surface2: '#eae9e6',
    border: '#dcdbd7',
    divider: '#e3e2df',
    text: '#1c1c1c',
    textMuted: '#6b6b68',
    textFaint: '#9a9a94',
    accentBg: '#1c1c1c',
    accentText: '#ffffff',
    disabledBg: '#e3e2df',
    disabledText: '#b3b2ad',
    glassBg: 'rgba(255,255,255,0.55)',
    glassBgStrong: 'rgba(255,255,255,0.78)',
    glassBorder: 'rgba(0,0,0,0.07)',
    shadowColor: 'rgba(60,55,45,0.12)',
    stripeA: '#e7e6e3',
    stripeB: '#d9d8d4',
    closedBg: '#e6e5e2',
    closedBorder: '#dcdbd7',
    closedText: '#c2c1bc',
    closedTextSub: '#cecdc8',
    dotMuted: '#c9c8c4',
  },
};

// Font families registered in App.tsx via @expo-google-fonts/manrope.
export const FONT_HEADING = 'Manrope_800ExtraBold';
export const FONT_HEADING_BOLD = 'Manrope_700Bold';
