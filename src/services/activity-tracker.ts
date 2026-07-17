import { supabase } from '../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useThemeMode } from '../hooks/useThemeMode';

const LAST_TELEMETRY_KEY = '@last_telemetry_time';
const THROTTLE_MS = 5 * 60 * 1000; // 5 dakika

class ActivityTrackerService {
    /**
     * Kullanıcının son görülme zamanını ve temasını 5 dakikalık throttle ile günceller.
     * Bu işlem fire-and-forget çalışır.
     */
    public async updateLastActive(isDarkMode: boolean) {
        try {
            const lastTimeStr = await AsyncStorage.getItem(LAST_TELEMETRY_KEY);
            const now = Date.now();
            
            // Eğer son gönderimden bu yana 5 dakika geçmediyse istek atma
            if (lastTimeStr && (now - parseInt(lastTimeStr, 10)) < THROTTLE_MS) {
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const premiumStatus = useSubscriptionStore.getState().isPremium ? 'premium' : 'free';
                
                supabase
                    .from('profiles')
                    .update({ 
                        last_active_at: new Date(now).toISOString(),
                        app_theme: isDarkMode ? 'dark' : 'light',
                        timezone: tz,
                        premium_status: premiumStatus
                    })
                    .eq('id', session.user.id)
                    .then(({ error }) => {
                        if (error) {
                            console.warn("Update Last Active Error (Sessiz Hata):", error);
                        }
                    });
                
                await AsyncStorage.setItem(LAST_TELEMETRY_KEY, now.toString());
            }
        } catch (e) {
            console.warn("Activity Tracker Error:", e);
        }
    }
}

export const activityTracker = new ActivityTrackerService();
