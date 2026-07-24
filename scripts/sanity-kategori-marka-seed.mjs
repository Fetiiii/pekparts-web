// Sanity'ye 11 kategori + 11 markayı (yeni listeler, birebir) yazar/günceller.
// Excel içe aktarımı marka/kategori SLUG'larını bunlara karşı doğrular; o yüzden
// ürün aktarımından ÖNCE çalıştırın.
//
// Çalıştırma (proje kökünde):
//   SANITY_PROJECT_ID=xxx SANITY_DATASET=production SANITY_WRITE_TOKEN=yyy \
//     node scripts/sanity-kategori-marka-seed.mjs
//
// (Değerler .env'de varsa: `node --env-file=.env scripts/sanity-kategori-marka-seed.mjs`
//  ama SANITY_WRITE_TOKEN'ı .env'e Editor yetkili token olarak ekleyin.)
//
// createOrReplace ile deterministik _id kullanır: kategori-<slug> / marka-<slug>.
// Tekrar çalıştırmak güvenlidir (upsert). Var olan ürünlerin referansları
// slug/_id sabit kaldığı için bozulmaz.

import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("HATA: SANITY_PROJECT_ID ve SANITY_WRITE_TOKEN (Editor) gerekli.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

const kategoriler = [
  { slug: "gasketlar-keceler", tr: "Contalar ve keçeler", en: "Gaskets & seals" },
  { slug: "sensor-elektrik", tr: "Sensörler ve elektrik", en: "Sensors & electrical" },
  { slug: "motor-ic-parcalari", tr: "Motor iç parçaları", en: "Engine internals" },
  { slug: "yatak-burc", tr: "Yataklar ve burçlar", en: "Bearings & bushings" },
  { slug: "diger", tr: "Diğer", en: "Other" },
  { slug: "filtreler", tr: "Filtreler", en: "Filters" },
  { slug: "yakit-sistemi", tr: "Yakıt sistemi", en: "Fuel injection system" },
  { slug: "pompalar", tr: "Pompalar", en: "Pumps" },
  { slug: "kayis-kasnak", tr: "Kayışlar ve kasnaklar", en: "Belts & pulleys" },
  { slug: "sogutma-sistemi", tr: "Soğutma sistemi", en: "Cooling system" },
  { slug: "turbo", tr: "Turbo", en: "Turbocharger" },
];

const markalar = [
  { slug: "deutz", ad: "Deutz" },
  { slug: "kolbenschmidt", ad: "Kolbenschmidt" },
  { slug: "victor-reinz", ad: "Victor Reinz" },
  { slug: "bosch", ad: "Bosch" },
  { slug: "mahle", ad: "Mahle" },
  { slug: "volvo", ad: "Volvo" },
  { slug: "sdf", ad: "SDF" },
  { slug: "cnh", ad: "CNH" },
  { slug: "goetze", ad: "Goetze" },
  { slug: "delphi", ad: "Delphi" },
  { slug: "ithal", ad: "İthal" },
];

const tx = client.transaction();

kategoriler.forEach((k, i) => {
  tx.createOrReplace({
    _id: `kategori-${k.slug}`,
    _type: "kategori",
    slug: { _type: "slug", current: k.slug },
    ad: { _type: "cevrilebilirAd", tr: k.tr, en: k.en },
    sira: i + 1,
  });
});

markalar.forEach((m, i) => {
  tx.createOrReplace({
    _id: `marka-${m.slug}`,
    _type: "marka",
    slug: { _type: "slug", current: m.slug },
    ad: m.ad,
    logoKullanimIzni: false,
    sira: i + 1,
  });
});

try {
  await tx.commit();
  console.log(`✓ ${kategoriler.length} kategori + ${markalar.length} marka yazıldı/güncellendi.`);
  console.log("  Not: Eski/fazla kategoriler (örn. motor-parcalari) panelden elle silinmeli.");
} catch (e) {
  console.error("HATA:", e.message);
  process.exit(1);
}
