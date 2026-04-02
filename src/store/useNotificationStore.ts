import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'success' | 'warning' | 'info' | 'system';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: NotificationType;
    isRead: boolean;
    data?: any;
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (notif: Omit<AppNotification, 'id' | 'isRead' | 'time'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            addNotification: (notif) => set((state) => {
                // Aynı ID'ye sahip bildirim tekrar eklenmesin (spama karşı)
                return {
                    notifications: [
                        {
                            ...notif,
                            id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            isRead: false,
                            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                        },
                        ...state.notifications,
                    ],
                };
            }),
            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
            })),
            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
            })),
            clearAll: () => set({ notifications: [] }),
        }),
        {
            name: 'notification-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);