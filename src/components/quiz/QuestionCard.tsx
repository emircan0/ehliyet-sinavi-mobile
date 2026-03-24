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
            <View className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 mb-8">
                <Text className="text-xl font-bold text-slate-800 leading-8">
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
                                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 border ${isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-slate-100 border-slate-200'
                                    }`}>
                                    <Text className={`font-bold text-base ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text className={`flex-1 text-base font-medium leading-6 ${isSelected ? 'text-blue-900' : 'text-slate-600'
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