import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react-native';
import { useThemeMode } from '../../hooks/useThemeMode';

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    icon?: LucideIcon;
    isLoading?: boolean;
    textClassName?: string;
    fullWidth?: boolean;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    label,
    icon: Icon,
    isLoading,
    fullWidth,
    className,
    textClassName,
    disabled,
    ...props
}: ButtonProps) => {

    const { isDarkMode, colorScheme } = useThemeMode();

    // Hassas Çizgi ve Modern Radius (Card ile uyumlu)
    const baseStyles = "flex-row items-center justify-center rounded-2xl";

    const variants = {
        // Derinliği olan ama sade bir mavi
        primary: "bg-blue-600 active:bg-blue-700 shadow-sm shadow-blue-900/20",

        // Daha soft, Apple tarzı bir gri yüzey
        secondary: "bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700",

        // Jilet gibi 1px altı (veya çok ince) border
        outline: "border-[1px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800",

        // Tamamen şeffaf, sadece metin odaklı
        ghost: "bg-transparent active:bg-slate-100/50 dark:active:bg-slate-800/50",

        // Gelir modeli için: Siyah/Lacivert lüks görünüm
        premium: "bg-slate-900 active:bg-black shadow-lg shadow-slate-900/20 dark:bg-slate-950 dark:border-[0.5px] dark:border-slate-800",
    };

    const textVariants = {
        primary: "text-white font-semibold",
        secondary: "text-slate-900 dark:text-slate-50 font-semibold",
        outline: "text-slate-700 dark:text-slate-300 font-semibold",
        ghost: "text-slate-500 dark:text-slate-400 font-medium",
        premium: "text-white font-semibold",
    };

    const sizes = {
        sm: "px-3 py-2",
        md: "px-6 py-4", // Biraz daha geniş padding (Luxury feel)
        lg: "px-8 py-5",
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 22,
    };

    // Dinamik Icon Rengi
    const getIconColor = () => {
        if (variant === 'primary' || variant === 'premium') return 'white';
        if (variant === 'secondary') return isDarkMode ? '#f8fafc' : '#0f172a';
        return isDarkMode ? '#94a3b8' : '#64748b';
    };

    return (
        <TouchableOpacity
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth ? "w-full" : "self-start",
                (disabled || isLoading) && "opacity-40",
                className
            )}
            disabled={disabled || isLoading}
            activeOpacity={0.8} // Daha profesyonel geri bildirim
            style={Platform.OS === 'ios' && variant === 'primary' ? {
                shadowColor: "#2563eb",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            } : null}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={getIconColor()} />
            ) : (
                <>
                    {Icon && (
                        <Icon
                            size={iconSizes[size]}
                            color={getIconColor()}
                            strokeWidth={2.5} // Daha belirgin ikonlar
                            className="mr-2.5"
                        />
                    )}
                    <Text
                        className={cn(
                            "tracking-tight", // Karakterler daha sıkı (Premium look)
                            textVariants[variant],
                            size === 'lg' ? 'text-lg' : 'text-[15px]',
                            textClassName
                        )}
                    >
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};