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
import { useThemeMode } from '../../src/hooks/useThemeMode';
import Svg, { Path } from 'react-native-svg';
import Constants from 'expo-constants';
import { GoogleAuth } from '../../src/api/google-auth';

const isExpoGo = Constants.appOwnership === 'expo';

// Google Sign-In SDK Configuration (Hardcoded for maximum reliability during testing)
GoogleAuth.configure(
    '247538031791-bueg0qbqglbo7p9od98lg7glgnfd47m1.apps.googleusercontent.com', // Web application (Supabase audience)
    '247538031791-tl9ub933k1qp5q351ls1c3ubcru7uufe.apps.googleusercontent.com'  // iOS Client ID
);

export default function LoginScreen() {
    const router = useRouter();
    const { isDarkMode, colorScheme } = useThemeMode();
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
                // Index sayfasına yönlendir, onboarding kontrolünü o yapacak
                router.replace('/');
            }
        } catch (error: any) {
            triggerShake();
            Alert.alert('Hata', 'Giriş yapılırken bir sorun oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        setIsLoading(true);
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

                if (error) {
                    console.error('Supabase Apple Auth Error:', error.message);
                    throw error;
                }

                await AsyncStorage.removeItem('is_guest');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Ensure profile exists (new social sign-ups)
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        const userId = session.user.id;
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', userId)
                            .maybeSingle();

                        if (!existingProfile) {
                            const fullNameToUse = session.user.user_metadata?.full_name || session.user.email || 'Sürücü Adayı';
                            await supabase.from('profiles').insert([{ id: userId, full_name: fullNameToUse, onboarding_completed: false }]);
                        }
                    }
                } catch (e) {
                    console.warn('Profile ensure after Apple sign-in failed', e);
                }

                router.replace('/');
            } else {
                throw new Error('Apple Identity Token bulunamadı.');
            }
        } catch (e: any) {
            console.error('Apple Sign-In Error Detail:', e);
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Apple Girişi Hatası', 'Giriş yapılamadı. Lütfen tekrar deneyin.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (isExpoGo) {
            Alert.alert(
                'Geliştirme Mode',
                'Google Giriş özelliği sadece gerçek cihazlarda veya Development Build sürümlerinde çalışır. Expo Go bu özelliği desteklemez.'
            );
            return;
        }

        setIsLoading(true);
        try {
            await GoogleAuth.hasPlayServices();
            const userInfo = await GoogleAuth.signIn();

            if (userInfo.type === 'cancelled') {
                return;
            }

            if (userInfo.type === 'success' && userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;

                await AsyncStorage.removeItem('is_guest');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Ensure profile exists (new social sign-ups)
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        const userId = session.user.id;
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', userId)
                            .maybeSingle();

                        if (!existingProfile) {
                            const fullNameToUse = session.user.user_metadata?.full_name || session.user.email || 'Sürücü Adayı';
                            await supabase.from('profiles').insert([{ id: userId, full_name: fullNameToUse, onboarding_completed: false }]);
                        }
                    }
                } catch (e) {
                    console.warn('Profile ensure after Google sign-in failed', e);
                }

                router.replace('/');
            } else {
                throw new Error('Google ID Token bulunamadı.');
            }
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            const statusCodes = GoogleAuth.getStatusCodes();
            if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert(
                    'Google Girişi Hatası',
                    error?.message || 'Giriş yapılamadı. Google OAuth istemci ayarlarını ve cihaz yapılandırmasını kontrol edin.'
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    // handleGuestAccess kaldırıldı (Zorunlu kayıt)


    const primaryBlue = '#0A84FF'; // iOS Dark Mode Blue - daha okunabilir
    const placeholderColor = '#EBEBF599'; // Cam üzerinde okunabilir açık gri
    const iconColor = '#EBEBF599';

    return (
        <View style={styles.container}>
            {/* Arka plan resminin üzerine bineceği için yazıları hep beyaz tutmak adına light status bar */}
            <StatusBar style="light" />

            <ImageBackground
                source={require('../../assets/images/driving-bg.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Genel ekran karartması (resmi biraz geriye atar) */}
                <View className="flex-1 bg-black/40">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 px-6 justify-center"
                    >
                        {/* Atla Butonu (Guest) */}
                        <TouchableOpacity
                            onPress={async () => {
                                await AsyncStorage.setItem('is_guest', 'true');
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                router.replace('/');
                            }}
                            className="absolute top-12 right-6 z-50 bg-white/10 px-4 py-2 rounded-full border border-white/20"
                        >
                            <Text className="text-white text-xs font-bold">Misafir Girişi</Text>
                        </TouchableOpacity>
                        
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

                                    <Link href="/auth/forgot-password" asChild>
                                        <TouchableOpacity className="self-end mt-1" activeOpacity={0.6}>
                                            <Text className="text-white/70 text-[13px] font-medium">Şifremi Unuttum</Text>
                                        </TouchableOpacity>
                                    </Link>
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
                                    {Platform.OS === 'ios' && !isLoading && (
                                        <AppleAuthentication.AppleAuthenticationButton
                                            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                            cornerRadius={16}
                                            style={{ width: '100%', height: 48 }}
                                            onPress={handleAppleSignIn}
                                        />
                                    )}

                                    {/* Google Butonu */}
                                    {!isLoading && (
                                        <TouchableOpacity
                                            onPress={handleGoogleSignIn}
                                            activeOpacity={0.8}
                                            className="h-12 rounded-[16px] bg-white items-center justify-center flex-row border border-white/20 shadow-sm"
                                        >
                                            <Svg width="18" height="18" viewBox="0 0 24 24" className="mr-3">
                                                <Path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <Path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <Path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                                    fill="#FBBC05"
                                                />
                                                <Path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </Svg>
                                            <Text className="text-slate-900 font-semibold text-[15px]">
                                                Google ile Devam Et
                                            </Text>
                                        </TouchableOpacity>
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
        ...StyleSheet.absoluteFillObject,
    }
});
