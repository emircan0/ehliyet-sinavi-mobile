import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, RotateCcw } from 'lucide-react-native';
// router will be imported dynamically inside handleReset to avoid navigation-context errors during module init

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Sonraki render'da hata ekranını göster
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    // Import router dynamically to avoid accessing navigation context during module initialization
    (async () => {
      try {
        const { router } = await import('expo-router');
        router.replace('/');
      } catch (e) {
        console.warn('Failed to navigate on reset:', e);
      }
    })();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-900 p-8 rounded-[40px] items-center border border-slate-100 dark:border-slate-800 shadow-2xl">
            <View className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 items-center justify-center rounded-3xl mb-6">
              <ShieldAlert size={40} color="#ef4444" />
            </View>

            <Text className="text-2xl font-black text-slate-900 dark:text-slate-50 text-center mb-4 leading-8">
              Beklenmedik Bir Şey Oldu
            </Text>

            <Text className="text-slate-500 dark:text-slate-400 text-center font-medium leading-6 mb-8 px-2">
              Uygulama çalışırken teknik bir aksaklık yaşandı. Endişelenme, verilerin güvende!
            </Text>

            <TouchableOpacity
              onPress={this.handleReset}
              activeOpacity={0.8}
              className="bg-blue-500 dark:bg-blue-600 px-8 py-4 rounded-2xl flex-row items-center shadow-lg shadow-blue-500/30"
            >
              <RotateCcw size={20} color="white" className="mr-2" />
              <Text className="text-white font-black text-base ml-1">Yeniden Başlat</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
