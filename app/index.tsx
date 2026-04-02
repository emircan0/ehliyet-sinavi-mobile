import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/api/supabase';

import { useThemeMode } from '../src/hooks/useThemeMode';

export default function Index() {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);
    const { isDarkMode, colorScheme } = useThemeMode();

    useEffect(() => {
        const checkNavigationState = async () => {
            try {
                // 1. Oturum kontrolü (En öncelikli)
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    // Oturum yoksa direkt login'e gönder
                    setInitialRoute('/auth/login');
                    return;
                }

                // 1.5 Hesap pasif mi kontrol et (Hesabımı Sil diyenler için)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_active')
                    .eq('id', session.user.id)
                    .single();

                if (profile && profile.is_active === false) {
                    await supabase.auth.signOut();
                    setInitialRoute('/auth/login');
                    return;
                }

                // 2. Onboarding kontrolü (Oturum varsa bakılır)
                const hasCompletedOnboarding = await AsyncStorage.getItem('has_completed_onboarding');
                if (hasCompletedOnboarding !== 'true') {
                    setInitialRoute('/onboarding');
                    return;
                }

                // 3. Her şey tamamsa ana sayfaya
                setInitialRoute('/(tabs)');
            } catch (error) {
                setInitialRoute('/auth/login');
            }
        };
        checkNavigationState();
    }, []);

    if (initialRoute === null) {
        return (
            <View className="flex-1 items-center justify-center bg-base">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return <Redirect href={initialRoute as any} />;
}