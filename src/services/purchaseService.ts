import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

// Provided API Keys
const REVENUECAT_API_KEY = 'test_dZBPmlEcpsaCDHjRHrFqjmHBSyO';

const ENTITLEMENT_ID = 'Ehliyet Hocam: Akıllı Sınav Pro';

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
    public async initialize() {
        try {
            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

            // Using same key for both as per user request
            await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

            console.log("RevenueCat initialized successfully with provided keys");
        } catch (error) {
            console.error("RevenueCat initialization error:", error);
        }
    }

    /**
     * Check if user has active entitlement
     */
    public async checkSubscriptionStatus(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (error) {
            console.error("Check subscription status error:", error);
            return false;
        }
    }

    /**
     * Present Paywall using RevenueCatUI only if entitlement is not active.
     */
    public async presentPaywallIfNeeded(): Promise<boolean> {
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
