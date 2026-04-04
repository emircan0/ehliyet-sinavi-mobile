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
import { Mail, Lock, User, ArrowLeft, Car } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../src/api/supabase';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            <ImageBackground 
                source={require('../../assets/images/driving-bg.png')} 
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
                            <Animated.View entering={FadeInUp.delay(100)} className="mb-4">
                                <TouchableOpacity 
                                    onPress={() => router.back()}
                                    activeOpacity={0.7}
                                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20"
                                >
                                    <ArrowLeft size={20} color="#FFFFFF" />
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

                                    {/* Legal Links */}
                                    <View className="mt-6 flex-row flex-wrap justify-center items-center opacity-40">
                                        <Text className="text-[10px] text-white text-center uppercase tracking-widest">
                                            Devam ederek{' '}
                                        </Text>
                                        <TouchableOpacity onPress={() => router.push('/terms')}>
                                            <Text className="text-[10px] text-white font-bold uppercase tracking-widest underline">Koşullarımızı</Text>
                                        </TouchableOpacity>
                                        <Text className="text-[10px] text-white uppercase tracking-widest"> kabul edersiniz.</Text>
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