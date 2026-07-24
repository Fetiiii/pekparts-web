// Pekparts — Excel toplu ürün aktarım motoru (§8).
// Saf modül: hem Node (test/CLI) hem tarayıcı (Sanity aracı) içinde çalışır.
// Sorumluluk: şablon üret · ayrıştır · satır-satır DOĞRULA · yeni/güncelleme
// farkını çıkar · kısmi aktarım için geçerli ürünleri ver · dışa aktar.
//
// Kural: parça numaraları İÇERİ ALINIRKEN NORMALİZE EDİLMEZ — kullanıcının
// girdiği biçim korunur. Normalizasyon yalnızca kimlik/tekrar tespitinde
// (aynı parçanın "0417 5848" ve "04175848" gibi iki yazımını yakalamak için)
// kullanılır; saklanan değer her zaman kullanıcının yazdığıdır.

import ExcelJS from "exceljs";

export const DILLER = ["tr", "en", "ar", "ru"] as const;
export type Dil = (typeof DILLER)[number];

// ————————————————————————————————————————————————
// Kolon tanımları — şablon ve ayrıştırma bunları kullanır.
// ————————————————————————————————————————————————
export interface Sutun {
  anahtar: string;
  baslik: string;
  aciklama: string;
  ornek: string;
  zorunlu?: boolean;
}

export const SUTUNLAR: Sutun[] = [
  { anahtar: "parcaNo", baslik: "Parça No", aciklama: "Zorunlu. Ürünün ana parça numarası. Girdiğiniz biçim korunur.", ornek: "04175848", zorunlu: true },
  { anahtar: "muadilNo", baslik: "Muadil No", aciklama: "Çapraz referans numaraları. Birden fazlaysa virgül veya noktalı virgülle ayırın.", ornek: "0417 5848; 4175848" },
  { anahtar: "marka", baslik: "Marka", aciklama: "Zorunlu. Tanımlı bir marka (slug veya adı). Örn: deutz, Perkins.", ornek: "deutz", zorunlu: true },
  { anahtar: "kategori", baslik: "Kategori", aciklama: "Zorunlu. Tanımlı bir kategori (slug veya adı).", ornek: "yakit-sistemi", zorunlu: true },
  { anahtar: "uyumluMotorlar", baslik: "Uyumlu Motorlar", aciklama: "Motor modelleri, virgülle ayrılmış.", ornek: "TCD 2012 L04, BF4M 2012" },
  { anahtar: "stokDurumu", baslik: "Stok Durumu", aciklama: "Zorunlu. Değerler: Stokta / Siparişe bağlı / Tükendi.", ornek: "Stokta", zorunlu: true },
  { anahtar: "durum", baslik: "Durum", aciklama: "Zorunlu. Değerler: Orijinal / Muadil / Revizyonlu.", ornek: "Orijinal", zorunlu: true },
  { anahtar: "fiyat", baslik: "Fiyat", aciklama: "Sayı, opsiyonel. Sitede gösterilmez, panelde saklanır.", ornek: "96200" },
  { anahtar: "paraBirimi", baslik: "Para Birimi", aciklama: "TRY / USD / EUR.", ornek: "TRY" },
  { anahtar: "oneCikan", baslik: "Öne Çıkan", aciklama: "Ana sayfada gösterilsin mi? Evet / Hayır.", ornek: "Hayır" },
  { anahtar: "yayinda", baslik: "Yayında", aciklama: "Sitede yayınlansın mı? Evet / Hayır. Boşsa Evet kabul edilir.", ornek: "Evet" },
  { anahtar: "eklenmeTarihi", baslik: "Eklenme Tarihi", aciklama: "Opsiyonel. GG.AA.YYYY veya YYYY-AA-GG. Boşsa bugünün tarihi.", ornek: "2026-05-14" },
  { anahtar: "ad_tr", baslik: "Ad (TR)", aciklama: "Zorunlu. Türkçe ürün adı.", ornek: "Deutz yakıt enjeksiyon pompası", zorunlu: true },
  { anahtar: "ad_en", baslik: "Ad (EN)", aciklama: "İngilizce ürün adı.", ornek: "Deutz fuel injection pump" },
  { anahtar: "ad_ar", baslik: "Ad (AR)", aciklama: "Arapça ürün adı.", ornek: "" },
  { anahtar: "ad_ru", baslik: "Ad (RU)", aciklama: "Rusça ürün adı.", ornek: "" },
  { anahtar: "aciklama_tr", baslik: "Açıklama (TR)", aciklama: "Türkçe açıklama, opsiyonel.", ornek: "" },
  { anahtar: "aciklama_en", baslik: "Açıklama (EN)", aciklama: "İngilizce açıklama, opsiyonel.", ornek: "" },
  { anahtar: "aciklama_ar", baslik: "Açıklama (AR)", aciklama: "Arapça açıklama, opsiyonel.", ornek: "" },
  { anahtar: "aciklama_ru", baslik: "Açıklama (RU)", aciklama: "Rusça açıklama, opsiyonel.", ornek: "" },
];

