import type { Ayarlar } from "./lib/tipler";

// Marka kimliği — değişmez sabitler (ad/unvan/alan adı). İletişim bilgileri
// artık Sanity `siteAyarlari`'ndan gelir (bkz. lib/ayarlar.ts); aşağıdaki
// `varsayilanAyarlar` yalnızca GELİŞTİRME yedeğidir (Sanity yapılandırılmadan).

export const marka = {
  ad: "Pekparts",
  unvan: "Pekmezcioğlu Otomotiv", // TODO: tam resmi unvan (Sanity'de de tutulabilir)
  alanAdi: "pekparts.com",
} as const;

// Geliştirme yedeği — Şartname §15: gerçeği panelden (siteAyarlari) girilecek.
// Bu değerler YER TUTUCUDUR ve yalnızca dev'de kullanılır.
export const varsayilanAyarlar: Ayarlar = {
  telefon: "+90 000 000 00 00",
  whatsapp: "900000000000",
  eposta: "info@pekparts.com",
  talepEpostasi: "talep@pekparts.com",
  adres: "[Adres firmadan alınacak]",
  calismaSaatleri: "[Çalışma saatleri firmadan alınacak]",
  sosyal: [],
  eksik: true, // yer tutucu işareti — kontroller bunu izler
};

/** wa.me bağlantısı, isteğe bağlı ön-doldurulmuş mesajla. */
export function whatsappLink(whatsapp: string, mesaj?: string): string {
  const taban = `https://wa.me/${whatsapp}`;
  return mesaj ? `${taban}?text=${encodeURIComponent(mesaj)}` : taban;
}

/** tel: bağlantısı için numarayı sadeleştirir. */
export function telLink(telefon: string): string {
  return `tel:${telefon.replace(/[^\d+]/g, "")}`;
}
