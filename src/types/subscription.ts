export type SubscriptionPlan = 'free' | 'monthly' | 'lifetime' | 'promo' | 'premium';

export type SubscriptionProvider = 'none' | 'revenuecat' | 'supabase';

export interface SubscriptionStatus {
    isPremium: boolean;
    plan: SubscriptionPlan;
    provider: SubscriptionProvider;
    productIdentifier: string | null;
    entitlementIdentifier: string | null;
    store: string | null;
    expiresAt: string | null;
    willRenew: boolean;
    isLifetime: boolean;
    isTrial: boolean;
    isSandbox: boolean;
    managementUrl: string | null;
    unsubscribeDetectedAt: string | null;
    billingIssueDetectedAt: string | null;
    latestPurchaseDate: string | null;
    title: string;
    description: string;
}

export const FREE_SUBSCRIPTION_STATUS: SubscriptionStatus = {
    isPremium: false,
    plan: 'free',
    provider: 'none',
    productIdentifier: null,
    entitlementIdentifier: null,
    store: null,
    expiresAt: null,
    willRenew: false,
    isLifetime: false,
    isTrial: false,
    isSandbox: false,
    managementUrl: null,
    unsubscribeDetectedAt: null,
    billingIssueDetectedAt: null,
    latestPurchaseDate: null,
    title: 'Ücretsiz Plan',
    description: 'Temel özellikler aktif',
};
