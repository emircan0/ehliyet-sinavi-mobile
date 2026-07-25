import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    StyleSheet,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, HeartPulse, Wrench, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, BookOpen, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORIES = [
    { id: 'trafik', title: 'Trafik & Çevre', icon: FileText, color: '#0ea5e9', gradient: ['#0ea5e9', '#0284c7'] as [string, string], bg: '#e0f2fe' },
    { id: 'ilkyardim', title: 'İlk Yardım', icon: HeartPulse, color: '#ef4444', gradient: ['#ef4444', '#dc2626'] as [string, string], bg: '#fee2e2' },
    { id: 'motor', title: 'Motor & Araç', icon: Wrench, color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] as [string, string], bg: '#fef3c7' },
    { id: 'adap', title: 'Trafik Adabı', icon: ShieldCheck, color: '#10b981', gradient: ['#10b981', '#059669'] as [string, string], bg: '#d1fae5' },
];

type Section = {
    type: 'info' | 'warning' | 'tip' | 'rule' | 'table';
    label?: string;
    items?: string[];
    rows?: string[][];
    headers?: string[];
    text?: string;
};

type Note = {
    title: string;
    summary: string;
    difficulty: 'kolay' | 'orta' | 'zor';
    examFreq: 'sık' | 'nadir' | 'çok sık';
    sections: Section[];
};

