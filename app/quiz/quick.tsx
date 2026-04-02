import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, X, ArrowRight, Zap, RefreshCcw } from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchQuickPracticeQuestions } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useThemeMode } from '../../src/hooks/useThemeMode';

export default function QuickPracticeScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setIsLoading(true);

        // 1. Aktif kullanıcıyı al
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Kullanıcı varsa ID'sini fonksiyona gönder
        if (user) {
            const data = await fetchQuickPracticeQuestions(user.id);
            if (data) {
                setQuestions(data);
            }
        }

        setIsLoading(false);
    };

    const handleSelectOption = (index: number) => {
        if (isAnswered) return;

        setSelectedOption(index);
        setIsAnswered(true);

        const currentQ = questions[currentIndex];
        if (index === currentQ.correct_option) {
            setCorrectCount(prev => prev + 1);
        } else {
            setWrongCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResults(true);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            // Optional: Restore previous selection if we were to track it, 
            // but quick practice is usually simple. 
            // For now just move back.
            setSelectedOption(null);
            setIsAnswered(false);
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    if (isLoading) {
        return (
            <ScreenLayout className="bg-base justify-center items-center">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="mt-4 text-emerald-600 font-bold">Sorular Hazırlanıyor...</Text>
            </ScreenLayout>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <ScreenLayout className="bg-base justify-center items-center px-6">
                <Text className="text-slate-900 dark:text-slate-50 font-bold text-lg text-center">Şu an havuzda soru bulunmuyor.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-emerald-500 py-3 px-6 rounded-xl">
                    <Text className="text-white font-bold">Geri Dön</Text>
                </TouchableOpacity>
            </ScreenLayout>
        );
    }

    if (showResults) {
        return (
            <ScreenLayout className="bg-emerald-500">
                <StatusBar barStyle="light-content" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-6 border-4 border-white/30">
                        <Zap size={48} color="white" fill="white" />
                    </View>
                    <Text className="text-white text-3xl font-black mb-2 tracking-tight">Antrenman Bitti!</Text>
                    <Text className="text-emerald-100 text-center font-medium mb-10 text-base">
                        Kısa sürede beynini zinde tuttun.
                    </Text>

                    <View className="bg-white dark:bg-slate-900 w-full rounded-[32px] p-6 shadow-2xl shadow-emerald-900/50 mb-8 flex-row justify-between">
                        <View className="items-center flex-1 border-r border-slate-100 dark:border-slate-800">
                            <Text className="text-slate-400 font-bold text-xs uppercase mb-1">Doğru</Text>
                            <Text className="text-emerald-500 text-3xl font-black">{correctCount}</Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-slate-400 font-bold text-xs uppercase mb-1">Yanlış</Text>
                            <Text className="text-red-500 text-3xl font-black">{wrongCount}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-full bg-slate-900 p-4 rounded-2xl items-center shadow-lg shadow-slate-900/30 mb-3"
                    >
                        <Text className="text-white font-bold text-lg">Ana Sayfaya Dön</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setShowResults(false);
                            setCurrentIndex(0);
                            setSelectedOption(null);
                            setIsAnswered(false);
                            setCorrectCount(0);
                            setWrongCount(0);
                            loadQuestions();
                        }}
                        className="w-full py-4 items-center flex-row justify-center"
                    >
                        <RefreshCcw size={18} color="#d1fae5" className="mr-2" />
                        <Text className="text-emerald-100 font-bold text-base">Yeniden Çöz</Text>
                    </TouchableOpacity>
                </View>
            </ScreenLayout>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <ScreenLayout className="bg-base">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-50 dark:bg-slate-800">
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Zap size={14} color="#10b981" fill="#10b981" className="mr-1.5" />
                    <Text className="text-emerald-600 font-bold text-xs tracking-widest uppercase">
                        {`Soru ${currentIndex + 1} / ${questions.length}`}
                    </Text>
                </View>
                <View className="w-8" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                <View className="mb-8">
                    <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold leading-8">
                        {currentQuestion?.content}
                    </Text>
                </View>

                <View className="gap-y-3">
                    {currentQuestion?.options?.map((opt: string, index: number) => {
                        const isSelected = selectedOption === index;
                        const isCorrect = currentQuestion.correct_option === index;

                        let bgColor = "bg-white dark:bg-slate-900";
                        let borderColor = "border-slate-200 dark:border-slate-800";
                        let textColor = "text-slate-700";
                        let opacityClass = "";

                        if (isAnswered) {
                            if (isCorrect) {
                                bgColor = "bg-emerald-50";
                                borderColor = "border-emerald-500";
                                textColor = "text-emerald-800";
                            } else if (isSelected) {
                                bgColor = "bg-red-50";
                                borderColor = "border-red-500";
                                textColor = "text-red-800";
                            } else {
                                opacityClass = "opacity-50";
                            }
                        } else if (isSelected) {
                            borderColor = "border-emerald-500";
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => handleSelectOption(index)}
                                className={`p-4 rounded-2xl border-2 flex-row items-center justify-between ${bgColor} ${borderColor} ${opacityClass}`}
                            >
                                <Text className={`flex-1 font-semibold text-[15px] pr-2 ${textColor}`}>
                                    <Text className="font-black mr-2">{['A', 'B', 'C', 'D'][index]})</Text> {opt}
                                </Text>

                                {isAnswered && isCorrect ? (
                                    <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center">
                                        <Check size={14} color="white" />
                                    </View>
                                ) : null}

                                {isAnswered && isSelected && !isCorrect ? (
                                    <View className="w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                                        <X size={14} color="white" />
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {isAnswered && currentQuestion?.explanation ? (
                    <View className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                        <Text className="text-blue-800 font-bold mb-1 text-xs uppercase tracking-widest">Hoca Notu</Text>
                        <Text className="text-blue-900 text-[14px] leading-5 font-medium">
                            {currentQuestion.explanation}
                        </Text>
                    </View>
                ) : null}

            </ScrollView>

            {/* --- ALT BUTONLAR (Footer) --- */}
            <View className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-xl flex-row gap-3">
                {/* GERİ BUTONU */}
                <TouchableOpacity
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                    className={`h-14 w-14 rounded-2xl items-center justify-center border ${currentIndex === 0 ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 opacity-40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                    <ChevronLeft size={24} color={currentIndex === 0 ? "#cbd5e1" : "#64748b"} />
                </TouchableOpacity>

                {/* PAS GEÇ / SONRAKİ BUTONU */}
                <TouchableOpacity
                    onPress={handleNext}
                    className={`flex-1 h-14 rounded-2xl flex-row justify-center items-center shadow-lg ${isAnswered ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-slate-900 shadow-slate-900/20'}`}
                >
                    <Text className="text-white font-bold text-lg mr-2">
                        {isAnswered 
                            ? (currentIndex < questions.length - 1 ? "Sıradaki Soru" : "Sonuçları Gör")
                            : "Pas Geç"
                        }
                    </Text>
                    <ArrowRight size={20} color="white" />
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );
}