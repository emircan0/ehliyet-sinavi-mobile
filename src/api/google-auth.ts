import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Google Sign-In wrapper that is safe for Expo Go
 */
export const GoogleAuth = {
    configure: (webClientId: string, iosClientId?: string) => {
        if (!isExpoGo) {
            try {
                const { GoogleSignin } = require('@react-native-google-signin/google-signin');
                GoogleSignin.configure({
                    scopes: ['email', 'profile', 'openid'],
                    // Doğrudan ID'leri buraya yazıyoruz ki hata payı kalmasın
                    webClientId: '247538031791-bueg0qbqglbo7p9od98lg7glgnfd47m1.apps.googleusercontent.com',
                    iosClientId: '247538031791-tl9ub933k1qp5q351ls1c3ubcru7uufe.apps.googleusercontent.com',
                    offlineAccess: true,
                });
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
        return await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    },
    getStatusCodes: () => {
        if (isExpoGo) return {};
        const { statusCodes } = require('@react-native-google-signin/google-signin');
        return statusCodes;
    }
};
