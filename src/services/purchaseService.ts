import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Constants from 'expo-constants';
import { supabase } from '../api/supabase';

// Provided API Keys
// Platform specific API Keys
const REVENUECAT_API_KEY = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '',
    default: ''
});

const ENTITLEMENT_ID = 'Ehliyet Hocam Lifetime';

export class PurchaseService {
    private static instance: PurchaseService;

    private constructor() {}

    public static getInstance(): PurchaseService {
        if (!PurchaseService.instance) {
            PurchaseService.instance = new PurchaseService();
        }
        return PurchaseService.instance;
    }

    /**
     * Initialize RevenueCat SDK
     */
    private static isInitialized = false;
    private static isExpoGo = Constants.appOwnership === 'expo';

    /**
     * Initialize RevenueCat SDK
     */
    public async initialize() {
        if (PurchaseService.isExpoGo) {
            console.log("RevenueCat: Native store is not available in Expo Go.");
            return;
        }

        try {
            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
            await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
            PurchaseService.isInitialized = true;
            console.log("RevenueCat initialized successfully");
        } catch (error) {
            console.error("RevenueCat initialization error:", error);
            PurchaseService.isInitialized = false;
        }
    }

    /**
     * Sync RevenueCat with Supabase User ID and Attributes
     */
    public async logIn(userId: string, fullName?: string, email?: string) {
        if (!PurchaseService.isInitialized) return;
        try {
            await Purchases.logIn(userId);
            
            // Set User Attributes for better identification in RevenueCat Dashboard
            const attributes: Record<string, string> = {};
            if (fullName) attributes["$displayName"] = fullName;
            if (email) attributes["$email"] = email;
            
            if (Object.keys(attributes).length > 0) {
                await Purchases.setAttributes(attributes);
            }

            console.log("RevenueCat: User logged in and attributes synced", userId);
        } catch (error) {
            console.error("RevenueCat login error:", error);
        }
    }

    /**
     * Clear RevenueCat user data on logout
     */
    public async logOut() {
        if (!PurchaseService.isInitialized) return;
        try {
            await Purchases.logOut();
            console.log("RevenueCat: User logged out");
        } catch (error) {
            console.error("RevenueCat logout error:", error);
        }
    }

    /**
     * Check if user has active entitlement
     */
    public async checkSubscriptionStatus(): Promise<{ isPremium: boolean; premiumUntil: string | null }> {
        try {
            // 1. RevenueCat Kontrolü
            let hasApplePremium = false;
            if (PurchaseService.isInitialized) {
                const customerInfo = await Purchases.getCustomerInfo();
                hasApplePremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
            }

            // 2. Supabase Kontrolü (Promosyon Kodu için)
            let hasSupabasePremium = false;
            let supabasePremiumUntil: string | null = null;
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_premium, premium_until')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile?.is_premium) {
                    if (profile.premium_until) {
                        const expiry = new Date(profile.premium_until);
                        const now = new Date();
                        if (expiry > now) {
                            hasSupabasePremium = true;
                            supabasePremiumUntil = profile.premium_until;
                        }
                    } else {
                        hasSupabasePremium = true;
                    }
                }
            }

            return { 
                isPremium: hasApplePremium || hasSupabasePremium,
                premiumUntil: hasApplePremium ? null : supabasePremiumUntil // Apple aboneliklerinde tarih yönetimini Store'da halledeceğiz
            };
        } catch (error) {
            console.error("Check subscription status error:", error);
            return { isPremium: false, premiumUntil: null };
        }
    }

    /**
     * Present Paywall using RevenueCatUI only if entitlement is not active.
     */
    public async presentPaywallIfNeeded(): Promise<boolean> {
        if (!PurchaseService.isInitialized) return false;
        try {
            const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: ENTITLEMENT_ID
            });

            switch (paywallResult) {
                case PAYWALL_RESULT.NOT_PRESENTED:
                    // User already has entitlement
                    return true;
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    return true;
                default:
                    return false;
            }
        } catch (error) {
            console.error("Present paywall if needed error:", error);
            return false;
        }
    }

    /**
     * Present Paywall using RevenueCatUI (Force show)
     */
    public async presentPaywall(): Promise<boolean> {
        if (!PurchaseService.isInitialized) return false;
        try {
            const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

            switch (paywallResult) {
                case PAYWALL_RESULT.NOT_PRESENTED:
                case PAYWALL_RESULT.ERROR:
                case PAYWALL_RESULT.CANCELLED:
                    return false;
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    return true;
                default:
                    return false;
            }
        } catch (error) {
            console.error("Present paywall error:", error);
            return false;
        }
    }

    /**
     * Restore purchases
     */
    public async restorePurchases(): Promise<boolean> {
        if (!PurchaseService.isInitialized) return false;
        try {
            const customerInfo = await Purchases.restorePurchases();
            return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (error) {
            console.error("Restore purchases error:", error);
            return false;
        }
    }
}

export const purchaseService = PurchaseService.getInstance();
