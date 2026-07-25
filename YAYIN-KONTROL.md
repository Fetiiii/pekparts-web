# Yayın Günü Kontrol Listesi

Aşama 5 kodu hazır; site şu an **noindex** (indekslemeye kapalı). Yayın günü
sırayla uygulanır. Deploy henüz yapılmadı (build kredisi yükseltilince).

> Kural: indekslemeyi ancak her şey doğrulandıktan SONRA aç.

---

## 1. İndekslemeyi aç (tek yerden)

- [ ] Netlify → Environment variables → **`PUBLIC_SITE_INDEXABLE=true`**
  - Bu tek değişken: `robots.txt`'i `Allow` + `Sitemap:`'e çevirir ve tüm
    sayfalardan `<meta robots noindex>`'i kaldırır.
- [ ] `netlify.toml` içindeki **`X-Robots-Tag = "noindex, nofollow"`** satırını SİL.
  - (Bu HTTP başlığı env'den bağımsız; elle kaldırılmalı.)
- [ ] Yeniden deploy et, sonra doğrula:
  - `curl -sI https://pekparts.com/en/ | grep -i x-robots-tag` → **çıktı olmamalı**
  - `curl -s https://pekparts.com/robots.txt` → `Allow: /` + `Sitemap:` satırı

## 2. Sanity CORS + webhook

- [ ] Sanity → API → CORS origins: **`https://pekparts.com`** ve yayınlanan
  Studio adresini (`https://pekparts.sanity.studio`) ekle (credentials: allow).
- [ ] Build hook + Sanity webhook zaten kurulu (Aşama 4). Bir içerik kaydedip
  otomatik yeniden derlemenin tetiklendiğini doğrula.

## 3. E-posta (Resend) — DNS

- [ ] `pekparts.com` için Resend **SPF / DKIM / DMARC** kayıtları DNS'te yeşil mi?
  (Atlanırsa teklif e-postaları spam'e düşer — bkz. ASAMA4-KURULUM.md.)
- [ ] Gerçek bir teklif formu gönder → e-posta geliyor mu, panelde "Talep" oluştu mu?

## 4. DNS / alan adı

- [ ] `pekparts.com` (ve `www`) Netlify'a yönlendirildi (Netlify DNS veya A/CNAME).
- [ ] HTTPS sertifikası aktif.

## 5. Eski URL geçişini canlıda doğrula (§11)

- [ ] `curl -sI https://pekparts.com/deutz/p/1504` → **301**, `location: /en/urun/04289952/`
- [ ] `curl -sI https://pekparts.com/gaskets-albania` → **410**
- [ ] `curl -sI https://pekparts.com/cnh/k/245` → **301** `/en/marka/cnh/`
- [ ] `curl -sI https://pekparts.com/` → **301** `/en/`
  (Yerelde karar mantığı testli: `node --experimental-strip-types netlify/edge-functions/eski-url.test.mjs`)

## 6. SEO son adımlar

- [ ] Google Search Console'a mülk ekle, **sitemap gönder**: `https://pekparts.com/sitemap-index.xml`
- [ ] Bir ürün sayfasını **Rich Results Test**'ten geçir (Product; fiyat yok, uyarı normal).
- [ ] Google Analytics (isteğe bağlı) — firma hesabından.

## 7. Kalan içerik / görsel

- [ ] **Varsayılan OG görseli:** `public/og-pekparts.png` ekle (1200×630, logolu).
  Ürün sayfalarında zaten ilk ürün görseli OG'ye giriyor; bu genel sayfalar için.
- [ ] Hakkımızda / KVKK / Çerez metinleri Sanity "Sayfa Metinleri"nde dolu mu?
  (Boşsa `CANLI=1` derlemesi yer-tutucu koruması ile DURUR.)
- [ ] AR / RU arayüz çevirileri insan gözünden geçti mi? (Geçmediyse o dilleri
  menüden gizlemeyi değerlendir — otomatik çeviri yayınlanmaz, şartname kuralı.)

## 8. Performans (yerel ölç, bu ortamda çalıştırılamadı)

- [ ] `CANLI=1 npm run build && npx serve dist` (veya Netlify preview) üzerinde
  bir **ürün** ve bir **liste** sayfasında Lighthouse çalıştır.
- [ ] Hedef: Performans ve Erişilebilirlik ≥ 90. Görseller WebP + lazy + boyut;
  ürün görsellerinde parça adı+no `alt` (kodda hazır).

---

## Geri alma (gerekirse)

- İndekslemeyi kapat: `PUBLIC_SITE_INDEXABLE=false` + `X-Robots-Tag` satırını geri koy.
- Eski URL kuralları: `netlify/edge-functions/eski-url.ts` (haritalar `lib/eski-url-karar.ts`).
