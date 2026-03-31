import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Play, Car, Heart, ShieldAlert, GraduationCap,
    Bell, BookOpen, TriangleAlert, Gauge, ChevronRight, Sparkles, Zap,
    X, CheckCircle2, Award, Clock, Info, Lock
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchHomeDashboardData } from '../../src/api/queries';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import { NotificationPermissionModal } from '../../src/components/NotificationPermissionModal';
import { sendImmediateNotification } from '../../src/api/notifications';
import * as Notifications from 'expo-notifications';

// --- ICONS MAP FOR NOTIFICATIONS ---
const NotificationIcons = {
    success: { icon: Award, color: '#10b981', bg: 'bg-emerald-50' },
    warning: { icon: Clock, color: '#f59e0b', bg: 'bg-amber-50' },
    info: { icon: Info, color: '#3b82f6', bg: 'bg-blue-50' },
    error: { icon: ShieldAlert, color: '#ef4444', bg: 'bg-red-50' },
    promo: { icon: Sparkles, color: '#8b5cf6', bg: 'bg-violet-50' },
};

export default function Home() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Bildirim Store & State
    const { notifications, unreadCount, markAsRead, removeNotification, clearAll } = useNotificationStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    // CANLI VERİ STATE'LERİ
    const [userName, setUserName] = useState('Yükleniyor...');
    const [questionCounts, setQuestionCounts] = useState({ trafik: 0, ilkyardim: 0, motor: 0, adap: 0 });

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

        // Bildirim izni kontrolü
        const checkPermissions = async () => {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                // Küçük bir gecikmeyle göster ki kullanıcı biraz içeride vakit geçirsin
                setTimeout(() => setShowPermissionPrompt(true), 2000);
            }
        };
        checkPermissions();

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

    const studyTools = [
        { id: 'signs', title: 'Trafik İşaretleri', subtitle: 'Görsel Hafıza', icon: TriangleAlert, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'dashboard', title: 'Göstergeler', subtitle: 'İkaz Lambaları', icon: Gauge, color: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-100' },
        { id: 'notes', title: 'Ders Notları', subtitle: 'Özet Anlatım', icon: BookOpen, color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-100' }
    ];

    const handlePremiumFeature = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPro) {
            router.push(route as any);
        } else {
            router.push('/premium');
        }
    };

    if (isLoading) return <HomeSkeleton />;

    return (
        <ScreenLayout className="bg-[#F8FAFC] dark:bg-slate-950">
            <StatusBar barStyle="dark-content" />

            {/* --- HEADER --- */}
            <View className="px-6 py-2 flex-row justify-between items-center bg-[#F8FAFC] dark:bg-slate-950 z-10 mt-2">
                <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-1">
                        <Sparkles size={14} color="#3b82f6" />
                        <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-black tracking-widest uppercase ml-1">
                            Ehliyet Hocam
                        </Text>
                    </View>
                    <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>
                        Merhaba, {userName.split(' ')[0]} 👋
                    </Text>
                </View>

                {/* BİLDİRİM ZİL BUTONU */}
                <TouchableOpacity
                    onPress={() => setShowNotifications(true)}
                    className="w-11 h-11 bg-white dark:bg-slate-900 rounded-full items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-black active:opacity-70"
                >
                    <Bell size={20} color="#64748b" />
                    {unreadCount() > 0 && (
                        <View className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 mt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
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

                {/* 3. DERS ÇALIŞMA ARAÇLARI */}
                <View className="mb-10">
                    <View className="px-6 flex-row justify-between items-center mb-5">
                        <View>
                            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Hızlı Göz At</Text>
                            <View className="h-1 w-8 bg-blue-600 rounded-full mt-1" />
                        </View>
                        <TouchableOpacity onPress={() => router.push('/quizzes')}>
                            <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
                        {studyTools.map((tool) => (
                            <TouchableOpacity
                                key={tool.id}
                                activeOpacity={0.7}
                                className={`w-[145px] p-5 rounded-[32px] bg-white dark:bg-slate-900 border ${tool.border} dark:border-slate-800 justify-between h-[160px] shadow-sm shadow-slate-200/50 dark:shadow-black/50 ${!isPro ? 'opacity-90' : ''}`}
                                onPress={() => handlePremiumFeature(`/study/${tool.id}`)}
                            >
                                <View className={`w-12 h-12 rounded-2xl ${tool.bg} dark:bg-slate-800 items-center justify-center mb-2 shadow-sm shadow-slate-100 dark:shadow-none`}>
                                    <tool.icon size={22} color={tool.color} />
                                </View>
                                <View>
                                    <Text className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-tight mb-1" numberOfLines={2}>{tool.title}</Text>
                                    <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest" numberOfLines={1}>{tool.subtitle}</Text>
                                    {!isPro && (
                                        <View className="absolute -top-12 -right-2 bg-slate-900/10 p-1.5 rounded-full">
                                            <Lock size={12} color="#f59e0b" />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 4. KONU BAZLI TESTLER */}
                <View className="px-6 mb-10">
                    <View className="flex-row items-center mb-5">
                        <View>
                            <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Konu Testleri</Text>
                            <View className="h-1 w-8 bg-emerald-500 rounded-full mt-1" />
                        </View>
                    </View>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                activeOpacity={0.7}
                                className="w-[48%] bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-black/50 flex-col h-[170px]"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push({ pathname: '/quiz/[id]', params: { id: cat.id } });
                                }}
                            >
                                <View className={`w-12 h-12 rounded-2xl ${cat.bg} dark:bg-slate-800 items-center justify-center mb-4 shadow-sm shadow-slate-50 dark:shadow-none`}>
                                    <cat.icon size={24} color={cat.color} />
                                </View>
                                <Text className="font-extrabold text-slate-900 dark:text-white text-base leading-5 flex-1" numberOfLines={2}>{cat.name}</Text>
                                <View className="flex-row items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-800">
                                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Başla</Text>
                                    <View className="w-6 h-6 bg-slate-50 rounded-full items-center justify-center">
                                        <ChevronRight size={12} color="#94a3b8" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View className="h-6" />
            </ScrollView>

            {/* --- BİLDİRİM MERKEZİ MODALI --- */}
            <Modal visible={showNotifications} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-slate-900/40">
                    <View className="bg-[#F8FAFC] dark:bg-slate-950 rounded-t-[32px] h-[75%] shadow-2xl overflow-hidden">

                        {/* Modal Header */}
                        <View className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
                            <View>
                                <Text className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Bildirimler</Text>
                                {unreadCount() > 0 ? (
                                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold mt-0.5">{unreadCount()} yeni bildirim</Text>
                                ) : (
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-0.5">Hiç yeni bildirim yok</Text>
                                )}
                            </View>
                            <View className="flex-row gap-3">
                                {notifications.length > 0 && (
                                    <TouchableOpacity 
                                        onPress={clearAll}
                                        className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 items-center justify-center"
                                    >
                                        <CheckCircle2 size={16} color="#64748b" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowNotifications(false)}
                                    className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center"
                                >
                                    <X size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bildirim Listesi */}
                        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {notifications.length === 0 ? (
                                <View className="flex-1 items-center justify-center py-20">
                                    <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
                                        <Bell size={32} color="#cbd5e1" />
                                    </View>
                                    <Text className="text-slate-400 font-bold text-center">Henüz bir bildirim yok.</Text>
                                </View>
                            ) : (
                                notifications.map((notif) => {
                                    const style = NotificationIcons[notif.type] || NotificationIcons.info;
                                    return (
                                        <TouchableOpacity
                                            key={notif.id}
                                            activeOpacity={0.7}
                                            onPress={() => markAsRead(notif.id)}
                                            className={`mb-3 p-4 rounded-[24px] border flex-row items-start ${notif.isRead ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'}`}
                                        >
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${style.bg} dark:bg-slate-800`}>
                                                {style.icon && <style.icon size={20} color={style.color} />}
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row justify-between items-start mb-1">
                                                    <Text className={`font-bold text-[15px] flex-1 mr-2 ${notif.isRead ? 'text-slate-800 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                                        {notif.title}
                                                    </Text>
                                                    <TouchableOpacity onPress={() => removeNotification(notif.id)}>
                                                        <X size={14} color="#cbd5e1" />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text className="text-slate-500 dark:text-slate-400 text-[13px] leading-5 mb-2">{notif.body}</Text>
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">{notif.time}</Text>
                                                    {!notif.isRead && <View className="w-2 h-2 bg-blue-600 rounded-full" />}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}

                            {/* TEST BİLDİRİM BUTONU */}
                            <TouchableOpacity
                                onPress={() => sendImmediateNotification(
                                    'Harika Gidiyorsun! 🎉',
                                    'Bugünkü hedeflerine ulaşmak için 5 soru daha çöz!',
                                    { type: 'success' }
                                )}
                                className="mt-6 bg-slate-100 dark:bg-slate-900 py-4 rounded-2xl items-center border border-dashed border-slate-300 dark:border-slate-800"
                            >
                                <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Test Bildirimi Gönder</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <NotificationPermissionModal 
                            isVisible={showPermissionPrompt} 
                            onClose={() => setShowPermissionPrompt(false)} 
                        />
                    </View>
                </View>
            </Modal>
        </ScreenLayout>
    );
}

const HomeSkeleton = () => (
    <ScreenLayout className="bg-[#F8FAFC]">
        <View className="px-6 pt-12 pb-6">
            <View className="flex-row justify-between items-center mb-8">
                <View>
                    <View className="h-3 w-24 bg-slate-200 rounded mb-3 animate-pulse" />
                    <View className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                </View>
                <View className="w-11 h-11 bg-slate-200 rounded-full animate-pulse" />
            </View>
            <View className="h-56 w-full bg-slate-200 rounded-[32px] mb-6 animate-pulse" />
            <View className="h-24 w-full bg-slate-200 rounded-[24px] mb-8 animate-pulse" />
            <View className="flex-row gap-4 mb-8">
                <View className="h-[150px] w-[135px] bg-slate-200 rounded-[28px] animate-pulse" />
                <View className="h-[150px] w-[135px] bg-slate-200 rounded-[28px] animate-pulse" />
            </View>
        </View>
    </ScreenLayout>
);