import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Check, Crown, X, Star, Zap, ShieldCheck } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
    const router = useRouter();
    const setPro = useSubscriptionStore(state => state.setPro);

    const handlePurchase = () => {
        setPro(true);
        alert('Tebrikler! Pro sürüme yükselttiniz (Mock Testing).');
        router.back();
    };

    const features = [
        { title: "Sınırsız Soru Çözümü", desc: "Hiçbir limit olmadan binlerce soru.", icon: Zap, color: "#3b82f6" },
        { title: "Reklamsız Deneyim", desc: "Odaklanmanı bozacak hiçbir şey yok.", icon: ShieldCheck, color: "#10b981" },
        { title: "Detaylı Analiz", desc: "Zayıf konularını AI ile keşfet.", icon: Star, color: "#f59e0b" },
        { title: "Çıkmış Sorular", desc: "Son 5 yılın tüm resmi sınavları.", icon: Crown, color: "#8b5cf6" },
    ];

    return (
        <ScreenLayout className="bg-slate-950">

            
            <LinearGradient
                colors={['#1e293b', '#020617']}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="px-6 pt-14 pb-8 flex-row justify-between items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                        >
                            <X size={20} color="white" />
                        </TouchableOpacity>
                        <View className="bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
                            <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Premium Üyelik</Text>
                        </View>
                        <View className="w-10" />
                    </View>

                    {/* Hero */}
                    <View className="items-center px-8 mb-12">
                        <View className="relative">
                            <View className="absolute -inset-4 bg-amber-400/20 blur-3xl rounded-full" />
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                className="w-24 h-24 rounded-[32px] items-center justify-center shadow-2xl shadow-amber-500/50 rotate-6"
                            >
                                <Crown size={48} color="#78350f" fill="#78350f" />
                            </LinearGradient>
                        </View>
                        
                        <Text className="text-white text-4xl font-black text-center tracking-tighter mt-10 mb-3">
                            İlk Seferde Geçin
                        </Text>
                        <Text className="text-slate-400 text-center text-sm px-6 leading-6 font-medium">
                            Yapay zeka destekli çalışma planıyla sınav stresini geride bırakın.
                        </Text>
                    </View>

                    {/* Features Grid */}
                    <View className="px-6 mb-12 flex-row flex-wrap justify-between gap-y-4">
                        {features.map((item, index) => (
                            <View key={index} className="w-[48%] bg-white/5 p-5 rounded-[28px] border border-white/5">
                                <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center mb-3">
                                    <item.icon size={20} color={item.color} />
                                </View>
                                <Text className="text-white font-black text-sm mb-1">{item.title}</Text>
                                <Text className="text-slate-500 text-[10px] font-bold leading-4">{item.desc}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Pricing Card */}
                    <View className="mx-6 relative">
                        <LinearGradient
                            colors={['#ffffff10', '#ffffff05']}
                            className="rounded-[40px] p-8 border border-white/10 overflow-hidden"
                        >
                            <View className="absolute top-0 right-0 bg-amber-400 px-4 py-1.5 rounded-bl-[20px]">
                                <Text className="text-[10px] font-black text-amber-950 uppercase tracking-widest">En Popüler</Text>
                            </View>
                            
                            <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Aylık Sınırsız</Text>
                            <View className="flex-row items-end mb-8">
                                <Text className="text-white text-5xl font-black tracking-tighter">₺49,99</Text>
                                <Text className="text-slate-500 text-lg font-bold ml-2 mb-1.5">/ay</Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={handlePurchase}
                                className="overflow-hidden rounded-[24px]"
                            >
                                <LinearGradient
                                    colors={['#fbbf24', '#f59e0b']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-5 items-center"
                                >
                                    <View className="flex-row items-center">
                                        <Text className="text-amber-950 font-black text-lg mr-2">Pro Sürüme Geç</Text>
                                        <Zap size={18} color="#78350f" fill="#78350f" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                            
                            <Text className="text-slate-500 text-[10px] text-center mt-5 font-medium">
                                İstediğiniz zaman uygulama ayarlarından iptal edebilirsiniz.
                            </Text>
                        </LinearGradient>
                    </View>

                    <Text className="text-slate-600 text-[9px] text-center mt-8 px-10">
                        * Satın alma işlemi sonrası iTunes hesabınızdan tahsilat yapılır. Gizlilik Politikası ve Kullanım Koşulları geçerlidir.
                    </Text>
                </ScrollView>
            </LinearGradient>
        </ScreenLayout>
    );
}