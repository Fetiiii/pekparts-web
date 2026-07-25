import type { APIRoute } from "astro";
import { tumUrunler, aramaAnahtari } from "@/lib/katalog";

// Build sırasında üretilen dilbağımsız arama indeksi (§6). İstemci bunu çekip
// numara/metin eşleştirmesi yapar. Fiyat GÖSTERİLMEZ, indekste de yer almaz.
export const GET: APIRoute = async () => {
  const urunler = await tumUrunler();

  const veri = urunler.map((u) => {
    // Numara anahtarları: parçaNo + muadilNo + motorlar, ürün bazında Set ile
    // tekilleştirilir (04175848 ve "0417 5848" aynı anahtara düşer).
    const anahtarlar = new Set<string>();
    for (const s of [u.parcaNo, ...u.muadilNo, ...u.motorlar.map((m) => m.ad)]) {
      const n = aramaAnahtari(s);
      if (n) anahtarlar.add(n);
    }

    // Metin anahtarları: dört dildeki ad + motor adları, normalize.
    const metin = new Set<string>();
    for (const s of [u.ad.tr, u.ad.en, u.ad.ar, u.ad.ru, ...u.motorlar.map((m) => m.ad)]) {
      const n = aramaAnahtari(s ?? "");
      if (n) metin.add(n);
    }

    return {
      slug: u.slug,
      parcaNo: u.parcaNo,
      ad: u.ad,
      marka: u.markaAd,
      markaSlug: u.markaSlug,
      motorOzet: u.motorlar.slice(0, 3).map((m) => m.ad),
      motorFazla: Math.max(0, u.motorlar.length - 3),
      stok: u.stokDurumu,
      gorsel: u.gorseller.find((g) => g.url)?.url ?? null, // kapak (arama kartı için)
      anahtarlar: [...anahtarlar],
      metin: [...metin],
    };
  });

  return new Response(JSON.stringify(veri), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
