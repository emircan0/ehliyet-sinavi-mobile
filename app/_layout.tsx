import { useEffect } from "react";
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

import { useColorScheme } from "nativewind";
import { useSettingsStore } from "../src/store/useSettingsStore";

export default function RootLayout() {
    // const router = useRouter(); satırını tamamen kaldırdık.
    const addNotification = useNotificationStore(state => state.addNotification);
    useNetworkStatus();

    // 1. NativeWind ve Zustand Bağlantısı
    const { setColorScheme } = useColorScheme();
    const theme = useSettingsStore(state => state.theme);

    useEffect(() => {
        // Zustand'daki kaydedilmiş temayı NativeWind'e uygula
        if (theme) {
            setColorScheme(theme);
        }
    }, [theme, setColorScheme]);

    // 2. Bildirim Kurulumu
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
                id: notification.request.identifier,
                title: notification.request.content.title || 'Yeni Bildirim',
                body: notification.request.content.body || '',
                time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                type: (notification.request.content.data?.type as any) || 'info',
            });
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.url && typeof data.url === 'string') {
                // Burada global router nesnesini kullanarak yönlendirme yapıyoruz
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
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
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
                <Toast />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}