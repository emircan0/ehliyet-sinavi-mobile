import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseService } from '../services/purchaseService';
import { FREE_SUBSCRIPTION_STATUS, SubscriptionStatus } from '../types/subscription';

interface SubscriptionState {
    isPremium: boolean;
    credits: number;
    premiumExpiryDate: string | null;
    subscriptionStatus: SubscriptionStatus;
    isCheckingSubscription: boolean;
    lastCheckedAt: string | null;
    addCredits: (amount: number) => void;
    spendCredits: (amount: number) => boolean;
    checkSubscriptionStatus: () => Promise<void>;
    restorePurchases: () => Promise<boolean>;
    initializePurchases: () => Promise<void>;
    resetSubscription: () => void;
}

const getLegacyExpiryDate = (status: SubscriptionStatus) => {
    if (!status.isPremium || status.isLifetime) return null;
    return status.expiresAt;
};

const applySubscriptionStatus = (
    set: (partial: Partial<SubscriptionState>) => void,
    status: SubscriptionStatus
) => {
    set({
        isPremium: status.isPremium,
        premiumExpiryDate: getLegacyExpiryDate(status),
        subscriptionStatus: status,
        isCheckingSubscription: false,
        lastCheckedAt: new Date().toISOString(),
    });
};

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPremium: false,
            credits: 5,
            premiumExpiryDate: null,
            subscriptionStatus: FREE_SUBSCRIPTION_STATUS,
            isCheckingSubscription: false,
            lastCheckedAt: null,

            initializePurchases: async () => {
                set({ isCheckingSubscription: true });
                await purchaseService.initialize();
                
                // Set the real-time listener to sync state automatically on purchases or restores
                purchaseService.setCustomerInfoListener(async (customerInfo) => {
                    console.log("SubscriptionStore: Real-time update triggered by listener");
                    const status = await purchaseService.checkSubscriptionStatus(customerInfo);
                    applySubscriptionStatus(set, status);
                });

                const status = await purchaseService.checkSubscriptionStatus();
                applySubscriptionStatus(set, status);
            },

            addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
            
            spendCredits: (amount) => {
                const { isPremium, credits } = get();
                
                // Premium kullanıcılar kredi harcamaz, her zaman başarılı
                if (isPremium) return true;

                // Standart kullanıcılar kredi harcar
                if (credits >= amount) {
                    set({ credits: credits - amount });
                    return true;
                }
                return false;
            },

            checkSubscriptionStatus: async () => {
                set({ isCheckingSubscription: true });
                const status = await purchaseService.checkSubscriptionStatus();
                applySubscriptionStatus(set, status);
            },

            restorePurchases: async () => {
                const status = await purchaseService.restorePurchases();
                const subscriptionStatus = await purchaseService.checkSubscriptionStatus();
                applySubscriptionStatus(set, subscriptionStatus);
                return status;
            },

            resetSubscription: () => {
                applySubscriptionStatus(set, FREE_SUBSCRIPTION_STATUS);
            },
        }),
        {
            name: 'subscription-storage',
            version: 2,
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ credits: state.credits }) as SubscriptionState,
            merge: (persistedState, currentState) => ({
                ...currentState,
                credits: typeof (persistedState as Partial<SubscriptionState> | undefined)?.credits === 'number'
                    ? (persistedState as Partial<SubscriptionState>).credits as number
                    : currentState.credits,
            }),
        }
    )
);