// ————————————————————————————————————————————————
// Ürün veri şekli — content.config.ts ile BİREBİR (§8: ayrışırsa aktarım bozulur).
// ————————————————————————————————————————————————
export interface Cevrilebilir {
  tr: string;
  en?: string;
  ar?: string;
  ru?: string;
}
export interface UrunVeri {
  parcaNo: string;
  muadilNo: string[];
  marka: string; // slug
  kategori: string; // slug
  uyumluMotorlar: string[];
  stokDurumu: "stokta" | "siparise-bagli" | "tukendi";
  durum: "orijinal" | "muadil" | "revizyonlu";
  fiyat?: number;
  paraBirimi?: "TRY" | "USD" | "EUR";
  oneCikan: boolean;
  yayinda: boolean;
  eklenmeTarihi: string; // YYYY-MM-DD
  ad: Cevrilebilir;
  aciklama?: Cevrilebilir;
}

export interface Baglam {
  markalar: { slug: string; ad: string }[];
  kategoriler: { slug: string; adlar: string[] }[]; // tüm dillerdeki adlar
  mevcutParcaNolar: string[]; // güncelleme/yeni ayrımı için
}

export type Islem = "yeni" | "guncelleme" | "hata";

export interface SatirSonuc {
  satir: number; // gerçek Excel satır numarası
  parcaNo: string;
  islem: Islem;
  hatalar: string[];
  urun?: UrunVeri;
}

export interface Rapor {
  toplam: number;
  yeni: number;
  guncelleme: number;
  hatali: number;
  satirlar: SatirSonuc[];
  gecerliUrunler: UrunVeri[]; // kısmi aktarım için (hatasız satırlar)
}

// ————————————————————————————————————————————————
// Yardımcılar
// ————————————————————————————————————————————————

/** Yalnızca EŞLEŞTİRME için normalizasyon (arama indeksiyle aynı kural). */
export function anahtarla(deger: string): string {
  return deger.toLowerCase().replace(/[\s.\-_/]/g, "");
}

function metin(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "text" in (v as any)) return String((v as any).text).trim();
  return String(v).trim();
}

