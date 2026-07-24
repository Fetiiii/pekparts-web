import { cevrilebilirTipi, cevrilebilirMetinTipi } from "./cevrilebilir";
import { urunTipi } from "./urun";
import { markaTipi } from "./marka";
import { kategoriTipi } from "./kategori";
import { siteAyarlariTipi } from "./siteAyarlari";
import { talepTipi } from "./talep";
import { sayfaTipi } from "./sayfa";

export const schemaTypes = [
  // Çevrilebilir yardımcı tipler (ürün/kategori bunları kullanır)
  cevrilebilirTipi("cevrilebilirAd", true),
  cevrilebilirMetinTipi("cevrilebilirMetin"),
  // Koleksiyonlar — content.config.ts ile birebir
  urunTipi,
  markaTipi,
  kategoriTipi,
  // Ek dokümanlar
  siteAyarlariTipi,
  talepTipi,
  sayfaTipi,
];
