import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { offlineSync } from '../services/offline-sync';
import { analytics } from '../services/analytics';

export const useNetworkStatus = () => {
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected !== null && !state.isConnected) {
                Toast.show({
                    type: 'error',
                    text1: 'İnternet Bağlantısı Koptu',
                    text2: 'Lütfen ağ bağlantınızı kontrol edin. Çevrimdışı çalışıyorsunuz.',
                    position: 'bottom',
                    visibilityTime: 4000,
                });
            } else if (state.isConnected) {
                // İnternet geldiğinde kuyruktaki verileri senkronize et
                offlineSync.flushOfflineQueue();
                analytics.flushQueue();
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);
};
