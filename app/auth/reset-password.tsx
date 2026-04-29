import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
    Dimensions,
    StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/api/supabase';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const shakeOffset = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeOffset.value }],
    }));

    const triggerShake = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeOffset.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withRepeat(withTiming(10, { duration: 50 }), 4, true),
            withTiming(0, { duration: 50 })
        );
    };

    const handleUpdatePassword = async () => {
        if (!password || password.length < 6) {
            triggerShake();
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            triggerShake();
            Alert.alert('Hata', 'Şifreler eşleşmiyor.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password.trim()
            });

            if (error) {
                triggerShake();
                Alert.alert('Güncelleme Başarısız', error.message);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsSuccess(true);
            }
        } catch (error: any) {
            triggerShake();
            Alert.alert('Hata', 'İşlem yapılırken bir sorun oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <View style={styles.container}>
                <ImageBackground
                    source={require('../../assets/images/driving-bg.jpg')}
                    style={styles.backgroundImage}
                >
                    <View className="flex-1 bg-black/60 items-center justify-center px-6">
                        <BlurView intensity={80} tint="dark" className="p-8 rounded-[40px] items-center w-full border border-white/20">
                            <View className="w-20 h-20 bg-emerald-500/20 rounded-full items-center justify-center mb-6 border border-emerald-500/30">
                                <CheckCircle2 size={40} color="#10b981" />
                            </View>
                            <Text className="text-2xl font-bold text-white text-center mb-2">Şifreniz Güncellendi</Text>
                            <Text className="text-white/60 text-center mb-8">Artık yeni şifrenizle giriş yapabilirsiniz.</Text>
                            <TouchableOpacity
                                onPress={() => router.replace('/auth/login')}
                                className="bg-[#0A84FF] w-full py-4 rounded-2xl items-center"
                            >
                                <Text className="text-white font-bold text-lg">Giriş Yap</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </ImageBackground>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ImageBackground
                source={require('../../assets/images/driving-bg.jpg')}
                style={styles.backgroundImage}
            >
                <View className="flex-1 bg-black/40">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 px-6 justify-center"
                    >
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(90)}
                            style={animatedStyle}
                            className="w-full rounded-[32px] overflow-hidden border border-white/20"
                        >
                            <BlurView intensity={40} tint="dark" className="px-6 py-8">
                                <View className="mb-8 items-center">
                                    <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-4 border border-white/20">
                                        <Lock size={28} color="white" />
                                    </View>
                                    <Text className="text-2xl font-bold text-white mb-1">Yeni Şifre Belirle</Text>
                                    <Text className="text-white/60 text-center text-sm">Lütfen unutmayacağınız güçlü bir şifre seçin.</Text>
                                </View>

                                <View className="gap-y-4">
                                    <View className={`rounded-2xl flex-row items-center px-4 h-14 border ${isFocused === 'pass' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                        <Lock size={18} color={isFocused === 'pass' ? '#0A84FF' : '#ffffff66'} />
                                        <TextInput
                                            className="flex-1 ml-3 text-white text-base"
                                            placeholder="Yeni Şifre"
                                            placeholderTextColor="#ffffff66"
                                            secureTextEntry
                                            value={password}
                                            onFocus={() => setIsFocused('pass')}
                                            onBlur={() => setIsFocused(null)}
                                            onChangeText={setPassword}
                                        />
                                    </View>

                                    <View className={`rounded-2xl flex-row items-center px-4 h-14 border ${isFocused === 'confirm' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                        <Lock size={18} color={isFocused === 'confirm' ? '#0A84FF' : '#ffffff66'} />
                                        <TextInput
                                            className="flex-1 ml-3 text-white text-base"
                                            placeholder="Şifreyi Onayla"
                                            placeholderTextColor="#ffffff66"
                                            secureTextEntry
                                            value={confirmPassword}
                                            onFocus={() => setIsFocused('confirm')}
                                            onBlur={() => setIsFocused(null)}
                                            onChangeText={setConfirmPassword}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleUpdatePassword}
                                    disabled={isLoading}
                                    className="mt-8 h-14 rounded-2xl bg-[#0A84FF] items-center justify-center"
                                >
                                    {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Şifreyi Güncelle</Text>}
                                </TouchableOpacity>
                            </BlurView>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backgroundImage: { width, height, position: 'absolute' }
});
