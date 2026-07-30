import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    TrendingUp, Clock, Target, Zap,
    AlertCircle, CheckCircle2, AlertTriangle, Lock,
    BarChart3, Award, BookOpen, ArrowRight, ChevronRight, Trophy
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';
import { fetchUserStats } from '../../src/api/queries';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { purchaseService } from '../../src/services/purchaseService';
import * as Haptics from 'expo-haptics';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremiumAccess } from '../../src/hooks/usePremiumAccess';
import { adService } from '../../src/services/adService';

// ─── CONSTANTS ───────────────────────────────────────────────────────
const CATEGORIES = [
    { id: 'trafik',    name: 'Trafik ve Çevre', short: 'Trafik',    color: '#2563eb', light: '#eff6ff', darkBg: '#1e3a5f' },
    { id: 'motor',     name: 'Araç Tekniği',    short: 'Motor',     color: '#f59e0b', light: '#fffbeb', darkBg: '#451a03' },
    { id: 'ilkyardim', name: 'İlk Yardım',      short: 'İlk Yardım',color: '#ef4444', light: '#fff1f2', darkBg: '#4c0519' },
    { id: 'adap',      name: 'Trafik Adabı',    short: 'Adap',      color: '#8b5cf6', light: '#f5f3ff', darkBg: '#2e1065' },
];

const GENERAL_EVALUATION_ACCESS_KEY = '@general_evaluation_access_date';
const GENERAL_EVALUATION_CREDIT_COST = 3;

// ─── GRADE HELPER ────────────────────────────────────────────────────
function getGrade(rate: number): { label: string; color: string; emoji: string } {
    if (rate >= 90) return { label: 'Mükemmel',    color: '#059669', emoji: '🏆' };
    if (rate >= 75) return { label: 'Çok İyi',     color: '#10b981', emoji: '🎯' };
    if (rate >= 60) return { label: 'İyi',          color: '#2563eb', emoji: '📈' };
    if (rate >= 45) return { label: 'Gelişiyor',   color: '#f59e0b', emoji: '💪' };
    return { label: 'Çalışma Gerekli', color: '#ef4444', emoji: '⚠️' };
}

function getAIComment(rate: number, total: number, exams: number): string {
    if (total === 0) return "Henüz soru çözülmedi. Hadi başlayalım!";
    if (rate >= 90) return `${total} soruda %${rate} başarı — olağanüstü bir performans! Sınav sana göre.`;
    if (rate >= 75) return `%${rate} ortalama ve ${exams} sınav çözülmüş. Son düzeltmelerle sınavı rahat geçersin.`;
    if (rate >= 60) return `${total} soruda %${rate} başarı. İyi temeller kurulmuş ama zayıf konulara odaklanmak gerekiyor.`;
    if (rate >= 45) return `%${rate} başarıyla henüz geçme barajının altındasın (%70). Düzenli çalışmayla bu hızla yakında geçersin!`;
    return `%${rate} başarı oranı, geçme barajının çok altında. Düzenli ve planlı çalışma şart — bugün başlamak için iyi bir gün!`;
}

