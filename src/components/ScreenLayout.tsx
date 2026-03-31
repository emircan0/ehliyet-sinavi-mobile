import React from 'react';
import { View, StatusBar, Platform, ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';
import { useColorScheme } from 'nativewind';

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
    backgroundColor = "bg-[#F8FAFC] dark:bg-slate-950",
}: ScreenLayoutProps) => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    
    // Determine status bar color from background
    const flattenedStyle = StyleSheet.flatten(style);
    const statusBarBg = (flattenedStyle?.backgroundColor as string) || (isDarkMode ? "#020617" : "#F8FAFC");

    return (
        <SafeAreaView
            className={cn("flex-1", backgroundColor, className)}
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
