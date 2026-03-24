import React from 'react';
import { View, TouchableOpacity, ViewProps, Platform } from 'react-native';
import { cn } from '../../utils/cn';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'glass' | 'premium';
    onPress?: () => void;
    activeOpacity?: number;
    noPadding?: boolean;
}

export const Card = ({
    variant = 'elevated',
    className,
    children,
    onPress,
    activeOpacity = 0.85, // Daha yumuşak bir tepki
    noPadding = false,
    ...props
}: CardProps) => {

    // Hassas Çizgi Prensibi: 0.5px border ve Slate-200/30 (Çok ince ve hafif)
    const baseStyles = cn(
        "rounded-3xl overflow-hidden", // Daha modern, geniş köşe yarıçapı
        !noPadding && "p-5",
    );

    const variants = {
        // Beyaz yüzey, neredeyse görünmez gölge, keskin border
        elevated: "bg-white border-[0.5px] border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]",

        // Şeffaf arka plan, daha belirgin ama yine de ince çizgi
        outlined: "bg-transparent border-[0.5px] border-slate-300/40",

        // Apple tarzı hafif şeffaf yüzey
        glass: "bg-white/70 border-[0.5px] border-white/40 backdrop-blur-md",

        // Gelir modeli için: Koyu, premium hissi veren kart
        premium: "bg-slate-900 border-[0.5px] border-slate-700/50 shadow-xl shadow-slate-900/20",
    };

    const gradientColors = {
        premium: ['#1e293b', '#0f172a'] as [string, string],
        default: ['#ffffff', '#f8fafc'] as [string, string],
    };

    const Content = (
        <View className={cn(baseStyles, variants[variant], className)} {...props}>
            {variant === 'premium' && (
                <LinearGradient
                    colors={gradientColors.premium}
                    className="absolute inset-0"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}
            {/* İçerik katmanı (Gradient üzerine gelmesi için) */}
            <View className="relative z-10">{children}</View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={activeOpacity}
                onPress={onPress}
                style={Platform.OS === 'ios' ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 12,
                } : { elevation: 2 }}
            >
                {Content}
            </TouchableOpacity>
        );
    }

    return Content;
};