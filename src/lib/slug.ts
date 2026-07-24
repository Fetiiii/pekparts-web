// URL güvenli slug — seed-uygula.mjs ile AYNI kural (slug === entry.id).
// Astro'ya bağımsız; hem Sanity adaptörü hem içerik adaptörü kullanır.
export function slugla(deger: string): string {
  return deger
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
