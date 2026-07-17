import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert, TextInput } from 'react-native';
import { useRouter, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// import * as Notifications from 'expo-notifications'; // Expo Go'da çökmeyi önlemek için kaldırıldı
import type { EventSubscription, Notification, NotificationResponse } from 'expo-notifications';

const isExpoGo = Constants.appOwnership === 'expo';
const Notifications = !isExpoGo ? require('expo-notifications') : null;
import {
    Play, Car, Heart, ShieldAlert, GraduationCap,
    Bell, ChevronRight, Sparkles, Zap,
    X, CheckCircle2, Award, Clock, Info, Timer, Crown
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchHomeDashboardData } from '../../src/api/queries';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useAuth } from '../../src/hooks/useAuth';
import { usePremiumAccess } from '../../src/hooks/usePremiumAccess';
import { useNotificationStore, NotificationType } from '../../src/store/useNotificationStore';
import { registerForPushNotificationsAsync } from '../../src/api/notifications';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { adService } from '../../src/services/adService';
import { purchaseService } from '../../src/services/purchaseService';



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

    const notificationListener = useRef<EventSubscription | null>(null);
    const responseListener = useRef<EventSubscription | null>(null);

    // PREMIUM PROMOSYON ZAMANLAYICISI
    useEffect(() => {
        if (isPremium) return;

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
    }, [isPremium]);

    // BİLDİRİM DİNLEYİCİLERİ VE KAYIT
    useEffect(() => {
        // İzin iste ve Token'ı Supabase'e kaydet
        if (user?.id) {
            registerForPushNotificationsAsync(user.id);
        }

        // 1. Uygulama Açıkken (Foreground) Bildirim Geldiğinde
        if (!isExpoGo && Notifications) {
            notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notification) => {
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
            responseListener.current = Notifications.addNotificationResponseReceivedListener((response: NotificationResponse) => {
                const data = response.notification.request.content.data;
                // Bildirime tıklanıp uygulamaya girildiyse, route bilgisi varsa oraya yönlendir
                if (data?.route) {
                    router.push(data.route as any);
                } else {
                    setShowNotifications(true);
                }
            });
        }

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
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

                // Eğer isimsiz ise isim sorma ekranını çıkar
                if (data.fullName === 'İsimsiz Sürücü' || data.fullName === 'Sürücü Adayı' || !data.fullName) {
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

    const handleSaveName = async () => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed.length < 2) {
            Alert.alert('Hata', 'Lütfen geçerli bir isim giriniz.');
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
            <View className="px-6 py-4 flex-row justify-between items-start z-10 mt-2">
                <View className="flex-1 pr-4">
                    <Text className="text-[28px] font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight" numberOfLines={1}>
                        Merhaba, {(userName || 'Sürücü').split(' ')[0]} 👋
                    </Text>
                    
                    {!isPremium && (
                        <TouchableOpacity
                            onPress={triggerRandomAd}
                            activeOpacity={0.8}
                            className="bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/50 flex-row items-center self-start mt-2"
                        >
                            <Zap size={14} color="#b45309" fill="#b45309" className="mr-2" />
                            <Text className="text-amber-800 dark:text-amber-400 font-black text-[11px] uppercase tracking-wide">
                                Reklam İzle Kredi Kazan • 🪙 {credits}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* BİLDİRİM ZİL BUTONU */}
                <View className="flex-row items-center pt-1">
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
                {!isPremium && timeLeft && (
                    <View className="px-6 mb-6">
                        <TouchableOpacity
                            onPress={() => purchaseService.presentPaywall().then((success: boolean) => {
                                if (success) checkSub();
                            })}
                            activeOpacity={0.9}
                            className="bg-amber-400 rounded-[28px] p-5 flex-row items-center relative overflow-hidden shadow-xl shadow-amber-400/20"
                        >
                            <View className="flex-1 pr-6 z-10">
                                <View className="flex-row items-center bg-white/20 self-start px-2 py-1 rounded-lg mb-2 border border-white/20">
                                    <Timer size={12} color="#78350f" className="mr-1.5" />
                                    <Text className="text-amber-950 text-[10px] font-black uppercase tracking-widest">
                                        FIRSAT: {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                                <Text className="text-amber-950 font-black text-[22px] tracking-tight leading-7">
                                    Kapsamlı <Text className="text-white">Hazırlık</Text>
                                </Text>
                                <Text className="text-amber-900/70 text-xs font-bold mt-1">Hemen Premium'a geç, farkı hisset.</Text>
                            </View>
                            <View className="w-14 h-14 bg-white/30 rounded-full items-center justify-center z-10 backdrop-blur-md">
                                <Crown size={28} color="#78350f" fill="#78350f" />
                            </View>

                            <View className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full" />
                            <View className="absolute right-12 -top-12 w-24 h-24 bg-white/10 rounded-full" />
                        </TouchableOpacity>
                    </View>
                )}


                {/* 1. HERO CARD: Genel Deneme */}
                <View className="px-6 mb-5">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleGeneralExam}
                        className="bg-slate-900 rounded-[32px] p-6 relative overflow-hidden shadow-2xl shadow-slate-900/30"
                    >
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
                                MEB müfredatına uygun 50 soruluk deneme. Premium ile sınırsız, ücretsiz planda krediyle erişim.
                            </Text>

                            <View className="self-start p-1.5 pl-5 pr-1.5 rounded-full flex-row items-center shadow-lg bg-blue-600 shadow-blue-600/30">
                                <Text className="text-white font-bold text-sm mr-4">Hemen Başla</Text>
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
                        onPress={() => router.push('/quiz/quick' as any)}
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
                                className="w-[48%] bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex-col h-[150px] relative"
                                onPress={() => router.push(`/quiz/${cat.id}` as any)}
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

            {/* İSİM TOPLAMA MODALI */}
            <Modal
                visible={showNamePrompt}
                transparent
                animationType="fade"
                statusBarTranslucent
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
            <View className="px-6 pt-12 pb-6">
                <View className="flex-row justify-between items-center mb-8">
                    <View>

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
        </SafeAreaView>
    );
};
