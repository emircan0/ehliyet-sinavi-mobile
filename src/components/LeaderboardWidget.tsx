import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Trophy, ChevronRight, Medal } from 'lucide-react-native';
import { supabase } from '../api/supabase';
import { useThemeMode } from '../hooks/useThemeMode';
import { useAuth } from '../hooks/useAuth';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    average_score?: number;
}

export function LeaderboardWidget() {
    const { isDarkMode } = useThemeMode();
    const { user } = useAuth();
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: result } = await supabase.rpc('get_leaderboard_success_rate', {
                    month_offset: 0
                });
                if (result) setData(result);
            } catch (error) {
                // Hata durumunda sessizce yoksay
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getMedalColor = (index: number) => {
        if (index === 0) return '#fbbf24'; // amber-400
        if (index === 1) return '#cbd5e1'; // slate-300
        if (index === 2) return '#b45309'; // amber-700
        return '#94a3b8';
    };

    if (loading) {
        return (
            <View className="px-6 mb-8">
                <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800 items-center justify-center h-40">
                    <ActivityIndicator size="small" color="#2563eb" />
                </View>
            </View>
        );
    }

    if (data.length === 0) return null;

    const podium = data.slice(0, 3);
    const userIndex = data.findIndex(d => d.user_id === user?.id);
    const userRank = userIndex !== -1 ? userIndex + 1 : null;

    const getMotivationText = () => {
        if (!userRank) return "Sıralamaya girmek için hemen teste başla!";
        if (userRank === 1) return "Harikasın! Liderliği bırakma!";
        if (userRank <= 3) return "Zirveye çok yakınsın, pes etme!";
        if (userRank <= 10) return "İlk 10'dasın! Şampiyonluk için biraz daha gayret!";
        return `Şu an ${userRank}. sıradasın! Yükselmek için devam et!`;
    };

    return (
        <View className="px-6 mb-8">
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/leaderboard')}
                className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none relative overflow-hidden"
            >
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full items-center justify-center mr-3">
                            <Trophy size={16} color="#d97706" />
                        </View>
                        <Text className="text-slate-900 dark:text-white font-black text-[16px]">Liderlik Tablosu</Text>
                    </View>
                    <ChevronRight size={20} color={isDarkMode ? "#cbd5e1" : "#94a3b8"} />
                </View>

                <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 mb-4">
                    {podium.map((entry, index) => {
                        const displayName = entry.full_name || 'İsimsiz Sürücü';
                        const firstName = displayName.split(' ')[0];
                        
                        return (
                            <View key={entry.user_id} className={`flex-row items-center justify-between ${index !== podium.length - 1 ? 'border-b border-slate-200 dark:border-slate-700 pb-2 mb-2' : ''}`}>
                                <View className="flex-row items-center flex-1 pr-2">
                                    <Medal size={16} color={getMedalColor(index)} className="mr-2" />
                                    <Text className={`font-bold text-[13px] ${entry.user_id === user?.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`} numberOfLines={1}>
                                        {firstName}
                                    </Text>
                                </View>
                                <Text className="text-slate-900 dark:text-white font-black text-[14px]">%{(entry.average_score || 0).toString().replace('.0', '')}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Sizin Sıranız */}
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex-row items-center">
                    <View className="w-8 h-8 bg-blue-200 dark:bg-blue-800/50 rounded-full items-center justify-center mr-3">
                        <Text className="text-blue-700 dark:text-blue-300 font-bold text-[12px]">
                            {userRank ? `#${userRank}` : '-'}
                        </Text>
                    </View>
                    <View className="flex-1 pr-2">
                        <Text className="text-slate-900 dark:text-white font-bold text-[13px] mb-0.5">Sizin Sıranız</Text>
                        <Text className="text-blue-600 dark:text-blue-400 text-[11px] font-medium leading-4">{getMotivationText()}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}
