# Pekparts — Web Sitesi Yeniden Yapım Şartnamesi

**Müşteri:** Pekmezcioğlu Otomotiv / Pekparts
**Alan adı:** pekparts.com
**Durum:** Mevcut site kapalı. Sıfırdan yeniden inşa.
**Belge amacı:** Geliştirme boyunca tek referans kaynağı. Claude Code oturumlarına bağlam olarak verilir.

---

## 1. Proje özeti

Pekparts; iş makinesi, jeneratör, traktör ve otobüs motorları için yedek parça satan bir firmadır. Ürün grupları: conta takımları, filtreler, motor parçaları ve komple motorlar. Ağırlıklı çalıştığı marka Deutz'dür, diğer markalar netleştirilecek.

Site **vitrin/katalog + teklif toplama** amaçlıdır. Online satış yoktur, sepet yoktur, ödeme altyapısı yoktur.

### Başarı ölçütü

Sitenin tek bir işi var: bir parça arayan kişinin o parçayı bulup firmaya ulaşmasını sağlamak. Her tasarım ve teknik karar bu ölçüte göre değerlendirilir.

### Eski sitenin başarısız olma nedenleri (tekrarlanmayacak)

- Yüzlerce otomatik üretilmiş "ülke + anahtar kelime" sayfası (`/spare-parts-israel`, `/gaskets-nepal` vb.), hepsinde birebir aynı şablon metin. Kopya içerik, arama motorlarında değersiz.
- Şablon değişkenleri doldurulmamış, metinlerde firma adının geçmesi gereken yerler boş kalmış.
- Ürün başlıklarına Türkçe ad, İngilizce ad ve parça numarası tek alana sıkıştırılmış.
- Veri tutarsızlıkları (aynı üründe iki farklı parça numarası, tekrar eden başlıklar, eksik görseller).
- Ana sayfada firma tanıtımı ve değer önerisi yok, doğrudan ürün listesiyle başlıyor.
- Dil seçimi 9 bayrak ikonuyla yapılıyor.

---

## 2. Karar bekleyen maddeler

Kodlamaya başlamadan önce netleşmesi gerekenler:

| # | Konu | Seçenekler | Not |
|---|------|-----------|-----|
| 1 | Eski veri yedeği | Firmada mevcut mu, yoksa Wayback'ten mi çekilecek | Doğrulanıyor. Fotoğraflar kritik. |
| 2 | Dil seti | Öneri: TR, EN, AR, RU | Gerçekten çeviri yapılabilecek diller seçilmeli |
| 3 | CMS | Sanity (barındırılan) / Decap (repo tabanlı) | Bkz. bölüm 8 |
| 4 | Görsel yön | Bölüm 10'daki öneri onaylanacak | |
| 5 | Marka listesi | Deutz dışında hangi markalar | Ürün verisi gelince netleşir |
| 6 | Kurumsal bilgiler | Kuruluş yılı, adres, vergi dairesi, gerçek istatistikler | Taslaklardaki tüm rakamlar yer tutucudur |
| 7 | Kolbenschmidt vb. marka logoları | Yetkili bayilik var mı | Yoksa logo kullanılmaz |
| 8 | Barındırma hesabı | Kimin adına açılacak | Alan adı ve hesapların firmada olması şart |

---

## 3. Teknik yığın

- **Framework:** Astro (statik site üretimi)
- **Stil:** Tailwind CSS
- **İçerik:** Astro Content Collections + headless CMS (bkz. bölüm 8)
- **Arama:** Pagefind veya Fuse.js ile istemci tarafı arama (sunucu gerekmez)
- **Form işleme:** Netlify Forms veya Formspree; alternatif olarak basit bir serverless fonksiyon
- **Barındırma:** Netlify veya Cloudflare Pages
- **Görsel işleme:** Astro'nun yerleşik `<Image>` bileşeni, WebP çıktı, `loading="lazy"`

### Neden Astro

Katalog içeriği statik üretilebilir, sayfa açılışında JavaScript gönderilmez. Sahadan mobil bağlantıyla giren müşteri için hız doğrudan dönüşüm demektir. i18n yönlendirmesi yerleşiktir; her dil ayrı statik sayfa olarak üretilir ve düzgün indekslenir. WordPress bilinçli olarak elenmiştir: eklenti bağımlılığı, güvenlik güncellemesi ve barındırma bakımı işletme sahibinin üzerinde kalır.

