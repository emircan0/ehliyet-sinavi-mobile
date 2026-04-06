import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Lock, HardDrive, EyeOff, UserCheck } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useThemeMode } from '../src/hooks/useThemeMode';

export default function PrivacyScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();

    const Section = ({ title, content, icon: Icon }: { title: string, content: string, icon: any }) => (
        <View className="mb-8">
            <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center mr-3">
                    <Icon size={18} color="#3b82f6" />
                </View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">{title}</Text>
            </View>
            <Text className="text-slate-600 dark:text-slate-400 leading-6 text-[15px]">
                {content}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="p-2 -ml-2"
                >
                    <ChevronLeft size={24} color={isDarkMode ? "#cbd5e1" : "#334155"} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">Gizlilik Politikası</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                <View className="p-6">
                    <View className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[24px] mb-8 border border-blue-100 dark:border-blue-900/20">
                        <Text className="text-blue-800 dark:text-blue-300 font-medium leading-6">
                            Ehliyet Hocam, kişisel verilerinizin gizliliğine ve güvenliğine en üst düzeyde önem verir. Bu politika, hangi verileri neden topladığımızı ve bunları nasıl koruduğumuzu açıklar.
                        </Text>
                    </View>

                    <Text className="text-xs text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-widest font-bold">Son Güncelleme: 1 Nisan 2026</Text>

                    <Section 
                        icon={UserCheck}
                        title="1. Veri Sorumlusu"
                        content="Ehliyet Hocam uygulaması, bireysel geliştirici Emircan Mert tarafından işletilmektedir. Verilerinizle ilgili her türlü soru için support@ehliyethocam.com üzerinden iletişime geçebilirsiniz."
                    />

                    <Section 
                        icon={HardDrive}
                        title="2. Toplanan Veriler"
                        content="Uygulamayı kullanırken; kayıt için e-posta adresiniz, tercih ettiğiniz kullanıcı adınız, sınav başarı istatistikleriniz, yanlış cevapladığınız sorular ve favori içerikleriniz toplanmaktadır. Bu veriler tamamen eğitim personilizasyonu amacıyla işlenir."
                    />

                    <Section 
                        icon={ShieldCheck}
                        title="3. Veri İşleme Amaçları"
                        content="Verileriniz; size özel çalışma programı oluşturmak, 'AI Hoca' özelliği ile hatalarınızı analiz etmek, ilerlemenizi grafiklerle sunmak ve önemli bildirimleri iletmek (push notifications) amacıyla işlenmektedir."
                    />

                    <Section 
                        icon={EyeOff}
                        title="4. Üçüncü Taraflar ve Aktarım"
                        content="Verileriniz asla reklam şirketlerine satılmaz veya paylaşılmaz. Veri güvenliği için yüksek standartlara sahip altyapı sağlayıcıları (Supabase ve Apple) ile çalışılmaktadır. AI analizleri için gönderilen veriler anonimleştirilerek işlenir."
                    />

                    <Section 
                        icon={Lock}
                        title="5. Kullanıcı Hakları"
                        content="KVKK ve GDPR kapsamında; verilerinize erişme, düzeltilmesini talep etme veya tamamen silinmesini isteme hakkına sahipsiniz. Uygulama içerisinden hesabınızı kapatarak tüm verilerinizin kalıcı olarak silinmesini sağlayabilirsiniz."
                    />

                    <View className="mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-500 dark:text-slate-400 text-center text-sm italic">
                            Bu uygulama, kullanıcılara trafik bilincini aşılamak amacıyla geliştirilmiştir. Veri güvenliği her zaman önceliğimizdir.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}