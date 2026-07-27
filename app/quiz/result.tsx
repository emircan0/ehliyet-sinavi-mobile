import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    StyleSheet,
    Animated,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/api/supabase';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { adService } from '../../src/services/adService';
import { useQuizStore } from '../../src/store/useQuizStore';
import { usePremiumAccess } from '../../src/hooks/usePremiumAccess';

const { width, height } = Dimensions.get('window');
const isSmall = height < 700;
const isMedium = height < 820;

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function getTheme(score: number) {
    if (score >= 85) return {
        emoji: '🏆',
        title: 'Mükemmel!',
        sub: 'Sınava hazır olduğunu kanıtladın.',
        accent: '#10b981',
        accent2: '#059669',
        gradColors: ['#ecfdf5', '#d1fae5', '#ffffff'] as const,
        ring: ['#10b981', '#34d399'] as const,
        badgeBg: '#d1fae5',
        badgeText: '#065f46',
        badgeLabel: 'Üstün Başarı',
    };
    if (score >= 70) return {
        emoji: '🎯',
        title: 'Harikasın!',
        sub: 'Bu konuyu iyi kavramışsın, devam et!',
        accent: '#3b82f6',
        accent2: '#2563eb',
        gradColors: ['#eff6ff', '#dbeafe', '#ffffff'] as const,
        ring: ['#3b82f6', '#60a5fa'] as const,
        badgeBg: '#dbeafe',
        badgeText: '#1e3a8a',
        badgeLabel: 'Başarılı',
    };
    return {
        emoji: '💪',
        title: 'Devam Et!',
        sub: 'Her hata seni bir adım öteye taşır.',
        accent: '#f59e0b',
        accent2: '#d97706',
        gradColors: ['#fffbeb', '#fef3c7', '#ffffff'] as const,
        ring: ['#f59e0b', '#fbbf24'] as const,
        badgeBg: '#fef3c7',
        badgeText: '#78350f',
        badgeLabel: 'Gelişim Devam',
    };
}

const RING = Math.min(width * 0.42, 170);
const STROKE = 11;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

interface QuizResult {
    score: number;
    correct_count: number;
    wrong_count: number;
    empty_count?: number;
    total_questions?: number;
}

const parseNumericParam = (value: string | string[] | undefined) => {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (rawValue === undefined || rawValue.trim() === '') return null;

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
};

function ScoreRing({ score, colors }: { score: number; colors: readonly [string, string] }) {
    const dash = CIRC * (1 - score / 100);
    return (
        <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
                <Defs>
                    <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor={colors[0]} />
                        <Stop offset="100%" stopColor={colors[1]} />
                    </SvgGradient>
                </Defs>
                <Circle cx={RING / 2} cy={RING / 2} r={R} stroke="rgba(0,0,0,0.06)" strokeWidth={STROKE} fill="none" />
                <Circle
                    cx={RING / 2} cy={RING / 2} r={R}
                    stroke="url(#ringGrad)"
                    strokeWidth={STROKE}
                    fill="none"
                    strokeDasharray={`${CIRC}`}
                    strokeDashoffset={dash}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={RING / 2}
                    originY={RING / 2}
                />
            </Svg>
        </View>
    );
}

