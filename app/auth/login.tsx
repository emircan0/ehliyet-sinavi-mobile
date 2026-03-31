import React, { useState } from 'react';
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
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, ChevronRight, Car } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/api/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState<string | null>(null);

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

    const handleLogin = async () => {
        if (!email || !password) {
            triggerShake();
            Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setIsLoading(true);
        try {
            const { error }: any = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) {
                triggerShake();
                Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
            } else {
                await AsyncStorage.removeItem('is_guest');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            triggerShake();
            Alert.alert('Hata', 'Giriş yapılırken bir sorun oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });

                if (error) throw error;
                await AsyncStorage.removeItem('is_guest');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Apple Girişi Hatası', 'Giriş yapılamadı.');
            }
        }
    };

    const handleGuestAccess = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await AsyncStorage.setItem('is_guest', 'true');
        router.replace('/(tabs)');
    };

    const primaryBlue = '#0A84FF'; // iOS Dark Mode Blue - daha okunabilir
    const placeholderColor = '#EBEBF599'; // Cam üzerinde okunabilir açık gri
    const iconColor = '#EBEBF599';

    return (
        <View style={styles.container}>
            {/* Arka plan resminin üzerine bineceği için yazıları hep beyaz tutmak adına light status bar */}
            <StatusBar style="light" />

            <ImageBackground
                source={require('../../assets/images/driving-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Genel ekran karartması (resmi biraz geriye atar) */}
                <View className="flex-1 bg-black/40">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 px-6 justify-center"
                    >
                        {/* --- Atla Butonu --- */}
                        <Animated.View
                            entering={FadeInUp.delay(200)}
                            className="absolute top-16 right-6 z-20"
                        >
                            <TouchableOpacity
                                onPress={handleGuestAccess}
                                activeOpacity={0.6}
                            >
                                <BlurView
                                    intensity={30}
                                    tint="dark"
                                    className="rounded-full px-4 py-2 flex-row items-center border border-white/20 overflow-hidden"
                                >
                                    <Text className="text-white/90 text-[14px] font-medium mr-1">Atla</Text>
                                    <ChevronRight size={14} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
                                </BlurView>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* --- Ana Giriş Kartı --- */}
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(90)}
                            style={animatedStyle}
                            className="w-full rounded-[32px] overflow-hidden border border-white/20 shadow-2xl shadow-black"
                        >
                            {/* Sabit dark tint ile resimden bağımsız net okunabilirlik */}
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 40 : 80}
                                tint="dark"
                                className="px-6 py-8"
                            >
                                <View className="mb-8 items-center">
                                    <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-4 border border-white/20">
                                        <Car size={28} color="white" strokeWidth={1.5} />
                                    </View>

                                    <Text className="text-[26px] font-semibold text-white tracking-tight mb-1 text-center">
                                        Ehliyet Hocam
                                    </Text>
                                    <Text className="text-[14px] text-white/60 text-center font-medium">
                                        Yapay zeka ile sürüşe hazırlanın
                                    </Text>
                                </View>

                                {/* --- Form Alanı --- */}
                                <View className="gap-y-4">
                                    {/* E-posta Input */}
                                    <View className={`rounded-[16px] flex-row items-center px-4 h-12 transition-all border ${isFocused === 'email' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                        <Mail size={18} color={isFocused === 'email' ? primaryBlue : iconColor} strokeWidth={2} />
                                        <TextInput
                                            className="flex-1 ml-3 text-[16px] text-white h-full"
                                            placeholder="E-posta"
                                            placeholderTextColor={placeholderColor}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            textContentType="username"
                                            autoComplete="email"
                                            value={email}
                                            onFocus={() => setIsFocused('email')}
                                            onBlur={() => setIsFocused(null)}
                                            onChangeText={setEmail}
                                            editable={!isLoading}
                                            selectionColor={primaryBlue}
                                        />
                                    </View>

                                    {/* Şifre Input */}
                                    <View className={`rounded-[16px] flex-row items-center px-4 h-12 transition-all border ${isFocused === 'password' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                        <Lock size={18} color={isFocused === 'password' ? primaryBlue : iconColor} strokeWidth={2} />
                                        <TextInput
                                            className="flex-1 ml-3 text-[16px] text-white h-full"
                                            placeholder="Şifre"
                                            placeholderTextColor={placeholderColor}
                                            secureTextEntry
                                            textContentType="password"
                                            autoComplete="password"
                                            value={password}
                                            onFocus={() => setIsFocused('password')}
                                            onBlur={() => setIsFocused(null)}
                                            onChangeText={setPassword}
                                            editable={!isLoading}
                                            selectionColor={primaryBlue}
                                        />
                                    </View>

                                    <TouchableOpacity className="self-end mt-1" activeOpacity={0.6}>
                                        <Text className="text-white/70 text-[13px] font-medium">Şifremi Unuttum</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* --- Butonlar --- */}
                                <View className="mt-8 gap-y-3">
                                    {/* Giriş Butonu - Yüksekliği düşürüldü (h-12 / 48px) */}
                                    <TouchableOpacity
                                        onPress={handleLogin}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                        className="h-12 rounded-[16px] bg-[#0A84FF] items-center justify-center flex-row"
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-medium text-[16px]">
                                                Giriş Yap
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Apple Butonu - Yüksekliği giriş butonu ile eşitlendi (48px) */}
                                    {Platform.OS === 'ios' && (
                                        <AppleAuthentication.AppleAuthenticationButton
                                            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                                            cornerRadius={16}
                                            style={{ width: '100%', height: 48 }}
                                            onPress={handleAppleSignIn}
                                        />
                                    )}

                                    <View className="flex-row justify-center items-center mt-5">
                                        <Text className="text-white/60 text-[14px]">Hesabınız yok mu? </Text>
                                        <Link href="/auth/register" asChild>
                                            <TouchableOpacity activeOpacity={0.6} className="py-2">
                                                <Text className="text-white font-semibold text-[14px]">
                                                    Kayıt Ol
                                                </Text>
                                            </TouchableOpacity>
                                        </Link>
                                    </View>
                                </View>
                            </BlurView>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Resim yüklenene kadar siyah göstersin
    },
    backgroundImage: {
        width: width,
        height: height,
        position: 'absolute',
    }
});
