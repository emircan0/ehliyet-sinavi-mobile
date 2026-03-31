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
import { Mail, Lock, UserPlus, User, ChevronRight, Apple, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
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
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace('/(tabs)');
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

    return (
        <View style={styles.container}>
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
                            <Animated.View entering={FadeInUp.delay(100)} className="mb-8 items-start">
                                <TouchableOpacity 
                                    onPress={() => router.back()}
                                    className="bg-white/10 w-12 h-12 rounded-2xl items-center justify-center mb-8 border border-white/20"
                                >
                                    <BlurView intensity={20} tint="light">
                                        <ArrowLeft size={24} color="#FFFFFF" />
                                    </BlurView>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* --- Kayıt Kartı --- */}
                            <Animated.View 
                                entering={FadeInDown.springify()}
                                style={animatedStyle}
                                className="w-full rounded-[40px] overflow-hidden border border-white/20"
                            >
                                <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" className="p-8">
                                    <View className="mb-8">
                                        <Text className="text-[32px] font-black text-white tracking-tight mb-2">
                                            Hesap Oluştur
                                        </Text>
                                        <Text className="text-[16px] text-white/60 leading-6 font-medium">
                                            Sana özel çalışma planı için kayıt ol.
                                        </Text>
                                    </View>

                                    {/* --- Form Alanı --- */}
                                    <View className="gap-y-4">
                                        <View className={`rounded-2xl flex-row items-center px-4 h-15 border transition-all ${isFocused === 'name' ? 'border-white/60 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                            <User size={20} color={isFocused === 'name' ? '#FFFFFF' : '#8E8E93'} />
                                            <TextInput
                                                className="flex-1 ml-3 text-[17px] text-white h-full"
                                                placeholder="Ad Soyad"
                                                placeholderTextColor="#8E8E93"
                                                autoCapitalize="words"
                                                textContentType="name"
                                                value={fullName}
                                                onFocus={() => setIsFocused('name')}
                                                onBlur={() => setIsFocused(null)}
                                                onChangeText={setFullName}
                                                editable={!isLoading}
                                                selectionColor="#FFFFFF"
                                            />
                                        </View>

                                        <View className={`rounded-2xl flex-row items-center px-4 h-15 border transition-all ${isFocused === 'email' ? 'border-white/60 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                            <Mail size={20} color={isFocused === 'email' ? '#FFFFFF' : '#8E8E93'} />
                                            <TextInput
                                                className="flex-1 ml-3 text-[17px] text-white h-full"
                                                placeholder="E-posta"
                                                placeholderTextColor="#8E8E93"
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                textContentType="emailAddress"
                                                autoComplete="email"
                                                value={email}
                                                onFocus={() => setIsFocused('email')}
                                                onBlur={() => setIsFocused(null)}
                                                onChangeText={setEmail}
                                                editable={!isLoading}
                                                selectionColor="#FFFFFF"
                                            />
                                        </View>

                                        <View className={`rounded-2xl flex-row items-center px-4 h-15 border transition-all ${isFocused === 'password' ? 'border-white/60 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                            <Lock size={20} color={isFocused === 'password' ? '#FFFFFF' : '#8E8E93'} />
                                            <TextInput
                                                className="flex-1 ml-3 text-[17px] text-white h-full"
                                                placeholder="Şifre"
                                                placeholderTextColor="#8E8E93"
                                                secureTextEntry
                                                textContentType="newPassword"
                                                autoComplete="password-new"
                                                value={password}
                                                onFocus={() => setIsFocused('password')}
                                                onBlur={() => setIsFocused(null)}
                                                onChangeText={setPassword}
                                                editable={!isLoading}
                                                selectionColor="#FFFFFF"
                                            />
                                        </View>
                                    </View>

                                    {/* KVKK / TOS */}
                                    <View className="mt-6 px-1">
                                        <Text className="text-[12px] text-white/40 text-center leading-5 uppercase tracking-tighter">
                                            Kayıt olarak{' '}
                                            <Text className="text-white/80 font-bold">Kullanım Koşullarını</Text> ve{' '}
                                            <Text className="text-white/80 font-bold">Gizlilik Politikasını</Text> kabul etmiş sayılırsınız.
                                        </Text>
                                    </View>

                                    {/* Kayıt Ol Butonu */}
                                    <View className="mt-8 gap-y-4">
                                        <TouchableOpacity
                                            onPress={handleRegister}
                                            disabled={isLoading}
                                            activeOpacity={0.8}
                                            className={`h-16 rounded-2xl items-center justify-center flex-row ${isLoading ? 'bg-white/40' : 'bg-white'}`}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="black" />
                                            ) : (
                                                <>
                                                    <Text className="text-black font-black text-[17px] mr-2">
                                                        Kayıt Ol
                                                    </Text>
                                                    <ArrowRight size={20} color="black" />
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <View className="flex-row justify-center items-center mt-4">
                                            <Text className="text-white/40 text-[15px]">Zaten hesabın var mı? </Text>
                                            <Link href="/auth/login" asChild>
                                                <TouchableOpacity className="py-2">
                                                    <Text className="text-white font-bold text-[15px]">
                                                        Giriş Yap
                                                    </Text>
                                                </TouchableOpacity>
                                            </Link>
                                        </View>
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
    },
    backgroundImage: {
        width: width,
        height: height,
    }
});