export default function QuizResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        score?: string | string[];
        correct?: string | string[];
        wrong?: string | string[];
        empty?: string | string[];
        total?: string | string[];
    }>();
    const isPremium = useSubscriptionStore(state => state.isPremium);
    const addCredits = useSubscriptionStore(state => state.addCredits);
    const mistakesUnlocked = useQuizStore(state => state.mistakesUnlocked);
    const unlockMistakes = useQuizStore(state => state.unlockMistakes);
    const { checkAccess } = usePremiumAccess();
    
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [displayScore, setDisplayScore] = useState(0);

    const triggerRandomAd = () => {
        const adShown = adService.showRewarded(() => {
            addCredits(3);
            Alert.alert("Tebrikler!", "3 Kredi kazandınız.");
        });
        
        if (!adShown) {
            Alert.alert("Bilgi", "Video reklam henüz yüklenmedi, lütfen birkaç saniye sonra tekrar deneyin.");
        }
    };

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(24)).current;

    const returnHome = () => {
        adService.showInterstitialAtStudyBreak(isPremium);
        router.replace('/(tabs)/');
    };

    useEffect(() => {
        const fetch = async () => {
            const routeResult: QuizResult = {
                score: parseNumericParam(params.score) ?? NaN,
                correct_count: parseNumericParam(params.correct) ?? NaN,
                wrong_count: parseNumericParam(params.wrong) ?? NaN,
                empty_count: parseNumericParam(params.empty) ?? undefined,
                total_questions: parseNumericParam(params.total) ?? undefined,
            };

            if (
                Number.isFinite(routeResult.score) &&
                Number.isFinite(routeResult.correct_count) &&
                Number.isFinite(routeResult.wrong_count)
            ) {
                setResult(routeResult);
                setIsLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('exam_results').select('*').eq('user_id', user.id)
                    .order('created_at', { ascending: false }).limit(1).single();
                if (!error && data) setResult(data);
            }
            setIsLoading(false);
        };
        fetch();
    }, []);

    useEffect(() => {
        if (!result) return;
        const target = result?.score ?? 0;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();

        let frame = 0; const frames = 54;
        const t = setInterval(() => {
            frame++;
            const ease = 1 - Math.pow(1 - frame / frames, 3);
            setDisplayScore(Math.round(lerp(0, target, ease)));
            if (frame >= frames) clearInterval(t);
        }, 16);
        return () => clearInterval(t);
    }, [result]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#334155" />
                <Text style={{ marginTop: 12, color: '#94a3b8', fontSize: 14, fontWeight: '500' }}>Hesaplanıyor...</Text>
            </View>
        );
    }

    if (!result) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <StatusBar barStyle="dark-content" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>Sonuç bulunamadı.</Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/')} style={s.darkBtn}>
                    <Text style={s.darkBtnTxt}>Ana Sayfaya Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const score = result?.score ?? 0;
    const correct = result?.correct_count ?? 0;
    const wrong = result?.wrong_count ?? 0;
    const total = correct + wrong;
    const unanswered = result?.empty_count ?? Math.max(0, (result?.total_questions ?? 50) - total);
    const hitRate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const T = getTheme(score);

    const vg = isSmall ? 10 : isMedium ? 13 : 16;

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StatusBar barStyle="dark-content" />

            {/* ─── HERO ÜSTTÜ: gradient + skor ─── */}
            <LinearGradient colors={T.gradColors} style={s.hero}>
                <SafeAreaView>
                    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingTop: isSmall ? 8 : 16, paddingBottom: isSmall ? 16 : 24 }}>
                        {/* Rozet */}
                        <View style={[s.badge, { backgroundColor: T.badgeBg }]}>
                            <View style={[s.badgeDot, { backgroundColor: T.accent }]} />
                            <Text style={[s.badgeTxt, { color: T.badgeText }]}>{T.badgeLabel}</Text>
                        </View>

                        {/* Emoji + Ring yan yana değil, üst üste */}
                        <Text style={[s.emoji, { fontSize: isSmall ? 38 : 46, marginBottom: isSmall ? 8 : 12 }]}>{T.emoji}</Text>

                        {/* Ring + Skor */}
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <ScoreRing score={score} colors={T.ring} />
                            {/* Skor merkezde ring üstünde */}
                            <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={[s.bigNum, { fontSize: isSmall ? 44 : 52, color: T.accent }]}>{displayScore}</Text>
                                <Text style={s.bigNumSub}>/ 100</Text>
                            </View>
                        </View>

                        {/* Başlık & alt */}
                        <Text style={[s.title, { fontSize: isSmall ? 22 : 26, marginTop: isSmall ? 10 : 14 }]}>{T.title}</Text>
                        <Text style={[s.titleSub, { fontSize: isSmall ? 12 : 13 }]}>{T.sub}</Text>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>

            {/* ─── ALT KART BÖLGESİ ─── */}
            <Animated.View
                style={[
                    s.sheet,
                    { opacity: fadeAnim, transform: [{ translateY: cardSlide }] }
                ]}
            >
                {/* İsabet bilgisi küçük pill */}
                <View style={[s.hitPill, { backgroundColor: T.badgeBg }]}>
                    <Text style={[s.hitPillTxt, { color: T.accent2 }]}>
                        %{hitRate} isabet oranı
                    </Text>
                </View>

                {/* ─ 3 stat kutu ─ */}
                <View style={[s.statsRow, { marginTop: vg }]}>
                    <StatBox label="Doğru" value={correct} color="#10b981" bg="#f0fdf4" brd="#bbf7d0" />
                    <View style={s.statSep} />
                    <StatBox label="Yanlış" value={wrong} color="#ef4444" bg="#fef2f2" brd="#fecaca" />
                    <View style={s.statSep} />
                    <StatBox label="Boş" value={unanswered >= 0 ? unanswered : '—'} color="#94a3b8" bg="#f8fafc" brd="#e2e8f0" />
                </View>

                {/* ─ Yatay bar ─ */}
                <View style={[s.barCard, { marginTop: vg }]}>
                    <Text style={s.barLabel}>Dağılım</Text>
                    <View style={s.barTrack}>
                        {correct > 0 && (
                            <View style={[s.barSeg, { flex: correct, backgroundColor: '#10b981', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]} />
                        )}
                        {wrong > 0 && (
                            <View style={[s.barSeg, { flex: wrong, backgroundColor: '#ef4444', borderTopRightRadius: wrong >= 0 && unanswered === 0 ? 8 : 0, borderBottomRightRadius: wrong >= 0 && unanswered === 0 ? 8 : 0 }]} />
                        )}
                        {unanswered > 0 && (
                            <View style={[s.barSeg, { flex: unanswered, backgroundColor: '#e2e8f0', borderTopRightRadius: 8, borderBottomRightRadius: 8 }]} />
                        )}
                    </View>
                    <View style={s.barLegend}>
                        <Text style={s.legendTxt}><Text style={{ color: '#10b981' }}>●</Text> Doğru</Text>
                        <Text style={s.legendTxt}><Text style={{ color: '#ef4444' }}>●</Text> Yanlış</Text>
                        <Text style={s.legendTxt}><Text style={{ color: '#94a3b8' }}>●</Text> Boş</Text>
                    </View>
                </View>

                {/* ─ Butonlar ─ */}
                <View style={[s.btns, { marginTop: 'auto', gap: isSmall ? 8 : 10, paddingBottom: isSmall ? 12 : 20 }]}>
                    {wrong > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                if (isPremium || mistakesUnlocked) {
                                    router.push({ pathname: '/quiz/mistakes', params: { fromResult: 'true' } });
                                } else {
                                    checkAccess({
                                        onSuccess: () => {
                                            unlockMistakes();
                                            router.push({ pathname: '/quiz/mistakes', params: { fromResult: 'true' } });
                                        },
                                        featureName: 'Hataları Tekrar Et',
                                        onAdRequired: triggerRandomAd,
                                        creditCost: 2
                                    });
                                }
                            }}
                            activeOpacity={0.8}
                            style={s.outlineBtn}
                        >
                            <View style={[s.outlineDot, { backgroundColor: '#ef4444' }]} />
                            <Text style={s.outlineBtnTxt}>Hataları Tekrar Et</Text>
                            <View style={s.wrongPill}>
                                <Text style={s.wrongPillTxt}>{wrong}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            returnHome();
                        }}
                        activeOpacity={0.85}
                        style={[s.darkBtn, { height: isSmall ? 52 : 58 }]}
                    >
                        <Text style={s.darkBtnTxt}>Ana Sayfaya Dön</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