const NOTES: Record<string, Note[]> = {
    trafik: [
        {
            title: 'Hız Limitleri',
            summary: 'Farklı araç türleri ve yol tiplerinde uyulması gereken yasal hız sınırları.',
            difficulty: 'kolay',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Araç Türü', 'Şehiriçi', 'Çift Yönlü', 'Bölünmüş', 'Otoyol'],
                    rows: [
                        ['🚗 Otomobil', '50', '90', '110', '130/140'],
                        ['🚌 Otobüs', '50', '80', '90', '100'],
                        ['🚛 Kamyon/Tır', '50', '80', '85', '90'],
                        ['🏍️ Motosiklet', '50', '90', '110', '130'],
                        ['🚜 Traktör', '30', '40', '40', '—'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Dikkat',
                    items: [
                        'Yağmur/kar/sis gibi kötü hava koşullarında limitin yarısına düşürülmesi önerilir.',
                        'Okul bölgelerinde ve çocuk geçişlerinde limit 30 km/s olabilir.',
                        'Trafik işareti varsa işaret geçerlidir, tablo değil.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Otomobil ve otoyol: 130 (bazı otoyollarda 140, işaret varsa geçerli)',
                        '"Bölünmüş yol" ile "otoyol" karıştırılıyor — bölünmüş 110, otoyol 130!',
                    ],
                },
            ],
        },
        {
            title: 'Takip Mesafesi',
            summary: 'Güvenli seyir için öndeki araçla korunması gereken minimum mesafe kuralları.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '📐 Temel Kural',
                    items: [
                        'Hızın yarısı kadar metre — Örnek: 90 km/s → 45 metre, 120 km/s → 60 metre',
                        'Bu "2 Saniye Kuralı" ile de ölçülür: Öndeki araç bir işaretten geçtikten sonra sizin geçiş süreniz en az 2 saniye olmalı.',
                    ],
                },
                {
                    type: 'table',
                    headers: ['Durum', 'Minimum Mesafe'],
                    rows: [
                        ['Normal şartlar', 'Hızın ½\'si (metre)'],
                        ['Tehlikeli madde taşıyan araç', 'Min. 50 metre'],
                        ['Konvoy (kafile) halinde', 'En az 1 araç boyu'],
                        ['Yağmurlu / ıslak yolda', 'Normal mesafenin 2 katı'],
                        ['Karlı / buzlu yolda', 'Normal mesafenin 3-4 katı'],
                        ['Sisli havada', 'En az görüş mesafesi kadar'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Kritik Bilgi',
                    items: [
                        'Takip mesafesi doldurulduğunda sürücü cezalandırılır — sınav sorularında "ehliyete el koyma" değil, para cezası uygulanır.',
                        'Şehiriçinde yavaş trafik varsa mesafeyi duraksama payı olarak tutmak yeterlidir.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"En az kaç metre mesafe bırakılmalıdır?" sorularında hızı 2\'ye bölün.',
                    ],
                },
            ],
        },
        {
            title: 'Geçiş Üstünlüğü (CİPS Kuralı)',
            summary: 'Olağanüstü durumlarda trafik önceliği olan araçların sıralaması ve ne anlama geldiği.',
            difficulty: 'kolay',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'info',
                    label: '🚨 Geçiş Üstünlüğü Sırası',
                    items: [
                        '1. 🚑 C — Cankurtaran (Ambulans)',
                        '2. 🚒 İ — İtfaiye',
                        '3. 🚔 P — Polis / Jandarma / Sahil Güvenlik',
                        '4. 🚧 S — Sivil Savunma + Trafik Hizmetleri',
                    ],
                },
                {
                    type: 'rule',
                    label: '📌 Uygulamada Ne Yapmalısınız?',
                    items: [
                        'Bu araçlar yaklaşınca SAĞ tarafa çekilip durulur.',
                        'Kırmızı ışıkta bile bu araçlar geçiş yapabilir.',
                        'Diğer sürücüler de bu araçlara yol vermek için kırmızı ışıkta ilerleyebilir (dikkatli olmak şartıyla).',
                        'Yol vermemek: Para cezası + trafikten men.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'CİPS = Cankurtaran, İtfaiye, Polis, Sivil Savunma — sırayı ezberleyin!',
                        'Ambulans ile polis birlikte gelse önce ambulans geçer.',
                    ],
                },
            ],
        },
        {
            title: 'Kavşaklarda Geçiş Önceliği',
            summary: 'Işıksız ve işaretsiz kavşaklarda kimin önce geçeceğine dair trafik kuralları.',
            difficulty: 'zor',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'info',
                    label: '📋 Kontrolsüz Kavşak Kuralları (Sırasıyla)',
                    items: [
                        '1. Tali yoldan gelen → Ana yol sürücüsüne yol verir',
                        '2. Dönen araç → Düz gidene yol verir',
                        '3. Motorsuz araç (bisiklet, at arabası) → Motorlu araca yol verir',
                        '4. Her şey eşitse: SAĞDAKİ araç önceliklidir',
                    ],
                },
                {
                    type: 'rule',
                    label: '🔄 Dönel Kavşak (Roundabout)',
                    items: [
                        'İçeride dönen araç her zaman önceliklidir.',
                        'Dışarıdan giren araç içeridekine yol verir.',
                        'Dönel kavşakta sağ şerit çıkış içindir, sol şerit dönüş içindir.',
                    ],
                },
                {
                    type: 'rule',
                    label: '🚆 Demir Yolu Geçitleri',
                    items: [
                        'Tren her zaman önceliklidir — hem bariyerli hem de bariyersiz geçitlerde.',
                        'Hemzemin geçitte kırmızı ışık: Dur, tren geçene dek beklenmeli.',
                        'Bariyersiz geçitten max 10 km/s ile geçilir, sağa-sola bakılır.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"İki araç aynı anda kavşağa geldiğinde..." sorusu = SAĞDAKİ öncelikli.',
                        '"Tali yol – ana yol" sorularında levhaları kontrol edin (üçgen = yol ver, sekizgen = dur).',
                    ],
                },
            ],
        },
        {
            title: 'Alkol, Uyuşturucu ve Cezalar',
            summary: 'Ehliyet sınavında çok sık çıkan alkol promil sınırları ve yaptırımları.',
            difficulty: 'kolay',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Sürücü Tipi', 'Promil Sınırı'],
                    rows: [
                        ['Hususi araç (otomobil)', '0.50 promil'],
                        ['Ticari araç sürücüsü', '0.20 promil'],
                        ['Motosiklet sürücüsü', '0.20 promil'],
                        ['Profesyonel sürücü (şoför)', '0.20 promil'],
                    ],
                },
                {
                    type: 'rule',
                    label: '⚖️ Ehliyete El Koyma Süreleri',
                    items: [
                        '1. ihlal → 6 ay süreyle ehliyete el konulur',
                        '2. ihlal → 2 yıl süreyle ehliyete el konulur',
                        '3. ihlal → 5 yıl + cezai kovuşturma açılır',
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Kritik Bilgiler',
                    items: [
                        'Kaza + Alkol: Sigorta hasar tazminatı ödemez, sürücü kişisel olarak sorumludur.',
                        'Nefes/kan/idrar testi reddedilirse: "Alkollü kabul edilir" ve ceza uygulanır.',
                        'Uyuşturucu madde kullanımı: Her miktarda yasak, ehliyete el konulur.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Hususi araç = 0.50, Ticari/profesyonel = 0.20 — sayıları ezberleyin.',
                        '"Sigortanın tazminat ödemediği" en çok sorulan detaylardan biridir.',
                    ],
                },
            ],
        },
        {
            title: 'Park – Duraklama – Durma Farkı',
            summary: 'Üç kavramın tanımı ve park yasağı olan yerlere ilişkin mesafe kuralları.',
            difficulty: 'orta',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'info',
                    label: '📚 Kavramların Tanımı',
                    items: [
                        '🟢 DURMA: Kırmızı ışık, trafik sıkışıklığı, polis işareti gibi ZORUNLU bekleme. Sürücünün iradesi dışındadır.',
                        '🟡 DURAKLAMA: Yolcu indirip bindirme / yük yükleme amacıyla kısa süre bekleme. Sürücü araçta (başında) olmalıdır. Süre max ~5 dakika.',
                        '🔴 PARK: 5 dakikayı aşan, sürücünün aracı bırakıp uzaklaştığı bekleme hali.',
                    ],
                },
                {
                    type: 'table',
                    headers: ['Yer / Yapı', 'Park Yasağı Mesafesi'],
                    rows: [
                        ['Kavşak köşelerine', '5 metre'],
                        ['Yaya geçidine', '10 metre'],
                        ['Okul kapısına', '15 metre'],
                        ['Durak tabelasına', '15 metre'],
                        ['İtfaiye kapısına', '15 metre'],
                        ['Köprü, tünel, rampa', 'Kesinlikle yasak'],
                        ['Bölünmüş yol ortası', 'Kesinlikle yasak'],
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '5 – 10 – 15 metre sırasını ezberleyin: Kavşak=5, Geçit=10, Okul/Durak=15',
                        '"Sürücü araçta varsa" → duraklama; "ayrılmışsa" → park.',
                    ],
                },
            ],
        },
        {
            title: 'Geçme (Sollama) Kuralları',
            summary: 'Sollama yapılabilecek ve yapılamayacak yerler ile doğru sollama sırası.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '✅ Doğru Sollama Sırası',
                    items: [
                        '1. Sol sinyal ver ve sol dikiz aynasını kontrol et',
                        '2. Sola çek ve geçeceğin aracın soluna geç',
                        '3. Geçtikten sonra sağ sinyal ver, sağa çekil',
                        '4. Geçilen araç arka görüş aynasında küçülmeden şerit değiştirme!',
                    ],
                },
                {
                    type: 'warning',
                    label: '❌ Sollama Yasağı Olan Yerler',
                    items: [
                        'Tepe zirvesi ve eteği (görüş mesafesi azaldığı için)',
                        'Virajlar (karşıdan araç göremezsiniz)',
                        'Yaya geçitleri',
                        'Kavşaklar ve hemzemin geçitler',
                        'Kesik beyaz şerit olmayan (düz çizgili) yollar',
                        'Tünel içleri ve köprüler',
                    ],
                },
                {
                    type: 'rule',
                    label: '📌 Özel Durumlar',
                    items: [
                        'Sağdan geçme: Kesinlikle yasak (acil durum ve şerit sapma hariç).',
                        'Geçilen araç sollamayı engellemek için hızlanırsa: Trafik suçu işliyor, dur ve bekle.',
                        'Motosiklet ve bisiklet sollamada tam araç boyu mesafe zorunlu.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Kesik çizgi = geçme serbest, Düz çizgi = geçme yasak.',
                    ],
                },
            ],
        },
        {
            title: 'Trafik Polisi İşaretleri',
            summary: 'Trafik polisinin el ve fener işaretlerinin anlamları ve nasıl uygulanacağı.',
            difficulty: 'zor',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '🙋 Gündüz Kollarla Yapılan İşaretler',
                    items: [
                        'Kollar yanlara açık (T şekli): Kollara DİK yöndekiler bekler, kolların yönündekiler geçer.',
                        'Bir kol öne uzatılmış: Uzatılan yöndeki araçlar geçebilir; karşı yöndekiler bekler.',
                        'Kol yukarı kaldırılmış: Tüm yönlerden DURUN sinyali.',
                    ],
                },
                {
                    type: 'rule',
                    label: '🔦 Gece Işıklı Fenerle',
                    items: [
                        'Kırmızı ışık yukarı-aşağı sallanıyor → DUR',
                        'Kırmızı ışık sağa-sola sallanıyor → GEÇ',
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Öncelik Sırası',
                    items: [
                        'Trafik polisi işareti > Işık sinyali > Trafik levhası > Yol çizgisi',
                        'Yani polis "geç" diyorsa kırmızı ışık olsa bile geçilir!',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Polis kolu öne uzatmış" sorusunda: Uzatılan yön geçer, diğerleri bekler.',
                        'Polis işaretlerine uymamak ağır para + trafikten men cezasına neden olur.',
                    ],
                },
            ],
        },
        {
            title: 'Trafik İşaret ve Levhalar',
            summary: 'Levha şekillerinin ve renklerinin hangi uyarı türlerine karşılık geldiği.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Renk / Şekil', 'Anlamı', 'Örnek'],
                    rows: [
                        ['🔴 Kırmızı kenarlı/dairesel', 'Yasaklayıcı levha', 'Hız sınırı, Geçme yasağı'],
                        ['⚠️ Sarı/turuncu üçgen', 'Tehlike uyarısı', 'Tehlikeli viraj, Kaygan yol'],
                        ['🔵 Mavi daire', 'Zorunluluk / Talimat', 'Zorunlu şerit, Yavaşla'],
                        ['🔵 Mavi dikdörtgen', 'Bilgi/Servis levhası', 'Dinlenme alanı, Hastane'],
                        ['🟢 Yeşil dikdörtgen', 'Yönlendirme / Yol tarifi', 'Ankara → yön levhası'],
                        ['⬛ Siyah kenarlı', 'Trafik bilgi levhası', 'Tünel uzunluğu'],
                    ],
                },
                {
                    type: 'info',
                    label: '📐 Şekil Kuralı',
                    items: [
                        '🔺 Üçgen levhalar: Her zaman uyarı amaçlı (tehlikeye dikkat)',
                        '⭕ Daire levhalar: Kesin yasak veya kesin emir',
                        '▭ Dikdörtgen levhalar: Bilgilendirme veya yönlendirme',
                        '🛑 Sekizgen (STOP): Tam durma zorunluluğu',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Kırmızı + daire = yasak; Kırmızı + üçgen = tehlike uyarısı.',
                        'Mavi arka plan iki farklı anlam taşır: daire=zorunluluk, dikdörtgen=bilgi.',
                    ],
                },
            ],
        },
        {
            title: 'Reflektör ve Tehlike İkazı',
            summary: 'Arıza veya kaza durumlarında reflektör kullanım kuralları ve 4\'lü flaşör.',
            difficulty: 'kolay',
            examFreq: 'nadir',
            sections: [
                {
                    type: 'info',
                    label: '🔺 Reflektör (Üçgen Uyarı İşareti)',
                    items: [
                        'Araçta bulundurulması ZORUNLU eşyadır (2 adet).',
                        'Gündüz / şehiriçi: Araca 30 metre öne konur.',
                        'Gece veya otoban: 100–150 metre öne konur.',
                        'Yüksek hızlı yollarda görülmesi için erken koyulması hayat kurtarır.',
                    ],
                },
                {
                    type: 'rule',
                    label: '⚡ Tehlike İkazı (4\'lü Flaşör)',
                    items: [
                        'Aniden durmak zorunda kalındığında (kaza, arıza)',
                        'Yüksek hızlı yollarda yavaş geçişlerde',
                        'Motosiklet kafilesi liderlik aracında',
                        'Çok yavaş veya ağır yük taşıyan araçlarda',
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Dikkat',
                    items: [
                        'Flaşör yakılmışsa bile reflektör konulma zorunluluğu devam eder.',
                        'Flaşörü gereksiz yerde yakmak (trafik sıkışıklığında sabit beklerken) kurallara aykırıdır.',
                    ],
                },
            ],
        },
    ],
    ilkyardim: [
        {
            title: 'İlk Yardımın Temel İlkeleri (KBK)',
            summary: 'Olay yerinde yapılması gereken ilk üç temel adım: Koru, Bildir, Kurtar.',
            difficulty: 'kolay',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'info',
                    label: '🔢 KBK = Koru → Bildir → Kurtar',
                    items: [
                        '🛡️ 1. KORU — Olay yerini güvene al\n   • Aracı güvenli mesafeye çek, el frenini çek\n   • Motoru kapat, reflektörleri yerleştir\n   • Elektrik hattı, gaz sızıntısı gibi ikincil tehlikeleri kontrol et\n   • Güvende değilsen içeri girme — kurtarılacak insan artarsa yardım edilemez!',
                        '📞 2. BİLDİR — 112\'yi Ara\n   • Adres ve olay yerini net söyle\n   • Yaralı sayısını ve durumunu belirt\n   • Telefonu kapatma, operatörün talimatlarını dinle',
                        '🏥 3. KURTAR — Bilinçli Müdahale Et\n   • Panik yapma, yaralıyı da panikletme\n   • Sadece eğitim aldığın müdahaleleri yap\n   • Omurga şüphesi varsa kesinlikle hareket ettirme!',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"İlk yapılması gereken nedir?" → Her zaman KORU (güvenliği sağlamak).',
                        'Yaralıyı önce hareket ettirmek değil, ortamı güvene almak doğrudur.',
                    ],
                },
            ],
        },
        {
            title: 'Temel Yaşam Desteği (TYD) – 30:2 Kuralı',
            summary: 'Bilinç ve solunum kaybı olan kişiye uygulanan kalp masajı ve suni solunum tekniği.',
            difficulty: 'orta',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'rule',
                    label: '🔍 Ne Zaman TYD Başlanır?',
                    items: [
                        'Bilinç YOK (sarsınca, seslenince tepki vermiyor)',
                        'Normal solunum YOK (göğüs kalkıp inmiyor, nefes sesi yok)',
                        'Her iki koşul da varsa → HEMEN başla, ambulansı beklemeden!',
                    ],
                },
                {
                    type: 'table',
                    headers: ['Yaş Grubu', 'Masaj', 'Solunum', 'Derinlik', 'Hız'],
                    rows: [
                        ['Yetişkin (>8 yaş)', '30 bası', '2 üfleme', '5–6 cm', '100–120/dk'],
                        ['Çocuk (1–8 yaş)', '30 bası', '2 üfleme', '4–5 cm', '100–120/dk'],
                        ['Bebek (<1 yaş)', '30 bası', '2 üfleme', '4 cm', '100–120/dk'],
                    ],
                },
                {
                    type: 'info',
                    label: '✋ Masaj Tekniği (Yetişkin)',
                    items: [
                        'Kişiyi sert, düz yüzeye sırtüstü yatır.',
                        'Göğüs kemiğinin ALT YARISINA iki el bileşik olarak bastır.',
                        'Her basıda göğüs tamamen 5–6 cm çökmeli, sonra tam açılmalı.',
                        '30 bası sonrası ağzını ağzına kapatıp 2 kez üfle (1 saniye, göğüs yükselene kadar).',
                        'AED (Otomatik Defibrilatör) varsa hemen uygula!',
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Kritik Hatalar',
                    items: [
                        'TYD\'ye ara verme — ambulans gelene kadar dur-ma!',
                        'Göğsün tam açılmasını beklemeden basmak hata!',
                        'Yetişkine tek elle masaj: Yetersiz.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '30 masaj + 2 solunum = 1 döngü.',
                        '"Hangi durumda TYD başlanır?" → Bilinç YOK + Nefes YOK.',
                    ],
                },
            ],
        },
        {
            title: 'Kanama Türleri ve Müdahale',
            summary: 'Atardamar, toplardamar ve kılcal damar kanamalarının özellikleri ile durdurma teknikleri.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Tür', 'Renk', 'Akış', 'Tehlike', 'Müdahale'],
                    rows: [
                        ['Atardamar (Arter)', 'Parlak kırmızı', 'Fışkırır, ritmik', 'En yüksek!', 'Turnike + baskı'],
                        ['Toplardamar (Ven)', 'Koyu kırmızı', 'Süzülür, akıcı', 'Orta', 'Baskı bezi'],
                        ['Kılcal (Kapiller)', 'Koyu kırmızı', 'Sızar, yavaş', 'Düşük', 'Basit pansuman'],
                    ],
                },
                {
                    type: 'info',
                    label: '🩹 Dış Kanamada Baskı Sırası',
                    items: [
                        '1. Temiz bezle doğrudan kanamaya bastır — kaldırma!',
                        '2. Bez ıslanırsa ÜSTÜNE yenisini ekle (eskiyi kaldırmak pıhtıyı bozar)',
                        '3. Kanama durmazsa: Turnike uygula',
                        '4. Turnikenin saatini not et → Her 15–20 dk\'da bir 5–10 saniye gevşet (doku ölümünü önlemek için)',
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ İç Kanama Belirtileri',
                    items: [
                        'Soluk, soğuk, terli cilt',
                        'Hızlı ve zayıf nabız',
                        'Karın sertliği veya şişkinlik',
                        'Şuur bulanıklığı',
                        'Müdahale: YATIR, ısıt, 112\'yi ara — yiyecek/içecek verme!',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Bez kanlıysa ne yapılmalı?" → Kaldırma, üstüne yeni bez ekle.',
                        'Atardamar = Parlak kırmızı + fışkırır = en tehlikeli.',
                    ],
                },
            ],
        },
        {
            title: 'Şok Nedir ve Nasıl Müdahale Edilir?',
            summary: 'Şokun tanımı, belirtileri ve doğru şok pozisyonu uygulaması.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '📖 Şok Nedir?',
                    items: [
                        'Dolaşım sisteminin yetersizliği nedeniyle organların yeterli kan alamamasıdır.',
                        'Neden olabilir: Büyük kanama, yanık, ağır enfeksiyon, kalp krizi, şiddetli alerji.',
                    ],
                },
                {
                    type: 'rule',
                    label: '🔍 Şok Belirtileri',
                    items: [
                        'Bayılmak üzere hissetme, baş dönmesi',
                        'Soğuk, soluk, terli cilt',
                        'Hızlı ve zayıf nabız (dakikada >100)',
                        'Kan basıncı düşüklüğü',
                        'Kaygı, huzursuzluk, bilinç bulanıklığı',
                    ],
                },
                {
                    type: 'info',
                    label: '🛏️ Şok Pozisyonu (Trendelenburg)',
                    items: [
                        '1. Kişiyi SIRTÜSTÜ yatır',
                        '2. AYAKLARI yaklaşık 30 cm YUKARı KALDIR (kalbe kan gitmesi için)',
                        '3. Üstünü ört, ısıt (ısı kaybını önle)',
                        '4. Ağızdan yiyecek/içecek VERME',
                        '5. Sakinleştir, konuştur, 112\'yi bekle',
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Şok Pozisyonu Uygulanmayan Durumlar',
                    items: [
                        'Kafa veya boyun yaralanması şüphesi varsa → UZAT, hareket ettirme',
                        'Solunum güçlüğü varsa → Başını hafif yükselt',
                        'Bacak kırığı şüphesi varsa → Bacağı oynatma, kırığı sabitle sonra bakıver',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Şok pozisyonunda AYAKLAR yüksekte, baş aşağıda.',
                        '"Başını yükselt" cevabı YANLIŞTIR — ayakları yükselt!',
                    ],
                },
            ],
        },
        {
            title: 'Koma Pozisyonu (Yanal Güvenlik Pozisyonu)',
            summary: 'Bilinci kapalı ama solunumu olan kişiye uygulanan güvenlik pozisyonunun nasıl yapıldığı.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'rule',
                    label: '🔍 Ne Zaman Uygulanır?',
                    items: [
                        'Kişinin BİLİNCİ KAPALI (uyarana tepki yok)',
                        'SOLUNUMu VAR (nefes alıyor ama bilinci kapalı)',
                        'Kusma riski var (alkol, zehirlenme, kaza sonrası)',
                    ],
                },
                {
                    type: 'info',
                    label: '📋 Nasıl Yapılır? (Adım Adım)',
                    items: [
                        '1. Kişiyi YANA çevir (sağ veya sol — farketmez)',
                        '2. Altta kalan kolu DÜZGÜN uzat (kolluk işlevi görür)',
                        '3. Üstteki kolu 90° bukle et ve yüzün altına yerleştir (baş desteklenir)',
                        '4. Üstteki bacağı 90° bük, öne at (pozisyonu dengele)',
                        '5. Başı HAFIF GERİYE yatır → hava yolu açık kalır',
                        '6. 112\'yi ara ve dönüp dönmediğini kontrol et',
                    ],
                },
                {
                    type: 'rule',
                    label: '🎯 Bu Pozisyonun Amacı',
                    items: [
                        'Dilin geri düşüp hava yolunu tıkamasını önler.',
                        'Kusma olursa içerik dışarı akar, boğulmayı önler.',
                        'Kişiyi stabil pozisyonda tutar, daha fazla yaralanmayı önler.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Bilinç yok + solunum var → Koma pozisyonu',
                        'Bilinç yok + solunum yok → TYD (30:2)',
                    ],
                },
            ],
        },
        {
            title: 'Yanık Türleri ve Acil Müdahale',
            summary: 'Isı, kimyasal ve elektrik yanıklarının dereceleri ve doğru ilk yardım yaklaşımı.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Derece', 'Görünüm', 'Belirti', 'Müdahale'],
                    rows: [
                        ['1. Derece', 'Kızarıklık', 'Hafif ağrı, yanma', 'Soğuk su 15–20 dk'],
                        ['2. Derece', 'Su toplaması (vezikül)', 'Ağrı, şişlik', 'Soğuk su + temiz örtü, doktora git'],
                        ['3. Derece', 'Siyah/beyaz deri, koku', 'Ağrı yok (sinir hasarı)', '112 ara, steril örtü, suya koyma'],
                    ],
                },
                {
                    type: 'warning',
                    label: '❌ ASLA Yapılmamalı',
                    items: [
                        'Diş macunu, zeytinyağı, yoğurt, tereyağı SÜRME — enfeksiyon riski!',
                        'Su kabarcıklarını patlatma — enfeksiyon kapısı açılır.',
                        'Yanık üstünü pamukla örtme — yapışır, çıkarırken zarar verir.',
                        '3. derece yanıkta soğuk suya uzun süre tutma — hipotermi riski.',
                    ],
                },
                {
                    type: 'info',
                    label: '⚗️ Kimyasal ve Elektrik Yanıkları',
                    items: [
                        '🧪 Kimyasal: Bol akan suyla en az 20 dk yıka. Giysiler çıkarılırken elleri koru.',
                        '⚡ Elektrik: ÖNCE elektriği kes (anahtarı indir/sigortayı at)! İç hasar görünenden çok fazladır, mutlaka hastaneye git.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Yanıkta ilk yapılacak şey?" → Soğuk su (buz değil, akan soğuk su).',
                        '"Diş macunu sürülmeli mi?" → HAYIR.',
                    ],
                },
            ],
        },
        {
            title: 'Kırık, Çıkık, Burkulma',
            summary: 'Üç farklı kas-iskelet yaralanmasının tanımı, farkı ve doğru tespit yöntemi.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Tür', 'Ne Olur?', 'Belirti', 'İlk Yardım'],
                    rows: [
                        ['Burkulma', 'Bağ gerilir/kısmi yırtılır', 'Şişlik, ağrı, eklem hareket eder', 'RICE: Rest, Ice, Compress, Elevate'],
                        ['Çıkık', 'Eklem yüzeyleri ayrılır', 'Şekil bozukluğu, çok ağrılı', 'Atel + ASLA yerine oturtma!'],
                        ['Kırık (kapalı)', 'Kemik kırılır', 'Şişlik, morluk, hareket yok', 'Atel, hareketsiz bırak'],
                        ['Kırık (açık)', 'Kemik deriden çıkmış', 'Yara+kemik görünümü', 'Steril pansuman + atel + 112'],
                    ],
                },
                {
                    type: 'warning',
                    label: '❌ ASLA Yapılmamalı',
                    items: [
                        'Çıkıkta: Eklemi yerine oturtmaya çalışma — damar/sinir kopar!',
                        'Kırıkta: Kırık uzvu çekme veya düzeltme — iç hasar artar.',
                        'Omurga/boyun kırığı şüphesinde: Kişiyi HAReket ettirme (felç riski).',
                        'Açık kırıkta dışarı çıkmış kemiği içeri itme.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Çıkıkta ilk yardım?" → Atel uygula, yerine oturtma.',
                        'Burkulma = RICE kuralı (Rest, Ice, Compression, Elevation).',
                    ],
                },
            ],
        },
        {
            title: 'Zehirlenme Türleri',
            summary: 'Farklı zehirlenme yollarında ve özellikle karbonmonoksit zehirlenmesinde yapılacaklar.',
            difficulty: 'orta',
            examFreq: 'nadir',
            sections: [
                {
                    type: 'table',
                    headers: ['Yol', 'Örnekler', 'İlk Yardım'],
                    rows: [
                        ['Ağız yoluyla', 'Besin, ilaç, temizlik maddesi', '112 ara, kusmaya zorlamayın (asit/alkali ise çok tehlikeli!), ürünü götür'],
                        ['Solunum yoluyla', 'CO gazı, kimyasal duman, egzoz', 'Taze havaya çıkar, 112 ara, solunum yoksa TYD'],
                        ['Deri yoluyla', 'Tarım ilacı, asit', 'Bol suyla yıka, bulaşık kıyafet çıkar'],
                        ['Göze', 'Kimyasal madde', 'Bol suyla yıka (iç köşeden dışa), doktora git'],
                    ],
                },
                {
                    type: 'warning',
                    label: '💨 Karbonmonoksit (CO) Zehirlenmesi',
                    items: [
                        'Renksiz, kokusuz bir gaz — hissedilmeden öldürür!',
                        'Kaynaklar: Kapalı garajda çalışan motor, bozuk soba/şofben, yangın.',
                        'Belirtiler: Baş ağrısı, mide bulantısı, güçsüzlük, bilinç kaybı.',
                        'Müdahale: Ortamı havalandır, kişiyi taze havaya çıkar, 112\'yi ara.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Zehirlenmede "kusturma" → Asit/alkali içildiyse YANLIŞ (yemek borusu yanar).',
                        'CO zehirlenmesinde ilk adım → taze havaya çıkarmak.',
                    ],
                },
            ],
        },
    ],
    motor: [
        {
            title: '4 Zamanlı Motorun Çalışma Prensibi',
            summary: 'İçten yanmalı benzin ve dizel motorların çalışma döngüsünün adım adım açıklaması.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '⚙️ 4 Zaman = 4 Adım',
                    items: [
                        '1. 🌬️ EMME: Piston aşağı iner, silindir hava (veya hava-yakıt karışımı) çeker. Emme supabı açık.',
                        '2. 🗜️ SIKIŞTURMA: Piston yukarı çıkar, karışım sıkıştırılır. Tüm supaplar kapalı.',
                        '3. 💥 ATEŞLEMEve GÜÇ: Benzinlide BUJİ ateşler; Dizelde sıkıştırma ısısıyla yakıt kendiliğinden tutuşur. Piston aşağı iter → güç üretilir.',
                        '4. 💨 EGZOZ: Piston tekrar yukarı çıkar, yanık gazlar dışarı atılır. Egzoz supabı açık.',
                    ],
                },
                {
                    type: 'table',
                    headers: ['Özellik', 'Benzinli Motor', 'Dizel Motor'],
                    rows: [
                        ['Ateşleme Yöntemi', 'Buji (elektrik kıvılcımı)', 'Sıkıştırma ısısı (kendiliğinden)'],
                        ['Yakıt', 'Benzin (hafif)', 'Motorin (ağır)'],
                        ['Sıkıştırma Oranı', '8–12:1 (düşük)', '14–22:1 (yüksek)'],
                        ['Emisyon', 'CO ve HC fazla', 'NOx ve partikül fazla'],
                        ['Verim', 'Daha düşük', 'Daha yüksek'],
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Benzin = buji = dış ateşlemeli | Dizel = sıkıştırma = iç ateşlemeli.',
                        '"Güç üretilen zaman" → 3. zaman (ateşleme/genişleme).',
                    ],
                },
            ],
        },
        {
            title: '3 Kritik Kırmızı İkaz Işığı',
            summary: 'Seyir sırasında yandığında derhal durulması gereken gösterge paneli uyarıları.',
            difficulty: 'kolay',
            examFreq: 'çok sık',
            sections: [
                {
                    type: 'warning',
                    label: '🚨 Bu Işıklar Yandığında Derhal Dur!',
                    items: [
                        '🛢️ 1. YAĞ BASINCI IŞIĞI (Çaydanlık simgesi)\n   Anlamı: Motor yağı basıncı tehlike altında.\n   Risk: Yağ bitmişse motor 1–2 km içinde ağır hasar alır!\n   Yapılacak: Hemen dur, motoru kapat, yağ seviyesini kontrol et.',
                        '🌡️ 2. MOTOR ISISI (Termometre simgesi)\n   Anlamı: Motor aşırı ısındı.\n   Risk: Soğutma suyu azaldıysa silindir kapağı yanar, motor gider.\n   Yapılacak: Güvenli yere çek, motoru kapat. Radyatörü asla sıcakken açma (kaynar su fışkırır!)',
                        '🔋 3. AKÜŞARJ IŞIĞI (Pil simgesi)\n   Anlamı: Alternatör şarj etmiyor.\n   Risk: Tüm elektrik sistemi aküden beslenmeye başlar, birkaç dakika sonra motor durabilir.\n   Yapılacak: Gereksiz tüketicileri kapat, servise yönlen.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Bu 3 ışık = DERHAL DUR kategorisi.',
                        '"Yağ ışığı yandı ne yapmalı?" → Hemen dur, yağ kontrolü yap.',
                    ],
                },
            ],
        },
        {
            title: 'Güç Aktarma Organları',
            summary: 'Motordan tekerleğe kadar uzanan mekanik güç aktarma zincirinin yapısı ve işlevi.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '🔗 Güç Aktarma Zinciri',
                    items: [
                        'Motor → Debriyaj (Kavrama) → Vites Kutusu → Şaft (Kardan Mili) → Diferansiyel → Aks Milleri → Tekerlekler',
                    ],
                },
                {
                    type: 'table',
                    headers: ['Parça', 'Görevi'],
                    rows: [
                        ['Debriyaj (Kavrama)', 'Motor gücünü vites kutusuna iletir veya keser (gaz pedalı gibi ama güç için)'],
                        ['Vites Kutusu', 'Motorun devir sayısını (torku ve hızı) farklı oranlara çevirir'],
                        ['Kardan Mili (Şaft)', 'Vites kutusundan diferansiyele döner hareketi iletir'],
                        ['Diferansiyel', 'Virajda iki arka/ön tekerleğin farklı hızda dönmesini sağlar'],
                        ['Aks Mili', 'Diferansiyelden tekerleğe hareketi iletir'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Önemli Bilgi',
                    items: [
                        '"Yarım debriyaj" (debriyajı yarıya kadar bırakmak) kavramayı aşırı ısıtır ve balataları çabuk bitirir.',
                        'Araç duruyorken vitesi takıp bırakmak için debriyaj tamamen basılmalıdır.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Virajda iki tekerlek neden farklı döner?" → Diferansiyel sayesinde.',
                        'Güç sırasını sırayla ezberleyin: Motor → Debriyaj → Vites → Şaft → Diferansiyel → Aks → Tekerlek.',
                    ],
                },
            ],
        },
        {
            title: 'Soğutma ve Yağlama Sistemi',
            summary: 'Motoru çalışma sıcaklığında tutan soğutma ile aşınmayı önleyen yağlama sistemlerinin işleyişi.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '❄️ Soğutma Sistemi',
                    items: [
                        'Amacı: Motoru 80–90°C aralığında tutmak (çok sıcak da soğuk da zararlı).',
                        '• Radyatör: Soğutma suyundan ısıyı alıp havaya verir.',
                        '• Devirdaim Pompası: Suyu sistemde dolaştırır.',
                        '• Termostat: Motor ısındıkça açılır, soğuk motorla kapalı kalarak ısınmayı hızlandırır.',
                        '• Vantilatör: Radyatörden hava geçişini artırır.',
                        '• Antifriz: Kışın donmayı, yazın kaynamayı önler, pas/korozyona karşı korur. 2 yılda bir değiştirilmeli.',
                    ],
                },
                {
                    type: 'rule',
                    label: '🛢️ Yağlama Sistemi',
                    items: [
                        'Amacı: Hareketli parçaların sürtünmesini azaltmak, aşınmayı önlemek ve ısıyı dağıtmak.',
                        'Yağ kontrolü: Soğuk motorla, düz zeminde yapılır. Çubuk iki çizgi arasında olmalı.',
                        'Min çizgisinin altındaysa: Derhal yağ ekle!',
                        'Mineral yağ: 5.000 km | Yarı sentetik: 10.000 km | Tam sentetik: 15.000–20.000 km değiştirilmeli.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Radyatör kapağı sıcakken açılır mı?" → HAYIR, kaynar su fışkırır.',
                        'Motor yağı kontrolü → soğuk motorla düz zeminde.',
                    ],
                },
            ],
        },
        {
            title: 'Egzoz Dumanı Renkleri ve Anlamları',
            summary: 'Egzozdan çıkan dumanın rengi araçta ne tür bir arıza olduğunu gösterir.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Duman Rengi', 'Anlamı', 'Olası Neden'],
                    rows: [
                        ['🔵 Mavi/Gri Duman', 'Motor yağı yanıyor', 'Piston segmanı veya supap yağ sızdırıyor'],
                        ['⬛ Siyah/Koyu Duman', 'Zengin karışım / hava eksikliği', 'Hava filtresi tıkalı, yakıt enjektörü arızalı'],
                        ['⬜ Beyaz Duman', 'Soğutma suyu yanıyor', 'Silindir kapağı contası patlamış, su silindirlere kaçıyor'],
                        ['💨 İnce beyaz buhar', 'Normal (soğuk hava buharı)', 'Endişe yok, ısınınca geçer'],
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Mavi = yağ yanıyor | Siyah = yakıt fazla | Beyaz (kalın) = su yanıyor.',
                        '"Beyaz duman neden çıkar?" sorusu sınavda çok gelir → Silindir kapağı contası.',
                    ],
                },
            ],
        },
        {
            title: 'Lastikler: Basınç, Aşınma ve Tipleri',
            summary: 'Doğru lastik basıncının önemi, aşınma tipleri ve mevsimlik lastik seçimi.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Durum', 'Aşınma Bölgesi', 'Sonuç'],
                    rows: [
                        ['Az basınç (şişirilmemiş)', 'Lastik kenarları', 'Yüksek yakıt, ısınma, patlama riski'],
                        ['Fazla basınç (aşırı şişirilmiş)', 'Lastik ortası', 'Sert sürüş, kayma, aşırı fren mesafesi'],
                        ['Doğru basınç', 'Dengeli aşınma', 'Optimum performans ve güvenlik'],
                    ],
                },
                {
                    type: 'info',
                    label: '❄️ Mevsimlik Lastik Kuralı',
                    items: [
                        'Kış lastiği zorunluluğu: 1 Aralık – 1 Nisan (dağlık ve karlı bölgelerde)',
                        '+7°C altında kış lastiği daha iyi tutuş sağlar (yaz lastiği sertleşir).',
                        '4 mevsim lastik: Yaz ve kışın ortası performans — uzun mesafe kullanımda yeterli.',
                    ],
                },
                {
                    type: 'rule',
                    label: '⚖️ Balans ve Rot Ayarı',
                    items: [
                        'Balans: Tekerleğin kendi ekseni etrafında titremesi — vibrasyona neden olur.',
                        'Rot: Ön tekerleklerin birbirine paralel açısı — yanlışsa direksiyon çeker ve kenar aşınması olur.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Az basınç → kenar aşınması | Fazla basınç → orta aşınma.',
                        'Kış lastiği zorunluluk tarihleri: 1 Aralık başlar, 1 Nisan biter.',
                    ],
                },
            ],
        },
        {
            title: 'Fren Sistemleri',
            summary: 'Araçlardaki farklı fren türleri, ABS sistemi ve doğru fren tekniği.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Fren Türü', 'Çalışma Prensibi', 'Özellik'],
                    rows: [
                        ['Servis Freni (Pedal)', 'Hidrolik baskıyla 4 tekerlekten eş zamanlı', 'Ana frenleme sistemi'],
                        ['El / Park Freni', 'Mekanik, arka tekerleklere', 'Dururken araç kıpırdamasın diye'],
                        ['Motor Freni', 'Düşük viteste hızı azaltma', 'Yüzde yüksek iniş, yakıt tasarrufu'],
                        ['ABS', 'Frende tekerlek kilitlenmesini önler', 'Direksiyon hakimiyeti korunur'],
                        ['ESP/ESC', 'Elektron. denge; kayma önleme', 'Ani manevralarda devrilmeyi önler'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Önemli Bilgiler',
                    items: [
                        'ABS olan araçta kaymada pedalı bırakmayın — sürekli basılı tutun, ABS halleder.',
                        'El freni çekili ilerlemek: Arka balataları yakar, freni bozar.',
                        'Islak yolda ani tam fren: ABS yoksa tekerlek kilitlenir ve kayılır.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'ABS\'in amacı: Tekerleği kilitlemez → yön kontrolü sağlar.',
                        '"El freni hangi tekerleklere etki eder?" → Arka tekerlekler.',
                    ],
                },
            ],
        },
        {
            title: 'Periyodik Araç Bakımı',
            summary: 'Araçta düzenli yapılması gereken bakım işlemleri ve kilometre aralıkları.',
            difficulty: 'kolay',
            examFreq: 'nadir',
            sections: [
                {
                    type: 'table',
                    headers: ['Bakım', 'Aralık'],
                    rows: [
                        ['Motor yağı + filtre', '5.000–15.000 km (yağ tipine göre)'],
                        ['Hava filtresi', '15.000–20.000 km'],
                        ['Yakıt filtresi', '30.000–60.000 km'],
                        ['Triger (Dağıtım) kayışı', '80.000–120.000 km — kritik!'],
                        ['Fren balataları', '30.000–40.000 km (önce ön)'],
                        ['Antifriz değişimi', 'Her 2 yılda bir'],
                        ['Akü kontrolü', 'Her yıl veya şarj şikayetinde'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ En Kritik Bakım',
                    items: [
                        'Triger (dağıtım) kayışı zamanında değiştirilmezse kopar → motor büyük hasara uğrar (bazen tamamen ölür).',
                    ],
                },
                {
                    type: 'info',
                    label: '📋 Günlük Kontrol Listesi',
                    items: [
                        'Motor yağı seviyesi (soğukta)',
                        'Soğutma suyu/antifriz seviyesi',
                        'Far, stop, sinyal çalışıyor mu?',
                        'Lastik görünümü (kesik, şişlik)',
                        'Fren hidroliği seviyesi',
                    ],
                },
            ],
        },
    ],
    adap: [
        {
            title: 'Trafik Adabının Temel Kavramları',
            summary: 'Yasal zorunlulukların ötesinde, toplumsal trafiğin düzeni için gerekli davranış ilkeleri.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '📖 Trafik Adabı Nedir?',
                    items: [
                        'Trafik adabı; kanunda yazmayan ama toplumun ortak huzuru için benimsenmesi gereken davranış biçimleridir.',
                        'Trafik kuralları → Zorunlu (ceza var)',
                        'Trafik adabı → Gönüllü (ceza yok, ama toplumsal saygı var)',
                    ],
                },
                {
                    type: 'rule',
                    label: '🤝 Temel Adap İlkeleri',
                    items: [
                        '• Sabır ve Tahammül: Sıkışıklıkta sakin kalmak, boynuza basmamak',
                        '• Saygı: Diğer sürücülerin manevra haklarına değer vermek',
                        '• Hoşgörü: Başkasının hatasını bağışlamak (herkese olabilir)',
                        '• Dikkat: Yayalara, bisikletçilere, çocuklara karşı ekstra hassas olmak',
                        '• Yardımseverlik: Arıza yapan sürücüye yardım teklif etmek',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Trafik adabı" soruları genellikle doğru/yanlış şeklinde gelir.',
                        'Korna çalmak, sağdan geçmek, ışıkta arkadakini baskı altına almak → Adaba aykırı.',
                    ],
                },
            ],
        },
        {
            title: 'Diğergamlık (Empati ve Özveri)',
            summary: 'Kendi çıkarından çok başkasını düşünmek anlamına gelen diğergamlığın trafikteki yeri.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'info',
                    label: '📖 Diğergamlık Nedir?',
                    items: [
                        'Diğergamlık (özgecilik): Kendi çıkarından önce başkasının iyiliğini düşünmek.',
                        'Empati: Başkasının yerine kendinizi koymak — "ben olsam ne hissederdim?"',
                    ],
                },
                {
                    type: 'rule',
                    label: '🚗 Trafikteki Örnekler',
                    items: [
                        '• Ambulansa yol vermek için kırmızı ışıkta ilerleyen sürücüye kızmamak',
                        '• Yağmurda yayalara su sıçratmamak için yavaşlamak',
                        '• Uzun trafik sıkışıklığında sabırla beklemek',
                        '• Kaza olan sürücüye yardım etmek (sadece geçip gitmemek)',
                        '• Engelli, hamile veya yaşlı birine park yeri bırakmak',
                        '• Karşıdan gelen araç için uzun fardan kısa fara geçmek',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Diğergamlık" sınav sorularında sıkça çıkar — kendi çıkarından çok başkasını düşünmek.',
                    ],
                },
            ],
        },
        {
            title: 'Dezavantajlı Gruplara Yaklaşım',
            summary: 'Engelliler, yaşlılar, çocuklar ve hamile bireylere trafikteki özel yaklaşım kuralları.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Kişi / Durum', 'Yapılacak'],
                    rows: [
                        ['Beyaz bastonu olan kör birey', 'Mutlak dur, yol ver, geçişi bekle'],
                        ['Tekerlekli sandalyeli birey', 'Yavaşla, geçişe izin ver'],
                        ['Çocuk (okul çıkışı, park)', 'Çok yavaşla, ani çıkışlara hazır ol'],
                        ['Yaşlı yaya geçitte', 'Yavaş geç, göz teması kur, acele ettirme'],
                        ['Bebek arabası iterek geçen', 'Öncelik ver, yolu tamamen serbest bırak'],
                        ['Engelli araç işareti olan sürücü', 'Sabırla bekle, kornaya basma'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Dikkat',
                    items: [
                        'Beyaz baston: Görme engeli. Şeritini tamamen serbest bırak.',
                        'Rehber köpekli kişi → Hayvana dokunma veya dikkatini dağıtma.',
                        'Yaya geçidindeki çocuğa korna çalmak → Panik yaratır, tehlikelidir.',
                    ],
                },
            ],
        },
        {
            title: 'Korna ve Işık Kullanımı',
            summary: 'Korna, selektör ve farların doğru kullanım koşulları ve yasaklı durumlar.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Araç', 'Ne Zaman Kullanılır?', 'Ne Zaman YANLIŞ?'],
                    rows: [
                        ['Korna', 'Tehlike uyarısında kısa bir kez', 'Sabırsızlık, selamlama, ışıkta bekleyeni uyarmak'],
                        ['Selektör (Uzun far sinyali)', 'Geçiş niyetini bildirmek, öndekini uyarmak', 'Agresif uyarı/tehdit amaçlı art arda kullanmak'],
                        ['Uzun Far', 'Şehirdışı, karşıdan araç yok', 'Şehiriçi, karşıdan araç varken (kamaştırır)'],
                        ['Sis Farı', 'Yoğun sis, yağmur, kar', 'Açık havada (arkadaki gözünü alır)'],
                    ],
                },
                {
                    type: 'rule',
                    label: '🌙 Gece Sürüşü Adabı',
                    items: [
                        'Karşıdan araç gelince kısa fara geç (gözleri kamaşmasın).',
                        'Şehiriçinde her zaman kısa far kullan.',
                        'Uzun farla görüş mesafesi yaklaşık 200 metre; kısa far ~50 metre.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Şehiriçinde tanıdığa selam için korna çalınır mı?" → HAYIR, yasak.',
                        'Sis farı yalnızca görüş bozukluğu olan havada yakılır.',
                    ],
                },
            ],
        },
        {
            title: 'Otoyol ve Bölünmüş Yol Adabı',
            summary: 'Yüksek hızlı yollarda uyulması gereken şerit disiplini ve güvenlik mesafesi kuralları.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'rule',
                    label: '🛣️ Otoyol Şerit Kuralları',
                    items: [
                        '✅ SAĞ şerit: Normal seyir şeridi — ana kullanım burası.',
                        '✅ SOL şerit: Sadece SOLLLAMA şeridi — geçtikten sonra sağa dön!',
                        '❌ Sol şeritte yavaş devam etmek → Trafiği engeller, kurallara aykırı.',
                        '❌ Sağdan geçme → Otoyolda kesinlikle yasak.',
                    ],
                },
                {
                    type: 'info',
                    label: '📐 Otoyolda Takip Mesafesi',
                    items: [
                        '130 km/s → Minimum 65 metre (hızın yarısı = metre)',
                        'Islak yolda en az 2 katına çıkar',
                        'Her 2 saatte bir mola ver → Yorgunluk kazaları gece ve sabah erken saatlerde en yüksek!',
                    ],
                },
                {
                    type: 'rule',
                    label: '🔀 Otoyola Giriş ve Çıkış',
                    items: [
                        'Giriş şeridinde hızını otoyol hızına eşitle, SONRA birleş.',
                        'Ani giriş yapma — arkadan gelen göremeyebilir.',
                        'Çıkış öncesi en sağ şeride geç, hızı azalt, çıkış şeridine gir.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        '"Sol şerit nedir?" → Geçiş şeridi, sürekli seyir için değil.',
                        'Dinlenme molası → Her 2 saatte bir.',
                    ],
                },
            ],
        },
        {
            title: 'Yaya Geçidi ve Bisikletlilere Yaklaşım',
            summary: 'Yaya geçitlerinde ve bisiklet şeritlerinde uyulması gereken öncelik ve güvenlik kuralları.',
            difficulty: 'kolay',
            examFreq: 'sık',
            sections: [
                {
                    type: 'rule',
                    label: '🚶 Yaya Geçidi Adabı',
                    items: [
                        'Yaya yürümeye başlamışsa → Mutlak dur, kişi geçene kadar bekle.',
                        'Yaya henüz başlamamış ama geçmek istiyor → Yavaşla, göz teması kur, bekle.',
                        'Yeşil ışıkta bile geçitte yayan varsa → Geçmesini bekle.',
                        'Yayaya korna çalma → Panik yaratır, tehlikelidir.',
                        'Çocuklu geçitlerde çok yavaşla → Ani hareketlere hazır ol.',
                    ],
                },
                {
                    type: 'rule',
                    label: '🚴 Bisiklet Şeridi Adabı',
                    items: [
                        'Bisiklet şeridine girmekten kaçın.',
                        'Bisikletlinin yanında duran araçtan kapı açarken dikkat et ("door zone" kazaları).',
                        'Bisikletliyi geçerken en az 1,5 metre yan boşluk bırak.',
                        'Okul çıkışı ve parklarda bisikletçilere ekstra yavaşla.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Yaya yeşil ışıkta geçiyor olsa bile sürücü "yeşilim var" diyemez.',
                        'Bisikletliyi geçerken en az 1,5 metre → sınavda rakam soruluyor!',
                    ],
                },
            ],
        },
        {
            title: 'Hava Koşullarında Güvenli Sürüş',
            summary: 'Yağmur, sis, kar ve buzlu yol koşullarında uygulanması gereken sürüş teknikleri.',
            difficulty: 'orta',
            examFreq: 'sık',
            sections: [
                {
                    type: 'table',
                    headers: ['Hava Durumu', 'Hız', 'Mesafe', 'Özel Dikkat'],
                    rows: [
                        ['Yağmurlu', 'Düşür', '2 kat', 'Aquaplaning riski (ıslak yolda su üzerinde kayma)'],
                        ['Yoğun sis', 'Çok düşür', '3 kat+', 'Sis farı aç, uzun farı KAPAPAT'],
                        ['Karlı yol', 'Çok yavaş', '4 kat', 'Motor freni kullan, ani direksiyondan kaçın'],
                        ['Buzlu yol', 'İnanılmaz yavaş', 'Max', 'Pedal bırakarak sür, ABS\'e güven'],
                    ],
                },
                {
                    type: 'warning',
                    label: '⚠️ Aquaplaning (Hidroplaning) Nedir?',
                    items: [
                        'Islak yolda hız arttıkça lastik su üzerinde "sörf yapar", temas kesilir.',
                        'Belirtisi: Direksiyon boşa çıkar, araç kaymaya başlar.',
                        'Yapılacak: Ani fren YAPMA, gaz çek, direksiyona müdahale etme — araç suyu geçince tekrar temas kurar.',
                    ],
                },
                {
                    type: 'rule',
                    label: '❄️ Donmuş Camda',
                    items: [
                        '✅ Buz kazıyıcı + araç ısıtma sistemi kullan.',
                        '❌ Sıcak su dökme → cam ani genleşme nedeniyle çatlayabilir.',
                        '❌ Windshield sadece bir köşe açık iken hareket etme → Görüş yetersizliği.',
                    ],
                },
                {
                    type: 'tip',
                    label: '📝 Sınav İpucu',
                    items: [
                        'Sis farı açık hava da kullanılır mı? → HAYIR, sadece görüş bozukluğunda.',
                        '"Aquaplaning\'de ne yapılmalı?" → Ani fren yok, gaz çek, bekle.',
                    ],
                },
            ],
        },
    ],
};

const DIFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    kolay: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    orta: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    zor: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

const FREQ_COLORS: Record<string, { bg: string; text: string }> = {
    'çok sık': { bg: '#eff6ff', text: '#2563eb' },
    'sık': { bg: '#f0fdf4', text: '#15803d' },
    'nadir': { bg: '#f8fafc', text: '#64748b' },
};

const SECTION_STYLES: Record<string, { bg: string; border: string; titleColor: string }> = {
    info: { bg: '#eff6ff', border: '#bfdbfe', titleColor: '#1d4ed8' },
    warning: { bg: '#fef2f2', border: '#fecaca', titleColor: '#dc2626' },
    tip: { bg: '#fefce8', border: '#fde68a', titleColor: '#b45309' },
    rule: { bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#15803d' },
    table: { bg: '#f8fafc', border: '#e2e8f0', titleColor: '#475569' },
};

function TableSection({ section }: { section: Section }) {
    return (
        <View style={[styles.sectionBlock, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
            <View style={styles.tableWrapper}>
                {/* Header row */}
                {section.headers && (
                    <View style={styles.tableHeader}>
                        {section.headers.map((h, i) => (
                            <Text
                                key={i}
                                style={[styles.tableHeaderCell, i === 0 ? { flex: 1.4 } : { flex: 1 }]}
                                numberOfLines={2}
                            >
                                {h}
                            </Text>
                        ))}
                    </View>
                )}
                {/* Data rows */}
                {section.rows?.map((row, ri) => (
                    <View
                        key={ri}
                        style={[styles.tableRow, ri % 2 === 0 ? { backgroundColor: '#ffffff' } : { backgroundColor: '#f1f5f9' }]}
                    >
                        {row.map((cell, ci) => (
                            <Text
                                key={ci}
                                style={[styles.tableCell, ci === 0 ? { flex: 1.4, fontWeight: '600', color: '#1e293b' } : { flex: 1 }]}
                            >
                                {cell}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

function NoteSection({ section }: { section: Section }) {
    if (section.type === 'table') return <TableSection section={section} />;

    const style = SECTION_STYLES[section.type] || SECTION_STYLES.info;

    return (
        <View style={[styles.sectionBlock, { backgroundColor: style.bg, borderColor: style.border }]}>
            {section.label && (
                <Text style={[styles.sectionLabel, { color: style.titleColor }]}>{section.label}</Text>
            )}
            {section.text && <Text style={styles.sectionText}>{section.text}</Text>}
            {section.items?.map((item, i) => (
                <Text key={i} style={styles.sectionItem}>{item}</Text>
            ))}
        </View>
    );
}

function NoteCard({ note, categoryColor }: { note: Note; categoryColor: string }) {
    const [expanded, setExpanded] = useState(false);
    const diffStyle = DIFF_COLORS[note.difficulty];
    const freqStyle = FREQ_COLORS[note.examFreq];

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.card}>
            <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.cardHeader}>
                <View style={[styles.cardAccentBar, { backgroundColor: categoryColor }]} />
                <View style={styles.cardHeaderContent}>
                    <View style={styles.cardTags}>
                        <View style={[styles.tag, { backgroundColor: diffStyle.bg, borderColor: diffStyle.border }]}>
                            <Text style={[styles.tagText, { color: diffStyle.text }]}>{note.difficulty}</Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: freqStyle.bg }]}>
                            <Star size={9} color={freqStyle.text} fill={freqStyle.text} />
                            <Text style={[styles.tagText, { color: freqStyle.text, marginLeft: 3 }]}>{note.examFreq}</Text>
                        </View>
                    </View>
                    <Text style={styles.cardTitle}>{note.title}</Text>
                    <Text style={styles.cardSummary}>{note.summary}</Text>
                </View>
                <View style={styles.chevronContainer}>
                    {expanded
                        ? <ChevronUp size={18} color="#94a3b8" />
                        : <ChevronDown size={18} color="#94a3b8" />}
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.cardBody}>
                    {note.sections.map((section, i) => (
                        <NoteSection key={i} section={section} />
                    ))}
                </View>
            )}
        </View>
    );
}

export default function NotesScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
    const activeCategory = CATEGORIES.find(c => c.id === activeTab)!;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color="#0f172a" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Özel Notlar</Text>
                    <Text style={styles.headerSub}>Müfredata uygun konu anlatımları</Text>
                </View>
                <View style={styles.headerIcon}>
                    <BookOpen size={22} color={activeCategory.color} />
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = activeTab === cat.id;
                        const Icon = cat.icon;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTab(cat.id);
                                }}
                                style={styles.tabItem}
                            >
                                {isActive ? (
                                    <LinearGradient colors={cat.gradient} style={styles.tabGradient}>
                                        <View style={styles.tabIconBoxActive}>
                                            <Icon size={16} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.tabText, { color: '#ffffff' }]}>{cat.title}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.tabInactive}>
                                        <View style={[styles.tabIconBox, { backgroundColor: cat.bg }]}>
                                            <Icon size={16} color={cat.color} />
                                        </View>
                                        <Text style={[styles.tabText, { color: '#64748b' }]}>{cat.title}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Category Info Bar */}
                <View style={[styles.categoryBar, { backgroundColor: activeCategory.bg, borderColor: activeCategory.color + '40' }]}>
                    <View style={[styles.categoryBarDot, { backgroundColor: activeCategory.color }]} />
                    <Text style={[styles.categoryBarText, { color: activeCategory.color }]}>
                        {NOTES[activeTab as keyof typeof NOTES].length} konu • Detaylı anlatım
                    </Text>
                </View>

                {NOTES[activeTab as keyof typeof NOTES].map((note, index) => (
                    <NoteCard key={index} note={note} categoryColor={activeCategory.color} />
                ))}

                <View style={styles.footerBox}>
                    <Text style={styles.footerEmoji}>💡</Text>
                    <Text style={styles.footerText}>
                        Bu notlar T.C. Sürücü Belgesi sınavı müfredatı esas alınarak hazırlanmıştır. En çok çıkan konular öne sıralanmıştır.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
        marginTop: 1,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tabsWrapper: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 12,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        gap: 10,
    },
    tabItem: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    tabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        borderRadius: 14,
    },
    tabInactive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
    },
    tabIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconBoxActive: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        gap: 12,
        paddingBottom: 60,
    },
    categoryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
        marginBottom: 4,
    },
    categoryBarDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoryBarText: {
        fontSize: 13,
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12,
    },
    cardAccentBar: {
        width: 4,
        borderRadius: 2,
        alignSelf: 'stretch',
        minHeight: 48,
    },
    cardHeaderContent: {
        flex: 1,
        gap: 4,
    },
    cardTags: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 2,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.2,
    },
    cardSummary: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        lineHeight: 17,
        marginTop: 2,
    },
    chevronContainer: {
        paddingTop: 20,
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    sectionBlock: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        gap: 6,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    sectionText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#374151',
        fontWeight: '500',
    },
    sectionItem: {
        fontSize: 13,
        lineHeight: 20,
        color: '#374151',
        fontWeight: '500',
    },
    tableWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#334155',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    tableHeaderCell: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    tableCell: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 16,
    },
    footerBox: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        padding: 14,
        borderRadius: 14,
        marginTop: 4,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        gap: 10,
    },
    footerEmoji: {
        fontSize: 20,
    },
    footerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: '#1d4ed8',
        fontWeight: '600',
    },
});
