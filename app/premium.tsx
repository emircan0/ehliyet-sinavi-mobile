import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Crown, X, Star, Zap, ShieldCheck, Timer, Sparkles } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
    const router = useRouter();
    const setPro = useSubscriptionStore(state => state.setPro);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);

    const scaleAnim = new Animated.Value(1);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();

        const initTimer = async () => {
            const startTimeStr = await AsyncStorage.getItem('promo_start_time');
            let startTime = startTimeStr ? parseInt(startTimeStr) : Date.now();

            if (!startTimeStr) {
                await AsyncStorage.setItem('promo_start_time', startTime.toString());
            }

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const duration = selectedPlan === 'monthly' ? 30 : 365;
        setPro(true, duration);
        router.replace('/(tabs)');
    };

    const features = [
        { title: "Yapay Zeka Hoca", desc: "Sınırsız soru çözümü.", icon: Zap, color: "#fbbf24" },
        { title: "Sıfır Reklam", desc: "Zaman kaybetmeyin.", icon: ShieldCheck, color: "#34d399" },
        { title: "Çıkmış Sorular", desc: "MEB birebir arşivi.", icon: Crown, color: "#60a5fa" },
        { title: "Hata Telafisi", desc: "Eksiklerinizi kapatın.", icon: Star, color: "#a78bfa" },
    ];

    const plans = {
        monthly: { price: "99", decimals: ",90", oldPrice: "₺149", text: "Aylık" },
        yearly: { price: "399", decimals: ",90", oldPrice: "₺1200", text: "Yıllık (Aylık ₺33'e gelir)" }
    };

    return (
        <ScreenLayout className="bg-[#020617]">
            <LinearGradient colors={['#0f172a', '#020617']} className="flex-1 relative">

                <ScrollView contentContainerStyle={{ paddingBottom: 250 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="px-6 pt-12 pb-2 flex-row justify-between items-center z-10">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                        >
                            <X size={20} color="#94a3b8" />
                        </TouchableOpacity>
                        {timeLeft && (
                            <View className="bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 flex-row items-center">
                                <Timer size={12} color="#f43f5e" className="mr-1.5" />
                                <Text className="text-rose-400 text-[10px] font-black uppercase tracking-widest">
                                    {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Kahraman Bölümü (Hero) */}
                    <View className="items-center px-6 mt-2 mb-6">
                        <View className="relative mb-5">
                            <View className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full scale-150" />
                            <View className="w-20 h-20 bg-amber-400/10 rounded-full items-center justify-center border border-amber-400/20">
                                <Crown size={36} color="#fbbf24" fill="#fbbf24" />
                            </View>
                            <View className="absolute -right-2 -top-2 bg-white px-2 py-1 rounded-md transform rotate-12">
                                <Text className="text-slate-900 text-[9px] font-black tracking-widest">PRO</Text>
                            </View>
                        </View>

                        <Text className="text-white text-3xl font-black text-center tracking-tight mb-2">
                            İlk Seferde <Text className="text-amber-400">Garantili</Text> Geç.
                        </Text>
                        <Text className="text-slate-400 text-center text-[13px] px-2 leading-5">
                            Sınavda çıkacak soruları önceden çöz, stresi sıfırla. Bugüne özel fiyattan faydalan.
                        </Text>
                    </View>

                    {/* Plan Seçimi */}
                    <View className="px-6 gap-y-4 mb-8">
                        {/* Yıllık (EN ÇOK TERCİH EDİLEN) */}
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedPlan('yearly');
                            }}
                            activeOpacity={0.9}
                            className={`relative rounded-[28px] p-5 pt-6 border-2 transition-all ${selectedPlan === 'yearly' ? 'bg-amber-400/10 border-amber-400' : 'bg-white/5 border-white/5'}`}
                        >
                            <View className="absolute -top-3 left-0 right-0 items-center z-10">
                                <View className="bg-amber-400 px-3 py-1 rounded-full shadow-md shadow-amber-400/40">
                                    <Text className="text-amber-950 text-[10px] font-black uppercase tracking-widest">En Popüler</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-1">
                                <Text className={`font-black text-lg ${selectedPlan === 'yearly' ? 'text-amber-400' : 'text-white'}`}>Yıllık Erişim</Text>
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedPlan === 'yearly' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                                    {selectedPlan === 'yearly' && <Check size={12} color="#78350f" strokeWidth={3} />}
                                </View>
                            </View>

                            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">%70 TASARRUF EDİN</Text>

                            <View className="flex-row items-end flex-wrap">
                                <Text className="text-slate-500 text-base font-bold line-through mr-2 mb-1">{plans.yearly.oldPrice}</Text>
                                <Text className="text-white text-3xl font-black">₺{plans.yearly.price}</Text>
                                <Text className="text-slate-400 text-lg font-bold mb-1">{plans.yearly.decimals}</Text>
                            </View>
                            <Text className="text-slate-400 text-[11px] font-medium mt-1">{plans.yearly.text}</Text>
                        </TouchableOpacity>

                        {/* Aylık Plan */}
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedPlan('monthly');
                            }}
                            activeOpacity={0.9}
                            className={`rounded-[24px] p-4 border-2 transition-all ${selectedPlan === 'monthly' ? 'bg-amber-400/10 border-amber-400' : 'bg-white/5 border-white/5'}`}
                        >
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className={`font-black text-base ${selectedPlan === 'monthly' ? 'text-amber-400' : 'text-white'}`}>Aylık Erişim</Text>
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedPlan === 'monthly' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                                    {selectedPlan === 'monthly' && <Check size={12} color="#78350f" strokeWidth={3} />}
                                </View>
                            </View>
                            <View className="flex-row items-end">
                                <Text className="text-white text-2xl font-black">₺{plans.monthly.price}</Text>
                                <Text className="text-slate-400 text-sm font-bold mb-0.5">{plans.monthly.decimals}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Özellikler Izgarası */}
                    <View className="px-6 flex-row flex-wrap justify-between gap-y-3">
                        {features.map((item, index) => (
                            <View key={index} className="w-[48%] bg-white/5 p-3 rounded-[20px] border border-white/5 flex-row items-center">
                                <View className="w-8 h-8 rounded-xl bg-white/5 items-center justify-center mr-2">
                                    <item.icon size={16} color={item.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-black text-[10px] mb-0.5">{item.title}</Text>
                                    <Text className="text-slate-400 text-[8px] font-medium leading-[11px]">{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>

                {/* SABİT ALT BUTON - EN ÖNE ALINDI */}
                <View
                    className="absolute bottom-0 w-full pt-4 pb-8 px-6 bg-[#020617] border-t border-slate-800 z-50"
                    style={Platform.OS === 'android' ? { elevation: 20 } : { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 15 }}
                >

                    {/* Uyarı yazısı */}
                    <Text className="text-slate-500 text-[10px] text-center mb-3 font-medium px-4">
                        Ödeme onayından sonra App Store hesabınızdan tahsil edilecektir. İptal edilmediği sürece yenilenir.
                    </Text>

                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handlePurchase}
                            className="w-full h-[60px] rounded-[20px] overflow-hidden shadow-2xl shadow-amber-400/20"
                        >
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="w-full h-full flex-row items-center justify-center relative"
                            >
                                <View className="absolute left-6">
                                    <Sparkles size={22} color="#78350f" fill="#78350f" />
                                </View>

                                <Text className="text-amber-950 font-black text-[17px] uppercase tracking-wider text-center">
                                    {selectedPlan === 'yearly' ? "1 Yıllık Kilidi Aç" : "Hemen Başla"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

            </LinearGradient>
        </ScreenLayout>
    );
}