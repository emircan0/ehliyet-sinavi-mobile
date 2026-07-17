import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { clearPushToken, cancelAllReminders } from '../api/notifications';
import { useNotificationStore } from '../store/useNotificationStore';
import { useQuizStore } from '../store/useQuizStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { analytics } from './analytics';

const USER_STORAGE_KEYS = new Set([
    'is_guest',
    'user_preferences',
    'has_completed_onboarding',
    '@pending_onboarding_email',
    '@analytics_event_queue',
    '@last_telemetry_time',
    '@general_evaluation_access_date',
]);

const USER_STORAGE_PREFIXES = [
    '@quiz_state_',
    '@unlocked_exam_',
    '@profile_sync_queue',
];

const clearUserStorage = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((key) =>
        USER_STORAGE_KEYS.has(key) ||
        USER_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
    );

    if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
    }
};

/**
 * Oturumu kapatırken sunucu tokenını ve bu kullanıcıya ait cihaz verilerini temizler.
 * Tema ve analitik rıza gibi cihaz genelindeki tercihler korunur.
 */
export const signOutAndClearUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user?.id) {
        await clearPushToken(session.user.id);
    }
    await cancelAllReminders();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    await analytics.clearQueue();
    await Promise.all([
        useNotificationStore.persist.clearStorage(),
        useSubscriptionStore.persist.clearStorage(),
        clearUserStorage(),
    ]);

    useNotificationStore.setState({ notifications: [] });
    useQuizStore.getState().resetQuiz();
    useSubscriptionStore.setState({ credits: 11 });
    useSubscriptionStore.getState().resetSubscription();
    useSettingsStore.getState().setNotificationsEnabled(false);
    useSettingsStore.getState().setReminderEnabled(false);
};
