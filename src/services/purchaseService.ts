import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesEntitlementInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Constants from 'expo-constants';
import { supabase } from '../api/supabase';
import { analytics } from './analytics';
import { FREE_SUBSCRIPTION_STATUS, SubscriptionStatus } from '../types/subscription';

// Provided API Keys
// Platform specific API Keys
const REVENUECAT_API_KEY = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '',
    default: ''
});

export const REVENUECAT_PRODUCT_IDS = {
    monthly: 'com.ehliyet.ai.sinav.Smonthly',
    lifetime: 'com.ehliyet.ai.sinav.lifetime',
} as const;

const isFutureDate = (date: string | null | undefined) => {
    if (!date) return false;
    const timestamp = new Date(date).getTime();
    return Number.isFinite(timestamp) && timestamp > Date.now();
};

const getStoreLabel = (store: string | null | undefined) => {
    switch (store) {
        case 'APP_STORE':
        case 'MAC_APP_STORE':
            return 'App Store';
        case 'PLAY_STORE':
            return 'Google Play';
        case 'PROMOTIONAL':
            return 'RevenueCat Promosyon';
        default:
            return store || null;
    }
};

const getSubscriptionRank = (status: SubscriptionStatus) => {
    if (!status.isPremium) return 0;
    if (status.provider === 'revenuecat' && status.plan === 'lifetime') return 500;
    if (status.isLifetime) return 450;
    if (status.provider === 'revenuecat' && status.plan === 'monthly' && status.willRenew) return 400;
    if (status.expiresAt) {
        const timestamp = new Date(status.expiresAt).getTime();
        return Number.isFinite(timestamp) ? Math.min(399, 100 + Math.floor((timestamp - Date.now()) / 86400000)) : 100;
    }
    return 100;
};

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
    private static listenerRegistered = false;
    private static customerInfoListener: ((customerInfo: CustomerInfo) => void) | null = null;

    /**
     * Initialize RevenueCat SDK
     */
    public async initialize() {
        if (PurchaseService.isExpoGo) {
            console.log("RevenueCat: Native store is not available in Expo Go.");
            return;
        }

        if (PurchaseService.isInitialized) return;

        if (!REVENUECAT_API_KEY) {
            console.warn("RevenueCat: API key is missing for this platform.");
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();

            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
            await Purchases.configure({
                apiKey: REVENUECAT_API_KEY,
                appUserID: session?.user?.id,
            });
            PurchaseService.isInitialized = true;
            console.log("RevenueCat initialized successfully");

            if (!PurchaseService.listenerRegistered) {
                // Set up real-time listener for purchase and subscription updates
                Purchases.addCustomerInfoUpdateListener((customerInfo) => {
                    console.log("RevenueCat: Real-time customerInfo update received");
                    if (PurchaseService.customerInfoListener) {
                        PurchaseService.customerInfoListener(customerInfo);
                    }
                });
                PurchaseService.listenerRegistered = true;
            }
        } catch (error) {
            console.error("RevenueCat initialization error:", error);
            PurchaseService.isInitialized = false;
        }
    }

    /**
     * Register a callback to listen to real-time subscription changes
     */
    public setCustomerInfoListener(listener: (customerInfo: CustomerInfo) => void) {
        PurchaseService.customerInfoListener = listener;
    }

    /**
     * Sync RevenueCat with Supabase User ID and Attributes
     */
    public async logIn(userId: string, fullName?: string, email?: string) {
        if (!PurchaseService.isInitialized) {
            await this.initialize();
        }

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

    private getBestStatus(statuses: SubscriptionStatus[]) {
        return statuses.reduce((best, status) => {
            return getSubscriptionRank(status) > getSubscriptionRank(best) ? status : best;
        }, FREE_SUBSCRIPTION_STATUS);
    }

    private getPlanFromEntitlement(entitlement: PurchasesEntitlementInfo): SubscriptionStatus['plan'] {
        if (entitlement.productIdentifier === REVENUECAT_PRODUCT_IDS.lifetime) {
            return 'lifetime';
        }

        if (entitlement.productIdentifier === REVENUECAT_PRODUCT_IDS.monthly) {
            return 'monthly';
        }

        if (!entitlement.expirationDate) {
            return 'lifetime';
        }

        return 'premium';
    }

    private getRevenueCatStatus(customerInfo: CustomerInfo | null): SubscriptionStatus {
        if (!customerInfo) return FREE_SUBSCRIPTION_STATUS;

        const activeEntitlements = Object.values(customerInfo.entitlements?.active || {})
            .filter((entitlement): entitlement is PurchasesEntitlementInfo => Boolean(entitlement?.isActive));

        if (activeEntitlements.length === 0) {
            console.log("RevenueCat: No active entitlements found.");
            return FREE_SUBSCRIPTION_STATUS;
        }

        const selectedEntitlement =
            activeEntitlements.find(entitlement => entitlement.productIdentifier === REVENUECAT_PRODUCT_IDS.lifetime) ||
            activeEntitlements.find(entitlement => entitlement.productIdentifier === REVENUECAT_PRODUCT_IDS.monthly) ||
            activeEntitlements
                .filter(entitlement => isFutureDate(entitlement.expirationDate))
                .sort((a, b) => new Date(b.expirationDate || 0).getTime() - new Date(a.expirationDate || 0).getTime())[0] ||
            activeEntitlements[0];

        const plan = this.getPlanFromEntitlement(selectedEntitlement);
        const isLifetime = plan === 'lifetime';
        const storeLabel = getStoreLabel(selectedEntitlement.store);

        console.log("RevenueCat: Active entitlement selected:", {
            identifier: selectedEntitlement.identifier,
            productIdentifier: selectedEntitlement.productIdentifier,
            expirationDate: selectedEntitlement.expirationDate,
            willRenew: selectedEntitlement.willRenew,
        });

        return {
            isPremium: true,
            plan,
            provider: 'revenuecat',
            productIdentifier: selectedEntitlement.productIdentifier,
            entitlementIdentifier: selectedEntitlement.identifier,
            store: storeLabel,
            expiresAt: selectedEntitlement.expirationDate,
            willRenew: selectedEntitlement.willRenew,
            isLifetime,
            isTrial: selectedEntitlement.periodType === 'TRIAL',
            isSandbox: selectedEntitlement.isSandbox,
            managementUrl: customerInfo.managementURL,
            unsubscribeDetectedAt: selectedEntitlement.unsubscribeDetectedAt,
            billingIssueDetectedAt: selectedEntitlement.billingIssueDetectedAt,
            latestPurchaseDate: selectedEntitlement.latestPurchaseDate,
            title: plan === 'monthly' ? 'Aylık Premium' : plan === 'lifetime' ? 'Ömür Boyu Premium' : 'Premium Plan',
            description: plan === 'monthly'
                ? `${storeLabel || 'Mağaza'} aboneliği`
                : `${storeLabel || 'Mağaza'} satın alımı`,
        };
    }

    private async getPromoStatus(): Promise<SubscriptionStatus> {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return FREE_SUBSCRIPTION_STATUS;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_premium, premium_until')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) {
            console.warn("Supabase premium profile check failed:", error.message);
            return FREE_SUBSCRIPTION_STATUS;
        }

        if (!profile?.is_premium) {
            return FREE_SUBSCRIPTION_STATUS;
        }

        const premiumUntil = profile.premium_until as string | null;
        if (premiumUntil && !isFutureDate(premiumUntil)) {
            return FREE_SUBSCRIPTION_STATUS;
        }

        return {
            ...FREE_SUBSCRIPTION_STATUS,
            isPremium: true,
            plan: 'promo',
            provider: 'supabase',
            expiresAt: premiumUntil,
            isLifetime: !premiumUntil,
            title: 'Promosyon Premium',
            description: premiumUntil ? 'Kod ile tanımlı süreli erişim' : 'Kod ile tanımlı süresiz erişim',
        };
    }

    /**
     * Check the currently logged-in account across RevenueCat and Supabase promo grants.
     */
    public async checkSubscriptionStatus(customerInfoOverride?: CustomerInfo): Promise<SubscriptionStatus> {
        try {
            let revenueCatStatus = FREE_SUBSCRIPTION_STATUS;

            if (PurchaseService.isInitialized) {
                const customerInfo = customerInfoOverride || await Purchases.getCustomerInfo();
                revenueCatStatus = this.getRevenueCatStatus(customerInfo);
            }

            const promoStatus = await this.getPromoStatus();
            return this.getBestStatus([revenueCatStatus, promoStatus]);
        } catch (error) {
            console.error("Check subscription status error:", error);
            return FREE_SUBSCRIPTION_STATUS;
        }
    }

    /**
     * Present Paywall using RevenueCatUI only if entitlement is not active.
     */
    public async presentPaywallIfNeeded(): Promise<boolean> {
        if (!PurchaseService.isInitialized) return false;
        try {
            // Önce JS tarafındaki esnek ve dinamik kontrolümüzü yapıyoruz
            const { isPremium } = await this.checkSubscriptionStatus();
            if (isPremium) {
                console.log("RevenueCat: User is already premium, skipping paywall presentation");
                return true;
            }

            // Eğer premium değilse resmi paywall ekranını zorla açıyoruz
            console.log("RevenueCat: User is not premium, presenting paywall...");
            return await this.presentPaywall();
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
            analytics.trackEvent({ eventName: 'purchase_started' });
            const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

            switch (paywallResult) {
                case PAYWALL_RESULT.NOT_PRESENTED:
                case PAYWALL_RESULT.ERROR:
                case PAYWALL_RESULT.CANCELLED:
                    return false;
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    analytics.trackEvent({ eventName: 'purchase_completed', metadata: { result: paywallResult } });
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
            const status = await this.checkSubscriptionStatus(customerInfo);
            console.log("RevenueCat restore status:", status);
            return status.isPremium;
        } catch (error) {
            console.error("Restore purchases error:", error);
            return false;
        }
    }
}

export const purchaseService = PurchaseService.getInstance();
