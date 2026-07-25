// Türkçe argo, küfür ve uygunsuz kelimeler listesi
// Not: Bu liste kullanıcı deneyimini korumak için tasarlanmıştır.

const BAD_WORDS = [
    'amc', 'yarrak', 'yarak', 'piç', 'o.ç', 'orospu', 'göt', 'sik', 'sürtük',
    'kahpe', 'amk', 'aq', 'amq', 'siktir', 'ibne', 'pezevenk', 'yavşak', 'döl',
    'meme', 'amına', 'sikiş', 'sokuk', 'sokayım', 'kaltak', 'puşt', 'yarrag',
    'şerefsiz', 'ananı', 'sikeyim', 'gavat', 'orosbu', 'fahişe', 'kerhane', 
    'abaza', 'veled', 'veled-i zina', 'sg', 'sgit'
];

/**
 * Verilen metinde küfür veya argo kelime olup olmadığını kontrol eder.
 * @param text Kontrol edilecek metin
 * @returns Küfür içeriyorsa true, içermiyorsa false
 */
export const containsProfanity = (text: string): boolean => {
    if (!text) return false;
    
    const normalizedText = text
        .toLowerCase()
        .replace(/[.,!?@#$%^&*()_+-]/g, '') // Noktalama işaretlerini temizle
        .replace(/1/g, 'i')
        .replace(/0/g, 'o')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/@/g, 'a')
        .trim();

    const words = normalizedText.split(/\s+/);

    return words.some(word => 
        BAD_WORDS.some(badWord => word.includes(badWord))
    );
};
