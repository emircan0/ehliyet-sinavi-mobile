import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert, TextInput } from 'react-native';
import { useRouter, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Play, Car, Heart, ShieldAlert, GraduationCap,
    Bell, ChevronRight, Sparkles, Zap,
    X, CheckCircle2, Award, Clock, Info, Timer, Crown,
    BrainCircuit, XCircle, Star, BookOpen, TrendingUp, Trophy
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { LeaderboardWidget } from '../../src/components/LeaderboardWidget';
import { fetchHomeDashboardData } from '../../src/api/queries';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useAuth } from '../../src/hooks/useAuth';
import { usePremiumAccess } from '../../src/hooks/usePremiumAccess';
import { useNotificationStore, NotificationType } from '../../src/store/useNotificationStore';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { adService } from '../../src/services/adService';
import { purchaseService } from '../../src/services/purchaseService';
import { supabase } from '../../src/api/supabase';
import { containsProfanity } from '../../src/utils/profanityFilter';



// İkon ve Renk Eşleştirici
const getNotificationUI = (type: NotificationType) => {
    switch (type) {
        case 'success': return { icon: Award, color: '#10b981', bg: 'bg-emerald-50' };
        case 'warning': return { icon: Clock, color: '#f59e0b', bg: 'bg-amber-50' };
        case 'info': return { icon: Info, color: '#3b82f6', bg: 'bg-blue-50' };
        case 'system': return { icon: Sparkles, color: '#8b5cf6', bg: 'bg-violet-50' };
        default: return { icon: Bell, color: '#64748b', bg: 'bg-slate-50' };
    }
};

