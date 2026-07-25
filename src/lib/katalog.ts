import { getCollection } from "astro:content";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { aramaAnahtari } from "@/content.config";
import { slugla } from "./slug";
import { sanityYapili, sanityUrunler } from "./sanity";
import type { Dil } from "@/i18n/ui";
import type { Cevrilebilir, Motor, ZenginUrun } from "./tipler";

export { aramaAnahtari, slugla };
export type { Cevrilebilir, Motor, ZenginUrun };

/** Çevrilebilir alanı dile göre çözer; yoksa en→tr geri düşüşü (Şartname §7). */
export function yerelDeger(alan: Cevrilebilir | undefined, dil: Dil): string {
  if (!alan) return "";
  return alan[dil] || alan.en || alan.tr || "";
}

// Gerçek marka olmayan özel değerler dile göre gösterilir (ör. "ithal").
const OZEL_MARKA_ADLARI: Record<string, Partial<Record<Dil, string>>> = {
  ithal: { tr: "İthal", en: "Imported", ar: "مستورد", ru: "Импортный" },
};

/** Marka adını dile göre verir. Gerçek markalar aynen; "ithal" gibi özel
 *  değerler çevrilir (İngilizce'de "Imported"). */
export function markaAdi(slug: string, ad: string, dil: Dil): string {
  const ozel = OZEL_MARKA_ADLARI[slug];
  return ozel?.[dil] ?? ozel?.en ?? ad;
}

const GORSEL_DIZINI = join(process.cwd(), "public", "urun-gorselleri");
const canli = ["1", "true", "evet"].includes(String(process.env.CANLI ?? "").toLowerCase());

/** Görsel dosyası public/urun-gorselleri/ altında gerçekten var mı (build anında). */
function gorselVar(dosya: string): boolean {
  return existsSync(join(GORSEL_DIZINI, dosya));
}

let _kesif: Promise<ZenginUrun[]> | null = null;

/** Yayında ürünler, referanslar/görseller çözülmüş, yeni→eski sıralı.
 *  Kaynak: Sanity yapılandırılmışsa oradan; değilse içerik dosyaları.
 *  Yayın derlemesinde (CANLI=1) Sanity zorunlu — eksikse hata (bkz. seed-guard). */
export function tumUrunler(): Promise<ZenginUrun[]> {
  if (!_kesif) _kesif = _yukle();
  return _kesif;
}

async function _yukle(): Promise<ZenginUrun[]> {
  let liste: ZenginUrun[];
  if (sanityYapili()) {
    liste = await sanityUrunler();
  } else if (canli) {
    throw new Error(
      "Yayın derlemesi (CANLI=1) için Sanity yapılandırması zorunlu. " +
        "SANITY_PROJECT_ID tanımlı değil; içerik dosyalarına (seed) düşülmez.",
    );
  } else {
    // Geliştirme: yerel içerik dosyaları (seed) — yalnızca dev'de serbest.
    liste = await _icerikDosyalari();
  }
  benzersizSluglar(liste); // aynı parça no'lu farklı ürünlere benzersiz URL
  return _sirala(liste);
}

// Parça no artık birincil anahtar DEĞİL: aynı numara birden çok farklı ürüne
// ait olabilir. Her ürüne benzersiz, kararlı slug ata: tekse parça no'nun
// slug'ı; çakışmada id'ye göre sıralı -2/-3 eki. (id kararlı → URL kararlı.)
function benzersizSluglar(urunler: ZenginUrun[]): void {
  const gruplar = new Map<string, ZenginUrun[]>();
  for (const u of urunler) {
    const anahtar = aramaAnahtari(u.parcaNo);
    const g = gruplar.get(anahtar);
    if (g) g.push(u);
    else gruplar.set(anahtar, [u]);
  }
  for (const grup of gruplar.values()) {
    if (grup.length === 1) {
      grup[0].slug = slugla(grup[0].parcaNo);
      continue;
    }
    grup.sort((a, b) => a.id.localeCompare(b.id));
    grup.forEach((u, i) => {
      const taban = slugla(u.parcaNo);
      u.slug = i === 0 ? taban : `${taban}-${i + 1}`;
    });
  }
}

function _sirala(zengin: ZenginUrun[]): ZenginUrun[] {
  // Eklenme tarihi şemadan kaldırıldı; öne çıkanlar önce, sonra parça no'ya göre.
  return zengin.sort((a, b) => {
    if (a.oneCikan !== b.oneCikan) return a.oneCikan ? -1 : 1;
    return a.parcaNo.localeCompare(b.parcaNo);
  });
}

async function _icerikDosyalari(): Promise<ZenginUrun[]> {
  const [urunler, markalar, kategoriler] = await Promise.all([
    getCollection("urunler"),
    getCollection("markalar"),
    getCollection("kategoriler"),
  ]);

  const markaMap = new Map(markalar.map((m) => [m.id, m.data]));
  const kategoriMap = new Map(kategoriler.map((k) => [k.id, k.data]));

  return urunler
    .filter((u) => u.data.yayinda)
    .map((u): ZenginUrun => {
      const marka = markaMap.get(u.data.marka.id);
      const kategori = kategoriMap.get(u.data.kategori.id);
      return {
        id: u.id,
        parcaNo: u.data.parcaNo,
        slug: u.id, // glob loader id === slugla(parcaNo)
        muadilNo: u.data.muadilNo,
        markaSlug: marka?.slug ?? u.data.marka.id,
        markaAd: marka?.ad ?? u.data.marka.id,
        kategoriSlug: kategori?.slug ?? u.data.kategori.id,
        kategoriAd: kategori?.ad ?? { tr: u.data.kategori.id },
        motorlar: u.data.uyumluMotorlar.map((ad) => ({ ad, slug: slugla(ad) })),
        stokDurumu: u.data.stokDurumu,
        oneCikan: u.data.oneCikan,
        // Görsel: dosya diskte varsa yerel yol, yoksa null → yer tutucu.
        gorseller: u.data.gorseller.map((g) => ({
          url: gorselVar(g.dosya) ? `/urun-gorselleri/${g.dosya}` : null,
          alt: g.alt,
        })),
        ad: u.data.ad,
        aciklama: u.data.aciklama,
      };
    });
}

/** Marka + motor kesişimlerinin benzersiz listesi — /marka/[marka]/[motor] için. */
export async function markaMotorCiftleri(): Promise<
  { markaSlug: string; markaAd: string; motor: Motor }[]
> {
  const urunler = await tumUrunler();
  const gorulen = new Map<string, { markaSlug: string; markaAd: string; motor: Motor }>();
  for (const u of urunler) {
    for (const m of u.motorlar) {
      const anahtar = `${u.markaSlug}|${m.slug}`;
      if (!gorulen.has(anahtar)) {
        gorulen.set(anahtar, { markaSlug: u.markaSlug, markaAd: u.markaAd, motor: m });
      }
    }
  }
  return [...gorulen.values()];
}
