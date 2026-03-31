import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '../src/api/supabase'; // Supabase eklendi
import {
    User, Bell, Car, Calendar, Clock, ChevronRight,
    LogOut, ShieldCheck, X, CheckCircle2, Mail, Trash2
} from 'lucide-react-native';
import { scheduleDailyReminder } from '../src/api/notifications';
import { useColorScheme } from 'nativewind';

// Ayar Seçenekleri
const SETTING_OPTIONS = {
    license_type: [
        { label: 'B Sınıfı (Otomobil)', value: 'B' },
        { label: 'A Sınıfı (Motosiklet)', value: 'A' },
        { label: 'C/D Sınıfı (Ağır Vasıta)', value: 'C' },
    ],
    exam_date: [
        { label: '1 Ay İçinde (Yoğun)', value: 'urgent' },
        { label: '2-3 Ay Sonra (Normal)', value: 'normal' },
        { label: 'Henüz Belli Değil', value: 'relaxed' },
    ],
    daily_goal: [
        { label: 'Günde 10 Dakika', value: '10' },
        { label: 'Günde 20 Dakika', value: '20' },
        { label: 'Günde 45+ Dakika', value: '45' },
    ],
    notification_time: [
        { label: 'Sabah (09:00)', value: '09:00' },
        { label: 'Öğle Arası (12:30)', value: '12:30' },
        { label: 'Akşam (20:00)', value: '20:00' },
        { label: 'Bildirim İstemiyorum', value: 'off' },
    ]
};

