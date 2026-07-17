import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

export const PROFILE_SYNC_QUEUE_KEY = '@profile_sync_queue';
export const getProfileSyncQueueKey = (userId: string) => `${PROFILE_SYNC_QUEUE_KEY}:${userId}`;

class OfflineSyncService {
    private isSyncing = false;

    /**
     * Kuyruktaki profil verilerini Supabase'e gönderir ve başarılıysa kuyruğu temizler.
     */
    public async flushOfflineQueue() {
        if (this.isSyncing) return;

        try {
            this.isSyncing = true;

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            if (!session?.user?.id) return;

            const queueKey = getProfileSyncQueueKey(session.user.id);
            const queueStr = await AsyncStorage.getItem(queueKey);
            if (!queueStr) {
                return; // Kuyruk boş
            }

            const queue = JSON.parse(queueStr) as Record<string, unknown>;
            if (Object.keys(queue).length === 0) {
                await AsyncStorage.removeItem(queueKey);
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update(queue)
                .eq('id', session.user.id);

            if (error) {
                throw error;
            }

            // İstek sürerken yeni bir tercih kuyruğa eklendiyse onu silme.
            const latestQueueStr = await AsyncStorage.getItem(queueKey);
            if (latestQueueStr === queueStr) {
                await AsyncStorage.removeItem(queueKey);
            }
            console.log('OfflineSyncService: Profil güncellemeleri başarıyla senkronize edildi.');

        } catch (error) {
            console.warn('OfflineSyncService: Senkronizasyon başarısız, veriler kuyrukta bekliyor.', error);
        } finally {
            this.isSyncing = false;
        }
    }
}

export const offlineSync = new OfflineSyncService();
