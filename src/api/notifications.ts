// import * as Notifications from 'expo-notifications'; // Expo Go'da çökmeyi önlemek için kaldırıldı
import type { NotificationTriggerInput } from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

const isExpoGo = Constants.appOwnership === 'expo';
type NotificationsType = typeof import('expo-notifications');
const Notifications: NotificationsType | null = !isExpoGo ? require('expo-notifications') : null;

if (Notifications) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true, // İkon üzerinde kırmızı sayı görünsün
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    } catch (e) {
        console.warn('Notification handler setup failed:', e);
    }
}

// 1. Bildirim İzni Al ve Token'ı Supabase'e Kaydet
let isRegistering = false;

export const registerForPushNotificationsAsync = async (userId?: string) => {
    if (isExpoGo || !Notifications) {
        if (__DEV__) console.log("expo-notifications: Expo Go platformu üzerinden bildirim kaydı yapılamaz.");
        return null;
    }
    if (isRegistering) return null;
    isRegistering = true;

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!projectId) {
            if (__DEV__) {
                console.warn("DİKKAT: EAS Project ID bulunamadı. Bildirim token'ı alınamadı.");
                console.warn("Lütfen app.json içinde 'extra.eas.projectId' alanını kontrol edin.");
            }
            return null;
        }

        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = pushTokenData.data;

        // Supabase'e kaydet (Kullanıcı giriş yapmışsa)
        if (userId && token) {
            await savePushToken(userId, token);
        }

        return token;

    } catch (e: unknown) {
        if ((e as any)?.message?.includes('EXPERIENCE_NOT_FOUND')) {
            console.warn("\n🚨 DİKKAT: app.json içindeki EAS Project ID geçersiz veya hatalı.");
            console.warn("   Bildirimleri uçtan uca test etmek veya gerçek cihaza kurmak için terminalde 'npx eas init' komutunu çalıştırarak yeni bir ID almalısınız.");
            console.warn(`   Mevcut ID: ${projectId}\n`);
        } else {
            console.error("Token alınırken hata:", e);
        }
        return null;
    } finally {
        isRegistering = false;
    }
}

/**
 * Push token'ı Supabase'deki kullanıcı profiline kaydeder.
 */
export async function savePushToken(userId: string, token: string) {
    const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);

    if (error) {
        console.error('Push Token Supabase kayıt hatası:', error);
        return false;
    }
    return true;
}

export async function clearPushToken(userId: string) {
    const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('id', userId);

    if (error) {
        console.error('Push Token temizleme hatası:', error);
        return false;
    }
    return true;
}

// 2. Anlık Bildirim Gönder (Örn: Sınav bitince tetiklemek için)
export async function sendImmediateNotification(title: string, body: string, data = {}) {
    if (isExpoGo || !Notifications) return;
    try {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data },
            trigger: null,
        });
    } catch (e) {
        console.error('Immediate notification failed:', e);
    }
}

const NOTIFICATION_MESSAGES = [
    { title: "Sağa dönüşlerde kural neydi? 🤔", body: "Sınavda en çok karıştırılan trafik kurallarından birini 2 dakikada tekrar etmeye ne dersin?" },
    { title: "Trafik levhaları testi seni bekliyor 🚦", body: "Günün hap bilgisi hazır! Sınavda çıkabilecek 10 soruyla hafızanı tazele." },
    { title: "Direksiyona bir adım daha yakınsın 🚗", body: "Ehliyetine kavuşmak için bugünkü kısa antrenmanını tamamla, formunu koru." },
    { title: "Bugün nasılsın? 🌟", body: "Sınav hedefine ulaşmak için günde sadece 5 dakika pratik yapmak çok şeyi değiştirir." },
    { title: "Çalışma serin bozulmasın! 🔥", body: "Bugünkü antrenmanını tamamlayıp dünkü başarını devam ettirmek ister misin?" },
    { title: "Motor soğumadan biraz pratik? 🏍️", body: "Senin için hazırladığımız özel sorular seni bekliyor, üstelik çok vaktini almayacak." },
    { title: "Geçiş üstünlüğü kimde? 🚑", body: "Kavşak soruları bazen kafa karıştırır. Hemen bir mini test çözerek kendini sına!" },
    { title: "Hedefine odaklan 🎯", body: "Sınavı ilk seferde geçmek tesadüf değildir. Hadi günlük egzersizini aradan çıkaralım." }
];

// 3. Dinamik ve Rastgele Hatırlatıcı Planla (İleri dönük 14 gün)
export async function scheduleDailyReminder(fixedHour: number, fixedMinute: number) {
    if (isExpoGo || !Notifications) return false;
    try {
        // Önce eskileri temizle
        await cancelAllReminders();

        // İzin kontrolü
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') return false;
        }

        const now = new Date();
        const daysToSchedule = 14;

        for (let i = 0; i < daysToSchedule; i++) {
            const currentDay = new Date(now);
            currentDay.setDate(currentDay.getDate() + i);
            
            // 1. Sabit Hatırlatıcı (Kullanıcının Seçtiği Saat)
            const fixedDate = new Date(currentDay);
            fixedDate.setHours(fixedHour, fixedMinute, 0, 0);
            
            if (fixedDate > now) {
                const randomMsg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: randomMsg.title,
                        body: randomMsg.body,
                        data: { route: '/quiz/quick' },
                        sound: true,
                    },
                    trigger: { type: 'date', date: fixedDate } as any,
                });
            }

            // 2. Rastgele Hatırlatıcılar (Günde 0-2 kere, 10:00 - 22:00 arası)
            const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
            let shouldScheduleRandom = false;

            if (isWeekend) {
                // Hafta sonları %70 ihtimalle atsın
                shouldScheduleRandom = Math.random() > 0.3;
            } else {
                // Hafta içi: %40 ihtimalle SESSİZ gün olsun (kullanıcıyı bunaltmamak için)
                const isSilentDay = Math.random() < 0.4;
                shouldScheduleRandom = !isSilentDay;
            }

            if (shouldScheduleRandom) {
                const randomCount = Math.random() > 0.5 ? 1 : 2;
                for (let r = 0; r < randomCount; r++) {
                    const randHour = Math.floor(Math.random() * (22 - 10 + 1)) + 10; // 10 ile 22 arası
                    const randMinute = Math.floor(Math.random() * 60);
                    
                    const randomDate = new Date(currentDay);
                    randomDate.setHours(randHour, randMinute, 0, 0);

                    if (randomDate <= now) continue;

                    // Sabit saat ile rastgele saat çakışmasın (+- 1 saat boşluk)
                    const diffMs = Math.abs(randomDate.getTime() - fixedDate.getTime());
                    if (diffMs < 60 * 60 * 1000) {
                        continue;
                    }

                    const randMsg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: randMsg.title,
                            body: randMsg.body,
                            data: { route: '/quiz/quick' },
                            sound: true,
                        },
                        trigger: { type: 'date', date: randomDate } as any,
                    });
                }
            }
        }

        return true;
    } catch (e) {
        console.error("Hatırlatıcı planlanırken hata:", e);
        return false;
    }
}

export async function cancelAllReminders() {
    if (isExpoGo || !Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}
