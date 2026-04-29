/// <reference types="nativewind/types" />
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function ConfirmationSuccessScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ImageBackground
                source={require('../assets/images/driving-bg.jpg')}
                style={styles.backgroundImage}
            >
                <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <Animated.View 
                        entering={FadeInDown.springify().damping(20).stiffness(90)}
                        className="w-full"
                    >
                        <BlurView intensity={80} tint="dark" className="p-8 rounded-[40px] items-center w-full border border-white/20">
                            <Animated.View entering={FadeInUp.delay(300)} className="w-20 h-20 bg-emerald-500/20 rounded-full items-center justify-center mb-6 border border-emerald-500/30">
                                <CheckCircle2 size={40} color="#10b981" />
                            </Animated.View>
                            
                            <Text className="text-3xl font-bold text-white text-center mb-2">E-posta Onaylandı!</Text>
                            <Text className="text-white/60 text-center mb-10 text-lg">
                                Hesabınız başarıyla doğrulandı. Artık ehliyet sınavına hazırlanmaya hazırsınız.
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.replace('/(tabs)')}
                                activeOpacity={0.8}
                                className="bg-[#0A84FF] w-full py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/30"
                            >
                                <Text className="text-white font-bold text-lg mr-2">Hadi Başlayalım</Text>
                                <ArrowRight size={20} color="white" />
                            </TouchableOpacity>
                        </BlurView>
                    </Animated.View>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backgroundImage: { width, height, position: 'absolute' }
});
