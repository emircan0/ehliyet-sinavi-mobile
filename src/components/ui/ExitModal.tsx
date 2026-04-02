import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Button } from './Button';
import { LogOut, X } from 'lucide-react-native';

interface ExitModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ExitModal = ({ visible, onCancel, onConfirm }: ExitModalProps) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onCancel}
                className="flex-1 bg-black/40 justify-end"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    className="bg-white dark:bg-slate-900 w-full rounded-t-[32px] p-8 pb-10 shadow-2xl"
                >
                    {/* Handle Bar */}
                    <View className="self-center w-12 h-1.5 bg-slate-200 rounded-full mb-8" />

                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                                Sınavı Terk Et?
                            </Text>
                            <Text className="text-slate-500 text-base font-medium leading-relaxed max-w-[280px]">
                                Mevcut ilerlemen kaydedilmeyecek. Çıkmak istediğine emin misin?
                            </Text>
                        </View>
                        <View className="w-12 h-12 bg-red-50 rounded-2xl items-center justify-center">
                            <LogOut size={24} color="#ef4444" strokeWidth={2.5} />
                        </View>
                    </View>

                    <View className="gap-3 mt-6">
                        <Button
                            variant="primary"
                            label="Sınava Devam Et"
                            size="lg"
                            onPress={onCancel}
                            className="w-full bg-slate-900 active:bg-slate-800 border-0 shadow-none"
                        />
                        <Button
                            variant="ghost"
                            label="Evet, Çıkış Yap"
                            size="lg"
                            className="w-full mt-2"
                            textClassName="text-red-600 font-bold"
                            onPress={onConfirm}
                        />
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
