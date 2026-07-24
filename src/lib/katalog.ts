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
  if (sanityYapili()) return _sirala(await sanityUrunler());

  if (canli) {
    throw new Error(
      "Yayın derlemesi (CANLI=1) için Sanity yapılandırması zorunlu. " +
        "SANITY_PROJECT_ID tanımlı değil; içerik dosyalarına (seed) düşülmez.",
    );
  }
  // Geliştirme: yerel içerik dosyaları (seed) — yalnızca dev'de serbest.
  return _sirala(await _icerikDosyalari());
}

function _sirala(zengin: ZenginUrun[]): ZenginUrun[] {
  return zengin.sort((a, b) => {
    if (a.oneCikan !== b.oneCikan) return a.oneCikan ? -1 : 1;
    return b.eklenmeTarihi.getTime() - a.eklenmeTarihi.getTime();
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
        durum: u.data.durum,
        oneCikan: u.data.oneCikan,
        // Görsel: dosya diskte varsa yerel yol, yoksa null → yer tutucu.
        gorseller: u.data.gorseller.map((g) => ({
          url: gorselVar(g.dosya) ? `/urun-gorselleri/${g.dosya}` : null,
          alt: g.alt,
        })),
        ad: u.data.ad,
        aciklama: u.data.aciklama,
        eklenmeTarihi: u.data.eklenmeTarihi,
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
