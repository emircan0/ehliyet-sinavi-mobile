import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
    TrendingUp, Clock, Target,
    Zap, AlertCircle, CheckCircle2, Info, AlertTriangle
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';
import { fetchUserStats } from '../../src/api/queries';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useThemeMode } from '../../src/hooks/useThemeMode';

const CATEGORY_NAMES: Record<string, string> = {
    trafik: 'TRAFİK VE ÇEVRE',
    motor: 'MOTOR VE ARAÇ TEKNİĞİ',
    ilkyardim: 'İLK YARDIM',
    adap: 'TRAFİK ADABI'
};

export default function StatisticsScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);
    const { isDarkMode, colorScheme } = useThemeMode();

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    const loadStats = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Kullanıcı kontrolü (_layout.tsx sayesinde kullanıcının burada olduğundan eminiz,
            // ama yine de id'sini almak için Supabase'e soruyoruz)
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("Kullanıcı oturumu doğrulanamadı.");
            }

            const data = await fetchUserStats(user.id);
            setStats(data);

        } catch (err: any) {
            console.error("İstatistikler yüklenirken hata:", err);
            setError("Verilere ulaşırken bir sorun oluştu. İnternet bağlantınızı kontrol edin.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const performanceData = useMemo(() => {
        const answers = stats?.answers || [];
        const totalQuestions = answers.length;
        const correctAnswers = answers.filter((a: any) => a.is_correct).length;
        const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const totalExams = stats?.results?.length || 0;

        const categories = Object.keys(CATEGORY_NAMES).map(catKey => {
            const catQuestions = answers.filter((a: any) => a.questions?.category === catKey);
            const catCorrect = catQuestions.filter((a: any) => a.is_correct).length;
            const catRate = catQuestions.length > 0 ? Math.round((catCorrect / catQuestions.length) * 100) : 0;

            return { id: catKey, name: CATEGORY_NAMES[catKey], rate: catRate, total: catQuestions.length };
        });

        return { totalQuestions, correctAnswers, successRate, totalExams, categories };
    }, [stats]);

    // --- DURUM 1: YÜKLENİYOR EKRANI ---
    if (isLoading) return <StatisticsSkeleton />;

    // --- DURUM 2: HATA EKRANI (İnternet/Supabase hatası) ---
    if (error) return (
        <ScreenLayout className="bg-base">
            <View className="flex-1 items-center justify-center px-6">
                <View className="bg-red-50 p-6 rounded-full mb-6">
                    <AlertTriangle size={40} color="#ef4444" />
                </View>
                <Text className="text-2xl font-bold text-slate-900 mb-2">Hata Oluştu</Text>
                <Text className="text-slate-500 text-center mb-8">{error}</Text>
                <TouchableOpacity
                    onPress={loadStats}
                    className="bg-slate-900 w-full py-4 rounded-2xl items-center"
                >
                    <Text className="text-white font-bold text-lg">Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );

    // --- DURUM 3: BAŞARILI DURUM (Veri var veya Henüz soru çözülmemiş) ---
    return (
        <ScreenLayout className="bg-base">
            <View className="px-6 pt-4 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">İstatistikler</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gerçek zamanlı performans analizin.</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
            >
                {performanceData.totalQuestions === 0 ? (
                    /* DURUM 3A: BOŞ DURUM (Henüz soru çözülmemişse) */
                    <View className="px-6 mt-16 items-center justify-center">
                        <View className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-full mb-4">
                            <Info size={32} color={isDarkMode ? "#3b82f6" : "#2563eb"} />
                        </View>
                        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Henüz Veri Yok</Text>
                        <Text className="text-center text-slate-500 dark:text-slate-400 mb-6">
                            İstatistiklerini görebilmek için önce birkaç test çözmelisin.
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/quizzes');
                            }}
                            className="bg-blue-600 px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-bold">Soru Çözmeye Başla</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* DURUM 3B: DOLU DURUM (İstatistikler) */
                    <>
                        <View className="px-6 mt-6 flex-row flex-wrap justify-between gap-y-4">
                            <StatCard icon={Target} label="Toplam Soru" value={performanceData.totalQuestions.toString()} color="#3b82f6" bgColor="bg-blue-50" />
                            <StatCard icon={TrendingUp} label="Genel Başarı" value={`%${performanceData.successRate}`} color="#10b981" bgColor="bg-emerald-50" />
                            <StatCard icon={Clock} label="Çözülen Sınav" value={performanceData.totalExams.toString()} color="#f59e0b" bgColor="bg-amber-50" />
                            <StatCard icon={Zap} label="Doğru Sayısı" value={performanceData.correctAnswers.toString()} color="#8b5cf6" bgColor="bg-purple-50" />
                        </View>

                        <View className="px-6 mt-8">
                            <Text className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Konu Performansı</Text>

                            <View className="relative">
                                {/* İçerik */}
                                <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-6 overflow-hidden">
                                    {performanceData.categories.map((cat, i) => (
                                        <View key={`${cat.id}-${i}`}>
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-slate-900 dark:text-slate-100 font-bold text-xs">{cat.name}</Text>
                                                <Text className="font-bold text-xs text-slate-500 dark:text-slate-400">%{cat.rate}</Text>
                                            </View>
                                            <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <View className={`h-full rounded-full ${cat.rate >= 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${cat.rate}%` }} />
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Kilit Katmanı */}
                                {!isPro && (
                                    <>
                                        <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} className="absolute inset-0 z-10 rounded-3xl overflow-hidden" />
                                        <View className="absolute inset-0 z-20 items-center justify-center p-4">
                                            <View className="bg-white/90 dark:bg-slate-900/90 px-6 py-4 rounded-3xl items-center shadow-lg border border-slate-100 dark:border-slate-800 w-full">
                                                <View className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-full items-center justify-center mb-2">
                                                    <AlertCircle size={24} color="#d97706" />
                                                </View>
                                                <Text className="text-slate-900 dark:text-slate-50 font-bold text-base mb-1">Pro Analiz</Text>
                                                <Text className="text-slate-500 text-xs text-center mb-4 leading-5">
                                                    Hangi konularda eksiğin olduğunu görmek için premium paketine geç.
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        router.push('/premium');
                                                    }}
                                                    className="bg-slate-900 px-6 py-2.5 rounded-full"
                                                >
                                                    <Text className="text-white text-xs font-bold">Kilidi Aç</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        <View className="px-6 mt-8">
                            <Text className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Yapay Zeka Analizi</Text>

                            <View className="relative">
                                {/* İçerik */}
                                <View className="overflow-hidden rounded-2xl">
                                    {performanceData.successRate < 70 ? (
                                        <View className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex-row items-start">
                                            <AlertCircle size={20} color="#ef4444" className="mr-3 mt-0.5" />
                                            <View className="flex-1">
                                                <Text className="text-red-900 dark:text-red-400 font-bold text-sm mb-1">Gelişmen Gerekiyor</Text>
                                                <Text className="text-red-800/80 dark:text-red-400/80 text-xs leading-5">
                                                    Başarı oranın barajın altında. Özellikle düşük performans gösterdiğin konulara tekrar göz atmalısın.
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex-row items-start">
                                            <CheckCircle2 size={20} color="#10b981" className="mr-3 mt-0.5" />
                                            <View className="flex-1">
                                                <Text className="text-emerald-900 dark:text-emerald-400 font-bold text-sm mb-1">Harika Gidiyorsun!</Text>
                                                <Text className="text-emerald-800/80 dark:text-emerald-400/80 text-xs leading-5">
                                                    Mevcut performansın gerçek sınavı geçmek için yeterli görünüyor. İstikrarını koru!
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Kilit Katmanı */}
                                {!isPro && (
                                    <>
                                        <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} className="absolute inset-0 z-10 rounded-3xl overflow-hidden" />
                                        <View className="absolute inset-0 z-20 items-center justify-center p-2">
                                            <View className="bg-white/90 dark:bg-slate-900/90 px-6 py-4 rounded-3xl items-center shadow-lg border border-slate-100 dark:border-slate-800 w-full flex-row">
                                                <View className="bg-amber-100 dark:bg-amber-900/30 w-10 h-10 rounded-full items-center justify-center mr-3">
                                                    <Zap size={20} color="#d97706" />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-slate-900 dark:text-slate-50 font-bold text-[13px] mb-0.5">Yapay Zeka Raporu</Text>
                                                    <TouchableOpacity onPress={() => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        router.push('/premium');
                                                    }}>
                                                        <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">Premium Edin →</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </ScreenLayout>
    );
}

