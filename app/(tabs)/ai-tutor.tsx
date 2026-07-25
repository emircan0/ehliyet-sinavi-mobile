import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import {
    BrainCircuit, Target, BookOpen, ChevronRight,
    MessageSquare, Lightbulb, TrendingDown, Lock,
    Zap, Flame, RefreshCw,
    AlertTriangle, CheckCircle2, Clock
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { fetchAdvancedMasteryData } from '../../src/api/queries';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useThemeMode } from '../../src/hooks/useThemeMode';
import { purchaseService } from '../../src/services/purchaseService';
import { MasteryCard } from '../../src/components/quiz/MasteryCard';
import { useAuth } from '../../src/hooks/useAuth';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';

// ─── TYPES ───────────────────────────────────────────────────────────
type MasteryItem = {
    name: string;
    totalAttempts: number;
    masteryScore: number;
    recentScore: number;
    lastSolved: string;
    trend: 'improving' | 'declining';
    status: 'expert' | 'learning' | 'critical';
};

// ─── CONSTANTS ───────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
    trafik: 'Trafik ve Çevre',
    ilkyardim: 'İlk Yardım',
    motor: 'Araç Tekniği',
    adap: 'Trafik Adabı',
};

// ─── AI MESSAGE ──────────────────────────────────────────────────────
function generateAIMessage(data: MasteryItem[]): string {
    if (data.length === 0) {
        return "Birkaç test çözdüğünde sana özel analiz hazırlayacağım. Hadi başlayalım! 🚀";
    }
    const avg = Math.round(data.reduce((s, m) => s + m.masteryScore, 0) / data.length);
    const weakest = data[0];
    const expertCount = data.filter(m => m.status === 'expert').length;
    const criticalCount = data.filter(m => m.status === 'critical').length;
    const declining = data.filter(m => m.trend === 'declining').length;

    if (expertCount === data.length) return `Tüm konularda uzman seviyesindesin! Ortalama %${avg}. Sınav günü tam hazırsın. 🏆`;
    if (criticalCount >= 2) return `"${CATEGORY_LABELS[weakest.name] || weakest.name}" başta ${criticalCount} kritik konu var. Bu konuları kapatırsan geçme şansın büyük ölçüde artar.`;
    if (declining >= 2) return `${declining} konunda düşüş eğilimi seziyorum. Kısa bir tekrar turuyla hemen toparlanabilirsin! 💪`;
    if (weakest.masteryScore < 65) return `"${CATEGORY_LABELS[weakest.name]}" konusun %${weakest.masteryScore}. Hedef %80. Bugün bu konuyu halledelim.`;
    if (avg >= 78) return `Harika gidiyorsun! Ortalaman %${avg}. ${expertCount > 0 ? `${expertCount} konuda uzman seviyesindesin.` : 'Son rötuşları yapalım!'} 📈`;
    return `Ortalaman %${avg}. Hedef %80+. ${CATEGORY_LABELS[weakest.name]} konusuna odaklanarak bunu aşabiliriz.`;
}