---

## 4. Sayfa yapısı

```
/                          Ana sayfa
/urunler                   Tüm ürünler, filtreli
/urunler/[kategori]        Kategori listesi
/marka/[marka]             Markaya göre liste
/marka/[marka]/[motor]     Motor modeline göre liste
/urun/[parca-no]           Ürün detay
/ara                       Arama sonuçları
/hakkimizda                Kurumsal
/iletisim                  İletişim
/kvkk, /cerez-politikasi   Yasal
```

Her yol dil önekiyle üretilir: `/tr/...`, `/en/...`, `/ar/...`, `/ru/...`

### Ana sayfa bölümleri (sırayla)

1. Üst bar: telefon, WhatsApp, dil seçici
2. Header: logo, ana menü, ürün arama
3. Hero: firmanın ne yaptığı + büyük parça numarası arama kutusu (sayfanın odağı)
4. Kategoriler (4 kutu)
5. Markaya göre gözat (etiket listesi)
6. Öne çıkan / yeni eklenen ürünler (8 adet, tek satır)
7. Firma tanıtımı: kısa metin + gerçek tesis fotoğrafı
8. İletişim şeridi: "Parça mı arıyorsunuz?" + WhatsApp/telefon
9. Footer

Sabit WhatsApp butonu tüm sayfalarda sağ altta.

---

## 5. Veri modeli

### Ürün

**Dilden bağımsız alanlar:**

| Alan | Tip | Zorunlu | Not |
|------|-----|---------|-----|
| `parcaNo` | string | evet | Birincil anahtar. URL bundan üretilir. |
| `muadilNo` | string[] | hayır | Çapraz referans numaraları |
| `marka` | enum | evet | Deutz, Perkins, Cummins vb. |
| `kategori` | enum | evet | |
| `uyumluMotorlar` | string[] | hayır | Örn. `["TCD 2012 L04", "BF4M 2012"]` |
| `stokDurumu` | enum | evet | `stokta` / `siparise-bagli` / `tukendi` |
| `durum` | enum | evet | `orijinal` / `muadil` / `revizyonlu` |
| `fiyat` | number | hayır | **Sitede gösterilmez.** Bkz. aşağıda. |
| `paraBirimi` | enum | hayır | TRY / USD / EUR |
| `gorseller` | image[] | hayır | İlk görsel kapak |
| `oneCikan` | boolean | hayır | Ana sayfada gösterim |

**Dile bağlı alanlar (her dil için ayrı):**

| Alan | Tip | Zorunlu |
|------|-----|---------|
| `ad` | string | evet |
| `aciklama` | text | hayır |

### Fiyat politikası

Fiyat alanı veritabanında tutulur, panelden güncellenir, **ancak sitede gösterilmez.** Ürün sayfasında "Fiyat sor" görünür.

Gerekçe: rakip firmalar fiyat listesini gözlemleyebilir; bayi ile son kullanıcıya farklı fiyat verme esnekliği kaybolur. Veri şimdiden tutulduğu için ileride bayi girişi eklenirse altyapı hazır olur.

### Marka ve kategori

Ayrı koleksiyonlar olarak tutulur (`slug`, ad çevirileri, açıklama, görsel). Ürün içine gömülmez — böylece marka sayfaları kendi içeriğine sahip olur.

---

## 6. Arama gereksinimleri

Sitenin en kritik işlevi. Şu kurallar zorunludur:

- **Numara normalizasyonu:** Arama yapılırken hem sorgudaki hem verideki boşluk, tire ve nokta temizlenir. `04175848`, `0417 5848` ve `0417-5848` aynı sonucu vermelidir.
- **Çoklu alan taraması:** `parcaNo`, `muadilNo`, ürün adı (tüm diller) ve `uyumluMotorlar` üzerinde arama yapılır.
- **Kısmi eşleşme:** Numaranın son 4-5 hanesiyle arama sonuç vermelidir.
- **Boş sonuç ekranı:** "Sonuç bulunamadı" yeterli değildir. Şu görünmelidir: "Aradığınız parçayı bulamadık. Numarayı veya fotoğrafı WhatsApp'tan gönderin, stok durumunu kontrol edelim." + WhatsApp butonu. **Bu ekran bir kayıp değil, bir dönüşüm noktasıdır.**
- Arama kutusu her sayfanın header'ında bulunur.

---

## 7. Çok dillilik