function StatBox({ label, value, color, bg, brd }: { label: string; value: any; color: string; bg: string; brd: string }) {
    const isSmallH = height < 700;
    return (
        <View style={[s.statBox, { backgroundColor: bg, borderColor: brd }]}>
            <Text style={[s.statVal, { color, fontSize: isSmallH ? 26 : 30 }]}>{value}</Text>
            <Text style={s.statLbl}>{label}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    hero: {
        paddingHorizontal: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 99,
        marginBottom: 14,
    },
    badgeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    badgeTxt: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    emoji: {
        textAlign: 'center',
    },
    bigNum: {
        fontWeight: '900',
        letterSpacing: -2,
        lineHeight: undefined,
    },
    bigNumSub: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: -2,
    },
    title: {
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    titleSub: {
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 4,
    },
    sheet: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -20,
        paddingHorizontal: 20,
        paddingTop: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 8,
    },
    hitPill: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 99,
    },
    hitPillTxt: {
        fontSize: 13,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1.5,
    },
    statVal: {
        fontWeight: '900',
        letterSpacing: -1,
    },
    statLbl: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 3,
    },
    statSep: {
        // removed — using gap instead
    },
    barCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    barTrack: {
        height: 10,
        borderRadius: 8,
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: '#e2e8f0',
    },
    barSeg: {
        height: '100%',
    },
    barLegend: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 10,
    },
    legendTxt: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    btns: {
        // gap ve paddingBottom dışarıdan
    },
    outlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 18,
        gap: 10,
    },
    outlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    outlineBtnTxt: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    wrongPill: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 99,
    },
    wrongPillTxt: {
        fontSize: 13,
        fontWeight: '800',
        color: '#ef4444',
    },
    darkBtn: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
    },
    darkBtnTxt: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});
