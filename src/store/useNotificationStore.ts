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
    data?: Record<string, unknown>;
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (notif: Omit<AppNotification, 'id' | 'isRead' | 'time'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
    {
        id: 'welcome-notif-1',
        title: 'Ehliyet Sınavı Uygulamasına Hoş Geldin! 🎉',
        message: 'Sınava en iyi şekilde hazırlanman için her gün güncel sorular ve hatırlatmalar seni bekliyor.',
        time: 'Bugün',
        type: 'system',
        isRead: false,
    },
    {
        id: 'welcome-notif-2',
        title: 'Günlük Pratik Yapmayı Unutma 🚦',
        message: 'Günde 10 soru çözerek sınava hazırlık sürecini hızlandırabilirsin.',
        time: 'Bugün',
        type: 'info',
        isRead: false,
    }
];

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: DEFAULT_NOTIFICATIONS,
            addNotification: (notif) => set((state) => {
                // Aynı başlık ve mesajdaki bildirimin tekrar eklenmesini önle (spama karşı)
                const exists = state.notifications.some(
                    (n) => n.title === notif.title && n.message === notif.message
                );
                if (exists) return state;

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