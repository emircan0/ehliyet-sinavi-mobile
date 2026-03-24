import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import "../global.css";

// Force reload
export default function RootLayout() {
    useNetworkStatus();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: "fade_from_bottom",
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="quiz/[id]" options={{ gestureEnabled: false }} />
                </Stack>
                <Toast />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}