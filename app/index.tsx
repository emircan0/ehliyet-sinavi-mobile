import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/api/supabase';
import { signOutAndClearUserData } from '../src/services/auth-session';

import { useThemeMode } from '../src/hooks/useThemeMode';

export default function Index() {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);
    const { isDarkMode, colorScheme } = useThemeMode();

    useEffect(() => {
        const checkNavigationState = async () => {
            try {
                // 1. Oturum kontrolü (En öncelikli)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    await signOutAndClearUserData();
                    setInitialRoute('/auth/login');
                    return;
                }

                // Misafir modunu kontrol edelim
                const isGuestStr = await AsyncStorage.getItem('is_guest');
                const isGuest = isGuestStr === 'true';

                if (!session && !isGuest) {
                    // Oturum ve misafir yoksa, onboarding tamamlanmış mı diye bak
                    const hasCompletedOnboarding = await AsyncStorage.getItem('has_completed_onboarding');
                    if (hasCompletedOnboarding !== 'true') {
                        setInitialRoute('/onboarding');
                    } else {
                        setInitialRoute('/auth/login');
                    }
                    return;
                }

                // 1.5 Hesap pasif mi kontrol et (Hesabımı Sil diyenler için)
                if (session) {
                    const pendingOnboardingEmail = await AsyncStorage.getItem('@pending_onboarding_email');
                    const isPendingSignup =
                        !!session.user.email &&
                        pendingOnboardingEmail === session.user.email.toLowerCase();
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, full_name, onboarding_completed')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profileError) {
                        console.warn('Profile check failed:', profileError.message);
                    }

                    if (!profile) {
                        const fullName = session.user.user_metadata?.full_name || session.user.email || 'Sürücü Adayı';
                        const { error: insertError } = await supabase
                            .from('profiles')
                            .insert([{ id: session.user.id, full_name: fullName, onboarding_completed: false }]);

                        if (!insertError) {
                            await AsyncStorage.removeItem('@pending_onboarding_email');
                            setInitialRoute('/onboarding');
                            return;
                        }
                    } else if (isPendingSignup) {
                        await supabase
                            .from('profiles')
                            .update({ onboarding_completed: false })
                            .eq('id', session.user.id);
                        await AsyncStorage.removeItem('@pending_onboarding_email');
                        setInitialRoute('/onboarding');
                        return;
                    } else if (profile.onboarding_completed === false) {
                        // Eski sürümlerde yalnızca yerel tamamlanma anahtarı yazılmış olabilir.
                        const localOnboardingCompleted = await AsyncStorage.getItem('has_completed_onboarding');
                        if (localOnboardingCompleted === 'true') {
                            await supabase
                                .from('profiles')
                                .update({ onboarding_completed: true })
                                .eq('id', session.user.id);
                        } else {
                            setInitialRoute('/onboarding');
                            return;
                        }
                    }
                }

                // 2. Onboarding tamamlandıysa ana sayfaya geç
                setInitialRoute('/(tabs)');
            } catch (error) {
                setInitialRoute('/auth/login');
            }
        };
        checkNavigationState();
    }, []);

    useEffect(() => {
        if (initialRoute) {
            router.replace(initialRoute as any);
        }
    }, [initialRoute]);

    return (
        <View className="flex-1 items-center justify-center bg-base">
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
}
