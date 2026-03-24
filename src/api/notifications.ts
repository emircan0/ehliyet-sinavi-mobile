import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirimlerin nasıl davranacağını ayarla (Örn: Uygulama açıkken bildirim gelsin mi?)
// src/api/notifications.ts içindeki ilgili kısım

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        // Eksik olan özellikler eklendi:
        shouldShowBanner: true, // Bildirimin üstten açılır pencere olarak görünmesi için
        shouldShowList: true,   // Bildirim merkezinde listelenmesi için
    }),
});
// 1. Bildirim İzni Al ve Bildirimleri Başlat
export async function registerForPushNotificationsAsync() {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Bildirim izni verilmedi! Hatırlatıcılar çalışmayacak.');
        return;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }
}

// 2. Anlık Bildirim Gönder (Örn: Sınav bitince)
export async function sendImmediateNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: { data: 'özel veri buraya' },
        },
        trigger: null, // trigger null ise hemen gönderir
    });
}

// 3. Günlük Hatırlatıcı Planla
export async function scheduleDailyReminder(hour: number, minute: number) {
    // Önce eski planlanmış bildirimleri temizle (üst üste binmesin)
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Direksiyon başına! 🚗",
            body: "Bugünkü ehliyet hazırlık testini hala çözmedin. Hadi 5 dakikanı ayır!",
        },
        // ÇÖZÜM BURADA: TypeScript'e bunun geçerli bir tetikleyici olduğunu söylüyoruz
        trigger: {
            hour: hour,
            minute: minute,
            repeats: true,
            type: 'calendar',
        } as Notifications.NotificationTriggerInput,
    });
}