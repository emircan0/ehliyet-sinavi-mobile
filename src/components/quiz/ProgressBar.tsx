import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

interface ProgressBarProps extends ViewProps {
    progress: number; // 0 to 1
    color?: string;
}

export function ProgressBar({
    progress,
    className,
    color = 'bg-primary',
    ...props
}: ProgressBarProps) {
    const widthPercentage = `${Math.min(100, Math.max(0, progress * 100))}%`;

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
