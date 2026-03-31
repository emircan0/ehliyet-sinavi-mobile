import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';
import { useColorScheme } from 'nativewind';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import {
    User, Bell, Moon, ChevronRight, Crown,
    LogOut, HelpCircle, CreditCard, FileText, Mail
} from 'lucide-react-native';

const SectionHeader = ({ title }: { title: string }) => (
    <View className="px-5 mt-8 mb-2">
        <Text className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            {title}
        </Text>
    </View>
);

const SettingItem = ({
    icon: Icon, label, value, type = 'link', onPress, isLast = false, color = '#0f172a'
}: {
    icon: any, label: string, value?: string | boolean, type?: 'link' | 'toggle' | 'value' | 'action',
    onPress?: any, isLast?: boolean, color?: string // onPress tipini any yaptık ki parametre alabilsin
}) => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const iconColor = color === '#0f172a' && isDarkMode ? '#ffffff' : color;

    return (
        <TouchableOpacity
            activeOpacity={type === 'toggle' ? 1 : 0.7}
            onPress={type === 'toggle' ? undefined : onPress}
            className={`flex-row items-center justify-between py-3.5 px-4 bg-white dark:bg-[#1C1C1E] ${!isLast ? 'border-b border-slate-100 dark:border-white/10' : ''}`}
        >
            <View className="flex-row items-center gap-3">
                <View className={`w-8 h-8 rounded-lg items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <Icon size={18} color={iconColor} strokeWidth={2} />
                </View>
                <Text className={`font-medium text-[16px] tracking-tight ${type === 'action' ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                    {label}
                </Text>
            </View>

            <View className="flex-row items-center">
                {type === 'toggle' && (
                    <Switch
                        value={value as boolean}
                        // KRİTİK DÜZELTME: Switch'in true/false değerini yakalayıp onPress'e gönderiyoruz
                        onValueChange={(newValue) => onPress && onPress(newValue)}
                        trackColor={{ false: "#e5e5ea", true: "#34C759" }} // Apple Green
                        thumbColor={"#ffffff"}
                        ios_backgroundColor="#e5e5ea"
                    />
                )}
                {type === 'value' && (
                    <View className="flex-row items-center">
                        <Text className="text-slate-500 dark:text-slate-400 font-medium text-[15px] mr-2">{value as string}</Text>
                        <ChevronRight size={18} color={isDarkMode ? "#5c5c62" : "#c7c7cc"} />
                    </View>
                )}
                {type === 'link' && <ChevronRight size={18} color={isDarkMode ? "#5c5c62" : "#c7c7cc"} strokeWidth={2.5} />}
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);

    // Zustand State
    const notificationsEnabled = useSettingsStore(state => state.notificationsEnabled);
    const setNotificationsEnabled = useSettingsStore(state => state.setNotificationsEnabled);
    const theme = useSettingsStore(state => state.theme); // Zustand'daki mevcut temayı çektik
    const setTheme = useSettingsStore(state => state.setTheme);

    // NativeWind State
    const { colorScheme, setColorScheme } = useColorScheme();

    // KRİTİK DÜZELTME 2: Switch'in durumu doğrudan kullanıcının kaydettiği Zustand verisine bakmalı
    // Eğer tema 'dark' ise veya tema 'system' olup da cihazın geneli karanlıksa Switch açık görünür
    const isDarkMode = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
                setUserName(user.user_metadata?.full_name || 'Kullanıcı');
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Çıkış Yap",
            "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Çıkış Yap",
                    style: "destructive",
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/auth/login');
                    }
                }
            ]
        );
    };

    const handleNotificationChange = (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNotificationsEnabled(newValue);
        Toast.show({
            type: 'success',
            text1: 'Bildirim Tercihleri',
            text2: newValue ? 'Bildirimler açıldı.' : 'Bildirimler kapatıldı.',
        });
    };

    // KRİTİK DÜZELTME 3: Fonksiyon artık Switch'in gönderdiği boolean değeri alıyor
    const toggleDarkMode = (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Switch sağa çekildiyse dark, sola çekildiyse light yap
        const newTheme = newValue ? 'dark' : 'light';

        // 1. Önce durumu Zustand'a kaydet (Switch'in ANINDA hareket etmesini sağlar)
        setTheme(newTheme);

        // 2. Sonra arayüz renklerini değiştir (NativeWind)
        setColorScheme(newTheme);
    };

    return (
        <ScreenLayout className="bg-[#F2F2F7] dark:bg-black">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View className="px-6 pt-4 pb-2">
                <Text className="text-[34px] font-bold text-black dark:text-white tracking-tight">Ayarlar</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/profile')}
                    className="mx-5 mt-4 p-4 bg-white dark:bg-[#1C1C1E] rounded-[20px] flex-row items-center"
                >
                    <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 items-center justify-center mr-4">
                        <User size={28} color={isDarkMode ? "#EBEBF599" : "#64748b"} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[20px] font-semibold text-black dark:text-white tracking-tight">{userName}</Text>
                        <Text className="text-slate-500 dark:text-[#EBEBF599] text-[14px] mt-0.5">{userEmail}</Text>
                    </View>
                    <ChevronRight size={20} color={isDarkMode ? "#5c5c62" : "#c7c7cc"} />
                </TouchableOpacity>

                {!isPro && (
                    <View className="mx-5 mt-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/premium')}
                            className="bg-[#1e1b4b] dark:bg-[#1e1b4b] rounded-[20px] p-6 overflow-hidden relative"
                        >
                            <View className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                            <View className="flex-row items-center mb-3">
                                <View className="bg-amber-400 p-1.5 rounded-lg mr-2">
                                    <Crown size={16} color="#78350f" fill="#78350f" />
                                </View>
                                <Text className="text-amber-400 font-bold text-xs tracking-widest uppercase">PRO ÜYELİK</Text>
                            </View>
                            <Text className="text-white text-[22px] font-bold leading-7 mb-2">Sınırsız Soru Çöz</Text>
                            <Text className="text-indigo-200 text-[13px] font-medium max-w-[220px] leading-5 mb-4">
                                Reklamsız deneyim ve detaylı analizlerle sınavı ilk seferde geç.
                            </Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-white font-bold text-xl">₺49.99<Text className="text-sm font-normal text-indigo-300">/ay</Text></Text>
                                <View className="bg-white px-5 py-2.5 rounded-full">
                                    <Text className="text-indigo-900 font-bold text-xs">Yükselt</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <SectionHeader title="Hesap" />
                <View className="mx-5 bg-white dark:bg-[#1C1C1E] rounded-[16px] overflow-hidden">
                    <SettingItem icon={CreditCard} label="Aboneliklerim" onPress={() => router.push('/subscriptions')} />
                    <SettingItem icon={User} label="Kişisel Bilgiler" isLast onPress={() => router.push('/profile/edit')} />
                </View>

                <SectionHeader title="Tercihler" />
                <View className="mx-5 bg-white dark:bg-[#1C1C1E] rounded-[16px] overflow-hidden">
                    <SettingItem icon={Bell} label="Bildirimler" type="toggle" value={notificationsEnabled} onPress={handleNotificationChange} />
                    <SettingItem icon={Moon} label="Karanlık Mod" type="toggle" value={isDarkMode} isLast onPress={toggleDarkMode} />
                </View>

                <SectionHeader title="Destek" />
                <View className="mx-5 bg-white dark:bg-[#1C1C1E] rounded-[16px] overflow-hidden">
                    <SettingItem icon={HelpCircle} label="Yardım Merkezi" onPress={() => router.push('/support')} />
                    <SettingItem icon={Mail} label="Bize Ulaşın" onPress={() => router.push('/contact')} />
                    <SettingItem icon={FileText} label="Gizlilik Politikası" isLast onPress={() => router.push('/privacy')} />
                </View>

                <View className="mx-5 mt-8 mb-8 bg-white dark:bg-[#1C1C1E] rounded-[16px] overflow-hidden">
                    <SettingItem icon={LogOut} label="Çıkış Yap" type="action" color="#ff3b30" isLast onPress={handleLogout} />
                </View>

                <View className="items-center mb-8">
                    <Text className="text-slate-400 dark:text-[#EBEBF54D] text-[13px] font-medium">Ehliyet Hocam v1.0.2</Text>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}