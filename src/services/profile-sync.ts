import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { offlineSync, PROFILE_SYNC_QUEUE_KEY } from './offline-sync';

class ProfileSyncService {
    /**
     * Güncelleme isteklerini yerel kuyruğa ekler.
     * İnternet varsa hemen senkronize etmeyi dener.
     */
    public async syncProfilePreferences(updates: Record<string, any>) {
        try {
            // Mevcut kuyruğu al
            const queueStr = await AsyncStorage.getItem(PROFILE_SYNC_QUEUE_KEY);
            let queue: Record<string, any> = queueStr ? JSON.parse(queueStr) : {};

            // Yeni güncellemeleri eskilerin üzerine yaz (Merge)
            queue = { ...queue, ...updates };
            
            await AsyncStorage.setItem(PROFILE_SYNC_QUEUE_KEY, JSON.stringify(queue));

            // Eğer internet varsa hemen senkronize etmeyi dene
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected) {
                offlineSync.flushOfflineQueue();
            }
        } catch (error) {
            console.warn('ProfileSyncService: Kuyruğa ekleme hatası', error);
        }
    }
}

export const profileSync = new ProfileSyncService();
