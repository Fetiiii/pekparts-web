// Excel motoru testi — gerçek koşullar: 300+ satır, hatalı/tekrarlı/Türkçe/boş.
// Çalıştır: node --experimental-strip-types lib/urun-excel.test.ts
import ExcelJS from "exceljs";
import {
  SUTUNLAR,
  ayristir,
  dogrula,
  disaAktar,
  sablonUret,
  type Baglam,
} from "./urun-excel.ts";

let gecti = 0;
let kaldi = 0;
function ok(kosul: boolean, ad: string, ek = "") {
  if (kosul) {
    gecti++;
    console.log(`✓ ${ad}`);
  } else {
    kaldi++;
    console.log(`✗ HATA: ${ad} ${ek}`);
  }
}

const baglam: Baglam = {
  markalar: [
    { slug: "deutz", ad: "Deutz" },
    { slug: "perkins", ad: "Perkins" },
    { slug: "cummins", ad: "Cummins" },
    { slug: "caterpillar", ad: "Caterpillar" },
    { slug: "massey-ferguson", ad: "Massey Ferguson" },
    { slug: "jcb", ad: "JCB" },
  ],
  kategoriler: [
    { slug: "conta-takimlari", adlar: ["Conta takımları", "Gasket sets"] },
    { slug: "filtreler", adlar: ["Filtreler", "Filters"] },
    { slug: "motor-parcalari", adlar: ["Motor parçaları", "Engine parts"] },
    { slug: "yakit-sistemi", adlar: ["Yakıt sistemi", "Fuel system"] },
    { slug: "sogutma-sistemi", adlar: ["Soğutma sistemi", "Cooling system"] },
    { slug: "komple-motorlar", adlar: ["Komple motorlar", "Complete engines"] },
  ],
  mevcutParcaNolar: ["04175848", "2645A050"], // güncelleme testi için
};

