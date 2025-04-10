import { ColorSchemeName } from 'react-native';
import { useThemeContext } from './ThemeProvider';

/**
 * Hook that returns the current color scheme.
 * This is a wrapper around useThemeContext to maintain compatibility
 * with React Navigation and other libraries that expect a ColorSchemeName.
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  const { colorScheme } = useThemeContext();
  return colorScheme;
}
