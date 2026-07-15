import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    StyleSheet,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, HeartPulse, Wrench, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
    { id: 'trafik', title: 'Trafik & Çevre', icon: FileText, color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'ilkyardim', title: 'İlk Yardım', icon: HeartPulse, color: '#ef4444', bg: '#fee2e2' },
    { id: 'motor', title: 'Motor & Araç', icon: Wrench, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'adap', title: 'Trafik Adabı', icon: ShieldCheck, color: '#10b981', bg: '#d1fae5' },
];

const NOTES = {
    trafik: [
        {
            title: "Hız Limitleri (Tüm Araç Tipleri)",
            content: "🚗 Otomobil: Şehiriçi 50 | Çift Yönlü 90 | Bölünmüş Yol 110 | Otoyol 130/140\n🚌 Otobüs/Minibüs: 50 | 80 | 90 | 100 km/s\n🚛 Kamyon/Tır: 50 | 80 | 85 | 90 km/s\n🏍️ Motosiklet: 50 | 90 | 110 | 130 km/s\n\n⚠️ Not: Hız limitleri, yol işaretleri veya şartlarına göre değişebilir."
        },
        {
            title: "Takip Mesafesi",
            content: "Kuralı: Hızın yarısı kadar metre (90 km/s → 45 metre).\n\nÖzel Durumlar:\n• Konvoy halinde: Araçlar arası en az bir araç boyu\n• Tehlikeli madde taşıyan araç: Minimum 50 metre\n• Yağmurlu/karlı havada: Normal mesafenin en az 2 katı\n• Sis: En az görüş mesafesi kadar"
        },
        {
            title: "Geçiş Üstünlüğü Sırası (CİPS)",
            content: "Görevdeki öncelikli araçlar:\n1. 🚑 (C) Cankurtaran - Ambulans\n2. 🚒 (İ) İtfaiye\n3. 🚔 (P) Polis / Jandarma / Güvenlik\n4. 🚧 (S) Sivil Savunma + Trafik Hizmetleri\n\nBu araçlara geçiş için tam yol verilir, kırmızı ışıkta bile geçebilirler. Diğer sürücüler sağa çekilerek durmalıdır."
        },
        {
            title: "Kavşaklarda Geçiş Önceliği",
            content: "Kontrolsüz Kavşak Kuralları:\n1. Tali yol → Ana yola yol ver\n2. Dönüş yapan → Düz gidene yol ver\n3. Motorlu araç → Motorsuz araca yol ver\n4. İki eşit araç: SAĞDAKİ önceliklidir\n\nÖzel Durumlar:\n• Demir yolu geçidi: Her zaman trene yol ver\n• Yaya geçidi: Yayaya her zaman yol ver\n• Dönel kavşak: İçerideki araç önceliklidir"
        },
        {
            title: "Trafik Polisinin İşaretleri",
            content: "Gündüz Kollarla:\n• Kollar açık (T şekli): Kolların yönündeki araçlar geçer, ön-arka bekler\n• Kol öne uzatılmış: Uzatılan yöndeki araç geçer\n• Kol yukarı: TÜM yönler için dur!\n\nGece Işıklı Fenerle:\n• Kırmızı ışık yukarı-aşağı: DUR\n• Kırmızı ışık sağa-sola: GEÇ"
        },
        {
            title: "Alkol Sınırları ve Cezalar",
            content: "Promil Sınırları:\n• Hususi araç sürücüleri: 0.50 promil\n• Ticari araç sürücüleri: 0.20 promil\n• Motosiklet sürücüleri: 0.20 promil\n\nEhliyet El Koyma Süreleri:\n• 1. ihlal: 6 Ay\n• 2. ihlal: 2 Yıl\n• 3. ihlal: 5 Yıl (ve cezai işlem!)\n\n⚠️ Kaza + Alkol: Sigorta tazminat ödemez!"
        },
        {
            title: "Durma – Duraklama – Park Farkı",
            content: "Durma: Kırmızı ışık, trafik, polis işareti vb. zorunlu bekleme.\n\nDuraklama: Yolcu indirip bindirme, yük yükleme; sürücü başında bekler (max 5 dk).\n\nPark: 5 dk'yı aşan, sürücünün aracı bırakıp gittiği durum.\n\nPark Yasağı (Mesafe Sınırları):\n• Kavşaklara: 5 metre\n• Yaya geçidine: 10 metre\n• Okul kapısına: 15 metre\n• Duraklara: 15 metre\n• Köprü/Tünel/Rampa: Kesinlikle yasak"
        },
        {
            title: "Geçme (Sollama) Kuralları",
            content: "Geçme Yasağı Olan Yerler:\n• Tepelerin zirvesi ve eteği (görüş mesafesi az)\n• Virajlar\n• Yaya geçitleri\n• Kavşaklar\n• Demir yolu geçitleri\n• Kesik beyaz çizgi olmayan yerler\n\nGeçme Sırası:\n• Soldan geçilir, geçilen aracın sağına çekilinir\n• Sinyal ve korna kullanılır\n• Sağdan geçmek kesinlikle yasaktır"
        },
        {
            title: "Reflektör ve Tehlike İkazları",
            content: "Reflektör (Üçgen Uyarı İşareti):\n• Gündüz: Araca 30m öne yerleştirilir\n• Gece/otoban: 100-150m öne konur\n• İki adet bulundurulması zorunludur\n\nTehlike İkazı (4'lü Flaşör):\n• Yüksek hızlı trafikte durmak zorunda kalındığında\n• Kaza yapıldığında\n• Motorsiklet kafilelerinde\n• Düşük hızla yük taşıyan araçlarda"
        },
        {
            title: "Trafik İşaret ve Levhalar",
            content: "🔴 Kırmızı kenarlı/zemin: Yasaklayıcı (Dur, Geçme, Hız sınırı)\n🟡 Sarı/turuncu zemin: Tehlike uyarısı (Dikkatli olun!)\n🔵 Mavi zemin: Bilgi verici (Otoban başlangıcı, Dinlenme alanı)\n🟢 Yeşil zemin: Yönlendirme levhası (Yol tarifi)\n⬛ Siyah kenarlı: Trafik kuralı bildirici\n\nDairesel levhalar: Kesin yasak/emir\nÜçgen levhalar: Uyarı\nDikdörtgen levhalar: Bilgi"
        },
        {
            title: "Kış Mevsimi Sürüş Kuralları",
            content: "Zorunlu Ekipmanlar:\n• Kış lastiği: 1 Aralık – 1 Nisan arası zorunlu\n• Kar zinciri: Dağlık/kayalık yollarda gerekebilir\n\nKarlı/Buzlu Yolda:\n• Hız limitinin en az yarısına düşürülmesi önerilir\n• Ani fren ve direksiyon hareketi yapılmaz\n• Takip mesafesi 3-4 kat artırılır\n• Motor freninden yararlanılır"
        },
    ],
    ilkyardim: [
        {
            title: "İlk Yardımın Temel Kuralları (KBK)",
            content: "1. 🛡️ KORUMA: Olay yerini güvene alma\n   - Aracı güvenli mesafeye çek\n   - Motoru kapat, el frenini çek\n   - Reflektörleri yerleştir\n   - Elektrik hattı vb. tehlikeleri kontrol et\n\n2. 📞 BİLDİRME: 112'yi ara\n   - Olay yeri adresini söyle\n   - Yaralı sayısını bildir\n   - Aramayı kesme, talimatları dinle\n\n3. 🏥 KURTARMA: Bilinçli müdahale et\n   - Sakin kal, panikletme\n   - Kendi güvenliğini önce sağla"
        },
        {
            title: "Temel Yaşam Desteği – TYD (30:2 Kuralı)",
            content: "Ne zaman başlanır? Bilinç YOK + Normal solunum YOK\n\nYetişkinde:\n• 30 kalp masajı + 2 suni solunum\n• Masaj hızı: 100-120 bası/dakika\n• Derinlik: 5-6 cm (göğüs kemiği alt yarısına)\n• Ambulans gelene kadar dur-me!\n\nÇocukta (1-8 yaş):\n• 30 masaj + 2 solunum, tek el ile\n• Derinlik: 4-5 cm\n\nBebekte (0-1 yaş):\n• 30 masaj + 2 solunum, 2 parmakla\n• Derinlik: 4 cm\n\n⚠️ AED cihazı varsa hemen kullan!"
        },
        {
            title: "Kanama Türleri ve Müdahale",
            content: "Atardamar Kanaması:\n• Parlak kırmızı, fışkırır → En tehlikelisi!\n• Yüksek basınçla sıkıştır, turnike uygula\n\nToplardamar Kanaması:\n• Koyu kırmızı, sızar → Bezle bastır\n\nKılcal Damar Kanaması:\n• Az miktarda, yüzeysel → Basit pansuman\n\nBastırma Sırası:\n1. Temiz bezle doğrudan bastır\n2. Bez ıslanırsa üstüne yenisi ekle (kaldırma!)\n3. Durmazsa Turnike uygula\n4. Turnike saatini not et → 15-20 dk'da 5-10 sn gevşet"
        },
        {
            title: "Şok Nedir ve Tedavisi",
            content: "Şok: Dolaşım sisteminin yetersizliği nedeniyle organların kansız kalmasıdır.\n\nBelirtileri:\n• Bayılmak üzere hissetme\n• Soğuk, soluk, terli cilt\n• Hızlı ve zayıf nabız\n• Kan basıncı düşüklüğü\n\nŞok Pozisyonu:\n• Sırtüstü yatır\n• Ayakları 30 cm kaldır\n• Üstünü ört, ısıt\n• Yiyecek/içecek verme!\n• Başını yükselt değil; ayaklarını yükselt!\n\n⚠️ Baş yaralanması şüphesinde şok pozisyonu uygulanmaz!"
        },
        {
            title: "Koma Pozisyonu (Lateral Güvenlik Pozisyonu)",
            content: "Ne zaman uygulanır?\n• Bilinç kaybı varsa\n• Kusma riski varsa\n• Solunum var ama bilinç yok\n\nNasıl yapılır?\n• Yaralıyı yan çevir (yarı yüzükoyun)\n• Üst kolu 90° açılı, alt bacak düz\n• Üst bacak 90° katlanmış\n• Baş hafif geriye (hava yolu açık)\n\n✅ Amaç: Dilin düşmesini, kusmuğun boğulmasını önler."
        },
        {
            title: "Hayat Kurtaran 3 Manevra",
            content: "1. Heimlich Manevrası (Boğulma):\n• Arka tarafından sar, bilek arası göbeğin üstüne koy\n• İçeri-yukarı doğru sert it\n• Bilinç kaybı olursa TYD'ye başla\n\n2. Rentek Manevrası (Araçtan Çıkarma):\n• Omurgayı koruyarak, baş-boyun-gövde aynı eksende\n• 2-3 kişiyle koordineli yapılır\n• Araç yanma tehlikesi varsa zorunludur\n\n3. Esmarch Manevrası (Çene Kaldırma):\n• Bilinçsiz kişide hava yolunu açmak için\n• Alt çeneyi öne-yukarı kaldır\n• Baş geriye yatırılır (boyun kırığı şüphesi yoksa)"
        },
        {
            title: "Kırık, Çıkık, Burkulma",
            content: "Burkulma (Zorlanma):\n• Eklem bağları gerilir/kısmi yırtılır\n• Şişme ve ağrı var\n• Elastik bandajla sar, soğuk uygula, yukarı kaldır\n\nÇıkık:\n• Eklem yüzeyleri kalıcı olarak ayrılmıştır\n• Ciddi şekil bozukluğu var\n• ❌ Asla yerine oturtma!\n• Atel uygula, hareket ettirmeden hastaneye götür\n\nKırık:\n• Açık Kırık (deri yırtık): Yara pansumanı + atel\n• Kapalı Kırık: Atel + sargı bezi ile sabitle\n• ❌ Uzuvları çekme veya düzeltme!\n• Kafatası/omurga kırığı şüphesinde kesinlikle hareket ettirme!"
        },
        {
            title: "Yanık Türleri ve Müdahale",
            content: "1. Derece Yanık: Kızarıklık, hafif ağrı → Soğuk su (15-20 dk)\n2. Derece Yanık: Su toplaması → Temiz bezle ört, doktora\n3. Derece Yanık: Doku hasarı, ağrı yok → Acil servis!\n\n❌ YANLIŞ: Diş macunu, zeytinyağı, yoğurt sürme\n✅ DOĞRU: Bol soğuk su, temiz bez\n\nKimyasal Yanık:\n• Bol suyla uzun süre yıka (en az 20 dk)\n• Giysiler çıkarılırken elleri koru\n\nElektrik Yanığı:\n• Önce elektriği kes!\n• Görünenin dışında iç hasar çok fazladır"
        },
        {
            title: "Zehirlenme Türleri",
            content: "Ağız Yoluyla (Besin/İlaç):\n• 112'yi ara\n• Kusmaya zorlamayın (asit/alkali ise tehlikelidir)\n• Alınan maddeyi fişiyle doktora götür\n\nSolunum Yoluyla (Gaz, Karbon monoksit):\n• Taze havaya çıkar, temiz hava ver\n• Belirtiler: Baş ağrısı, mide bulantısı, bilinç kaybı\n\nDeri Yoluyla:\n• Bol suyla yıka\n• Bulaşık kıyafetleri çıkar\n\n⚠️ Araba garajında motor çalıştırma! CO gazı renksiz ve kokusuzdur."
        },
        {
            title: "Boğulma ve Su Kazaları",
            content: "Boğulmada:\n1. Kendi güvenliğini sağla (dalma → ip, tahta vb. uzat)\n2. Sudan çıkar, yüzüstü yatır\n3. Ağzına bastırarak suyu boşalt (1 kez)\n4. TYD'ye başla (30 masaj + 2 solunum)\n\nÖnemli Noktalar:\n• Dilbağı: Dil geriye düşerse hava yolu kapanır, esmarch manevrası yap\n• Suda kaybolan bilinci su çıkarınca dönebilir\n• Hipotermi (üşüme): Islak kıyafetleri çıkar, ısıt"
        },
    ],
    motor: [
        {
            title: "4 Zamanlı Motorun Çalışma Prensibi",
            content: "1. 🌬️ Emme: Silindir hava veya yakıt-hava karışımı çeker\n2. 🗜️ Sıkıştırma: Karışım sıkıştırılır\n3. 💥 Ateşleme: Benzinlide buji, dizelde enjeksiyon → Patlama → Güç\n4. 💨 Egzoz: Yanık gazlar dışarı atılır\n\nBenzin vs. Dizel:\n• Benzin: Buji ile ateşleme (dış ateşlemeli)\n• Dizel: Sıkıştırmayla ateşleme (sıkıştırmayla kendiliğinden tutuşma)"
        },
        {
            title: "3 Kritik Kırmızı İkaz Işığı",
            content: "Seyirdeyken yanması halinde DERHAL dur, motoru kapat!\n\n1. 🛢️ YAĞ BASINCI (Çaydanlık simgesi)\n   → Yağ bitmişse motor 1-2 km'de erir!\n\n2. 🌡️ HARARET (Termometre simgesi)\n   → Su/antifriz kaybı → Silindir kapağı yanar\n   → Radyatörü asla sıcakken açma!\n\n3. 🔋 ŞAR (Akü simgesi)\n   → Alternatör arızası → Elektrik kesiliyor\n   → Motor duruncaya kadar elektrik tükenir"
        },
        {
            title: "Güç Aktarma Organları (Sıralama)",
            content: "Motor → Debriyaj (Kavrama) → Vites Kutusu → Şaft (Kardan) → Diferansiyel → Aks Milleri → Tekerlekler\n\nDebriyaj: Motor gücünü vites kutusuna iletir veya keser\n• Yarım debriyaj: Balata hızlı aşınır\n\nVites Kutusu: Torku ve hızı ayarlar\n\nDiferansiyel: Virajda iki tekerleğin farklı hızda dönmesini sağlar (iç tekerlek yavaş, dış hızlı)"
        },
        {
            title: "Direksiyon ve Fren Sistemleri",
            content: "Direksiyon:\n• Hidrolik direksiyon: Servis pompasıyla desteklenir, yağ seviyesi kontrol edilmeli\n• Elektrikli direksiyon: Motor kapalıysa çok ağır döner\n\nFren Sistemi:\n• Servis freni (pedal): Ön diskler genellikle arka disklerden güçlüdür\n• El (park) freni: Arka tekerleklere mekanik etki\n• ABS: Tekerleklerin kilitlenmesini önler, frende direksiyon hakimiyetini korur\n• ESP/EBA: Elektronik denge sistemi\n\n⚠️ El freni çekik gidilirse arka balatalar ısınır, yanar!"
        },
        {
            title: "Soğutma Sistemi",
            content: "Görevi: Motoru 80-90°C civarında tutmak.\n\nParçaları:\n• Radyatör: Isıyı havaya verir\n• Devirdaim Pompası: Soğutma suyunu dolaştırır\n• Termostat: Suyun dolaşımını sıcaklığa göre açar/kapar\n• Vantilatör (Fan): Radyatörden hava geçişini sağlar\n• Genişleme Deposu: Su seviyesi buradan kontrol edilir\n\nAntifriz:\n• Kışın donmayı önler\n• Yazın kaynamayı geciktirir\n• Pas ve korozyonu engeller\n• Her 2 yılda bir değiştirilmeli"
        },
        {
            title: "Yağlama Sistemi",
            content: "Görevi: Hareketli parçaların sürtünmesini azaltmak, aşınmayı önlemek, ısıyı dağıtmak.\n\nYağ Kontrolü:\n• Soğuk motorla, düz zeminde kontrol edilir\n• Çubuktaki iki çizgi arasında olmalıdır\n• Min çizgisinin altı: DERHAL yağ ekle!\n\nYağ Değişim Aralığı:\n• Mineral yağ: 5.000 km\n• Yarı sentetik: 10.000 km\n• Tam sentetik: 15.000-20.000 km\n\n⚠️ Yağ bitmeden eklenen yağ ile motor koruma devam eder!"
        },
        {
            title: "Ateşleme ve Elektrik Sistemi",
            content: "Akü (Batarya):\n• 12 V DC güç kaynağı\n• Soğuk havada performansı düşer\n• Aküyü şarj etmek için atlama kablosu: + kırmızı → + kırmızı, - siyah → - siyah\n\nBobin: 12V'u buji için yüksek gerilime (10.000-30.000V) çevirir\n\nAlternatör: Motor çalışırken aküyü şarj eder ve elektrik sistemi besler\n\nMarş Motoru: Motoru ilk döndüren elektrikli motor\n\nBuji (Benzinli): Her 20-40.000 km'de değişmeli. Kirlenirse motor sarsıntılı çalışır."
        },
        {
            title: "Lastik ve Süspansiyon",
            content: "Lastik Tipleri:\n• Yaz lastiği: +7°C üzerinde daha iyi performans\n• Kış lastiği: +7°C altında zorunlu (1 Ara - 1 Nis)\n• 4 Mevsim: Her ikisinin ortası\n\nLastik Basıncı:\n• Az basınç: Yüksek yakıt tüketimi, kenarlardan aşınır\n• Fazla basınç: Sert sürüş, ortadan aşınır\n\nDisbalans/Rot Ayarı:\n• Balans: Tekerleğin kendi ekseni etrafında titremesi\n• Rot: Ön tekerleklerin birbirine paralel olup olmadığı\n\nSüspansiyon: Yoldan gelen titreşimleri emer, yol tutuşunu sağlar"
        },
        {
            title: "Egzoz ve Emisyon Sistemi",
            content: "Egzoz Sistemi Parçaları:\n• Manifold → Katalitik Konvertör → Susturucu (Egzoz Borusu)\n\nKatalitik Konvertör (Katalizör):\n• Zararlı gazları (CO, HC, NOx) dönüştürür\n• Kurşunlu benzinle hasar görür\n\nRenkli Egzoz Dumanı:\n• Mavi duman: Motor yağı yanıyor (piston segmanı aşınmış)\n• Siyah duman: Zengin karışım/tıkalı filtre\n• Beyaz duman: Soğutma suyu yanıyor (silindir kapağı hasarlı)\n\nDPF (Dizel Partikül Filtresi): Her 60-80.000 km temizlenmeli"
        },
        {
            title: "Araç Bakım ve Periyodik Kontroller",
            content: "Günlük Kontrol:\n• Lastik görünümü, sızdırmazlık, far/stop çalışması\n\nHaftalık:\n• Motor yağı seviyesi\n• Soğutma suyu seviyesi\n• Fren hidroliği\n• Direksiyon hidroliği\n\nPeriyodik Bakım:\n• Yağ + filtre: 5.000-15.000 km (yağa göre)\n• Hava filtresi: 15.000-20.000 km\n• Yakıt filtresi: 30.000-60.000 km\n• Distribütör kayışı: 80.000-120.000 km (kritik!)\n• Fren balataları: 30.000-40.000 km"
        },
    ],
    adap: [
        {
            title: "Trafik Adabının Temel İlkeleri",
            content: "Trafik adabı, kanunda yazmayan ama toplumun huzuru için gerekli davranışlardır:\n\n• Sabır ve Tahammül: Trafik sıkışıklığında sakin kalmak\n• Saygı: Diğer sürücülerin haklarına değer vermek\n• Hoşgörü: Başkasının hatasını affetmek\n• Dikkat: Yayalara, bisikletçilere, çocuklara karşı hassas olmak\n• Yardımseverlik: Arıza yapan sürücüye yardım teklif etmek"
        },
        {
            title: "Diğergamlık (Özgecililik)",
            content: "Kendi çıkarından önce başkasının iyiliğini düşünmek demektir.\n\nTrafikteki Örnekleri:\n• Ambulansa yol vermek için kırmızı ışıkta geçen sürücüye kızmamak\n• Yağmurda yayalara su sıçratmamak için yavaşlamak\n• Trafik sıkışıklığında beklemeye tahammül etmek\n• Kaza sonrası kalan araçtan ilerlemek yerine yardım etmek\n• Yaşlı veya engelli birine park yeri bırakmak\n\nDiğergamlık ≠ Kendi haklarından feragat etmek, dengeyi koru!"
        },
        {
            title: "Dezavantajlı Gruplara Yaklaşım",
            content: "Engelli Bireyler:\n• Beyaz bastonu ve rehber köpek → Tam duraklama ve yol ver\n• Tekerlekli sandalye → Yavaşla, gerekirse dur\n• İşaret levhası olan araç → Sabırla bekle\n\nYaşlı ve Çocuklar:\n• Yaya geçidinde çocuk varsa yavaşla, gözle temas kur\n• Yaşlı sürücüler yavaş sürüyorsa sabır göster\n\nHamile ve Bebek Arabası:\n• Geçişte öncelik ver, tehlikeli manevra yapma"
        },
        {
            title: "Korna ve Işık Kullanımı",
            content: "Korna (doğru kullanım):\n• Tehlike uyarısı için: Kısa, net bir korna yeterlidir\n• ❌ Sabırsızlıktan: Uygun değil\n• ❌ Tanıdığa selamlamak için: Şehiriçi yasaktır\n• ❌ Tünellerde: Gereksiz\n\nSelektör (Uzun Far Sinyali):\n• Geceleri araç geçmek istediğinde (1 kez)\n• Islak ve karlı havada: Karşı sürücüleri uyarmak için\n• Köy yaklaşımında tehlikeleri ikaz etmek için\n\nFar Kullanımı:\n• Gündüz kısa far yakma (DRL): Güvenliği artırır\n• Sis farı: Yalnızca sis, yoğun yağmur, yoğun karda"
        },
        {
            title: "Yaya Geçidi ve Bisiklet Adabı",
            content: "Yaya Geçidinde:\n• Yaya başlamışsa mutlak dur\n• Yaya başlamamışsa yavaşla, göz teması kur\n• Yayaya korna çalma!\n• Yeşil ışıkta bile yayan varsa dur\n\nBisiklet Şeridi Adabı:\n• Bisiklet şeridine girme\n• Bisikletli varken açılan kapıya dikkat et\n• Bisikletliyi geçerken geniş mesafe bırak (en az 1,5 m)\n• Okul çıkışı ve parklarda bisikletçilere ekstra dikkat"
        },
        {
            title: "Gece Sürüşü ve Karanlık",
            content: "Gece Sürüşü Adabı:\n• Karşıdan araç gelince kısa fara geç (ışık körlüğü)\n• Şehiriçinde daima kısa far kullan\n• Uzun farla aydınlatma mesafesi: ~200m\n\nKör Nokta Farkındalığı:\n• Yavaş araçların (tır, kamyon) yanında uzun süre kalmayın\n• Şerit değiştirmeden önce aynayı ve kör noktayı kontrol et\n\nSabahın Erken Saatleri:\n• Gece çalışanlar, yorgun sürücüler için en tehlikeli saat 02:00-06:00\n• Bu saatlerde ekstra dikkatli ol"
        },
        {
            title: "Otoyol Adabı",
            content: "• Sol şerit: Geçiş şerididir, geçtikten sonra sağa çekil!\n• Birleşme şeridi: Hızı otoyol hızına eşitle, gir\n• Takip mesafesi: Otoyolda 130 km'de min 65 metre\n• Sollama: Sadece soldan ve sollu şeritten yapılır\n• ❌ Sağdan geçme\n• ❌ Orta şeritte yavaş seyretme\n• Dinlenme molası: Her 2 saatte bir mola ver (yorgunluk kazaları)"
        },
        {
            title: "Hava Koşullarında Sürüş Adabı",
            content: "Yağmurda:\n• Hız düşür, mesafe artır\n• Islak asfalt: Hydroplaning (su üzerinde kayma) riski!\n• Ani fren yapma, motor fren kullan\n\nSiste:\n• Sis lambalarını yak\n• Uzun farı asla yakma (göz alır)\n• Hızı çok düşür, ses sinyali kullan\n\nKarlı/Buzlu:\n• Çok yavaş git, çok mesafe bırak\n• İlk ateşlemede gaz vermeden debriyajı bırak\n• Donmuş cam: Kazıyıcı + ısıtma; sıcak su dökme!"
        },
    ],
};


