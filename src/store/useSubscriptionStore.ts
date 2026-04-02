import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionState {
    isPro: boolean;
    credits: number;
    proExpiryDate: string | null;
    setPro: (status: boolean, durationDays?: number) => void;
    addCredits: (amount: number) => void;
    spendCredits: (amount: number) => boolean;
    checkSubscriptionStatus: () => void;
    restorePurchases: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPro: false,
            credits: 0,
            proExpiryDate: null,
            setPro: (status, durationDays) => {
                let expiryDate: string | null = null;
                if (status && durationDays) {
                    const date = new Date();
                    date.setDate(date.getDate() + durationDays);
                    expiryDate = date.toISOString();
                }
                set({ isPro: status, proExpiryDate: expiryDate });
            },
            addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
            spendCredits: (amount) => {
                const currentCredits = get().credits;
                if (currentCredits >= amount) {
                    set({ credits: currentCredits - amount });
                    return true;
                }
                return false;
            },
            checkSubscriptionStatus: () => {
                const { isPro, proExpiryDate } = get();
                if (isPro && proExpiryDate) {
                    const now = new Date();
                    const expiry = new Date(proExpiryDate);
                    if (now > expiry) {
                        set({ isPro: false, proExpiryDate: null });
                        console.log("Subscription expired!");
                    }
                }
            },
            restorePurchases: async () => {
                // Mock restore logic - assuming Yearly for restore if not specified
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() + 1);
                        set({ isPro: true, proExpiryDate: date.toISOString() });
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
