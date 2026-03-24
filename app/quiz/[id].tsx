import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
    Alert, SafeAreaView, StatusBar, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Flag, ChevronRight, CheckCircle2, Sparkles, Save } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/api/supabase';
import { fetchQuestionsByCategory, fetchQuickPracticeQuestions, saveQuizResults, reportQuestion, fetchQuestionsByExamId, fetchMistakeQuestions, fetchFavoriteQuestions } from '../../src/api/queries';
import { useQuizStore } from '../../src/store/useQuizStore';

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
                    console.log("[DEBUG] Hızlı Antrenman soruları çekiliyor...");
                    data = await fetchQuickPracticeQuestions(user.id);
                } else if (idString === 'mistakes' && user) {
                    console.log("[DEBUG] Hata Telafisi soruları çekiliyor...");
                    data = await fetchMistakeQuestions(user.id);
                } else if (idString === 'favorites' && user) {
                    console.log("[DEBUG] Favori sorular çekiliyor...");
                    data = await fetchFavoriteQuestions(user.id);
                }
                // --- NORMAL SINAV VE KATEGORİLER ---
                else if (isNumeric || isUUID) {
                    console.log("[DEBUG] Sınav ID'sine göre sorular çekiliyor...");
                    data = await fetchQuestionsByExamId(idString);
                } else {
                    console.log("[DEBUG] Kategoriye göre sorular çekiliyor...");
                    data = await fetchQuestionsByCategory(idString);
                }

                if (data && data.length > 0) {
                    setQuestions(data);
                    console.log(`[DEBUG] Başarılı! Toplam ${data.length} soru bulundu.`);

                    // --- YARIDA KALAN SINAVI KONTROL ET ---
                    try {
                        const savedState = await AsyncStorage.getItem(`@quiz_state_${idString}`);
                        if (savedState) {
                            const parsed = JSON.parse(savedState);
                            restoreQuizState(parsed.answers || [], parsed.index || 0);
                            console.log("[DEBUG] Kayıtlı oturum bulundu. Kaldığı yerden devam ediliyor...");
                        }
                    } catch (e) {
                        console.log("[DEBUG] Kayıtlı oturum okunamadı", e);
                    }

                } else {
                    console.log("[DEBUG] HATA: Sorular boş döndü!");
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
        const isCorrect = optionIndex === currentQuestion.correct_option;

        // --- TİTREŞİM (HAPTIC) GERİ BİLDİRİMİ ---
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
        prevQuestion();
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleNext();
    };

    // --- SINAVI DURAKLAT VE KAYDET ---
    const pauseQuiz = async () => {
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const validAnswers = selectedAnswers.filter(a => a !== undefined);
            const { correctCount, wrongCount, score } = calculateScore();

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

        setIsSubmitting(false);
        router.back();
    };

    // --- SINAVI TAMAMEN BİTİR ---
    const finishQuiz = async () => {
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const validAnswers = selectedAnswers.filter(a => a !== undefined);
            const { correctCount, wrongCount, score } = calculateScore();

            await saveQuizResults(user.id, id as string, score, correctCount, wrongCount, questions.length, validAnswers);

            await AsyncStorage.removeItem(`@quiz_state_${id}`);
        }

        setIsSubmitting(false);
        router.replace('/quiz/result');
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
        if (questions.length === 0) {
            let emptyTitle = "Soru Bulunamadı";
            let emptyDesc = "Bu teste ait herhangi bir soru kaydı bulunamadı.";

            if (id === 'favorites') {
                emptyTitle = "Henüz Favori Sorun Yok";
                emptyDesc = "Test çözerken beğendiğin veya zorlandığın soruları sonradan tekrar etmek için yıldızlayabilirsin.";
            } else if (id === 'mistakes') {
                emptyTitle = "Harika Gidiyorsun!";
                emptyDesc = "Şu an için telafi etmen gereken hiçbir yanlış sorun bulunmuyor. Böyle devam et!";
            } else if (id === 'quick') {
                emptyTitle = "Antrenman Tamamlandı";
                emptyDesc = "Hızlı antrenman sorularının hepsini tamamladın. Yarın tekrar gel!";
            }

            return (
                <View className="flex-1 items-center justify-center bg-[#F2F2F7] px-8 leading-6">
                    <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm border border-[#E5E5EA]">
                        <Sparkles size={40} color="#007AFF" />
                    </View>
                    <Text className="text-black text-[22px] font-bold text-center tracking-tight mb-3">{emptyTitle}</Text>
                    <Text className="text-[#8E8E93] text-[16px] text-center mb-8 leading-6">{emptyDesc}</Text>
                    <TouchableOpacity onPress={() => router.back()} className="bg-[#007AFF] px-8 py-4 rounded-2xl w-full flex-row items-center justify-center shadow-sm object-cover">
                        <Text className="text-white font-bold text-[17px]">Geri Dön</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View className="flex-1 items-center justify-center bg-[#F2F2F7] px-6">
                <Text className="text-black text-lg font-bold text-center mb-4">Soru yüklenemedi veya beklenmeyen bir hata oluştu.</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-[#007AFF] px-8 py-4 rounded-2xl w-full flex-row items-center justify-center shadow-sm">
                    <Text className="text-white font-semibold text-[17px]">Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const options = currentQuestion.options || [];
    const currentSelection = selectedAnswers[currentIndex]?.selectedOption;
    const hasAnswered = currentSelection !== undefined;

    return (
        <SafeAreaView className="flex-1 bg-[#F2F2F7]">
            <StatusBar barStyle="dark-content" />

            {/* --- ÜST BİLGİ ÇUBUĞU (Header) --- */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <TouchableOpacity onPress={handleQuit} className="p-2">
                    <X size={24} color="#8E8E93" />
                </TouchableOpacity>

                {!isTopicQuiz ? (
                    <View className="items-center">
                        <Text className="text-[17px] font-semibold text-black tracking-tight">
                            Soru {currentIndex + 1} / {questions.length}
                        </Text>
                        <View className="w-24 h-1.5 bg-[#E5E5EA] rounded-full mt-2 overflow-hidden">
                            <View
                                className="h-full bg-[#007AFF]"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </View>
                    </View>
                ) : (
                    <View className="items-center opacity-0">
                        {/* Placeholder to keep layout balanced */}
                        <Text className="text-[17px] font-semibold text-black tracking-tight">Test</Text>
                    </View>
                )}

                {/* --- KAYDET VE ÇIK İKONU vb --- */}
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => setReportModalVisible(true)} className="p-2 mr-1">
                        <Flag size={20} color="#FF3B30" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleQuit} className="p-2">
                        <Save size={20} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- İÇERİK (Soru, Şıklar ve Açıklama) ScrollView İçinde --- */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* --- SORU ALANI --- */}
                <View className="px-6 py-6">
                    {currentQuestion.image_url ? (
                        <View className="w-full h-48 bg-[#E5E5EA] rounded-2xl mb-6 overflow-hidden">
                        </View>
                    ) : null}

                    <Text className="text-[22px] font-bold text-black leading-8 tracking-tight">
                        {currentQuestion.content}
                    </Text>
                </View>

                {/* --- ŞIKLAR --- */}
                <View className="px-6 gap-y-3 mt-2">
                    {options.map((opt: string, index: number) => {
                        if (!opt) return null;

                        const isSelected = currentSelection === index;
                        const isCorrectOption = currentQuestion.correct_option === index;

                        let containerStyle = 'border-[#E5E5EA] bg-white';
                        let circleStyle = 'border-[#C7C7CC] bg-transparent';
                        let textStyle = 'text-black';
                        let IconComponent = <Text className="text-[#8E8E93] font-semibold">{['A', 'B', 'C', 'D'][index]}</Text>;

                        if (hasAnswered) {
                            if (isCorrectOption) {
                                containerStyle = 'border-[#34C759] bg-[#34C759]/10';
                                circleStyle = 'border-[#34C759] bg-[#34C759]';
                                textStyle = 'text-[#34C759] font-semibold';
                                IconComponent = <CheckCircle2 size={18} color="white" />;
                            } else if (isSelected && !isCorrectOption) {
                                containerStyle = 'border-[#FF3B30] bg-[#FF3B30]/10';
                                circleStyle = 'border-[#FF3B30] bg-[#FF3B30]';
                                textStyle = 'text-[#FF3B30] font-semibold';
                                IconComponent = <X size={18} color="white" />;
                            } else {
                                containerStyle = 'border-[#E5E5EA] bg-white opacity-50';
                                textStyle = 'text-[#8E8E93]';
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                disabled={hasAnswered}
                                onPress={() => handleSelectOption(index)}
                                className={`flex-row items-center p-4 rounded-[20px] border-[1.5px] ${containerStyle}`}
                            >
                                <View className={`w-8 h-8 rounded-full items-center justify-center border-[1.5px] mr-3 ${circleStyle}`}>
                                    {IconComponent}
                                </View>
                                <Text className={`flex-1 text-[17px] ${textStyle}`}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* --- AI HOCA AÇIKLAMASI --- */}
                {hasAnswered && currentQuestion.explanation ? (
                    <View className="mx-6 mt-6 bg-[#E8F0FE] p-4 rounded-[20px] border-[1.5px] border-[#D2E3FC]">
                        <View className="flex-row items-center mb-2">
                            <Sparkles size={18} color="#1A73E8" />
                            <Text className="ml-2 font-bold text-[#1A73E8] text-[15px]">AI Hoca Açıklaması</Text>
                        </View>
                        <Text className="text-[#174EA6] text-[15px] leading-6 font-medium">
                            {currentQuestion.explanation}
                        </Text>
                    </View>
                ) : null}
            </ScrollView>

            {/* --- ALT BUTONLAR (Footer) --- */}
            <View className="px-6 pb-8 pt-4 bg-[#F2F2F7] flex-row gap-3">
                {/* GERİ BUTONU */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={currentIndex === 0}
                    onPress={handlePrev}
                    className={`h-14 w-14 rounded-2xl items-center justify-center border ${currentIndex === 0 ? 'bg-white border-[#E5E5EA] opacity-40' : 'bg-white border-[#E5E5EA]'}`}
                >
                    <ChevronRight size={24} color="#8E8E93" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>

                {/* PAS GEÇ BUTONU (Sadece cevaplanmadıysa) */}
                {!hasAnswered && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleSkip}
                        className="h-14 flex-1 rounded-2xl items-center justify-center border border-[#E5E5EA] bg-white"
                    >
                        <Text className="text-[#8E8E93] text-[17px] font-semibold">Pas Geç</Text>
                    </TouchableOpacity>
                )}

                {/* SONRAKİ / BİTİR BUTONU */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!hasAnswered && currentIndex === questions.length - 1}
                    onPress={handleNext}
                    className={`h-14 rounded-2xl flex-row items-center justify-center shadow-sm ${hasAnswered ? 'bg-[#007AFF] flex-1' : (!hasAnswered ? 'bg-[#007AFF] flex-1' : 'bg-[#E5E5EA] flex-1')}`}
                >
                    <Text className="text-[17px] font-semibold text-white mr-2">
                        {currentIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki Soru'}
                    </Text>
                    {currentIndex !== questions.length - 1 && (
                        <ChevronRight size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>

            {/* --- RAPORLAMA MODALI --- */}
            <Modal visible={reportModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/40">
                    <View className="bg-[#F2F2F7] rounded-t-[32px] p-6 pb-12 shadow-xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-[20px] font-bold text-black tracking-tight">Soruyu Bildir</Text>
                            <TouchableOpacity onPress={() => setReportModalVisible(false)} className="p-2 bg-[#E5E5EA] rounded-full">
                                <X size={20} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-[15px] text-[#8E8E93] mb-4 leading-5">
                            Bu soruda bir hata olduğunu düşünüyorsanız lütfen bize kısaca açıklayın.
                        </Text>

                        <TextInput
                            className="bg-white p-4 rounded-2xl text-[17px] text-black h-32 border border-[#E5E5EA]"
                            placeholder="Örn: C şıkkı eksik yazılmış..."
                            placeholderTextColor="#C7C7CC"
                            multiline
                            textAlignVertical="top"
                            value={reportReason}
                            onChangeText={setReportReason}
                        />

                        <TouchableOpacity
                            onPress={handleReportSubmit}
                            className="mt-6 h-14 bg-[#FF3B30] rounded-2xl items-center justify-center shadow-sm"
                        >
                            <Text className="text-white text-[17px] font-semibold">Bildirimi Gönder</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}