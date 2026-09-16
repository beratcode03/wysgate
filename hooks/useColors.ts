import { useColorScheme } from 'react-native';
import colors, { monochromePalettes, themePalettes } from '@/constants/colors';
import { useVault } from '@/components/VaultProvider';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Falls back to the light palette when no dark key is defined in
 * constants/colors.ts. The hook automatically switches palettes based on
 * the device's appearance setting.
 */
export function useColors() {
  const systemScheme = useColorScheme();
  const { settings } = useVault();
  const scheme = settings.theme === 'system' ? systemScheme : settings.theme;
  const isDark = scheme === 'dark';
  const palette = settings.monochrome
    ? (isDark ? monochromePalettes.dark : monochromePalettes.light)
    : (isDark ? themePalettes.dark[settings.darkPalette] : themePalettes.light[settings.lightPalette]);
  return {
    ...palette,
    mutedForeground: settings.highContrast ? palette.foreground : palette.mutedForeground,
    border: settings.highContrast ? palette.foreground : palette.border,
    radius: colors.radius,
    textScale: settings.textScale,
    touchScale: settings.touchScale,
    getTextSize: (baseSize: number) => Math.max(11, Math.min(40, Math.round(baseSize * settings.textScale))),
    getTouchSize: (baseSize: number, minimum = 44) => Math.max(minimum, Math.round(baseSize * settings.touchScale)),
  };
}
