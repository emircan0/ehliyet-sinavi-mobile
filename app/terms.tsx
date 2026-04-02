import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeMode } from '../src/hooks/useThemeMode';

export default function TermsScreen() {
    const router = useRouter();
    const { isDarkMode } = useThemeMode();

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
                <Text className="text-lg font-bold text-slate-900 dark:text-white ml-2">Kullanım Koşulları (EULA)</Text>
            </View>

            <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-6">
                    Son Kullanıcı Lisans Sözleşmesi (EULA)
                </Text>

                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
                    Lütfen "Ehliyet Hocam – AI Destekli Eğitim" ("Uygulama") uygulamasını kullanmadan önce bu Son Kullanıcı Lisans Sözleşmesi'ni ("Sözleşme") dikkatlice okuyunuz.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">1. Lisansın Kapsamı</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Bu size, Apple Hizmet Şartları'nda ("Kullanım Kuralları") belirtilen Apple Mac App Store ve/veya App Store kullanım kurallarına uygun olarak sahip olduğunuz veya kontrol ettiğiniz Apple markalı ürünlerde Uygulamayı kullanmanız için verilen geri alınabilir, münhasır olmayan devredilemez sınırlı bir lisanstır.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">2. Kullanım Kısıtlamaları</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Şunları yapmamalısınız: Uygulamayı değiştirmek, tersine mühendislik yapmak, derlemesini açmak veya Uygulamanın herhangi bir bölümünü parçalara ayırmak. Uygulamayı kiralamak veya kiralama, dağıtma, satma amacıyla kullanmak.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">3. Abonelikler ve Ücretlendirme</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Uygulama, premium özellikler için uygulama içi satın alımlar sunabilir. Yinelenen abonelikler, cari dönemin bitiminden en az 24 saat önce iptal edilmediği sürece otomatik olarak yenilenir. Yenileme ücreti, fatura döngünüzden 24 saat önce Apple Kimliği hesabınızdan tahsil edilecektir. Satın alma işleminden sonra hesap ayarlarınıza giderek aboneliklerinizi yönetebilir ve iptal edebilirsiniz.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">4. Fikri Mülkiyet</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Tasarım, metinler, grafikler, soru havuzları ve diğer tüm Uygulama içeriklerinin telif hakkı ve ilgili tüm fikri mülkiyet hakları uygulama geliştiricisine aittir.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">5. Sorumluluk Reddi (Disclaimer of Warranty)</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Uygulamayı kullanımınızdan doğacak riskler tamamen size aittir. Uygulama "olduğu gibi" ve "mevcut haliyle" sunulmaktadır. Geliştirici, uygulamanın kesintisiz veya hatasız çalışacağını garanti etmez. Uygulama, kullanıcının gerçek ehliyet sınavında başarılı olacağını kesinlikle vaat veya garanti etmez. Uygulama bir eğitim aracıdır.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">6. Yasal Uygunluk</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Ambargo uygulanan bir ülkede bulunmadığınızı ve hiçbir hükümetin 'kısıtlı taraflar' listesinde olmadığınızı beyan ve taahhüt edersiniz.
                </Text>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">7. İletişim</Text>
                <Text className="text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
                    Bu EULA veya Uygulama hakkında herhangi bir sorunuz veya şikayetiniz varsa, lütfen support@ehliyethocam.com üzerinden iletişime geçiniz. 
                    {'\n\n'}
                    Tam bir yasal metin için standart Apple EULA koşulları da bu uygulama için geçerlidir.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
