import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CreditCard, CheckCircle2, Crown, AlertTriangle } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';

export default function SubscriptionsScreen() {
    const { isPro, setPro, restorePurchases } = useSubscriptionStore();
    const router = useRouter();

    const handleRestore = async () => {
        const success = await restorePurchases();
        if (success) {
            alert('Satın almalar başarıyla geri yüklendi.');
        }
    };

    return (
        <ScreenLayout className="bg-[#F2F2F7]">
            <Stack.Screen options={{ title: 'Aboneliklerim', headerBackTitle: 'Geri' }} />

            <View className="p-6">
                {/* Aktif Plan Kartı */}
                <View className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">MEVCUT PLAN</Text>
                            <Text className="text-2xl font-bold text-slate-900">
                                {isPro ? 'Pro Plan' : 'Ücretsiz Plan'}
                            </Text>
                        </View>
                        <View className={`p-2 rounded-full ${isPro ? 'bg-amber-100' : 'bg-slate-100'}`}>
                            {isPro ? <Crown size={24} color="#d97706" /> : <CreditCard size={24} color="#64748b" />}
                        </View>
                    </View>
                    <View className="h-[1px] bg-slate-100 my-4" />
                    <View className="flex-row items-center">
                        <CheckCircle2 size={16} color="#10b981" className="mr-2" />
                        <Text className="text-slate-600 text-sm font-medium">
                            {isPro ? 'Tüm özellikler (Sınırsız Soru, Yapay Zeka)' : 'Temel özellikler aktif'}
                        </Text>
                    </View>
                </View>

                {isPro ? (
                    <TouchableOpacity
                        onPress={() => {
                            setPro(false);
                            alert('Abonelik mock test için iptal edildi.');
                        }}
                        className="bg-red-50 p-4 rounded-xl border border-red-200 items-center mb-4 flex-row justify-center"
                    >
                        <AlertTriangle size={18} color="#dc2626" className="mr-2" />
                        <Text className="text-red-600 font-bold">Aboneliği İptal Et (Mock Test)</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => router.push('/premium')}
                        className="bg-amber-100 p-4 rounded-xl border border-amber-200 items-center mb-4 flex-row justify-center"
                    >
                        <Crown size={18} color="#d97706" className="mr-2" />
                        <Text className="text-amber-700 font-bold">Pro'ya Yükselt</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleRestore} className="bg-white p-4 rounded-xl border border-slate-200 items-center mb-4">
                    <Text className="text-blue-600 font-bold">Satın Almaları Geri Yükle</Text>
                </TouchableOpacity>

                <Text className="text-slate-400 text-xs text-center px-4 leading-5">
                    Aboneliklerinizi Apple ID ayarlarınızdan veya Google Play Store üzerinden yönetebilirsiniz.
                </Text>
            </View>
        </ScreenLayout>
    );
}