import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { ChevronDown, HelpCircle } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';

export default function SupportScreen() {
    const faqs = [
        { q: "Sınavda kaç soru çıkıyor?", a: "Sınavda toplam 50 soru sorulmaktadır." },
        { q: "Uygulama internetsiz çalışır mı?", a: "Soru veritabanını güncellemek için internet gerekir." },
        { q: "Pro üyelik tüm cihazlarda geçerli mi?", a: "Evet, hesabınızla giriş yaptığınız her yerde geçerlidir." },
    ];

    return (
        <ScreenLayout className="bg-[#F8FAFC]">
            <Stack.Screen options={{ title: 'Yardım Merkezi' }} />

            <ScrollView className="p-6">
                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <HelpCircle size={32} color="#2563eb" />
                    </View>
                    <Text className="text-xl font-bold text-slate-900 text-center">Nasıl yardımcı olabiliriz?</Text>
                </View>

                <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sıkça Sorulanlar</Text>

                <View className="gap-4">
                    {faqs.map((item, index) => (
                        <View key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <Text className="font-bold text-slate-900 mb-2">{item.q}</Text>
                            <Text className="text-slate-500 text-sm leading-5">{item.a}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}