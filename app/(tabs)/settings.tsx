import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { purchaseService } from '../../src/services/purchaseService';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { analytics } from '../../src/services/analytics';
import {
    User, Bell, Moon, ChevronRight, Crown,
    LogOut, HelpCircle, CreditCard, FileText, Mail, Trash2, Clock, ShieldCheck
} from 'lucide-react-native';
import { scheduleDailyReminder, cancelAllReminders, registerForPushNotificationsAsync } from '../../src/api/notifications';
import { useAuth } from '../../src/hooks/useAuth';
import { Modal, TextInput } from 'react-native';
import { profileSync } from '../../src/services/profile-sync';
import { containsProfanity } from '../../src/utils/profanityFilter';

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
    const { isDarkMode, colorScheme } = useThemeMode();
    const iconColor = color === '#0f172a' && isDarkMode ? '#ffffff' : color;

    return (
        <TouchableOpacity
            activeOpacity={type === 'toggle' ? 1 : 0.7}
            onPress={type === 'toggle' ? undefined : onPress}
            className={`flex-row items-center justify-between py-3.5 px-4 bg-white dark:bg-slate-900 ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
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
    const isPremium = useSubscriptionStore(state => state.isPremium);
    const checkSubscriptionStatus = useSubscriptionStore(state => state.checkSubscriptionStatus);

    // Zustand State
    const notificationsEnabled = useSettingsStore(state => state.notificationsEnabled);
    const setNotificationsEnabled = useSettingsStore(state => state.setNotificationsEnabled);
    const theme = useSettingsStore(state => state.theme); // Zustand'daki mevcut temayı çektik
    const setTheme = useSettingsStore(state => state.setTheme);
    const isReminderEnabled = useSettingsStore(state => state.isReminderEnabled);
    const setReminderEnabled = useSettingsStore(state => state.setReminderEnabled);
    const reminderTime = useSettingsStore(state => state.reminderTime);
    const setReminderTime = useSettingsStore(state => state.setReminderTime);
    const analyticsEnabled = useSettingsStore(state => state.analyticsEnabled);
    const setAnalyticsEnabled = useSettingsStore(state => state.setAnalyticsEnabled);

    // NativeWind State
    const { isDarkMode, colorScheme, setColorScheme } = useThemeMode();

    // Switch, isDarkMode değerini doğrudan useThemeMode'dan alır.

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tempTime, setTempTime] = useState({ hour: 20, minute: 0 });
    const [isGuest, setIsGuest] = useState(false);

    const [hideAvatar, setHideAvatar] = useState(true);
    const [nickname, setNickname] = useState('');
    const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [isSavingNickname, setIsSavingNickname] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                setIsGuest(false);
                setUserEmail(user.email || '');
                setUserName(user.user_metadata?.full_name || 'Kullanıcı');
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('leaderboard_hide_avatar, leaderboard_nickname')
                    .eq('id', user.id)
                    .maybeSingle();
                if (profile) {
                    setHideAvatar(profile.leaderboard_hide_avatar ?? true);
                    setNickname(profile.leaderboard_nickname || '');
                    setNewNickname(profile.leaderboard_nickname || '');
                }
                
                return;
            }

            const guestFlag = await AsyncStorage.getItem('is_guest');
            if (guestFlag === 'true') {
                setIsGuest(true);
                setUserName('Misafir Kullanıcı');
                setUserEmail('Kayıtlı hesap bulunmuyor.');
            }
        };
        fetchUserData();
    }, [user]);

    const handleNotificationChange = async (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (newValue) {
            // Push bildirimleri için kayıt ol
            const token = await registerForPushNotificationsAsync(user?.id);

            if (!token) {
                setNotificationsEnabled(false);
                Toast.show({
                    type: 'error',
                    text1: 'Bildirimler Açılamadı',
                    text2: 'Bildirim iznini cihaz ayarlarından kontrol edin.',
                });
                return;
            }

            setNotificationsEnabled(true);
            if (user) {
                await profileSync.syncProfilePreferences({
                    notification_enabled: true,
                    expo_push_token: token
                });
            }

            Toast.show({
                type: 'success',
                text1: 'Bildirimler Aktif',
                text2: 'Duyuru ve hatırlatıcıları alabileceksiniz.',
            });
        } else {
            setNotificationsEnabled(false);
            setReminderEnabled(false);
            await cancelAllReminders();
            if (user) {
                await profileSync.syncProfilePreferences({
                    notification_enabled: false,
                    expo_push_token: null
                });
            }

            Toast.show({
                type: 'info',
                text1: 'Bildirimler Kapatıldı',
                text2: 'Artık duyuru almayacaksınız.',
            });
        }
    };

    // KRİTİK DÜZELTME 3: Fonksiyon artık Switch'in gönderdiği boolean değeri alıyor
    const toggleDarkMode = (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Switch sağa çekildiyse dark, sola çekildiyse light yap
        const newTheme = newValue ? 'dark' : 'light';

        analytics.trackEvent({ eventName: 'theme_changed', metadata: { newTheme } });

        // 1. Önce durumu Zustand'a kaydet (Switch'in ANINDA hareket etmesini sağlar)
        setTheme(newTheme);

        // 2. Sonra arayüz renklerini değiştir (NativeWind)
        setColorScheme(newTheme);
    };

    const toggleAnalytics = (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAnalyticsEnabled(newValue);
        if (!newValue) {
            Toast.show({
                type: 'info',
                text1: 'Analitik Kapatıldı',
                text2: 'Artık kullanım verileriniz toplanmayacak.',
            });
        }
    };

    const handleReminderToggle = async (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        analytics.trackEvent({ eventName: 'notification_preference_changed', metadata: { enabled: newValue } });
        setReminderEnabled(newValue);

        if (newValue) {
            await scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
            Toast.show({
                type: 'success',
                text1: 'Hatırlatıcı Aktif',
                text2: `Her gün ${reminderTime.hour.toString().padStart(2, '0')}:${reminderTime.minute.toString().padStart(2, '0')} saatinde bildirim alacaksınız.`,
            });
        } else {
            await cancelAllReminders();
            Toast.show({
                type: 'info',
                text1: 'Hatırlatıcı Kapatıldı',
                text2: 'Günlük hatırlatma bildirimleri durduruldu.',
            });
        }
    };

    const handleSaveTime = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setReminderTime(tempTime.hour, tempTime.minute);
        setShowTimePicker(false);

        if (isReminderEnabled) {
            await scheduleDailyReminder(tempTime.hour, tempTime.minute);
            Toast.show({
                type: 'success',
                text1: 'Saat Güncellendi',
                text2: `Hatırlatıcı ${tempTime.hour.toString().padStart(2, '0')}:${tempTime.minute.toString().padStart(2, '0')} olarak ayarlandı.`,
            });
        }
    };

    const handleToggleHideAvatar = async (newValue: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setHideAvatar(newValue);
        if (user) {
            await supabase.from('profiles').update({ leaderboard_hide_avatar: newValue }).eq('id', user.id);
        }
    };

    const handleSaveNickname = async () => {
        const trimmed = newNickname.trim();
        if (trimmed && trimmed.length < 2) {
            Alert.alert('Hata', 'Lütfen geçerli bir takma ad giriniz veya iptal ediniz.');
            return;
        }

        if (containsProfanity(trimmed)) {
            Alert.alert('Uyarı', 'Lütfen geçerli ve uygun bir takma ad giriniz.');
            return;
        }

        setIsSavingNickname(true);
        try {
            if (user) {
                await supabase.from('profiles').update({ leaderboard_nickname: trimmed || null }).eq('id', user.id);
            }
            setNickname(trimmed);
            setShowNicknamePrompt(false);
            Toast.show({
                type: 'success',
                text1: 'Takma Ad Kaydedildi',
            });
        } catch (error) {
            console.error('Takma ad kaydedilirken hata:', error);
            Alert.alert('Hata', 'Kaydedilemedi, lütfen tekrar deneyin.');
        } finally {
            setIsSavingNickname(false);
        }
    };

    return (
        <ScreenLayout className="bg-base">
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View className="px-6 pt-4 pb-2">
                <Text className="text-[34px] font-bold text-black dark:text-white tracking-tight">Ayarlar</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => isGuest ? router.push('/auth/register') : router.push('/profile')}
                    className="mx-5 mt-4 p-4 bg-white dark:bg-slate-900 rounded-[20px] flex-row items-center shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800"
                >
                    <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 items-center justify-center mr-4">
                        <User size={28} color={isDarkMode ? "#EBEBF599" : "#64748b"} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[20px] font-semibold text-black dark:text-white tracking-tight">{userName}</Text>
                        <Text className={`text-[14px] mt-0.5 ${isGuest ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-[#EBEBF599]'}`}>{userEmail}</Text>
                    </View>
                    <ChevronRight size={20} color={isDarkMode ? "#5c5c62" : "#c7c7cc"} />
                </TouchableOpacity>

                {!isPremium && (
                    <View className="mx-5 mt-6">
                        <TouchableOpacity
                            onPress={async () => {
                                const success = await purchaseService.presentPaywall();
                                if (success) {
                                    await checkSubscriptionStatus();
                                }
                            }}
                            activeOpacity={0.9}
                            className="bg-amber-400 rounded-[20px] p-4 flex-row items-center relative overflow-hidden shadow-sm"
                        >
                            <View className="flex-1 pr-4 z-10">
                                <Text className="text-amber-950 font-black text-[18px] tracking-tight">Premium'a Geçin</Text>
                                <Text className="text-amber-900/70 text-[12px] font-bold mt-0.5">Ömür boyu sınırsız erişim fırsatını kaçırmayın.</Text>
                            </View>
                            <View className="w-10 h-10 bg-white/30 rounded-full items-center justify-center z-10">
                                <Crown size={20} color="#78350f" fill="#78350f" />
                            </View>
                            <View className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/20 rounded-full" />
                        </TouchableOpacity>
                    </View>
                )}

                <SectionHeader title="Hesap" />
                <View className="mx-5 bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <SettingItem icon={CreditCard} label="Aboneliklerim" isLast onPress={() => router.push('/subscriptions')} />
                    {isGuest ? (
                        <SettingItem icon={User} label="Hesap Oluştur veya Giriş Yap" isLast onPress={() => router.push('/auth/register')} color="#0A84FF" />
                    ) : (
                        <SettingItem icon={User} label="Profil Detayları" isLast onPress={() => router.push('/profile')} />
                    )}
                </View>

                <SectionHeader title="Gizlilik Ayarları" />
                <View className="mx-5 bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <SettingItem 
                        icon={User} 
                        label="Sıralamada Profilimi Gizle" 
                        type="toggle" 
                        value={hideAvatar} 
                        onPress={handleToggleHideAvatar} 
                    />
                    <SettingItem 
                        icon={User} 
                        label="Sıralama Takma Adı" 
                        type="value"
                        value={nickname ? nickname : 'Gerçek İsim'}
                        onPress={() => setShowNicknamePrompt(true)}
                        isLast 
                    />
                </View>

                <SectionHeader title="Tercihler" />
                <View className="mx-5 bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <SettingItem icon={Bell} label="Bildirimler" type="toggle" value={notificationsEnabled} onPress={handleNotificationChange} />
                    <SettingItem
                        icon={Clock}
                        label="Çalışma Hatırlatıcısı"
                        type="toggle"
                        value={isReminderEnabled}
                        onPress={handleReminderToggle}
                    />
                    {isReminderEnabled && (
                        <SettingItem
                            icon={Clock}
                            label="Hatırlatma Saati"
                            type="value"
                            value={`${reminderTime.hour.toString().padStart(2, '0')}:${reminderTime.minute.toString().padStart(2, '0')}`}
                            onPress={() => {
                                setTempTime(reminderTime);
                                setShowTimePicker(true);
                            }}
                        />
                    )}
                    <SettingItem icon={Moon} label="Karanlık Mod" type="toggle" value={isDarkMode} onPress={toggleDarkMode} />
                    <SettingItem 
                        icon={ShieldCheck} 
                        label="Kullanım Verilerini Paylaş" 
                        type="toggle" 
                        value={analyticsEnabled} 
                        onPress={toggleAnalytics} 
                        isLast 
                    />
                </View>

                <SectionHeader title="Destek" />
                <View className="mx-5 bg-white dark:bg-slate-900 rounded-[16px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <SettingItem icon={HelpCircle} label="Yardım Merkezi" onPress={() => router.push('/support')} />
                    <SettingItem icon={Mail} label="Bize Ulaşın" onPress={() => router.push('/contact')} />
                    <SettingItem icon={FileText} label="Gizlilik Politikası" onPress={() => router.push('/privacy')} />
                    <SettingItem icon={FileText} label="Kullanım Koşulları" isLast onPress={() => router.push('/terms')} />
                </View>

                {/* Removed Logout actions per user request */}

                <View className="items-center mb-8">
                    <Text className="text-slate-400 dark:text-[#EBEBF54D] text-[13px] font-medium">Ehliyet Hocam v1.2.4</Text>
                </View>
            </ScrollView>

            {/* NICKNAME MODAL */}
            <Modal
                visible={showNicknamePrompt}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <View className="items-center mb-6">
                            <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 items-center justify-center mb-4">
                                <User size={32} color="#2563eb" />
                            </View>
                            <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">
                                Takma Ad Belirle
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center text-[13px] leading-5">
                                Gerçek isminin sıralamada görünmesini istemiyorsan bir takma ad girebilirsin. Boş bırakırsan gerçek ismin görünür.
                            </Text>
                        </View>

                        <TextInput
                            value={newNickname}
                            onChangeText={setNewNickname}
                            placeholder="Takma ad (Örn: Usta Sürücü)"
                            placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                            autoCorrect={false}
                            maxLength={30}
                            className="w-full bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl text-[16px] font-bold text-slate-900 dark:text-white mb-6 border border-slate-200 dark:border-slate-700"
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowNicknamePrompt(false)}
                                className="flex-1 bg-slate-200 dark:bg-slate-800 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-slate-700 dark:text-slate-300 font-bold text-[15px]">İptal</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={handleSaveNickname}
                                disabled={isSavingNickname}
                                className={`flex-1 bg-blue-600 py-4 rounded-2xl items-center ${isSavingNickname ? 'opacity-70' : ''}`}
                            >
                                <Text className="text-white font-bold text-[15px]">
                                    {isSavingNickname ? 'Kaydediliyor...' : 'Kaydet'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* CUSTOM TIME PICKER MODAL */}
            <Modal
                visible={showTimePicker}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-6">
                            Hatırlatma Saati Seçin
                        </Text>

                        <View className="flex-row items-center justify-center gap-x-8 mb-8">
                            {/* Hour Selector */}
                            <View className="items-center">
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTempTime(t => ({ ...t, hour: (t.hour + 1) % 24 }));
                                    }}
                                    className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-full items-center justify-center mb-2"
                                >
                                    <View className="rotate-0"><ChevronRight size={24} color={isDarkMode ? "white" : "black"} className="-rotate-90" /></View>
                                </TouchableOpacity>
                                <Text className="text-5xl font-black text-slate-900 dark:text-white w-16 text-center">
                                    {tempTime.hour.toString().padStart(2, '0')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTempTime(t => ({ ...t, hour: t.hour === 0 ? 23 : t.hour - 1 }));
                                    }}
                                    className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-full items-center justify-center mt-2"
                                >
                                    <View className="rotate-0"><ChevronRight size={24} color={isDarkMode ? "white" : "black"} className="rotate-90" /></View>
                                </TouchableOpacity>
                                <Text className="text-[10px] text-slate-400 font-bold uppercase mt-2">SAAT</Text>
                            </View>

                            <Text className="text-4xl font-black text-slate-300 dark:text-white/20">:</Text>

                            {/* Minute Selector */}
                            <View className="items-center">
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTempTime(t => ({ ...t, minute: (t.minute + 5) % 60 }));
                                    }}
                                    className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-full items-center justify-center mb-2"
                                >
                                    <View className="rotate-0"><ChevronRight size={24} color={isDarkMode ? "white" : "black"} className="-rotate-90" /></View>
                                </TouchableOpacity>
                                <Text className="text-5xl font-black text-slate-900 dark:text-white w-16 text-center">
                                    {tempTime.minute.toString().padStart(2, '0')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setTempTime(t => ({ ...t, minute: t.minute < 5 ? 55 : t.minute - 5 }));
                                    }}
                                    className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-full items-center justify-center mt-2"
                                >
                                    <View className="rotate-0"><ChevronRight size={24} color={isDarkMode ? "white" : "black"} className="rotate-90" /></View>
                                </TouchableOpacity>
                                <Text className="text-[10px] text-slate-400 font-bold uppercase mt-2">DAKİKA</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(false)}
                                className="flex-1 bg-slate-100 dark:bg-white/5 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-slate-600 dark:text-slate-400 font-bold text-base">Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveTime}
                                className="flex-[1.5] bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-600/30"
                            >
                                <Text className="text-white font-black text-base">Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenLayout>
    );
}