// ─── TASK GENERATOR ──────────────────────────────────────────────────
function getTask(data: MasteryItem[], prefs: Record<string, string>) {
    const hour = new Date().getHours();
    const weakest = data[0];

    if (prefs.exam_date === 'urgent') return {
        label: 'Simülasyon', title: 'Tam Sınav Simülasyonu', btnText: 'Simülasyonu Başlat',
        desc: 'Sınav günü yakın! 50 soruluk gerçek sınav modunda kendini test et.',
        route: '/quiz/general', color: '#ea580c', icon: Zap,
    };

    if (weakest && weakest.masteryScore < 60 && weakest.totalAttempts >= 5) return {
        label: 'Kritik Eksik', title: `${CATEGORY_LABELS[weakest.name]}`, btnText: 'Eksikleri Kapat',
        desc: `Bu konuda %${weakest.masteryScore} başarıyla kritik eşiktesin. AI yanlışlarından özel bir set hazırladı.`,
        route: '/quiz/mistakes', color: '#dc2626', icon: TrendingDown,
    };

    const lowData = data.find(m => m.totalAttempts < 5);
    if (lowData) return {
        label: 'Kalibrasyon', title: 'Gerçek Seviyeni Bul', btnText: 'Kalibrasyonu Tamamla',
        desc: `"${CATEGORY_LABELS[lowData.name]}" konusunda ${5 - lowData.totalAttempts} soru daha çözersen analizin hazır olur.`,
        route: `/quiz/${lowData.name}`, color: '#2563eb', icon: Target,
    };

    const declining = data.find(m => m.trend === 'declining' && m.masteryScore > 60);
    if (declining) return {
        label: 'Düşüş Uyarısı', title: `${CATEGORY_LABELS[declining.name]} Geriliyor`, btnText: 'Trendi Durdur',
        desc: `Son sorularda %${declining.masteryScore}→%${declining.recentScore} düşüş var. Hızlı müdahale ile bunu durdurabiliriz.`,
        route: `/quiz/${declining.name}`, color: '#d97706', icon: TrendingDown,
    };

    const oldest = [...data].sort((a, b) => new Date(a.lastSolved).getTime() - new Date(b.lastSolved).getTime())[0];
    if (oldest) {
        const days = Math.floor((Date.now() - new Date(oldest.lastSolved).getTime()) / 86400000);
        if (days >= 3) return {
            label: 'Tekrar Zamanı', title: 'Unutma Eğrisi Aktif', btnText: 'Hafızayı Tazele',
            desc: `"${CATEGORY_LABELS[oldest.name]}" konusunu ${days} gündür açmadın. Ebbinghaus eğrisi devreye girmiş olabilir.`,
            route: `/quiz/${oldest.name}`, color: '#7c3aed', icon: RefreshCw,
        };
    }

    if (hour >= 20) return {
        label: 'Akşam Antrenmanı', title: 'Günü Güçlü Kapat', btnText: 'Akşam Seansı',
        desc: 'Gün bitmeden kısa bir pratik sesi altın değerinde. 10 soruda günü tamamla.',
        route: '/quiz/quick', color: '#7c3aed', icon: Flame,
    };

    return {
        label: 'Günlük Pratik', title: 'Nöral Kondisyon', btnText: 'Antrenmana Başla',
        desc: 'Her şey kontrol altında. Zihnini zinde tutmak için karışık hızlı pratik çözelim.',
        route: '/quiz/quick', color: '#4f46e5', icon: BrainCircuit,
    };
}

// ─── READINESS SCORE ─────────────────────────────────────────────────
function getReadiness(data: MasteryItem[]) {
    if (!data.length) return { score: 0, label: 'Veri Yok', color: '#94a3b8' };
    const avg = data.reduce((s, m) => s + m.masteryScore, 0) / data.length;
    const coverage = Math.min(20, data.length * 5);
    const trend = data.filter(m => m.trend === 'improving').length * 2;
    const score = Math.min(100, Math.round(avg * 0.75 + coverage + trend));
    if (score >= 85) return { score, label: 'Sınava Hazır', color: '#059669' };
    if (score >= 70) return { score, label: 'İyi Seviyede', color: '#2563eb' };
    if (score >= 55) return { score, label: 'Gelişiyor', color: '#d97706' };
    return { score, label: 'Çalışma Gerekli', color: '#dc2626' };
}

// ─── CATEGORY INSIGHT ────────────────────────────────────────────────
function getInsight(item: MasteryItem): string {
    const days = Math.floor((Date.now() - new Date(item.lastSolved).getTime()) / 86400000);
    if (item.status === 'expert') return `${item.totalAttempts} soruda %${item.masteryScore} — bu konuyu kilitlemişsin. ✅`;
    if (item.trend === 'declining') return `Son sorularda %${item.masteryScore}→%${item.recentScore} düşüş. Tekrar zamanı.`;
    if (days >= 4) return `${days} gündür bu konuya dokunmadın. Unutma eğrisi başlamış olabilir.`;
    if (item.status === 'critical') return `Kritik bölgede (%${item.masteryScore}). ${item.trend === 'improving' ? 'Ama yükseliş var, devam et! 📈' : 'Hemen odaklan.'}`;
    return `%${item.masteryScore} — ${item.trend === 'improving' ? 'yükseliş trendinde, devam et! 🚀' : 'biraz daha zorlayabiliriz.'}`;
}

