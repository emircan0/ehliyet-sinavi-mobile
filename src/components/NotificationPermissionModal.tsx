import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, ShieldCheck, Zap, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { registerForPushNotificationsAsync, savePushToken } from '../api/notifications';
import { supabase } from '../api/supabase';

interface NotificationPermissionModalProps {
    isVisible: boolean;
    onClose: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({ isVisible, onClose }) => {
    const handleAllow = async () => {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await savePushToken(user.id, token);
            }
        }
        onClose();
    };

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                
                <View className="bg-white dark:bg-slate-900 w-[85%] rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    <TouchableOpacity 
                        onPress={onClose}
                        className="absolute right-6 top-6 z-10 w-8 h-8 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full"
                    >
                        <X size={16} color="#64748b" />
                    </TouchableOpacity>

                    <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-6">
                        <Bell size={32} color="#3b82f6" strokeWidth={2.5} />
                    </View>

                    <Text className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                        Bildirimleri Açın 🔔
                    </Text>
                    
                    <Text className="text-slate-500 dark:text-slate-400 text-sm leading-6 mb-8">
                        Sınav hazırlık sürecinde hiçbir şeyi kaçırmaman için sana küçük hatırlatmalar göndermek istiyoruz.
                    </Text>

                    <View className="gap-y-5 mb-8">
                        <View className="flex-row items-center gap-x-4">
                            <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl items-center justify-center">
                                <Zap size={20} color="#10b981" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-white font-bold text-[15px]">Günlük Hatırlatıcılar</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">Düzenli çalışma disiplini kazan.</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center gap-x-4">
                            <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl items-center justify-center">
                                <ShieldCheck size={20} color="#f59e0b" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-white font-bold text-[15px]">Sınav Güncellemeleri</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">Müfredat değişikliklerinden anında haberdar ol.</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleAllow}
                        activeOpacity={0.8}
                        className="bg-blue-600 py-4 rounded-2xl items-center justify-center shadow-lg shadow-blue-600/30"
                    >
                        <Text className="text-white font-bold text-base">Bildirimlere İzin Ver</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.6}
                        className="mt-4 py-2 items-center justify-center"
                    >
                        <Text className="text-slate-400 dark:text-slate-500 font-semibold text-xs">Daha Sonra</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