function listeAyir(v: unknown): string[] {
  return metin(v)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const EVET = new Set(["evet", "e", "true", "1", "yes", "y", "x", "var", "✓"]);
const HAYIR = new Set(["hayir", "hayır", "h", "false", "0", "no", "n", "yok", ""]);

function boolCoz(v: unknown, varsayilan: boolean): { deger: boolean; hata?: string } {
  const s = metin(v).toLowerCase();
  if (s === "") return { deger: varsayilan };
  if (EVET.has(s)) return { deger: true };
  if (HAYIR.has(s)) return { deger: false };
  return { deger: varsayilan, hata: `"${metin(v)}" Evet/Hayır olarak anlaşılamadı` };
}

const STOK_ESLEME: Record<string, UrunVeri["stokDurumu"]> = {
  stokta: "stokta",
  "siparise-bagli": "siparise-bagli",
  "sipariseb agli": "siparise-bagli",
  "siparise bagli": "siparise-bagli",
  "siparişe bağlı": "siparise-bagli",
  "siparişe bagli": "siparise-bagli",
  tukendi: "tukendi",
  tükendi: "tukendi",
  "on order": "siparise-bagli",
  "in stock": "stokta",
  "out of stock": "tukendi",
};
const DURUM_ESLEME: Record<string, UrunVeri["durum"]> = {
  orijinal: "orijinal",
  original: "orijinal",
  muadil: "muadil",
  aftermarket: "muadil",
  revizyonlu: "revizyonlu",
  remanufactured: "revizyonlu",
  revizeli: "revizyonlu",
};
const PARA_ESLEME: Record<string, UrunVeri["paraBirimi"]> = {
  try: "TRY", tl: "TRY", "₺": "TRY",
  usd: "USD", "$": "USD", dolar: "USD",
  eur: "EUR", "€": "EUR", euro: "EUR",
};

function tarihCoz(v: unknown): { deger?: string; hata?: string } {
  const s = metin(v);
  if (s === "") return { deger: new Date().toISOString().slice(0, 10) };
  if (v instanceof Date && !isNaN(v.getTime())) return { deger: v.toISOString().slice(0, 10) };
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (m) return { deger: `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` };
  // GG.AA.YYYY
  m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (m) return { deger: `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` };
  return { hata: `tarih "${s}" tanınmadı (GG.AA.YYYY veya YYYY-AA-GG bekleniyor)` };
}

// ————————————————————————————————————————————————
// Şablon üretimi
// ————————————————————————————————————————————————
export async function sablonUret(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pekparts Panel";
  const ws = wb.addWorksheet("Ürünler");

  ws.columns = SUTUNLAR.map((s) => ({
    header: s.baslik,
    key: s.anahtar,
    width: Math.max(14, Math.min(40, s.baslik.length + 6)),
  }));

  // 1. satır: başlıklar (kalın)
  const bas = ws.getRow(1);
  bas.font = { bold: true };
  bas.eachCell((c, i) => {
    const s = SUTUNLAR[i - 1];
    c.note = s ? `${s.aciklama}${s.zorunlu ? "\n(ZORUNLU)" : ""}` : undefined;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F0ED" } };
  });

  // 2. satır: açıklama (gri, italik) — kullanıcıya rehber
  const aciklamaSatir = ws.addRow(SUTUNLAR.map((s) => s.aciklama));
  aciklamaSatir.font = { italic: true, color: { argb: "FF888888" }, size: 9 };

  // 3. satır: örnek
  ws.addRow(Object.fromEntries(SUTUNLAR.map((s) => [s.anahtar, s.ornek])));

  ws.views = [{ state: "frozen", ySplit: 1 }];
  return wb.xlsx.writeBuffer();
}

// Şablonun 2. (açıklama) ve 3. (örnek) satırlarını atlamak için işaretler.
const ACIKLAMA_ISARET = new Set(SUTUNLAR.map((s) => s.aciklama.toLowerCase()));

// ————————————————————————————————————————————————
// Ayrıştırma
// ————————————————————————————————————————————————
export interface HamSatir {
  satir: number; // gerçek Excel satır no
  veri: Record<string, unknown>;
}

export async function ayristir(data: ArrayBuffer | Buffer): Promise<HamSatir[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Başlık satırını bul: SUTUNLAR başlıklarıyla eşleşen ilk satır.
  const basliklar = SUTUNLAR.map((s) => s.baslik.toLowerCase());
  let basSatirNo = 1;
  let harita: Record<number, string> = {};
  ws.eachRow((row, no) => {
    if (Object.keys(harita).length) return;
    const hucreler = (row.values as unknown[]).map((v) => metin(v).toLowerCase());
    const eslesen = hucreler.filter((h) => basliklar.includes(h)).length;
    if (eslesen >= 3) {
      basSatirNo = no;
      row.eachCell((c, col) => {
        const idx = basliklar.indexOf(metin(c.value).toLowerCase());
        if (idx >= 0) harita[col] = SUTUNLAR[idx].anahtar;
      });
    }
  });
  if (!Object.keys(harita).length) return []; // başlık bulunamadı

  const satirlar: HamSatir[] = [];
  ws.eachRow((row, no) => {
    if (no <= basSatirNo) return;
    const veri: Record<string, unknown> = {};
    let bosMu = true;
    row.eachCell({ includeEmpty: false }, (c, col) => {
      const anahtar = harita[col];
      if (!anahtar) return;
      const deger = c.value;
      veri[anahtar] = deger;
      if (metin(deger) !== "") bosMu = false;
    });
    if (bosMu) return; // tamamen boş satır
    // Açıklama satırını (şablondan kopya) atla
    if (ACIKLAMA_ISARET.has(metin(veri.parcaNo).toLowerCase())) return;
    satirlar.push({ satir: no, veri });
  });
  return satirlar;
}

// ————————————————————————————————————————————————
// Doğrulama + fark
// ————————————————————————————————————————————————
export function dogrula(ham: HamSatir[], baglam: Baglam): Rapor {
  // Marka/kategori arama haritaları (slug + tüm adlar → slug)
  const markaHarita = new Map<string, string>();
  for (const m of baglam.markalar) {
    markaHarita.set(anahtarla(m.slug), m.slug);
    markaHarita.set(anahtarla(m.ad), m.slug);
  }
  const kategoriHarita = new Map<string, string>();
  for (const k of baglam.kategoriler) {
    kategoriHarita.set(anahtarla(k.slug), k.slug);
    for (const ad of k.adlar) kategoriHarita.set(anahtarla(ad), k.slug);
  }
  const mevcutSet = new Set(baglam.mevcutParcaNolar.map(anahtarla));

  const gorulen = new Map<string, number>(); // normalize parcaNo → ilk satır
  const satirlar: SatirSonuc[] = [];

  for (const { satir, veri } of ham) {
    const hatalar: string[] = [];
    const parcaNo = metin(veri.parcaNo);

    // parcaNo
    if (!parcaNo) hatalar.push("Parça No boş (zorunlu)");
    const nAnahtar = anahtarla(parcaNo);
    if (parcaNo && gorulen.has(nAnahtar)) {
      hatalar.push(`Parça numarası tekrar ediyor (${gorulen.get(nAnahtar)}. satırla aynı)`);
    } else if (parcaNo) {
      gorulen.set(nAnahtar, satir);
    }

    // marka
    let marka = "";
    const markaHam = metin(veri.marka);
    if (!markaHam) hatalar.push("Marka boş (zorunlu)");
    else {
      const bulunan = markaHarita.get(anahtarla(markaHam));
      if (!bulunan) hatalar.push(`Bilinmeyen marka: "${markaHam}"`);
      else marka = bulunan;
    }

    // kategori
    let kategori = "";
    const katHam = metin(veri.kategori);
    if (!katHam) hatalar.push("Kategori boş (zorunlu)");
    else {
      const bulunan = kategoriHarita.get(anahtarla(katHam));
      if (!bulunan) hatalar.push(`Bilinmeyen kategori: "${katHam}"`);
      else kategori = bulunan;
    }

    // ad_tr
    const adTr = metin(veri.ad_tr);
    if (!adTr) hatalar.push("Ad (TR) boş (zorunlu)");

    // stok
    let stokDurumu: UrunVeri["stokDurumu"] | "" = "";
    const stokHam = metin(veri.stokDurumu);
    if (!stokHam) hatalar.push("Stok Durumu boş (zorunlu)");
    else {
      const s = STOK_ESLEME[stokHam.toLowerCase()];
      if (!s) hatalar.push(`Geçersiz Stok Durumu: "${stokHam}" (Stokta / Siparişe bağlı / Tükendi)`);
      else stokDurumu = s;
    }

    // durum
    let durum: UrunVeri["durum"] | "" = "";
    const durumHam = metin(veri.durum);
    if (!durumHam) hatalar.push("Durum boş (zorunlu)");
    else {
      const d = DURUM_ESLEME[durumHam.toLowerCase()];
      if (!d) hatalar.push(`Geçersiz Durum: "${durumHam}" (Orijinal / Muadil / Revizyonlu)`);
      else durum = d;
    }

    // fiyat
    let fiyat: number | undefined;
    const fiyatHam = metin(veri.fiyat);
    if (fiyatHam) {
      const sayi = Number(fiyatHam.replace(/\s/g, "").replace(",", "."));
      if (isNaN(sayi) || sayi < 0) hatalar.push(`Geçersiz Fiyat: "${fiyatHam}"`);
      else fiyat = sayi;
    }

    // para birimi
    let paraBirimi: UrunVeri["paraBirimi"] | undefined;
    const paraHam = metin(veri.paraBirimi);
    if (paraHam) {
      const p = PARA_ESLEME[paraHam.toLowerCase()];
      if (!p) hatalar.push(`Geçersiz Para Birimi: "${paraHam}" (TRY / USD / EUR)`);
      else paraBirimi = p;
    }

    // booleans
    const one = boolCoz(veri.oneCikan, false);
    if (one.hata) hatalar.push(`Öne Çıkan: ${one.hata}`);
    const yay = boolCoz(veri.yayinda, true);
    if (yay.hata) hatalar.push(`Yayında: ${yay.hata}`);

    // tarih
    const tarih = tarihCoz(veri.eklenmeTarihi);
    if (tarih.hata) hatalar.push(`Eklenme Tarihi: ${tarih.hata}`);

    // ad/açıklama çevrileri
    const ad: Cevrilebilir = { tr: adTr };
    for (const d of ["en", "ar", "ru"] as const) {
      const v = metin(veri[`ad_${d}`]);
      if (v) ad[d] = v;
    }
    let aciklama: Cevrilebilir | undefined;
    const acTr = metin(veri.aciklama_tr);
    const acDiger = (["en", "ar", "ru"] as const).map((d) => metin(veri[`aciklama_${d}`]));
    if (acTr || acDiger.some(Boolean)) {
      aciklama = { tr: acTr };
      for (const d of ["en", "ar", "ru"] as const) {
        const v = metin(veri[`aciklama_${d}`]);
        if (v) aciklama[d] = v;
      }
    }

    if (hatalar.length) {
      satirlar.push({ satir, parcaNo, islem: "hata", hatalar });
      continue;
    }

    const urun: UrunVeri = {
      parcaNo,
      muadilNo: listeAyir(veri.muadilNo),
      marka,
      kategori,
      uyumluMotorlar: listeAyir(veri.uyumluMotorlar),
      stokDurumu: stokDurumu as UrunVeri["stokDurumu"],
      durum: durum as UrunVeri["durum"],
      ...(fiyat !== undefined ? { fiyat } : {}),
      ...(paraBirimi ? { paraBirimi } : {}),
      oneCikan: one.deger,
      yayinda: yay.deger,
      eklenmeTarihi: tarih.deger!,
      ad,
      ...(aciklama ? { aciklama } : {}),
    };
    const islem: Islem = mevcutSet.has(nAnahtar) ? "guncelleme" : "yeni";
    satirlar.push({ satir, parcaNo, islem, hatalar: [], urun });
  }

  const gecerliUrunler = satirlar.filter((s) => s.urun).map((s) => s.urun!);
  return {
    toplam: satirlar.length,
    yeni: satirlar.filter((s) => s.islem === "yeni").length,
    guncelleme: satirlar.filter((s) => s.islem === "guncelleme").length,
    hatali: satirlar.filter((s) => s.islem === "hata").length,
    satirlar,
    gecerliUrunler,
  };
}

// ————————————————————————————————————————————————
// Dışa aktarım
// ————————————————————————————————————————————————
export async function disaAktar(urunler: UrunVeri[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pekparts Panel";
  const ws = wb.addWorksheet("Ürünler");
  ws.columns = SUTUNLAR.map((s) => ({ header: s.baslik, key: s.anahtar, width: 18 }));
  ws.getRow(1).font = { bold: true };

  const stokEtiket: Record<string, string> = {
    stokta: "Stokta", "siparise-bagli": "Siparişe bağlı", tukendi: "Tükendi",
  };
  const durumEtiket: Record<string, string> = {
    orijinal: "Orijinal", muadil: "Muadil", revizyonlu: "Revizyonlu",
  };

  for (const u of urunler) {
    ws.addRow({
      parcaNo: u.parcaNo,
      muadilNo: u.muadilNo.join("; "),
      marka: u.marka,
      kategori: u.kategori,
      uyumluMotorlar: u.uyumluMotorlar.join(", "),
      stokDurumu: stokEtiket[u.stokDurumu] ?? u.stokDurumu,
      durum: durumEtiket[u.durum] ?? u.durum,
      fiyat: u.fiyat ?? "",
      paraBirimi: u.paraBirimi ?? "",
      oneCikan: u.oneCikan ? "Evet" : "Hayır",
      yayinda: u.yayinda ? "Evet" : "Hayır",
      eklenmeTarihi: u.eklenmeTarihi,
      ad_tr: u.ad.tr,
      ad_en: u.ad.en ?? "",
      ad_ar: u.ad.ar ?? "",
      ad_ru: u.ad.ru ?? "",
      aciklama_tr: u.aciklama?.tr ?? "",
      aciklama_en: u.aciklama?.en ?? "",
      aciklama_ar: u.aciklama?.ar ?? "",
      aciklama_ru: u.aciklama?.ru ?? "",
    });
  }
  return wb.xlsx.writeBuffer();
}
