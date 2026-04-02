// app/quiz/result.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, CheckCircle2, XCircle, Home, RotateCcw, Target } from 'lucide-react-native';
import { supabase } from '../../src/api/supabase';

export default function QuizResultScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const fetchLatestResult = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Kullanıcının en son kaydettiği sınav sonucunu çekiyoruz
                const { data, error } = await supabase
                    .from('exam_results')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!error && data) {
                    setResult(data);
                }
            }
            setIsLoading(false);
        };

        fetchLatestResult();
    }, []);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-slate-500 dark:text-slate-400 font-medium tracking-tight">Sonuçların hesaplanıyor...</Text>
            </View>
        );
    }

    if (!result) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
                <Text className="text-slate-800 dark:text-slate-100 text-lg font-bold mb-4">Sonuç bulunamadı.</Text>
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/home')}
                    className="bg-blue-600 px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-bold">Ana Sayfaya Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isSuccess = result.score >= 70; // 70 geçer not varsayalım

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            <View className="flex-1 px-6 pt-12 pb-6 items-center">

                {/* --- KUPA VE BAŞLIK --- */}
                <View className="items-center mb-8 mt-4">
                    <View className={`w-28 h-28 rounded-full items-center justify-center mb-6 shadow-2xl ${isSuccess ? 'bg-emerald-100 shadow-emerald-500/30' : 'bg-red-100 shadow-red-500/30'}`}>
                        <Trophy size={56} color={isSuccess ? '#10b981' : '#ef4444'} />
                    </View>
                    <Text className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight text-center mb-2">
                        {isSuccess ? 'Tebrikler, Harikasın!' : 'Biraz Daha Gayret!'}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-base font-medium text-center px-4">
                        {isSuccess
                            ? 'Bu konuyu gayet iyi kavramışsın. Böyle devam et!'
                            : 'Bazı eksiklerin var ama endişelenme, hatalarından öğrenebilirsin.'}
                    </Text>
                </View>

                {/* --- SKOR KARTI --- */}
                <View className="w-full bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl shadow-slate-200/50 mb-8 border border-slate-100 dark:border-slate-800">
                    <View className="items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">BAŞARI ORANI</Text>
                        <Text className={`text-[48px] font-black ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
                            %{result.score}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        {/* Doğru */}
                        <View className="items-center flex-1 border-r border-slate-100 dark:border-slate-800">
                            <View className="flex-row items-center mb-2">
                                <CheckCircle2 size={16} color="#10b981" />
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold ml-1 uppercase">Doğru</Text>
                            </View>
                            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-black">{result.correct_count}</Text>
                        </View>

                        {/* Yanlış */}
                        <View className="items-center flex-1 border-r border-slate-100 dark:border-slate-800">
                            <View className="flex-row items-center mb-2">
                                <XCircle size={16} color="#ef4444" />
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold ml-1 uppercase">Yanlış</Text>
                            </View>
                            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-black">{result.wrong_count}</Text>
                        </View>

                        {/* Toplam */}
                        <View className="items-center flex-1">
                            <View className="flex-row items-center mb-2">
                                <Target size={16} color="#3b82f6" />
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold ml-1 uppercase">Toplam</Text>
                            </View>
                            <Text className="text-slate-900 dark:text-slate-50 text-2xl font-black">{result.total_questions}</Text>
                        </View>
                    </View>
                </View>

                {/* --- AKSİYON BUTONLARI --- */}
                <View className="w-full gap-y-3 mt-auto">
                    {result.wrong_count > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push('/quiz/mistakes')}
                            className="w-full h-14 bg-indigo-600 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-600/30"
                        >
                            <RotateCcw size={20} color="white" />
                            <Text className="text-white text-base font-bold ml-2">Hatalarını Telafi Et</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)/home')}
                        className={`w-full h-14 rounded-2xl flex-row items-center justify-center border-2 ${result.wrong_count > 0 ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/30'}`}
                    >
                        <Home size={20} color={result.wrong_count > 0 ? "#64748b" : "white"} />
                        <Text className={`text-base font-bold ml-2 ${result.wrong_count > 0 ? "text-slate-600 dark:text-slate-300" : "text-white"}`}>
                            Ana Sayfaya Dön
                        </Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}