import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionState {
    isPro: boolean;
    setPro: (status: boolean) => void;
    restorePurchases: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set) => ({
            isPro: false,
            setPro: (status) => set({ isPro: status }),
            restorePurchases: async () => {
                // Mock restore logic
                return new Promise((resolve) => {
                    setTimeout(() => {
                        // For mock purposes, let's say restore is successful
                        set({ isPro: true });
                        resolve(true);
                    }, 1000);
                });
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
