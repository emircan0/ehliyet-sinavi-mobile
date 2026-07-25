import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Home,
    ClipboardList,
    Settings,
    BrainCircuit,
    BarChart3,
    Trophy
} from 'lucide-react-native';
import { useThemeMode } from '../../src/hooks/useThemeMode';

export default function TabLayout() {
    const { isDarkMode } = useThemeMode();
    const insets = useSafeAreaInsets();
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
    const tabBarHeight = 60 + bottomInset;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    borderTopWidth: 1,
                    borderTopColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.6)',
                    backgroundColor: isDarkMode ? 'rgba(2, 6, 23, 0.95)' : 'rgba(255, 255, 255, 0.92)',
                    height: tabBarHeight,
                    paddingTop: 8,
                    paddingBottom: bottomInset,
                },
                tabBarActiveTintColor: isDarkMode ? '#3b82f6' : '#2563eb',
                tabBarInactiveTintColor: isDarkMode ? '#475569' : '#94a3b8',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Ana Sayfa',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} />,
                }}
            />
            <Tabs.Screen
                name="quizzes"
                options={{
                    title: 'Sınavlar',
                    tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} strokeWidth={2.5} />,
                }}
            />
            <Tabs.Screen
                name="ai-tutor"
                options={{
                    title: 'AI Hoca',
                    tabBarIcon: ({ color }) => <BrainCircuit size={24} color={color} strokeWidth={2.5} />,
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    title: 'İstatistik',
                    tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} strokeWidth={2.5} />,
                }}
            />
            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: 'Sıralama',
                    tabBarIcon: ({ color }) => <Trophy size={24} color={color} strokeWidth={2.5} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Ayarlar',
                    tabBarIcon: ({ color }) => <Settings size={24} color={color} strokeWidth={2.5} />,
                }}
            />
        </Tabs>
    );
}
