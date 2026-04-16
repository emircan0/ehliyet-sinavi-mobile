import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Globe } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { useThemeMode } from '../src/hooks/useThemeMode';

export default function TermsScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();
    const [lang, setLang] = React.useState<'tr' | 'en'>('tr');

    const content = {
        tr: {
            title: "Kullanım Koşulları",
            eula: "Son Kullanıcı Lisans Sözleşmesi (EULA)",
            intro: "Lütfen \"Ehliyet Hocam: Akıllı Sınav\" uygulamasını bilgisayarınıza veya mobil cihazınıza indirmeden, kurmadan veya kullanmaya başlamadan önce bu Kullanım Koşulları ve Son Kullanıcı Lisans Sözleşmesini dikkatlice okuyunuz. Uygulamaya hesap oluşturarak veya misafir olarak giriş yapmanız, bu sözleşmenin tüm şartlarını tamamen anladığınızı ve kabul ettiğinizi gösterir.",
            s1_t: "1. Uygulamanın Niteliği ve Sorumluluk Reddi",
            s1_c: "\"Ehliyet Hocam: Akıllı Sınav\", ehliyet sınavı müfredatına en uygun şekilde güncel sorularla pratik yapma imkanı sunan profesyonel bir eğitim destek yazılımıdır. Tüm sorular ve AI analizleri adayları geliştirmeye yöneliktir. Ancak uygulamamız resmi bir kurum değildir. Uygulamada elde ettiğiniz yüksek istatistikler, resmi ehliyet sınavını kesinlikle geçeceğiniz anlamına gelmez. Geçerli bir sürücü belgesi almak için yetkili ve yasal bir sürücü kursuna kayıt yaptırmak, direksiyon derslerini tamamlamak ve resmi sınavları geçmek yasal bir zorunluluktur.",
            s2_t: "2. Lisans Kapsamı ve Kısıtlamalar",
            s2_c: "Kullanıcılar \"Ehliyet Hocam: Akıllı Sınav\" uygulamasını kişisel eğitim amacıyla cihazlarında kullanmak üzere devredilemez, münhasır olmayan bir kullanım hakkı elde ederler. Sistemdeki soruların kazınması (scraping), kodların tersine mühendisliğe uğratılması (reverse engineering), uygulamanın kaynak kodlarına izinsiz erişim sağlanmaya çalışılması ve içeriklerin kopyalanarak başka ticari ortamlarda (web siteleri, diğer mobil uygulamalar veya basılı yayınlar) paylaşılması kesinlikle yasaktır ve yasal işlem sebebidir.",
            s3_t: "3. Fikri Mülkiyet Hakları",
            s3_c: "Uygulamanın arayüz tasarımı, logosu, kod yazılım altyapısı, yapay zeka entegrasyon sistemleri (\"AI Koç\") ve tarafımızdan derlenen özgün sınav içerikleri üzerindeki tüm ticari ve fikri sınai mülkiyet hakları geliştirici şirkete aittir. Markamız \"Ehliyet Hocam: Akıllı Sınav\" yasal koruma altındadır.",
            s4_t: "4. Abonelikler, Faturalandırma ve İptal Şartları",
            s4_c: "Yazılımın temel özellikleri haricindeki gelişmiş AI modülleri, sınırsız deneme çözümleri ve derinlemesine istatistik takip araçları (\"Premium\" özellikler) uygulama içi satın alım gerektirebilir.\n\nÖdemelerinizin tamamı doğrudan Apple App Store veya Google Play Store altyapısı üzerinden güvence altına alınarak gerçekleşir. Abonelikleriniz otomatik yenileme mantığı ile çalışır. Kullanıcı, devam eden aboneliğini bir sonraki fatura döngüsünden en az 24 saat önce iptal etmezse sistem ilgili ücreti bağlı kredi kartından tahsil eder. Aboneliklerin iptali veya yönetimi tamamen kullanıcının sorumluluğundadır ve ilgili mağazanın (Apple ID vs.) abonelik ayarları ekranından gerçekleştirilmelidir.",
            s5_t: "5. Hizmet Güncellemeleri ve Değişiklikler",
            s5_c: "Geliştirici; uygulamadaki hataları gidermek, yeni özellikler eklemek veya müfredattaki yasa değişikliklerine resmi uyum sağlamak için aralıklarla güncelleme paketleri sunabilir. Gerekli görülen teknik altyapı bakımları esnasında uygulamanın geçici süreyle servis dışı kalması yaşanabilir. Geliştirici, önceden haber vermeksizin politikalar üzerinde revizyon yapma hakkını her zaman saklı tutar.",
            s6_t: "6. Yasal İletişim, Şikayet ve Destek",
            s6_c: "Kullanıcılar \"Ehliyet Hocam: Akıllı Sınav\" deneyimleri sırasında karşılaştıkları her türlü teknik hata, öneri, kullanıcı veya abonelik şikayetleri için tarafımızla resmi iletişim kanalımız üzerinden irtibat kurabilirler. Hukuki ve teknik tüm ihtiyaçlarınız için bize ulaşın:\n\nsupport@ehliyethocam.com\n\nApple platformu standart EULA (End User License Agreement) hükümleri, bu sözleşmeye ek olarak eksiksiz kabul edilmiş sayılır."
        },
        en: {
            title: "Terms of Use",
            eula: "End User License Agreement (EULA)",
            intro: "Please read this Terms of Use and End User License Agreement carefully before downloading, installing or starting to use the \"Ehliyet Hocam: Akıllı Sınav\" application on your computer or mobile device. Creating an account or logging in as a guest to the application indicates that you fully understand and accept all terms of this agreement.",
            s1_t: "1. Nature of the Application and Disclaimer",
            s1_c: "\"Ehliyet Hocam: Akıllı Sınav\" is a professional educational support software that provides the opportunity to practice with up-to-date questions in the most appropriate way to the official driver's license curriculum. All questions and AI analyses are aimed at improving candidates. However, our application is not an official institution. High statistics you achieve in the application do not mean that you will definitively pass the official driver's license exam. In order to obtain a valid driver's license, it is a legal requirement to enroll in an authorized and legal driving school, complete steering lessons and pass official exams.",
            s2_t: "2. License Scope and Restrictions",
            s2_c: "Users obtain a non-transferable, non-exclusive right of use to use the \"Ehliyet Hocam: Akıllı Sınav\" application on their devices for personal educational purposes. Scraping the questions in the system, reverse engineering the codes, attempting unauthorized access to the source codes of the application and copying the contents and sharing them in other commercial environments (websites, other mobile applications or printed publications) are strictly prohibited and are grounds for legal action.",
            s3_t: "3. Intellectual Property Rights",
            s3_c: "All commercial and intellectual property rights over the interface design, logo, code software infrastructure, artificial intelligence integration systems (\"AI Tutor\") and the original exam contents compiled by us belong to the developer company. Our brand \"Ehliyet Hocam: Akıllı Sınav\" is under legal protection.",
            s4_t: "4. Subscriptions, Billing and Cancellation Terms",
            s4_c: "Advanced AI modules, unlimited trial solutions and in-depth statistical tracking tools (\"Premium\" features) other than the basic features of the software may require in-app purchases.\n\nAll your payments are secured directly through the Apple App Store or Google Play Store infrastructure. Your subscriptions work with an auto-renewal logic. Unless the user cancels their ongoing subscription at least 24 hours before the next billing cycle, the system will charge the relevant fee to the linked credit card. Cancellation or management of subscriptions is entirely the responsibility of the user and must be done from the subscription settings screen of the relevant store (Apple ID etc.).",
            s5_t: "5. Service Updates and Changes",
            s5_c: "The developer may periodically offer update packages to fix bugs in the application, add new features or provide official compliance with law changes in the curriculum. During required technical infrastructure maintenance, the application may be temporarily out of service. The developer always reserves the right to revise the policies without prior notice.",
            s6_t: "6. Legal Contact, Complaints and Support",
            s6_c: "Users can contact us through our official communication channel for any technical errors, suggestions, user or subscription complaints they encounter during their \"Ehliyet Hocam: Akıllı Sınav\" experience. Contact us for all your legal and technical needs:\n\nsupport@ehliyethocam.com\n\nApple platform standard EULA (End User License Agreement) provisions are deemed to be completely accepted in addition to this agreement."
        }
    };

    const t = content[lang];

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

            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-6">
                    {t.eula}
                </Text>

                <View className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800">
                    <Text className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {t.intro}
                    </Text>
                </View>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{t.s1_t}</Text>
                <Text className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {t.s1_c}
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{t.s2_t}</Text>
                <Text className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {t.s2_c}
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{t.s3_t}</Text>
                <Text className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {t.s3_c}
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{t.s4_t}</Text>
                <Text className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {t.s4_c}
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{t.s5_t}</Text>
                <Text className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {t.s5_c}
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{t.s6_t}</Text>
                <Text className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    {t.s6_c}
                </Text>
            </ScrollView>
        </ScreenLayout>
    );
}
