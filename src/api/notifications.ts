import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true, // İkon üzerinde kırmızı sayı görünsün
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// 1. Bildirim İzni Al ve Token'ı Supabase'e Kaydet
let isRegistering = false;

export const registerForPushNotificationsAsync = async (userId?: string) => {
    if (isRegistering) return null;
    isRegistering = true;

    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi!');
        return null;
    }

    // Expo EAS Project ID'sini otomatik al (Mağazaya çıkarken zorunludur)
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!projectId) {
            console.warn("DİKKAT: EAS Project ID bulunamadı. Bildirim token'ı alınamadı.");
            console.warn("Lütfen app.json içinde 'extra.eas.projectId' alanını kontrol edin.");
            return null;
        }

        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushTokenData.data;

        // Supabase'e kaydet (Kullanıcı giriş yapmışsa)
        if (userId && token) {
            await savePushToken(userId, token);
        }

    } catch (e: any) {
        if (e?.message?.includes('EXPERIENCE_NOT_FOUND')) {
            console.warn("\n🚨 DİKKAT: app.json içindeki EAS Project ID geçersiz veya hatalı.");
            console.warn("   Bildirimleri uçtan uca test etmek veya gerçek cihaza kurmak için terminalde 'npx eas init' komutunu çalıştırarak yeni bir ID almalısınız.");
            console.warn(`   Mevcut ID: ${projectId}\n`);
        } else {
            console.error("Token alınırken hata:", e);
        }
    } finally {
        isRegistering = false;
    }

    return token;
}

/**
 * Push token'ı Supabase'deki kullanıcı profiline kaydeder.
 */
export async function savePushToken(userId: string, token: string) {
    const { error } = await supabase
        .from('profiles') // Supabase'deki kullanıcı tablonuzun adı
        .update({ expo_push_token: token }) // Supabase tablonuzdaki sütun adı
        .eq('id', userId);

    if (error) {
        console.error('Push Token Supabase kayıt hatası:', error);
        return false;
    }
    return true;
}

// 2. Anlık Bildirim Gönder (Örn: Sınav bitince tetiklemek için)
export async function sendImmediateNotification(title: string, body: string, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null,
    });
}

// 3. Günlük Hatırlatıcı Planla
export async function scheduleDailyReminder(hour: number, minute: number) {
    try {
        // Önce eskileri temizle
        await cancelAllReminders();

        // İzin kontrolü
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') return false;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Direksiyon başına! 🚗",
                body: "Bugünkü ehliyet hazırlık testini hala çözmedin. Hadi 5 dakikanı ayır!",
                data: { route: '/quiz/quick' }, // Tıklayınca hızlı antrenmana yönlendirecek veri
                sound: true,
            },
            trigger: {
                hour,
                minute,
                repeats: true,
                type: 'calendar',
            } as Notifications.NotificationTriggerInput,
        });
        return true;
    } catch (e) {
        console.error("Hatırlatıcı planlanırken hata:", e);
        return false;
    }
}

export async function cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}