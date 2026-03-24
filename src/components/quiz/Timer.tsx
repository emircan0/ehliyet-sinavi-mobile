import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { clsx } from 'clsx';
import { Colors } from '../../constants/Colors';

interface TimerProps {
    seconds: number;
    isActive?: boolean;
    onTimeUp?: () => void;
    variant?: 'default' | 'minimal';
}

export function Timer({
    seconds,
    isActive = true,
    onTimeUp,
    variant = 'default',
}: TimerProps) {
    // Format seconds to MM:SS
    const formatTime = (totalSeconds: number) => {
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const isWarning = seconds < 60; // Less than 1 minute
    const isCritical = seconds < 10; // Less than 10 seconds

    return (
        <View
            className={clsx(
                "flex-row items-center",
                variant === 'default' && "bg-gray-100 px-3 py-1.5 rounded-lg"
            )}
        >
            <Clock
                size={variant === 'default' ? 16 : 20}
                color={isCritical ? Colors.error : isWarning ? Colors.warning : Colors.textSecondary}
            />
            <Text
                className={clsx(
                    "ml-2 font-mono font-bold",
                    variant === 'default' ? "text-sm" : "text-lg",
                    isCritical
                        ? "text-red-500"
                        : isWarning
                            ? "text-amber-500"
                            : "text-gray-700"
                )}
            >
                {formatTime(seconds)}
            </Text>
        </View>
    );
}
