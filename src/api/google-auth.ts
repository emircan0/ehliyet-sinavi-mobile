import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Google Sign-In wrapper that is safe for Expo Go
 */
export const GoogleAuth = {
    configure: (webClientId: string) => {
        if (!isExpoGo) {
            try {
                const { GoogleSignin } = require('@react-native-google-signin/google-signin');
                GoogleSignin.configure({ webClientId });
            } catch (error) {
                console.warn('Google Sign-In configuration failed:', error);
            }
        }
    },
    signIn: async () => {
        if (isExpoGo) {
            throw new Error('Google Sign In is not supported in Expo Go.');
        }
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        return await GoogleSignin.signIn();
    },
    hasPlayServices: async () => {
        if (isExpoGo) return false;
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        return await GoogleSignin.hasPlayServices();
    }
};
