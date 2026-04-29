import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

interface Premiumps {
    imageUrl: string | undefined;
}

export const QuestionImage = ({ imageUrl }: Premiumps) => {
    const [isLoading, setIsLoading] = useState(true);

    if (!imageUrl) return null;

    return (
        <View className="w-full h-56 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 mb-6 items-center justify-center">
            {isLoading && (
                <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            )}
            <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
            />
        </View>
    );
};
