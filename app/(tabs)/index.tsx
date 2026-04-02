import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert } from 'react-native';
import { useRouter, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
    Play, Car, Heart, ShieldAlert, GraduationCap,
    Bell, ChevronRight, Sparkles, Zap,
    X, CheckCircle2, Award, Clock, Info, Lock, Timer
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchHomeDashboardData } from '../../src/api/queries';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useAuth } from '../../src/hooks/useAuth';
import { useNotificationStore, NotificationType } from '../../src/store/useNotificationStore';
import { registerForPushNotificationsAsync } from '../../src/api/notifications';
import RewardedAdModal from '../../src/components/RewardedAdModal';
import { useThemeMode } from '../../src/hooks/useThemeMode';

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

export default function Home() {
    // Global router object is context-free
    // const router = useRouter(); // <-- Bu satırı devredışı bıraktık
    const { user } = useAuth();
    const isPro = useSubscriptionStore(state => state.isPro);
    const credits = useSubscriptionStore(state => state.credits);
    const spendCredits = useSubscriptionStore(state => state.spendCredits);
    const checkSub = useSubscriptionStore(state => state.checkSubscriptionStatus);

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
    const [showAdModal, setShowAdModal] = useState(false);
    const [adModalType, setAdModalType] = useState<'short' | 'long' | 'mega'>('short');
    const [userName, setUserName] = useState('Yükleniyor...');
    const [questionCounts, setQuestionCounts] = useState({ trafik: 0, ilkyardim: 0, motor: 0, adap: 0 });

    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    // PREMIUM PROMOSYON ZAMANLAYICISI
    useEffect(() => {
        if (isPro) return;

        const initTimer = async () => {
            try {
                let startTimeStr = await AsyncStorage.getItem('promo_start_time');
                let startTime: number;

                if (!startTimeStr) {
                    startTime = Date.now();
                    await AsyncStorage.setItem('promo_start_time', startTime.toString());
                } else {
                    startTime = parseInt(startTimeStr);
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
            } catch (e) {
                console.error("Timer init error:", e);
            }
        };

        const timerCleanup = initTimer();
        return () => {
            // initTimer is async, so we handle cleanup via interval if it were returned
        };
    }, [isPro]);

    // BİLDİRİM DİNLEYİCİLERİ VE KAYIT
    useEffect(() => {
        // İzin iste ve Token'ı Supabase'e kaydet
        if (user?.id) {
            registerForPushNotificationsAsync(user.id);
        }

        // 1. Uygulama Açıkken (Foreground) Bildirim Geldiğinde
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const title = notification.request.content.title || 'Yeni Bildirim';
            const message = notification.request.content.body || '';
            const data = notification.request.content.data;

            // Store'a ekle
            addNotification({
                title,
                message,
                type: (data?.type as NotificationType) || 'info',
                data: data
            });
        });

        // 2. Kullanıcı Bildirime Tıkladığında (Arka plan / Kapalıyken)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            // Bildirime tıklanıp uygulamaya girildiyse, route bilgisi varsa oraya yönlendir
            if (data?.route) {
                router.push(data.route as any);
            } else {
                setShowNotifications(true);
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, [user]);

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
            }
        };
        initList();
        return () => { isMounted = false; };
    }, []);

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
        const rand = Math.random();
        let type: 'short' | 'long' | 'mega';
        
        // Weighting: 50% Mega (40s), 30% Long (20s), 20% Short (10s)
        if (rand < 0.5) type = 'mega';
        else if (rand < 0.8) type = 'long';
        else type = 'short';

        setAdModalType(type);
        setShowAdModal(true);
    };

    const handlePremiumFeature = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPro) {
            router.push(route as any);
        } else {
            // Kredi Kontrolü
            if (credits >= 50) {
                Alert.alert(
                    "Premium İçerik",
                    "Bu sınavı çözmek için 50 kredi kullanmak ister misiniz?",
                    [
                        { text: "Vazgeç", style: "cancel" },
                        { 
                            text: "50 Kredi Harca", 
                            onPress: () => {
                                const success = spendCredits(50);
                                if (success) {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    router.push(route as any);
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert(
                    "Kredi Yetersiz",
                    "Bu sınavı çözmek için 50 krediniz olmalı. Reklam izleyerek kredi kazanmak ister misiniz?",
                    [
                        { text: "Vazgeç", style: "cancel" },
                        { text: "Premium Al", onPress: () => router.push('/premium') },
                        { text: "Reklam İzle", onPress: triggerRandomAd }
                    ]
                );
            }
        }
    };

    const { isDarkMode, colorScheme } = useThemeMode();

    if (isLoading) return <HomeSkeleton />;

    return (
        <ScreenLayout className="bg-base">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* --- HEADER --- */}
            <View className="px-6 py-2 flex-row justify-between items-center z-10 mt-2">
                <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-1">
                        <Sparkles size={14} color="#3b82f6" />
                        <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase ml-1">
                            Ehliyet Cepte
                        </Text>
                    </View>
                    <Text className="text-[28px] font-black text-slate-900 dark:text-slate-50 tracking-tight" numberOfLines={1}>
                        Merhaba, {userName.split(' ')[0]} 👋
                    </Text>
                </View>

                {/* BİLDİRİM ZİL BUTONU VE KREDİ SKORU */}
                <View className="flex-row items-center gap-3">
                    {!isPro && (
                        <TouchableOpacity
                            onPress={triggerRandomAd}
                            className="bg-amber-100/80 px-3 py-2 rounded-full border border-amber-200 flex-row items-center"
                        >
                            <Text className="text-amber-700 font-black text-xs mr-1.5">🪙 {credits}</Text>
                            <Zap size={12} color="#b45309" fill="#b45309" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => setShowNotifications(true)}
                        className="w-11 h-11 bg-white dark:bg-slate-900 rounded-full items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none active:opacity-70"
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
                {/* --- PREMIUM PROMOSYON BANNER --- */}
                {!isPro && timeLeft && (
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/premium')}
                            className="bg-amber-50 rounded-[28px] border border-amber-200 p-5 overflow-hidden flex-row items-center"
                        >
                            <View className="flex-1 pr-4">
                                <View className="flex-row items-center mb-1.5">
                                    <View className="bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg mr-2">
                                        <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-tighter">Sınırlı Süre</Text>
                                    </View>
                                    <Text className="text-amber-800 dark:text-amber-300 text-xs font-bold">%50'den fazla indirim!</Text>
                                </View>
                                <Text className="text-slate-900 dark:text-slate-100 text-lg font-black tracking-tight leading-6 mb-1">
                                    Premium ₺200 yerine ₺99!
                                </Text>
                                <View className="flex-row items-center">
                                    <Timer size={14} color={isDarkMode ? "#fbbf24" : "#b45309"} className="mr-1.5" />
                                    <Text className="text-amber-700 dark:text-amber-400 text-sm font-black tracking-widest uppercase">
                                        {timeLeft.hours.toString().padStart(2, '0')}:
                                        {timeLeft.minutes.toString().padStart(2, '0')}:
                                        {timeLeft.seconds.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                            </View>
                            <View className="w-14 h-14 bg-amber-500 rounded-full items-center justify-center shadow-lg shadow-amber-500/40">
                                <Zap size={28} color="white" fill="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 1. HERO CARD: Genel Deneme */}
                <View className="px-6 mb-5">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handlePremiumFeature('/quiz/general')}
                        className={`bg-slate-900 rounded-[32px] p-6 relative overflow-hidden shadow-2xl shadow-slate-900/30 ${!isPro ? 'opacity-90' : ''}`}
                    >
                        {!isPro && (
                            <View className="absolute top-5 right-5 z-20 bg-black/40 p-2.5 rounded-full border border-white/10 backdrop-blur-md">
                                <Lock size={16} color="#f59e0b" />
                            </View>
                        )}
                        <View className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
                        <View className="absolute right-12 -bottom-12 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />

                        <View className="relative z-10">
                            <View className="bg-white/10 self-start px-3 py-1.5 rounded-xl border border-white/10 mb-5 flex-row items-center">
                                <Play size={12} color="#60a5fa" fill="#60a5fa" className="mr-1.5" />
                                <Text className="text-blue-300 text-[10px] font-black tracking-widest uppercase">Gerçek Sınav Modu</Text>
                            </View>

                            <Text className="text-white text-[32px] font-black tracking-tight mb-2">
                                Genel Deneme
                            </Text>
                            <Text className="text-slate-400 text-[13px] font-medium mb-7 leading-5 max-w-[85%]">
                                MEB müfredatına birebir uygun, 50 soruluk tam kapsamlı deneme sınavı.
                            </Text>

                            <View className={`self-start p-1.5 pl-5 pr-1.5 rounded-full flex-row items-center shadow-lg ${!isPro ? 'bg-amber-600 shadow-amber-600/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
                                <Text className="text-white font-bold text-sm mr-4">{!isPro ? 'Premium Edin' : 'Hemen Başla'}</Text>
                                <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
                                    <ChevronRight size={18} color="white" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 2. YENİ BÖLÜM: Hızlı Antrenman */}
                <View className="px-6 mb-8">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/quiz/quick');
                        }}
                        className="bg-emerald-500 rounded-[24px] p-5 flex-row items-center justify-between shadow-lg shadow-emerald-500/20 overflow-hidden relative"
                    >
                        <View className="absolute -right-4 -top-8 opacity-10 rotate-12">
                            <Zap size={100} color="white" fill="white" />
                        </View>
                        <View className="flex-1 pr-4 z-10">
                            <Text className="text-white font-black text-lg mb-0.5 tracking-tight">Hızlı Antrenman</Text>
                            <Text className="text-emerald-100 text-xs font-medium">Vaktin mi az? Rastgele 10 soru çöz.</Text>
                        </View>
                        <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center z-10 backdrop-blur-md border border-white/20">
                            <Zap size={24} color="white" fill="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 4. KONU BAZLI TESTLER */}
                <View className="px-6">
                    <Text className="text-[19px] font-black text-slate-900 dark:text-slate-50 tracking-tight mb-4">Konu Testleri</Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                activeOpacity={0.7}
                                className="w-[48%] bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex-col h-[150px]"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push({ pathname: '/quiz/[id]', params: { id: cat.id } });
                                }}
                            >
                                <View className={`w-12 h-12 rounded-2xl ${cat.bg} dark:bg-opacity-10 items-center justify-center mb-3`}>
                                    <cat.icon size={24} color={cat.color} />
                                </View>
                                <Text className="font-extrabold text-slate-900 dark:text-slate-100 text-[15px] leading-5" numberOfLines={2}>{cat.name}</Text>
                                <View className="flex-row items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-slate-800">
                                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Testi Çöz</Text>
                                    <ChevronRight size={14} color={isDarkMode ? "#475569" : "#94a3b8"} />
                                </View>
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
                                                    router.push(notif.data.route);
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

            <RewardedAdModal 
                visible={showAdModal} 
                type={adModalType}
                onClose={() => setShowAdModal(false)} 
            />
        </ScreenLayout>
    );
}

const HomeSkeleton = () => {
    const { isDarkMode, colorScheme } = useThemeMode();
    
    return (
        <ScreenLayout className="bg-base">
            <View className="px-6 pt-12 pb-6">
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <View className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-3 animate-pulse" />
                        <View className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </View>
                    <View className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                </View>
                <View className="h-56 w-full bg-slate-200 dark:bg-slate-800 rounded-[32px] mb-6 animate-pulse" />
                <View className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[24px] mb-8 animate-pulse" />
                <View className="flex-row gap-4 mb-8">
                    <View className="h-[150px] w-[135px] bg-slate-200 dark:bg-slate-800 rounded-[28px] animate-pulse" />
                    <View className="h-[150px] w-[135px] bg-slate-200 dark:bg-slate-800 rounded-[28px] animate-pulse" />
                </View>
            </View>
        </ScreenLayout>
    );
};