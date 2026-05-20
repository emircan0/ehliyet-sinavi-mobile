import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { X } from 'lucide-react-native';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';

/**
 * Official RevenueCat Managed Paywall Screen
 * This screen uses the UI configured in the RevenueCat Dashboard.
 */
export default function PaywallScreen() {
    const router = useRouter();
    const checkSubscriptionStatus = useSubscriptionStore(state => state.checkSubscriptionStatus);

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <RevenueCatUI.Paywall 
                onDismiss={() => {
                    // Update subscription status in store after dismissal
                    checkSubscriptionStatus();
                    router.back();
                }}
            />
            
            {/* Close button as fallback if Paywall doesn't have one */}
            <TouchableOpacity 
                onPress={() => router.back()}
                className="absolute top-12 right-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center z-50"
            >
                <X size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}
