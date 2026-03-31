import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/api/supabase';

export default function Index() {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);

    useEffect(() => {
        const checkNavigationState = async () => {
            try {
                // 1. Onboarding kontrolü
                const hasCompletedOnboarding = await AsyncStorage.getItem('has_completed_onboarding');
                if (hasCompletedOnboarding !== 'true') {
                    setInitialRoute('/onboarding');
                    return;
                }

                // 2. Oturum kontrolü
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setInitialRoute('/(tabs)');
                    return;
                }

                // 3. Misafir girişi kontrolü
                const isGuest = await AsyncStorage.getItem('is_guest');
                if (isGuest === 'true') {
                    setInitialRoute('/(tabs)');
                    return;
                }

                // Hiçbiri değilse login'e gönder (Ziyaretçi Modu burada devreye girer)
                setInitialRoute('/auth/login');
            } catch (error) {
                setInitialRoute('/auth/login');
            }
        };
        checkNavigationState();
    }, []);

    if (initialRoute === null) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return <Redirect href={initialRoute as any} />;
}