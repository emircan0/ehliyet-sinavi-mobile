import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { purchaseService } from '../services/purchaseService';

interface PremiumAccessOptions {
    onSuccess: () => void;
    featureName?: string;
    onAdRequired?: () => void;
    creditCost?: number;
}

export const usePremiumAccess = () => {
    const router = useRouter();
    const { isPremium, spendCredits, checkSubscriptionStatus } = useSubscriptionStore();

    const checkAccess = ({
        onSuccess,
        featureName = "Premium Özellik",
        onAdRequired,
        creditCost = 1
    }: PremiumAccessOptions) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (isPremium) {
            onSuccess();
            return;
        }

        // Kredi harcayarak girme mantığı
        Alert.alert(
            featureName,
            `Bu özelliği kullanmak için Premium abone olmalısınız veya ${creditCost} kredi harcamalısınız.`,
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Premium'a Geç",
                    onPress: async () => {
                        const success = await purchaseService.presentPaywall();
                        if (success) {
                            await checkSubscriptionStatus();
                            onSuccess();
                        }
                    }
                },
                {
                    text: `${creditCost} Kredi Harca`,
                    onPress: () => {
                        if (spendCredits(creditCost)) {
                            onSuccess();
                        } else {
                            Alert.alert("Kredi Yetersiz", "Reklam izleyerek kredi kazanabilirsiniz.", [
                                {
                                    text: "Reklam İzle",
                                    onPress: () => {
                                        if (onAdRequired) {
                                            onAdRequired();
                                        } else {
                                            // Ad modal logic can be handled by the component
                                            Alert.alert("Bilgi", "Ana sayfadan reklam izleyerek kredi kazanabilirsiniz.");
                                        }
                                    }
                                },
                                { text: "Tamam" }
                            ]);
                        }
                    }
                }
            ]
        );
    };

    return { checkAccess, isPremium };
};
