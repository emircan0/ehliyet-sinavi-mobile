import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { BrainCircuit, Sparkles, Target, BookOpen, ChevronRight, MessageSquare, Lightbulb, TrendingDown, Lock } from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchWeakTopics } from '../../src/api/queries';
import { supabase } from '../../src/api/supabase';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';

export default function AITutorScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);
    const [loading, setLoading] = useState(true);
    const [weakTopics, setWeakTopics] = useState<{ name: string, count: number }[]>([]);

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
            setLoading(false);
        };
        getAnalysis();
    }, [fadeAnim]);

    if (loading) return (
        <ScreenLayout className="bg-white justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-slate-400 font-medium tracking-tight">AI Verileri Analiz Ediyor...</Text>
        </ScreenLayout>
    );

    return (
        <ScreenLayout className="bg-[#F8FAFC]">
            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* --- PREMIUM HEADER --- */}
                <View className="bg-slate-900 pt-14 pb-12 px-6 rounded-b-[40px] shadow-2xl shadow-slate-200 mb-8">
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
                        <Text className="text-slate-100 text-[15px] font-medium leading-6">
                            {weakTopics.length > 0
                                ? `Merhaba! Verilerini analiz ettim. Özellikle "${getCategoryName(weakTopics[0].name)}" konusunda yoğunlaşmamız gerekiyor. Bu alanı düzelttiğimizde başarı oranın %15 artabilir. 🚀`
                                : "Harika gidiyorsun! Şu an için kritik bir zayıf noktanı tespit edemedim. MEB müfredatındaki başarını korumak için denemelere devam et!"}
                        </Text>
                    </View>
                </View>

                {/* --- ANALİZ KARTLARI --- */}
                <View className="px-6 mb-8">
                    <View className="flex-row justify-between items-end mb-5 px-1">
                        <Text className="text-slate-900 font-black text-xl tracking-tight">Kritik Eksikler</Text>
                        <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Hata Analizi</Text>
                    </View>

                    {weakTopics.length > 0 ? (
                        weakTopics.map((topic, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm shadow-slate-200/40 mb-4 flex-row items-center"
                            >
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${index === 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
                                    <TrendingDown size={24} color={index === 0 ? '#ef4444' : '#f97316'} />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-slate-900 font-bold text-[15px] capitalize">{getCategoryName(topic.name)}</Text>
                                        <Text className={`${index === 0 ? 'text-red-500' : 'text-orange-500'} font-black text-xs`}>{topic.count} Hata</Text>
                                    </View>
                                    <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
                        <View className="bg-white p-10 rounded-[32px] items-center border border-dashed border-slate-200">
                            <Target size={48} color="#e2e8f0" />
                            <Text className="text-slate-400 text-center font-bold mt-4 text-sm tracking-tight px-4 leading-5">Analiz edilecek veri birikiyor... Test çözmeye başla!</Text>
                        </View>
                    )}
                </View>

                {/* --- GÜNLÜK ÖZEL GÖREV --- */}
                <View className="px-6 mb-10">
                    <View className="bg-indigo-600 p-7 rounded-[32px] shadow-2xl shadow-indigo-200 relative overflow-hidden">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-white/20 p-2 rounded-xl border border-white/20">
                                <Lightbulb size={20} color="white" />
                            </View>
                            <Text className="text-indigo-100 font-black text-[10px] ml-3 uppercase tracking-[2px]">Günün Özel Görevi</Text>
                        </View>

                        <Text className="text-white text-2xl font-black mb-2 tracking-tight">Hatalarını Temizle</Text>
                        <Text className="text-indigo-100 text-[13px] font-medium leading-5 mb-7 opacity-90">
                            Daha önce yanlış yaptığın sorulardan oluşan 10'luk telafi setini şimdi çöz.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push('/quiz/mistakes')}
                            className="bg-white py-4 rounded-2xl items-center shadow-lg active:scale-95 transition-transform"
                        >
                            <Text className="text-indigo-600 font-black text-base">Görevi Başlat</Text>
                        </TouchableOpacity>

                        <View className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                    </View>
                </View>

                {/* --- ÖNERİLEN KAYNAKLAR --- */}
                <View className="px-6 mb-4">
                    <Text className="text-slate-900 font-black text-xl tracking-tight mb-5 px-1">Gelişim Araçları</Text>
                    <View className="flex-row gap-x-4">
                        <TouchableOpacity className="flex-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm shadow-slate-200/40 items-center">
                            <View className="bg-amber-50 p-4 rounded-2xl mb-4 border border-amber-100/50">
                                <BookOpen size={24} color="#d97706" />
                            </View>
                            <Text className="text-slate-900 font-black text-sm text-center tracking-tight">Özet Notlar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm shadow-slate-200/40 items-center">
                            <View className="bg-blue-50 p-4 rounded-2xl mb-4 border border-blue-100/50">
                                <Target size={24} color="#2563eb" />
                            </View>
                            <Text className="text-slate-900 font-black text-sm text-center tracking-tight">Nokta Atışı</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </Animated.ScrollView>

            {!isPro && (
                <View className="absolute inset-0 bg-[#F8FAFC]/98 z-50 items-center justify-center px-7">
                    <View className="bg-white p-10 rounded-[40px] items-center shadow-2xl shadow-indigo-900/10 border border-slate-100 w-full mb-20 overflow-hidden">
                        <View className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/10 rounded-full" />

                        <View className="w-20 h-20 bg-amber-50 rounded-3xl items-center justify-center mb-8 border border-amber-100">
                            <Lock size={36} color="#d97706" />
                        </View>

                        <Text className="text-3xl font-black text-slate-900 mb-3 text-center tracking-tighter">Pro Üyelik</Text>
                        <Text className="text-slate-500 text-center mb-10 leading-6 font-medium text-[15px] px-2 opacity-80">
                            AI Hoca'nın derinlemesine analizlerini görmek ve sana özel çalışma programlarına ulaşmak için Premium'a geç.
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push('/premium')}
                            className="bg-slate-900 w-full py-4.5 rounded-[22px] items-center shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
                        >
                            <Text className="text-white font-black text-lg">Hemen Yükselt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/')}
                            className="mt-8 py-2 px-6 rounded-full active:bg-slate-50"
                        >
                            <Text className="text-slate-400 font-bold text-sm tracking-tight uppercase">Ana Sayfaya Dön</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScreenLayout>
    );
}