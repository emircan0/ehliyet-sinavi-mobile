import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Crown, X, Star, Zap, ShieldCheck, Timer, Sparkles } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { purchaseService } from '../src/services/purchaseService';
import { Alert, ActivityIndicator } from 'react-native';
import Purchases from 'react-native-purchases';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
    const router = useRouter();
    const setPremium = useSubscriptionStore(state => state.setPremium);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('lifetime');
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [plans, setPlans] = useState({
        monthly: { price: "99", decimals: ",00", text: "Aylık Erişim", identifier: "" },
        lifetime: { price: "199", decimals: ",00", text: "Ömür Boyu Sınırsız Erişim", identifier: "" }
    });

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current && offerings.current.availablePackages.length > 0) {
                    const availablePackages = offerings.current.availablePackages;

                    const newPlans = { ...plans };

                    // Map Monthly
                    const monthlyPkg = availablePackages.find(p => p.packageType === Purchases.PACKAGE_TYPE.MONTHLY);
                    if (monthlyPkg) {
                        newPlans.monthly.price = monthlyPkg.product.priceString;
                    }

                    // Map Lifetime
                    const lifetimePkg = availablePackages.find(p => p.packageType === Purchases.PACKAGE_TYPE.LIFETIME);
                    if (lifetimePkg) {
                        newPlans.lifetime.price = lifetimePkg.product.priceString;
                    }

                    setPlans(newPlans);
                }
            } catch (e) {
                console.error("Error fetching offerings:", e);
            }
        };
        fetchPackages();
    }, []);

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

    const handlePurchase = async () => {
        try {
            setIsPurchasing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Present RevenueCat UI Paywall if entitlement is not active
            const success = await purchaseService.presentPaywallIfNeeded();

            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)');
            }
        } catch (error) {
            Alert.alert("Hata", "Satın alma işlemi sırasında bir hata oluştu.");
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        try {
            setIsPurchasing(true);
            const status = await purchaseService.restorePurchases();
            if (status) {
                Alert.alert("Başarılı", "Satın alımlarınız başarıyla geri yüklendi!");
                router.replace('/(tabs)');
            } else {
                // Hata değil, sadece bilgi veriyoruz
                Alert.alert("Bilgi", "Bu hesapla ilişkili aktif bir Premium paket bulunamadı.");
            }
        } catch (error) {
            console.log("Restore error (ignored):", error);
            // Kritik bir hata olmadıkça kullanıcıya yansıtmıyoruz
            Alert.alert("Bilgi", "Geri yüklenecek aktif bir abonelik bulunamadı.");
        } finally {
            setIsPurchasing(false);
        }
    };

    const features = [
        { title: "Yapay Zeka Hoca", desc: "Sınırsız soru çözümü.", icon: Zap, color: "#fbbf24" },
        { title: "Sıfır Reklam", desc: "Zaman kaybetmeyin.", icon: ShieldCheck, color: "#34d399" },
        { title: "Çıkmış Sorular", desc: "MEB birebir arşivi.", icon: Crown, color: "#60a5fa" },
        { title: "Hata Telafisi", desc: "Eksiklerinizi kapatın.", icon: Star, color: "#a78bfa" },
    ];

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
                            Sınava <Text className="text-amber-400">Eksiksiz</Text> Hazırlan.
                        </Text>
                        <Text className="text-slate-400 text-center text-[13px] px-2 leading-5">
                            Sınavda çıkacak soruları önceden çöz, stresi sıfırla. Bugüne özel fiyattan faydalan.
                        </Text>
                    </View>

                    {/* Plan Seçimi */}
                    <View className="px-6 gap-y-4 mb-8">
                        {/* Ömür Boyu (LIFETIME) */}
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedPlan('lifetime');
                            }}
                            activeOpacity={0.9}
                            className={`relative rounded-[28px] p-5 pt-6 border-2 transition-all ${selectedPlan === 'lifetime' ? 'bg-amber-400/10 border-amber-400' : 'bg-white/5 border-white/5'}`}
                        >
                            {/* Badge removed per user request */}

                            <View className="flex-row justify-between items-center mb-1">
                                <Text className={`font-black text-lg ${selectedPlan === 'lifetime' ? 'text-amber-400' : 'text-white'}`}>Ömür Boyu</Text>
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedPlan === 'lifetime' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                                    {selectedPlan === 'lifetime' && <Check size={12} color="#78350f" strokeWidth={3} />}
                                </View>
                            </View>

                            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">BİR KERELİK ÖDEME</Text>

                            <View className="flex-row items-end flex-wrap">
                                {/* oldPrice removed */}
                                <Text className="text-white text-3xl font-black">{plans.lifetime.price}</Text>
                            </View>
                            <Text className="text-slate-400 text-[11px] font-medium mt-1">{plans.lifetime.text}</Text>
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
                                <Text className="text-white text-2xl font-black">{plans.monthly.price}</Text>
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

                {/* SABİT ALT BUTON VE APPLE UYARI METİNLERİ */}
                <View
                    className="absolute bottom-0 w-full pt-4 pb-6 px-6 bg-[#020617] border-t border-slate-800 z-50"
                    style={Platform.OS === 'android' ? { elevation: 20 } : { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 15 }}
                >

                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mb-4">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handlePurchase}
                            disabled={isPurchasing}
                            className={`w-full h-[60px] rounded-[20px] overflow-hidden shadow-2xl shadow-amber-400/20 ${isPurchasing ? 'opacity-70' : ''}`}
                        >
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="w-full h-full flex-row items-center justify-center relative"
                            >
                                {isPurchasing ? (
                                    <ActivityIndicator color="#78350f" />
                                ) : (
                                    <>
                                        <View className="absolute left-6">
                                            <Sparkles size={22} color="#78350f" fill="#78350f" />
                                        </View>

                                        <Text className="text-amber-950 font-black text-[17px] uppercase tracking-wider text-center">
                                            {selectedPlan === 'lifetime' ? "Ömür Boyu Kilidi Aç" : "Hemen Başla"}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* APPLE ZORUNLU LİNKLER: Satın Almaları Geri Yükle, EULA, Gizlilik */}
                    <View className="flex-row justify-center items-center mb-3">
                        <TouchableOpacity onPress={handleRestore}>
                            <Text className="text-white text-[12px] font-bold mx-2">Satın Almaları Geri Yükle</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center items-center mb-3">
                        <TouchableOpacity onPress={() => router.push('/terms')}>
                            <Text className="text-slate-500 text-[11px] underline mx-2">Kullanım Koşulları</Text>
                        </TouchableOpacity>
                        <Text className="text-slate-700 text-[11px]">|</Text>
                        <TouchableOpacity onPress={() => router.push('/privacy')}>
                            <Text className="text-slate-500 text-[11px] underline mx-2">Gizlilik Politikası</Text>
                        </TouchableOpacity>
                    </View>

                    {/* APPLE ZORUNLU BİLGİLENDİRME YAZISI */}
                    <Text className="text-slate-500 text-[9px] text-center font-medium px-2">
                        {selectedPlan === 'monthly' ?
                            "Ödeme, satın alma onayında App Store hesabınızdan tahsil edilecektir. Abonelik, mevcut dönemin bitiminden en az 24 saat önce otomatik yenileme kapatılmadığı sürece aynı fiyatla otomatik olarak yenilenir. Satın alma işleminden sonra Hesap Ayarlarına giderek aboneliklerinizi yönetebilir ve iptal edebilirsiniz."
                            :
                            "Ömür boyu plan tek seferlik ödemedir. Ödeme, satın alma onayında App Store hesabınızdan tahsil edilecektir."}
                    </Text>

                </View>

            </LinearGradient>
        </ScreenLayout>
    );
}