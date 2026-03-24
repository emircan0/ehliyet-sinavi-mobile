import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Check, Crown, X } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';

export default function PremiumScreen() {
    const router = useRouter();
    const setPro = useSubscriptionStore(state => state.setPro);

    const handlePurchase = () => {
        setPro(true);
        alert('Tebrikler! Pro sürüme yükselttiniz (Mock Testing).');
        router.back();
    };

    const features = [
        "Sınırsız Soru Çözümü",
        "Reklamsız Deneyim",
        "Detaylı Performans Analizi",
        "Çıkmış Sorular Arşivi (Son 5 Yıl)",
        "Yapay Zeka Destekli Özel Hoca"
    ];

    return (
        <ScreenLayout className="bg-[#0f172a]">
            {/* Header'ı Gizle veya Özelleştir */}
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Kapat Butonu */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 right-6 z-10 bg-white/10 p-2 rounded-full"
                >
                    <X size={24} color="white" />
                </TouchableOpacity>

                {/* Hero Görseli */}
                <View className="items-center mt-20 mb-8">
                    <View className="w-24 h-24 bg-amber-400 rounded-3xl items-center justify-center shadow-lg shadow-amber-500/50 mb-6 rotate-3">
                        <Crown size={48} color="#78350f" fill="#78350f" />
                    </View>
                    <Text className="text-white text-3xl font-bold text-center tracking-tight mb-2">
                        Pro'ya Yükselt
                    </Text>
                    <Text className="text-slate-400 text-center text-sm px-10 leading-6">
                        Sınavı ilk seferde geçmek için ihtiyacın olan tüm araçlara erişim sağla.
                    </Text>
                </View>

                {/* Özellik Listesi */}
                <View className="px-8 mb-10">
                    {features.map((feature, index) => (
                        <View key={index} className="flex-row items-center mb-4">
                            <View className="w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center mr-4">
                                <Check size={14} color="#10b981" strokeWidth={3} />
                            </View>
                            <Text className="text-slate-200 font-medium text-[15px]">{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* Fiyat Kartı */}
                <View className="mx-6 bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 relative overflow-hidden">
                    <View className="absolute top-0 right-0 bg-amber-400 px-3 py-1 rounded-bl-xl">
                        <Text className="text-[10px] font-bold text-amber-900 uppercase">En Popüler</Text>
                    </View>
                    <Text className="text-slate-400 text-sm font-medium mb-1">Aylık Plan</Text>
                    <View className="flex-row items-end mb-4">
                        <Text className="text-white text-4xl font-bold">₺49.99</Text>
                        <Text className="text-slate-400 text-lg mb-1 ml-1">/ay</Text>
                    </View>
                    <Text className="text-slate-500 text-xs">İstediğin zaman iptal et.</Text>
                </View>

                {/* CTA Butonu */}
                <View className="px-6">
                    <TouchableOpacity
                        onPress={handlePurchase}
                        className="bg-amber-400 py-4 rounded-2xl items-center shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
                    >
                        <Text className="text-amber-950 font-bold text-lg">Hemen Başla</Text>
                    </TouchableOpacity>
                    <Text className="text-slate-500 text-[10px] text-center mt-4">
                        Satın alma işlemi iTunes hesabınızdan tahsil edilecektir.
                    </Text>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}