import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
    Alert, StatusBar, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Flag, ChevronRight, CheckCircle2, Sparkles, Save, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/api/supabase';
import { 
    fetchQuestionsByCategory, 
    fetchQuickPracticeQuestions, 
    saveQuizResults, 
    reportQuestion, 
    fetchQuestionsByExamId, 
    fetchMistakeQuestions, 
    fetchFavoriteQuestions,
    toggleFavorite,
    fetchFavoriteIds
} from '../../src/api/queries';
import { useQuizStore } from '../../src/store/useQuizStore';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuizScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const {
        questions, setQuestions,
        currentIndex, nextQuestion, prevQuestion,
        selectedAnswers, setAnswer,
        restoreQuizState, resetQuiz, calculateScore
    } = useQuizStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    const isTopicQuiz = ['trafik', 'motor', 'ilkyardim', 'adap'].includes(id as string);

    // Temizleme (Unmount)
    useEffect(() => {
        return () => resetQuiz();
    }, []);

    useEffect(() => {
        if (!id) return;

        const loadQuestions = async () => {
            setIsLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                let data = [];
                const idString = id as string;

                console.log(`[DEBUG] Aranacak ID veya Kategori: ${idString}`);

                const isNumeric = /^\d+$/.test(idString);
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idString);

                // --- ÖZEL MODLAR BURADA YAKALANIYOR ---
                if (idString === 'quick' && user) {
                    data = await fetchQuickPracticeQuestions(user.id);
                } else if (idString === 'mistakes' && user) {
                    data = await fetchMistakeQuestions(user.id);
                } else if (idString === 'favorites' && user) {
                    data = await fetchFavoriteQuestions(user.id);
                }
                // --- NORMAL SINAV VE KATEGORİLER ---
                else if (isNumeric || isUUID) {
                    data = await fetchQuestionsByExamId(idString);
                } else {
                    data = await fetchQuestionsByCategory(idString, user?.id);
                }

                if (data && data.length > 0) {
                    setQuestions(data);
                    
                    // Favori durumlarını çek
                    if (user) {
                        const favs = await fetchFavoriteIds(user.id);
                        setFavoriteIds(favs);
                    }

                    // --- YARIDA KALAN SINAVI KONTROL ET ---
                    try {
                        const savedState = await AsyncStorage.getItem(`@quiz_state_${idString}`);
                        if (savedState) {
                            const parsed = JSON.parse(savedState);
                            restoreQuizState(parsed.answers || [], parsed.index || 0);
                        }
                    } catch (e) {
                        console.log("[DEBUG] Kayıtlı oturum okunamadı", e);
                    }

                }
            } catch (error) {
                console.error("[DEBUG] Kiritik Hata Oluştu:", error);
                Alert.alert('Hata', 'Sorular yüklenirken bir sorun oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        loadQuestions();
    }, [id]);

    const currentQuestion = questions[currentIndex];

    const handleSelectOption = (optionIndex: number) => {
        if (!currentQuestion) return;
        const isCorrect = optionIndex === currentQuestion.correct_option;

        if (isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setAnswer(currentIndex, optionIndex, isCorrect);
    };

    const handleNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (currentIndex < questions.length - 1) {
            nextQuestion();
        } else {
            finishQuiz();
        }
    };

    const handlePrev = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex > 0) {
            prevQuestion();
        }
    };

    const finishQuiz = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { correctCount, wrongCount, score } = calculateScore();
                const validAnswers = selectedAnswers.filter(a => a != null);

                await saveQuizResults(user.id, id as string, score, correctCount, wrongCount, questions.length, validAnswers);
                await AsyncStorage.removeItem(`@quiz_state_${id}`);

                // Favoriler veya Hatalarım bitince direkt Sınavlar sekmesine dön
                if (id === 'favorites' || id === 'mistakes') {
                    router.replace('/(tabs)/quizzes');
                } else {
                    router.replace('/quiz/result');
                }
            }
        } catch (error) {
            Alert.alert('Hata', 'Sonuçlar kaydedilemedi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pauseQuiz = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { correctCount, wrongCount, score } = calculateScore();
                const validAnswers = selectedAnswers.filter(a => a != null);

                if (validAnswers.length > 0) {
                    await saveQuizResults(user.id, id as string, score, correctCount, wrongCount, questions.length, validAnswers);
                }

                await AsyncStorage.setItem(`@quiz_state_${id}`, JSON.stringify({
                    answers: selectedAnswers,
                    index: currentIndex
                }));

                Toast.show({
                    type: 'success',
                    text1: 'İlerleme Kaydedildi',
                    text2: 'Kaldığın yerden devam edebilirsin.',
                });
            }
        } finally {
            setIsSubmitting(false);
            router.back();
        }
    };

    const handleQuit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Sınavı Duraklat',
            'Şu ana kadar çözdüğün sorular kaydedilecek. Daha sonra kaldığın yerden devam edebilirsin.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Kaydet ve Çık', style: 'default', onPress: pauseQuiz }
            ]
        );
    };

    const handleReportSubmit = async () => {
        if (!reportReason.trim()) {
            Alert.alert('Hata', 'Lütfen bir neden belirtin.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user && currentQuestion) {
            await reportQuestion(user.id, currentQuestion.id, reportReason);
            setReportModalVisible(false);
            setReportReason('');
            Toast.show({
                type: 'success',
                text1: 'Teşekkürler! 🛡️',
                text2: 'Bildiriminiz incelenmek üzere bize ulaştı.',
            });
        }
    };

    const handleToggleFavorite = async () => {
        if (!currentQuestion) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        const result = await toggleFavorite(user.id, currentQuestion.id);
        if (result.success) {
            if (result.action === 'added') {
                setFavoriteIds(prev => [...prev, currentQuestion.id]);
                Toast.show({
                    type: 'success',
                    text1: 'Favorilere Eklendi ⭐',
                    text2: 'Bu soruyu istediğin zaman favorilerinden görebilirsin.',
                });
            } else {
                setFavoriteIds(prev => prev.filter(fid => fid !== currentQuestion.id));
                Toast.show({
                    type: 'info',
                    text1: 'Favorilerden Çıkarıldı',
                    text2: 'Soru favori listenden kaldırıldı.',
                });
            }
        }
    };

    const isFavorited = currentQuestion && favoriteIds.includes(currentQuestion.id);

    if (isLoading || isSubmitting) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F2F2F7]">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-4 text-[#8E8E93] font-medium">
                    {isSubmitting ? 'İlerlemen kaydediliyor...' : 'Sorular hazırlanıyor...'}
                </Text>
            </View>
        );
    }

    if (!currentQuestion) {
        return (
            <View className="flex-1 items-center justify-center bg-base px-8">
                <View className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <Sparkles size={40} color="#007AFF" />
                </View>
                <Text className="text-black dark:text-white text-[22px] font-bold text-center mb-3">
                    {isTopicQuiz ? 'Tebrikler! 🎉' : 'Soru Bulunamadı'}
                </Text>
                <Text className="text-slate-500 text-center mb-8">
                    {isTopicQuiz ? 'Bu kategorideki tüm soruları başarıyla tamamladınız.' : 'Sınav verileri yüklenirken bir sorun oluştu veya soru kalmadı.'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-[#007AFF] px-8 py-4 rounded-2xl w-full items-center justify-center">
                    <Text className="text-white font-bold">Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const options = currentQuestion.options || [];
    const currentSelection = selectedAnswers[currentIndex]?.selectedOption;
    const hasAnswered = currentSelection !== undefined;

    return (
        <SafeAreaView className="flex-1 bg-base">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <TouchableOpacity onPress={handleQuit} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center border border-slate-100 dark:border-slate-800">
                    <X size={20} color="#64748b" />
                </TouchableOpacity>

                <View className="items-center flex-1 px-4">
                    <Text className="text-[12px] font-black text-slate-400 mb-1">
                        Soru {currentIndex + 1} {!isTopicQuiz ? `/ ${questions.length}` : ''}
                    </Text>
                    {!isTopicQuiz && (
                        <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-600" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                        </View>
                    )}
                </View>

                <View className="flex-row items-center gap-x-2">
                    <TouchableOpacity 
                        onPress={handleToggleFavorite} 
                        className={`w-10 h-10 rounded-full items-center justify-center border ${isFavorited ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}
                    >
                        <Star size={18} color={isFavorited ? "#EAB308" : "#94a3b8"} fill={isFavorited ? "#EAB308" : "transparent"} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setReportModalVisible(true)} className="w-10 h-10 bg-rose-50 rounded-full items-center justify-center border border-rose-100">
                        <Flag size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-6 py-8">
                    {currentQuestion.image_url && (
                        <View className="w-full h-48 bg-slate-50 dark:bg-slate-800 rounded-3xl mb-6 items-center justify-center border border-slate-100 dark:border-slate-800">
                            <Sparkles size={32} color="#cbd5e1" />
                        </View>
                    )}
                    <Text className="text-xl font-black text-slate-900 dark:text-slate-50 leading-8">
                        {currentQuestion.content}
                    </Text>
                </View>

                <View className="px-6 gap-y-3">
                    {options.map((opt: string, index: number) => {
                        const isSelected = currentSelection === index;
                        const isCorrectOption = currentQuestion.correct_option === index;
                        
                        let borderColor = 'border-slate-100 dark:border-slate-800';
                        let bgColor = 'bg-white dark:bg-slate-900';
                        
                        if (hasAnswered) {
                            if (isCorrectOption) { borderColor = 'border-emerald-500'; bgColor = 'bg-emerald-50'; }
                            else if (isSelected) { borderColor = 'border-red-500'; bgColor = 'bg-red-50'; }
                        } else if (isSelected) {
                            borderColor = 'border-blue-500'; bgColor = 'bg-blue-50';
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                disabled={hasAnswered}
                                onPress={() => handleSelectOption(index)}
                                className={`p-5 rounded-2xl border-2 flex-row items-center ${borderColor} ${bgColor}`}
                            >
                                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${hasAnswered && isCorrectOption ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                                    <Text className={`font-black ${hasAnswered && isCorrectOption ? 'text-white' : 'text-slate-400'}`}>
                                        {['A', 'B', 'C', 'D'][index]}
                                    </Text>
                                </View>
                                <Text className="flex-1 font-bold text-slate-700">{opt}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {hasAnswered && currentQuestion.explanation && (
                    <View className="m-6 p-6 rounded-[32px] bg-blue-50 border border-blue-100">
                        <View className="flex-row items-center mb-3">
                            <Sparkles size={18} color="#2563eb" />
                            <Text className="ml-2 font-black text-blue-900">AI Hoca Yanıtı</Text>
                        </View>
                        <Text className="text-slate-600 dark:text-slate-300 leading-6">{currentQuestion.explanation}</Text>
                    </View>
                )}
            </ScrollView>

            <View className="p-6 flex-row gap-4 border-t border-slate-50">
                <TouchableOpacity
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                    className="h-14 w-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 items-center justify-center"
                >
                    <ChevronRight size={24} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNext}
                    className="h-14 flex-1 rounded-2xl bg-slate-900 items-center justify-center"
                >
                    <Text className="text-white font-black">
                        {currentIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sıradaki Soru'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Report Modal */}
            <Modal visible={reportModalVisible} animationType="fade" transparent>
                <View className="flex-1 justify-center bg-black/50 px-6">
                    <View className="bg-white dark:bg-slate-900 p-6 rounded-[32px]">
                        <Text className="text-xl font-bold mb-4">Soruyu Bildir</Text>
                        <TextInput
                            className="h-32 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6"
                            placeholder="Hata detayını belirtin..."
                            multiline
                            value={reportReason}
                            onChangeText={setReportReason}
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setReportModalVisible(false)} className="flex-1 h-12 rounded-xl bg-slate-100 items-center justify-center">
                                <Text>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleReportSubmit} className="flex-1 h-12 rounded-xl bg-red-500 items-center justify-center">
                                <Text className="text-white font-bold">Gönder</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}