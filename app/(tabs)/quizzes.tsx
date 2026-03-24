import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
    FileText, History, Star, AlertTriangle, ChevronRight,
    Filter, Calendar, Trophy, BookmarkCheck
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { Card } from '../../src/components/ui/Card';
import { fetchExams, fetchSmartTestCounts } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function QuizzesScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exams, setExams] = useState<any[]>([]);
    const [counts, setCounts] = useState({ wrongCount: 0, favoriteCount: 0 });

    const performDataLoad = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        return Promise.all([
            fetchExams(),
            user ? fetchSmartTestCounts(user.id) : { wrongCount: 0, favoriteCount: 0 }
        ]);
    };

    useEffect(() => {
        let isMounted = true;
        const initData = async () => {
            const [examData, smartCounts] = await performDataLoad();
            if (isMounted) {
                setExams(examData);
                setCounts(smartCounts as any);
                setIsLoading(false);
                setRefreshing(false);
            }
        };
        initData();
        return () => { isMounted = false; };
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        const [examData, smartCounts] = await performDataLoad();
        setExams(examData);
        setCounts(smartCounts as any);
        setRefreshing(false);
    }, []);

    if (isLoading) return <QuizzesSkeleton />;

    return (
        <ScreenLayout className="bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="px-6 py-4 bg-white border-b border-slate-100">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-2xl font-bold text-slate-900 tracking-tight">Sınav Merkezi</Text>
                    <TouchableOpacity className="p-2 bg-slate-50 rounded-full border border-slate-200">
                        <Filter size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
                <Text className="text-slate-500 text-sm font-medium">Kişisel gelişimine özel testler ve arşiv.</Text>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* 1. Bölüm: Akıllı Testler */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 font-bold text-lg mb-4">Akıllı Çalışma</Text>
                    <View className="gap-3">
                        <SmartTestCard
                            title="Hata Telafisi"
                            subtitle="Sadece yanlış cevapladığın sorular"
                            icon={AlertTriangle}
                            color="#ef4444"
                            bg="bg-red-50"
                            border="border-red-100"
                            count={counts.wrongCount}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/quiz/mistakes');
                            }}
                        />
                        <SmartTestCard
                            title="Favori Sorular"
                            subtitle="Kaydettiğin özel sorular"
                            icon={Star}
                            color="#f59e0b"
                            bg="bg-amber-50"
                            border="border-amber-100"
                            count={counts.favoriteCount}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/quiz/favorites');
                            }}
                        />
                    </View>
                </View>

                {/* 2. Bölüm: Gerçek Sınav Arşivi (Dinamik) */}
                <View className="px-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-slate-900 font-bold text-lg">Sınav Arşivi</Text>
                        <View className="bg-blue-600 px-2 py-1 rounded-md">
                            <Text className="text-white text-[10px] font-bold uppercase">Güncel</Text>
                        </View>
                    </View>

                    <View className="gap-4">
                        {exams.map((exam) => (
                            <Card
                                key={exam.id}
                                variant="elevated"
                                className={`p-4 border-slate-200/60 ${!isPro ? 'opacity-70' : ''}`}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    isPro ? router.push(`/quiz/${exam.id}`) : router.push('/premium');
                                }}
                            >
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3 border border-slate-100">
                                            <FileText size={20} color="#64748b" />
                                        </View>
                                        <View className="flex-1 pr-2">
                                            <Text className="font-bold text-slate-900 text-[15px] mb-0.5" numberOfLines={1}>
                                                {exam.title}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <View className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                                                    <Text className="text-[10px] font-bold text-slate-500 uppercase">{exam.category}</Text>
                                                </View>
                                                <Clock size={12} color="#94a3b8" />
                                                <Text className="text-slate-400 text-xs font-medium ml-1">{exam.duration_minutes} dk</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="bg-blue-50 px-3 py-2 rounded-xl">
                                        {!isPro ? (
                                            <Lock size={16} color="#64748b" />
                                        ) : (
                                            <ChevronRight size={18} color="#2563eb" />
                                        )}
                                    </View>
                                </View>
                            </Card>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}

// Alt Bileşen: Akıllı Test Kartı
const SmartTestCard = ({ title, subtitle, icon: Icon, color, bg, border, count, onPress }: any) => (
    <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={`flex-row items-center p-4 rounded-2xl bg-white border ${border} shadow-sm`}
    >
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${bg} mr-4`}>
            <Icon size={22} color={color} />
        </View>
        <View className="flex-1">
            <Text className="text-slate-900 font-bold text-[15px]">{title}</Text>
            <Text className="text-slate-500 text-xs mt-0.5">{subtitle}</Text>
        </View>
        <View className="bg-slate-100 px-3 py-1 rounded-full">
            <Text className="text-slate-600 font-bold text-xs">{count}</Text>
        </View>
        <ChevronRight size={18} color="#cbd5e1" className="ml-2" />
    </TouchableOpacity>
);

// Lucide ikon paketi için Clock ikonu (import listesine eklemeyi unutma)
import { Clock } from 'lucide-react-native';

const QuizzesSkeleton = () => (
    <ScreenLayout className="bg-slate-50">
        <View className="px-6 py-4 bg-white border-b border-slate-100">
            <View className="flex-row justify-between items-center mb-2">
                <View className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                <View className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
            </View>
            <View className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
        </View>
        <View className="px-6 pt-6">
            <View className="h-6 w-32 bg-slate-200 rounded mb-4 animate-pulse" />
            <View className="h-[88px] w-full bg-slate-200 rounded-2xl mb-3 animate-pulse" />
            <View className="h-[88px] w-full bg-slate-200 rounded-2xl mb-8 animate-pulse" />

            <View className="h-6 w-32 bg-slate-200 rounded mb-4 animate-pulse" />
            <View className="h-20 w-full bg-slate-200 rounded-2xl mb-4 animate-pulse" />
            <View className="h-20 w-full bg-slate-200 rounded-2xl mb-4 animate-pulse" />
            <View className="h-20 w-full bg-slate-200 rounded-2xl mb-4 animate-pulse" />
        </View>
    </ScreenLayout>
);