// ─── DONUT CHART (Success Rate) ──────────────────────────────────────
function DonutCircle({ rate, color }: { rate: number; color: string }) {
    const SIZE = 110;
    const STROKE = 10;
    const R = (SIZE - STROKE) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * R;
    const progress = ((100 - rate) / 100) * CIRCUMFERENCE;

    return (
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG yerine basit View ile yaklaşım */}
            <View
                style={{
                    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
                    borderWidth: STROKE, borderColor: '#f1f5f9',
                    position: 'absolute',
                }}
            />
            {/* Colored arc simulation via border */}
            <View
                style={{
                    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
                    borderWidth: STROKE,
                    borderColor: 'transparent',
                    borderTopColor: color,
                    borderRightColor: rate > 25 ? color : 'transparent',
                    borderBottomColor: rate > 50 ? color : 'transparent',
                    borderLeftColor: rate > 75 ? color : 'transparent',
                    position: 'absolute',
                    transform: [{ rotate: '-90deg' }],
                }}
            />
            <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color, lineHeight: 26 }}>%{rate}</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 }}>BAŞARI</Text>
            </View>
        </View>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function StatisticsScreen() {
    const router = useRouter();
    const isPremium = useSubscriptionStore(state => state.isPremium);
    const checkSubscriptionStatus = useSubscriptionStore(state => state.checkSubscriptionStatus);
    const addCredits = useSubscriptionStore(state => state.addCredits);
    const { checkAccess } = usePremiumAccess();
    const { isDarkMode } = useThemeMode();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isGeneralEvaluationUnlocked, setIsGeneralEvaluationUnlocked] = useState(false);
    // Tracks whether initial data has been loaded (to suppress skeleton on re-focus)
    const hasLoadedRef = useRef(false);

    const getTodayKey = () => new Date().toISOString().slice(0, 10);

    const triggerRewardedCreditAd = () => {
        const adShown = adService.showRewarded(() => {
            addCredits(3);
            Alert.alert("Tebrikler!", "3 Kredi kazandınız.");
        });
        if (!adShown) Alert.alert("Bilgi", "Video reklam henüz yüklenmedi.");
    };

    const unlockGeneralEvaluation = async () => {
        await AsyncStorage.setItem(GENERAL_EVALUATION_ACCESS_KEY, getTodayKey());
        setIsGeneralEvaluationUnlocked(true);
    };

    const openGeneralEvaluation = () => {
        checkAccess({
            onSuccess: unlockGeneralEvaluation,
            featureName: 'Genel Değerlendirme',
            onAdRequired: triggerRewardedCreditAd,
            creditCost: GENERAL_EVALUATION_CREDIT_COST
        });
    };

    const handleNotes = () => {
        checkAccess({
            onSuccess: () => router.push('/notes' as any),
            featureName: 'Sınav Notları',
            onAdRequired: triggerRewardedCreditAd,
            creditCost: 20
        });
    };

    const openPaywall = async () => {
        const success = await purchaseService.presentPaywall();
        if (success) await checkSubscriptionStatus();
    };

    const loadStats = async (isRefresh = false) => {
        if (!isRefresh) {
            setIsLoading(true);
        }
        setError(null);
        try {
            const guestFlag = await AsyncStorage.getItem('is_guest');
            if (guestFlag === 'true') { setIsGuest(true); setIsLoading(false); return; }

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) { setIsGuest(true); setIsLoading(false); return; }

            const data = await fetchUserStats(user.id);
            setStats(data);

            const evalDate = await AsyncStorage.getItem(GENERAL_EVALUATION_ACCESS_KEY);
            setIsGeneralEvaluationUnlocked(evalDate === getTodayKey());

            if (!isRefresh) {
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            }
        } catch (err: any) {
            setError("Verilere ulaşırken bir sorun oluştu. İnternet bağlantınızı kontrol edin.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
            hasLoadedRef.current = true;
        }
    };

    useFocusEffect(
        useCallback(() => {
            // isRefresh=true ise skeleton gösterilmez, arka planda sessizce yenilenir.
            // isRefresh=false (ilk açılış) ise skeleton gösterilir.
            loadStats(!hasLoadedRef.current ? false : true);
        }, []) // Bağımlılık yok — hasLoadedRef bir ref olduğu için re-render tetiklemez
    );

    const pd = useMemo(() => {
        const answers = stats?.answers || [];
        const total = answers.length;
        const correct = answers.filter((a: any) => a.is_correct).length;
        const wrong = total - correct;
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // Sadece Genel Deneme sınavlarını saysın
        const exams = stats?.results?.filter((r: any) => r.quiz_type === 'exam' || r.quiz_type === 'general').length || 0;

        const cats = CATEGORIES.map(cat => {
            const catA = answers.filter((a: any) => a.questions?.category === cat.id);
            const catOk = catA.filter((a: any) => a.is_correct).length;
            const catRate = catA.length > 0 ? Math.round((catOk / catA.length) * 100) : 0;
            return { ...cat, rate: catRate, total: catA.length, correct: catOk };
        });

        return { total, correct, wrong, rate, exams, cats };
    }, [stats]);

    const canViewGeneral = isPremium || isGeneralEvaluationUnlocked;
    const grade = getGrade(pd.rate);
    const aiComment = getAIComment(pd.rate, pd.total, pd.exams);
    const weakCat = pd.cats.filter(c => c.total > 0).sort((a, b) => a.rate - b.rate)[0];
    const strongCat = pd.cats.filter(c => c.total > 0).sort((a, b) => b.rate - a.rate)[0];

    // ─── LOADING ───
    if (isLoading) return (
        <ScreenLayout className="bg-base">
            <View className="px-6 pt-4">
                <View className="flex-row justify-between items-center mt-2 mb-6">
                    <View>
                        <View className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                        <View className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                    </View>
                    <View className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </View>
                <View className="h-44 bg-slate-100 dark:bg-slate-800 rounded-[28px] mb-4" />
                <View className="flex-row gap-x-3 mb-4">
                    <View className="flex-1 h-28 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                    <View className="flex-1 h-28 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                    <View className="flex-1 h-28 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
                </View>
                <View className="h-56 bg-slate-100 dark:bg-slate-800 rounded-[24px] mb-4" />
                <View className="h-24 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
            </View>
        </ScreenLayout>
    );

    // ─── GUEST ───
    if (isGuest) return (
        <ScreenLayout className="bg-base">
            <View className="px-6 py-2 flex-row justify-between items-center mt-2">
                <View>
                    <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Veriler</Text>
                    <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight">İstatistikler</Text>
                </View>
                <View className="w-11 h-11 bg-indigo-600 rounded-full items-center justify-center">
                    <TrendingUp size={20} color="white" />
                </View>
            </View>
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-[28px] items-center justify-center mb-5 border border-blue-100 dark:border-blue-800">
                    <TrendingUp size={36} color="#3b82f6" />
                </View>
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Gelişimini Takip Et</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 leading-6 px-4 text-[14px]">
                    Misafir olarak ilerlemen kaydedilmiyor. Başarı oranını ve AI analizlerini görmek için ücretsiz hesap oluştur.
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')} className="bg-blue-600 w-full py-4 rounded-2xl items-center mb-3">
                    <Text className="text-white font-black text-[16px]">Ücretsiz Kullanmaya Başla</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/auth/login')} className="w-full py-4 rounded-2xl items-center border border-slate-200 dark:border-slate-800">
                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-[15px]">Zaten Hesabım Var</Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );

    // ─── ERROR ───
    if (error) return (
        <ScreenLayout className="bg-base">
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-[20px] items-center justify-center mb-4">
                    <AlertTriangle size={28} color="#ef4444" />
                </View>
                <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Hata Oluştu</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 text-[14px]">{error}</Text>
                <TouchableOpacity onPress={() => loadStats()} className="bg-slate-900 dark:bg-white w-full py-4 rounded-2xl items-center">
                    <Text className="text-white dark:text-slate-900 font-bold text-lg">Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );

    return (
        <ScreenLayout className="bg-base">
            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(true); }} />}
            >
                {/* ─── HEADER ─── */}
                <View className="px-6 py-2 flex-row justify-between items-center mt-2 mb-4">
                    <View>
                        <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Veriler</Text>
                        <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">İstatistikler</Text>
                    </View>
                    <View className="w-11 h-11 bg-indigo-600 rounded-full items-center justify-center">
                        <TrendingUp size={20} color="white" />
                    </View>
                </View>

                {/* ─── LEADERBOARD BUTONU ─── */}
                <View className="px-6 mb-6">
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/leaderboard')}
                        className="bg-amber-500 dark:bg-amber-600 rounded-[24px] p-5 flex-row items-center justify-between shadow-lg shadow-amber-500/20"
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4">
                                <Trophy size={24} color="#ffffff" />
                            </View>
                            <View className="flex-1 pr-2">
                                <Text className="text-white font-black text-[18px] mb-0.5">Liderlik Tablosu</Text>
                                <Text className="text-amber-100 font-medium text-[12px] leading-4">Diğer adaylarla yarış ve sıralamanı gör!</Text>
                            </View>
                        </View>
                        <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
                            <ChevronRight size={18} color="#ffffff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {pd.total === 0 ? (
                    // ─── BOŞ DURUM ───
                    <View className="px-6 mt-10 items-center">
                        <View className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-[28px] items-center justify-center mb-5 border border-blue-100 dark:border-blue-500/20">
                            <BarChart3 size={32} color="#2563eb" />
                        </View>
                        <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Henüz Veri Yok</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-center mb-6 text-[14px] leading-5 px-4">
                            İstatistiklerini görebilmek için önce birkaç test çözmelisin.
                        </Text>
                        <TouchableOpacity
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/quizzes'); }}
                            className="bg-blue-600 px-8 py-3.5 rounded-2xl flex-row items-center"
                        >
                            <Text className="text-white font-bold text-[14px] mr-2">Soru Çözmeye Başla</Text>
                            <ArrowRight size={15} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* ═══ HERO KART — BAŞARI DURUMU ═══ */}
                        <View className="px-6 mb-4">
                            {canViewGeneral ? (
                                <View className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                                    <View className="flex-row items-center justify-between">
                                        {/* Sol: Başarı oranı daire */}
                                        <DonutCircle rate={pd.rate} color={grade.color} />

                                        {/* Sağ: Özet istatistikler */}
                                        <View className="flex-1 ml-5">
                                            {/* Grade badge */}
                                            <View className="flex-row items-center mb-3">
                                                <View className="px-2.5 py-1 rounded-xl border" style={{
                                                    backgroundColor: grade.color + '15',
                                                    borderColor: grade.color + '30',
                                                }}>
                                                    <Text style={{ color: grade.color }} className="text-[10px] font-black uppercase tracking-widest">
                                                        {grade.emoji}  {grade.label}
                                                    </Text>
                                                </View>
                                            </View>

                                            {[
                                                { label: 'Toplam Soru',   value: pd.total.toString(),   icon: Target,      color: '#2563eb' },
                                                { label: 'Doğru',         value: pd.correct.toString(), icon: CheckCircle2,color: '#10b981' },
                                                { label: 'Yanlış',        value: pd.wrong.toString(),   icon: AlertCircle, color: '#ef4444' },
                                                { label: 'Bitmiş Sınav',        value: pd.exams.toString(),   icon: Award,       color: '#f59e0b' },
                                            ].map(({ label, value, icon: Icon, color }) => (
                                                <View key={label} className="flex-row items-center justify-between mb-2">
                                                    <View className="flex-row items-center">
                                                        <View className="w-5 h-5 rounded-md items-center justify-center mr-2" style={{ backgroundColor: color + '18' }}>
                                                            <Icon size={11} color={color} />
                                                        </View>
                                                        <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{label}</Text>
                                                    </View>
                                                    <Text className="text-slate-900 dark:text-white text-[13px] font-black">{value}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Geçme Barajı Progress */}
                                    <View className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest">Sınav Barajı</Text>
                                            <Text className="text-[11px] font-black" style={{ color: pd.rate >= 70 ? '#10b981' : '#f59e0b' }}>
                                                {pd.rate >= 70 ? '✓ Geçer Seviye' : `%${70 - pd.rate} eksik`}
                                            </Text>
                                        </View>
                                        <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <View className="h-full rounded-full" style={{
                                                width: `${Math.min(100, pd.rate)}%`,
                                                backgroundColor: pd.rate >= 70 ? '#10b981' : pd.rate >= 50 ? '#f59e0b' : '#ef4444'
                                            }} />
                                            {/* %70 işareti */}
                                            <View className="absolute top-0 h-full w-px bg-slate-400 dark:bg-slate-600" style={{ left: '70%' }} />
                                        </View>
                                        <View className="flex-row justify-end mt-1">
                                            <Text className="text-slate-400 text-[9px] font-bold">%70 BARIĞI</Text>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                // Kilitli hero
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={openGeneralEvaluation}
                                    className="bg-blue-600 rounded-[28px] p-6 relative overflow-hidden shadow-xl shadow-blue-600/20 border border-blue-500/50"
                                >
                                    <View className="absolute right-[-10] bottom-[-20] opacity-10 rotate-12">
                                        <BarChart3 size={150} color="#ffffff" />
                                    </View>
                                    <View className="bg-white/20 self-start px-2.5 py-1 rounded-lg mb-4 border border-white/20">
                                        <Text className="text-white text-[10px] font-black tracking-widest uppercase">Kilitli Analiz</Text>
                                    </View>
                                    <Text className="text-white text-[24px] font-black tracking-tight mb-2">Genel Değerlendirmeyi Aç</Text>
                                    <Text className="text-blue-100/80 text-[13px] leading-[20px] font-medium mb-6">
                                        Başarı oranın, toplam soru ve doğru sayını günlük olarak görüntüle.
                                    </Text>
                                    <View className="bg-white self-start px-5 py-3 rounded-xl flex-row items-center">
                                        <Text className="text-blue-700 font-bold text-[13px] mr-2">{GENERAL_EVALUATION_CREDIT_COST} Krediyle Aç</Text>
                                        <ChevronRight size={14} color="#1d4ed8" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ═══ KONU PERFORMANSI ═══ */}
                        <View className="px-6 mb-4">
                            <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Konu Performansı</Text>

                            <View className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none overflow-hidden">
                                {pd.cats.map((cat, i) => (
                                    <View
                                        key={cat.id}
                                        className={`px-5 py-4 ${i < pd.cats.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
                                    >
                                        <View className="flex-row items-center justify-between mb-2.5">
                                            <View className="flex-row items-center flex-1">
                                                {/* Renk nokta */}
                                                <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: cat.color + '15' }}>
                                                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                </View>
                                                <View>
                                                    <Text className="text-slate-800 dark:text-slate-200 font-bold text-[13px]">{cat.name}</Text>
                                                    {cat.total > 0 ? (
                                                        <Text className="text-slate-400 text-[10px] font-medium">{cat.correct}/{cat.total} doğru</Text>
                                                    ) : (
                                                        <Text className="text-slate-300 dark:text-slate-600 text-[10px] font-medium italic">Henüz çözülmedi</Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-[18px] font-black" style={{
                                                    color: cat.rate >= 70 ? '#10b981' : cat.rate >= 50 ? '#f59e0b' : cat.total === 0 ? '#cbd5e1' : '#ef4444'
                                                }}>
                                                    %{cat.rate}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Progress bar */}
                                        <View className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <View
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${cat.rate}%`,
                                                    backgroundColor: cat.rate >= 70 ? '#10b981' : cat.rate >= 50 ? '#f59e0b' : cat.total === 0 ? '#e2e8f0' : '#ef4444',
                                                    minWidth: cat.total > 0 ? 4 : 0,
                                                }}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {!isPremium && (
                                <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-5 rounded-[24px] mt-3">
                                    <View className="flex-row items-center mb-2">
                                        <Lock size={14} color="#d97706" />
                                        <Text className="text-amber-900 dark:text-amber-300 font-black text-[13px] ml-2">Kişisel Çalışma Planı</Text>
                                    </View>
                                    <Text className="text-amber-900/70 dark:text-amber-200/70 text-[12px] leading-5 font-medium mb-4">
                                        Hangi konuya önce çalışman gerektiğini ve telafi testlerini Premium açar.
                                    </Text>
                                    <TouchableOpacity onPress={openPaywall} className="bg-amber-500 py-3 rounded-xl items-center">
                                        <Text className="text-amber-950 font-black text-[13px]">Planı Aç</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* ═══ EN GÜÇLÜ / EN ZAYIF ═══ */}
                        {(weakCat || strongCat) && (
                            <View className="px-6 mb-4">
                                <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Öne Çıkanlar</Text>
                                <View className="flex-row gap-x-3">
                                    {strongCat && (
                                        <View className="flex-1 bg-white dark:bg-slate-900 rounded-[24px] p-4 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                                            <View className="w-9 h-9 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: '#10b98118' }}>
                                                <Award size={18} color="#10b981" />
                                            </View>
                                            <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">En Güçlü</Text>
                                            <Text className="text-slate-900 dark:text-white font-black text-[13px] leading-4 mb-1">{strongCat.name}</Text>
                                            <Text className="text-[20px] font-black" style={{ color: '#10b981' }}>%{strongCat.rate}</Text>
                                        </View>
                                    )}
                                    {weakCat && weakCat.id !== strongCat?.id && (
                                        <View className="flex-1 bg-white dark:bg-slate-900 rounded-[24px] p-4 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                                            <View className="w-9 h-9 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: '#ef444418' }}>
                                                <Target size={18} color="#ef4444" />
                                            </View>
                                            <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Öncelik</Text>
                                            <Text className="text-slate-900 dark:text-white font-black text-[13px] leading-4 mb-1">{weakCat.name}</Text>
                                            <Text className="text-[20px] font-black" style={{ color: '#ef4444' }}>%{weakCat.rate}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* ═══ AI ANALİZİ ═══ */}
                        <View className="px-6 mb-4">
                            <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">AI Değerlendirmesi</Text>

                            <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none mb-3">
                                <View className="flex-row items-center mb-3">
                                    <View className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 items-center justify-center mr-3 border border-indigo-100/50 dark:border-indigo-500/20">
                                        <Zap size={16} color="#6366f1" />
                                    </View>
                                    <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">Yapay Zeka Yorumu</Text>
                                </View>
                                <Text className="text-slate-700 dark:text-slate-300 text-[13px] leading-[21px] font-medium">{aiComment}</Text>
                            </View>

                            {/* Durum alert kartı */}
                            <View className="rounded-[24px] p-5 border flex-row items-start" style={{
                                backgroundColor: pd.rate >= 70 ? '#f0fdf4' : '#fff7ed',
                                borderColor: pd.rate >= 70 ? '#bbf7d0' : '#fed7aa',
                            }}>
                                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{
                                    backgroundColor: pd.rate >= 70 ? '#10b98120' : '#f59e0b20'
                                }}>
                                    {pd.rate >= 70
                                        ? <CheckCircle2 size={18} color="#10b981" />
                                        : <AlertCircle size={18} color="#f59e0b" />
                                    }
                                </View>
                                <View className="flex-1">
                                    <Text className="font-black text-[13px] mb-1" style={{ color: pd.rate >= 70 ? '#065f46' : '#78350f' }}>
                                        {pd.rate >= 70 ? 'Sınav Barajını Geçiyorsun! 🎉' : 'Barajın Altındasın — Çalışma Zamanı'}
                                    </Text>
                                    <Text className="text-[12px] leading-[19px] font-medium" style={{ color: pd.rate >= 70 ? '#047857' : '#92400e' }}>
                                        {pd.rate >= 70
                                            ? `%${pd.rate} başarı oranınla gerçek sınavı geçmeye hazırsın. Son bir tekrarla neredeyse sıfır hata hedefle!`
                                            : `Geçmek için %${70 - pd.rate} daha fazla başarı gerekiyor. ${weakCat ? `"${weakCat.name}" konusuna odaklanmak iyi bir başlangıç olur.` : 'Düzenli çalışma ile bu farkı kapatabilirsin.'}`
                                        }
                                    </Text>
                                </View>
                            </View>

                            {!isPremium && (
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={openPaywall}
                                    className="bg-slate-900 dark:bg-slate-900 rounded-[24px] p-5 mt-3 border border-slate-800 flex-row items-center relative overflow-hidden"
                                >
                                    <View className="absolute right-[-10] bottom-[-20] opacity-10 rotate-12">
                                        <TrendingUp size={120} color="#ffffff" />
                                    </View>
                                    <View className="flex-1 pr-4 z-10">
                                        <Text className="text-white font-black text-[14px] mb-1">AI Gelişim Raporunu Aç</Text>
                                        <Text className="text-slate-400 text-[12px] leading-[19px] font-medium">
                                            Yanlışlarına göre eksik konu, risk seviyesi ve sıradaki en mantıklı testi gör.
                                        </Text>
                                    </View>
                                    <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center">
                                        <ArrowRight size={16} color="#f59e0b" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ═══ HIZLI AKSIYONLAR ═══ */}
                        <View className="px-6">
                            <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Hızlı Erişim</Text>
                            <View className="flex-row gap-x-3">
                                <TouchableOpacity
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/quiz/mistakes' as any); }}
                                    activeOpacity={0.7}
                                    className="flex-1 bg-white dark:bg-slate-900 items-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm"
                                >
                                    <View className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-2xl items-center justify-center mb-2">
                                        <AlertCircle size={19} color="#ef4444" />
                                    </View>
                                    <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hata Tekrarı</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/ai-tutor' as any); }}
                                    activeOpacity={0.7}
                                    className="flex-1 bg-white dark:bg-slate-900 items-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm"
                                >
                                    <View className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl items-center justify-center mb-2">
                                        <Zap size={19} color="#6366f1" />
                                    </View>
                                    <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">AI Hoca</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleNotes(); }}
                                    activeOpacity={0.7}
                                    className="flex-1 bg-white dark:bg-slate-900 items-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm"
                                >
                                    <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl items-center justify-center mb-2">
                                        <BookOpen size={19} color="#10b981" />
                                    </View>
                                    <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Notlar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                    </>
                )}
            </Animated.ScrollView>
        </ScreenLayout>
    );
}
