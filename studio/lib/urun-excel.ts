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
  { anahtar: "parcaNo", baslik: "Parça No", aciklama: "Zorunlu. Ürünün ana parça numarası. Metin olarak girin; baştaki sıfırlar korunur.", ornek: "04175848", zorunlu: true },
  { anahtar: "muadilNo", baslik: "Muadil No", aciklama: "Çapraz referans numaraları. Birden fazlaysa virgül veya noktalı virgülle ayırın.", ornek: "0417 5848; 4175848" },
  { anahtar: "marka", baslik: "Marka", aciklama: "Zorunlu. Tanımlı bir marka SLUG'ı (adı değil). Örn: deutz, bosch, ithal.", ornek: "deutz", zorunlu: true },
  { anahtar: "kategori", baslik: "Kategori", aciklama: "Zorunlu. Tanımlı bir kategori SLUG'ı (adı değil). Örn: motor-ic-parcalari.", ornek: "yakit-sistemi", zorunlu: true },
  { anahtar: "uyumluMotorlar", baslik: "Uyumlu Motorlar", aciklama: "Motor modelleri, virgülle ayrılmış.", ornek: "TCD 2012 L04, BF4M 2012" },
  { anahtar: "stokDurumu", baslik: "Stok Durumu", aciklama: "Değerler: Stokta / Siparişe bağlı / Tükendi. Boşsa Stokta kabul edilir.", ornek: "Stokta" },
  { anahtar: "oneCikan", baslik: "Öne Çıkan", aciklama: "Ana sayfada gösterilsin mi? Evet / Hayır.", ornek: "Hayır" },
  { anahtar: "yayinda", baslik: "Yayında", aciklama: "Sitede yayınlansın mı? Evet / Hayır. Boşsa Evet kabul edilir.", ornek: "Evet" },
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
  oneCikan: boolean;
  yayinda: boolean;
  ad: Cevrilebilir;
  aciklama?: Cevrilebilir;
}

export interface Baglam {
  markalar: { slug: string; ad: string }[];
  kategoriler: { slug: string; adlar: string[] }[]; // tüm dillerdeki adlar
  mevcutParcaNolar: string[]; // güncelleme/yeni ayrımı için
}

// "kopya" = aynı parça no + BİREBİR aynı içerik (sehven iki kez girilmiş) → atlanır.
// Aynı parça no'lu FARKLI ürünler hata değildir; ayrı ürün olarak geçerli sayılır.
export type Islem = "yeni" | "guncelleme" | "hata" | "kopya";

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
  kopya: number; // birebir aynı, atlanan satırlar
  satirlar: SatirSonuc[];
  gecerliUrunler: UrunVeri[]; // kısmi aktarım için (hatasız + kopya olmayan)
}

// ————————————————————————————————————————————————
// Yardımcılar
// ————————————————————————————————————————————————

/** Parça no kimlik/tekrar EŞLEŞTİRMESİ için normalizasyon (arama ile aynı). */
export function anahtarla(deger: string): string {
  return deger.toLowerCase().replace(/[\s.\-_/]/g, "");
}

/** Marka/kategori SLUG eşleştirmesi: büyük/küçük + kenar boşluğa toleranslı,
 *  ama tire korunur (slug'lar tireli). Görünen ad ile eşleşme YAPILMAZ. */
