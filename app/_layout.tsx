import { useEffect } from "react";
import { View } from "react-native";
import { Stack, router } from "expo-router"; // <-- useRouter yerine router nesnesini import ettik
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import { registerForPushNotificationsAsync, savePushToken } from "../src/api/notifications";
import { supabase } from "../src/api/supabase";
import { useNotificationStore } from "../src/store/useNotificationStore";
import "../global.css";

import { useThemeMode } from "../src/hooks/useThemeMode";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <RootLayoutContent />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

function RootLayoutContent() {
    // 1. Global Hooks (Now safely inside SafeAreaProvider context)
    const addNotification = useNotificationStore(state => state.addNotification);
    const { isDarkMode, setColorScheme } = useThemeMode();
    const theme = useSettingsStore(state => state.theme);
    
    useNetworkStatus();

    // 2. Theme Management
    useEffect(() => {
        setColorScheme(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode, setColorScheme]);

    // 3. Notification Setup
    useEffect(() => {
        let isMounted = true;

        async function setupNotifications() {
            const token = await registerForPushNotificationsAsync();
            if (token && isMounted) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await savePushToken(user.id, token);
                }
            }
        }

        setupNotifications();

        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            addNotification({
                title: notification.request.content.title || 'Yeni Bildirim',
                message: notification.request.content.body || '',
                type: (notification.request.content.data?.type as any) || 'info',
                data: notification.request.content.data,
            });
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.url && typeof data.url === 'string') {
                router.push(data.url as any);
            }
        });

        return () => {
            isMounted = false;
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    return (
        <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
            <View className={isDarkMode ? "dark flex-1 bg-slate-950" : "flex-1 bg-slate-50"}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: "fade_from_bottom",
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="quiz/[id]" options={{ gestureEnabled: false }} />
                </Stack>
            </View>
            <Toast />
        </ThemeProvider>
    );
}