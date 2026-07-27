import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    useColorScheme,
    Animated,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trophy, PlayCircle, Crown, Rocket, BellRing, Check, X } from 'lucide-react-native';

import { supabase } from '../src/api/supabase';
import { scheduleDailyReminder, cancelAllReminders } from '../src/api/notifications';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { analytics } from '../src/services/analytics';

const { width } = Dimensions.get('window');

// ─── Apple-like System Colors ────────────────────────────────────────────────
const COLORS = {
    blue: '#007AFF',
    orange: '#FF9500',
    purple: '#AF52DE',
    green: '#34C759',
    red: '#FF3B30',
    gray: '#8E8E93',
    lightGray: '#E5E5EA',
    darkGray: '#1C1C1E',
    black: '#000000',
    white: '#FFFFFF',
};

// ─── Slide Definitions (Psychology & Persuasion) ─────────────────────────────
const SLIDES = [
    {
        id: 'welcome',
        Icon: Trophy,
        color: COLORS.blue,
        title: 'Ehliyet Sınavı\nGözünü Korkutmasın.',
        description: 'Neye çalışacağını düşünme. Yapay zekamız seni analiz eder, eksiklerini bulur. Sen sadece sınavı geçmeye odaklan.',
    },
    {
        id: 'credits',
        Icon: PlayCircle,
        color: COLORS.orange,
        title: 'Para Ödemek\nZorunda Değilsin.',
        description: 'Kısa bir reklam izle, anında 3 kredi kazan. Bu kredileri kullanarak kilitli denemeleri aç ve yapay zekaya dilediğince soru sor.',
    },
    {
        id: 'premium',
        Icon: Crown,
        color: COLORS.purple,
        title: 'Vaktim Yok\nDiyenlere.',
        description: 'Kredi kazanmakla vakit kaybetmek istemiyorsan Premium tam sana göre. Reklamsız, sınırsız ve beklemeden tüm özelliklere ömür boyu eriş.',
    },
    {
        id: 'ready',
        Icon: Rocket,
        color: COLORS.green,
        title: 'Direksiyona\nGeçme Vakti.',
        description: 'Hadi ilk denemeni çözerek seviyeni görelim. Eksiklerini tespit edip hemen sana özel bir çalışma programı oluşturalım.',
    },
];

const NOTIFICATION_OPTIONS = [
    { label: 'Sabah 09:00', value: '09:00', desc: 'Sabah enerjisiyle zihnini aç' },
    { label: 'Öğle 12:30', value: '12:30', desc: 'Gün ortasında kısa bir tekrar' },
    { label: 'Akşam 20:00', value: '20:00', desc: 'Günü kapatmadan son bir pekiştirme' },
    { label: 'Kendim Hatırlarım', value: 'off', desc: 'Bildirim almak istemiyorum' },
];

