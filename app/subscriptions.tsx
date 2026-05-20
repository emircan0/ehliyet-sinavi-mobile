import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CreditCard, CheckCircle2, Crown, AlertTriangle } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { purchaseService } from '../src/services/purchaseService';
import { supabase } from '../src/api/supabase';
import { TextInput, ActivityIndicator, Alert } from 'react-native';

export default function SubscriptionsScreen() {
    const { isPremium, setPremium, restorePurchases, premiumExpiryDate, checkSubscriptionStatus } = useSubscriptionStore();
    const router = useRouter();

    const getRemainingText = () => {
        if (!isPremium) return null;
        if (!premiumExpiryDate) return 'Ömür Boyu Sınırsız Erişim';

        const expiry = new Date(premiumExpiryDate);
        
        // Eğer yıl 2090'dan büyükse bu bir 'Ömür Boyu' kodudur
        if (expiry.getFullYear() > 2090) return 'Ömür Boyu Sınırsız Erişim';

        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'Süresi Doldu';
        return `${diffDays} gün kaldı`;
    };

    const [promoCode, setPromoCode] = React.useState('');
    const [isRedeeming, setIsRedeeming] = React.useState(false);

    const handleRestore = async () => {
        try {
            const success = await restorePurchases();
            if (success) {
                alert('Satın almalar başarıyla geri yüklendi.');
            } else {
                alert('Geri yüklenecek aktif bir abonelik bulunamadı.');
            }
        } catch (error) {
            alert('Geri yüklenecek aktif bir abonelik bulunamadı.');
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
                setPremium(true);
                setPromoCode('');
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

    return (
        <ScreenLayout className="bg-[#F2F2F7] dark:bg-slate-950">
            <View className="p-6">
                {/* Aktif Plan Kartı */}
                <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">MEVCUT PLAN</Text>
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isPremium ? 'Premium Plan' : 'Ücretsiz Plan'}
                            </Text>
                        </View>
                        <View className={`p-2.5 rounded-2xl ${isPremium ? 'bg-amber-100 dark:bg-amber-900/20 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            {isPremium ? <Crown size={24} color="#d97706" /> : <CreditCard size={24} color={isPremium ? "#d97706" : "#64748b"} />}
                        </View>
                    </View>
                    <View className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4" />
                    <View className="flex-row items-center">
                        <CheckCircle2 size={16} color="#10b981" className="mr-2" />
                        <Text className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                            {isPremium ? 'Tüm özellikler (Sınırsız Soru, Yapay Zeka)' : 'Temel özellikler aktif'}
                        </Text>
                    </View>
                </View>

                {isPremium ? (
                    <View
                        className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 items-center mb-4 shadow-sm"
                    >
                        <View className="flex-row items-center mb-1">
                            <CheckCircle2 size={18} color="#10b981" className="mr-2" />
                            <Text className="text-emerald-600 dark:text-emerald-400 font-bold">Abonelik Aktif</Text>
                        </View>
                        <Text className="text-emerald-600/70 dark:text-emerald-400/60 text-xs font-medium">
                            {getRemainingText()}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={async () => {
                            const success = await purchaseService.presentPaywall();
                            if (success) {
                                await checkSubscriptionStatus();
                            }
                        }}
                        className="bg-amber-100 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 items-center mb-4 flex-row justify-center"
                    >
                        <Crown size={18} color="#d97706" className="mr-2" />
                        <Text className="text-amber-700 dark:text-amber-500 font-bold">Premium'a Yükselt</Text>
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

                <TouchableOpacity onPress={handleRestore} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 items-center mb-4 shadow-sm">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold">Satın Almaları Geri Yükle</Text>
                </TouchableOpacity>

                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center px-4 leading-5 mt-4">
                    Aboneliklerinizi Apple ID ayarlarınızdan veya Google Play Store üzerinden yönetebilirsiniz.
                </Text>
            </View>
        </ScreenLayout>
    );
}