export type PaletteId =
  | 'minimal-purple'
  | 'soft-purple'
  | 'matte-plum'
  | 'glacial-indigo'
  | 'cream-plum'
  | 'sage-stone'
  | 'terracotta'
  | 'ocean-ink'
  | 'sandstone'
  | 'blue-slate'
  | 'forest-night'
  | 'copper-night'
  | 'ocean-night'
  | 'graphite-night'
  | 'plum-night';

export type PaletteTokens = {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  success: string;
  warning: string;
  overlay: string;
  surfaceSecondary: string;
};

const lightBase: PaletteTokens = {
  background: '#FAFAFA', card: '#FFFFFF', foreground: '#09090B', cardForeground: '#09090B',
  primary: '#581C87', primaryForeground: '#FFFFFF', secondary: '#F4F4F5', secondaryForeground: '#27272A',
  muted: '#F4F4F5', mutedForeground: '#71717A', accent: '#F1E8F7', accentForeground: '#581C87',
  destructive: '#B4233B', destructiveForeground: '#FFFFFF', border: '#E4E4E7', input: '#D4D4D8',
  success: '#6B4C91', warning: '#9B5C35', overlay: '#09090B', surfaceSecondary: '#F7F7F8',
  text: '#09090B', tint: '#581C87',
};

const darkBase: PaletteTokens = {
  background: '#09090B', card: '#18181B', foreground: '#F4F4F5', cardForeground: '#F4F4F5',
  primary: '#8B5CF6', primaryForeground: '#FFFFFF', secondary: '#27272A', secondaryForeground: '#E4E4E7',
  muted: '#27272A', mutedForeground: '#A1A1AA', accent: '#302047', accentForeground: '#D8B4FE',
  destructive: '#E66B7C', destructiveForeground: '#21080D', border: '#3F3F46', input: '#52525B',
  success: '#AA8BD0', warning: '#D18C5D', overlay: '#000000', surfaceSecondary: '#111113',
  text: '#F4F4F5', tint: '#8B5CF6',
};

