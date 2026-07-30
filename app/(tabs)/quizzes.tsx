import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    FileText, Star, AlertTriangle, ChevronRight,
    Trophy, Clock, Zap, CheckCircle2, Lock, Unlock, Play
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchExamsWithProgress, fetchSmartTestCounts } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { usePremiumAccess } from '../../src/hooks/usePremiumAccess';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { adService } from '../../src/services/adService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function QuizzesScreen() {
    const router = useRouter();
    const isPremium = useSubscriptionStore(state => state.isPremium);
    const { isDarkMode } = useThemeMode();

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [exams, setExams] = useState<any[]>([]);
    const [counts, setCounts] = useState({ wrongCount: 0, favoriteCount: 0 });

    const { checkAccess } = usePremiumAccess();
    const addCredits = useSubscriptionStore(state => state.addCredits);

    // ─── LOCAL CACHE (3 dakika) ────────────────────────────────────────
    const cacheRef = useRef<{
        exams: any[];
        counts: { wrongCount: number; favoriteCount: number };
        timestamp: number;
    } | null>(null);
    const CACHE_TTL_MS = 3 * 60 * 1000; // 3 dakika

    const triggerRandomAd = () => {
        const adShown = adService.showRewarded(() => {
            addCredits(3);
            Alert.alert("Tebrikler!", "3 Kredi kazandınız.");
        });
        if (!adShown) Alert.alert("Bilgi", "Video reklam henüz yüklenmedi, lütfen birkaç saniye sonra tekrar deneyin.");
    };

    const handlePremiumExam = async (examId: string, title: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isPremium) {
            router.push({ pathname: '/quiz/[id]', params: { id: examId } });
            return;
        }
        const isUnlockedStr = await AsyncStorage.getItem(`@unlocked_exam_${examId}`);
        if (isUnlockedStr === 'true') {
            router.push({ pathname: '/quiz/[id]', params: { id: examId } });
            return;
        }
        checkAccess({
            onSuccess: async () => {
                await AsyncStorage.setItem(`@unlocked_exam_${examId}`, 'true');
                router.push({ pathname: '/quiz/[id]', params: { id: examId } });
            },
            featureName: title,
            onAdRequired: triggerRandomAd,
            creditCost: 6
        });
    };



    const loadData = async (forceRefresh = false) => {
        // Cache geçerliyse Supabase'e gitme, direk local veriden dön
        if (
            !forceRefresh &&
            cacheRef.current &&
            Date.now() - cacheRef.current.timestamp < CACHE_TTL_MS
        ) {
            setExams(cacheRef.current.exams);
            setCounts(cacheRef.current.counts);
            setIsLoading(false);
            return;
        }

        try {
            setHasError(false);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [examsData, smartCounts] = await Promise.all([
                    fetchExamsWithProgress(user.id),
                    fetchSmartTestCounts(user.id)
                ]);
                const examsArray = Array.isArray(examsData) ? examsData : [];
                const unlockedKeys = examsArray.map((e: any) => `@unlocked_exam_${e.id}`);
                let unlockedMap: Record<string, string | null> = {};
                if (unlockedKeys.length > 0) {
                    const vals = await AsyncStorage.multiGet(unlockedKeys);
                    unlockedMap = Object.fromEntries(vals);
                }
                const enrichedExams = examsArray.map((e: any) => ({
                    ...e,
                    isUnlocked: unlockedMap[`@unlocked_exam_${e.id}`] === 'true'
                }));
                const newCounts = smartCounts || { wrongCount: 0, favoriteCount: 0 };

                // Cache'e kaydet
                cacheRef.current = {
                    exams: enrichedExams,
                    counts: newCounts,
                    timestamp: Date.now(),
                };

                setExams(enrichedExams);
                setCounts(newCounts);
            }
        } catch (e) {
            setHasError(true);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));
    const onRefresh = useCallback(() => { setRefreshing(true); loadData(true); }, []);

    const firstUncompletedIndex = exams.findIndex(e => (Number(e.progress_percentage) || 0) < 100);
    const featuredIndex = firstUncompletedIndex !== -1 ? firstUncompletedIndex : 0;
    const featuredExam = exams.length > 0 ? exams[featuredIndex] : null;
    const regularExams = exams.filter((_, i) => i !== featuredIndex);

    // ─── ERROR STATE ───
    if (hasError) return (
        <ScreenLayout className="bg-base">
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-[20px] items-center justify-center mb-4">
                    <AlertTriangle size={28} color="#ef4444" />
                </View>
                <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">Bir sorun oluştu</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 text-[14px]">Sınav verileri yüklenemedi. Lütfen tekrar dene.</Text>
                <TouchableOpacity onPress={() => { setIsLoading(true); loadData(); }} className="bg-blue-600 px-8 py-4 rounded-2xl">
                    <Text className="text-white font-bold text-[15px]">Yeniden Yükle</Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );

    return (
        <ScreenLayout className="bg-base">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {isLoading ? (
                // ─── SKELETON ───
                <View className="px-6 pt-4">
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <View className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                            <View className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                        </View>
                        <View className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    </View>
                    <View className="flex-row gap-x-3 mb-6">
                        <View className="flex-1 h-24 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                        <View className="flex-1 h-24 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                    </View>
                    <View className="h-48 w-full bg-slate-100 dark:bg-slate-800 rounded-[28px] mb-4" />
                    <View className="h-20 w-full bg-slate-100 dark:bg-slate-800 rounded-[24px] mb-3" />
                    <View className="h-20 w-full bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* ─── HEADER ─── */}
                    <View className="px-6 py-2 flex-row justify-between items-center mt-2 mb-5">
                        <View>
                            <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                Hazırlık Merkezi
                            </Text>
                            <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Sınavlar
                            </Text>
                        </View>
                        <View className="w-11 h-11 bg-blue-600 rounded-full items-center justify-center">
                            <FileText size={20} color="white" />
                        </View>
                    </View>

                    {/* ─── HIZLI AKSIYONLAR ─── */}
                    <View className="px-6 mb-5">
                        <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Kısayollar</Text>
                        <View className="flex-row gap-x-3">
                            {/* Hatalarım */}
                            <TouchableOpacity
                                activeOpacity={0.6}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    if ((counts?.wrongCount || 0) > 0) {
                                        checkAccess({
                                            onSuccess: () => router.push('/quiz/mistakes'),
                                            featureName: 'Hatalarım',
                                            onAdRequired: triggerRandomAd,
                                            creditCost: 2
                                        });
                                    } else {
                                        Alert.alert("Bilgi", "Henüz hata yaptığınız soru bulunmuyor.");
                                    }
                                }}
                                className="flex-1 bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/30 dark:shadow-none"
                            >
                                <View className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-2xl items-center justify-center mb-2">
                                    <AlertTriangle size={20} color="#f43f5e" />
                                </View>
                                <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hatalarım</Text>
                                <Text className="text-[10px] font-black text-rose-500 mt-0.5">{counts?.wrongCount || 0} soru</Text>
                            </TouchableOpacity>

                            {/* Favoriler */}
                            <TouchableOpacity
                                activeOpacity={0.6}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    if ((counts?.favoriteCount || 0) > 0) {
                                        checkAccess({
                                            onSuccess: () => router.push('/quiz/favorites'),
                                            featureName: 'Favoriler',
                                            onAdRequired: triggerRandomAd,
                                            creditCost: 2
                                        });
                                    } else {
                                        Alert.alert("Bilgi", "Favorilere eklediğiniz soru bulunmuyor.");
                                    }
                                }}
                                className="flex-1 bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/30 dark:shadow-none"
                            >
                                <View className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-2xl items-center justify-center mb-2">
                                    <Star size={20} color="#f59e0b" />
                                </View>
                                <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Favoriler</Text>
                                <Text className="text-[10px] font-black text-amber-500 mt-0.5">{counts?.favoriteCount || 0} soru</Text>
                            </TouchableOpacity>

                            {/* Hızlı Pratik */}
                            <TouchableOpacity
                                activeOpacity={0.6}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/quiz/quick' as any);
                                }}
                                className="flex-1 bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/30 dark:shadow-none"
                            >
                                <View className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl items-center justify-center mb-2">
                                    <Zap size={20} color="#2563eb" />
                                </View>
                                <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hızlı</Text>
                                <Text className="text-[10px] font-black text-blue-500 mt-0.5">10 soru</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ─── ÖNCÜ SINAV (HERO CARD) ─── */}
                    {featuredExam && (
                        <View className="px-6 mb-5">
                            <View className="flex-row items-center mb-3">
                                <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                                <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kaldığın Yerden Devam</Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => featuredExam?.id && handlePremiumExam(featuredExam.id, featuredExam.title || "Sınav")}
                                className="bg-blue-600 dark:bg-slate-900 rounded-[28px] p-6 relative overflow-hidden shadow-xl shadow-blue-600/20 border border-blue-500/50 dark:border-slate-800"
                            >
                                {/* Arka plan ikonu */}
                                <View className="absolute right-[-10] bottom-[-20] opacity-10 rotate-12">
                                    <Trophy size={150} color="#ffffff" />
                                </View>

                                {/* Kilit/Açık badge */}
                                {!isPremium && !featuredExam?.isUnlocked && (
                                    <View className="absolute top-5 right-5 z-20 bg-black/30 p-2 rounded-full border border-white/10">
                                        <Lock size={14} color="#fbbf24" />
                                    </View>
                                )}
                                {!isPremium && featuredExam?.isUnlocked && (
                                    <View className="absolute top-5 right-5 z-20 bg-emerald-500/20 p-2 rounded-full border border-emerald-500/20">
                                        <Unlock size={14} color="#10b981" />
                                    </View>
                                )}

                                <View className="relative z-10">
                                    <View className="bg-white/20 dark:bg-blue-500/20 self-start px-2.5 py-1 rounded-lg mb-4 border border-white/20 dark:border-blue-400/30">
                                        <Text className="text-white dark:text-blue-400 text-[10px] font-black tracking-widest uppercase">
                                            {featuredExam?.category || 'Özel Deneme'}
                                        </Text>
                                    </View>

                                    <Text className="text-white text-[24px] font-black tracking-tight mb-1 leading-8" numberOfLines={2}>
                                        {featuredExam?.title || 'Genel Tarama Testi'}
                                    </Text>

                                    <View className="flex-row items-center mb-6">
                                        <Clock size={13} color="rgba(255,255,255,0.6)" />
                                        <Text className="text-white/60 text-[12px] font-medium ml-1.5 mr-4">{featuredExam?.duration_minutes || 45} dk</Text>
                                        <FileText size={13} color="rgba(255,255,255,0.6)" />
                                        <Text className="text-white/60 text-[12px] font-medium ml-1.5">50 soru</Text>
                                    </View>

                                    {/* Progress bar */}
                                    {(Number(featuredExam?.progress_percentage) || 0) > 0 && (
                                        <View className="mb-5">
                                            <View className="flex-row justify-between mb-1.5">
                                                <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">İlerleme</Text>
                                                <Text className="text-white text-[11px] font-black">%{Number(featuredExam?.progress_percentage) || 0}</Text>
                                            </View>
                                            <View className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                                <View
                                                    className="h-full bg-white rounded-full"
                                                    style={{ width: `${Math.min(100, Number(featuredExam?.progress_percentage) || 0)}%` }}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    <View className="bg-white dark:bg-blue-600 self-start px-5 py-3 rounded-xl flex-row items-center shadow-sm">
                                        <Text className="text-blue-700 dark:text-white font-bold text-[14px] mr-2">
                                            {(Number(featuredExam?.progress_percentage) || 0) > 0 ? 'Devam Et' : 'Başla'}
                                        </Text>
                                        <ChevronRight size={16} color={isDarkMode ? "#ffffff" : "#1d4ed8"} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ─── SINAV LİSTESİ ─── */}
                    <View className="px-6">
                        {regularExams.length > 0 && (
                            <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Tüm Sınavlar</Text>
                        )}
                        {regularExams.length > 0 ? (
                            regularExams.map((exam, index) => {
                                if (!exam) return null;
                                const progress = Number(exam?.progress_percentage) || 0;
                                const isCompleted = progress >= 100;
                                const isStarted = progress > 0 && progress < 100;

                                return (
                                    <TouchableOpacity
                                        key={exam.id || `exam-${index}`}
                                        activeOpacity={0.7}
                                        onPress={() => exam.id && handlePremiumExam(exam.id, exam.title || "Sınav")}
                                        className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 flex-row items-center shadow-sm shadow-slate-200/40 dark:shadow-none mb-3 relative"
                                    >
                                        <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                            {isCompleted
                                                ? <CheckCircle2 size={22} color="#10b981" />
                                                : <FileText size={22} color={isDarkMode ? "#475569" : "#94a3b8"} />
                                            }
                                        </View>

                                        <View className="flex-1 pr-6">
                                            <Text className="text-slate-900 dark:text-white font-bold text-[14px] mb-1" numberOfLines={1}>
                                                {exam?.title || 'Sınav'}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                    {exam?.category || 'Genel'}
                                                </Text>
                                                {isStarted && (
                                                    <>
                                                        <View className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-2" />
                                                        <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">Devam Ediyor</Text>
                                                    </>
                                                )}
                                            </View>
                                            {isStarted && (
                                                <View className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                                                    <View className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                                                </View>
                                            )}
                                        </View>

                                        <View className="w-7 h-7 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center">
                                            <ChevronRight size={14} color={isDarkMode ? "#475569" : "#cbd5e1"} />
                                        </View>

                                        {!isPremium && !exam?.isUnlocked && (
                                            <View className="absolute top-4 right-12 bg-amber-50 dark:bg-amber-900/20 p-1 rounded-full">
                                                <Lock size={11} color="#f59e0b" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            !featuredExam && (
                                <View className="items-center py-16">
                                    <Trophy size={40} color={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                                    <Text className="text-slate-400 dark:text-slate-500 font-bold text-center mt-3 text-sm">Sınav bulunamadı.</Text>
                                </View>
                            )
                        )}
                    </View>
                </ScrollView>
            )}
        </ScreenLayout>
    );
}
