import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, ChevronRight, Award, Zap, Activity } from 'lucide-react-native';

interface MasteryData {
    name: string;
    totalAttempts: number;
    masteryScore: number;
    recentScore: number;
    lastSolved: string;
    trend: 'improving' | 'declining';
    status: 'expert' | 'learning' | 'critical';
}

interface Premiumps {
    data: MasteryData;
    onPress: () => void;
}

export const MasteryCard = ({ data, onPress }: Premiumps) => {
    const isExpert = data.status === 'expert';
    const isCritical = data.status === 'critical';
    
    // Status renk ve ikon ayarları
    const getTheme = () => {
        if (isExpert) return { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/10', icon: Award };
        if (isCritical) return { color: '#ef4444', bg: 'bg-rose-50 dark:bg-rose-900/10', icon: Zap };
        return { color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', icon: Activity };
    };

    const theme = getTheme();
    const ThemeIcon = theme.icon;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm mb-4"
        >
            <View className="flex-row items-center mb-4">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${theme.bg}`}>
                    <ThemeIcon size={24} color={theme.color} />
                </View>
                
                <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-slate-900 dark:text-slate-50 font-black text-base capitalize">
                            {data.name.replace('_', ' ')}
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                            {data.totalAttempts} Soru
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <Text className={`font-black text-lg ${isExpert ? 'text-emerald-500' : isCritical ? 'text-rose-500' : 'text-blue-500'}`}>
                            %{data.masteryScore}
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs font-medium ml-2">Uzmanlık</Text>
                        
                        <View className="flex-row items-center ml-auto">
                            {data.trend === 'improving' ? (
                                <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                                    <TrendingUp size={12} color="#10b981" />
                                    <Text className="text-emerald-600 text-[10px] font-bold ml-1">Yükseliyor</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center bg-rose-500/10 px-2 py-0.5 rounded-lg">
                                    <TrendingDown size={12} color="#ef4444" />
                                    <Text className="text-rose-600 text-[10px] font-bold ml-1">Düşüşte</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* Premiumgress Bar */}
            <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <View
                    className={`h-full ${isExpert ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: `${data.masteryScore}%` }}
                />
            </View>
            
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                <Text className="text-slate-400 text-[11px] font-medium">Son çözülme: {new Date(data.lastSolved).toLocaleDateString('tr-TR')}</Text>
                <View className="flex-row items-center">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs mr-1">Detaylar</Text>
                    <ChevronRight size={14} color="#2563eb" />
                </View>
            </View>
        </TouchableOpacity>
    );
};
