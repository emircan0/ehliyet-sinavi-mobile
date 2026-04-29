import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, HelpCircle } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useThemeMode } from '../src/hooks/useThemeMode';

export default function SupportScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();
    
    const faqs = [
        { q: "Sınavda kaç soru çıkıyor?", a: "Sınavda toplam 50 soru sorulmaktadır." },
        { q: "Uygulama internetsiz çalışır mı?", a: "Soru veritabanını güncellemek için internet gerekir." },
        { q: "Premium üyelik tüm cihazlarda geçerli mi?", a: "Evet, hesabınızla giriş yaptığınız her yerde geçerlidir." },
    ];

    return (
        <ScreenLayout className="bg-base">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="p-2 -ml-2"
                >
                    <ChevronLeft size={24} color={isDarkMode ? "#cbd5e1" : "#334155"} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">Yardım Merkezi</Text>
            </View>

            <ScrollView className="p-6">
                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                        <HelpCircle size={32} color="#2563eb" />
                    </View>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white text-center">Nasıl yardımcı olabiliriz?</Text>
                </View>

                <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Sıkça Sorulanlar</Text>

                <View className="gap-4">
                    {faqs.map((item, index) => (
                        <View key={index} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <Text className="font-bold text-slate-900 dark:text-white mb-2">{item.q}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">{item.a}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}