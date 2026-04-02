import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    isReminderEnabled: boolean;
    setReminderEnabled: (enabled: boolean) => void;
    reminderTime: { hour: number, minute: number };
    setReminderTime: (hour: number, minute: number) => void;
    theme: 'light' | 'dark' | 'system';
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            notificationsEnabled: true,
            setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
            isReminderEnabled: false,
            setReminderEnabled: (enabled: boolean) => set({ isReminderEnabled: enabled }),
            reminderTime: { hour: 20, minute: 0 },
            setReminderTime: (hour, minute) => set({ reminderTime: { hour, minute } }),
            theme: 'system',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);