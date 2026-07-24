// Excel'den ürün içe aktarma — komut satırı (Studio kurmadan).
// Aynı test edilmiş motoru (lib/urun-excel.ts) kullanır.
//
// Önizleme (yazmaz, sadece rapor):
//   node --experimental-strip-types scripts/urun-ice-aktar.mjs <dosya.xlsx>
// Uygula (Sanity'ye yazar):
//   node --experimental-strip-types scripts/urun-ice-aktar.mjs <dosya.xlsx> --uygula
//
// Kök .env'i kendisi yükler (çalışma dizininden bağımsız). Kural: parça no
// eşleşen ürün GÜNCELLENİR (görselleri korunur), yenisi eklenir.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@sanity/client";
import XLSX from "xlsx";
import { ayristir, dogrula, anahtarla } from "../lib/urun-excel.ts";

// Dosyayı .xlsx buffer'ı olarak döndürür. Eski .xls (OLE) ise SheetJS ile
// belleğde .xlsx'e çevirir — böylece "97-2003" kaydedilmiş dosyalar da okunur.
function xlsxBuffer(path) {
  const buf = readFileSync(path);
  const eskiXls = buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
  if (eskiXls) {
    const wb = XLSX.read(buf, { type: "buffer", cellText: true, cellDates: false });
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }
  return buf;
}

// Kök .env'i script konumuna göre yükle (studio/scripts → ../../.env).
if (!process.env.SANITY_PROJECT_ID) {
  const kokEnv = join(import.meta.dirname, "..", "..", ".env");
  try {
    process.loadEnvFile(kokEnv);
  } catch {
    console.error(`Kök .env okunamadı: ${kokEnv}`);
    process.exit(1);
  }
}
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_WRITE_TOKEN) {
  console.error("HATA: .env içinde SANITY_PROJECT_ID ve SANITY_WRITE_TOKEN (Editor) gerekli.");
  process.exit(1);
}

const dosya = process.argv[2];
const uygula = process.argv.includes("--uygula");
if (!dosya) {
  console.error("Kullanım: urun-ice-aktar.mjs <dosya.xlsx> [--uygula]");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// 1) Bağlam: markalar/kategoriler/mevcut ürünler
const [markalar, kategoriler, urunler] = await Promise.all([
  client.fetch(`*[_type=="marka"]{_id,"slug":slug.current,ad}`),
  client.fetch(`*[_type=="kategori"]{_id,"slug":slug.current,"adlar":[ad.tr,ad.en,ad.ar,ad.ru][defined(@)]}`),
  client.fetch(`*[_type=="urun"]{_id,parcaNo}`),
]);
const markaId = new Map(markalar.map((m) => [m.slug, m._id]));
const kategoriId = new Map(kategoriler.map((k) => [k.slug, k._id]));
const mevcutIdSet = new Set(urunler.map((u) => u._id));

const baglam = {
  markalar: markalar.map((m) => ({ slug: m.slug, ad: m.ad })),
  kategoriler: kategoriler.map((k) => ({ slug: k.slug, adlar: k.adlar })),
  mevcutParcaNolar: urunler.map((u) => u.parcaNo),
};

// 2) Ayrıştır + doğrula (.xls otomatik .xlsx'e çevrilir)
const ham = await ayristir(xlsxBuffer(dosya));
const rapor = dogrula(ham, baglam);

console.log(`\n=== ${dosya} ===`);
console.log(`Toplam: ${rapor.toplam}  |  Yeni: ${rapor.yeni}  |  Güncelleme: ${rapor.guncelleme}  |  Hatalı: ${rapor.hatali}  |  Kopya (atlanan): ${rapor.kopya}`);

const hatalar = rapor.satirlar.filter((s) => s.islem === "hata");
if (hatalar.length) {
  console.log(`\nHatalı satırlar (atlanacak):`);
  for (const s of hatalar) {
    console.log(`  ${s.satir}. satır${s.parcaNo ? ` (${s.parcaNo})` : ""}: ${s.hatalar.join("; ")}`);
  }
}

const kopyalar = rapor.satirlar.filter((s) => s.islem === "kopya");
if (kopyalar.length) {
  console.log(`\nBirebir aynı satırlar (atlandı):`);
  for (const s of kopyalar) console.log(`  ${s.satir}. satır (${s.parcaNo})`);
}

if (!uygula) {
  console.log(`\n(Önizleme. Yazmak için --uygula ekleyin.)`);
  process.exit(0);
}

// 3) Uygula
const alanlar = (u) => ({
  parcaNo: u.parcaNo,
  muadilNo: u.muadilNo,
  marka: { _type: "reference", _ref: markaId.get(u.marka) },
  kategori: { _type: "reference", _ref: kategoriId.get(u.kategori) },
  uyumluMotorlar: u.uyumluMotorlar,
  stokDurumu: u.stokDurumu,
  oneCikan: u.oneCikan,
  yayinda: u.yayinda,
  ad: { _type: "cevrilebilirAd", ...u.ad },
  ...(u.aciklama ? { aciklama: { _type: "cevrilebilirMetin", ...u.aciklama } } : {}),
});

// _id ataması: parça no birincil anahtar değil. Aynı numaranın dosyadaki
// k. oluşumu → urun-<no> (ilk), urun-<no>-2, -3 ... (sonrakiler). Böylece aynı
// dosyayı tekrar içe aktarmak fikri sabit kalır (yeniden yazmaz, günceller).
const sayac = new Map();
const islemler = rapor.gecerliUrunler.map((u) => {
  const norm = anahtarla(u.parcaNo);
  const i = sayac.get(norm) ?? 0;
  sayac.set(norm, i + 1);
  const taban = `urun-${norm}`;
  const id = i === 0 ? taban : `${taban}-${i + 1}`;
  return { u, id, guncelle: mevcutIdSet.has(id) };
});

const grupla = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
let yeni = 0, guncel = 0;
for (const grup of grupla(islemler, 50)) {
  const tx = client.transaction();
  for (const { u, id, guncelle } of grup) {
    if (guncelle) {
      tx.patch(id, (p) => p.set(alanlar(u))); // görseller korunur
      guncel++;
    } else {
      tx.createOrReplace({ _id: id, _type: "urun", ...alanlar(u) });
      yeni++;
    }
  }
  await tx.commit();
}
console.log(`\n✓ Aktarıldı: ${yeni} yeni, ${guncel} güncelleme. Değişiklikler birkaç dakika içinde sitede görünecek.`);
