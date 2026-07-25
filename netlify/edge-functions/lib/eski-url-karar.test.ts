// Eski URL karar mantığı testi (yerel). §11: 301 / 410 / geçir.
// Çalıştır: node --experimental-strip-types eski-url-karar.test.ts
import { eskiUrlKarari } from "./eski-url-karar.ts";

let gecti = 0, kaldi = 0;
function esit(yol: string, bekle: string, ek = "") {
  const k = eskiUrlKarari(yol);
  const ozet = k.tip === "301" ? `301→${k.hedef}` : k.tip;
  if (ozet === bekle) { gecti++; console.log(`✓ ${yol}  →  ${ozet}`); }
  else { kaldi++; console.log(`✗ ${yol}  →  ${ozet}  (beklenen: ${bekle}) ${ek}`); }
}

console.log("=== Eski URL geçiş kararı ===\n");

console.log("— Gerçek ürün sayfaları → 301 (baştaki slug değişken/çok-segmentli):");
esit("/deutz-gasket-set/p/1504", "301→/en/urun/04289952/");
esit("/some/deep/path/p/1534", "301→/en/urun/02937551/");
esit("/x/p/1500", "301→/en/urun/0-065-1558-6-10/"); // SDF
esit("/urun-adi/p/1349/", "301→/en/urun/01172715/"); // sonda slash
esit("/eski/p/9999", "gecir"); // haritada yok → geçer (doğal 404)

console.log("\n— Marka/kategori liste sayfaları:");
esit("/cnh/k/245", "301→/en/marka/cnh/");
esit("/nural/k/238", "410");
esit("/baska/k/777", "gecir");

console.log("\n— Spam ülke sayfaları → 410:");
esit("/gaskets-albania", "410");
esit("/engine-parts-nepal", "410");
esit("/pistons-kosovo", "410");
esit("/spare-parts-saudi-arabia", "410"); // çok kelimeli ülke
esit("/filters-united-arab-emirates", "410");
esit("/gaskets-albania/", "410"); // sonda slash

console.log("\n— GEÇMESİ gerekenler (gerçek sayfalar / güvenlik):");
esit("/en/urun/04289952/", "gecir");
esit("/en/marka/cnh/", "gecir");
esit("/tr/urunler/filtreler/", "gecir");
esit("/albania", "gecir"); // tek başına ülke adı, <kelime>-<ülke> değil
esit("/deutz", "gecir"); // ülke içermez
esit("/robots.txt", "gecir");
esit("/favicon.svg", "gecir");
esit("/sitemap-index.xml", "gecir");
esit("/", "gecir");

console.log(`\n=== ${gecti} geçti, ${kaldi} kaldı ===`);
if (kaldi > 0) process.exit(1);
