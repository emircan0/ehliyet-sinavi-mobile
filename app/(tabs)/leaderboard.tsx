import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, ActivityIndicator, Image, Platform, useColorScheme, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Trophy, Medal, Star, Flame, Crown } from 'lucide-react-native';
import { supabase } from '../../src/api/supabase';
import { useAuth } from '../../src/hooks/useAuth';

type LeaderboardType = 'success' | 'activity';
type MonthOffset = 0 | 1; // 0 = Bu Ay, 1 = Geçen Ay

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    average_score?: number;
    exams_completed?: number;
    total_solved?: number;
}

export default function LeaderboardScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    
    // TabBar yüksekliğini hesaba katıyoruz (60 + bottomInset)
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
    const tabBarHeight = 60 + bottomInset;
    
    const [type, setType] = useState<LeaderboardType>('success');
    const [monthOffset, setMonthOffset] = useState<MonthOffset>(0);
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [type, monthOffset]);

    const loadData = async () => {
        setLoading(true);
        try {
            const functionName = type === 'success' ? 'get_leaderboard_success_rate' : 'get_leaderboard_activity';
            
            const { data: result, error } = await supabase.rpc(functionName, {
                month_offset: monthOffset
            });

            if (error) {
                console.error("Leaderboard fetch error:", error);
            } else {
                setData(result || []);
            }
        } catch (error) {
            console.error("Unexpected error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };


    // Podyumdaki kullanıcılar (ilk 3)
    const podium = data.slice(0, 3);
    // Listedeki kullanıcılar (4. ve sonrası)
    const list = data.slice(3);

    // Kullanıcının kendi sırası
    const userIndex = data.findIndex(d => d.user_id === user?.id);
    const userRank = userIndex !== -1 ? userIndex + 1 : null;
    const userEntry = userIndex !== -1 ? data[userIndex] : null;

    const getUserRankMessage = (rank: number | null) => {
        if (!rank) return "Test çöz, sıralamaya gir!";
        if (rank === 1) return "Lidersin! Zirveyi bırakma 🏆";
        if (rank <= 3) return `${rank}. sıradasın, zirveye az kaldı 🚀`;
        if (rank <= 10) return `İlk 10'dasın! Podyuma çık 🔥`;
        return `Yukarı çık, ${rank - 1} kişiyi geç! 💪`;
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#0f172a]" edges={['top', 'bottom']}>
            
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-center">
                <Text className="text-lg font-black text-slate-900 dark:text-white">Liderlik Tablosu</Text>
            </View>

            {/* Ay Seçimi (Segmented) */}
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                <View style={{ backgroundColor: isDarkMode ? 'rgba(30,41,59,0.5)' : 'rgba(226,232,240,0.5)', padding: 4, borderRadius: 12, flexDirection: 'row' }}>
                    <Pressable
                        onPress={() => setMonthOffset(0)}
                        style={[{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, monthOffset === 0 ? { backgroundColor: isDarkMode ? '#334155' : '#ffffff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}]}
                    >
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: monthOffset === 0 ? (isDarkMode ? '#ffffff' : '#0f172a') : (isDarkMode ? '#64748b' : '#64748b') }}>Bu Ay</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setMonthOffset(1)}
                        style={[{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, monthOffset === 1 ? { backgroundColor: isDarkMode ? '#334155' : '#ffffff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}]}
                    >
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: monthOffset === 1 ? (isDarkMode ? '#ffffff' : '#0f172a') : (isDarkMode ? '#64748b' : '#64748b') }}>Geçen Ay</Text>
                    </Pressable>
                </View>
            </View>

            {/* Tür Seçimi (Segmented) */}
            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                        onPress={() => setType('success')}
                        style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: type === 'success' ? '#2563eb' : (isDarkMode ? '#1e293b' : '#ffffff'), borderColor: type === 'success' ? '#2563eb' : (isDarkMode ? '#334155' : '#e2e8f0') }}
                    >
                        <Star size={16} color={type === 'success' ? 'white' : (isDarkMode ? '#94a3b8' : '#64748b')} style={{ marginRight: 6 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: type === 'success' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#475569') }}>Başarı Oranı</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setType('activity')}
                        style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: type === 'activity' ? '#f97316' : (isDarkMode ? '#1e293b' : '#ffffff'), borderColor: type === 'activity' ? '#f97316' : (isDarkMode ? '#334155' : '#e2e8f0') }}
                    >
                        <Flame size={16} color={type === 'activity' ? 'white' : (isDarkMode ? '#94a3b8' : '#64748b')} style={{ marginRight: 6 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: type === 'activity' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#475569') }}>En Çok Çözenler</Text>
                    </Pressable>
                </View>
            </View>

            {/* Açıklama Metni */}
            <View className="px-6 mb-6 mt-3">
                <Text className="text-center text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-4 px-4">
                    {type === 'success' 
                        ? 'En az 50 soruluk bir sınav bitirenler arasında, 50+ soruluk sınavların başarı ortalamasına göre sıralanmıştır.' 
                        : 'Bu ay içerisinde boş bırakılmayan (doğru veya yanlış cevaplanan) toplam soru sayısına göre sıralanmıştır.'}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + 75, flexGrow: 1 }}>
                {loading ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : data.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8 py-20">
                        <Trophy size={48} color={isDarkMode ? '#334155' : '#cbd5e1'} />
                        <Text className="text-slate-400 dark:text-slate-500 mt-4 font-bold text-center">Bu ay henüz yeterli veri yok. Sıralamaya giren ilk kişi sen ol!</Text>
                    </View>
                ) : (
                    <>
                        {/* Podyum */}
                        {podium.length > 0 && (
                            <View className="flex-row items-end justify-center px-4 mb-8 mt-4 h-48">
                                {/* İkincilik */}
                                {podium[1] && (
                                    <View className="items-center flex-1 z-10">
                                        <View className="relative mb-2">
                                            <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 items-center justify-center overflow-hidden">
                                                {podium[1].avatar_url ? (
                                                    <Image source={{ uri: podium[1].avatar_url }} className="w-full h-full" />
                                                ) : (
                                                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-lg">{(podium[1].full_name || 'S').charAt(0)}</Text>
                                                )}
                                            </View>
                                            <View className="absolute -bottom-2 -right-1 bg-slate-300 rounded-full p-1 border-2 border-white dark:border-slate-900">
                                                <Text className="text-[9px] font-black text-slate-700">#2</Text>
                                            </View>
                                        </View>
                                        <Text className="text-slate-700 dark:text-slate-300 font-bold text-[11px] mb-1 text-center" numberOfLines={1}>{(podium[1].full_name || 'Sürücü').split(' ')[0]}</Text>
                                        <Text className="text-blue-600 dark:text-blue-400 font-black text-[14px]">
                                            {type === 'success' ? `%${podium[1].average_score ?? 0}` : (podium[1].total_solved ?? 0)}
                                        </Text>
                                    </View>
                                )}
                                
                                {/* Birincilik */}
                                <View className="items-center flex-1 z-20 -mb-6">
                                    <Crown size={24} color="#fbbf24" fill="#fbbf24" className="mb-1" />
                                    <View className="relative mb-2">
                                        <View className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 items-center justify-center overflow-hidden">
                                            {podium[0].avatar_url ? (
                                                <Image source={{ uri: podium[0].avatar_url }} className="w-full h-full" />
                                            ) : (
                                                <Text className="text-amber-600 dark:text-amber-500 font-bold text-xl">{(podium[0].full_name || 'S').charAt(0)}</Text>
                                            )}
                                        </View>
                                        <View className="absolute -bottom-2 -right-1 bg-amber-400 rounded-full p-1.5 border-2 border-white dark:border-slate-900 shadow-sm">
                                            <Text className="text-[10px] font-black text-amber-900">#1</Text>
                                        </View>
                                    </View>
                                    <Text className="text-slate-900 dark:text-white font-black text-[13px] mb-1 text-center" numberOfLines={1}>{(podium[0].full_name || 'Sürücü').split(' ')[0]}</Text>
                                    <Text className="text-blue-600 dark:text-blue-400 font-black text-[16px]">
                                        {type === 'success' ? `%${podium[0].average_score ?? 0}` : (podium[0].total_solved ?? 0)}
                                    </Text>
                                </View>

                                {/* Üçüncülük */}
                                {podium[2] && (
                                    <View className="items-center flex-1 z-10">
                                        <View className="relative mb-2">
                                            <View className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400/60 items-center justify-center overflow-hidden">
                                                {podium[2].avatar_url ? (
                                                    <Image source={{ uri: podium[2].avatar_url }} className="w-full h-full" />
                                                ) : (
                                                    <Text className="text-orange-700 dark:text-orange-600 font-bold text-lg">{(podium[2].full_name || 'S').charAt(0)}</Text>
                                                )}
                                            </View>
                                            <View className="absolute -bottom-2 -right-1 bg-orange-400/80 rounded-full p-1 border-2 border-white dark:border-slate-900">
                                                <Text className="text-[9px] font-black text-white">#3</Text>
                                            </View>
                                        </View>
                                        <Text className="text-slate-700 dark:text-slate-300 font-bold text-[11px] mb-1 text-center" numberOfLines={1}>{(podium[2].full_name || 'Sürücü').split(' ')[0]}</Text>
                                        <Text className="text-blue-600 dark:text-blue-400 font-black text-[14px]">
                                            {type === 'success' ? `%${podium[2].average_score ?? 0}` : (podium[2].total_solved ?? 0)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Liste */}
                        <View className="px-4">
                            {list.map((entry, index) => {
                                const rank = index + 4; // 4. sıradan başlar
                                const isCurrentUser = entry.user_id === user?.id;

                                return (
                                    <View 
                                        key={entry.user_id} 
                                        className={`flex-row items-center px-3 py-3 mb-1.5 rounded-[16px] ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800'}`}
                                    >
                                        <Text style={{ fontWeight: '900', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#94a3b8', minWidth: 30 }}>#{rank}</Text>
                                        <View className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-2.5 overflow-hidden">
                                            {entry.avatar_url ? (
                                                <Image source={{ uri: entry.avatar_url }} className="w-full h-full" />
                                            ) : (
                                                <Text style={{ fontWeight: '700', fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{(entry.full_name || 'S').charAt(0)}</Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={{ fontWeight: '700', fontSize: 14, color: isCurrentUser ? (isDarkMode ? '#60a5fa' : '#1d4ed8') : (isDarkMode ? '#e2e8f0' : '#1e293b') }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                                                {entry.full_name || 'İsimsiz Sürücü'}{isCurrentUser ? ' (Sen)' : ''}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontWeight: '900', fontSize: 15, color: isCurrentUser ? (isDarkMode ? '#60a5fa' : '#1d4ed8') : (isDarkMode ? '#ffffff' : '#0f172a') }}>
                                                {type === 'success' ? `%${entry.average_score ?? 0}` : (entry.total_solved ?? 0)}
                                            </Text>
                                            <Text style={{ fontWeight: '700', fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                {type === 'success' ? 'BAŞARI' : 'SORU'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Sabit Alt Çubuk - Her zaman göster */}
            <View style={{
                position: 'absolute',
                bottom: tabBarHeight, // Tam TabBar'ın üstünde durmasını sağlar
                left: 0,
                right: 0,
                backgroundColor: isDarkMode ? '#020617' : '#ffffff',
                borderTopWidth: 1.5,
                borderTopColor: isDarkMode ? '#1e293b' : '#cbd5e1',
                paddingTop: 10,
                paddingBottom: 10,
                paddingHorizontal: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 10,
                zIndex: 100,
            }}>
                {loading ? (
                    <View className="flex-row items-center justify-center py-2">
                        <ActivityIndicator size="small" color="#2563eb" />
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <View className="bg-blue-100 dark:bg-blue-900/40 rounded-xl items-center justify-center mr-3" style={{ width: 44, height: 44 }}>
                            <Text className="text-blue-600 dark:text-blue-400 font-black text-[15px]">
                                {userRank ? `#${userRank}` : '—'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-bold text-[13px]" numberOfLines={1}>
                                {userEntry ? (userEntry.full_name || 'Sen') : 'Senin Sıralaman'}
                            </Text>
                            <Text className="text-blue-600 dark:text-blue-400 text-[11px] font-medium" numberOfLines={1}>
                                {getUserRankMessage(userRank)}
                            </Text>
                        </View>
                        {userEntry && (
                            <View className="items-end ml-2">
                                <Text className="font-black text-[17px] text-blue-600 dark:text-blue-400">
                                    {type === 'success' 
                                        ? `%${userEntry.average_score ?? 0}` 
                                        : (userEntry.total_solved ?? 0)}
                                </Text>
                                <Text className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                    {type === 'success' ? 'BAŞARI' : 'SORU'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
