import React from 'react';
import { View, StatusBar, Platform, ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';
import { useThemeMode } from '../hooks/useThemeMode';

interface ScreenLayoutProps {
    children: React.ReactNode;
    className?: string;
    withScrollView?: boolean;
    backgroundColor?: string;
    style?: ViewStyle;
}

export const ScreenLayout = ({
    children,
    className,
    style,
    backgroundColor = "bg-base",
}: ScreenLayoutProps) => {
    const { isDarkMode, colorScheme } = useThemeMode();
    
    // Determine status bar color from theme
    const statusBarBg = isDarkMode ? "#020617" : "#F8FAFC";

    return (
        <SafeAreaView
            className={cn("flex-1", isDarkMode ? "bg-slate-950" : "bg-slate-50", className)}
            style={style}
        >
            <StatusBar 
                barStyle={isDarkMode ? "light-content" : "dark-content"} 
                backgroundColor={statusBarBg} 
                translucent={Platform.OS === 'android'}
            />
            <View className="flex-1 w-full max-w-md mx-auto">
                {children}
            </View>
        </SafeAreaView>
    );
};
