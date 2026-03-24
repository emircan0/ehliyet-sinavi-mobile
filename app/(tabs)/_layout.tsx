import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
    Home,
    ClipboardList,
    Settings,
    BrainCircuit,
    BarChart3
} from 'lucide-react-native';

export default function TabLayout() {
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
                    borderTopColor: 'rgba(226, 232, 240, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                },
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
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
                name="settings"
                options={{
                    title: 'Ayarlar',
                    tabBarIcon: ({ color }) => <Settings size={24} color={color} strokeWidth={2.5} />,
                }}
            />
        </Tabs>
    );
}