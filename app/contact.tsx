import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Mail, Send } from 'lucide-react-native';
import { ScreenLayout } from '../src/components/ScreenLayout';

export default function ContactScreen() {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        Alert.alert("Başarılı", "Mesajınız iletildi. En kısa sürede döneceğiz.");
        setMessage('');
    };

    return (
        <ScreenLayout className="bg-white dark:bg-slate-950">
            <Stack.Screen options={{ title: 'Bize Ulaşın' }} />

            <ScrollView className="p-6">
                <Text className="text-slate-500 dark:text-slate-400 mb-6 leading-6">
                    Görüşleriniz bizim için değerli. Bir hata mı buldunuz veya öneriniz mi var? Aşağıdan bize yazın.
                </Text>

                <View className="mb-4">
                    <Text className="font-bold text-slate-900 dark:text-white mb-2">Konu</Text>
                    <TextInput
                        placeholder="Örn: Hata Bildirimi"
                        placeholderTextColor="#94a3b8"
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white"
                    />
                </View>

                <View className="mb-8">
                    <Text className="font-bold text-slate-900 dark:text-white mb-2">Mesajınız</Text>
                    <TextInput
                        placeholder="Mesajınızı buraya yazın..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={6}
                        value={message}
                        onChangeText={setMessage}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-32 text-slate-900 dark:text-white"
                        style={{ textAlignVertical: 'top' }}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSend}
                    className="bg-slate-900 dark:bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
                >
                    <Send size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold">Gönder</Text>
                </TouchableOpacity>

                <View className="mt-8 items-center">
                    <View className="flex-row items-center">
                        <Mail size={16} color="#94a3b8" className="mr-2" />
                        <Text className="text-slate-500 dark:text-slate-400">destek@ehliyethocam.com</Text>
                    </View>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
}