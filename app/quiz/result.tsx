import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    StyleSheet,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, CheckCircle2, XCircle, Home, RotateCcw, Target, Sparkles, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../src/api/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useThemeMode } from '../../src/hooks/useThemeMode';

const { width, height } = Dimensions.get('window');

export default function QuizResultScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();
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
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="#0A84FF" />
                <Text className="mt-4 text-white/60 font-medium">Başarın hesaplanıyor...</Text>
            </View>
        );
    }

    if (!result) {
        return (
            <View className="flex-1 items-center justify-center bg-black px-6">
                <Text className="text-white text-lg font-bold mb-4">Sonuç bulunamadı.</Text>
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/')}
                    className="bg-[#0A84FF] px-8 py-4 rounded-2xl"
                >
                    <Text className="text-white font-bold">Ana Sayfaya Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isSuccess = result.score >= 70;
    const primaryColor = isSuccess ? '#34C759' : '#0A84FF'; // Başarısızlıkta bile motive edici mavi

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Arka Plan Degrade */}
            <LinearGradient
                colors={isSuccess ? ['#064e3b', '#020617'] : ['#1e1b4b', '#020617']}
                style={styles.gradient}
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                    <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="px-6 pt-12 items-center">

                            {/* Üst İkon & Başlık */}
                            <Animated.View
                                entering={ZoomIn.delay(200).springify()}
                                className="items-center mb-10"
                            >
                                <View className="w-40 h-40 rounded-full items-center justify-center mb-6 relative">
                                    <LinearGradient
                                        colors={isSuccess ? ['#34C75944', 'transparent'] : ['#0A84FF44', 'transparent']}
                                        style={styles.iconGlow}
                                    />
                                    <View
                                        style={{ 
                                            backgroundColor: isSuccess ? '#34C75915' : '#0A84FF15', 
                                            borderColor: isSuccess ? '#34C75933' : '#0A84FF33' 
                                        }}
                                        className="w-32 h-32 rounded-full border-2 items-center justify-center"
                                    >
                                        <Trophy size={72} color={isSuccess ? '#34C759' : '#0A84FF'} strokeWidth={1.5} />
                                    </View>
                                    <View className="absolute top-2 right-2 bg-yellow-400 w-12 h-12 rounded-full items-center justify-center border-4 border-[#020617] shadow-lg shadow-yellow-500/50">
                                        <Sparkles size={22} color="black" />
                                    </View>
                                </View>

                                <Animated.Text
                                    entering={FadeInDown.delay(400)}
                                    className="text-[36px] font-black text-white tracking-tight text-center mb-3"
                                >
                                    {isSuccess ? 'Harikasın! 🎉' : 'Birlikte Başaracağız 🚀'}
                                </Animated.Text>
                                <Animated.Text
                                    entering={FadeInDown.delay(500)}
                                    className="text-white/60 text-lg font-medium text-center px-6 leading-7"
                                >
                                    {isSuccess
                                        ? 'Bu konuyu gayet iyi kavramışsın. Sınava hazırsın!'
                                        : 'Öğrenilecek şeyler var. Hatalarından ders çıkararak ilerle!'}
                                </Animated.Text>
                            </Animated.View>

                            {/* Skor Kartı - Glassmorphism */}
                            <Animated.View
                                entering={FadeInUp.delay(600).springify()}
                                className="w-full rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-white/[0.03]"
                            >
                                <BlurView intensity={80} tint="dark" className="p-8">
                                    <View className="items-center mb-10">
                                        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-[6px] mb-4">TOPLAM PUAN</Text>
                                        <View className="flex-row items-end">
                                            <Text className={`text-[90px] font-black leading-[90px] ${isSuccess ? 'text-[#34C759]' : 'text-[#0A84FF]'}`}>
                                                {result?.score ?? 0}
                                            </Text>
                                            <Text className="text-3xl font-bold text-white/40 mb-3 ml-2">/100</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-center bg-white/5 rounded-[30px] p-6 border border-white/5">
                                        <View className="items-center flex-1">
                                            <View className="bg-[#34C75920] w-12 h-12 items-center justify-center rounded-[18px] mb-3">
                                                <CheckCircle2 size={22} color="#34C759" />
                                            </View>
                                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Doğru</Text>
                                            <Text className="text-white text-2xl font-black mt-1">{result?.correct_count ?? 0}</Text>
                                        </View>

                                        <View className="w-[1px] h-14 bg-white/10 mx-2" />

                                        <View className="items-center flex-1">
                                            <View className="bg-[#FF3B3020] w-12 h-12 items-center justify-center rounded-[18px] mb-3">
                                                <XCircle size={22} color="#FF3B30" />
                                            </View>
                                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Yanlış</Text>
                                            <Text className="text-white text-2xl font-black mt-1">{result?.wrong_count ?? 0}</Text>
                                        </View>

                                        <View className="w-[1px] h-14 bg-white/10 mx-2" />

                                        <View className="items-center flex-1">
                                            <View className="bg-[#0A84FF20] w-12 h-12 items-center justify-center rounded-[18px] mb-3">
                                                <Target size={22} color="#0A84FF" />
                                            </View>
                                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Soru</Text>
                                            <Text className="text-white text-2xl font-black mt-1">{result?.total_questions ?? 0}</Text>
                                        </View>
                                    </View>
                                </BlurView>
                            </Animated.View>
                        </View>
                    </ScrollView>

                    {/* Aksiyonlar - Sabit Alt Bölüm */}
                    <View className="px-8 pb-12 pt-6 border-t border-white/10 bg-[#020617]">
                        <View className="gap-y-4">
                            {(result?.wrong_count ?? 0) > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        router.push('/quiz/mistakes');
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#FF3B30', '#D7261B']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="w-full h-[68px] rounded-[24px] flex-row items-center justify-center shadow-2xl shadow-rose-500/50"
                                    >
                                        <RotateCcw size={24} color="white" strokeWidth={2.5} />
                                        <Text className="text-white text-lg font-black ml-3 tracking-wide uppercase">
                                            Hataları Telafi Et
                                        </Text>
                                        <View className="ml-4 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/10">
                                            <Text className="text-white text-[13px] font-black">{result?.wrong_count}</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.replace('/(tabs)/');
                                }}
                                activeOpacity={0.8}
                                className={`w-full h-[68px] rounded-[24px] flex-row items-center justify-center border-2 border-white/10 ${isDarkMode ? 'bg-white/5' : 'bg-slate-800'}`}
                            >
                                <Home size={22} color="white" strokeWidth={2.5} />
                                <Text className="text-white text-lg font-bold ml-3">
                                    Ana Sayfaya Dön
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    iconGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 100,
        opacity: 0.5,
    }
});