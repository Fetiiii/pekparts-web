import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { slugla } from "./slug";
import type { ZenginUrun, Ayarlar } from "./tipler";

// Sanity yapılandırması ortamdan okunur. Astro build sunucu tarafında
// import.meta.env + process.env ikisine de bakar.
function env(ad: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[ad] ?? process.env[ad];
}

const projectId = env("PUBLIC_SANITY_PROJECT_ID");
const dataset = env("PUBLIC_SANITY_DATASET") ?? "production";

/** Sanity yapılandırılmış mı? (proje ID var mı) */
export function sanityYapili(): boolean {
  return !!projectId;
}

export const sanityClient: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion: "2024-01-01", useCdn: true })
  : null;

const builder = sanityClient ? imageUrlBuilder(sanityClient) : null;

function gorselUrl(kaynak: unknown, genislik = 900): string | null {
  if (!builder || !kaynak) return null;
  try {
    return builder.image(kaynak as never).width(genislik).auto("format").url();
  } catch {
    return null;
  }
}

// GROQ: yayında ürünler, referanslar ve görseller çözülmüş.
const URUN_SORGU = `*[_type=="urun" && yayinda==true]{
  "id": coalesce(slug.current, _id),
  parcaNo, muadilNo,
  "markaSlug": marka->slug.current, "markaAd": marka->ad,
  "kategoriSlug": kategori->slug.current, "kategoriAd": kategori->ad,
  uyumluMotorlar, stokDurumu, durum, oneCikan,
  gorseller[]{ "asset": asset, alt },
  ad, aciklama, eklenmeTarihi
}`;

export async function sanityUrunler(): Promise<ZenginUrun[]> {
  if (!sanityClient) throw new Error("Sanity istemcisi yok");
  const ham = await sanityClient.fetch<any[]>(URUN_SORGU);
  return ham.map((u): ZenginUrun => ({
    id: slugla(u.parcaNo),
    parcaNo: u.parcaNo,
    slug: slugla(u.parcaNo),
    muadilNo: u.muadilNo ?? [],
    markaSlug: u.markaSlug ?? "",
    markaAd: u.markaAd ?? u.markaSlug ?? "",
    kategoriSlug: u.kategoriSlug ?? "",
    kategoriAd: u.kategoriAd ?? { tr: u.kategoriSlug ?? "" },
    motorlar: (u.uyumluMotorlar ?? []).map((ad: string) => ({ ad, slug: slugla(ad) })),
    stokDurumu: u.stokDurumu,
    durum: u.durum,
    oneCikan: !!u.oneCikan,
    gorseller: (u.gorseller ?? []).map((g: any) => ({
      url: gorselUrl(g.asset),
      alt: g.alt,
    })),
    ad: u.ad ?? { tr: u.parcaNo },
    aciklama: u.aciklama,
    eklenmeTarihi: new Date(u.eklenmeTarihi ?? Date.now()),
  }));
}

export interface SayfaIcerik {
  baslik?: { tr: string; en?: string; ar?: string; ru?: string };
  icerik?: { tr: string; en?: string; ar?: string; ru?: string };
}

export async function sanitySayfa(slug: string): Promise<SayfaIcerik | null> {
  if (!sanityClient) return null;
  return sanityClient.fetch<SayfaIcerik | null>(
    `*[_type=="sayfa" && slug==$slug][0]{baslik, icerik}`,
    { slug },
  );
}

const AYAR_SORGU = `*[_type=="siteAyarlari"][0]{
  telefon, whatsapp, eposta, talepEpostasi, adres, calismaSaatleri, haritaGomu,
  sosyal[]{etiket, url}
}`;

export async function sanityAyarlar(): Promise<Ayarlar | null> {
  if (!sanityClient) return null;
  const a = await sanityClient.fetch<any>(AYAR_SORGU);
  if (!a) return null;
  return {
    telefon: a.telefon ?? "",
    whatsapp: a.whatsapp ?? "",
    eposta: a.eposta ?? "",
    talepEpostasi: a.talepEpostasi,
    adres: a.adres ?? "",
    calismaSaatleri: a.calismaSaatleri ?? "",
    haritaGomu: a.haritaGomu,
    sosyal: a.sosyal ?? [],
    eksik: false,
  };
}
