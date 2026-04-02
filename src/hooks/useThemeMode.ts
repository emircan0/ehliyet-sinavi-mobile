import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useColorScheme as useReactNativeColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

export function useThemeMode() {
    const { colorScheme, setColorScheme } = useNativewindColorScheme();
    const systemTheme = useReactNativeColorScheme();
    const themeSetting = useSettingsStore(state => state.theme);

    const activeMode = themeSetting === 'system' ? systemTheme : themeSetting;
    const isDarkMode = activeMode === 'dark';

    return { isDarkMode, colorScheme, setColorScheme, systemTheme, activeMode };
}