function slugNorm(deger: string): string {
  return deger.trim().toLowerCase();
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
    // Parça/muadil no METİN biçimi: Excel sayıya çevirip baştaki sıfırı yemesin.
    style:
      s.anahtar === "parcaNo" || s.anahtar === "muadilNo" ? { numFmt: "@" } : undefined,
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
  // Marka/kategori eşleşmesi YALNIZCA slug ile (görünen ad değil).
  const markaHarita = new Map<string, string>();
  for (const m of baglam.markalar) markaHarita.set(slugNorm(m.slug), m.slug);
  const kategoriHarita = new Map<string, string>();
  for (const k of baglam.kategoriler) kategoriHarita.set(slugNorm(k.slug), k.slug);
  const mevcutSet = new Set(baglam.mevcutParcaNolar.map(anahtarla));

  const imzalar = new Set<string>(); // birebir aynı satırları yakalamak için
  const satirlar: SatirSonuc[] = [];

  for (const { satir, veri } of ham) {
    const hatalar: string[] = [];
    const parcaNo = metin(veri.parcaNo);

    // parcaNo — birincil anahtar DEĞİL; aynı numaralı farklı ürün olabilir.
    if (!parcaNo) hatalar.push("Parça No boş (zorunlu)");
    const nAnahtar = anahtarla(parcaNo);

    // marka — yalnız slug ile eşleşir
    let marka = "";
    const markaHam = metin(veri.marka);
    if (!markaHam) hatalar.push("Marka boş (zorunlu)");
    else {
      const bulunan = markaHarita.get(slugNorm(markaHam));
      if (!bulunan) hatalar.push(`Bilinmeyen marka: "${markaHam}"`);
      else marka = bulunan;
    }

    // kategori — yalnız slug ile eşleşir
    let kategori = "";
    const katHam = metin(veri.kategori);
    if (!katHam) hatalar.push("Kategori boş (zorunlu)");
    else {
      const bulunan = kategoriHarita.get(slugNorm(katHam));
      if (!bulunan) hatalar.push(`Bilinmeyen kategori: "${katHam}"`);
      else kategori = bulunan;
    }

    // ad_tr
    const adTr = metin(veri.ad_tr);
    if (!adTr) hatalar.push("Ad (TR) boş (zorunlu)");

    // stok — boşsa "stokta" (şema varsayılanı), geçersizse hata
    let stokDurumu: UrunVeri["stokDurumu"] = "stokta";
    const stokHam = metin(veri.stokDurumu);
    if (stokHam) {
      const s = STOK_ESLEME[stokHam.toLowerCase()];
      if (!s) hatalar.push(`Geçersiz Stok Durumu: "${stokHam}" (Stokta / Siparişe bağlı / Tükendi)`);
      else stokDurumu = s;
    }

    // booleans
    const one = boolCoz(veri.oneCikan, false);
    if (one.hata) hatalar.push(`Öne Çıkan: ${one.hata}`);
    const yay = boolCoz(veri.yayinda, true);
    if (yay.hata) hatalar.push(`Yayında: ${yay.hata}`);

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
      stokDurumu,
      oneCikan: one.deger,
      yayinda: yay.deger,
      ad,
      ...(aciklama ? { aciklama } : {}),
    };
    // Aynı ürün mü? Kimlik = parça no + marka + kategori + Türkçe ad. Farklı
    // ürünler zaten TR adında ayrışır; yalnız İngilizce ad/motor gibi ikincil
    // alanlarda farklılık "sehven kopya" sayılır ve atlanır (ilk satır kazanır).
    const adTrNorm = adTr.trim().toLowerCase().replace(/\s+/g, " ");
    const imza = JSON.stringify({ p: nAnahtar, m: marka, k: kategori, ad: adTrNorm });
    if (imzalar.has(imza)) {
      satirlar.push({ satir, parcaNo, islem: "kopya", hatalar: [] });
      continue;
    }
    imzalar.add(imza);

    const islem: Islem = mevcutSet.has(nAnahtar) ? "guncelleme" : "yeni";
    satirlar.push({ satir, parcaNo, islem, hatalar: [], urun });
  }

  const gecerliUrunler = satirlar.filter((s) => s.urun).map((s) => s.urun!);
  return {
    toplam: satirlar.length,
    yeni: satirlar.filter((s) => s.islem === "yeni").length,
    guncelleme: satirlar.filter((s) => s.islem === "guncelleme").length,
    hatali: satirlar.filter((s) => s.islem === "hata").length,
    kopya: satirlar.filter((s) => s.islem === "kopya").length,
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
  ws.columns = SUTUNLAR.map((s) => ({
    header: s.baslik,
    key: s.anahtar,
    width: 18,
    style:
      s.anahtar === "parcaNo" || s.anahtar === "muadilNo" ? { numFmt: "@" } : undefined,
  }));
  ws.getRow(1).font = { bold: true };

  const stokEtiket: Record<string, string> = {
    stokta: "Stokta", "siparise-bagli": "Siparişe bağlı", tukendi: "Tükendi",
  };

  for (const u of urunler) {
    ws.addRow({
      parcaNo: u.parcaNo,
      muadilNo: u.muadilNo.join("; "),
      marka: u.marka,
      kategori: u.kategori,
      uyumluMotorlar: u.uyumluMotorlar.join(", "),
      stokDurumu: stokEtiket[u.stokDurumu] ?? u.stokDurumu,
      oneCikan: u.oneCikan ? "Evet" : "Hayır",
      yayinda: u.yayinda ? "Evet" : "Hayır",
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
