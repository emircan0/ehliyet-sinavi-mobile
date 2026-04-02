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
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react-native';
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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
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

    const handleResetPassword = async () => {
        if (!email) {
            triggerShake();
            Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresinizi girin.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

            if (error) {
                triggerShake();
                Alert.alert('İşlem Başarısız', error.message);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Bağlantı Gönderildi', 
                    'E-posta adresinize şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.',
                    [{ text: 'Tamam', onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            triggerShake();
            Alert.alert('Hata', 'İşlem yapılırken bir sorun oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const primaryBlue = '#0A84FF';
    const placeholderColor = '#EBEBF599';
    const iconColor = '#EBEBF599';

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
                        className="flex-1 px-6 justify-center"
                    >
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(90)}
                            style={animatedStyle}
                            className="w-full rounded-[32px] overflow-hidden border border-white/20 shadow-2xl shadow-black"
                        >
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 40 : 80}
                                tint="dark"
                                className="px-6 py-8"
                            >
                                <TouchableOpacity 
                                    onPress={() => router.back()}
                                    className="mb-6 w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20"
                                >
                                    <ArrowLeft size={20} color="white" />
                                </TouchableOpacity>

                                <View className="mb-8 items-center">
                                    <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-4 border border-white/20">
                                        <KeyRound size={28} color="white" strokeWidth={1.5} />
                                    </View>

                                    <Text className="text-[26px] font-semibold text-white tracking-tight mb-1 text-center">
                                        Şifremi Unuttum
                                    </Text>
                                    <Text className="text-[14px] text-white/60 text-center font-medium mt-2">
                                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                                    </Text>
                                </View>

                                <View className="gap-y-4">
                                    <View className={`rounded-[16px] flex-row items-center px-4 h-12 transition-all border ${isFocused === 'email' ? 'border-[#0A84FF] bg-white/10' : 'border-white/10 bg-white/5'}`}>
                                        <Mail size={18} color={isFocused === 'email' ? primaryBlue : iconColor} strokeWidth={2} />
                                        <TextInput
                                            className="flex-1 ml-3 text-[16px] text-white h-full"
                                            placeholder="Kayıtlı E-posta Adresi"
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
                                </View>

                                <View className="mt-8 gap-y-3">
                                    <TouchableOpacity
                                        onPress={handleResetPassword}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                        className="h-12 rounded-[16px] bg-[#0A84FF] items-center justify-center flex-row"
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-medium text-[16px]">
                                                Sıfırlama Bağlantısı Gönder
                                            </Text>
                                        )}
                                    </TouchableOpacity>
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
        backgroundColor: '#000',
    },
    backgroundImage: {
        width: width,
        height: height,
        position: 'absolute',
    }
});