export default function ProfileScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();

    // Kullanıcı Bilgileri State'leri
    const [userName, setUserName] = useState('Yükleniyor...');
    const [userEmail, setUserEmail] = useState('');

    // Tercih State'leri
    const [preferences, setPreferences] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Modal State'leri
    const [modalVisible, setModalVisible] = useState(false);
    const [currentSettingKey, setCurrentSettingKey] = useState<keyof typeof SETTING_OPTIONS | null>(null);

    // Verileri Yükle (Hem Supabase Hem AsyncStorage)
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Supabase'den Giriş Yapan Kullanıcıyı Çek
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserName(user.user_metadata?.full_name || 'Sürücü Adayı');
                    setUserEmail(user.email || '');
                }

                // 2. Cihazdan Tercihleri Çek
                const prefsData = await AsyncStorage.getItem('user_preferences');
                if (prefsData) {
                    setPreferences(JSON.parse(prefsData));
                }
            } catch (error) {
                console.error("Veriler yüklenirken hata:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Ayarı Değiştir ve Kaydet
    const updateSetting = async (key: keyof typeof SETTING_OPTIONS, value: string) => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        setModalVisible(false);

        // AsyncStorage'a yerel olarak kaydet
        await AsyncStorage.setItem('user_preferences', JSON.stringify(newPrefs));

        // Bildirim saati değiştiyse alarmı güncelle
        if (key === 'notification_time') {
            if (value === 'off') {
                Alert.alert("Bilgi", "Günlük hatırlatıcılar kapatıldı.");
            } else {
                const timeParts = value.split(':');
                await scheduleDailyReminder(parseInt(timeParts[0]), parseInt(timeParts[1]));
                Alert.alert("Başarılı", `Hatırlatıcı saati ${value} olarak güncellendi.`);
            }
        }
    };

    const openSettingModal = (key: keyof typeof SETTING_OPTIONS) => {
        setCurrentSettingKey(key);
        setModalVisible(true);
    };

    const deleteAccount = async () => {
        Alert.alert(
            "Hesabımı Kalıcı Olarak Sil",
            "Bu işlem geri alınamaz. Tüm ilerlemeniz ve verileriniz kalıcı olarak silinecektir. Devam etmek istiyor musunuz?",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Evet, Sil",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            // 1. Supabase Auth'dan çıkış yap
                            await supabase.auth.signOut();
                            
                            // 2. Yerel verileri temizle
                            await AsyncStorage.clear();
                            
                            // 3. Login ekranına yönlendir
                            router.replace('/auth/login');
                            
                            Alert.alert("Başarılı", "Hesabınız silinme kuyruğuna alındı ve oturumunuz kapatıldı.");
                        } catch (error) {
                            Alert.alert("Hata", "Hesap silinirken bir sorun oluştu.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const resetLocalProgress = async () => {
        Alert.alert(
            "Cihaz Verilerini Sıfırla",
            "Sadece bu cihazdaki çalışma planı ve bildirim ayarların sıfırlanacak. (Hesabın silinmez)",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sıfırla",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('user_preferences');
                        await AsyncStorage.removeItem('has_completed_onboarding');
                        // _layout.tsx bizi otomatik Onboarding'e atacak
                        router.replace('/onboarding');
                    }
                }
            ]
        );
    };

    const getLabel = (key: keyof typeof SETTING_OPTIONS, value: string) => {
        if (!value) return 'Seçilmedi';
        const option = SETTING_OPTIONS[key].find(o => o.value === value);
        return option ? option.label : 'Seçilmedi';
    };

    if (isLoading) return <ActivityIndicator size="large" color="#2563eb" className="flex-1 bg-[#F8FAFC] dark:bg-slate-950" />;

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* --- PROFİL BAŞLIĞI --- */}
                <View className="px-6 pt-6 pb-8 items-center">
                    <View className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4 border-4 border-white dark:border-slate-800 shadow-sm shadow-blue-200 dark:shadow-black">
                        <User size={40} color="#2563eb" />
                    </View>
                    <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{userName}</Text>

                    {/* E-posta Bilgisi */}
                    <View className="flex-row items-center mt-2 opacity-60">
                        <Mail size={14} color={colorScheme === 'dark' ? '#94a3b8' : '#0f172a'} className="mr-1.5" />
                        <Text className="text-slate-900 dark:text-slate-300 text-sm font-medium">{userEmail}</Text>
                    </View>

                    <View className="flex-row items-center mt-4 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                        <ShieldCheck size={14} color="#059669" className="mr-1.5" />
                        <Text className="text-emerald-700 dark:text-emerald-500 text-xs font-bold uppercase tracking-widest">Plan Aktif</Text>
                    </View>
                </View>

                {/* --- ÇALIŞMA PROGRAMIM --- */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 dark:text-white font-bold text-lg mb-4 ml-1">Çalışma Programım</Text>
                    <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <SettingItem
                            icon={Car} color="#3b82f6" title="Ehliyet Sınıfı"
                            value={getLabel('license_type', preferences.license_type)}
                            onPress={() => openSettingModal('license_type')} isFirst
                        />
                        <SettingItem
                            icon={Calendar} color="#8b5cf6" title="Sınav Hedefi"
                            value={getLabel('exam_date', preferences.exam_date)}
                            onPress={() => openSettingModal('exam_date')}
                        />
                        <SettingItem
                            icon={Clock} color="#f59e0b" title="Günlük Hedef"
                            value={getLabel('daily_goal', preferences.daily_goal)}
                            onPress={() => openSettingModal('daily_goal')} isLast
                        />
                    </View>
                </View>

                {/* --- BİLDİRİM VE TERCİHLER --- */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 dark:text-white font-bold text-lg mb-4 ml-1">Tercihler</Text>
                    <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <SettingItem
                            icon={Bell} color="#ec4899" title="Hatırlatıcı Saati"
                            value={getLabel('notification_time', preferences.notification_time)}
                            onPress={() => openSettingModal('notification_time')}
                            isFirst isLast
                        />
                    </View>
                </View>

                {/* --- HESAP İŞLEMLERİ --- */}
                <View className="px-6 gap-y-4">
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
                                { text: "Vazgeç", style: "cancel" },
                                { text: "Çıkış Yap", style: "destructive", onPress: () => {
                                    supabase.auth.signOut();
                                    router.replace('/auth/login');
                                }}
                            ]);
                        }}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl flex-row items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200 dark:shadow-none"
                    >
                        <View className="flex-row items-center">
                            <LogOut size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} className="mr-3" />
                            <Text className="text-slate-700 dark:text-slate-200 font-bold text-[15px]">Oturumu Kapat</Text>
                        </View>
                        <ChevronRight size={18} color={colorScheme === 'dark' ? '#475569' : '#cbd5e1'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={deleteAccount}
                        className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl flex-row items-center justify-center border border-red-100 dark:border-red-900/30"
                    >
                        <Trash2 size={20} color="#ef4444" className="mr-2" />
                        <Text className="text-red-700 dark:text-red-400 font-bold text-[15px]">Hesabımı Sil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={resetLocalProgress}
                        className="py-3 items-center"
                    >
                        <Text className="text-slate-400 dark:text-slate-500 font-bold text-[13px] underline">Cihaz Verilerini Sıfırla</Text>
                    </TouchableOpacity>
                    
                    <Text className="text-slate-400 text-center text-[11px] mt-2">Sürüm 1.0.0 • Ehliyet Hocam – AI Destekli Eğitim</Text>
                </View>
            </ScrollView>

            {/* --- SEÇİM MODALI --- */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View className="flex-1 justify-end bg-slate-900/40">
                    <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-12 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">Seçimini Yap</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <X size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                            </TouchableOpacity>
                        </View>

                        {currentSettingKey && SETTING_OPTIONS[currentSettingKey].map((option, index) => {
                            const isSelected = preferences[currentSettingKey] === option.value;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => updateSetting(currentSettingKey, option.value)}
                                    className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}
                                >
                                    <Text className={`font-semibold text-base ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{option.label}</Text>
                                    {isSelected && <CheckCircle2 size={20} color="#2563eb" />}
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Alt Bileşen: Ayar Satırı
const SettingItem = ({ icon: Icon, color, title, value, onPress, isFirst = false, isLast = false }: any) => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className={`flex-row items-center p-4 bg-white dark:bg-slate-900 ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
        >
            <View className="p-2.5 rounded-xl mr-4" style={{ backgroundColor: isDarkMode ? `${color}30` : `${color}15` }}>
                <Icon size={20} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-bold text-[15px]">{title}</Text>
            </View>
            <Text className="text-slate-500 dark:text-slate-400 font-medium mr-2">{value}</Text>
            <ChevronRight size={18} color={isDarkMode ? "#475569" : "#cbd5e1"} />
        </TouchableOpacity>
    );
};