import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
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
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    await supabase.auth.signOut();
                    await AsyncStorage.removeItem('is_guest');
                    setInitialRoute('/auth/login');
                    return;
                }

                // Misafir modunu kontrol edelim
                const isGuestStr = await AsyncStorage.getItem('is_guest');
                const isGuest = isGuestStr === 'true';

                if (!session && !isGuest) {
                    // Oturum ve misafir yoksa direkt login'e gönder
                    setInitialRoute('/auth/login');
                    return;
                }

                // 1.5 Hesap pasif mi kontrol et (Hesabımı Sil diyenler için)
                if (session) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profileError) {
                        console.warn('Profile check failed:', profileError.message);
                    }

                    if (!profile) {
                        const fullName = session.user.user_metadata?.full_name || session.user.email || 'Sürücü Adayı';
                        await supabase.from('profiles').insert([{ id: session.user.id, full_name: fullName }]);
                    }
                }

                // 2. Doğrudan Ana Sayfaya (Onboarding Zorunluluğu Kaldırıldı)
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
