import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';
import type { Notification, NotificationResponse } from 'expo-notifications';
// import * as Notifications from 'expo-notifications'; // Expo Go'da çökmeyi önlemek için kaldırıldı
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import { useNotificationStore } from "../src/store/useNotificationStore";
import * as Linking from 'expo-linking';
import "../global.css";

import { useThemeMode } from "../src/hooks/useThemeMode";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { useSubscriptionStore } from "../src/store/useSubscriptionStore";
import { useAuth } from "../src/hooks/useAuth";
import { registerForPushNotificationsAsync } from "../src/api/notifications";
import mobileAds from 'react-native-google-mobile-ads';
import { adService } from '../src/services/adService';
import { purchaseService } from '../src/services/purchaseService';
import { supabase } from '../src/api/supabase';

import GlobalErrorBoundary from "../src/components/GlobalErrorBoundary";

export default function RootLayout() {
    // 1. Global Hooks & Store Access
    const addNotification = useNotificationStore(state => state.addNotification);
    const { isDarkMode, setColorScheme } = useThemeMode();
    const theme = useSettingsStore(state => state.theme);
    const { user, loading: authLoading } = useAuth();

    // Network status listener
    useNetworkStatus();

    // Purchase and Ads initialization
    const initializePurchases = useSubscriptionStore(state => state.initializePurchases);
    const checkSubscriptionStatus = useSubscriptionStore(state => state.checkSubscriptionStatus);
    const resetSubscription = useSubscriptionStore(state => state.resetSubscription);
    const isPremium = useSubscriptionStore(state => state.isPremium);

    useEffect(() => {
        initializePurchases();

        // Initialize Mobile Ads
        mobileAds()
            .initialize()
            .then(adapterStatuses => {
                console.log('Mobile Ads initialized');
            });
    }, []);

    useEffect(() => {
        if (!isPremium) {
            adService.loadRewarded();
        }
    }, [isPremium]);

    // 2. Push Notification Registration
    useEffect(() => {
        if (user?.id) {
            registerForPushNotificationsAsync(user.id);
        }
    }, [user?.id]);

    // 2. RevenueCat User Sync
    useEffect(() => {
        if (authLoading) return;

        let isMounted = true;

        const syncRevenueCatUser = async () => {
            if (user?.id) {
                const fullName = user.user_metadata?.full_name || '';
                const email = user.email || '';
                await purchaseService.logIn(user.id, fullName, email);
                if (isMounted) {
                    await checkSubscriptionStatus();
                }
            } else {
                await purchaseService.logOut();
                if (isMounted) {
                    resetSubscription();
                }
            }
        };

        syncRevenueCatUser();

        return () => {
            isMounted = false;
        };
    }, [authLoading, user?.id]);

    // 2. Theme Management logic
    useEffect(() => {
        setColorScheme(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode, setColorScheme]);

    // 2.5 Global Auth Observer
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                // Clear any guest state just in case
                AsyncStorage.removeItem('is_guest').catch(() => {});
                
                // Reset navigation and go to login
                if (router.canDismiss()) {
                    router.dismissAll();
                }
                router.replace('/auth/login');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 3. Notification Listeners 
    useEffect(() => {
        const isExpoGo = Constants.appOwnership === 'expo';
        if (isExpoGo) return;

        let isMounted = true;
        const Notifications = require('expo-notifications');

        const receivedSubscription = Notifications.addNotificationReceivedListener((notification: Notification) => {
            if (isMounted) {
                addNotification({
                    title: notification.request.content.title || 'Yeni Bildirim',
                    message: notification.request.content.body || '',
                    type: (notification.request.content.data?.type as any) || 'info',
                    data: notification.request.content.data,
                });
            }
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: NotificationResponse) => {
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

    // 4. Deep Link Handling for Auth (Password Reset & Confirmation)
    useEffect(() => {
        const handleDeepLink = async (url: string) => {
            console.log('Incoming Deep Link:', url);
            const { path, queryParams } = Linking.parse(url);
            const normalizedPath = path || '';

            const getQueryParam = (key: string) => {
                const value = queryParams?.[key];
                return Array.isArray(value) ? value[0] : value;
            };

            const navigateAfterAuthLink = () => {
                setTimeout(() => {
                    try {
                        if (normalizedPath.includes('reset-password')) {
                            router.replace('/auth/reset-password');
                        } else if (normalizedPath.includes('confirmation')) {
                            router.replace('/confirmation');
                            Toast.show({
                                type: 'success',
                                text1: 'E-posta Onaylandı',
                                text2: 'Uygulamaya hoş geldiniz!'
                            });
                        }
                    } catch (navError) {
                        console.error('Navigation error during deep link:', navError);
                    }
                }, 1000);
            };

            const code = getQueryParam('code');
            if (typeof code === 'string' && code.length > 0) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error('Supabase exchangeCodeForSession error:', error.message);
                } else {
                    navigateAfterAuthLink();
                }
                return;
            }
            
            // Supabase auth links usually come in the hash (#) part of the URL
            // Expo Linking.parse handles basic extraction
            const fragment = url.split('#')[1];
            if (fragment) {
                // Parse fragment manually to avoid URLSearchParams issues in some environments
                const params: Record<string, string> = {};
                fragment.split('&').forEach(part => {
                    const [key, value] = part.split('=');
                    if (key && value) params[key] = decodeURIComponent(value);
                });

                const accessToken = params['access_token'];
                const refreshToken = params['refresh_token'];
                const type = params['type'];

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error('Supabase setSession error:', error.message);
                    } else {
                        if (type === 'recovery') {
                            router.replace('/auth/reset-password');
                        } else if (type === 'signup') {
                            router.replace('/confirmation');
                            Toast.show({
                                type: 'success',
                                text1: 'E-posta Onaylandı',
                                text2: 'Uygulamaya hoş geldiniz!'
                            });
                        } else {
                            navigateAfterAuthLink();
                        }
                    }
                }
            }
        };

        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        // Check for initial URL (if app was closed)
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        return () => subscription.remove();
    }, []);

    return (
        <GlobalErrorBoundary>
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
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
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </GlobalErrorBoundary>
    );
}
