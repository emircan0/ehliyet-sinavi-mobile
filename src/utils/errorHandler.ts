import Toast from 'react-native-toast-message';

/**
 * Teknik hata kodlarını kullanıcı dostu Türkçe mesajlara çevirir.
 */
export const getFriendlyErrorMessage = (error: any): string => {
    const message = error?.message || String(error);
    const code = error?.code || '';

    // Ağ Hataları
    if (message.includes('network') || message.includes('fetch')) {
        return 'İnternet bağlantınızda bir sorun var. Lütfen kontrol edin.';
    }

    // Supabase / Veritabanı Hataları
    if (code === '42P01') return 'Sistem şu an meşgul (Tablo bulunamadı). Lütfen az sonra tekrar deneyin.';
    if (code === '23505') return 'Bu kayıt zaten mevcut.';
    
    // Auth Hataları
    if (message.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
    if (message.includes('User already registered')) return 'Bu e-posta adresi zaten kullanımda.';
    if (message.includes('rate limit')) return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.';

    // Varsayılan
    return 'Beklenmedik bir sorun oluştu. Lütfen tekrar deneyin.';
};

/**
 * Hatayı hem konsola basar hem de kullanıcıya Toast olarak gösterir.
 */
export const globalHandleError = (context: string, error: any) => {
    // Geliştirici için teknik log (User'ın isteği üzerine console.error duruyor)
    console.error(`[${context}] Error:`, error);

    const friendlyMessage = getFriendlyErrorMessage(error);

    Toast.show({
        type: 'error',
        text1: 'Bir Sorun Oluştu',
        text2: friendlyMessage,
        position: 'bottom',
        visibilityTime: 4000,
    });
};
