import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { cn } from '../../utils/cn';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends React.ComponentProps<typeof TextInput> {
    label?: string;
    error?: string;
    icon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
    isPassword?: boolean;
}

export const Input = ({
    label,
    error,
    icon: Icon,
    rightIcon: RightIcon,
    onRightIconPress,
    isPassword,
    className,
    ...props
}: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const isSecure = isPassword && !showPassword;

    return (
        <View className="mb-4 w-full">
            {label && (
                <Text className="text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    {label}
                </Text>
            )}
            <View
                className={cn(
                    "flex-row items-center border rounded-xl bg-slate-50 px-4 py-3.5",
                    isFocused ? "border-blue-500 bg-white ring-2 ring-blue-100" : "border-slate-200",
                    error ? "border-red-500 bg-red-50" : "",
                    className
                )}
            >
                {Icon && (
                    <Icon
                        size={20}
                        color={error ? "#ef4444" : isFocused ? "#3b82f6" : "#94a3b8"}
                        className="mr-3"
                    />
                )}
                <TextInput
                    className="flex-1 text-slate-900 text-base"
                    placeholderTextColor="#94a3b8"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    {...props}
                />
                {isPassword ? (
                    <TouchableOpacity onPress={togglePasswordVisibility} className="p-1">
                        {showPassword ? (
                            <EyeOff size={20} color="#94a3b8" />
                        ) : (
                            <Eye size={20} color="#94a3b8" />
                        )}
                    </TouchableOpacity>
                ) : RightIcon ? (
                    <TouchableOpacity onPress={onRightIconPress} className="p-1">
                        <RightIcon size={20} color="#94a3b8" />
                    </TouchableOpacity>
                ) : null}
            </View>
            {error && (
                <Text className="text-xs text-red-500 mt-1 ml-1 font-medium">
                    {error}
                </Text>
            )}
        </View>
    );
};
