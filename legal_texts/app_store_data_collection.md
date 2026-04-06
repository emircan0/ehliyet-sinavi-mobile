# App Store Connect - Veri Toplama Rehberi

App Store Connect'te "Uygulama Gizliliği" (App Privacy) bölümünü doldururken aşağıdaki tabloyu referans alabilirsiniz. Bu bilgiler "Ehliyet Hocam" uygulamasının topladığı verilerin Apple standartlarına göre kategorize edilmiş halidir.

| Veri Kategorisi | Apple Karşılığı | Açıklama | Kimlik ile İlişkili mi? |
| :--- | :--- | :--- | :--- |
| **İletişim Bilgileri** | Email Address | Kayıt ve giriş (Auth) için kullanılır. | Evet |
| **Kimlik Tanımlayıcılar** | User ID | Kullanıcının hesabını eşleştirmek için. | Evet |
| **Kimlik Tanımlayıcılar** | Device ID | Anlık bildirimler (Push Notifications) için. | Evet |
| **Kullanım Verileri** | Product Interaction | Sınav sonuçları, puanlar, favori sorular. | Evet |
| **Tanılama** | Crash Data | Uygulama çökmelerini izlemek için (Supabase logları). | Evet |

## Apple Panelinde Sorulan Sorulara Yanıtlar:

**1. Veriler Kullanıcıyı Takip Etmek İçin mi Kullanılıyor? (Tracking)**
- **Hayır.** Veriler reklam şirketleriyle paylaşılmaz veya başka uygulamalardaki aktivitelerle eşleştirilmez.

**2. Veriler Üçüncü Taraflara Satılıyor mu?**
- **Hayır.**

**3. Veriler Kimlikle İlişkilendiriliyor mu?**
- **Evet.** E-posta ve sınav sonuçları kullanıcının hesabıyla (User ID) eşleşir.

**4. Veriler Reklam İçin mi Kullanılıyor?**
- **Hayır.** Sadece servis kalitesi ve kişiselleştirme için kullanılır.
