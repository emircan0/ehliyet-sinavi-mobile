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
    ScrollView,
    ImageBackground,
    Dimensions,
    StyleSheet
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, User, ArrowLeft, Car, Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../src/api/supabase';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import Constants from 'expo-constants';
import { GoogleAuth } from '../../src/api/google-auth';

const isExpoGo = Constants.appOwnership === 'expo';

// Google Sign-In SDK Configuration (Safe for all platforms)
GoogleAuth.configure(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '');
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState<string | null>(null);
    const [hasAgreed, setHasAgreed] = useState(false);

    const primaryBlue = '#0A84FF';
    const placeholderColor = '#EBEBF599';
    const iconColor = '#EBEBF599';

    // Shake Animation Control
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

    const handleRegister = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedFullName = fullName.trim();

        if (!trimmedEmail || !trimmedPassword || !trimmedFullName) {
            triggerShake();
            Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
            return;
        }

        if (!hasAgreed) {
            triggerShake();
            Alert.alert('Kullanım Koşulları', 'Lütfen Gizlilik Politikası ve Kullanım Koşulları sözleşmelerini kabul ediniz.');
            return;
        }

        if (trimmedPassword.length < 6) {
            triggerShake();
            Alert.alert('Hata', 'Şifreniz en az 6 karakter olmalıdır.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error }: any = await supabase.auth.signUp({
                email: trimmedEmail,
                password: trimmedPassword,
                options: {
                    data: {
                        full_name: trimmedFullName,
                    }
                }
            });

            if (error) {
                console.error('Kayıt Hatası:', error.message);
                triggerShake();
                Alert.alert('Kayıt Başarısız', error.message);
            } else {
                if (data?.session) {
                    await AsyncStorage.removeItem('is_guest');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace('/');
                } else {
                    Alert.alert(
                        'Hesap Oluşturuldu!',
                        'Lütfen e-posta adresinize gelen onay bağlantısına tıklayın.',
                        [{ text: 'Tamam', onPress: () => router.push('/auth/login') }]
                    );
                }
            }
        } catch (error: any) {
            triggerShake();
            Alert.alert('Hata', 'Kayıt olurken beklenmeyen bir sorun oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        if (!hasAgreed) {
            triggerShake();
            Alert.alert('Kullanım Koşulları', 'Apple ile kayıt olmadan önce lütfen Gizlilik Politikası ve Kullanım Koşulları sözleşmelerini kabul ediniz.');
            return;
        }

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

        if (!hasAgreed) {
            triggerShake();
            Alert.alert('Kullanım Koşulları', 'Google ile kayıt olmadan önce lütfen Gizlilik Politikası ve Kullanım Koşulları sözleşmelerini kabul ediniz.');
            return;
        }

        setIsLoading(true);
        try {
            await GoogleAuth.hasPlayServices();
            const userInfo = await GoogleAuth.signIn();
            
            if (userInfo.data?.idToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;

                await AsyncStorage.removeItem('is_guest');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/');
            } else {
                throw new Error('Google ID Token bulunamadı.');
            }
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            if (error.code !== 'STATUS_CODES.SIGN_IN_CANCELLED') {
                Alert.alert('Google Girişi Hatası', 'Giriş yapılamadı veya iptal edildi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ImageBackground
                source={require('../../assets/images/driving-bg.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View className="flex-1 bg-black/40">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
                        >
                            {/* --- Üst Kısım --- */}
                            <Animated.View entering={FadeInUp.delay(100)} className="mb-4 flex-row justify-between items-center">
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    activeOpacity={0.7}
                                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20"
                                >
                                    <ArrowLeft size={20} color="#FFFFFF" />
                                </TouchableOpacity>

                                {/* Atla Butonu (Guest) */}
                                <TouchableOpacity
                                    onPress={async () => {
                                        await AsyncStorage.setItem('is_guest', 'true');
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        router.replace('/');
                                    }}
                                    className="bg-white/10 px-4 py-2 rounded-full border border-white/20"
                                >
                                    <Text className="text-white text-xs font-bold">Misafir Girişi</Text>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* --- Kayıt Kartı --- */}
                            <Animated.View
                                entering={FadeInDown.springify().damping(20).stiffness(90)}
                                style={animatedStyle}
                                className="w-full rounded-[32px] overflow-hidden border border-white/20 shadow-2xl shadow-black"
                            >
                                <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" className="px-6 py-8">
                                    <View className="mb-8 items-center">
                                        <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-4 border border-white/20">
                                            <Car size={28} color="white" strokeWidth={1.5} />
                                        </View>
                                        <Text className="text-[26px] font-semibold text-white tracking-tight mb-1 text-center">
                                            Hesap Oluştur
                                        </Text>
                                        <Text className="text-[14px] text-white/60 text-center font-medium">
                                            Sana özel plan için kayıt ol
                                        </Text>
                                    </View>

                                    {/* --- Form Alanı --- */}
                                    <View className="gap-y-4">
                                        <View className={`rounded-[16px] flex-row items-center px-4 h-12 transition-all border ${isFocused === 'name' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                            <User size={18} color={isFocused === 'name' ? primaryBlue : iconColor} strokeWidth={2} />
                                            <TextInput
                                                className="flex-1 ml-3 text-[16px] text-white h-full"
                                                placeholder="Ad Soyad"
                                                placeholderTextColor={placeholderColor}
                                                autoCapitalize="words"
                                                textContentType="name"
                                                value={fullName}
                                                onFocus={() => setIsFocused('name')}
                                                onBlur={() => setIsFocused(null)}
                                                onChangeText={setFullName}
                                                editable={!isLoading}
                                                selectionColor={primaryBlue}
                                            />
                                        </View>

                                        <View className={`rounded-[16px] flex-row items-center px-4 h-12 transition-all border ${isFocused === 'email' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                            <Mail size={18} color={isFocused === 'email' ? primaryBlue : iconColor} strokeWidth={2} />
                                            <TextInput
                                                className="flex-1 ml-3 text-[16px] text-white h-full"
                                                placeholder="E-posta"
                                                placeholderTextColor={placeholderColor}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                textContentType="emailAddress"
                                                autoComplete="email"
                                                value={email}
                                                onFocus={() => setIsFocused('email')}
                                                onBlur={() => setIsFocused(null)}
                                                onChangeText={setEmail}
                                                editable={!isLoading}
                                                selectionColor={primaryBlue}
                                            />
                                        </View>

                                        <View className={`rounded-[16px] flex-row items-center px-4 h-12 transition-all border ${isFocused === 'password' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                            <Lock size={18} color={isFocused === 'password' ? primaryBlue : iconColor} strokeWidth={2} />
                                            <TextInput
                                                className="flex-1 ml-3 text-[16px] text-white h-full"
                                                placeholder="Şifre"
                                                placeholderTextColor={placeholderColor}
                                                secureTextEntry
                                                textContentType="newPassword"
                                                autoComplete="password-new"
                                                value={password}
                                                onFocus={() => setIsFocused('password')}
                                                onBlur={() => setIsFocused(null)}
                                                onChangeText={setPassword}
                                                editable={!isLoading}
                                                selectionColor={primaryBlue}
                                            />
                                        </View>
                                    </View>

                                    {/* Butonlar */}
                                    <View className="mt-8 gap-y-3">
                                        <TouchableOpacity
                                            onPress={handleRegister}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                            className="h-12 rounded-[16px] bg-[#0A84FF] items-center justify-center flex-row"
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text className="text-white font-medium text-[16px]">
                                                    Kayıt Ol
                                                </Text>
                                            )}
                                        </TouchableOpacity>

                                        {Platform.OS === 'ios' && !isLoading && (
                                            <AppleAuthentication.AppleAuthenticationButton
                                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
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
                                            <Text className="text-white/60 text-[14px]">Zaten hesabın var mı? </Text>
                                            <Link href="/auth/login" asChild>
                                                <TouchableOpacity activeOpacity={0.6} className="py-2">
                                                    <Text className="text-white font-semibold text-[14px]">
                                                        Giriş Yap
                                                    </Text>
                                                </TouchableOpacity>
                                            </Link>
                                        </View>
                                    </View>

                                    {/* Legal Checkbox */}
                                    <View className="mt-6">
                                        <TouchableOpacity 
                                            activeOpacity={0.7} 
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setHasAgreed(!hasAgreed);
                                            }}
                                            className="flex-row items-start px-2"
                                        >
                                            <View className={`w-5 h-5 rounded-[4px] border items-center justify-center mr-3 mt-0.5 ${hasAgreed ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-white/40 bg-white/5'}`}>
                                                {hasAgreed && <Check size={14} color="white" strokeWidth={3} />}
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-[12px] text-white/80 leading-5">
                                                    Hesap oluşturarak{' '}
                                                    <Text onPress={() => router.push('/privacy')} className="text-white font-bold underline">Gizlilik Politikası</Text>
                                                    {' '}ve{' '}
                                                    <Text onPress={() => router.push('/terms')} className="text-white font-bold underline">Kullanım Koşulları</Text>
                                                    'nı okuduğumu ve kabul ettiğimi onaylıyorum.
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </BlurView>
                            </Animated.View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        width: width,
        height: height,
        position: 'absolute',
    }
});