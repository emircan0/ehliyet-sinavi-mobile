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
    ScrollView
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, UserPlus, User } from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { supabase } from '../../src/api/supabase';

export default function RegisterScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedFullName = fullName.trim();

        if (!trimmedEmail || !trimmedPassword || !trimmedFullName) {
            Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
            return;
        }

        if (trimmedPassword.length < 6) {
            Alert.alert('Hata', 'Şifreniz en az 6 karakter olmalıdır.');
            return;
        }

        setIsLoading(true);

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 10000);
        });

        try {
            const result: any = await Promise.race([
                supabase.auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword,
                    options: {
                        data: {
                            full_name: trimmedFullName,
                        }
                    }
                }),
                timeoutPromise
            ]);

            setIsLoading(false);

            if (result.error) {
                console.error('Kayıt Hatası:', result.error.message);
                Alert.alert('Kayıt Başarısız', result.error.message);
            } else {
                if (result.data?.session) {
                    router.replace('/(tabs)');
                } else {
                    Alert.alert(
                        'Kayıt Başarılı!',
                        'Lütfen e-posta adresinize gelen onay bağlantısına tıklayın.',
                        [{ text: 'Tamam', onPress: () => router.push('/auth/login') }]
                    );
                }
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.message === 'TIMEOUT') {
                Alert.alert('Bağlantı Zaman Aşımı', 'Sunucuya bağlanılamadı. Lütfen ağ bağlantınızı kontrol edin.');
            } else {
                Alert.alert('Hata', 'Kayıt olurken beklenmeyen bir sorun oluştu.');
            }
        }
    };

    return (
        <ScreenLayout className="bg-[#F8FAFC]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
                >
                    {/* Başlık Alanı */}
                    <View className="mb-10 mt-6">
                        <View className="bg-blue-100 w-16 h-16 rounded-2xl items-center justify-center mb-6">
                            <UserPlus size={32} color="#2563eb" />
                        </View>
                        <Text className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                            Aramıza Katıl
                        </Text>
                        <Text className="text-slate-500 text-base">
                            Ehliyetini ilk sınavda almak için hemen ücretsiz hesap oluştur.
                        </Text>
                    </View>

                    {/* Form Alanı */}
                    <View className="gap-y-4">
                        {/* Ad Soyad Input */}
                        <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 h-14 shadow-sm">
                            <User size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 text-base"
                                placeholder="Ad Soyad"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="words"
                                value={fullName}
                                onChangeText={setFullName}
                                editable={!isLoading}
                            />
                        </View>

                        {/* E-posta Input */}
                        <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 h-14 shadow-sm">
                            <Mail size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 text-base"
                                placeholder="E-posta adresin"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Şifre Input */}
                        <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 h-14 shadow-sm">
                            <Lock size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 text-base"
                                placeholder="Şifre (En az 6 karakter)"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    {/* Kayıt Ol Butonu */}
                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={isLoading}
                        className={`mt-8 h-14 rounded-2xl items-center justify-center flex-row shadow-sm ${isLoading ? 'bg-blue-400' : 'bg-blue-600'
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Hesap Oluştur</Text>
                        )}
                    </TouchableOpacity>

                    {/* Giriş Yap Yönlendirmesi */}
                    <View className="flex-row justify-center mt-8">
                        <Text className="text-slate-500">Zaten hesabın var mı? </Text>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text className="text-blue-600 font-bold">Giriş Yap</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenLayout>
    );
}