// ─── SPEEDOMETER GAUGE ───────────────────────────────────────────────
function SpeedometerGauge({ score, color, label }: { score: number; color: string; label: string }) {
    const SIZE = 220;
    const cx = SIZE / 2;
    const cy = SIZE / 2 + 16;
    const R = 78;
    const strokeW = 13;
    const needleLen = 64;

    const START_ANGLE = 210;
    const TOTAL_ARC = 240;

    const polarToXY = (angleDeg: number, r: number) => {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const arcPath = (startDeg: number, endDeg: number, r: number) => {
        const s = polarToXY(startDeg, r);
        const e = polarToXY(endDeg, r);
        const large = endDeg - startDeg > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
    };

    const bgPath    = arcPath(START_ANGLE, START_ANGLE + TOTAL_ARC, R);
    const redPath   = arcPath(START_ANGLE, START_ANGLE + TOTAL_ARC * 0.40, R);
    const yelPath   = arcPath(START_ANGLE + TOTAL_ARC * 0.40, START_ANGLE + TOTAL_ARC * 0.70, R);
    const grnPath   = arcPath(START_ANGLE + TOTAL_ARC * 0.70, START_ANGLE + TOTAL_ARC, R);
    const fillPath  = arcPath(START_ANGLE, Math.max(START_ANGLE + 0.5, START_ANGLE + (score / 100) * TOTAL_ARC), R);

    // İğne — üçgen polygon
    const needleAngleDeg = START_ANGLE + (score / 100) * TOTAL_ARC;
    const needleRad = ((needleAngleDeg - 90) * Math.PI) / 180;
    const nx = cx + needleLen * Math.cos(needleRad);
    const ny = cy + needleLen * Math.sin(needleRad);
    const tailLen = 12;
    const tx = cx - tailLen * Math.cos(needleRad);
    const ty = cy - tailLen * Math.sin(needleRad);
    const perpRad = needleRad + Math.PI / 2;
    const hw = 2.8;
    const p1x = cx + hw * Math.cos(perpRad); const p1y = cy + hw * Math.sin(perpRad);
    const p2x = cx - hw * Math.cos(perpRad); const p2y = cy - hw * Math.sin(perpRad);

    // 0 / 50 / 100 etiketleri
    const labels = [
        { val: '0',   pos: polarToXY(START_ANGLE, R + 20) },
        { val: '50',  pos: polarToXY(START_ANGLE + TOTAL_ARC / 2, R + 20) },
        { val: '100', pos: polarToXY(START_ANGLE + TOTAL_ARC, R + 20) },
    ];

    // SVG yüksekliği: yayın alt ortasından hub'a kadar yeterli
    const svgH = cy + 18;

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={SIZE} height={svgH} viewBox={`0 0 ${SIZE} ${svgH}`}>
                {/* Arka plan yayı */}
                <Path d={bgPath} stroke="#f1f5f9" strokeWidth={strokeW} fill="none" strokeLinecap="round" />

                {/* Soluk bölge renkleri */}
                <Path d={redPath}  stroke="#fecaca" strokeWidth={strokeW} fill="none" strokeLinecap="round" />
                <Path d={yelPath}  stroke="#fde68a" strokeWidth={strokeW} fill="none" strokeLinecap="round" />
                <Path d={grnPath}  stroke="#bbf7d0" strokeWidth={strokeW} fill="none" strokeLinecap="round" />

                {/* Canlı değer yayı */}
                <Path d={fillPath} stroke={color} strokeWidth={strokeW} fill="none" strokeLinecap="round" />

                {/* Etiketler */}
                {labels.map(({ val, pos }) => (
                    <SvgText key={val} x={pos.x} y={pos.y + 4}
                        textAnchor="middle" fontSize={9} fontWeight="700" fill="#94a3b8">{val}</SvgText>
                ))}

                {/* İğne gölgesi */}
                <G opacity={0.1}>
                    <Path d={`M ${nx+1} ${ny+1} L ${p1x+1} ${p1y+1} L ${tx+1} ${ty+1} L ${p2x+1} ${p2y+1} Z`} fill="#000" />
                </G>

                {/* İğne (üçgen) */}
                <Path d={`M ${nx} ${ny} L ${p1x} ${p1y} L ${tx} ${ty} L ${p2x} ${p2y} Z`} fill={color} />

                {/* Hub: dış gri halka, ana daire, iç beyaz */}
                <Circle cx={cx} cy={cy} r={13} fill="#e2e8f0" />
                <Circle cx={cx} cy={cy} r={10} fill={color} />
                <Circle cx={cx} cy={cy} r={4} fill="white" />
            </Svg>

            {/* Skor + label — SVG dışında, temiz */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 34, fontWeight: '900', color, lineHeight: 38, letterSpacing: -1 }}>
                    %{score}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginTop: 2,
                    letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {label}
                </Text>
            </View>
        </View>
    );
}

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function AITutorScreen() {
    const router = useRouter();
    const { isPremium, checkSubscriptionStatus } = useSubscriptionStore();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MasteryItem[]>([]);
    const [prefs, setPrefs] = useState<Record<string, string>>({});
    const [isGuest, setIsGuest] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { user, loading: authLoading } = useAuth();
    const { isDarkMode } = useThemeMode();

    useEffect(() => {
        if (authLoading) return;
        (async () => {
            if (user) {
                setIsGuest(false);
                const raw = await fetchAdvancedMasteryData(user.id);
                setData(raw as MasteryItem[]);
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            } else {
                setIsGuest(true);
            }
            const p = await AsyncStorage.getItem('user_preferences');
            if (p) setPrefs(JSON.parse(p));
            setLoading(false);
        })();
    }, [user, authLoading]);

    const openPaywall = async () => {
        const ok = await purchaseService.presentPaywall();
        if (ok) await checkSubscriptionStatus();
    };

    if (loading) return (
        <ScreenLayout className="bg-base justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-slate-400 dark:text-slate-500 font-medium">AI verileri analiz ediyor...</Text>
        </ScreenLayout>
    );

    // ─ Guest screen ─
    if (isGuest) return (
        <ScreenLayout className="bg-base">
            <View className="px-6 pt-4 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">AI Hoca</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sana özel analiz için giriş yap.</Text>
            </View>
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[28px] items-center justify-center mb-5 border border-indigo-100 dark:border-indigo-800">
                    <BrainCircuit size={36} color="#6366f1" />
                </View>
                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">Kişisel AI Hoca</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 leading-6 px-4 text-[14px]">
                    Hesabın olmadan hata analizini yapamıyoruz. Sana özel program çizmemiz için ücretsiz kayıt ol!
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')} className="bg-[#6366f1] w-full py-4 rounded-2xl items-center mb-3">
                    <Text className="text-white font-black text-[16px]">Ücretsiz Kullanmaya Başla</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/auth/login')} className="w-full py-4 rounded-2xl items-center border border-slate-200 dark:border-slate-800">
                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-[15px]">Zaten Hesabım Var</Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );

    const task = getTask(data, prefs);
    const TaskIcon = task.icon;
    const readiness = getReadiness(data);
    const aiMsg = generateAIMessage(data);
    const visibleData = isPremium ? data : data.slice(0, 1);
    const expertCount = data.filter(m => m.status === 'expert').length;
    const criticalCount = data.filter(m => m.status === 'critical').length;

    return (
        <ScreenLayout className="bg-base">
            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 110 }}
            >
                {/* ─── HEADER ─── */}
                <View className="px-6 py-2 flex-row justify-between items-center mt-2 mb-1">
                    <View>
                        <Text className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                            Yapay Zeka
                        </Text>
                        <Text className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                            AI Hoca
                        </Text>
                    </View>
                    <View className="w-11 h-11 bg-indigo-600 rounded-full items-center justify-center border border-indigo-500/50">
                        <BrainCircuit size={22} color="white" />
                    </View>
                </View>

                {/* ─── AI MESAJ KARTI ─── */}
                <View className="px-6 mb-4 mt-3">
                    <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl items-center justify-center mr-2.5 border border-indigo-100/50 dark:border-indigo-500/20">
                                <MessageSquare size={15} color="#6366f1" />
                            </View>
                            <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">Hoca'nın Değerlendirmesi</Text>
                        </View>
                        <Text className="text-slate-700 dark:text-slate-300 text-[14px] font-medium leading-[22px]">{aiMsg}</Text>
                    </View>
                </View>

                {/* ─── HAZIRLIK GÖSTERGESI (SPEEDOMETER) ─── */}
                {data.length > 0 && (
                    <View className="px-6 mb-4">
                        <View className="bg-white dark:bg-slate-900 rounded-[24px] px-5 pt-5 pb-4 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                            <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Genel Hazırlık</Text>
                            <SpeedometerGauge score={readiness.score} color={readiness.color} label={readiness.label} />
                            {/* Mini istatistikler */}
                            <View className="flex-row gap-x-3 mt-3">
                                <View className="bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 items-center flex-1">
                                    <Text className="text-emerald-600 dark:text-emerald-400 text-[18px] font-black">{expertCount}</Text>
                                    <Text className="text-emerald-600/70 dark:text-emerald-400/70 text-[10px] font-bold mt-0.5">Uzman</Text>
                                </View>
                                <View className="bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 rounded-2xl border border-rose-100 dark:border-rose-500/20 items-center flex-1">
                                    <Text className="text-rose-600 dark:text-rose-400 text-[18px] font-black">{criticalCount}</Text>
                                    <Text className="text-rose-600/70 dark:text-rose-400/70 text-[10px] font-bold mt-0.5">Kritik</Text>
                                </View>
                                <View className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 items-center flex-1">
                                    <Text className="text-slate-700 dark:text-slate-300 text-[18px] font-black">{data.length}</Text>
                                    <Text className="text-slate-400 text-[10px] font-bold mt-0.5">Konu</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* ─── GÜNLÜK GÖREV (HERO) ─── */}
                <View className="px-6 mb-4">
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            isPremium ? router.push(task.route as any) : openPaywall();
                        }}
                        className="rounded-[28px] p-6 relative overflow-hidden shadow-xl"
                        style={{ backgroundColor: task.color }}
                    >
                        {/* Arka plan ikonu */}
                        <View className="absolute right-[-10] bottom-[-20] opacity-10 rotate-12">
                            <TaskIcon size={140} color="#ffffff" />
                        </View>

                        <View className="bg-white/20 self-start px-2.5 py-1 rounded-lg mb-4 border border-white/20">
                            <Text className="text-white text-[10px] font-black tracking-widest uppercase">{task.label}</Text>
                        </View>

                        <Text className="text-white text-[24px] font-black tracking-tight mb-1.5">{task.title}</Text>
                        <Text className="text-white/80 text-[13px] font-medium leading-[20px] mb-6">{task.desc}</Text>

                        <View className="bg-white self-start px-5 py-3 rounded-xl flex-row items-center shadow-sm">
                            <Text style={{ color: task.color }} className="font-bold text-[14px] mr-2">
                                {isPremium ? task.btnText : 'Kişisel Görevi Aç'}
                            </Text>
                            <ChevronRight size={16} color={task.color} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ─── KONU ANALİZİ ─── */}
                <View className="px-6 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">Konu Analizi</Text>
                    </View>

                    {visibleData.length > 0 ? (
                        visibleData.map((item, i) => (
                            <View key={i}>
                                <MasteryCard
                                    data={item}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push(`/quiz/${item.name}` as any);
                                    }}
                                />
                                {/* AI yorumu */}
                                <View className="mx-0 mb-3 -mt-1 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-b-[20px] border border-slate-100 dark:border-slate-800 border-t-0">
                                    <View className="flex-row items-start gap-x-2">
                                        <Lightbulb size={11} color={isDarkMode ? '#818cf8' : '#6366f1'} style={{ marginTop: 2 }} />
                                        <Text className="text-slate-500 dark:text-slate-400 text-[11px] leading-[17px] font-medium flex-1">
                                            {getInsight(item)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="bg-white dark:bg-slate-900 p-10 rounded-[24px] items-center border border-dashed border-slate-200 dark:border-slate-800">
                            <Target size={40} color={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                            <Text className="text-slate-400 dark:text-slate-500 text-center font-medium mt-3 text-sm px-4 leading-5">
                                Test çözmeye başlayarak AI Hoca'yı eğitebilirsin!
                            </Text>
                        </View>
                    )}

                    {!isPremium && (
                        <View className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-[24px] border border-amber-100 dark:border-amber-900/40 mt-2">
                            <View className="flex-row items-center mb-2">
                                <Lock size={15} color="#d97706" />
                                <Text className="text-amber-900 dark:text-amber-300 font-black text-[13px] ml-2">Tüm Konuları Gör</Text>
                            </View>
                            <Text className="text-amber-800/70 dark:text-amber-200/70 text-[12px] leading-5 font-medium mb-4">
                                Tüm kategorilerin mastery analizini ve AI yorumlarını görmek için Premium'a geç.
                            </Text>
                            <TouchableOpacity onPress={openPaywall} className="bg-amber-500 py-3 rounded-xl items-center">
                                <Text className="text-amber-950 font-black text-[13px]">Detaylı Analizi Aç</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ─── AI TAVSIYELER ─── */}
                <View className="px-6 mb-4">
                    <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Hoca'nın Tavsiyeleri</Text>

                    {/* Tavsiye 1 */}
                    <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 mb-3 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 bg-violet-50 dark:bg-violet-500/10 rounded-2xl items-center justify-center mr-3 border border-violet-100/50 dark:border-violet-500/20">
                                <Clock size={18} color="#7c3aed" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-200 font-black text-[13px]">Dağıtık Tekrar Tekniği</Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 text-[12px] leading-[19px] font-medium">
                            Günde 2 saatlik maraton yerine 3×20 dakika çalışmak %40 daha etkilidir. Her seansı farklı bir konuyla bitir, öncekini küçük bir tekrarla aç.
                        </Text>
                    </View>

                    {/* Tavsiye 2 — konuya özel */}
                    {data.length > 0 && data[0].masteryScore < 80 && (
                        <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 mb-3 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                            <View className="flex-row items-center mb-3">
                                <View className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-2xl items-center justify-center mr-3 border border-rose-100/50 dark:border-rose-500/20">
                                    <AlertTriangle size={18} color="#dc2626" />
                                </View>
                                <Text className="text-slate-800 dark:text-slate-200 font-black text-[13px]">
                                    {CATEGORY_LABELS[data[0].name]} için Öneri
                                </Text>
                            </View>
                            <Text className="text-slate-500 dark:text-slate-400 text-[12px] leading-[19px] font-medium">
                                {data[0].name === 'trafik' && 'Hız limitleri ve geçiş üstünlüğü (CİPS) en çok hata yapılan konular. Özel Notlar\'daki tablolara odaklan.'}
                                {data[0].name === 'ilkyardim' && 'KBK sırası ve TYD (30:2) kuralı sınavda çok çıkıyor. Özel Notlar\'dan bu iki konuyu mutlaka tekrar et.'}
                                {data[0].name === 'motor' && 'Egzoz duman renkleri, kritik ikaz ışıkları ve güç aktarma sırası en çok yanlış yapılan konular. Kısa ezberle halledilebilir.'}
                                {data[0].name === 'adap' && '"Diğergamlık" ve "dezavantajlı gruplara yaklaşım" konularına odaklan. Sınav bu konulardan çok soru soruyor.'}
                                {!['trafik', 'ilkyardim', 'motor', 'adap'].includes(data[0].name) && 'Hatalı soruları not alarak her gün 5-10 dakika gözden geçir.'}
                            </Text>
                        </View>
                    )}

                    {/* Tavsiye 3 */}
                    <View className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl items-center justify-center mr-3 border border-emerald-100/50 dark:border-emerald-500/20">
                                <CheckCircle2 size={18} color="#059669" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-200 font-black text-[13px]">Altın Kural: %70 Eşiği</Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 text-[12px] leading-[19px] font-medium">
                            Türkiye ehliyet sınavında 50 sorudan en az 35'ini (%70) doğru yapman gerekiyor. Güvenli geçmek için her konuda %80 hedefle.
                        </Text>
                    </View>
                </View>

                {/* ─── GELİŞİM ARAÇLARI ─── */}
                <View className="px-6">
                    <Text className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight mb-3">Gelişim Araçları</Text>
                    <View className="flex-row justify-between">
                        {/* Özel Notlar */}
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                isPremium ? router.push('/notes') : openPaywall();
                            }}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 mr-2 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-2xl items-center justify-center mb-2 relative">
                                <BookOpen size={20} color="#d97706" />
                                {!isPremium && (
                                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-amber-100 dark:bg-amber-900 rounded-full items-center justify-center border border-white dark:border-slate-900">
                                        <Lock size={8} color="#d97706" />
                                    </View>
                                )}
                            </View>
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Notlar</Text>
                        </TouchableOpacity>

                        {/* Nokta Atışı */}
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                isPremium
                                    ? router.push((data.length > 0 ? `/quiz/${data[0].name}` : '/quiz/quick') as any)
                                    : openPaywall();
                            }}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 mr-2 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl items-center justify-center mb-2 relative">
                                <Target size={20} color="#2563eb" />
                                {!isPremium && (
                                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center border border-white dark:border-slate-900">
                                        <Lock size={8} color="#2563eb" />
                                    </View>
                                )}
                            </View>
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nokta Atışı</Text>
                        </TouchableOpacity>

                        {/* Hata Tekrarı */}
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/quiz/mistakes' as any);
                            }}
                            activeOpacity={0.6}
                            className="bg-white dark:bg-slate-900 items-center justify-center py-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex-1 shadow-sm shadow-slate-200/30 dark:shadow-none"
                        >
                            <View className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-2xl items-center justify-center mb-2">
                                <RefreshCw size={20} color="#f43f5e" />
                            </View>
                            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hata Tekrarı</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </Animated.ScrollView>
        </ScreenLayout>
    );
}
