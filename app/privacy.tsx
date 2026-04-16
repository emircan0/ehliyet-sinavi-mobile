import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Lock, HardDrive, EyeOff, UserCheck, Globe } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useThemeMode } from '../src/hooks/useThemeMode';

export default function PrivacyScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();
    const [lang, setLang] = React.useState<'tr' | 'en'>('tr');

    const content = {
        tr: {
            title: "Gizlilik Politikası",
            intro: "Ehliyet Hocam: Akıllı Sınav olarak, kişisel verilerinizin gizliliğine ve güvenliğine en üst düzeyde önem veriyoruz. Bu politika, hangi verileri neden topladığımızı ve bunları nasıl koruduğumuzu en şeffaf haliyle açıklar.",
            date: "Son Güncelleme: 16 Nisan 2026",
            s1_t: "1. Veri Sorumlusu ve Kapsam",
            s1_c: "Ehliyet Hocam: Akıllı Sınav uygulaması üzerinden toplanan tüm veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuatlara tam uygunluk çerçevesinde işlenmektedir. Veri sorumlusu sıfatıyla, sadece size daha iyi bir deneyim sunmak için gerekli olan bilgileri topladığımızı garanti ederiz.",
            s2_t: "2. İşlenen Veriler ve Toplama Yöntemi",
            s2_c: "Uygulamamızdaki deneyiminizi kişiselleştirmek için; kayıt aşamasında sağladığınız e-posta adresi ve isim bilgileriniz işlenmektedir. Uygulama içerisindeki çözmüş olduğunuz sınavların sonuçları, yaptığınız hatalar, işaretlediğiniz favori sorular ve çalışma istatistikleriniz merkezi sistemlerimizde güvenle depolanır.",
            s3_t: "3. Veri İşleme Amaçları ve Yapay Zeka (AI) Analizi",
            s3_c: "Elde edilen performans verileriniz sistem içerisindeki 'AI Koç' özelliği tarafından analiz edilir. Buradaki temel amacımız, eksik olduğunuz konuları teknolojik yaklaşımlarla tespit etmek ve sınavı geçme garantinizi artıracak özel bir çalışma planı sunabilmektir. Tüm AI analiz süreçleri anonim veri kümeleriyle çalışır ve bu işlem sırasında profil güvenliğiniz korunur.",
            s4_t: "4. Üçüncü Taraflarla Bilgi Paylaşımı",
            s4_c: "Güveniniz bizim için reklam gelirlerinden çok daha değerlidir. Verileriniz asla veri simsarlarına, üçüncü şahıslara veya reklam ajanslarına satılmaz. Teknik hizmetlerimizin aksamaması adına yalnızca şifrelenmiş veritabanı sağlayıcımız Supabase, aboneliklerimizi yöneten RevenueCat ve oturum altyapımızı destekleyen Apple/Google servisleriyle zorunlu düzeyde güvenli işlem yapılmaktadır.",
            s5_t: "5. Kullanıcı Hakları ve Veri Silme",
            s5_c: "Verilerinizin kontrolü tamamen sizin elinizdedir. Profil ayarlarınız üzerinden 'Hesabımı Sil' seçeneğini kullanarak sistemimizde kayıtlı olan tüm dijital ayak izinizi ve hesap bilgilerinizi kalıcı olarak yok edebilirsiniz. KVKK kapsamında sahip olduğunuz haklar, bilgi düzeltme veya verilerinize erişim gibi konular için dilediğiniz her an bizimle doğrudan iletişime geçebilirsiniz.",
            footer: "Ehliyet Hocam: Akıllı Sınav, aday sürücülerin eğitim sürecini desteklemek için tasarlanmıştır. Güvenli bir eğitim süreci geçirmeniz önceliğimizdir.",
            contact: "İletişim"
        },
        en: {
            title: "Privacy Policy",
            intro: "As Ehliyet Hocam: Akıllı Sınav, we attach the utmost importance to the privacy and security of your personal data. This policy explains in the most transparent way what data we collect, why we collect it, and how we protect it.",
            date: "Last Updated: April 16, 2026",
            s1_t: "1. Data Controller and Scope",
            s1_c: "All data collected through the Ehliyet Hocam: Akıllı Sınav application is processed in full compliance with the Personal Data Protection Law (KVKK) No. 6698 and relevant legislation. As the data controller, we guarantee that we only collect the information necessary to provide you with a better experience.",
            s2_t: "2. Processed Data and Collection Method",
            s2_c: "In order to personalize your experience in our application; the email address and name information you provide during the registration phase are processed. The results of the exams you have solved in the application, the mistakes you have made, the favorite questions you have marked and your study statistics are safely stored in our central systems.",
            s3_t: "3. Data Processing Purposes and Artificial Intelligence (AI) Analysis",
            s3_c: "Your obtained performance data is analyzed by the 'AI Tutor' feature in the system. Our main goal here is to identify the subjects you are lacking in with technological approaches and to offer a special study plan that will increase your guarantee of passing the exam. All AI analysis processes work with anonymous data sets and your profile security is protected during this process.",
            s4_t: "4. Information Sharing with Third Parties",
            s4_c: "Your trust is much more valuable to us than advertising revenue. Your data is never sold to data brokers, third parties, or advertising agencies. In order not to interrupt our technical services, secure transactions are made only at a mandatory level with our encrypted database provider Supabase, RevenueCat which manages our subscriptions, and Apple/Google services which support our login infrastructure.",
            s5_t: "5. User Rights and Data Deletion",
            s5_c: "The control of your data is entirely in your hands. You can permanently destroy all your digital footprint and account information registered in our system by using the 'Delete My Account' option via your profile settings. You can contact us directly at any time regarding the rights you have under KVKK, such as information correction or access to your data.",
            footer: "Ehliyet Hocam: Akıllı Sınav is designed to support the training process of driver candidates. Having a safe education process is our priority.",
            contact: "Contact"
        }
    };

    const t = content[lang];

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
        <ScreenLayout className="bg-white dark:bg-slate-950">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                    >
                        <ChevronLeft size={24} color={isDarkMode ? "#cbd5e1" : "#334155"} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">{t.title}</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => setLang(lang === 'tr' ? 'en' : 'tr')}
                    className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"
                >
                    <Globe size={14} color={isDarkMode ? "#94a3b8" : "#64748b"} />
                    <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1.5 uppercase tracking-wider">{lang === 'tr' ? 'EN' : 'TR'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                <View className="p-6">
                    <View className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[24px] mb-8 border border-blue-100 dark:border-blue-900/20">
                        <Text className="text-blue-800 dark:text-blue-300 font-medium leading-6">
                            {t.intro}
                        </Text>
                    </View>

                    <Text className="text-xs text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-widest font-bold">{t.date}</Text>

                    <Section 
                        icon={UserCheck}
                        title={t.s1_t}
                        content={t.s1_c}
                    />

                    <Section 
                        icon={HardDrive}
                        title={t.s2_t}
                        content={t.s2_c}
                    />

                    <Section 
                        icon={ShieldCheck}
                        title={t.s3_t}
                        content={t.s3_c}
                    />

                    <Section 
                        icon={EyeOff}
                        title={t.s4_t}
                        content={t.s4_c}
                    />

                    <Section 
                        icon={Lock}
                        title={t.s5_t}
                        content={t.s5_c}
                    />

                    <View className="mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-500 dark:text-slate-400 text-center text-sm italic leading-5 mb-4">
                            {t.footer}
                        </Text>
                        <Text className="text-slate-900 dark:text-white font-bold text-center">
                            {t.contact}: support@ehliyethocam.com
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}