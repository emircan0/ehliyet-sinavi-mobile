import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Bildirimlerin nasıl davranacağını ayarla (Örn: Uygulama açıkken bildirim gelsin mi?)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// 1. Bildirim İzni Al ve Push Token Döndür
export async function registerForPushNotificationsAsync() {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    // Expo projenizin 'extra.eas.projectId' değerini app.json'dan alması için
    // Gerçek cihazlarda ve EAS Build kullanıldığında gereklidir.
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '7be1223e-64c8-472d-862d-0b7c7b808933', // Örnek Project ID
        });
        token = tokenData.data;
    } catch (e) {
        console.warn('Push token alınamadı:', e);
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

// 2. Token'ı Supabase'e Kaydet
export async function savePushToken(userId: string, token: string) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ expo_push_token: token })
            .eq('id', userId);

        if (error) throw error;
        console.log('✅ Push Token Supabase’e kaydedildi.');
        return true;
    } catch (error) {
        console.error('❌ Push Token kaydedilirken hata:', error);
        return false;
    }
}

// 3. Anlık Bildirim Gönder (Local)
export async function sendImmediateNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: data || {},
            // Android için kanal belirlenmiş olmalı
            ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: null,
    });
}

// 4. Günlük Hatırlatıcı Programla
export async function scheduleDailyReminder(hour: number, minute: number) {
    // Önceki tüm bildirimleri temizle (hatırlatıcıyı güncellemek için)
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Sınav vaktin geldi! 🚗",
            body: "Bugün hedeflerine ulaşmak için 10 soru çözmeye ne dersin?",
            sound: true,
            // Android için kanal belirlenmiş olmalı
            ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hour,
            minute: minute,
            repeats: true,
            // Hata mesajına istinaden channelId buraya da eklenebilir veya sadece tip belirtilebilir
            ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        } as any, // SDK tip tanımlarında bazı uyuşmazlıklar olabiliyor, any ile zorluyoruz
    });
}