import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

export const PROFILE_SYNC_QUEUE_KEY = '@profile_sync_queue';

class OfflineSyncService {
    private isSyncing = false;

    /**
     * Kuyruktaki profil verilerini Supabase'e gönderir ve başarılıysa kuyruğu temizler.
     */
    public async flushOfflineQueue() {
        if (this.isSyncing) return;

        try {
            this.isSyncing = true;
            
            const queueStr = await AsyncStorage.getItem(PROFILE_SYNC_QUEUE_KEY);
            if (!queueStr) {
                this.isSyncing = false;
                return; // Kuyruk boş
            }

            const queue = JSON.parse(queueStr);
            if (Object.keys(queue).length === 0) {
                this.isSyncing = false;
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                this.isSyncing = false;
                return; // Kullanıcı giriş yapmamış
            }

            const { error } = await supabase
                .from('profiles')
                .update(queue)
                .eq('id', session.user.id);

            if (error) {
                throw error;
            }

            // Başarılı! Kuyruğu temizle.
            await AsyncStorage.removeItem(PROFILE_SYNC_QUEUE_KEY);
            console.log('OfflineSyncService: Profil güncellemeleri başarıyla senkronize edildi.');

        } catch (error) {
            console.warn('OfflineSyncService: Senkronizasyon başarısız, veriler kuyrukta bekliyor.', error);
        } finally {
            this.isSyncing = false;
        }
    }
}

export const offlineSync = new OfflineSyncService();
