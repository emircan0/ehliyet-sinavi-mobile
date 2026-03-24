import { Question } from '../types/question';

export const mockQuestions: Question[] = [
    // Trafik
    {
        id: 't1',
        category: 'trafik',
        text: 'Aşağıdakilerden hangisi trafik kazasında asli kusur sayılan hallerdendir?',
        options: [
            'A) Takip mesafesine uymamak',
            'B) Kavşaklarda geçiş önceliğine uymamak',
            'C) Araçların cinsine uygun hızda sürmemek',
            'D) Gerekli hallerde yavaşlamamak'
        ],
        correctAnswer: 1,
        explanation: 'Kavşaklarda geçiş önceliğine uymamak, trafiğin akışını ve güvenliğini doğrudan tehlikeye attığı için asli kusur sayılır.'
    },
    {
        id: 't2',
        category: 'trafik',
        text: 'Seyir halindeyken aracın gösterge panelinde aşağıdaki ikaz ışıklarından hangisinin yanıyor olması derhal durmayı gerektirmez?',
        options: [
            'A) Yağ basıncı ikaz ışığı',
            'B) Şarj ikaz ışığı',
            'C) Yakıt seviyesi düşük ikaz ışığı',
            'D) Hararet ikaz ışığı'
        ],
        correctAnswer: 2,
        explanation: 'Yakıt seviyesi düşük ikaz ışığı yandığında araç hemen durdurulmak zorunda değildir, ancak en kısa sürede yakıt alınmalıdır. Diğerleri motor sağlığı için kritik öneme sahiptir.'
    },
    // İlk Yardım
    {
        id: 'i1',
        category: 'ilkyardim',
        text: 'Yetişkinlerde temel yaşam desteği uygulaması ile ilgili olarak verilenlerden hangisi doğrudur?',
        options: [
            'A) Göğüs kemiği 3 cm aşağı inecek şekilde bası yapılır.',
            'B) Temel yaşam desteğine yapay solunum ile başlanır.',
            'C) 30 kalp masajı, 2 yapay solunum şeklinde uygulanır.',
            'D) Kalp masajı hızı dakikada 30 bası olacak şekilde ayarlanır.'
        ],
        correctAnswer: 2,
        explanation: 'Yetişkinlerde temel yaşam desteği döngüsü 30 kalp masajı ve 2 yapay solunum (30:2) şeklindedir.'
    },
    {
        id: 'i2',
        category: 'ilkyardim',
        text: 'Aşağıdakilerden hangisi şok belirtilerindendir?',
        options: [
            'A) Nabız atışının güçlü ve yavaş olması',
            'B) Cildin sıcak ve kuru olması',
            'C) Kan basıncının düşmesi',
            'D) Zihinsel aktivitenin artması'
        ],
        correctAnswer: 2,
        explanation: 'Şok durumunda dolaşım yetmezliği nedeniyle kan basıncı düşer, nabız hızlanır ve zayıflar, cilt soğuk ve nemli olur.'
    },
    // Motor
    {
        id: 'm1',
        category: 'motor',
        text: 'Dizel motorlu aracın gösterge panelinde aşağıdaki ikaz ışıklarından hangisinin yanıyor olması, ısıtma bujilerinin çalışmakta olduğunu bildirir?',
        options: [
            'A) Fren balatası aşınmış ikaz ışığı',
            'B) Motor yağı basıncı ikaz ışığı',
            'C) Kızdırma bujisi ikaz ışığı',
            'D) Şarj sistemi ikaz ışığı'
        ],
        correctAnswer: 2,
        explanation: 'Dizel motorlarda soğuk havalarda silindir içini ısıtmak için kızdırma bujileri kullanılır ve buna ait ikaz ışığı yay şeklindedir.'
    },
    // Trafik Adabı
    {
        id: 'a1',
        category: 'trafik_adabi',
        text: 'Trafik ortamında bazen hak kendinizden yana iken bile bu hakkınızı diğer sürücüye vermek, size bir şey kaybettirmeyeceği gibi daha huzurlu bir trafik ortamı sağlamaya katkıda bulunacaktır. Bu durum trafikte aşağıdaki temel değerlerden hangisine örnektir?',
        options: [
            'A) Sabır',
            'B) Öfke',
            'C) İnatlaşma',
            'D) Feragat ve fedakarlık'
        ],
        correctAnswer: 3,
        explanation: 'Kendi hakkından vazgeçerek başkasına yol vermek feragat ve fedakarlık örneğidir.'
    }
];
