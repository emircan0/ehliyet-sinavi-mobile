import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { purchaseService } from '../src/services/purchaseService';

/**
 * PremiumScreen (Deactivated)
 * This screen now serves as a redirector to the RevenueCat Paywall.
 * The custom UI has been disabled to prevent "Double Paywall" UX issues.
 */
export default function PremiumScreen() {
    const router = useRouter();

    useEffect(() => {
        const triggerPaywall = async () => {
            // Trigger the RevenueCat paywall
            await purchaseService.presentPaywall();
            
            // After closing the paywall, go back to the previous screen
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)');
            }
        };

        triggerPaywall();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
            <ActivityIndicator size="large" color="#fbbf24" />
        </View>
    );
}