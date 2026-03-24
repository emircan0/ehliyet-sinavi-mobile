import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

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
                // If it re-connects, you might show a success toast.
                // But only if it was previously disconnected to avoid spamming on start.
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);
};