function NoteCard({ note }: { note: any }) {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpanded(!expanded);
            }}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{note.title}</Text>
                {expanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
            </View>
            {expanded && (
                <View style={styles.cardBody}>
                    <Text style={styles.cardContent}>{note.content}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function NotesScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);

    const renderTabs = () => (
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
                        style={[
                            styles.tabItem,
                            isActive ? { backgroundColor: cat.color } : { backgroundColor: 'transparent' }
                        ]}
                    >
                        <View style={[styles.tabIconBox, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : cat.bg }]}>
                            <Icon size={16} color={isActive ? '#ffffff' : cat.color} />
                        </View>
                        <Text style={[styles.tabText, isActive ? { color: '#ffffff' } : { color: '#64748b' }]}>
                            {cat.title}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Özet Notlar</Text>
                    <Text style={styles.headerSub}>Sınav öncesi hızlı hap bilgiler</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                {renderTabs()}
            </View>

            {/* Content */}
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {NOTES[activeTab as keyof typeof NOTES].map((note, index) => (
                    <NoteCard key={index} note={note} />
                ))}
                
                <View style={styles.footerBox}>
                    <Text style={styles.footerEmoji}>💡</Text>
                    <Text style={styles.footerText}>
                        Bu notlar AI Hoca tarafından sınav müfredatına göre en çok sorulan yerlerden derlenmiştir.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        marginTop: 2,
    },
    tabsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 16,
    },
    tabsContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 10,
    },
    tabIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        gap: 16,
        paddingBottom: 60,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        paddingRight: 16,
    },
    cardBody: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    cardContent: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        fontWeight: '500',
    },
    footerBox: {
        flexDirection: 'row',
        backgroundColor: '#e0f2fe',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    footerEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    footerText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        color: '#0284c7',
        fontWeight: '600',
    }
});