export const themePalettes: { light: Record<PaletteId, PaletteTokens>; dark: Record<PaletteId, PaletteTokens> } = {
  light: {
    'minimal-purple': lightBase,
    'soft-purple': { ...lightBase, primary: '#6D28D9', tint: '#6D28D9', accent: '#EDE9FE', accentForeground: '#5B21B6' },
    'matte-plum': { ...lightBase, primary: '#4C1D95', tint: '#4C1D95', accent: '#EEE8F7', accentForeground: '#4C1D95' },
    'glacial-indigo': { ...lightBase, primary: '#4338CA', tint: '#4338CA', accent: '#E0E7FF', accentForeground: '#3730A3', background: '#F8FAFC' },
    'cream-plum': { ...lightBase, primary: '#701A75', tint: '#701A75', accent: '#F6E8F2', accentForeground: '#701A75', background: '#FAF9F6' },
    'sage-stone': { ...lightBase, primary: '#356859', tint: '#356859', accent: '#E3F0EA', accentForeground: '#245044', background: '#F7FAF8' },
    'terracotta': { ...lightBase, primary: '#A44A3F', tint: '#A44A3F', accent: '#F9E7E2', accentForeground: '#80352E', background: '#FCF9F7' },
    'ocean-ink': { ...lightBase, primary: '#155E75', tint: '#155E75', accent: '#DFF3F7', accentForeground: '#164E63', background: '#F5FAFB' },
    'sandstone': { ...lightBase, primary: '#8A5A2B', tint: '#8A5A2B', accent: '#F5EBDD', accentForeground: '#70471F', background: '#FCFAF6' },
    'blue-slate': { ...lightBase, primary: '#365A7A', tint: '#365A7A', accent: '#E4EDF5', accentForeground: '#294764', background: '#F7F9FB' },
    'forest-night': { ...lightBase, primary: '#356859', tint: '#356859', accent: '#E3F0EA', accentForeground: '#245044' },
    'copper-night': { ...lightBase, primary: '#A44A3F', tint: '#A44A3F', accent: '#F9E7E2', accentForeground: '#80352E' },
    'ocean-night': { ...lightBase, primary: '#155E75', tint: '#155E75', accent: '#DFF3F7', accentForeground: '#164E63' },
    'graphite-night': { ...lightBase, primary: '#365A7A', tint: '#365A7A', accent: '#E4EDF5', accentForeground: '#294764' },
    'plum-night': { ...lightBase, primary: '#701A75', tint: '#701A75', accent: '#F6E8F2', accentForeground: '#701A75' },
  },
  dark: {
    'minimal-purple': darkBase,
    'soft-purple': { ...darkBase, primary: '#6366F1', tint: '#6366F1', accent: '#28225D', accentForeground: '#C7D2FE', background: '#030712' },
    'matte-plum': { ...darkBase, primary: '#A855F7', tint: '#A855F7', accent: '#342044', accentForeground: '#D8B4FE', background: '#121212' },
    'glacial-indigo': { ...darkBase, primary: '#7C3AED', tint: '#7C3AED', accent: '#29235A', accentForeground: '#C4B5FD', background: '#111827' },
    'cream-plum': { ...darkBase, primary: '#A78BFA', tint: '#A78BFA', accent: '#30203B', accentForeground: '#E9D5FF', background: '#000000' },
    'forest-night': { ...darkBase, primary: '#78B89C', tint: '#78B89C', accent: '#18382D', accentForeground: '#B8E0CA', background: '#091411' },
    'copper-night': { ...darkBase, primary: '#D58B6A', tint: '#D58B6A', accent: '#422820', accentForeground: '#F1C2A8', background: '#160E0B' },
    'ocean-night': { ...darkBase, primary: '#67B7C7', tint: '#67B7C7', accent: '#16383F', accentForeground: '#B5E7EE', background: '#081316' },
    'graphite-night': { ...darkBase, primary: '#B0BBC6', tint: '#B0BBC6', accent: '#2A3036', accentForeground: '#E2E8EE', background: '#101316' },
    'plum-night': { ...darkBase, primary: '#D39AC6', tint: '#D39AC6', accent: '#432D40', accentForeground: '#F2CDE9', background: '#150D14' },
    'sage-stone': { ...darkBase, primary: '#78B89C', tint: '#78B89C', accent: '#18382D', accentForeground: '#B8E0CA', background: '#091411' },
    'terracotta': { ...darkBase, primary: '#D58B6A', tint: '#D58B6A', accent: '#422820', accentForeground: '#F1C2A8', background: '#160E0B' },
    'ocean-ink': { ...darkBase, primary: '#67B7C7', tint: '#67B7C7', accent: '#16383F', accentForeground: '#B5E7EE', background: '#081316' },
    'sandstone': { ...darkBase, primary: '#D6A66D', tint: '#D6A66D', accent: '#44311E', accentForeground: '#F1D0A7', background: '#17110B' },
    'blue-slate': { ...darkBase, primary: '#8FB6D9', tint: '#8FB6D9', accent: '#23364A', accentForeground: '#C7E0F5', background: '#0C1218' },
  },
};

export const monochromePalettes: { light: PaletteTokens; dark: PaletteTokens } = {
  light: { ...lightBase, background: '#FFFFFF', card: '#FAFAFA', foreground: '#000000', cardForeground: '#000000', primary: '#111111', tint: '#111111', accent: '#EAEAEA', accentForeground: '#111111', muted: '#F2F2F2', mutedForeground: '#666666', border: '#D6D6D6', input: '#BDBDBD', text: '#000000', success: '#333333', warning: '#444444' },
  dark: { ...darkBase, background: '#000000', foreground: '#FFFFFF', cardForeground: '#FFFFFF', primary: '#FFFFFF', tint: '#FFFFFF', primaryForeground: '#000000', accent: '#303030', accentForeground: '#FFFFFF', text: '#FFFFFF' },
};

const colors = { light: lightBase, dark: darkBase, radius: 10 };

export default colors;
