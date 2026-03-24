import React from 'react';
import { SafeAreaView, View, StatusBar, Platform, ViewStyle, StyleSheet } from 'react-native';
import { cn } from '../utils/cn';

interface ScreenLayoutProps {
    children: React.ReactNode;
    className?: string;
    withScrollView?: boolean; // We might want to pass this prop if we were using a custom ScrollView wrapper here, but for now we'll keep it simple.
    backgroundColor?: string;
    style?: ViewStyle;
}

export const ScreenLayout = ({
    children,
    className,
    style,
    backgroundColor = "bg-[#F8FAFC]",
}: ScreenLayoutProps) => {
    const flattenedStyle = StyleSheet.flatten(style);
    const statusBarColor = (flattenedStyle?.backgroundColor as string) || "#F8FAFC";

    return (
        <SafeAreaView
            className={cn("flex-1", backgroundColor, className)}
            style={style}
        >
            <StatusBar barStyle="dark-content" backgroundColor={statusBarColor} />
            <View className="flex-1 w-full max-w-md mx-auto">
                {children}
            </View>
        </SafeAreaView>
    );
};
