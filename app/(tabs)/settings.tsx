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
    <View className="px-6 mt-8 mb-2">
        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {title}
        </Text>
    </View>
);

const SettingItem = ({
    icon: Icon, label, value, type = 'link', onPress, isLast = false, color = '#0f172a'
}: {
    icon: any, label: string, value?: string | boolean, type?: 'link' | 'toggle' | 'value' | 'action',
    onPress?: () => void, isLast?: boolean, color?: string
}) => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    // Karanlık modda varsayılan renk uyumu
    const iconColor = color === '#0f172a' && isDarkMode ? '#f8fafc' : color;

    return (
        <TouchableOpacity
            activeOpacity={type === 'toggle' ? 1 : 0.7}
            onPress={type === 'toggle' ? undefined : onPress}
            className={`flex-row items-center justify-between py-4 px-4 bg-white dark:bg-slate-900 ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
        >
            <View className="flex-row items-center gap-3">
                <View className={`w-8 h-8 rounded-lg items-center justify-center bg-slate-50 dark:bg-slate-800`}>
                    <Icon size={18} color={iconColor} strokeWidth={2} />
                </View>
                <Text className={`font-medium text-[15px] tracking-tight ${type === 'action' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {label}
                </Text>
            </View>

            <View className="flex-row items-center">
                {type === 'toggle' && (
                    <Switch
                        value={value as boolean}
                        onValueChange={onPress}
                        trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                        thumbColor={"#ffffff"}
                        ios_backgroundColor="#e2e8f0"
                    />
                )}
                {type === 'value' && (
                    <View className="flex-row items-center">
                        <Text className="text-slate-500 font-medium text-sm mr-2">{value as string}</Text>
                        <ChevronRight size={16} color="#cbd5e1" />
                    </View>
                )}
                {type === 'link' && <ChevronRight size={18} color="#cbd5e1" strokeWidth={2.5} />}
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const router = useRouter();
    const isPro = useSubscriptionStore(state => state.isPro);

    // Tema Yönetimi
    const { colorScheme, setColorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    // Bildirim ve Ayarlar Store
    const notificationsEnabled = useSettingsStore(state => state.notificationsEnabled);
    const setNotificationsEnabled = useSettingsStore(state => state.setNotificationsEnabled);

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
                        // 1. Arka planda oturumu kapat
                        await supabase.auth.signOut();

                        // 2. Hiçbir şeyi beklemeden ANINDA Login ekranına fırlat!
                        router.replace('/auth/login');
                    }
                }
            ]
        );
    };

    const toggleNotifications = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);
        Toast.show({
            type: 'success',
            text1: 'Bildirim Tercihleri Güncellendi',
            text2: newState ? 'Bildirimler başarıyla açıldı.' : 'Bildirimler kapatıldı.',
        });
    };

    const toggleDarkMode = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setColorScheme(isDarkMode ? 'light' : 'dark');
    };

    return (
        <ScreenLayout className="bg-[#F2F2F7] dark:bg-slate-950">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#020617" : "#F2F2F7"} />

            <View className="px-6 pt-4 pb-2">
                <Text className="text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">Ayarlar</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/profile')}
                    className="mx-4 mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl flex-row items-center shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-4 border border-slate-200 dark:border-slate-700">
                        <User size={28} color={isDarkMode ? "#94a3b8" : "#64748b"} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{userName}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">{userEmail}</Text>
                    </View>
                    <ChevronRight size={20} color={isDarkMode ? "#475569" : "#cbd5e1"} />
                </TouchableOpacity>

                {!isPro && (
                    <View className="mx-4 mt-6">
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/premium')}
                            className="bg-[#1e1b4b] rounded-[24px] p-6 shadow-xl shadow-indigo-900/20 overflow-hidden relative"
                        >
                            <View className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                            <View className="flex-row items-center mb-3">
                                <View className="bg-amber-400 p-1.5 rounded-lg mr-2">
                                    <Crown size={16} color="#78350f" fill="#78350f" />
                                </View>
                                <Text className="text-amber-400 font-bold text-xs tracking-widest uppercase">PRO ÜYELİK</Text>
                            </View>
                            <Text className="text-white text-2xl font-bold leading-7 mb-2">Sınırsız Soru Çöz</Text>
                            <Text className="text-indigo-200 text-xs font-medium max-w-[220px] leading-5 mb-4">
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
                <View className="mx-4 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <SettingItem icon={CreditCard} label="Aboneliklerim" onPress={() => router.push('/subscriptions')} />
                    <SettingItem icon={User} label="Kişisel Bilgiler" isLast onPress={() => router.push('/profile/edit')} />
                </View>

                <SectionHeader title="Tercihler" />
                <View className="mx-4 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <SettingItem icon={Bell} label="Bildirimler" type="toggle" value={notificationsEnabled} onPress={toggleNotifications} />
                    <SettingItem icon={Moon} label="Karanlık Mod" type="toggle" value={isDarkMode} isLast onPress={toggleDarkMode} />
                </View>

                <SectionHeader title="Destek" />
                <View className="mx-4 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <SettingItem icon={HelpCircle} label="Yardım Merkezi" onPress={() => router.push('/support')} />
                    <SettingItem icon={Mail} label="Bize Ulaşın" onPress={() => router.push('/contact')} />
                    <SettingItem icon={FileText} label="Gizlilik Politikası" isLast onPress={() => router.push('/privacy')} />
                </View>

                <View className="mx-4 mt-6 mb-8 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <SettingItem icon={LogOut} label="Çıkış Yap" type="action" color="#dc2626" isLast onPress={handleLogout} />
                </View>

                <View className="items-center mb-8">
                    <Text className="text-slate-400 dark:text-slate-600 text-xs font-semibold">EhliyetApp v1.0.2 (Build 142)</Text>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}