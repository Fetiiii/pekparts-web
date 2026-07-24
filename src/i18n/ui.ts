// Arayüz metinleri. Şartname §7: her dil ayrı; otomatik çeviriyle dil eklenmez,
// insan gözünden geçmemiş dil YAYINA ALINMAZ.
//
// Durum:
//   tr, en — dolu.
//   ar, ru — İSKELET. Değerler bilerek boş ("") bırakıldı; t() bunları
//            İngilizce'ye düşürür, böylece sayfa boş kalmaz ama çevirinin
//            beklediği de açıkça görünür. Çevirmen her anahtarı doldurmalı.

export const diller = ["tr", "en", "ar", "ru"] as const;
export type Dil = (typeof diller)[number];

export const varsayilanDil: Dil = "tr";
export const rtlDiller: readonly Dil[] = ["ar"];

// Dil seçicide gösterilen adlar — BAYRAK DEĞİL, dilin kendi adı (endonim).
// Şartname §7 ve §20: bayrak ikonu kullanılmaz.
export const dilAdlari: Record<Dil, string> = {
  tr: "Türkçe",
  en: "English",
  ar: "العربية",
  ru: "Русский",
};

export type UISozluk = Record<string, string>;

const tr: UISozluk = {
  "site.ad": "Pekparts",
  "site.sahip": "Pekmezcioğlu Otomotiv",
  "site.aciklama":
    "İş makinesi, jeneratör, traktör ve otobüs motorları için yedek parça. Deutz ve muadil parçalar.",

  "a11y.anaIcerige": "Ana içeriğe geç",
  "a11y.menuAc": "Menüyü aç",
  "a11y.menuKapat": "Menüyü kapat",

  "nav.anasayfa": "Ana sayfa",
  "nav.urunler": "Ürünler",
  "nav.markalar": "Markalar",
  "nav.hakkimizda": "Hakkımızda",
  "nav.iletisim": "İletişim",

  "ara.etiket": "Parça ara",
  "ara.placeholder": "Parça numarası veya ad…",
  "ara.buton": "Ara",

  "ustbar.telefon": "Telefon",
  "ustbar.whatsapp": "WhatsApp",

  "dil.sec": "Dil",

  "whatsapp.acikla": "WhatsApp'tan yazın",
  "whatsapp.mesaj": "Merhaba, bir parça hakkında bilgi almak istiyorum.",

  "hero.baslik": "Aradığınız parçayı numarasıyla bulun",
  "hero.altbaslik":
    "Deutz başta olmak üzere iş makinesi, jeneratör, traktör ve otobüs motorları için yedek parça. Numarayı girin, biz stoğu kontrol edelim.",

  "yapim.baslik": "Katalog yükleniyor",
  "yapim.metin":
    "Ürün kataloğu ve arama çok yakında burada. Şimdilik aradığınız parça için doğrudan bize ulaşın.",

  "iletisim.baslik": "Parça mı arıyorsunuz?",
  "iletisim.metin":
    "Parça numarasını veya fotoğrafı gönderin, stok durumunu aynı gün kontrol edelim.",

  "footer.hakkinda": "Kurumsal",
  "footer.iletisim": "İletişim",
  "footer.yasal": "Yasal",
  "footer.kvkk": "KVKK Aydınlatma Metni",
  "footer.cerez": "Çerez Politikası",
  "footer.haklar": "Tüm hakları saklıdır.",
  "footer.markaNot":
    "Deutz ve diğer motor markaları için yedek parça tedarik ediyoruz. Marka adları yalnızca parça uyumluluğunu belirtmek için kullanılır.",

  "genel.todo": "PekParts olarak güvenilir yedek parça çözümleri sunuyoruz.",

  // Stok / durum rozetleri
  "stok.stokta": "Stokta",
  "stok.siparise-bagli": "Siparişe bağlı",
  "stok.tukendi": "Tükendi",
  "durum.orijinal": "Orijinal",
  "durum.muadil": "Muadil",
  "durum.revizyonlu": "Revizyonlu",

  // Ürün kartı / detay
  "urun.fiyatSor": "Fiyat sor",
  "urun.uyumluMotorlar": "Uyumlu motorlar",
  "urun.marka": "Marka",
  "urun.kategori": "Kategori",
  "urun.parcaNo": "Parça no",
  "urun.muadilNo": "Muadil no",
  "urun.durumBaslik": "Durum",
  "urun.gorselYok": "Görsel hazırlanıyor",
  "urun.gorselAcilim": "{ad} — parça no {no}",
  "urun.detay": "Ürün detayı",
  "urun.digerMotor": "+{sayi} motor daha",

  // Listeleme + filtreler
  "liste.tumUrunler": "Tüm ürünler",
  "liste.kategoriBaslik": "{ad}",
  "liste.markaBaslik": "{ad} yedek parçaları",
  "liste.markaMotorBaslik": "{marka} · {motor}",
  "liste.sonucSayisi": "{sayi} ürün",
  "liste.sonucYok": "Bu filtrelerle eşleşen ürün yok.",
  "filtre.baslik": "Filtreler",
  "filtre.ac": "Filtreleri aç",
  "filtre.kategori": "Kategori",
  "filtre.marka": "Marka",
  "filtre.motor": "Motor modeli",
  "filtre.stok": "Stok durumu",
  "filtre.temizle": "Filtreleri temizle",

  // Arama
  "ara.baslik": "Arama",
  "ara.aranan": "Aranan: {sorgu}",
  "ara.sonucSayisi": "{sayi} sonuç bulundu",
  "ara.yukleniyor": "Aranıyor…",
  "ara.ipucu": "Parça numarasını boşluksuz veya boşluklu girebilirsiniz; ikisi de aynı sonucu verir.",
  "ara.jsGerekli": "Arama için tarayıcınızda JavaScript gereklidir. Aradığınız parçayı doğrudan WhatsApp'tan da sorabilirsiniz.",
  "ara.bosBaslik": "Aradığınız parçayı bulamadık",
  "ara.bosMetin":
    "Numarayı veya parçanın fotoğrafını WhatsApp'tan gönderin, stok durumunu kontrol edip size dönelim.",
  "ara.whatsappBos": "WhatsApp'tan sorun",
  "ara.waMesaj": "Merhaba, şu parçayı arıyorum: {sorgu}",

  // Teklif formu
  "teklif.baslik": "Bu parça için teklif alın",
  "teklif.aciklama": "Bilgilerinizi bırakın, genellikle aynı gün içinde dönüş yapıyoruz.",
  "form.ad": "Adınız",
  "form.iletisim": "Telefon veya e-posta",
  "form.adet": "Adet",
  "form.mesaj": "Mesajınız (opsiyonel)",
  "form.gonder": "Teklif iste",
  "form.kvkkOnay": "Kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum, onaylıyorum.",
  "form.kvkkBaglanti": "Aydınlatma metni",
  "form.zorunlu": "Zorunlu alan",
  "form.onizleme":
    "Bu bir önizlemedir; form gönderimi çok yakında etkinleşecek. Şimdilik WhatsApp veya telefondan ulaşın.",
  "form.gonderiliyor": "Gönderiliyor…",
  "teklif.onayBaslik": "Talebiniz alındı",
  "teklif.onayMetin": "Genellikle aynı gün içinde dönüş yapıyoruz.",
  "teklif.hata": "Gönderilemedi. Lütfen telefon veya WhatsApp'tan bize ulaşın.",

  // İletişim
  "iletisim.formBaslik": "Bize yazın",
  "iletisim.harita": "Konum",
  "iletisim.bilgiler": "İletişim bilgileri",

  // 404
  "404.baslik": "Sayfa bulunamadı",
  "404.metin":
    "Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Aradığınız parçayı numarasıyla bulun ya da WhatsApp'tan sorun.",
  "404.anasayfa": "Ana sayfaya dön",
};