- URL yapısı: `/tr/`, `/en/`, `/ar/`, `/ru/` — dil önekli, alt alan adı değil
- Dil seçici **bayrak değil, dil adı** gösterir: `Türkçe · English · العربية · Русский`
- Arapça için `dir="rtl"` ve tam RTL düzen desteği **baştan** kurulur, sonradan eklenmez
- Her sayfada `hreflang` etiketleri
- Çevirisi olmayan ürün, o dilde İngilizce adıyla gösterilir; sayfa hiç boş kalmaz
- Arayüz metinleri (buton, etiket, hata mesajı) ayrı çeviri dosyalarında tutulur

**Kural:** Otomatik çeviriyle dil eklenmez. Bir dil ancak insan gözünden geçmişse yayına alınır. Eski sitenin hatası tam olarak buydu.

---

## 8. Yönetim paneli

İşletme sahibi ürünleri ve fiyatları kendisi güncelleyebilmelidir. Geliştiriciye bağımlılık olmamalıdır.

### CMS seçenekleri

**Sanity** — barındırılan, gerçek veritabanı, güçlü görsel yönetimi, çoklu dil desteği olgun. Ücretsiz katman küçük işletme için fazlasıyla yeterli. Kurulumu biraz daha uzun.

**Decap CMS** — dosya tabanlı, veri Git deposunda durur, tamamen ücretsiz, ek servis yok. Çok fazla ürün ve görselde yönetimi zorlaşır.

Ürün sayısı birkaç yüzü aşıyorsa **Sanity önerilir.**

### Panel gereksinimleri

- Ürün formu: üstte dilden bağımsız alanlar, altta dil sekmeleri (yalnızca ad + açıklama)
- **Excel ile toplu içe aktarma ve güncelleme.** Şablon indirilir, doldurulur, yüklenir. Fiyat güncellemeleri bu yolla toplu yapılır. Yüzlerce ürün için tek tek giriş kabul edilemez.
- Görsel yükleme: sürükle-bırak, otomatik yeniden boyutlandırma ve WebP dönüşümü
- Kategori ve marka yönetimi
- **Gelen talepler kutusu:** form gönderimleri panelde birikir, "cevaplandı" işaretlenebilir. Yalnızca e-postaya güvenilmez.
- Arayüz Türkçe

---

## 9. Teklif formu akışı

Ürün detay sayfasında, sayfayı terk etmeden doldurulur.

**Alanlar:** ad, telefon veya e-posta, adet, opsiyonel mesaj. Parça numarası ve ürün adı gizli alan olarak otomatik eklenir.

**Gönderim sonrası:**
1. İşletmeye e-posta — konu satırında parça numarası
2. Panele kayıt
3. Kullanıcıya net onay ekranı: "Talebiniz alındı. Genellikle aynı gün içinde dönüş yapıyoruz."

**Spam koruması:** honeypot alanı + basit oran sınırlama. CAPTCHA kullanılmaz — B2B müşterisini yorar.

**KVKK:** Formda açık rıza onay kutusu ve aydınlatma metni bağlantısı zorunludur.

---

## 10. Görsel yön (öneri — onay bekliyor)

Yön, konunun kendi dünyasından türetilmiştir: **teknik parça kataloğu.** Bu sektörün gerçek görsel dili süslü değil, kataloğa özgüdür — damgalanmış parça numaraları, tablo düzenleri, net etiketleme.

**Palet**

| Rol | Değer | Not |
|-----|-------|-----|
| Mürekkep | `#161A1D` | Ana metin, koyu yüzeyler |
| Kağıt | `#FBFAF8` | Sayfa zemini |
| Yüzey | `#F1F0ED` | Kart zemini |
| Vurgu | `#12324B` | Derin mürekkep mavisi — bağlantılar, birincil buton |
| İkincil vurgu | `#B26B2E` | Pirinç/bakır — parça numarası vurgusu, rozet |
| Kenarlık | `#DDDCD7` | |

Bakır tonu keyfi değil: contalar, burçlar ve yataklar bu renktedir. Eski sitenin parlak camgöbeği mavisi (`#00A0F0`) ucuz duruyordu, terk edilir.

**Tipografi**

- Gövde ve başlık: **IBM Plex Sans** — mühendislik kökenli, Latin/Kiril desteği tam
- Arapça: **IBM Plex Sans Arabic**
- Parça numaraları ve teknik veri: **IBM Plex Mono**

