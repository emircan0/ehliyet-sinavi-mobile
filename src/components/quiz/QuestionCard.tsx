import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
    question: string;
    options: string[];
    selectedOption: number | null;
    onSelect: (index: number) => void;
}

export const QuestionCard = ({ question, options, selectedOption, onSelect }: Props) => {
    return (
        <View className="px-6 py-4">
            {/* Soru Alanı */}
            <View className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
                <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-8">
                    {question}
                </Text>
            </View>

            {/* Şıklar */}
            <View className="space-y-4">
                {options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    return (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(index * 100).springify()}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => onSelect(index)}
                                className={`p-5 rounded-2xl border flex-row items-center transition-all ${isSelected
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 border ${isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                    }`}>
                                    <Text className={`font-bold text-base ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text className={`flex-1 text-base font-medium leading-6 ${isSelected 
                                    ? 'text-blue-900 dark:text-blue-100' 
                                    : 'text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
};