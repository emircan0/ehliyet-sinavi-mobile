import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car, Bike, Truck, Calendar, Clock, Bell, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { scheduleDailyReminder } from '../src/api/notifications';


const { width } = Dimensions.get('window');

// Sorular ve Seçenekler
const ONBOARDING_STEPS = [
    {
        id: 'license_type',
        title: 'Hangi ehliyet sınıfı için hazırlanıyorsun?',
        subtitle: 'Sana uygun soruları seçebilmemiz için önemli.',
        options: [
            { label: 'B Sınıfı (Otomobil)', value: 'B', icon: Car },
            { label: 'A Sınıfı (Motosiklet)', value: 'A', icon: Bike },
            { label: 'C/D Sınıfı (Ağır Vasıta)', value: 'C', icon: Truck },
        ]
    },
    {
        id: 'exam_date',
        title: 'Sınav tarihin belli mi?',
        subtitle: 'Çalışma programının yoğunluğunu ayarlayacağız.',
        options: [
            { label: '1 Ay İçinde (Yoğun Program)', value: 'urgent', icon: Calendar },
            { label: '2-3 Ay Sonra (Normal Program)', value: 'normal', icon: Calendar },
            { label: 'Henüz Belli Değil (Rahat Program)', value: 'relaxed', icon: Calendar },
        ]
    },
    {
        id: 'daily_goal',
        title: 'Günde ne kadar vakit ayırabilirsin?',
        subtitle: 'İstikrarlı olmak, çok çalışmaktan daha önemlidir.',
        options: [
            { label: 'Günde 10 Dakika (Hızlı Tekrar)', value: '10', icon: Clock },
            { label: 'Günde 20 Dakika (Önerilen)', value: '20', icon: Clock },
            { label: 'Günde 45+ Dakika (Garantili)', value: '45', icon: Clock },
        ]
    },
    {
        id: 'notification_time',
        title: 'Sana ne zaman hatırlatalım?',
        subtitle: 'Seçtiğin saatte sana çalışma bildirimi göndereceğiz.',
        options: [
            { label: 'Sabah (09:00)', value: '09:00', icon: Bell },
            { label: 'Öğle Arası (12:30)', value: '12:30', icon: Bell },
            { label: 'Akşam (20:00)', value: '20:00', icon: Bell },
        ]
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const [currentStep, setCurrentStep] = useState(0);
    const [preferences, setPreferences] = useState<Record<string, string>>({});

    const handleSelect = (value: string) => {
        const stepId = ONBOARDING_STEPS[currentStep].id;
        setPreferences(prev => ({ ...prev, [stepId]: value }));
    };

    const handleNext = async () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // SON ADIM: Verileri kaydet ve Bildirimi ayarla
            await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
            await AsyncStorage.setItem('has_completed_onboarding', 'true');

            // Bildirim saatini ayarla
            const timeParts = preferences['notification_time'].split(':');
            await scheduleDailyReminder(parseInt(timeParts[0]), parseInt(timeParts[1]));

            // Ana sayfaya yönlendir
            router.replace('/(tabs)/');
        }
    };

    const stepData = ONBOARDING_STEPS[currentStep];
    const isOptionSelected = !!preferences[stepData.id];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            {/* Üst İlerleme Çubuğu (Progress Bar) */}
            <View className="px-6 pt-8 pb-4">
                <View className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex-row">
                    <View
                        className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-sm shadow-blue-500/50"
                        style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                    />
                </View>
                <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold text-center mt-3 uppercase tracking-widest">
                    Adım {currentStep + 1} / {ONBOARDING_STEPS.length}
                </Text>
            </View>

            {/* Soru İçeriği */}
            <View className="flex-1 px-6 pt-6">
                <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {stepData.title}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-base mb-10 leading-6">
                    {stepData.subtitle}
                </Text>

                {/* Seçenekler */}
                <View className="gap-4">
                    {stepData.options.map((option, index) => {
                        const Icon = option.icon;
                        const isSelected = preferences[stepData.id] === option.value;

                        return (
                            <Pressable
                                key={index}
                                onPress={() => handleSelect(option.value)}
                                className={`flex-row items-center p-5 rounded-2xl border-2 transition-colors ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                            >
                                <View className={`p-3 rounded-xl mr-4 ${isSelected ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                    <Icon size={24} color={isSelected ? 'white' : (colorScheme === 'dark' ? '#94a3b8' : '#64748b')} />
                                </View>
                                <Text className={`flex-1 font-bold text-base ${isSelected ? 'text-blue-900 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {option.label}
                                </Text>
                                {isSelected && <CheckCircle2 size={24} color="#2563eb" />}
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* İleri Butonu */}
            <View className="p-6 pb-10 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950">
                <Pressable
                    disabled={!isOptionSelected}
                    onPress={handleNext}
                    style={{ height: 64, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isOptionSelected ? '#2563eb' : (colorScheme === 'dark' ? '#1e293b' : '#f1f5f9') }}
                >
                    <Text className={`font-bold text-lg mr-2 ${isOptionSelected ? 'text-white' : 'text-slate-400'}`}>
                        {currentStep === ONBOARDING_STEPS.length - 1 ? 'Programımı Oluştur' : 'Devam Et'}
                    </Text>
                    <ChevronRight size={24} color={isOptionSelected ? 'white' : '#94a3b8'} />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}