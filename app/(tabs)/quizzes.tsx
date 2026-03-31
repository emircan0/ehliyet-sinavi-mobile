import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import {
    FileText, History, Star, AlertTriangle, ChevronRight,
    Filter, Calendar, Trophy, BookmarkCheck, Clock, Zap, Crown, Search,
    CheckCircle2, Lock
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchExamsWithProgress, fetchSmartTestCounts } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

export default function QuizzesScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Hepsi');
    const [exams, setExams] = useState<any[]>([]);
    const [counts, setCounts] = useState({ wrongCount: 0, favoriteCount: 0 });

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [examsData, smartCounts] = await Promise.all([
                    fetchExamsWithProgress(user.id),
                    fetchSmartTestCounts(user.id)
                ]);
                setExams(examsData);
                setCounts(smartCounts);
            }
        } catch (error) {
            console.error("Veriler yüklenirken hata:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const filteredExams = useMemo(() => {
        if (activeTab === 'Hepsi') return exams;
        if (activeTab === 'Devam Edenler') return exams.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100);
        if (activeTab === 'Tamamlananlar') return exams.filter(e => e.progress_percentage >= 100);
        return exams.filter(e => e.category === activeTab);
    }, [exams, activeTab]);

    const examTabs = useMemo(() => {
        const categories = [...new Set(exams.map(e => e.category))];
        return ['Hepsi', 'Devam Edenler', 'Tamamlananlar', ...categories];
    }, [exams]);

    const featuredExam = exams.length > 0 ? exams[0] : null;
    const regularExams = activeTab === 'Hepsi' ? filteredExams.slice(1) : filteredExams;

    return (
        <ScreenLayout className="bg-white dark:bg-black">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {isLoading ? (
                <View className="px-6 pt-4 pb-6">
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <View className="h-3 w-24 bg-slate-100 dark:bg-[#1C1C1E] rounded mb-3 animate-pulse" />
                            <View className="h-8 w-48 bg-slate-200 dark:bg-[#2C2C2E] rounded animate-pulse" />
                        </View>
                        <View className="w-11 h-11 bg-slate-100 dark:bg-[#1C1C1E] rounded-full animate-pulse" />
                    </View>
                    <View className="h-64 w-full bg-slate-100 dark:bg-[#1C1C1E] rounded-[32px] mb-8 animate-pulse" />
                    <View className="flex-row gap-4 mb-10">
                        <View className="h-[140px] flex-1 bg-slate-100 dark:bg-[#1C1C1E] rounded-[28px] animate-pulse" />
                        <View className="h-[140px] flex-1 bg-slate-100 dark:bg-[#1C1C1E] rounded-[28px] animate-pulse" />
                    </View>
                    <View className="h-6 w-40 bg-slate-100 dark:bg-[#1C1C1E] rounded mb-4 animate-pulse" />
                    <View className="h-20 w-full bg-slate-100 dark:bg-[#1C1C1E] rounded-2xl mb-4 animate-pulse" />
                    <View className="h-20 w-full bg-slate-100 dark:bg-[#1C1C1E] rounded-2xl animate-pulse" />
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
                                <Text className="text-[12px] font-black text-blue-600 dark:text-[#0A84FF] uppercase tracking-widest mb-1">Başarı Merkezi</Text>
                                <Text className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sınavlar</Text>
                            </View>
                            <View className="w-12 h-12 bg-blue-50 dark:bg-[#0A84FF]/10 rounded-2xl items-center justify-center border border-blue-100 dark:border-[#0A84FF]/20">
                                <FileText size={24} color={isDarkMode ? "#0A84FF" : "#2563eb"} />
                            </View>
                        </View>

                        <View className="flex-row gap-4">
                            <QuickActionCard
                                title="Hatalarım"
                                count={counts.wrongCount}
                                icon={AlertTriangle}
                                color={isDarkMode ? "#FF453A" : "#ef4444"}
                                bg="bg-red-50 dark:bg-[#FF453A]/10"
                                onPress={() => router.push('/quiz/mistakes')}
                            />
                            <QuickActionCard
                                title="Favoriler"
                                count={counts.favoriteCount}
                                icon={Star}
                                color={isDarkMode ? "#FF9F0A" : "#f59e0b"}
                                bg="bg-amber-50 dark:bg-[#FF9F0A]/10"
                                onPress={() => router.push('/quiz/favorites')}
                            />
                        </View>
                    </View>

                    {/* Featured Exam Section */}
                    {activeTab === 'Hepsi' && featuredExam && (
                        <View className="px-6 mb-10">
                            <View className="flex-row justify-between items-end mb-5 px-1">
                                <View>
                                    <Text className="text-slate-400 dark:text-white/50 text-[11px] font-bold uppercase tracking-[2px] mb-1">GÜNÜN SEÇİMİ</Text>
                                    <Text className="text-slate-900 dark:text-white font-extrabold text-2xl tracking-tight">Öne Çıkan Deneme</Text>
                                </View>
                                <TouchableOpacity hitSlop={20}>
                                    <Text className="text-blue-600 dark:text-[#0A84FF] font-bold text-sm">Tümünü Gör</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    isPro ? router.push(`/quiz/${featuredExam.id}`) : router.push('/premium');
                                }}
                                className="relative overflow-hidden rounded-[32px] shadow-2xl shadow-indigo-100 dark:shadow-none"
                            >
                                <LinearGradient
                                    colors={['#1e1b4b', '#0f0c3a']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="px-7 py-8 border border-transparent dark:border-white/10"
                                >
                                    <View className="flex-row justify-between items-start mb-8">
                                        <View className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                                            <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                                            <Text className="text-white text-[10px] font-extrabold ml-1.5 uppercase tracking-wider">HAFTALIK ÖZEL</Text>
                                        </View>

                                        {!isPro ? (
                                            <View className="bg-amber-400/20 p-2 rounded-xl border border-amber-400/30">
                                                <Crown size={18} color="#fbbf24" fill="#fbbf24" />
                                            </View>
                                        ) : (
                                            <View className="bg-emerald-400/20 p-2 rounded-xl border border-emerald-400/30">
                                                <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-tight">PRO</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View className="mb-8">
                                        <Text className="text-white text-2xl font-bold leading-tight tracking-tight">
                                            {featuredExam.title}
                                        </Text>
                                        <View className="flex-row items-center mt-3 opacity-80">
                                            <Clock size={14} color="white" />
                                            <Text className="text-white/90 text-xs font-medium ml-1.5 uppercase tracking-tight">
                                                {featuredExam.duration_minutes} Dakika • 50 Soru
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1 mr-6">
                                            {featuredExam.progress_percentage > 0 ? (
                                                <View>
                                                    <View className="flex-row justify-between mb-2">
                                                        <Text className="text-white/60 text-[10px] font-bold uppercase tracking-tight">İLERLEME</Text>
                                                        <Text className="text-white text-[10px] font-black tracking-tight">%{featuredExam.progress_percentage}</Text>
                                                    </View>
                                                    <View className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden border border-white/10">
                                                        <View
                                                            className="h-full bg-amber-400 rounded-full"
                                                            style={{ width: `${featuredExam.progress_percentage}%` }}
                                                        />
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text className="text-white/50 text-[11px] font-medium italic">Henüz başlanmadı</Text>
                                            )}
                                        </View>

                                        <View className="bg-white px-5 py-3 rounded-2xl flex-row items-center shadow-xl shadow-indigo-200 dark:shadow-none">
                                            <Text className="text-indigo-900 font-bold text-xs uppercase tracking-tight mr-1">
                                                {featuredExam.progress_percentage > 0 ? 'Devam Et' : 'Şimdi Çöz'}
                                            </Text>
                                            <ChevronRight size={16} color="#0f0c3a" strokeWidth={3} />
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Categories */}
                    <View className="mb-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}>
                            {examTabs.map((cat, idx) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveTab(cat);
                                    }}
                                    className={`px-5 py-2.5 rounded-2xl border-2 ${idx > 0 ? 'ml-2' : ''} ${activeTab === cat
                                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white shadow-md shadow-slate-200 dark:shadow-none'
                                        : 'bg-white dark:bg-[#1C1C1E] border-slate-50 dark:border-white/5'
                                        }`}
                                >
                                    <Text className={`font-black text-xs uppercase tracking-widest ${activeTab === cat
                                        ? 'text-white dark:text-black'
                                        : 'text-slate-400 dark:text-white/50'
                                        }`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Exam List */}
                    <View className="px-6 gap-3">
                        {regularExams.length > 0 ? (
                            regularExams.map((exam) => (
                                <ExamListItem
                                    key={exam.id}
                                    exam={exam}
                                    isPro={isPro}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        isPro ? router.push(`/quiz/${exam.id}`) : router.push('/premium');
                                    }}
                                />
                            ))
                        ) : (
                            <View className="items-center py-20 px-10">
                                <Trophy size={48} color={isDarkMode ? "#2C2C2E" : "#e2e8f0"} className="mb-4" />
                                <Text className="text-slate-400 dark:text-white/50 font-bold text-center">
                                    {activeTab === 'Tamamlananlar'
                                        ? "Henüz tamamlanmış sınavın yok. Hadi bir tane bitirelim!"
                                        : (activeTab === 'Devam Edenler'
                                            ? "Yarım bıraktığın sınavın yok. Her şey güncel!"
                                            : "Bu kategoride sınav bulunamadı.")}
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
        className="flex-1 bg-white dark:bg-[#1C1C1E] p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm shadow-slate-100 dark:shadow-none"
    >
        <View className={`${bg} self-start p-2 rounded-xl mb-3`}>
            <Icon size={18} color={color} />
        </View>
        <Text className="text-slate-900 dark:text-white font-extrabold text-[15px] mb-1">{title}</Text>
        <Text className="text-slate-400 dark:text-white/50 text-[11px] font-bold uppercase tracking-wider">{count} Soru</Text>
    </TouchableOpacity>
);

const ExamListItem = ({ exam, isPro, onPress }: any) => {
    // Bileşen içinde de dark mode durumunu dinliyoruz (İkon renkleri için)
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const isCompleted = exam.progress_percentage >= 100;
    const isStarted = exam.progress_percentage > 0 && exam.progress_percentage < 100;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[20px] border border-slate-100 dark:border-white/5 flex-row items-center relative shadow-sm shadow-slate-100 dark:shadow-none"
        >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCompleted ? 'bg-emerald-50 dark:bg-[#34C759]/10' : 'bg-slate-50 dark:bg-[#2C2C2E]'}`}>
                {isCompleted ? <CheckCircle2 size={24} color={isDarkMode ? "#34C759" : "#10b981"} /> : <FileText size={24} color={isDarkMode ? "#EBEBF599" : "#94a3b8"} />}
            </View>

            <View className="flex-1 pr-8">
                <Text className="text-slate-900 dark:text-white font-bold text-base mb-1" numberOfLines={1}>{exam.title}</Text>

                <View className="flex-row items-center">
                    <Text className="text-slate-400 dark:text-white/50 text-[10px] font-black uppercase tracking-widest">{exam.category}</Text>
                    {isStarted && (
                        <>
                            <View className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-2" />
                            <Text className="text-blue-600 dark:text-[#0A84FF] text-[10px] font-black uppercase tracking-widest">Devam Ediyor</Text>
                        </>
                    )}
                </View>

                {isStarted && (
                    <View className="h-1 w-full bg-slate-50 dark:bg-[#2C2C2E] rounded-full mt-3 overflow-hidden">
                        <View className="h-full bg-blue-500 dark:bg-[#0A84FF] rounded-full" style={{ width: `${exam.progress_percentage}%` }} />
                    </View>
                )}
            </View>

            <View className="bg-slate-50 dark:bg-[#2C2C2E] w-8 h-8 rounded-full items-center justify-center">
                <ChevronRight size={16} color={isDarkMode ? "#EBEBF54D" : "#cbd5e1"} />
            </View>

            {!isPro && (
                <View className="absolute top-4 right-4 bg-slate-900/5 dark:bg-white/5 p-1.5 rounded-full">
                    <Lock size={12} color="#f59e0b" />
                </View>
            )}
        </TouchableOpacity>
    );

};
