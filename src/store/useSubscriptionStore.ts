import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { purchaseService } from '../services/purchaseService';

interface SubscriptionState {
    isPremium: boolean;
    credits: number;
    premiumExpiryDate: string | null;
    setPremium: (status: boolean, durationDays?: number) => void;
    addCredits: (amount: number) => void;
    spendCredits: (amount: number) => boolean;
    checkSubscriptionStatus: () => Promise<void>;
    restorePurchases: () => Promise<boolean>;
    initializePurchases: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            isPremium: false,
            credits: 5,
            premiumExpiryDate: null,

            initializePurchases: async () => {
                await purchaseService.initialize();
                
                // Set the real-time listener to sync state automatically on purchases or restores
                purchaseService.setCustomerInfoListener(async (customerInfo) => {
                    console.log("SubscriptionStore: Real-time update triggered by listener");
                    // Re-run subscription status check to update the Zustand store state
                    const { isPremium: hasPremium, premiumUntil } = await purchaseService.checkSubscriptionStatus();
                    set({ isPremium: hasPremium, premiumExpiryDate: premiumUntil });
                });

                const { isPremium, premiumUntil } = await purchaseService.checkSubscriptionStatus();
                set({ isPremium, premiumExpiryDate: premiumUntil });
            },

            setPremium: (status, durationDays) => {
                let expiryDate: string | null = null;
                if (status && durationDays) {
                    const date = new Date();
                    date.setDate(date.getDate() + durationDays);
                    expiryDate = date.toISOString();
                }
                set({ isPremium: status, premiumExpiryDate: expiryDate });
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
                const { isPremium, premiumUntil } = await purchaseService.checkSubscriptionStatus();
                set({ isPremium, premiumExpiryDate: premiumUntil });
            },

            restorePurchases: async () => {
                const status = await purchaseService.restorePurchases();
                // Geri yüklemede Apple verisi önceliklidir, tarih varsa o set edilir
                set({ isPremium: status });
                return status;
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
