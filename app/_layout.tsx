import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import { useNotificationStore } from "../src/store/useNotificationStore";
import "../global.css";

import { useThemeMode } from "../src/hooks/useThemeMode";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { useSubscriptionStore } from "../src/store/useSubscriptionStore";
import { useAuth } from "../src/hooks/useAuth";
import { registerForPushNotificationsAsync } from "../src/api/notifications";

import GlobalErrorBoundary from "../src/components/GlobalErrorBoundary";

export default function RootLayout() {
    // 1. Global Hooks & Store Access
    const addNotification = useNotificationStore(state => state.addNotification);
    const { isDarkMode, setColorScheme } = useThemeMode();
    const theme = useSettingsStore(state => state.theme);
    const { user } = useAuth();

    // Network status listener
    useNetworkStatus();

    // Purchase initialization
    const initializePurchases = useSubscriptionStore(state => state.initializePurchases);
    useEffect(() => {
        initializePurchases();
    }, []);

    // 2. Push Notification Registration
    useEffect(() => {
        if (user?.id) {
            registerForPushNotificationsAsync(user.id);
        }
    }, [user?.id]);

    // 2. Theme Management logic
    useEffect(() => {
        setColorScheme(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode, setColorScheme]);

    // 3. Notification Listeners 
    useEffect(() => {
        let isMounted = true;

        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            if (isMounted) {
                addNotification({
                    title: notification.request.content.title || 'Yeni Bildirim',
                    message: notification.request.content.body || '',
                    type: (notification.request.content.data?.type as any) || 'info',
                    data: notification.request.content.data,
                });
            }
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.route && typeof data.route === 'string') {
                router.push(data.route as any);
            } else if (data?.url && typeof data.url === 'string') {
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
        <GlobalErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: "fade_from_bottom",
                        contentStyle: {
                            backgroundColor: isDarkMode ? "#020617" : "#f8fafc"
                        }
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="quiz/[id]" options={{ gestureEnabled: false }} />
                    <Stack.Screen name="terms" options={{ presentation: 'modal', title: 'Koşullar' }} />
                    <Stack.Screen name="privacy" options={{ presentation: 'modal', title: 'Gizlilik' }} />
                    <Stack.Screen name="support" options={{ presentation: 'modal', title: 'Yardım' }} />
                    <Stack.Screen name="contact" options={{ presentation: 'modal', title: 'İletişim' }} />
                    <Stack.Screen name="auth/login" />
                    <Stack.Screen name="auth/register" />
                </Stack>
                <Toast />
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </GlobalErrorBoundary>
    );
}