// ─── Icon Component ──────────────────────────────────────────────────────────
const GlowingIcon = ({ Icon, color, isDark }: { Icon: any, color: string, isDark: boolean }) => (
    <View style={styles.iconContainer}>
        {/* Soft backdrop glow effect */}
        <View style={[
            styles.glow,
            { backgroundColor: color, opacity: isDark ? 0.15 : 0.08 }
        ]} />
        <View style={[
            styles.squircle,
            {
                backgroundColor: isDark ? `${color}25` : `${color}15`,
                borderColor: isDark ? `${color}40` : `${color}20`,
            }
        ]}>
            <Icon size={48} color={color} strokeWidth={2} />
        </View>
    </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(0);
    const [notifTime, setNotifTime] = useState<string | null>('20:00');
    const [finishing, setFinishing] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const textSlideAnim = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    const isSlides = step < SLIDES.length;
    const isNotifStep = step === SLIDES.length;
    const slide = isSlides ? SLIDES[step] : SLIDES[SLIDES.length - 1];

    useEffect(() => {
        analytics.trackEvent({ eventName: 'onboarding_started' });
        // Initial entrance
        textSlideAnim.setValue(20);
        fadeAnim.setValue(0);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(textSlideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    const transitionTo = useCallback((nextStep: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(textSlideAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            setStep(nextStep);
            textSlideAnim.setValue(20);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(textSlideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
            ]).start();
        });
    }, []);

    const handleNext = () => {
        if (step < SLIDES.length) {
            transitionTo(step + 1);
        }
    };

    const pressIn = () => Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
    const pressOut = () => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

    const handleFinish = async () => {
        if (finishing) return;
        setFinishing(true);

        try {
            await AsyncStorage.setItem('has_completed_onboarding', 'true');
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await supabase.from('profiles')
                    .update({ onboarding_completed: true })
                    .eq('id', session.user.id);
            }
        } catch (_) {}

        try {
            const store = useSettingsStore.getState();
            if (!notifTime || notifTime === 'off') {
                store.setReminderEnabled(false);
                await cancelAllReminders();
            } else {
                const [h, m] = notifTime.split(':').map(Number);
                if (!isNaN(h) && !isNaN(m)) {
                    store.setReminderEnabled(true);
                    store.setReminderTime(h, m);
                    await scheduleDailyReminder(h, m);
                }
            }
        } catch (_) {}

        analytics.trackEvent({ eventName: 'onboarding_completed' });
        router.replace('/(tabs)/');
    };

    const bgColor = isDark ? COLORS.black : COLORS.white;
    const textColor = isDark ? COLORS.white : COLORS.black;
    const subtitleColor = isDark ? '#A1A1A6' : '#8E8E93';

    // ─── Notification Step ───────────────────────────────────────────────────
    if (isNotifStep) {
        return (
            <View style={[styles.root, { backgroundColor: bgColor }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 12 }}>
                        <TouchableOpacity
                            onPress={() => router.replace('/auth/login')}
                            activeOpacity={0.7}
                            style={[styles.closeIconBtn, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
                        >
                            <X size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView 
                        style={{ flex: 1 }}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: textSlideAnim }] }}>
                            
                            <View style={styles.headerArea}>
                                <GlowingIcon Icon={BellRing} color={COLORS.red} isDark={isDark} />
                                <Text style={[styles.title, { color: textColor, marginTop: 32 }]}>
                                    Kazananlar{'\n'}Düzenli Çalışır.
                                </Text>
                                <Text style={[styles.subtitle, { color: subtitleColor }]}>
                                    Günde sadece 15 dakika ayırarak başarı şansını %80 artırabilirsin. Sana ne zaman hatırlatalım?
                                </Text>
                            </View>

                            <View style={[styles.listContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                                {NOTIFICATION_OPTIONS.map((opt, index) => {
                                    const selected = notifTime === opt.value;
                                    const isLast = index === NOTIFICATION_OPTIONS.length - 1;
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => setNotifTime(opt.value)}
                                            activeOpacity={0.7}
                                            style={[
                                                styles.listItem,
                                                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? '#38383A' : '#C6C6C8' }
                                            ]}
                                        >
                                            <View style={styles.listTextContainer}>
                                                <Text style={[
                                                    styles.listLabel, 
                                                    { color: selected ? COLORS.red : textColor }
                                                ]}>
                                                    {opt.label}
                                                </Text>
                                                {opt.desc ? <Text style={[styles.listDesc, { color: subtitleColor }]}>{opt.desc}</Text> : null}
                                            </View>
                                            {selected && <Check size={22} color={COLORS.red} strokeWidth={2.5} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                        </Animated.View>
                    </ScrollView>
                    
                    <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                onPress={handleFinish}
                                onPressIn={pressIn}
                                onPressOut={pressOut}
                                disabled={!notifTime || finishing}
                                activeOpacity={0.8}
                                style={[
                                    styles.button,
                                    { backgroundColor: notifTime ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#38383A' : '#E5E5EA') }
                                ]}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    { color: notifTime ? (isDark ? '#000000' : '#FFFFFF') : (isDark ? '#8E8E93' : '#A1A1A6') }
                                ]}>
                                    {finishing ? 'Hazırlanıyor...' : 'Maceraya Başla'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // ─── Slides ──────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={{ flex: 1 }}>
                
                {/* Modern Segmented Progress Bar + Close Button */}
                <View style={styles.topHeaderRow}>
                    <View style={styles.topBar}>
                        {SLIDES.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.segment,
                                    {
                                        backgroundColor: i <= step ? textColor : (isDark ? '#38383A' : '#E5E5EA'),
                                    }
                                ]}
                            />
                        ))}
                    </View>
                    <TouchableOpacity
                        onPress={() => router.replace('/auth/login')}
                        activeOpacity={0.7}
                        style={[styles.closeIconBtn, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
                    >
                        <X size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentArea}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: textSlideAnim }], flex: 1, justifyContent: 'center' }}>
                        <GlowingIcon Icon={slide.Icon} color={slide.color} isDark={isDark} />
                        
                        <View style={styles.textArea}>
                            <Text style={[styles.title, { color: textColor }]}>
                                {slide.title}
                            </Text>
                            <Text style={[styles.subtitle, { color: subtitleColor }]}>
                                {slide.description}
                            </Text>
                        </View>
                    </Animated.View>
                </View>

                <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                        <TouchableOpacity
                            onPress={handleNext}
                            onPressIn={pressIn}
                            onPressOut={pressOut}
                            activeOpacity={1}
                            style={[styles.button, { backgroundColor: textColor }]}
                        >
                            <Text style={[styles.buttonText, { color: bgColor }]}>
                                {step === SLIDES.length - 1 ? 'Devam Et' : 'Sonraki'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

            </SafeAreaView>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    topHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        gap: 14,
    },
    topBar: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
    },
    closeIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    contentArea: {
        flex: 1,
        paddingHorizontal: 28, // Reduced from 32
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 30, // Reduced from 50
    },
    glow: {
        position: 'absolute',
        width: 120, // Reduced from 140
        height: 120, // Reduced from 140
        borderRadius: 60,
        filter: 'blur(20px)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
    },
    squircle: {
        width: 96, // Reduced from 110
        height: 96, // Reduced from 110
        borderRadius: 28, // Reduced from 32
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textArea: {
        alignItems: 'flex-start',
        width: '100%',
    },
    title: {
        fontSize: 34, // Reduced from 36
        fontWeight: '900',
        letterSpacing: -1.2,
        lineHeight: 40, // Reduced from 44
        marginBottom: 12, // Reduced from 16
    },
    subtitle: {
        fontSize: 17, // Reduced from 18
        fontWeight: '400',
        lineHeight: 24, // Reduced from 26
        letterSpacing: -0.2,
    },
    bottomArea: {
        paddingHorizontal: 24,
        paddingTop: 12, // Reduced from 16
    },
    button: {
        height: 56, // Reduced from 60
        borderRadius: 16, // Reduced from 18
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    // Notification Step
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16, // Reduced from 20
    },
    headerArea: {
        alignItems: 'flex-start',
        marginBottom: 24, // Reduced from 40
    },
    listContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14, // Reduced from 18
        paddingHorizontal: 16, // Reduced from 20
    },
    listTextContainer: {
        flex: 1,
        paddingRight: 12, // Reduced from 16
    },
    listLabel: {
        fontSize: 16, // Reduced from 17
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    listDesc: {
        fontSize: 13, // Reduced from 14
        fontWeight: '400',
        marginTop: 4, // Reduced from 6
        lineHeight: 18, // Reduced from 20
    },
});