const en: UISozluk = {
  "site.ad": "Pekparts",
  "site.sahip": "Pekmezcioğlu Otomotiv",
  "site.aciklama":
    "Spare parts for construction machinery, generator, tractor and bus engines. Deutz and aftermarket parts.",

  "a11y.anaIcerige": "Skip to main content",
  "a11y.menuAc": "Open menu",
  "a11y.menuKapat": "Close menu",

  "nav.anasayfa": "Home",
  "nav.urunler": "Products",
  "nav.markalar": "Brands",
  "nav.hakkimizda": "About",
  "nav.iletisim": "Contact",

  "ara.etiket": "Search parts",
  "ara.placeholder": "Part number or name…",
  "ara.buton": "Search",

  "ustbar.telefon": "Phone",
  "ustbar.whatsapp": "WhatsApp",

  "dil.sec": "Language",

  "whatsapp.acikla": "Message us on WhatsApp",
  "whatsapp.mesaj": "Hello, I would like information about a part.",

  "hero.baslik": "Find your part by its number",
  "hero.altbaslik":
    "Spare parts for construction machinery, generator, tractor and bus engines — Deutz first of all. Enter the number and we will check stock.",

  "yapim.baslik": "Catalogue loading",
  "yapim.metin":
    "The product catalogue and search are coming very soon. For now, reach us directly for the part you need.",

  "iletisim.baslik": "Looking for a part?",
  "iletisim.metin":
    "Send the part number or a photo and we will check availability the same day.",

  "footer.hakkinda": "Company",
  "footer.iletisim": "Contact",
  "footer.yasal": "Legal",
  "footer.kvkk": "Privacy Notice (KVKK)",
  "footer.cerez": "Cookie Policy",
  "footer.haklar": "All rights reserved.",
  "footer.markaNot":
    "We supply spare parts for Deutz and other engine brands. Brand names are used only to indicate part compatibility.",

  "genel.todo": "PekParts provides reliable spare parts solutions.",

  // Stock / condition badges
  "stok.stokta": "In stock",
  "stok.siparise-bagli": "On order",
  "stok.tukendi": "Out of stock",
  "durum.orijinal": "Original",
  "durum.muadil": "Aftermarket",
  "durum.revizyonlu": "Remanufactured",

  // Product card / detail
  "urun.fiyatSor": "Ask price",
  "urun.uyumluMotorlar": "Compatible engines",
  "urun.marka": "Brand",
  "urun.kategori": "Category",
  "urun.parcaNo": "Part no",
  "urun.muadilNo": "Cross-ref no",
  "urun.durumBaslik": "Condition",
  "urun.gorselYok": "Image coming soon",
  "urun.gorselAcilim": "{ad} — part no {no}",
  "urun.detay": "Product detail",
  "urun.digerMotor": "+{sayi} more engines",

  // Listing + filters
  "liste.tumUrunler": "All products",
  "liste.kategoriBaslik": "{ad}",
  "liste.markaBaslik": "{ad} spare parts",
  "liste.markaMotorBaslik": "{marka} · {motor}",
  "liste.sonucSayisi": "{sayi} products",
  "liste.sonucYok": "No products match these filters.",
  "filtre.baslik": "Filters",
  "filtre.ac": "Open filters",
  "filtre.kategori": "Category",
  "filtre.marka": "Brand",
  "filtre.motor": "Engine model",
  "filtre.stok": "Availability",
  "filtre.temizle": "Clear filters",

  // Search
  "ara.baslik": "Search",
  "ara.aranan": "Searched: {sorgu}",
  "ara.sonucSayisi": "{sayi} results found",
  "ara.yukleniyor": "Searching…",
  "ara.ipucu": "You can type the part number with or without spaces; both give the same result.",
  "ara.jsGerekli": "Search requires JavaScript in your browser. You can also ask us for the part directly on WhatsApp.",
  "ara.bosBaslik": "We couldn't find that part",
  "ara.bosMetin":
    "Send the number or a photo of the part on WhatsApp and we'll check availability and get back to you.",
  "ara.whatsappBos": "Ask on WhatsApp",
  "ara.waMesaj": "Hello, I'm looking for this part: {sorgu}",

  // Quote form
  "teklif.baslik": "Request a quote for this part",
  "teklif.aciklama": "Leave your details — we usually reply the same day.",
  "form.ad": "Your name",
  "form.iletisim": "Phone or e-mail",
  "form.adet": "Quantity",
  "form.mesaj": "Your message (optional)",
  "form.gonder": "Request quote",
  "form.kvkkOnay": "I have read and accept the personal data processing notice.",
  "form.kvkkBaglanti": "Privacy notice",
  "form.zorunlu": "Required field",
  "form.onizleme":
    "This is a preview; form submission goes live very soon. For now, reach us on WhatsApp or by phone.",
  "form.gonderiliyor": "Sending…",
  "teklif.onayBaslik": "Your request has been received",
  "teklif.onayMetin": "We usually get back to you the same day.",
  "teklif.hata": "Could not send. Please reach us by phone or WhatsApp.",

  // Contact
  "iletisim.formBaslik": "Write to us",
  "iletisim.harita": "Location",
  "iletisim.bilgiler": "Contact details",

  // 404
  "404.baslik": "Page not found",
  "404.metin":
    "The page you're looking for may have moved or been removed. Find your part by its number, or ask us on WhatsApp.",
  "404.anasayfa": "Back to home",
};

// İSKELET — çevirmen doldurana kadar boş. t() İngilizce'ye düşer.
const bosIskelet: UISozluk = Object.fromEntries(
  Object.keys(tr).map((k) => [k, ""]),
);

const ar: UISozluk = { ...bosIskelet };
const ru: UISozluk = { ...bosIskelet };

export const ui: Record<Dil, UISozluk> = { tr, en, ar, ru };
