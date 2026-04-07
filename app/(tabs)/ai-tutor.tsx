import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { BrainCircuit, Sparkles, Target, BookOpen, ChevronRight, MessageSquare, Lightbulb, TrendingDown, Lock, Zap, Award, Activity, Calendar, Share2, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchAdvancedMasteryData } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { MasteryCard } from '../../src/components/quiz/MasteryCard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function AITutorScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [masteryData, setMasteryData] = useState<any[]>([]);
    const [preferences, setPreferences] = useState<Record<string, string>>({});

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const categoriesMap: Record<string, string> = {
        'trafik': 'Trafik ve Çevre',
        'ilkyardim': 'İlk Yardım',
        'motor': 'Araç Tekniği',
        'adap': 'Trafik Adabı',
    };

    useEffect(() => {
        const getAnalysis = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await fetchAdvancedMasteryData(user.id);
                setMasteryData(data);

                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }).start();
            }

            const prefsData = await AsyncStorage.getItem('user_preferences');
            if (prefsData) {
                setPreferences(JSON.parse(prefsData));
            }

            setLoading(false);
        };
        getAnalysis();
    }, [fadeAnim]);

    // --- PROFESYONEL GÖREV ALGORİTMASI ---
    const getProfessionalTask = () => {
        // En zayıf konu (En düşük mastery score)
        const weakest = masteryData[0];
        
        // 1. ACİL DURUM (Sınav Yakın)
        if (preferences.exam_date === 'urgent') {
            return {
                title: "Simülasyon Aktif: Sınav Provası",
                desc: "Sınav vaktin geldi! AI Hoca şu an konu çalışmanı değil, gerçek süre baskısı altında 50 soruluk tam deneme çözmeni öneriyor.",
                route: "/quiz/general",
                btnText: "Simülasyonu Başlat",
                icon: Zap,
                bgColor: "bg-orange-600",
                textColor: "text-orange-600",
                shadow: "shadow-orange-200"
            };
        }

        // 2. KRİTİK EKSİK (Düşük Başarı + Yeterli Soru)
        if (weakest && weakest.masteryScore < 60 && weakest.totalAttempts >= 5) {
            return {
                title: `${categoriesMap[weakest.name] || weakest.name} Atölyesi`,
                desc: `Bu konuda %${weakest.masteryScore} başarıyla kritik eşiktesin. Yapay zeka senin için bu konudaki hatalarından özel bir telafi testi hazırladı.`,
                route: "/quiz/mistakes",
                btnText: "Eksikleri Kapat",
                icon: TrendingDown,
                bgColor: "bg-rose-600",
                textColor: "text-rose-600",
                shadow: "shadow-rose-200"
            };
        }

        // 3. GÜVEN TESTİ (Yüksek Başarı ama Düşük Soru Sayısı)
        const lowDataTopic = masteryData.find((m: any) => m.totalAttempts < 5);
        if (lowDataTopic) {
            return {
                title: "Veri Doğrulama: Güven Testi",
                desc: `${categoriesMap[lowDataTopic.name] || lowDataTopic.name} konusunda henüz verimiz az. AI Koç'un senin gerçek seviyeni belirlemesi için 10 soru daha çözmelisin.`,
                route: `/quiz/${lowDataTopic.name}`,
                btnText: "Seviyemi Kanıtla",
                icon: Target,
                bgColor: "bg-blue-600",
                textColor: "text-blue-600",
                shadow: "shadow-blue-200"
            };
        }

        // 4. PASLANMA KONTROLÜ (Uzun zamandır çözülmeyen konu)
        const oldest = [...masteryData].sort((a,b) => new Date(a.lastSolved).getTime() - new Date(b.lastSolved).getTime())[0];
        if (oldest) {
            const daysSince = Math.floor((new Date().getTime() - new Date(oldest.lastSolved).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince >= 3) {
                return {
                    title: "Hafıza Yenileme: Pas Silme",
                    desc: `${categoriesMap[oldest.name] || oldest.name} konusunu en son ${daysSince} gün önce çözdün. UNUTMA EĞRİSİ başlamadan hızlı bir tekrar yapalım.`,
                    route: `/quiz/${oldest.name}`,
                    btnText: "Hemen Hatırla",
                    icon: Activity,
                    bgColor: "bg-amber-600",
                    textColor: "text-amber-600",
                    shadow: "shadow-amber-200"
                };
            }
        }

        // 5. VARSAYILAN (Hızlı Pratik)
        return {
            title: "Nöral Kondisyon: Günlük Pratik",
            desc: "Her şey kontrol altında! Zihnini zinde tutmak ve reflekslerini geliştirmek için karışık bir hızlı pratik testi çözelim.",
            route: "/quiz/quick",
            btnText: "Antrenmana Başla",
            icon: BrainCircuit,
            bgColor: "bg-indigo-600",
            textColor: "text-indigo-600",
            shadow: "shadow-indigo-200"
        };
    };

    const task = getProfessionalTask();
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
                            {masteryData.length > 0
                                ? (masteryData[0].masteryScore < 60
                                    ? `Merhaba! Verilerini analiz ettim. Özellikle "${categoriesMap[masteryData[0].name] || masteryData[0].name}" konusunda derinleşmemiz gerekiyor. Başarı oranını %85 üzerine taşımalıyız. 🚀`
                                    : masteryData[0].trend === 'declining'
                                        ? "Bugün biraz yorgun gibisin, son testlerinde hafif bir düşüş sezdim. Ama moral bozmak yok, toparlayacağız! 💪"
                                        : "Mükemmel gidiyorsun! Uzmanlık seviyen genel ortalamanın üzerinde. Şimdi bu başarıyı korumaya odaklanalım! 🏆")
                                : "Harika bir başlangıç için her şey hazır! Şu an verilerini topluyorum. Birkaç test çözdüğünde sana özel ilk analizini buraya bırakacağım."}
                        </Text>
                    </View>
                </View>

                {/* --- ANALİZ KARTLARI --- */}
                <View className="px-6 mb-8">
                    <View className="flex-row justify-between items-end mb-5 px-1">
                        <Text className="text-slate-900 dark:text-slate-50 font-black text-xl tracking-tight">Kritik Eksikler</Text>
                        <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Mastery Analizi</Text>
                    </View>

                    {masteryData.length > 0 ? (
                        masteryData.map((data, index) => (
                            <MasteryCard 
                                key={index} 
                                data={data} 
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push(`/quiz/${data.name}` as any);
                                }} 
                            />
                        ))
                    ) : (
                        <View className="bg-white dark:bg-slate-900 p-10 rounded-[32px] items-center border border-dashed border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                            <Target size={48} color={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                            <Text className="text-slate-400 dark:text-slate-500 text-center font-bold mt-4 text-sm tracking-tight px-4 leading-5">Akıllı analiz sistemi veri biriktiriyor... Test çözmeye başlayarak AI Hoca'yı eğitebilirsin!</Text>
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

            {/* 
            App Store başvurusu için premium kilidi kaldırıldı
            {!isPro && (
                <View className="absolute inset-0 bg-slate-50/98 dark:bg-slate-950/98 z-50 items-center justify-center px-7">
                    ...
                </View>
            )} 
            */}
        </ScreenLayout>
    );
}