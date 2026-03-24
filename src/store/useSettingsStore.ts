import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notificationsEnabled: true,
            setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
