import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { ScreenLayout } from '../src/components/ScreenLayout';

export default function PrivacyScreen() {
    return (
        <ScreenLayout className="bg-white dark:bg-slate-950">
            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Gizlilik Politikası</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mb-6">Son Güncelleme: 14 Şubat 2026</Text>

                <Text className="font-bold text-slate-900 dark:text-white mb-2 text-lg">1. Veri Toplama</Text>
                <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-6">
                    Ehliyet Hocam olarak, kullanıcı deneyimini iyileştirmek amacıyla sınav sonuçlarınız, çalışma süreleriniz ve uygulama içi tercihleriniz gibi anonim verileri topluyoruz.
                </Text>

                <Text className="font-bold text-slate-900 dark:text-white mb-2 text-lg">2. Kullanım Amacı</Text>
                <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-6">
                    Toplanan veriler sadece size özel çalışma programı oluşturmak ve "AI Hoca" özelliğini kişiselleştirmek için kullanılır.
                </Text>

                <Text className="font-bold text-slate-900 dark:text-white mb-2 text-lg">3. Üçüncü Taraflar</Text>
                <Text className="text-slate-600 dark:text-slate-400 leading-6 mb-6">
                    Kişisel verileriniz (e-posta vb.) asla üçüncü taraf reklam şirketleri ile paylaşılmaz.
                </Text>
            </ScrollView>
        </ScreenLayout>
    );
}