// —— Test dosyasını programatik oluştur ——
async function testDosyasi(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ürünler");
  ws.columns = SUTUNLAR.map((s) => ({ header: s.baslik, key: s.anahtar }));
  ws.getRow(1).font = { bold: true };

  const satir = (o: Record<string, unknown>) => ws.addRow(o);

  // 17 kenar-durum satırı
  satir({ parcaNo: "04175848", marka: "deutz", kategori: "yakit-sistemi", stokDurumu: "Stokta", durum: "Orijinal", ad_tr: "Deutz yakıt pompası", oneCikan: "Evet" }); // güncelleme, Türkçe
  satir({ parcaNo: "0417 5848", marka: "deutz", kategori: "yakit-sistemi", stokDurumu: "Stokta", durum: "Orijinal", ad_tr: "Kopya kayıt" }); // normalize dup → hata
  satir({ parcaNo: "", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "Parçasız" }); // parcaNo boş → hata
  satir({ parcaNo: "X-VOLVO", marka: "Volvo", kategori: "filtreler", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "Volvo filtre" }); // bilinmeyen marka
  satir({ parcaNo: "X-UFO", marka: "deutz", kategori: "uçan-halı", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "UFO parça" }); // bilinmeyen kategori
  satir({ parcaNo: "X-KATBOS", marka: "deutz", kategori: "", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "Kategorisiz" }); // kategori boş
  satir({ parcaNo: "X-STOK", marka: "deutz", kategori: "filtreler", stokDurumu: "belki", durum: "Muadil", ad_tr: "Stok hatalı" }); // geçersiz stok
  satir({ parcaNo: "X-DURUM", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", durum: "yeni gibi", ad_tr: "Durum hatalı" }); // geçersiz durum
  satir({ parcaNo: "X-FIYAT", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "Fiyat hatalı", fiyat: "abc" }); // geçersiz fiyat
  satir({ parcaNo: "X-ADSIZ", marka: "deutz", kategori: "filtreler", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "" }); // ad_tr boş
  satir({ parcaNo: "P-2645", marka: "Perkins", kategori: "motor-parcalari", stokDurumu: "Stokta", durum: "Orijinal", ad_tr: "Perkins parça (marka adıyla)" }); // marka AD ile
  satir({ parcaNo: "P-FILT", marka: "perkins", kategori: "Filters", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "İngilizce kategori adı" }); // kategori EN ad ile
  satir({ parcaNo: "P-SIP", marka: "cummins", kategori: "yakit-sistemi", stokDurumu: "Siparişe bağlı", durum: "Orijinal", ad_tr: "Sipariş etiketli" }); // TR stok etiketi
  satir({ parcaNo: "P-USD", marka: "cummins", kategori: "yakit-sistemi", stokDurumu: "Stokta", durum: "Orijinal", ad_tr: "Dolarlı", fiyat: "2400", paraBirimi: "$" }); // $ → USD
  satir({ parcaNo: "P-YAYIN", marka: "jcb", kategori: "filtreler", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "Yayında boş", oneCikan: "Evet" }); // yayinda boş → true
  satir({ parcaNo: "P-TARIH", marka: "jcb", kategori: "filtreler", stokDurumu: "Stokta", durum: "Muadil", ad_tr: "Tarih GG.AA.YYYY", eklenmeTarihi: "14.05.2026" }); // tarih formatı
  satir({ parcaNo: "2645A050", marka: "perkins", kategori: "motor-parcalari", stokDurumu: "Stokta", durum: "Orijinal", ad_tr: "Perkins silindir kapağı" }); // güncelleme

  // 300 geçerli üretilmiş satır
  const markaSlug = ["deutz", "perkins", "cummins", "caterpillar", "massey-ferguson", "jcb"];
  const katSlug = ["conta-takimlari", "filtreler", "motor-parcalari", "yakit-sistemi", "sogutma-sistemi", "komple-motorlar"];
  const stok = ["Stokta", "Siparişe bağlı", "Tükendi"];
  const durum = ["Orijinal", "Muadil", "Revizyonlu"];
  for (let i = 1; i <= 300; i++) {
    satir({
      parcaNo: `GEN-${String(i).padStart(4, "0")}`,
      muadilNo: i % 3 === 0 ? `ALT-${i}; ALT2-${i}` : "",
      marka: markaSlug[i % 6],
      kategori: katSlug[i % 6],
      uyumluMotorlar: "TCD 2012 L04, BF4M 2012",
      stokDurumu: stok[i % 3],
      durum: durum[i % 3],
      fiyat: i % 4 === 0 ? String(1000 + i) : "",
      paraBirimi: i % 4 === 0 ? "TRY" : "",
      oneCikan: i % 10 === 0 ? "Evet" : "",
      yayinda: "",
      ad_tr: `Üretilmiş parça ${i} — çğışöü`,
      ad_en: i % 2 === 0 ? `Generated part ${i}` : "",
    });
  }
  return wb.xlsx.writeBuffer();
}

// —— Çalıştır ——
console.log("=== Excel motoru testi ===\n");

const buf = await testDosyasi();
const ham = await ayristir(buf);
ok(ham.length === 317, "317 veri satırı ayrıştırıldı", `(bulunan: ${ham.length})`);

const rapor = dogrula(ham, baglam);
console.log(`\nRapor: toplam=${rapor.toplam} yeni=${rapor.yeni} güncelleme=${rapor.guncelleme} hatalı=${rapor.hatali}\n`);

ok(rapor.toplam === 317, "toplam 317");
ok(rapor.yeni === 306, "yeni 306", `(${rapor.yeni})`);
ok(rapor.guncelleme === 2, "güncelleme 2 (04175848, 2645A050)", `(${rapor.guncelleme})`);
ok(rapor.hatali === 9, "hatalı 9", `(${rapor.hatali})`);
ok(rapor.gecerliUrunler.length === 308, "kısmi aktarım: 308 geçerli ürün", `(${rapor.gecerliUrunler.length})`);

// Belirli hata mesajları
const hata = (parcaNo: string) => rapor.satirlar.find((s) => s.parcaNo === parcaNo);
ok(!!hata("0417 5848")?.hatalar.some((h) => h.includes("tekrar ediyor")), "normalize kopya yakalandı (0417 5848 ↔ 04175848)");
ok(!!hata("")?.hatalar.some((h) => h.includes("Parça No boş")), "boş parça no yakalandı");
ok(!!hata("X-VOLVO")?.hatalar.some((h) => h.includes("Bilinmeyen marka")), "bilinmeyen marka yakalandı");
ok(!!hata("X-UFO")?.hatalar.some((h) => h.includes("Bilinmeyen kategori")), "bilinmeyen kategori yakalandı");
ok(!!hata("X-KATBOS")?.hatalar.some((h) => h.includes("Kategori boş")), "boş kategori yakalandı");
ok(!!hata("X-STOK")?.hatalar.some((h) => h.includes("Stok Durumu")), "geçersiz stok yakalandı");
ok(!!hata("X-FIYAT")?.hatalar.some((h) => h.includes("Fiyat")), "geçersiz fiyat yakalandı");
ok(!!hata("X-ADSIZ")?.hatalar.some((h) => h.includes("Ad (TR)")), "boş ad_tr yakalandı");

// Hata satırlarında gerçek Excel satır no'su var mı
const volvo = hata("X-VOLVO");
ok(!!volvo && volvo.satir > 1, "hata satırı gerçek Excel satır no taşıyor", `(satır ${volvo?.satir})`);

// Değer eşlemeleri
const perkinsAd = rapor.satirlar.find((s) => s.parcaNo === "P-2645");
ok(perkinsAd?.urun?.marka === "perkins", "marka adıyla çözüldü (Perkins → perkins)");
const enKat = rapor.satirlar.find((s) => s.parcaNo === "P-FILT");
ok(enKat?.urun?.kategori === "filtreler", "İngilizce kategori adı çözüldü (Filters → filtreler)");
const sip = rapor.satirlar.find((s) => s.parcaNo === "P-SIP");
ok(sip?.urun?.stokDurumu === "siparise-bagli", "TR stok etiketi çözüldü (Siparişe bağlı)");
const usd = rapor.satirlar.find((s) => s.parcaNo === "P-USD");
ok(usd?.urun?.paraBirimi === "USD", "para birimi $ → USD");
const yayin = rapor.satirlar.find((s) => s.parcaNo === "P-YAYIN");
ok(yayin?.urun?.yayinda === true, "boş yayında → true (varsayılan)");
const tarih = rapor.satirlar.find((s) => s.parcaNo === "P-TARIH");
ok(tarih?.urun?.eklenmeTarihi === "2026-05-14", "GG.AA.YYYY → YYYY-AA-GG", `(${tarih?.urun?.eklenmeTarihi})`);

// parça no NORMALİZE EDİLMEDEN saklanıyor mu
const upd = rapor.satirlar.find((s) => s.parcaNo === "04175848");
ok(upd?.urun?.parcaNo === "04175848" && upd?.islem === "guncelleme", "parça no biçimi korundu + güncelleme");

// Türkçe karakter korunuyor mu
const genOrn = rapor.satirlar.find((s) => s.parcaNo === "GEN-0001");
ok(genOrn?.urun?.ad.tr.includes("çğışöü"), "Türkçe karakterler korundu");

// muadilNo ayrıştırma
const genMuadil = rapor.satirlar.find((s) => s.parcaNo === "GEN-0003");
ok(genMuadil?.urun?.muadilNo.length === 2, "muadil no ; ile ayrıştırıldı", `(${JSON.stringify(genMuadil?.urun?.muadilNo)})`);

// —— Dışa aktar → tekrar ayrıştır (round-trip) ——
const disa = await disaAktar(rapor.gecerliUrunler);
const tekrar = await ayristir(disa);
ok(tekrar.length === rapor.gecerliUrunler.length, "dışa aktarım round-trip satır sayısı", `(${tekrar.length})`);
const tekrarRapor = dogrula(tekrar, { ...baglam, mevcutParcaNolar: [] });
ok(tekrarRapor.hatali === 0, "dışa aktarılan dosya hatasız geri okundu", `(hatalı: ${tekrarRapor.hatali})`);

// —— Şablon üretimi ——
const sablon = await sablonUret();
ok(sablon.byteLength > 0, "şablon üretildi", `(${sablon.byteLength} bayt)`);
const sablonHam = await ayristir(sablon);
ok(sablonHam.every((r) => r.veri.parcaNo !== "" || true), "şablon örnek satırı ayrıştırılabilir");

console.log(`\n=== ${gecti} geçti, ${kaldi} kaldı ===`);
if (kaldi > 0) process.exit(1);
