import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router'; // YÖNLENDİRME İÇİN GEREKLİ
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        const checkFirstLaunch = async () => {
            const hasCompleted = await AsyncStorage.getItem('has_completed_onboarding');
            if (hasCompleted === 'true') {
                setIsFirstLaunch(false);
            } else {
                setIsFirstLaunch(true);
            }
        };
        checkFirstLaunch();
    }, []);

    if (isFirstLaunch === null) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    // DİKKAT: Burada <OnboardingScreen /> YAZMAMALI. Redirect kullanılmalı!
    if (isFirstLaunch) {
        return <Redirect href="/onboarding" />;
    } else {
        return <Redirect href="/(tabs)/" />;
    }
}