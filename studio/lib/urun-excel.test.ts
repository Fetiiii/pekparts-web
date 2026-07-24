// Excel motoru testi — yeni tekrar modeli: parça no birincil anahtar DEĞİL.
// Aynı parça no'lu FARKLI ürün (farklı TR ad) geçerlidir; BİREBİR aynı (parça no
// + marka + kategori + TR ad) satır "kopya" olarak atlanır. Ayrıca slug-only
// marka/kategori, string parça no, stok default. 300+ satır.
// Çalıştır: node --experimental-strip-types lib/urun-excel.test.ts
import ExcelJS from "exceljs";
import { SUTUNLAR, ayristir, dogrula, disaAktar, sablonUret, type Baglam } from "./urun-excel.ts";

let gecti = 0, kaldi = 0;
const ok = (k, ad, ek = "") =>
  k ? (gecti++, console.log(`✓ ${ad}`)) : (kaldi++, console.log(`✗ HATA: ${ad} ${ek}`));

const baglam: Baglam = {
  markalar: [
    { slug: "deutz", ad: "Deutz" }, { slug: "kolbenschmidt", ad: "Kolbenschmidt" },
    { slug: "victor-reinz", ad: "Victor Reinz" }, { slug: "bosch", ad: "Bosch" },
    { slug: "mahle", ad: "Mahle" }, { slug: "volvo", ad: "Volvo" }, { slug: "sdf", ad: "SDF" },
    { slug: "cnh", ad: "CNH" }, { slug: "goetze", ad: "Goetze" }, { slug: "delphi", ad: "Delphi" },
    { slug: "ithal", ad: "İthal" },
  ],
  kategoriler: [
    { slug: "gasketlar-keceler", adlar: ["Contalar ve keçeler", "Gaskets & seals"] },
    { slug: "sensor-elektrik", adlar: ["Sensörler ve elektrik"] },
    { slug: "motor-ic-parcalari", adlar: ["Motor iç parçaları", "Engine internals"] },
    { slug: "yatak-burc", adlar: ["Yataklar ve burçlar"] }, { slug: "diger", adlar: ["Diğer"] },
    { slug: "filtreler", adlar: ["Filtreler", "Filters"] },
    { slug: "yakit-sistemi", adlar: ["Yakıt sistemi"] }, { slug: "pompalar", adlar: ["Pompalar"] },
    { slug: "kayis-kasnak", adlar: ["Kayışlar"] }, { slug: "sogutma-sistemi", adlar: ["Soğutma"] },
    { slug: "turbo", adlar: ["Turbo"] },
  ],
  mevcutParcaNolar: ["04175848", "2645A050"],
};

