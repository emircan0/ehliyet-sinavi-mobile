import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    time: string;
    type: 'success' | 'warning' | 'info' | 'error' | 'promo';
    isRead: boolean;
    data?: any;
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'isRead'>) => void;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            addNotification: (notification) => set((state) => ({
                notifications: [
                    { ...notification, isRead: false },
                    ...state.notifications
                ].slice(0, 50) // Limit to 50 notifications
            })),
            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            })),
            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map((n) => 
                    n.id === id ? { ...n, isRead: true } : n
                )
            })),
            clearAll: () => set({ notifications: [] }),
            unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
        }),
        {
            name: 'notification-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
