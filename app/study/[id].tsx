import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
    ChevronLeft, Search, Info, TriangleAlert, 
    Gauge, BookOpen, Clock, ChevronRight, Zap
} from 'lucide-react-native';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- MOCK DATA ---
const STUDY_CONTENT: any = {
    signs: {
        title: 'Trafik İşaretleri',
        subtitle: 'Görsel Eğitici',
        description: 'Trafikte güvenliğiniz için tüm işaretlerin anlamlarını öğrenin.',
        categories: ['Hepsi', 'Tehlike', 'Düzenleme', 'Bilgi'],
        items: [
            { id: 1, title: 'Dur', category: 'Düzenleme', desc: 'Kavşaklarda durup yolu kontrol etmeniz gerektiğini bildirir.', color: '#ef4444' },
            { id: 2, title: 'Yol Ver', category: 'Düzenleme', desc: 'Ana yoldan gelen araçlara öncelik tanımanız gerektiğini bildirir.', color: '#ef4444' },
            { id: 3, title: 'Kaygan Yol', category: 'Tehlike', desc: 'Yağışlı havalarda yolun kayganlaşabileceğini bildirir.', color: '#f59e0b' },
            { id: 4, title: 'Yaya Geçidi', category: 'Bilgi', desc: 'Yayalara öncelik verilmesi gereken resmi geçit.', color: '#3b82f6' },
            { id: 5, title: 'Okul Geçidi', category: 'Tehlike', desc: 'Hızın düşürülmesi gereken okul çevresi.', color: '#f59e0b' },
            { id: 6, title: 'Park Yeri', category: 'Bilgi', desc: 'Araçların park edilebileceği alanı gösterir.', color: '#3b82f6' },
        ]
    },
    dashboard: {
        title: 'Gösterge Paneli',
        subtitle: 'İkaz Lambaları',
        description: 'Aracınızın size ne söylemek istediğini anında anlayın.',
        categories: ['Hepsi', 'Kritik', 'Uyarı', 'Sistem'],
        items: [
            { id: 1, title: 'Motor Arıza', category: 'Kritik', desc: 'Motorunuzda ciddi bir hata var. En yakın servise gidin.', color: '#ef4444' },
            { id: 2, title: 'Düşük Yağ', category: 'Kritik', desc: 'Yağ seviyesi tehlikeli derecede düşük. Motoru durdurun.', color: '#ef4444' },
            { id: 3, title: 'ABS Fren', category: 'Uyarı', desc: 'ABS sisteminde bir sorun algılandı. Frenleri kontrol edin.', color: '#f59e0b' },
            { id: 4, title: 'Düşük Yakıt', category: 'Sistem', desc: 'Yakıtınız bitmek üzere. En yakın istasyona uğrayın.', color: '#f59e0b' },
        ]
    },
    notes: {
        title: 'Ders Notları',
        subtitle: 'Özet Anlatım',
        description: 'En karmaşık konuları basitleştirilmiş özetlerle hızlıca öğrenin.',
        categories: ['Hepsi', 'Trafik', 'İlk Yardım', 'Motor'],
        items: [
            { id: 1, title: 'Geçiş Üstünlüğü', category: 'Trafik', desc: 'Kavşaklarda hangi aracın önce geçmesi gerektiğini anlatan rehber.', color: '#3b82f6' },
            { id: 2, title: 'Temel Yaşam Desteği', category: 'İlk Yardım', desc: 'Acil durumlarda yapılması gereken hayat kurtarıcı müdahaleler.', color: '#ef4444' },
            { id: 3, title: 'Motor Soğutma Sistemi', category: 'Motor', desc: 'Motorun aşırı ısınmasını önleyen parçalar ve çalışma prensibi.', color: '#f59e0b' },
        ]
    }
};

export default function StudyDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Hepsi');
    const [searchQuery, setSearchQuery] = useState('');

    const content = STUDY_CONTENT[id as string] || STUDY_CONTENT.signs;

    const filteredItems = useMemo(() => {
        return content.items.filter((item: any) => {
            const matchesTab = activeTab === 'Hepsi' || item.category === activeTab;
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [id, activeTab, searchQuery]);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <ScreenLayout className="bg-white">

            <StatusBar barStyle="dark-content" />

            {/* Premium Header */}
            <View className="px-6 pt-12 pb-6 bg-slate-900 rounded-b-[40px] shadow-2xl shadow-slate-300">
                <View className="flex-row justify-between items-center mb-8">
                    <TouchableOpacity onPress={handleBack} className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View className="bg-blue-600 px-4 py-1.5 rounded-full border border-blue-400/30">
                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Çalışma Modu</Text>
                    </View>
                    <TouchableOpacity className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                        <Info size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="mb-6">
                    <Text className="text-white text-3xl font-black tracking-tight">{content.title}</Text>
                    <Text className="text-slate-400 text-sm mt-2 font-medium leading-5 pr-8">
                        {content.description}
                    </Text>
                </View>

                {/* Categories Tab Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {content.categories.map((cat: string) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTab(cat);
                            }}
                            className={`px-6 py-2.5 rounded-2xl ${activeTab === cat ? 'bg-white shadow-xl' : 'bg-white/10 border border-white/5'}`}
                        >
                            <Text className={`font-black text-[11px] uppercase tracking-widest ${activeTab === cat ? 'text-slate-900' : 'text-white'}`}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List Section */}
            <ScrollView 
                className="flex-1 px-6 pt-8" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-slate-900 font-extrabold text-lg tracking-tight">Kütüphane</Text>
                    <View className="bg-slate-50 px-3 py-1 rounded-lg">
                        <Text className="text-slate-400 text-[10px] font-black uppercase">{filteredItems.length} İçerik</Text>
                    </View>
                </View>

                <View className="gap-4">
                    {filteredItems.map((item: any) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm shadow-slate-100 flex-row items-center"
                        >
                            <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm`} style={{ backgroundColor: `${item.color}15` }}>
                                {id === 'signs' && <TriangleAlert size={28} color={item.color} />}
                                {id === 'dashboard' && <Gauge size={28} color={item.color} />}
                                {id === 'notes' && <BookOpen size={28} color={item.color} />}
                            </View>
                            <View className="flex-1 pr-6">
                                <Text className="text-slate-900 font-black text-base mb-1" numberOfLines={1}>{item.title}</Text>
                                <Text className="text-slate-500 text-xs leading-5" numberOfLines={2}>{item.desc}</Text>
                            </View>
                            <ChevronRight size={18} color="#cbd5e1" />
                        </TouchableOpacity>
                    ))}
                </View>
                
                {filteredItems.length === 0 && (
                    <View className="items-center py-20">
                        <Text className="text-slate-400 font-bold">Aradığınız kriterde içerik bulunamadı.</Text>
                    </View>
                )}
            </ScrollView>
        </ScreenLayout>
    );
}
