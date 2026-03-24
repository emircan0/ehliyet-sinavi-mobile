import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // MANTIĞA HİÇBİR ŞEKİLDE DOKUNULMADI
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setIsLoading(true);

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 10000);
        });

        try {
            const result: any = await Promise.race([
                supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                }),
                timeoutPromise
            ]);

            setIsLoading(false);

            if (result.error) {
                console.error('Giriş Hatası:', result.error.message);
                Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.message === 'TIMEOUT') {
                Alert.alert('Bağlantı Zaman Aşımı', 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
            } else {
                Alert.alert('Hata', 'Giriş yapılırken beklenmeyen bir sorun oluştu.');
            }
        }
    };

    return (
        // Apple genellikle saf beyaz arka plan kullanır
        <ScreenLayout className="bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 px-8 justify-center"
            >
                {/* --- Başlık Alanı (Apple Tipografisi) --- */}
                <View className="mb-12 mt-4">
                    <View className="w-12 h-12 bg-[#F2F2F7] rounded-2xl items-center justify-center mb-6">
                        {/* İkonu küçültüp çok daha zarif bir hale getirdik */}
                        <Lock size={22} color="#000000" strokeWidth={2.5} />
                    </View>
                    {/* iOS Large Title boyutu (34px) ve sıkı harf aralığı */}
                    <Text className="text-[34px] font-bold text-black tracking-tight mb-3">
                        Giriş Yap
                    </Text>
                    {/* iOS standart alt başlık rengi ve boyutu */}
                    <Text className="text-[17px] text-[#8E8E93] leading-6">
                        Ehliyet sınavına hazırlanmaya kaldığın yerden devam et.
                    </Text>
                </View>

                {/* --- Form Alanı --- */}
                <View className="gap-y-4">
                    {/* Input 1: Çizgisiz, Apple stili gri arka plan (#F2F2F7) */}
                    <View className="bg-[#F2F2F7] rounded-2xl flex-row items-center px-4 h-14">
                        <Mail size={20} color="#8E8E93" />
                        <TextInput
                            className="flex-1 ml-3 text-[17px] text-black"
                            placeholder="E-posta"
                            placeholderTextColor="#8E8E93"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading}
                            selectionColor="#007AFF" // Apple mavi imleci
                        />
                    </View>

                    {/* Input 2 */}
                    <View className="bg-[#F2F2F7] rounded-2xl flex-row items-center px-4 h-14">
                        <Lock size={20} color="#8E8E93" />
                        <TextInput
                            className="flex-1 ml-3 text-[17px] text-black"
                            placeholder="Şifre"
                            placeholderTextColor="#8E8E93"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                            selectionColor="#007AFF"
                        />
                    </View>

                    {/* Şifremi Unuttum (Daha zarif bir konumlandırma) */}
                    <TouchableOpacity className="self-end mt-2 py-2">
                        <Text className="text-[#007AFF] text-[15px] font-medium">
                            Şifremi Unuttum
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* --- Aksiyon Alanı --- */}
                <View className="mt-8 gap-y-4">
                    {/* Ana Buton: Apple'ın yerel sistem mavisi (#007AFF) veya saf siyahı */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                        className={`h-14 rounded-2xl items-center justify-center flex-row ${isLoading ? 'bg-[#007AFF]/60' : 'bg-[#007AFF]'
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold text-[17px]">
                                Giriş Yap
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Kayıt Ol Yönlendirmesi */}
                    <View className="flex-row justify-center items-center mt-4">
                        <Text className="text-[#8E8E93] text-[15px]">Hesabın yok mu? </Text>
                        <Link href="/auth/register" asChild>
                            <TouchableOpacity className="py-2">
                                <Text className="text-[#007AFF] text-[15px] font-semibold">
                                    Hesap Oluştur
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

            </KeyboardAvoidingView>
        </ScreenLayout>
    );
}