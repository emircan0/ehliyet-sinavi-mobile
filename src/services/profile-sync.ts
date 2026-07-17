import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../api/supabase';
import { getProfileSyncQueueKey, offlineSync, PROFILE_SYNC_QUEUE_KEY } from './offline-sync';

class ProfileSyncService {
    /**
     * Güncelleme isteklerini yerel kuyruğa ekler.
     * İnternet varsa hemen senkronize etmeyi dener.
     */
    public async syncProfilePreferences(updates: Record<string, unknown>): Promise<boolean> {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            if (!session?.user?.id) {
                throw new Error('Profil tercihleri için aktif kullanıcı bulunamadı.');
            }

            const queueKey = getProfileSyncQueueKey(session.user.id);

            // Eski sürümde sahibi belli olmayan ortak kuyruk kullanılıyordu.
            // Başka bir hesaba yazılma riskini önlemek için bu veri taşınmaz.
            await AsyncStorage.removeItem(PROFILE_SYNC_QUEUE_KEY);

            // Mevcut kuyruğu al
            const queueStr = await AsyncStorage.getItem(queueKey);
            let queue: Record<string, unknown> = queueStr ? JSON.parse(queueStr) : {};

            // Yeni güncellemeleri eskilerin üzerine yaz (Merge)
            queue = { ...queue, ...updates };

            await AsyncStorage.setItem(queueKey, JSON.stringify(queue));

            // Eğer internet varsa hemen senkronize etmeyi dene
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected) {
                await offlineSync.flushOfflineQueue();
            }

            return true;
        } catch (error) {
            console.warn('ProfileSyncService: Kuyruğa ekleme hatası', error);
            return false;
        }
    }
}

export const profileSync = new ProfileSyncService();
