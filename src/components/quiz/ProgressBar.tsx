import React from 'react';
import { DimensionValue, View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

interface PremiumgressBarProps extends ViewProps {
    progress: number; // 0 to 1
    color?: string;
}

export function PremiumgressBar({
    progress,
    className,
    color = 'bg-primary',
    ...props
}: PremiumgressBarProps) {
    const widthPercentage = `${Math.min(100, Math.max(0, progress * 100))}%` as DimensionValue;

    return (
        <View
            className={clsx('h-2 bg-gray-200 rounded-full overflow-hidden', className)}
            {...props}
        >
            <View
                className={clsx('h-full rounded-full transition-all duration-300', color)}
                style={{ width: widthPercentage }}
            />
        </View>
    );
}
