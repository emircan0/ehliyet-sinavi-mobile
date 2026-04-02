import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { BrainCircuit, Sparkles, Target, BookOpen, ChevronRight, MessageSquare, Lightbulb, TrendingDown, Lock, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchWeakTopics } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useThemeMode } from '../../src/hooks/useThemeMode';

export default function AITutorScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);
    const [loading, setLoading] = useState(true);
    const [weakTopics, setWeakTopics] = useState<{ name: string, count: number }[]>([]);
    const [preferences, setPreferences] = useState<Record<string, string>>({});

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const categories = [
        { id: 'trafik', name: 'Trafik ve Çevre' },
        { id: 'ilkyardim', name: 'İlk Yardım' },
        { id: 'motor', name: 'Araç Tekniği' },
        { id: 'adap', name: 'Trafik Adabı' },
    ];

    const getCategoryName = (topicId: string) => {
        const cat = categories.find(c => c.id === topicId.toLowerCase());
        return cat ? cat.name : topicId.replace('-', ' ');
    };

    useEffect(() => {
        const getAnalysis = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const topics = await fetchWeakTopics(user.id);
                setWeakTopics(topics);

                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }).start();
            }

            // Müşteri Tercihlerini Çek
            const prefsData = await AsyncStorage.getItem('user_preferences');
            if (prefsData) {
                setPreferences(JSON.parse(prefsData));
            }

            setLoading(false);
        };
        getAnalysis();
    }, [fadeAnim]);

    // GÖREV ALGORİTMASI
    const getDynamicTask = () => {
        // Öncelik 1: Sınava çok az kalmış (Urgent) - Pratik ve hız şart.
        if (preferences.exam_date === 'urgent') {
            return {
                title: "Yoğun Antrenman: Gerçek Sınav Modu",
                desc: "Sınavına çok az kaldı! Hızlanmak ve sınav stresini atmak için bir an önce 50 soruluk genel deneme çözmelisin.",
                route: "/quiz/general",
                btnText: "Denemelere Başla",
                icon: Zap,
                bgColor: "bg-orange-600",
                textColor: "text-orange-600",
                shadow: "shadow-orange-200"
            };
        }
        
        // Öncelik 2: Hata Sayısı Fazla (Eksikler var) - Önce hataları temizlemeli.
        if (weakTopics.length > 0 && weakTopics[0].count >= 3) {
            return {
                title: "Kritik Eksikleri Temizle",
                desc: `Özellikle ${getCategoryName(weakTopics[0].name)} konusunda çok hatan var. Yeni konulara geçmeden zayıf noktalarını kapatalım.`,
                route: "/quiz/mistakes",
                btnText: "Hataları Kapat",
                icon: TrendingDown,
                bgColor: "bg-red-600",
                textColor: "text-red-600",
                shadow: "shadow-red-200"
            };
        }

        // Öncelik 3: Normal Zaman (Günde X dk) - İstikrar.
        if (preferences.exam_date === 'normal') {
            return {
                title: `Günlük Hedef: ${preferences.daily_goal || '20'} Dakika`,
                desc: "Sınava hazırlanmak için harika bir vakit. Hedefine sadık kalarak rastgele sorularla kendini zinde tut.",
                route: "/quiz/quick",
                btnText: "Günün Testini Çöz",
                icon: Target,
                bgColor: "bg-indigo-600",
                textColor: "text-indigo-600",
                shadow: "shadow-indigo-200"
            };
        }

        // Öncelik 4: Varsayılan (Rahat program veya onbarding bitirilmemişse) - Sıkılmaması için minimal efor.
        return {
            title: "Temel Atma: Mini Tekrar",
            desc: "Erkenden çalışman çok iyi. Sadece 1 adet mini test (10 soru) çözerek günü rahatça kapatabilirsin.",
            route: "/quiz/quick",
            btnText: "Mini Test Çöz",
            icon: BookOpen,
            bgColor: "bg-emerald-600",
            textColor: "text-emerald-600",
            shadow: "shadow-emerald-200"
        };
    };

    const task = getDynamicTask();
    const TaskIcon = task.icon;

    const { isDarkMode, colorScheme } = useThemeMode();

    if (loading) return (
        <ScreenLayout className="bg-base justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-slate-400 dark:text-slate-500 font-medium tracking-tight">AI Verileri Analiz Ediyor...</Text>
        </ScreenLayout>
    );

    return (
        <ScreenLayout className="bg-base">
            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* --- PREMIUM HEADER --- */}
                <View className="bg-slate-900 dark:bg-slate-950 pt-14 pb-12 px-6 rounded-b-[40px] shadow-2xl shadow-slate-200 dark:shadow-none mb-8 border-b border-white/5">
                    <View className="flex-row justify-between items-start mb-8">
                        <View>
                            <View className="flex-row items-center bg-indigo-500/20 self-start px-2 py-1 rounded-lg mb-3 border border-indigo-500/30">
                                <Sparkles size={12} color="#818cf8" />
                                <Text className="text-indigo-400 text-[10px] font-black ml-1.5 tracking-widest uppercase">AI Koç</Text>
                            </View>
                            <Text className="text-white text-3xl font-black tracking-tighter">Gelişim Analizi</Text>
                        </View>
                        <View className="w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center border border-white/10 shadow-lg">
                            <BrainCircuit size={32} color="white" />
                        </View>
                    </View>

                    {/* AI Sohbet Balonu */}
                    <View className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                        <View className="flex-row items-center mb-3">
                            <MessageSquare size={16} color="#818cf8" />
                            <Text className="text-indigo-300 text-[10px] font-black ml-2 uppercase tracking-widest">Hoca'nın Değerlendirmesi</Text>
                        </View>
                        <Text className="text-slate-100 dark:text-slate-200 text-[15px] font-medium leading-6">
                            {weakTopics.length > 0
                                ? `Merhaba! Verilerini analiz ettim. Özellikle "${getCategoryName(weakTopics[0].name)}" konusunda yoğunlaşmamız gerekiyor. Bu alanı düzelttiğimizde başarı oranın %15 artabilir. 🚀`
                                : "Harika gidiyorsun! Şu an için kritik bir zayıf noktanı tespit edemedim. MEB müfredatındaki başarını korumak için denemelere devam et!"}
                        </Text>
                    </View>
                </View>

                {/* --- ANALİZ KARTLARI --- */}
                <View className="px-6 mb-8">
                    <View className="flex-row justify-between items-end mb-5 px-1">
                        <Text className="text-slate-900 dark:text-slate-50 font-black text-xl tracking-tight">Kritik Eksikler</Text>
                        <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Hata Analizi</Text>
                    </View>

                    {weakTopics.length > 0 ? (
                        weakTopics.map((topic, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none mb-4 flex-row items-center"
                            >
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${index === 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                                    <TrendingDown size={24} color={index === 0 ? '#ef4444' : '#f97316'} />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-slate-900 dark:text-slate-50 font-bold text-[15px] capitalize">{getCategoryName(topic.name)}</Text>
                                        <Text className={`${index === 0 ? 'text-red-500' : 'text-orange-500'} font-black text-xs`}>{topic.count} Hata</Text>
                                    </View>
                                    <View className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <View
                                            className={`h-full ${index === 0 ? 'bg-red-500' : 'bg-orange-400'}`}
                                            style={{ width: `${Math.max(100 - (topic.count * 10), 20)}%` }}
                                        />
                                    </View>
                                </View>
                                <ChevronRight size={18} color="#94a3b8" className="ml-3" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="bg-white dark:bg-slate-900 p-10 rounded-[32px] items-center border border-dashed border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                            <Target size={48} color={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                            <Text className="text-slate-400 dark:text-slate-500 text-center font-bold mt-4 text-sm tracking-tight px-4 leading-5">Analiz edilecek veri birikiyor... Test çözmeye başla!</Text>
                        </View>
                    )}
                </View>

                {/* --- GÜNLÜK ÖZEL GÖREV (DİNAMİK) --- */}
                <View className="px-6 mb-10">
                    <View className={`${task.bgColor} p-7 rounded-[32px] shadow-2xl ${task.shadow} dark:shadow-none relative overflow-hidden`}>
                        <View className="flex-row items-center mb-4">
                            <View className="bg-white/20 p-2 rounded-xl border border-white/20">
                                <TaskIcon size={20} color="white" />
                            </View>
                            <Text className="text-white font-black text-[10px] ml-3 opacity-90 uppercase tracking-[2px]">AI GÖREVİ</Text>
                        </View>

                        <Text className="text-white text-2xl font-black mb-2 tracking-tight">{task.title}</Text>
                        <Text className="text-white text-[13px] font-medium leading-5 mb-7 opacity-90">
                            {task.desc}
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push(task.route as any)}
                            className="bg-white py-4 rounded-2xl items-center shadow-lg active:scale-95 transition-transform"
                        >
                            <Text className={`${task.textColor} font-black text-base`}>{task.btnText}</Text>
                        </TouchableOpacity>

                        <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                    </View>
                </View>

                {/* --- ÖNERİLEN KAYNAKLAR --- */}
                <View className="px-6 mb-4">
                    <Text className="text-slate-900 dark:text-slate-100 font-black text-xl tracking-tight mb-5 px-1">Gelişim Araçları</Text>
                    <View className="flex-row gap-x-4">
                        <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none items-center">
                            <View className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl mb-4 border border-amber-100/50 dark:border-amber-900/50">
                                <BookOpen size={24} color="#d97706" />
                            </View>
                            <Text className="text-slate-900 dark:text-slate-200 font-black text-sm text-center tracking-tight">Özet Notlar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none items-center">
                            <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-4 border border-blue-100/50 dark:border-blue-900/50">
                                <Target size={24} color="#2563eb" />
                            </View>
                            <Text className="text-slate-900 dark:text-slate-200 font-black text-sm text-center tracking-tight">Nokta Atışı</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </Animated.ScrollView>

            {!isPro && (
                <View className="absolute inset-0 bg-slate-50/98 dark:bg-slate-950/98 z-50 items-center justify-center px-7">
                    <View className="bg-white dark:bg-slate-900 p-10 rounded-[40px] items-center shadow-2xl shadow-slate-900/10 dark:shadow-none border border-slate-100 dark:border-slate-800 w-full mb-20 overflow-hidden">
                        <View className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/10 rounded-full" />

                        <View className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-3xl items-center justify-center mb-8 border border-amber-100 dark:border-amber-900/50">
                            <Lock size={36} color="#d97706" />
                        </View>

                        <Text className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-3 text-center tracking-tighter">Pro Üyelik</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-center mb-10 leading-6 font-medium text-[15px] px-2 opacity-80">
                            AI Hoca'nın derinlemesine analizlerini görmek ve sana özel çalışma programlarına ulaşmak için Premium'a geç.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push('/premium')}
                            className="bg-slate-900 dark:bg-indigo-600 w-full py-4.5 rounded-[22px] items-center shadow-xl shadow-slate-900/20 dark:shadow-indigo-600/30 active:scale-[0.98] transition-all"
                        >
                            <Text className="text-white font-black text-lg">Hemen Yükselt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/')}
                            className="mt-8 py-2 px-6 rounded-full active:bg-slate-50 dark:active:bg-slate-800"
                        >
                            <Text className="text-slate-400 dark:text-slate-500 font-extrabold text-sm tracking-tight uppercase">Ana Sayfaya Dön</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScreenLayout>
    );
}