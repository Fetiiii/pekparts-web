// Kaynak-bağımsız paylaşılan tipler. Hem içerik-dosyası hem Sanity adaptörü
// aynı ZenginUrun/Ayarlar şeklini üretir; sayfalar kaynağı bilmez.

export interface Cevrilebilir {
  tr: string;
  en?: string;
  ar?: string;
  ru?: string;
}

export interface Motor {
  ad: string; // "TCD 2012 L04"
  slug: string; // "tcd-2012-l04"
}

export interface Gorsel {
  url: string | null; // çözülmüş kaynak (yerel yol veya Sanity CDN); yoksa null → yer tutucu
  alt?: Cevrilebilir;
}

export interface ZenginUrun {
  id: string;
  parcaNo: string;
  slug: string;
  muadilNo: string[];
  markaSlug: string;
  markaAd: string;
  kategoriSlug: string;
  kategoriAd: Cevrilebilir;
  motorlar: Motor[];
  stokDurumu: "stokta" | "siparise-bagli" | "tukendi";
  oneCikan: boolean;
  gorseller: Gorsel[];
  ad: Cevrilebilir;
  aciklama?: Cevrilebilir;
}

export interface Ayarlar {
  telefon: string;
  whatsapp: string; // yalnız rakam (wa.me)
  eposta: string;
  talepEpostasi?: string;
  adres: string;
  calismaSaatleri: string;
  haritaGomu?: string;
  sosyal: { etiket: string; url: string }[];
  eksik: boolean; // true = geliştirme yer tutucusu (Sanity yapılandırılmamış)
}
