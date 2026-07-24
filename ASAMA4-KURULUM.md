# Aşama 4 — Kurulum (kimlik bilgisi gerektiren adımlar)

Kod tamamlandı ve test edildi. Aşağıdaki adımlar **senin hesaplarını/anahtarlarını**
gerektirir; bu ortamda yapılamaz. Sırayla uygulanınca panel + form + otomatik
yayın çalışır hale gelir.

> **Not:** Sıra önemli. Önce Sanity (içerik), sonra Resend (e-posta), en son
> Netlify (barındırma + form + webhook).

---

## 1. Sanity projesi (yönetim paneli)

```bash
cd studio
npm install
npx sanity login          # Google/GitHub ile giriş
npx sanity init --env     # yeni proje oluştur, projectId'yi .env'e yazar
```

`init` sonrası `studio/.env` içine `SANITY_STUDIO_PROJECT_ID` gelir. Paneli aç:

```bash
npm run dev               # http://localhost:3333
```

İçerik girişi:

1. **Site Ayarları** dokümanını doldur (telefon, WhatsApp, e-posta, **talep
   e-postası**, adres, çalışma saatleri, harita gömme bağlantısı). Site tüm
   iletişim bilgilerini buradan okur — koda gömülü telefon yok.
2. **Markalar** ve **Kategoriler**'i gir (ya da Excel'den).
3. **Ürünler**: "Excel Aktarım" aracıyla boş şablonu indir, doldur, yükle.
   Önizlemede kaç yeni/güncelleme/hatalı göreceksin; hatalı satırlar satır
   numarasıyla listelenir. Görseller: "Toplu Görsel" aracıyla dosya adı parça
   numarasıyla (`04910987-1.jpg`) otomatik eşleşir.
4. **Sayfa Metinleri**: Hakkımızda, KVKK, Çerez Politikası metinlerini gir.
   (Doldurulmazsa site yer tutucu gösterir ve **canlı derleme durur** — bkz. §6.)

Paneli yayınla (işletme sahibi tarayıcıdan erişsin):

```bash
npx sanity deploy         # https://pekparts.sanity.studio gibi bir adres
```

> **Panel dili:** Alan etiketleri/yardım metinleri Türkçe. Sanity arayüz
> kabuğu (Publish vb.) için resmi Türkçe paketi yoksa İngilizce kalır; bu
> işletme sahibini etkileyen alan etiketleri Türkçedir.

---

## 2. Resend (teklif e-postaları) — **EN KRİTİK ADIM**

Bu sitenin ürettiği tek gerçek değer teklif e-postalarıdır. Alan adı doğrulaması
atlanırsa e-postalar **spam klasörüne düşer ve kimse fark etmez** — proje
işlevsiz kalır.

1. [resend.com](https://resend.com) hesabı aç.
2. **Domains → Add Domain → `pekparts.com`**.
3. Resend'in verdiği **DNS kayıtlarını mutlaka gir** (alan adı sağlayıcısının
   DNS panelinde):
   - **SPF** (TXT)
   - **DKIM** (CNAME/TXT — Resend'in verdiği anahtarlar)
   - **DMARC** (TXT, önerilir: `v=DMARC1; p=none; rua=mailto:...`)
   Doğrulama yeşile dönene kadar bekle. **Bu adımı atlama.**
4. **API Keys → Create** → anahtarı `RESEND_API_KEY` olarak sakla.
5. Gönderici adresi kendi alan adından: `TEKLIF_FROM="Pekparts <bildirim@pekparts.com>"`.

E-postada `reply-to` müşterinin adresine ayarlanır (müşteri e-posta bıraktıysa):
işletme sahibi gelen bildirime doğrudan "yanıtla" der, müşteriye ulaşır.

---

## 3. Sanity yazma token'ı (panele talep kaydı)

Form gönderimleri panelde "Talepler" altında birikir. Bunun için yazma yetkili token:

- Sanity → **API → Tokens → Add token** → yetki **Editor** → `SANITY_WRITE_TOKEN`.

---

## 4. Netlify (barındırma + form + otomatik yayın)

1. Depoyu Netlify'a bağla. `netlify.toml` hazır (build `npm run build`, publish
   `dist`, functions `netlify/functions`).
2. **Site settings → Environment variables** (hepsi):
   | Değişken | Değer |
   |---|---|
   | `CANLI` | `1` |
   | `SANITY_PROJECT_ID` | Sanity proje ID |
   | `SANITY_DATASET` | `production` |
   | `RESEND_API_KEY` | Resend anahtarı |
   | `TEKLIF_FROM` | `Pekparts <bildirim@pekparts.com>` |
   | `SANITY_WRITE_TOKEN` | Sanity Editor token |
   | `TALEP_EPOSTA` | (yedek; asıl adres panelden) |

   `CANLI=1` sayesinde: Sanity zorunlu, seed/yer tutucu sızarsa build **durur**.
3. Deploy et. Form otomatik olarak `/.netlify/functions/teklif`'e gider.

---

## 5. Otomatik yeniden yayın (webhook)

Site statik; panelde yapılan değişiklik kendiliğinden yayına çıkmaz. Bağla:

1. Netlify → **Build & deploy → Build hooks → Add build hook** → URL'i kopyala.
2. Sanity → **API → Webhooks → Create webhook**:
   - URL: Netlify build hook URL'i
   - Trigger: create/update/delete
   - Filter (opsiyonel): `_type in ["urun","marka","kategori","siteAyarlari","sayfa"]`
3. Artık panelde kaydedilen değişiklik birkaç dakika içinde siteye yansır.

Panelde "Aktar" / kaydet sonrası kullanıcıya *"Değişiklikler birkaç dakika içinde
sitede görünecek"* notu gösterilir (statik site kafa karışıklığını önlemek için).

---

## Test edilenler (bu ortamda, kimlik bilgisi olmadan)

- **Excel motoru:** 300+ satır, hatalı/tekrarlı/Türkçe/boş — `cd studio && npm run test:excel` (28/28).
- **Teklif çekirdeği:** honeypot/KVKK/oran/konu/reply-to — `node --experimental-strip-types netlify/functions/lib/teklif-core.test.ts` (14/14).
- **Kontroller:** `CANLI=1` Sanity olmadan derlemeyi durdurur; yer tutucu metin sızıntısı tespiti çalışır.

## Bu ortamda yapılamayanlar (yukarıdaki adımlar tamamlanınca çalışır)

- Canlı Sanity projesi/deploy, gerçek e-posta teslimi, Netlify build hook, uçtan uca test.