interface StatCardProps {
    icon: any;
    label: string;
    value: string;
    color: string;
    bgColor: string;
}

const StatCard = ({ icon: Icon, label, value, color, bgColor }: StatCardProps) => (
    <View className="w-[48%] bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <View className={`${bgColor} dark:bg-opacity-10 self-start p-2 rounded-lg mb-3`}>
            <Icon size={18} color={color} />
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">{label}</Text>
    </View>
);

const StatisticsSkeleton = () => {
    const { isDarkMode, colorScheme } = useThemeMode();
    
    return (
        <ScreenLayout className="bg-base">
            <View className="px-6 pt-4 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <View className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                <View className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </View>

            <View className="px-6 mt-6 flex-row flex-wrap justify-between gap-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="w-[48%] bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <View className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3 animate-pulse" />
                        <View className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-1 animate-pulse" />
                        <View className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </View>
                ))}
            </View>

            <View className="px-6 mt-8">
                <View className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4 animate-pulse" />
                <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i}>
                            <View className="flex-row justify-between mb-2">
                                <View className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                <View className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            </View>
                            <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <View className="h-full bg-slate-200 dark:bg-slate-700 w-1/2 animate-pulse rounded-full" />
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            <View className="px-6 mt-8">
                <View className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4 animate-pulse" />
                <View className="h-[88px] w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            </View>
        </ScreenLayout>
    );
};