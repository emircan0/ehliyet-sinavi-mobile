import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
    FileText, Star, AlertTriangle, ChevronRight,
    Trophy, Clock, Zap, Crown, CheckCircle2, Lock, Unlock
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchExamsWithProgress, fetchSmartTestCounts } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { usePremiumAccess } from '../../src/hooks/usePremiumAccess';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { adService } from '../../src/services/adService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function QuizzesScreen() {
    const router = useRouter();
    const isPremium = useSubscriptionStore(state => state.isPremium);
    const { isDarkMode, colorScheme } = useThemeMode();

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [exams, setExams] = useState<any[]>([]);
    const [counts, setCounts] = useState({ wrongCount: 0, favoriteCount: 0 });

    const { checkAccess } = usePremiumAccess();
    const addCredits = useSubscriptionStore(state => state.addCredits);

    const triggerRandomAd = () => {
        const adShown = adService.showRewarded(() => {
            addCredits(3);
            Alert.alert("Tebrikler!", "3 Kredi kazandınız.");
        });
        
        if (!adShown) {
            Alert.alert("Bilgi", "Video reklam henüz yüklenmedi, lütfen birkaç saniye sonra tekrar deneyin.");
        }
    };

    const handlePremiumExam = async (examId: string, title: string) => {
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

    const loadData = async () => {
        try {
            setHasError(false);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [examsData, smartCounts] = await Promise.all([
                    fetchExamsWithProgress(user.id),
                    fetchSmartTestCounts(user.id)
                ]);
                const examsArray = Array.isArray(examsData) ? examsData : [];
                
                // Fetch unlock statuses from AsyncStorage
                const unlockedKeys = examsArray.map(e => `@unlocked_exam_${e.id}`);
                let unlockedMap: Record<string, string | null> = {};
                if (unlockedKeys.length > 0) {
                    const unlockedValues = await AsyncStorage.multiGet(unlockedKeys);
                    unlockedMap = Object.fromEntries(unlockedValues);
                }
                
                const examsWithUnlock = examsArray.map(e => ({
                    ...e,
                    isUnlocked: unlockedMap[`@unlocked_exam_${e.id}`] === 'true'
                }));

                setExams(examsWithUnlock);
                setCounts(smartCounts || { wrongCount: 0, favoriteCount: 0 });
            }
        } catch (error) {
            console.error("Sınavlar yüklenirken hata:", error);
            setHasError(true);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    // Sınavları basitçe ikiye ayırıyoruz: İlki öne çıkan, kalanı liste.
    const featuredExam = exams.length > 0 ? exams[0] : null;
    const regularExams = exams.length > 1 ? exams.slice(1) : [];

    if (hasError) {
        return (
            <ScreenLayout className="bg-base">
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full items-center justify-center mb-6">
                        <AlertTriangle size={32} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Eyvah, bir sorun oluştu!</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-center mb-8">Sınav verilerini işlerken bir hatayla karşılaştık. Lütfen tekrar dene.</Text>
                    <TouchableOpacity
                        onPress={() => { setIsLoading(true); loadData(); }}
                        className="bg-blue-600 px-8 py-4 rounded-2xl"
                    >
                        <Text className="text-white font-bold text-[15px]">Yeniden Yükle</Text>
                    </TouchableOpacity>
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout className="bg-base">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {isLoading ? (
                <View className="px-6 pt-4 pb-6">
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <View className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-3 animate-pulse" />
                            <View className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </View>
                        <View className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                    </View>
                    <View className="h-64 w-full bg-slate-100 dark:bg-slate-800 rounded-[32px] mb-8 animate-pulse" />
                    <View className="flex-row gap-4 mb-10">
                        <View className="h-[140px] flex-1 bg-slate-100 dark:bg-slate-800 rounded-[28px] animate-pulse" />
                        <View className="h-[140px] flex-1 bg-slate-100 dark:bg-slate-800 rounded-[28px] animate-pulse" />
                    </View>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={isDarkMode ? "#ffffff" : "#000000"}
                        />
                    }
                >
                    {/* Header */}
                    <View className="px-6 pt-4 pb-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-[12px] font-black text-blue-600 dark:text-[#0A84FF] uppercase tracking-widest mb-1">Hazırlık Merkezi</Text>
                                <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sınavlar</Text>
                            </View>
                            <View className="w-12 h-12 bg-blue-50 dark:bg-[#0A84FF]/10 rounded-2xl items-center justify-center border border-blue-100 dark:border-[#0A84FF]/20">
                                <FileText size={24} color={isDarkMode ? "#0A84FF" : "#2563eb"} />
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <QuickActionCard
                                title="Hatalarım"
                                count={counts?.wrongCount || 0}
                                icon={AlertTriangle}
                                color={isDarkMode ? "#FF453A" : "#ef4444"}
                                bg="bg-red-50 dark:bg-[#FF453A]/10"
                                onPress={() => {
                                    if ((counts?.wrongCount || 0) > 0) {
                                        router.push('/quiz/mistakes');
                                    } else {
                                        Alert.alert("Bilgi", "Henüz hata yaptığınız soru bulunmuyor.");
                                    }
                                }}
                            />
                            <QuickActionCard
                                title="Favoriler"
                                count={counts?.favoriteCount || 0}
                                icon={Star}
                                color={isDarkMode ? "#FF9F0A" : "#f59e0b"}
                                bg="bg-amber-50 dark:bg-[#FF9F0A]/10"
                                onPress={() => {
                                    if ((counts?.favoriteCount || 0) > 0) {
                                        router.push('/quiz/favorites');
                                    } else {
                                        Alert.alert("Bilgi", "Favorilere eklediğiniz soru bulunmuyor.");
                                    }
                                }}
                            />
                        </View>
                    </View>

                    {/* Featured Exam Section (Hero Card Tasarımına Uyarlanmış) */}
                    {featuredExam && (
                        <View className="px-6 mb-8">
                            <View className="flex-row justify-between items-end mb-4 px-1">
                                <View>
                                    <Text className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-[2px] mb-1">
                                        SON ÇÖZÜLEN SINAV
                                    </Text>
                                    <Text className="text-slate-900 dark:text-slate-50 font-extrabold text-2xl tracking-tight">
                                        Kaldığın Yerden Devam
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    if (featuredExam?.id) {
                                        handlePremiumExam(featuredExam.id, featuredExam.title || "Özel Sınav");
                                    }
                                }}
                                className={`bg-slate-900 rounded-[32px] p-6 relative overflow-hidden shadow-2xl shadow-slate-900/30 ${!isPremium && !featuredExam?.isUnlocked ? 'opacity-90' : ''}`}
                            >
                                {!isPremium && !featuredExam?.isUnlocked && (
                                    <View className="absolute top-5 right-5 z-20 bg-black/40 p-2.5 rounded-full border border-white/10 backdrop-blur-md">
                                        <Lock size={16} color="#f59e0b" />
                                    </View>
                                )}
                                {!isPremium && featuredExam?.isUnlocked && (
                                    <View className="absolute top-5 right-5 z-20 bg-emerald-500/20 p-2.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
                                        <Unlock size={16} color="#10b981" />
                                    </View>
                                )}
                                
                                {/* Arka Plan Efektleri (Blur) */}
                                <View className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full" />
                                <View className="absolute right-12 -bottom-12 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />

                                <View className="relative z-10">
                                    {/* Üst Rozet */}
                                    <View className="bg-white/10 self-start px-3 py-1.5 rounded-xl border border-white/10 mb-5 flex-row items-center">
                                        <Zap size={12} color="#fbbf24" fill="#fbbf24" className="mr-1.5" />
                                        <Text className="text-amber-300 text-[10px] font-black tracking-widest uppercase">
                                            {featuredExam?.category || 'ÖZEL DENEME'}
                                        </Text>
                                    </View>

                                    {/* Başlık ve Alt Bilgi */}
                                    <Text className="text-white text-[28px] font-black tracking-tight mb-3 leading-8" numberOfLines={2}>
                                        {featuredExam?.title || "Genel Tarama Testi"}
                                    </Text>

                                    <View className="flex-row items-center mb-8">
                                        <Clock size={14} color="#94a3b8" />
                                        <Text className="text-slate-400 text-[13px] font-medium ml-1.5 mr-4">
                                            {featuredExam?.duration_minutes || 45} Dk
                                        </Text>
                                        <FileText size={14} color="#94a3b8" />
                                        <Text className="text-slate-400 text-[13px] font-medium ml-1.5">
                                            50 Soru
                                        </Text>
                                    </View>

                                    {/* Alt Kısım: İlerleme ve Aksiyon Butonu */}
                                    <View className="flex-row items-end justify-between mt-2">

                                        {/* İlerleme Çubuğu */}
                                        <View className="flex-1 mr-5 mb-1">
                                            {(Number(featuredExam?.progress_percentage) || 0) > 0 ? (
                                                <View>
                                                    <View className="flex-row justify-between mb-2">
                                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">İlerleme</Text>
                                                        <Text className="text-white text-[11px] font-black">%{(Number(featuredExam?.progress_percentage) || 0)}</Text>
                                                    </View>
                                                    <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <View
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.min(100, Math.max(0, Number(featuredExam?.progress_percentage) || 0))}%` }}
                                                        />
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text className="text-slate-400 text-[13px] font-medium italic">Henüz başlanmadı</Text>
                                            )}
                                        </View>

                                        <View className={`self-start p-1.5 pl-5 pr-1.5 rounded-full flex-row items-center shadow-lg ${!isPremium ? 'bg-amber-600 shadow-amber-600/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
                                            <Text className="text-white font-bold text-sm mr-4">
                                                {(Number(featuredExam?.progress_percentage) || 0) > 0 ? 'Devam Et' : 'Başla'}
                                            </Text>
                                            <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
                                                <ChevronRight size={18} color="white" />
                                            </View>
                                        </View>

                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Exam List */}
                    <View className="px-6 gap-3">
                        {regularExams.length > 0 ? (
                            regularExams.map((exam, index) => {
                                if (!exam) return null;
                                return (
                                    <ExamListItem
                                        key={exam.id || `exam-${index}`}
                                        exam={exam}
                                        isPremium={isPremium}
                                        onPress={() => {
                                            if (exam.id) {
                                                handlePremiumExam(exam.id, exam.title || "Sınav");
                                            }
                                        }}
                                    />
                                );
                            })
                        ) : (
                            <View className="items-center py-20 px-10">
                                <Trophy size={48} color={isDarkMode ? "#1e293b" : "#e2e8f0"} className="mb-4" />
                                <Text className="text-slate-400 dark:text-slate-500 font-bold text-center">
                                    Sınav bulunamadı.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

        </ScreenLayout>
    );
}

const QuickActionCard = ({ title, count, icon: Icon, color, bg, onPress }: any) => (
    <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-100 dark:shadow-none"
    >
        <View className={`${bg} self-start p-2 rounded-xl mb-3`}>
            <Icon size={18} color={color} />
        </View>
        <Text className="text-slate-900 dark:text-white font-extrabold text-[15px] mb-1">{title}</Text>
        <Text className="text-slate-400 dark:text-white/50 text-[11px] font-bold uppercase tracking-wider">{count} Soru</Text>
    </TouchableOpacity>
);

const ExamListItem = ({ exam, isPremium, onPress }: any) => {
    const { isDarkMode, colorScheme } = useThemeMode();

    const progress = Number(exam?.progress_percentage) || 0;
    const safeProgress = isNaN(progress) ? 0 : progress;

    const isCompleted = safeProgress >= 100;
    const isStarted = safeProgress > 0 && safeProgress < 100;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 flex-row items-center relative shadow-sm shadow-slate-100 dark:shadow-none mb-3"
        >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                {isCompleted ? <CheckCircle2 size={24} color={isDarkMode ? "#10b981" : "#10b981"} /> : <FileText size={24} color={isDarkMode ? "#475569" : "#94a3b8"} />}
            </View>

            <View className="flex-1 pr-8">
                <Text className="text-slate-900 dark:text-white font-bold text-base mb-1" numberOfLines={1}>{exam?.title || 'Sınav'}</Text>

                <View className="flex-row items-center">
                    <Text className="text-slate-400 dark:text-white/50 text-[10px] font-black uppercase tracking-widest">{exam?.category || 'Genel'}</Text>
                    {isStarted && (
                        <>
                            <View className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-2" />
                            <Text className="text-blue-600 dark:text-[#0A84FF] text-[10px] font-black uppercase tracking-widest">Devam Ediyor</Text>
                        </>
                    )}
                </View>

                {isStarted && (
                    <View className="h-1 w-full bg-slate-50 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <View className="h-full bg-blue-500 dark:bg-blue-600 rounded-full" style={{ width: `${Math.min(100, Math.max(0, safeProgress))}%` }} />
                    </View>
                )}
            </View>

            <View className="bg-slate-50 dark:bg-slate-800 w-8 h-8 rounded-full items-center justify-center">
                <ChevronRight size={16} color={isDarkMode ? "#475569" : "#cbd5e1"} />
            </View>

            {!isPremium && !exam?.isUnlocked && (
                <View className="absolute top-4 right-4 bg-slate-900/5 dark:bg-white/5 p-1.5 rounded-full">
                    <Lock size={12} color="#f59e0b" />
                </View>
            )}
            {!isPremium && exam?.isUnlocked && (
                <View className="absolute top-4 right-4 bg-emerald-500/10 dark:bg-emerald-500/10 p-1.5 rounded-full">
                    <Unlock size={12} color="#10b981" />
                </View>
            )}
            
        </TouchableOpacity>
    );
};