async function testDosyasi(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ürünler");
  ws.columns = SUTUNLAR.map((s) => ({ header: s.baslik, key: s.anahtar }));
  const satir = (o) => ws.addRow(o);

  // 16 kenar-durum satırı
  satir({ parcaNo: "04175848", marka: "deutz", kategori: "yakit-sistemi", stokDurumu: "Stokta", ad_tr: "Yakıt pompası çğışöü" }); // güncelleme
  satir({ parcaNo: "0417 5848", marka: "deutz", kategori: "yakit-sistemi", stokDurumu: "Stokta", ad_tr: "Yakıt pompası çğışöü", ad_en: "Fuel pump" }); // BİREBİR aynı (norm parça+marka+kat+TR ad) → kopya
  satir({ parcaNo: "DUP-9", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", ad_tr: "Yağ filtresi" }); // yeni
  satir({ parcaNo: "DUP-9", marka: "ithal", kategori: "filtreler", stokDurumu: "Stokta", ad_tr: "Hava filtresi" }); // yeni — aynı parça no, FARKLI ürün
  satir({ parcaNo: "", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", ad_tr: "Parçasız" }); // hata
  satir({ parcaNo: "X-VR", marka: "Victor Reinz", kategori: "gasketlar-keceler", stokDurumu: "Stokta", ad_tr: "Ad ile marka" }); // hata (slug-only)
  satir({ parcaNo: "X-M", marka: "xyz", kategori: "filtreler", stokDurumu: "Stokta", ad_tr: "Bilinmeyen marka" }); // hata
  satir({ parcaNo: "X-K", marka: "deutz", kategori: "yok-boyle", stokDurumu: "Stokta", ad_tr: "Bilinmeyen kategori" }); // hata
  satir({ parcaNo: "X-KB", marka: "deutz", kategori: "", stokDurumu: "Stokta", ad_tr: "Kategorisiz" }); // hata
  satir({ parcaNo: "X-S", marka: "deutz", kategori: "filtreler", stokDurumu: "belki", ad_tr: "Stok hatalı" }); // hata
  satir({ parcaNo: "X-A", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", ad_tr: "" }); // hata
  satir({ parcaNo: "VR-100", marka: "victor-reinz", kategori: "gasketlar-keceler", stokDurumu: "Siparişe bağlı", ad_tr: "Slug marka" }); // yeni
  satir({ parcaNo: "TOL-1", marka: " DEUTZ ", kategori: " MOTOR-IC-PARCALARI ", ad_tr: "Tolerans + boş stok" }); // yeni
  satir({ parcaNo: 4910987, marka: "deutz", kategori: "diger", stokDurumu: "Stokta", ad_tr: "Sayısal parça no" }); // yeni
  satir({ parcaNo: "04910988", marka: "deutz", kategori: "motor-ic-parcalari", stokDurumu: "Stokta", ad_tr: "Baştaki sıfır" }); // yeni
  satir({ parcaNo: "2645A050", marka: "volvo", kategori: "motor-ic-parcalari", stokDurumu: "Stokta", ad_tr: "Volvo silindir kapağı" }); // güncelleme

  const markaSlug = ["deutz", "kolbenschmidt", "victor-reinz", "bosch", "mahle", "volvo"];
  const katSlug = ["gasketlar-keceler", "filtreler", "motor-ic-parcalari", "yakit-sistemi", "pompalar", "sogutma-sistemi"];
  const stok = ["Stokta", "Siparişe bağlı", "Tükendi"];
  for (let i = 1; i <= 300; i++) {
    satir({
      parcaNo: `GEN-${String(i).padStart(4, "0")}`,
      muadilNo: i % 3 === 0 ? `ALT-${i}; ALT2-${i}` : "",
      marka: markaSlug[i % 6], kategori: katSlug[i % 6],
      uyumluMotorlar: "TCD 2012 L04, BF4M 2012", stokDurumu: stok[i % 3],
      oneCikan: i % 10 === 0 ? "Evet" : "", yayinda: "",
      ad_tr: `Üretilmiş parça ${i} — çğışöü`, ad_en: i % 2 === 0 ? `Generated ${i}` : "",
    });
  }
  return wb.xlsx.writeBuffer();
}

console.log("=== Excel motoru testi (tekrar modeli) ===\n");

const basliklar = SUTUNLAR.map((s) => s.baslik);
ok(!basliklar.some((b) => ["Durum", "Fiyat", "Para Birimi", "Eklenme Tarihi"].includes(b)),
  "şablonda kaldırılan kolonlar yok");

const buf = await testDosyasi();
const ham = await ayristir(buf);
ok(ham.length === 316, "316 veri satırı ayrıştırıldı", `(${ham.length})`);

const rapor = dogrula(ham, baglam);
console.log(`\nRapor: toplam=${rapor.toplam} yeni=${rapor.yeni} güncelleme=${rapor.guncelleme} hatalı=${rapor.hatali} kopya=${rapor.kopya}\n`);
ok(rapor.toplam === 316, "toplam 316", `(${rapor.toplam})`);
ok(rapor.yeni === 306, "yeni 306", `(${rapor.yeni})`);
ok(rapor.guncelleme === 2, "güncelleme 2", `(${rapor.guncelleme})`);
ok(rapor.hatali === 7, "hatalı 7", `(${rapor.hatali})`);
ok(rapor.kopya === 1, "kopya 1", `(${rapor.kopya})`);
ok(rapor.gecerliUrunler.length === 308, "geçerli 308 (yeni+güncelleme)", `(${rapor.gecerliUrunler.length})`);

const bul = (p) => rapor.satirlar.find((s) => s.parcaNo === p);
// YENİ MODEL: birebir aynı → kopya; farklı ama aynı parça no → iki ayrı geçerli
ok(bul("0417 5848")?.islem === "kopya", "birebir aynı satır → kopya (atlandı)", bul("0417 5848")?.islem);
const dup9 = rapor.satirlar.filter((s) => s.parcaNo === "DUP-9" && s.urun);
ok(dup9.length === 2, "aynı parça no + farklı TR ad → 2 ayrı geçerli ürün (hata değil)", `(${dup9.length})`);
ok(dup9[0]?.urun?.ad.tr !== dup9[1]?.urun?.ad.tr, "iki farklı ürünün adları korundu");

// Hatalar
ok(!!bul("")?.hatalar.some((h) => h.includes("Parça No boş")), "boş parça no");
ok(!!bul("X-VR")?.hatalar.some((h) => h.includes("Bilinmeyen marka")), "marka görünen ad ile eşleşmez (slug-only)");
ok(!!bul("X-M")?.hatalar.some((h) => h.includes("Bilinmeyen marka")), "bilinmeyen marka");
ok(!!bul("X-K")?.hatalar.some((h) => h.includes("Bilinmeyen kategori")), "bilinmeyen kategori");
ok(!!bul("X-KB")?.hatalar.some((h) => h.includes("Kategori boş")), "boş kategori");
ok(!!bul("X-S")?.hatalar.some((h) => h.includes("Stok Durumu")), "geçersiz stok");
ok(!!bul("X-A")?.hatalar.some((h) => h.includes("Ad (TR)")), "boş ad_tr");

// Çözümlemeler
ok(bul("VR-100")?.urun?.marka === "victor-reinz", "slug ile marka çözüldü");
ok(bul("VR-100")?.urun?.stokDurumu === "siparise-bagli", "TR stok etiketi çözüldü");
ok(bul("TOL-1")?.urun?.marka === "deutz" && bul("TOL-1")?.urun?.kategori === "motor-ic-parcalari", "slug tolerans");
ok(bul("TOL-1")?.urun?.stokDurumu === "stokta", "boş stok → stokta");
ok(bul("4910987")?.urun?.parcaNo === "4910987", "sayısal parça no string'e zorlandı", bul("4910987")?.urun?.parcaNo);
ok(bul("04910988")?.urun?.parcaNo === "04910988", "baştaki sıfır korundu");
ok(bul("04175848")?.islem === "guncelleme", "mevcut parça → güncelleme");
ok(bul("GEN-0001")?.urun?.ad.tr.includes("çğışöü"), "Türkçe karakter korundu");
const orn = bul("GEN-0001")?.urun as any;
ok(orn && !("fiyat" in orn) && !("durum" in orn) && !("eklenmeTarihi" in orn), "üründe kaldırılan alanlar yok");

// Round-trip
const disa = await disaAktar(rapor.gecerliUrunler);
const tekrar = await ayristir(disa);
ok(tekrar.length === rapor.gecerliUrunler.length, "dışa aktarım round-trip satır sayısı");
const tekrarRapor = dogrula(tekrar, { ...baglam, mevcutParcaNolar: [] });
ok(tekrarRapor.hatali === 0, "dışa aktarılan dosya hatasız okundu", `(${tekrarRapor.hatali})`);

const sablon = await sablonUret();
ok(sablon.byteLength > 0, "şablon üretildi");

console.log(`\n=== ${gecti} geçti, ${kaldi} kaldı ===`);
if (kaldi > 0) process.exit(1);
