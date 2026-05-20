import React from 'react';
import { ActivityIndicator, Alert, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CheckCircle2, CreditCard, Crown, ExternalLink, RefreshCw } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { purchaseService } from '../src/services/purchaseService';
import { supabase } from '../src/api/supabase';

export default function SubscriptionsScreen() {
    const {
        isPremium,
        restorePurchases,
        subscriptionStatus,
        checkSubscriptionStatus,
        isCheckingSubscription,
    } = useSubscriptionStore();

    const [promoCode, setPromoCode] = React.useState('');
    const [isRedeeming, setIsRedeeming] = React.useState(false);

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(date));
    };

    const getDaysRemaining = (date: string) => {
        const diffTime = new Date(date).getTime() - Date.now();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    const getRemainingText = () => {
        if (!isPremium) return 'Aktif premium erişim yok';

        if (subscriptionStatus.billingIssueDetectedAt) {
            return subscriptionStatus.expiresAt
                ? `Ödeme sorunu var, erişim ${formatDate(subscriptionStatus.expiresAt)} tarihine kadar aktif`
                : 'Ödeme sorunu algılandı';
        }

        if (subscriptionStatus.isLifetime) {
            return subscriptionStatus.plan === 'promo'
                ? 'Süresiz promosyon erişimi'
                : 'Ömür boyu sınırsız erişim';
        }

        if (!subscriptionStatus.expiresAt) {
            return 'Premium erişim aktif';
        }

        const daysRemaining = getDaysRemaining(subscriptionStatus.expiresAt);

        if (subscriptionStatus.plan === 'monthly') {
            if (subscriptionStatus.willRenew) {
                return `${formatDate(subscriptionStatus.expiresAt)} tarihinde yenilenir (${daysRemaining} gün)`;
            }

            return `Yenileme kapalı, ${daysRemaining} gün kaldı`;
        }

        if (subscriptionStatus.plan === 'promo') {
            return `${formatDate(subscriptionStatus.expiresAt)} tarihine kadar (${daysRemaining} gün kaldı)`;
        }

        return `${daysRemaining} gün kaldı`;
    };

    const getSourceText = () => {
        if (!isPremium) return 'Yok';
        if (subscriptionStatus.provider === 'supabase') return 'Promosyon kodu';

        const store = subscriptionStatus.store || 'Mağaza';
        return subscriptionStatus.isSandbox ? `${store} Sandbox` : store;
    };

    const getRenewalText = () => {
        if (!isPremium) return 'Aktif değil';
        if (subscriptionStatus.billingIssueDetectedAt) return 'Ödeme sorunu algılandı';
        if (subscriptionStatus.isLifetime) return 'Süresiz';
        if (subscriptionStatus.plan === 'monthly') {
            return subscriptionStatus.willRenew ? 'Otomatik yenileme açık' : 'Otomatik yenileme kapalı';
        }
        return subscriptionStatus.expiresAt ? 'Süreli erişim' : 'Aktif';
    };

    const handleRestore = async () => {
        try {
            const success = await restorePurchases();
            if (success) {
                Alert.alert('Başarılı', 'Satın almalar başarıyla geri yüklendi.');
            } else {
                Alert.alert('Bilgi', 'Geri yüklenecek aktif bir satın alma bulunamadı.');
            }
        } catch (error) {
            Alert.alert('Bilgi', 'Geri yüklenecek aktif bir satın alma bulunamadı.');
        }
    };

    const handleRedeemCode = async () => {
        if (!promoCode.trim()) return;

        try {
            setIsRedeeming(true);
            const { data, error } = await supabase.rpc('redeem_promo_code', {
                input_code: promoCode.trim().toUpperCase()
            });

            if (error) throw error;

            if (data.success) {
                Alert.alert("Başarılı", data.message);
                setPromoCode('');
                await checkSubscriptionStatus();
            } else {
                Alert.alert("Bilgi", data.message);
            }
        } catch (error) {
            console.error('Redeem error:', error);
            Alert.alert("Hata", 'Kod uygulanırken bir hata oluştu.');
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!subscriptionStatus.managementUrl) {
            Alert.alert('Bilgi', 'Aboneliğinizi App Store veya Google Play hesap ayarlarınızdan yönetebilirsiniz.');
            return;
        }

        await Linking.openURL(subscriptionStatus.managementUrl);
    };

    const statusHasWarning = Boolean(subscriptionStatus.billingIssueDetectedAt);

    return (
        <ScreenLayout className="bg-[#F2F2F7] dark:bg-slate-950">
            <View className="p-6">
                <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 pr-4">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">MEVCUT PLAN</Text>
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                                {subscriptionStatus.title}
                            </Text>
                        </View>
                        <View className={`p-2.5 rounded-2xl ${isPremium ? 'bg-amber-100 dark:bg-amber-900/20 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {isPremium ? <Crown size={24} color="#d97706" /> : <CreditCard size={24} color="#64748b" />}
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />

                    <View className="flex-row items-center">
                        <CheckCircle2 size={16} color={isPremium ? "#10b981" : "#64748b"} className="mr-2" />
                        <Text className="text-slate-600 dark:text-slate-400 text-sm font-medium flex-1">
                            {isPremium ? 'Tüm premium özellikler aktif' : subscriptionStatus.description}
                        </Text>
                    </View>
                </View>

                <View
                    className={`p-5 rounded-2xl border items-center mb-4 shadow-sm ${
                        statusHasWarning
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
                            : isPremium
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                >
                    <View className="flex-row items-center mb-1">
                        {statusHasWarning ? (
                            <AlertTriangle size={18} color="#d97706" className="mr-2" />
                        ) : (
                            <CheckCircle2 size={18} color={isPremium ? "#10b981" : "#64748b"} className="mr-2" />
                        )}
                        <Text className={`font-bold ${
                            statusHasWarning
                                ? 'text-amber-700 dark:text-amber-400'
                                : isPremium
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-600 dark:text-slate-400'
                        }`}>
                            {isPremium ? 'Premium Aktif' : 'Ücretsiz Plan'}
                        </Text>
                    </View>
                    <Text className={`text-xs font-medium text-center ${
                        statusHasWarning
                            ? 'text-amber-700/70 dark:text-amber-400/70'
                            : isPremium
                                ? 'text-emerald-600/70 dark:text-emerald-400/60'
                                : 'text-slate-500 dark:text-slate-500'
                    }`}>
                        {getRemainingText()}
                    </Text>
                </View>

                <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
                    <InfoRow label="Kaynak" value={getSourceText()} />
                    <InfoRow label="Durum" value={getRenewalText()} />
                    {subscriptionStatus.expiresAt && (
                        <InfoRow label={subscriptionStatus.willRenew ? 'Yenileme' : 'Bitiş'} value={formatDate(subscriptionStatus.expiresAt)} />
                    )}
                    {subscriptionStatus.latestPurchaseDate && (
                        <InfoRow label="Son işlem" value={formatDate(subscriptionStatus.latestPurchaseDate)} isLast />
                    )}
                    {!subscriptionStatus.latestPurchaseDate && (
                        <InfoRow label="Son işlem" value="-" isLast />
                    )}
                </View>

                {!isPremium && (
                    <TouchableOpacity
                        onPress={async () => {
                            const success = await purchaseService.presentPaywall();
                            if (success) {
                                await checkSubscriptionStatus();
                            }
                        }}
                        activeOpacity={0.8}
                        className="bg-amber-100 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 items-center mb-4 flex-row justify-center"
                    >
                        <Crown size={18} color="#d97706" className="mr-2" />
                        <Text className="text-amber-700 dark:text-amber-500 font-bold">Premium'a Yükselt</Text>
                    </TouchableOpacity>
                )}

                {subscriptionStatus.managementUrl && (
                    <TouchableOpacity
                        onPress={handleManageSubscription}
                        activeOpacity={0.8}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 items-center mb-4 shadow-sm flex-row justify-center"
                    >
                        <ExternalLink size={17} color="#2563eb" className="mr-2" />
                        <Text className="text-blue-600 dark:text-blue-400 font-bold">Aboneliği Yönet</Text>
                    </TouchableOpacity>
                )}

                <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 ml-1">PROMOSYON KODU</Text>
                    <View className="flex-row gap-x-2">
                        <TextInput
                            className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 h-12 rounded-xl text-slate-900 dark:text-white font-medium border border-slate-100 dark:border-slate-700"
                            placeholder="Kodunuzu girin"
                            placeholderTextColor="#94a3b8"
                            value={promoCode}
                            onChangeText={setPromoCode}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            onPress={handleRedeemCode}
                            disabled={isRedeeming || !promoCode.trim()}
                            activeOpacity={0.8}
                            style={{ backgroundColor: promoCode.trim() ? '#007AFF' : '#cbd5e1' }}
                            className="px-8 h-12 rounded-xl items-center justify-center shadow-sm"
                        >
                            {isRedeeming ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={{ color: promoCode.trim() ? '#FFFFFF' : '#64748b' }} className="font-bold">Uygula</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleRestore}
                    disabled={isCheckingSubscription}
                    activeOpacity={0.8}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 items-center mb-4 shadow-sm flex-row justify-center"
                >
                    {isCheckingSubscription ? (
                        <ActivityIndicator color="#2563eb" size="small" />
                    ) : (
                        <RefreshCw size={17} color="#2563eb" className="mr-2" />
                    )}
                    <Text className="text-blue-600 dark:text-blue-400 font-bold ml-2">Satın Almaları Geri Yükle</Text>
                </TouchableOpacity>

                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center px-4 leading-5 mt-4">
                    Aylık abonelik iptal edilirse erişim ücretli dönem sonuna kadar devam eder. Süre dolduğunda premium otomatik kapanır.
                </Text>
            </View>
        </ScreenLayout>
    );
}

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
    return (
        <View className={`flex-row items-center justify-between py-3 ${isLast ? '' : 'border-b border-slate-100 dark:border-slate-800'}`}>
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</Text>
            <Text className="text-slate-900 dark:text-white text-sm font-semibold text-right flex-1 ml-4">{value}</Text>
        </View>
    );
}
