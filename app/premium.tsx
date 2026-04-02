import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Check, Crown, X, Star, Zap, ShieldCheck, Timer } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
    const router = useRouter();
    const setPro = useSubscriptionStore(state => state.setPro);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const initTimer = async () => {
            const startTimeStr = await AsyncStorage.getItem('promo_start_time');
            if (!startTimeStr) return;

            const startTime = parseInt(startTimeStr);
            const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

            const updateTimer = () => {
                const now = Date.now();
                const diff = startTime + SIX_HOURS_MS - now;

                if (diff <= 0) {
                    setTimeLeft(null);
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft({ hours, minutes, seconds });
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        };
        initTimer();
    }, []);

    const handlePurchase = () => {
        const duration = selectedPlan === 'monthly' ? 30 : 365;
        // Not: Gerçek App Store yayını öncesi bura RevenueCat veya expo-in-app-purchases ile değiştirilmelidir.
        setPro(true, duration);
        const planName = selectedPlan === 'monthly' ? 'Aylık' : 'Yıllık';
        alert(`Tebrikler! ${planName} Pro üyeliğiniz aktif edildi.`);
        router.replace('/(tabs)');
    };

    const features = [
        { title: "Sınırsız Soru Çözümü", desc: "Sınır yok, binlerce soru.", icon: Zap, color: "#3b82f6" },
        { title: "Reklamsız Deneyim", desc: "Kesintisiz çalışma keyfi.", icon: ShieldCheck, color: "#10b981" },
        { title: "Detaylı Analiz", desc: "Zayıf yanlarını keşfet.", icon: Star, color: "#f59e0b" },
        { title: "Çıkmış Sorular", desc: "Resmi sınav soruları.", icon: Crown, color: "#8b5cf6" },
    ];

    return (
        <ScreenLayout className="bg-slate-950">
            <LinearGradient
                colors={['#1e293b', '#020617']}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="px-6 pt-14 pb-8 flex-row justify-between items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                        >
                            <X size={20} color="white" />
                        </TouchableOpacity>
                        <View className="bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
                            <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Premium Üyelik</Text>
                        </View>
                        <View className="w-10" />
                    </View>

                    {/* Hero */}
                    <View className="items-center px-8 mb-10">
                        <View className="relative">
                            <View className="absolute -inset-4 bg-amber-400/20 blur-3xl rounded-full" />
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                className="w-24 h-24 rounded-[32px] items-center justify-center shadow-2xl shadow-amber-500/50 rotate-3"
                            >
                                <Crown size={48} color="#78350f" fill="#78350f" />
                            </LinearGradient>
                        </View>
                        
                        <Text className="text-white text-4xl font-black text-center tracking-tighter mt-10 mb-3">
                            İlk Seferde Geçin
                        </Text>
                        <Text className="text-slate-400 text-center text-sm px-6 leading-6 font-medium">
                            Yapay zeka destekli çalışma planıyla sınav stresini geride bırakın.
                        </Text>
                    </View>

                    {/* Features Grid */}
                    <View className="px-6 mb-10 flex-row flex-wrap justify-between gap-y-3">
                        {features.map((item, index) => (
                            <View key={index} className="w-[48%] bg-white/5 p-4 rounded-[24px] border border-white/5">
                                <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center mb-3">
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text className="text-white font-black text-xs mb-1">{item.title}</Text>
                                <Text className="text-slate-500 text-[9px] font-bold leading-3">{item.desc}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Pricing Selection */}
                    <View className="px-6 gap-y-4">
                        {/* Monthly Plan */}
                        <TouchableOpacity
                            onPress={() => setSelectedPlan('monthly')}
                            activeOpacity={0.8}
                            className={`rounded-[28px] p-5 border-2 ${selectedPlan === 'monthly' ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/10'}`}
                        >
                            <View className="flex-row justify-between items-center mb-2">
                                <View className="flex-row items-center">
                                    <Text className="text-white font-black text-lg mr-2">Aylık Plan</Text>
                                    {timeLeft && (
                                        <View className="bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                                            <Text className="text-red-400 text-[10px] font-black uppercase">İndirimli</Text>
                                        </View>
                                    )}
                                </View>
                                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedPlan === 'monthly' ? 'border-amber-500 bg-amber-500' : 'border-white/20'}`}>
                                    {selectedPlan === 'monthly' && <Check size={14} color="#78350f" />}
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-slate-400 text-lg font-bold line-through mr-3">₺199,99</Text>
                                <Text className="text-white text-3xl font-black">₺98,99</Text>
                                <Text className="text-slate-500 text-sm font-bold ml-1">/ ay</Text>
                            </View>
                            {timeLeft && (
                                <View className="flex-row items-center mt-2">
                                    <Timer size={12} color="#f87171" className="mr-1" />
                                    <Text className="text-red-400 text-[10px] font-black tracking-widest">
                                        KALAN SÜRE: {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Yearly Plan */}
                        <TouchableOpacity
                            onPress={() => setSelectedPlan('yearly')}
                            activeOpacity={0.8}
                            className={`rounded-[28px] p-5 border-2 ${selectedPlan === 'yearly' ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/10'}`}
                        >
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-white font-black text-lg">Yıllık Plan</Text>
                                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedPlan === 'yearly' ? 'border-amber-500 bg-amber-500' : 'border-white/20'}`}>
                                    {selectedPlan === 'yearly' && <Check size={14} color="#78350f" />}
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-white text-3xl font-black">₺999,00</Text>
                                <Text className="text-slate-500 text-sm font-bold ml-1">/ yıl</Text>
                            </View>
                            <Text className="text-amber-500 text-[10px] font-black uppercase mt-1">Tek Seferlik Ödeme</Text>
                        </TouchableOpacity>

                        {/* Purchase Button */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handlePurchase}
                            className="mt-4 overflow-hidden rounded-[24px]"
                        >
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-5 items-center shadow-2xl shadow-amber-500/50"
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-amber-950 font-black text-lg mr-2">Hemen Başla</Text>
                                    <Zap size={18} color="#78350f" fill="#78350f" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <Text className="text-slate-500 text-[10px] text-center mt-2 font-medium">
                            İstediğiniz zaman uygulama ayarlarından iptal edebilirsiniz.
                        </Text>
                    </View>

                    <View className="mt-12 px-10 items-center">
                        <Text className="text-slate-600 text-[10px] text-center font-medium leading-relaxed mb-2">
                            * Satın alma işlemi sonrası mağaza hesabınızdan tahsilat yapılır.
                        </Text>
                        <View className="flex-row justify-center items-center flex-wrap gap-x-1">
                            <TouchableOpacity onPress={() => router.push('/privacy')}>
                                <Text className="text-slate-500 text-[10px] font-bold underline">Gizlilik Politikası</Text>
                            </TouchableOpacity>
                            <Text className="text-slate-600 text-[10px]">ve</Text>
                            <TouchableOpacity onPress={() => router.push('/terms')}>
                                <Text className="text-slate-500 text-[10px] font-bold underline">Kullanım Koşulları</Text>
                            </TouchableOpacity>
                            <Text className="text-slate-600 text-[10px]">geçerlidir.</Text>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </ScreenLayout>
    );
}