**İmza öğe:** Parça numarası. Site boyunca tek tip, monospace, hafif harf aralıklı, damgalanmış gibi görünür — kartta, detay sayfasında, arama kutusunda, teklif formunda, e-posta konu satırında. Katalog kimliğini taşıyan tek görsel motif budur; başka her şey sakin kalır.

**Kaçınılacaklar:** gradyan, gölge, stok fotoğraf, döner slider, karşılama animasyonu.

---

## 11. SEO ve eski siteden geçiş

Eski sitenin yüzlerce indekslenmiş spam URL'si var. Bunlar başıboş bırakılmaz.

- Eski ülke/anahtar kelime sayfaları (`/spare-parts-israel` vb.) için **410 Gone** döndürülür. Yeni sayfalara 301 yönlendirme yapılmaz — alakasız içerik yönlendirmek yeni siteye zarar verir.
- Gerçek karşılığı olan eski ürün sayfaları yeni ürün URL'lerine **301** ile yönlendirilir.
- `sitemap.xml` otomatik üretilir, `robots.txt` yazılır
- Her ürün sayfasına **schema.org Product** yapılandırılmış verisi; firma için **LocalBusiness**
- Her sayfaya benzersiz `title` ve `meta description` — şablon metin tekrarı yasak
- Open Graph etiketleri (WhatsApp'ta paylaşıldığında düzgün önizleme çıkması için — bu sektörde link WhatsApp'ta dolaşır)
- Google Search Console ve Analytics kurulumu, firma hesabı üzerinden

---

## 12. Performans, erişilebilirlik ve kalite eşiği

- Lighthouse: performans ve erişilebilirlik ≥ 90
- Mobil öncelikli. Sahadan telefonla giren kullanıcı birincil senaryodur.
- Tüm görsellerde `alt` metni; ürün görsellerinde parça adı ve numarası
- Klavye ile tam gezinilebilirlik, görünür odak halkası
- `prefers-reduced-motion` desteklenir
- Renk kontrastı WCAG AA
- Test: Chrome, Safari, Firefox + iOS ve Android

---

## 13. Yasal

- KVKK aydınlatma metni ve form onayı
- Çerez bildirimi (yalnızca analitik çerez varsa; zorunlu olmayan çerez varsayılan kapalı)
- Marka logoları yalnızca yetkili bayilik varsa kullanılır. Aksi halde metinle belirtilir: "Deutz motorlar için yedek parça tedarik ediyoruz."
- Ürün görsellerine köşede küçük filigran. Eski sitedeki gibi görselin ortasını kaplayan büyük filigran kullanılmaz.
- Firma unvanı, adres ve iletişim bilgileri footer'da

---

## 14. Aşamalar

**1. Temel** — Astro kurulumu, i18n yönlendirmesi, tasarım tokenları, layout, header/footer

**2. Katalog** — içerik şeması, ürün listeleme, filtreler, ürün detay, arama

**3. İçerik** — veri aktarımı, gerçek görseller, kurumsal metinler, çeviriler

**4. Panel** — CMS kurulumu, Excel içe aktarma, form akışı, talep kutusu

**5. Yayın** — SEO, yönlendirmeler, performans, yayına alma, işletme sahibine 30 dakikalık panel eğitimi

---

## 15. İşletmeden alınacaklar

- [ ] Eski site veri yedeği (ürün listesi + görsel klasörü)
- [ ] Logonun vektörel hali (SVG/AI/PDF)
- [ ] Tesis ve ekip fotoğrafları — **stok fotoğraf kullanılmaz**, yedek parçada güveni bitirir
- [ ] Firma metni: kuruluş yılı, geçmiş, kapasite, ihracat yapılan ülkeler
- [ ] Doğru iletişim bilgileri: telefon, WhatsApp hattı, e-posta, tam adres, çalışma saatleri
- [ ] Alan adı ve barındırma hesap erişimleri
- [ ] Varsa yetkili bayilik belgeleri
- [ ] Talep bildirimlerinin gideceği e-posta adresi

---

## 16. Kapsam dışı

Bu sürümde yapılmayacaklar: online satış ve ödeme, üyelik/bayi girişi, canlı stok entegrasyonu, blog, çoklu para birimi gösterimi, mobil uygulama.

Bayi girişi ileride eklenebilecek şekilde veri modeli hazırlanmıştır.
