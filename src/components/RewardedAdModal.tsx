import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Dimensions, StyleSheet, Alert } from 'react-native';
import { X, Play, Award, Zap, Clock, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface RewardedAdModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'short' | 'long' | 'mega';
}

export default function RewardedAdModal({ visible, onClose, type }: RewardedAdModalProps) {
    const config = {
        short: { duration: 10, reward: 10, label: 'Kısa Reklam' },
        long: { duration: 20, reward: 20, label: 'Uzun Reklam' },
        mega: { duration: 40, reward: 50, label: 'Mega Reklam' },
    }[type];

    const [timeLeft, setTimeLeft] = useState(config.duration);
    const [isFinished, setIsFinished] = useState(false);
    const addCredits = useSubscriptionStore(state => state.addCredits);
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setTimeLeft(config.duration);
            setIsFinished(false);
            progress.setValue(0);

            Animated.timing(progress, {
                toValue: 1,
                duration: config.duration * 1000,
                useNativeDriver: false,
            }).start();

            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsFinished(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [visible, type]);

    const handleCloseEarly = () => {
        Alert.alert(
            "Reklamı Kapat",
            "Reklamı şimdi kapatırsanız kredi kazanamayacaksınız. Emin misiniz?",
            [
                { text: "İzlemeye Devam Et", style: "cancel" },
                { text: "Kapat ve Kredi Kaybet", style: "destructive", onPress: () => onClose() }
            ]
        );
    };

    const handleClaim = () => {
        addCredits(config.reward);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <View className="flex-1 bg-black justify-center items-center">
                
                {/* REKLAM İÇERİĞİ SİMÜLASYONU */}
                <LinearGradient
                    colors={['#1e293b', '#020617']}
                    className="absolute inset-0 items-center justify-center"
                >
                    <View className="items-center px-10">
                        <View className="w-24 h-24 bg-amber-500/10 rounded-[32px] items-center justify-center mb-8 border border-amber-500/20">
                            <Zap size={48} color="#f59e0b" fill="#f59e0b" />
                        </View>
                        <Text className="text-white text-3xl font-black text-center tracking-tight mb-4">
                            {config.label}
                        </Text>
                        <Text className="text-slate-400 text-center text-lg leading-6 font-medium">
                            Bu videoyu sonuna kadar izleyerek tam {config.reward} kredi kazanabilirsin!
                        </Text>
                    </View>

                    {/* REKLAM ÖZELLİKLERİ */}
                    <View className="mt-12 w-full px-10 gap-y-4">
                        <View className="flex-row items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <ShieldCheck size={20} color="#10b981" />
                            <Text className="text-white font-bold ml-3">Güvenli Soru Havuzu</Text>
                        </View>
                        <View className="flex-row items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <Award size={20} color="#3b82f6" />
                            <Text className="text-white font-bold ml-3">Anlık Sınav Sonucu</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ÜST BAR: SÜRE VE KAPATMA */}
                <View className="absolute top-14 left-0 right-0 px-6 flex-row justify-between items-center">
                    <View className="bg-black/60 px-4 py-2 rounded-full border border-white/10 flex-row items-center">
                        <Clock size={16} color="white" className="mr-2" />
                        <Text className="text-white font-black text-sm">
                            {isFinished ? 'TAMAMLANDI' : `${timeLeft}s`}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={isFinished ? onClose : handleCloseEarly}
                        className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20"
                    >
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* ALT BAR: PROGRESS VE BUTON */}
                <View className="absolute bottom-16 left-0 right-0 px-8 items-center">
                    {!isFinished ? (
                        <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                            <Animated.View 
                                style={{
                                    width: progress.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    }),
                                    height: '100%',
                                    backgroundColor: '#f59e0b'
                                }}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleClaim}
                            activeOpacity={0.8}
                            className="w-full overflow-hidden rounded-[24px] shadow-2xl shadow-amber-500/40"
                        >
                            <LinearGradient
                                colors={['#fbbf24', '#f59e0b']}
                                className="py-5 items-center flex-row justify-center"
                            >
                                <Text className="text-amber-950 font-black text-xl mr-2">{config.reward} Kredi Al</Text>
                                <Award size={24} color="#78350f" fill="#78350f" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}