import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
    // Global router object is context-free
    // const router = useRouter(); // <-- Bu satırı devredışı bıraktık
    const { user } = useAuth();
    const isPremium = useSubscriptionStore(state => state.isPremium);
    const credits = useSubscriptionStore(state => state.credits);
    const addCredits = useSubscriptionStore(state => state.addCredits);
    const checkSub = useSubscriptionStore(state => state.checkSubscriptionStatus);
    const { checkAccess } = usePremiumAccess();

    // ABONELİK KONTROLÜ
    useEffect(() => {
        checkSub();
    }, []);

    // Store Bağlantısı
    const { notifications, addNotification, markAsRead, markAllAsRead } = useNotificationStore();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [userName, setUserName] = useState('Yükleniyor...');
    const [questionCounts, setQuestionCounts] = useState({ trafik: 0, ilkyardim: 0, motor: 0, adap: 0 });

    // Isim Toplama Modalı State'leri
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    // PREMIUM PROMOSYON ZAMANLAYICISI (Her gün gece yarısına geri sayım)
    useEffect(() => {
        if (isPremium) return;

        let interval: ReturnType<typeof setInterval> | null = null;
        let isMounted = true;

        const updateTimer = () => {
            if (!isMounted) return;
            const now = new Date();
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            const diff = endOfDay.getTime() - now.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        };

        updateTimer();
        interval = setInterval(updateTimer, 1000);

        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
        };
    }, [isPremium]);

    const performDataLoad = async () => {
        try {
            const data = await fetchHomeDashboardData();
            return data;
        } catch (error) {
            console.error("Dashboard verisi çekilirken hata:", error);
            return { fullName: "Kullanıcı", counts: { trafik: 0, ilkyardim: 0, motor: 0, adap: 0 } };
        }
    };

    useEffect(() => {
        let isMounted = true;
        const initList = async () => {
            const data = await performDataLoad();
            if (isMounted) {
                setUserName(data.fullName);
                setQuestionCounts(data.counts);
                setIsLoading(false);

                // Eğer isimsiz ise veya uygunsuz bir ismi varsa isim sorma ekranını çıkar
                const nameCheck = data.fullName ? data.fullName.trim() : '';
                const placeholderNames = ['İsimsiz Sürücü', 'Sürücü Adayı', 'Misafir Sürücü', 'Misafir', 'Sürücü'];
                
                if (!nameCheck || placeholderNames.includes(nameCheck) || containsProfanity(nameCheck)) {
                    setShowNamePrompt(true);
                }
            }
        };
        initList();
        return () => { isMounted = false; };
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        const data = await performDataLoad();
        setUserName(data.fullName);
        setQuestionCounts(data.counts);
        setRefreshing(false);
    }, []);

    const categories = [
        { id: 'trafik', name: 'Trafik ve Çevre', icon: Car, color: '#2563eb', bg: 'bg-blue-50' },
        { id: 'ilkyardim', name: 'İlk Yardım', icon: Heart, color: '#ef4444', bg: 'bg-red-50' },
        { id: 'motor', name: 'Araç Tekniği', icon: ShieldAlert, color: '#f59e0b', bg: 'bg-amber-50' },
        { id: 'adap', name: 'Trafik Adabı', icon: GraduationCap, color: '#8b5cf6', bg: 'bg-violet-50' },
    ];

    const triggerRandomAd = () => {
        const adShown = adService.showRewarded(() => {
            // Kullanıcıya 3 kredi verelim
            addCredits(3);
            Alert.alert("Tebrikler!", "3 Kredi kazandınız.");
        });
        
        if (!adShown) {
            Alert.alert("Bilgi", "Video reklam henüz yüklenmedi, lütfen birkaç saniye sonra tekrar deneyin.");
        }
    };

    const handleGeneralExam = async () => {
        if (isPremium) {
            router.push('/quiz/general' as any);
            return;
        }

        const isUnlockedStr = await AsyncStorage.getItem('@unlocked_exam_general');
        if (isUnlockedStr === 'true') {
            router.push('/quiz/general' as any);
            return;
        }

        checkAccess({
            onSuccess: async () => {
                await AsyncStorage.setItem('@unlocked_exam_general', 'true');
                router.push('/quiz/general' as any);
            },
            featureName: 'Genel Deneme',
            onAdRequired: triggerRandomAd,
            creditCost: 6
        });
    };

    const handleMistakes = () => {
        checkAccess({
            onSuccess: () => {
                router.push('/quiz/mistakes' as any);
            },
            featureName: 'Hatalarım',
            onAdRequired: triggerRandomAd,
            creditCost: 2
        });
    };

    const handleFavorites = () => {
        checkAccess({
            onSuccess: () => {
                router.push('/quiz/favorites' as any);
            },
            featureName: 'Favori Sorular',
            onAdRequired: triggerRandomAd,
            creditCost: 2
        });
    };

    const handleNotes = () => {
        checkAccess({
            onSuccess: () => {
                router.push('/notes' as any);
            },
            featureName: 'Sınav Notları',
            onAdRequired: triggerRandomAd,
            creditCost: 20
        });
    };

    const handleSaveName = async () => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed.length < 2) {
            Alert.alert('Hata', 'Lütfen geçerli bir isim giriniz.');
            return;
        }

        if (containsProfanity(trimmed)) {
            Alert.alert('Uyarı', 'Lütfen geçerli ve uygun bir isim giriniz.');
            return;
        }

        setIsSavingName(true);
        try {
            // Update auth profile
            await supabase.auth.updateUser({
                data: { full_name: trimmed }
            });
            // Update profiles table
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({ full_name: trimmed }).eq('id', user.id);
            }
            setUserName(trimmed);
            setShowNamePrompt(false);
            Alert.alert('Teşekkürler!', 'Profil adınız başarıyla güncellendi.');
        } catch (error) {
            console.error('İsim kaydedilirken hata:', error);
            Alert.alert('Hata', 'İsminiz kaydedilemedi, lütfen tekrar deneyin.');
        } finally {
            setIsSavingName(false);
        }
    };

    const { isDarkMode, colorScheme } = useThemeMode();

    if (isLoading) return <HomeSkeleton />;

    return (
        <SafeAreaView className="flex-1 bg-base" edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* --- HEADER --- */}
            <View className="px-6 py-2 flex-row justify-between items-center z-10 mt-2">
                <View className="flex-1 pr-4">
                    <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        Hoş Geldin
                    </Text>
                    <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight" numberOfLines={1}>
                        {(userName || 'Sürücü').split(' ')[0]}
                    </Text>
                </View>

                {/* BİLDİRİM ZİL BUTONU */}
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => setShowNotifications(true)}
                        className="w-11 h-11 bg-white dark:bg-slate-900 rounded-full items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none active:opacity-70"
                    >
                        <Bell size={20} color={isDarkMode ? "#94a3b8" : "#64748b"} />
                        {unreadCount > 0 && (
                            <View className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 mt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* --- YENİ CÜZDAN / KREDİ KARTI --- */}
                {!isPremium && (
                    <View className="px-6 mb-6 mt-1">
                        <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800/60 shadow-sm shadow-slate-200/50 dark:shadow-none">
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-[18px] items-center justify-center mr-3 border border-amber-100/50 dark:border-amber-500/20">
                                        <Zap size={22} color="#f59e0b" fill="#f59e0b" />
                                    </View>
                                    <View>
                                        <Text className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Mevcut Kredin</Text>
                                        <Text className="text-[20px] font-black text-slate-900 dark:text-white leading-none">{credits} Kredi</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={triggerRandomAd}
                                    activeOpacity={0.7}
                                    className="bg-slate-900 dark:bg-white px-5 py-3 rounded-xl flex-row items-center justify-center shadow-md shadow-slate-900/20 dark:shadow-none"
                                >
                                    <Play size={13} color={isDarkMode ? "#0f172a" : "#ffffff"} fill={isDarkMode ? "#0f172a" : "#ffffff"} className="mr-2" />
                                    <Text className="text-white dark:text-slate-900 font-bold text-[13px] tracking-wide">Kazan</Text>
                                    <View className="bg-white/20 dark:bg-slate-900/10 rounded-md px-2 py-0.5 ml-2.5">
                                        <Text className="text-white/90 dark:text-slate-700 font-bold text-[10px] tracking-tight">+3 Kredi</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            
                            <View className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl flex-row items-center justify-center mt-2">
                                <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400 text-center leading-snug px-2">
                                    Reklam izleyerek anında +3 kredi kazan. Bu kredilerle kilitli sınavları ve özellikleri açabilirsin.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                {/* --- PREMIUM KAMPANYA --- */}
                {!isPremium && timeLeft && (
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            onPress={() => purchaseService.presentPaywall().then((success: boolean) => {
                                if (success) checkSub();
                            })}
                            activeOpacity={0.9}
                            className="bg-rose-600 dark:bg-rose-900 rounded-[24px] p-5 flex-row items-center relative overflow-hidden shadow-lg shadow-rose-600/30 border border-rose-500/50 dark:border-rose-800"
                        >
                            <View className="flex-1 pr-4 z-10">
                                <View className="flex-row items-center bg-white/20 dark:bg-rose-950/40 self-start px-2 py-1 rounded-lg mb-2 border border-white/20 dark:border-rose-800/50">
                                    <Timer size={12} color="#ffffff" className="mr-1.5" />
                                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                                        SON FIRSAT: {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                                <Text className="text-white font-black text-[20px] tracking-tight leading-6 mb-1">
                                    Zamlardan Etkilenmeyin
                                </Text>
                                <Text className="text-rose-100/90 text-[12px] font-bold leading-4">
                                    Premium'a geçerek sınırsız erişim hakkını indirimli fiyattan yakalayın!
                                </Text>
                            </View>
                            <View className="w-12 h-12 bg-white/20 rounded-[16px] items-center justify-center z-10 border border-white/20 backdrop-blur-sm">
                                <Crown size={24} color="#ffffff" />
                            </View>

                            {/* Arka plan efektleri */}
                            <View className="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-500/30 blur-2xl rounded-full" />
                            <View className="absolute right-12 -top-12 w-24 h-24 bg-rose-400/20 blur-2xl rounded-full" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* --- ANA AKSİYONLAR --- */}
                {/* 1. HERO CARD: Hızlı Antrenman */}
                <View className="px-6 mb-4">
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/quiz/quick' as any)}
                        className="bg-blue-600 dark:bg-slate-900 rounded-[28px] p-6 relative overflow-hidden shadow-xl shadow-blue-600/20 border border-blue-500/50 dark:border-slate-800"
                    >
                        {/* Arka plan deseni / ikonu */}
                        <View className="absolute right-[-10] bottom-[-20] opacity-10 rotate-12">
                            <Zap size={150} color="#ffffff" />
                        </View>
                        
                        <View className="relative z-10 flex-row justify-between items-start">
                            <View className="flex-1">
                                <View className="bg-white/20 dark:bg-blue-500/20 self-start px-2.5 py-1 rounded-lg mb-4 border border-white/20 dark:border-blue-400/30">
                                    <Text className="text-white dark:text-blue-400 text-[10px] font-black tracking-widest uppercase">Hızlı Pratik</Text>
                                </View>

                                <Text className="text-white text-[26px] font-black tracking-tight mb-1">
                                    10 Soru Çöz
                                </Text>
                                <Text className="text-blue-100/90 dark:text-slate-400 text-[13px] font-medium mb-6 leading-5 pr-4">
                                    Zaman kaybetmeden hemen başla.
                                </Text>

                                <View className="bg-white dark:bg-blue-600 self-start px-4 py-2.5 rounded-xl flex-row items-center shadow-sm">
                                    <Text className="text-blue-700 dark:text-white font-bold text-[14px] mr-2">Hemen Başla</Text>
                                    <ChevronRight size={16} color={isDarkMode ? "#ffffff" : "#1d4ed8"} />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 2. SECONDARY CARD: Genel Deneme */}
                <View className="px-6 mb-6">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleGeneralExam}
                        className="bg-white dark:bg-slate-900 rounded-[24px] p-5 relative overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none"
                    >
                        <View className="absolute -right-4 -bottom-4 opacity-5 dark:opacity-[0.03]">
                            <Trophy size={100} color={isDarkMode ? "#ffffff" : "#000000"} />
                        </View>

                        <View className="flex-row items-center justify-between z-10">
                            <View className="flex-1 pr-4">
                                <View className="flex-row items-center mb-2">
                                    <View className="w-2 h-2 bg-rose-500 rounded-full mr-2" />
                                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sınav Provası</Text>
                                </View>
                                <Text className="text-slate-900 dark:text-white font-black text-[18px] mb-0.5 tracking-tight">Genel Deneme Modu</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-[12px] font-medium">MEB müfredatına tam uygun 50 soru.</Text>
                            </View>
                            <View className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl items-center justify-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <ChevronRight size={20} color={isDarkMode ? "#cbd5e1" : "#64748b"} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* --- HIZLI KISAYOLLAR --- */}
                <View className="px-6 mb-8">
                    <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Kısayollar</Text>
                    <View className="flex-row justify-between">
                        {/* 1. İstatistik */}
                        <TouchableOpacity 
                            onPress={() => router.push('/statistics' as any)}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 mr-2 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl items-center justify-center mb-2">
                                <TrendingUp size={20} color="#6366f1" />
                            </View>
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">İstatistik</Text>
                        </TouchableOpacity>

                        {/* 2. Hatalarım */}
                        <TouchableOpacity 
                            onPress={handleMistakes}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 mr-2 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-2xl items-center justify-center mb-2">
                                <XCircle size={20} color="#f43f5e" />
                            </View>
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hatalarım</Text>
                        </TouchableOpacity>

                        {/* 3. Favoriler */}
                        <TouchableOpacity 
                            onPress={handleFavorites}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 mr-2 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-2xl items-center justify-center mb-2">
                                <Star size={20} color="#f59e0b" />
                            </View>
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Favoriler</Text>
                        </TouchableOpacity>

                        {/* 4. Notlar */}
                        <TouchableOpacity 
                            onPress={handleNotes}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl items-center justify-center mb-2">
                                <BookOpen size={20} color="#10b981" />
                            </View>
                    <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Notlar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- LİDERLİK TABLOSU ÖZETİ --- */}
                <LeaderboardWidget />

                {/* --- AI HOCA PROMOSYON --- */}
                <View className="px-6 mb-8">
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/ai-tutor' as any)}
                        className="bg-indigo-600 dark:bg-indigo-900/60 rounded-[24px] p-5 relative overflow-hidden flex-row items-center border border-indigo-500/30 dark:border-indigo-500/20 shadow-lg shadow-indigo-600/20"
                    >
                        <View className="absolute right-[-20] top-[-20] opacity-10">
                            <BrainCircuit size={140} color="#ffffff" />
                        </View>
                        
                        <View className="w-14 h-14 bg-white/20 rounded-[18px] items-center justify-center mr-4 border border-white/20 backdrop-blur-sm">
                            <BrainCircuit size={28} color="#ffffff" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-[16px] font-black tracking-tight mb-1">Anlamadığın soru mu var?</Text>
                            <Text className="text-indigo-100/80 text-[12px] font-medium leading-4">Yapay zeka asistanınla hemen çalış.</Text>
                        </View>
                        <View className="w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
                            <ChevronRight size={16} color="#ffffff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 4. KONU BAZLI TESTLER */}
                <View className="px-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Kategoriler</Text>
                    </View>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                activeOpacity={0.6}
                                className="w-[48%] bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/30 dark:shadow-none flex-col"
                                onPress={() => router.push(`/quiz/${cat.id}` as any)}
                            >
                                <View className="flex-row justify-between items-start mb-5">
                                    <View className={`w-11 h-11 rounded-2xl ${cat.bg} dark:bg-opacity-10 items-center justify-center`}>
                                        <cat.icon size={22} color={cat.color} />
                                    </View>
                                    <View className="w-6 h-6 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center mt-1">
                                        <ChevronRight size={12} color={isDarkMode ? "#64748b" : "#94a3b8"} />
                                    </View>
                                </View>
                                <Text className="font-bold text-slate-900 dark:text-slate-100 text-[14px] leading-5">{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View className="h-6" />
            </ScrollView>

            {/* --- BİLDİRİM MERKEZİ MODALI --- */}
            <Modal visible={showNotifications} animationType="fade" transparent>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-background-light dark:bg-background-dark rounded-t-[32px] h-[85%] shadow-2xl overflow-hidden">

                        {/* Modal Header */}
                        <View className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
                            <View>
                                <Text className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Bildirimler</Text>
                                {unreadCount > 0 && (
                                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold mt-0.5">{unreadCount} okuma bekleyen</Text>
                                )}
                            </View>
                            <View className="flex-row gap-3">
                                {unreadCount > 0 && (
                                    <TouchableOpacity
                                        onPress={() => markAllAsRead()}
                                        className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 items-center justify-center flex-row"
                                    >
                                        <CheckCircle2 size={16} color={isDarkMode ? "#94a3b8" : "#64748b"} className="mr-1" />
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">Tümünü Oku</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowNotifications(false)}
                                    className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center"
                                >
                                    <X size={20} color={isDarkMode ? "#94a3b8" : "#64748b"} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bildirim Listesi */}
                        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {notifications.length === 0 ? (
                                <View className="items-center justify-center mt-20">
                                    <Bell size={48} color={isDarkMode ? "#1e293b" : "#cbd5e1"} />
                                    <Text className="text-slate-400 dark:text-slate-600 mt-4 font-medium">Henüz hiç bildiriminiz yok.</Text>
                                </View>
                            ) : (
                                notifications.map((notif, i) => {
                                    const ui = getNotificationUI(notif.type);
                                    const IconComponent = ui.icon;

                                    return (
                                        <TouchableOpacity
                                            key={`${notif.id}-${i}`}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                markAsRead(notif.id);
                                                if (notif.data?.route) {
                                                    setShowNotifications(false);
                                                    router.push(notif.data.route as any);
                                                }
                                            }}
                                            className={`mb-3 p-4 rounded-[24px] border flex-row items-start ${notif.isRead
                                                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75'
                                                : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'}`}
                                        >
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${ui.bg} dark:bg-opacity-10`}>
                                                <IconComponent size={20} color={ui.color} />
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row justify-between items-start mb-1">
                                                    <Text className={`font-bold text-[15px] flex-1 mr-2 ${notif.isRead
                                                        ? 'text-slate-700 dark:text-slate-300'
                                                        : 'text-slate-900 dark:text-slate-100'}`}>
                                                        {notif.title}
                                                    </Text>
                                                    {!notif.isRead && <View className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />}
                                                </View>
                                                <Text className="text-slate-500 dark:text-slate-400 text-[13px] leading-5 mb-2">{notif.message}</Text>
                                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">{notif.time}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showNamePrompt}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {}} // Engellemek için boş bırakıldı
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <View className="items-center mb-6">
                            <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 items-center justify-center mb-4">
                                <Sparkles size={32} color="#2563eb" />
                            </View>
                            <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">
                                Sana Nasıl Hitap Edelim?
                            </Text>
                            <Text className="text-[14px] text-slate-500 dark:text-slate-400 text-center leading-5">
                                Uygulama deneyimini kişiselleştirmek ve sana özel sertifikalar hazırlayabilmek için ismini bizimle paylaşır mısın?
                            </Text>
                        </View>

                        <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 h-14 justify-center mb-6">
                            <TextInput
                                placeholder="Adın ve Soyadın"
                                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                                value={newName}
                                onChangeText={setNewName}
                                className="text-base text-slate-900 dark:text-white font-medium"
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveName}
                            disabled={isSavingName}
                            className={`w-full h-14 rounded-2xl items-center justify-center flex-row ${isSavingName ? 'bg-blue-400' : 'bg-blue-600'}`}
                        >
                            <Text className="text-white font-bold text-lg mr-2">
                                {isSavingName ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
                            </Text>
                            {!isSavingName && <CheckCircle2 size={20} color="white" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const HomeSkeleton = () => {
    const { isDarkMode, colorScheme } = useThemeMode();

    return (
        <SafeAreaView className="flex-1 bg-base" edges={['top']}>
            <View className="px-6 pt-2 pb-6">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <View className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2 animate-pulse" />
                        <View className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </View>
                    <View className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                </View>

                {/* Wallet Skeleton */}
                <View className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-[24px] mb-5 animate-pulse" />

                {/* Hero Skeleton */}
                <View className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-[28px] mb-4 animate-pulse" />

                
                {/* Secondary Skeleton */}
                <View className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[24px] mb-6 animate-pulse" />
                
                {/* Shortcuts Skeleton */}
                <View className="flex-row justify-between mb-8">
                    <View className="h-24 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[20px] mr-2 animate-pulse" />
                    <View className="h-24 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[20px] mr-2 animate-pulse" />
                    <View className="h-24 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[20px] mr-2 animate-pulse" />
                    <View className="h-24 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[20px] animate-pulse" />
                </View>

                {/* AI Tutor Skeleton */}
                <View className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[24px] mb-8 animate-pulse" />

                {/* Grid Skeleton */}
                <View className="flex-row gap-4 mb-4">
                    <View className="h-20 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[24px] animate-pulse" />
                    <View className="h-20 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[24px] animate-pulse" />
                </View>
                <View className="flex-row gap-4 mb-8">
                    <View className="h-20 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[24px] animate-pulse" />
                    <View className="h-20 flex-1 bg-slate-200 dark:bg-slate-800 rounded-[24px] animate-pulse" />
                </View>
            </View>
        </SafeAreaView>
    );
};
