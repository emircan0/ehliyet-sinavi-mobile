# EhliyetApp 🚗

Modern, kullanıcı dostu ve yapay zeka destekli ehliyet sınavına hazırlık mobil uygulaması. Expo ve React Native kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- **AI Gelişim Koçu**: Yapay zeka destekli hata analizi ve kişiselleştirilmiş çalışma önerileri.
- **Gelişmiş Sınav Ekranı**: Sorular arası ileri-geri gezinme, soru pas geçme ve anlık geri bildirim.
- **Hızlı Pratik**: Günlük tempo için optimize edilmiş hızlı soru çözme modları.
- **Premium Avantajlar**: Derinlemesine analizler ve özel içerikler için Pro üyelik sistemi.
- **Modern Arayüz**: Slate-based karanlık tema, minimalist ve simetrik tasarım.

## 🛠️ Teknoloji Yığını

- **Framework**: [Expo SDK 54](https://expo.dev/) / React Native
- **Backend**: [Supabase](https://supabase.com/) (Auth & Database)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Haptics**: Expo Haptics ile dokunsal geri bildirimler.

## 📦 Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/emircan0/ehliyet-sinavi-mobile.git
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyasını oluşturun ve Supabase anahtarlarınızı ekleyin:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
4. Uygulamayı başlatın:
   ```bash
   npx expo start
   ```

## 📈 Versiyonlama

Bu proje [Semantic Versioning](https://semver.org/) prensiplerine göre versiyonlanmaktadır.

- **v1.0.0**: İlk stabil sürüm. Ana sayfa tasarımı, sınav navigasyonu ve AI Tutor temel özellikleri tamamlandı.

---
Geliştiren: [emircan0](https://github.com/emircan0)
