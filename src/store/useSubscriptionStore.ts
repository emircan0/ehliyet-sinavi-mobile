import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseService } from '../services/purchaseService';

interface SubscriptionState {
    isPro: boolean;
    credits: number;
    proExpiryDate: string | null;
    setPro: (status: boolean, durationDays?: number) => void;
    addCredits: (amount: number) => void;
    spendCredits: (amount: number) => boolean;
    checkSubscriptionStatus: () => Promise<void>;
    restorePurchases: () => Promise<boolean>;
    initializePurchases: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPro: false,
            credits: 5,   // Yeni kullanıcılara başlangıç kredisi verelim
            proExpiryDate: null,

            initializePurchases: async () => {
                await purchaseService.initialize();
                const status = await purchaseService.checkSubscriptionStatus();
                set({ isPro: status });
            },

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
                const { isPro, credits } = get();
                
                // Pro kullanıcılar kredi harcamaz, her zaman başarılı
                if (isPro) return true;

                // Standart kullanıcılar kredi harcar
                if (credits >= amount) {
                    set({ credits: credits - amount });
                    return true;
                }
                return false;
            },

            checkSubscriptionStatus: async () => {
                const status = await purchaseService.checkSubscriptionStatus();
                set({ isPro: status });
            },

            restorePurchases: async () => {
                const status = await purchaseService.restorePurchases();
                set({ isPro: status });
                return status;
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
