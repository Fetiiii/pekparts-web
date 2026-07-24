import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

// Test verisinin canlıya sızmasını engelleyen basit kontrol.
// - Her build'de yüksek sesle UYARIR (dev akışı bloklanmaz).
// - CANLI=1 (veya CANLI=true) ortam değişkeni varsa, seed tespit edilirse
//   build'i HATA ile durdurur. Canlı dağıtım komutunu `CANLI=1 npm run build`
//   şeklinde çalıştır; test verisi asla yayına çıkamaz.
//
// Gerçek katalog geldiğinde: seed.json silinir ve içerik dosyaları
// gerçek parça numaralarıyla değişir; o noktada bu kontrol sessiz kalır.

// seed.json'daki UYDURMA parça numaraları. Gerçek olan altı numara
// (04910987, 04286036, 04280528, 04175848, 04175464, 02230975) bilerek
// dışarıda bırakıldı — onların varlığı seed işareti sayılmaz.
const SAHTE_PARCA_NO = new Set([
  "04256803",
  "01182672",
  "04270318",
  "TCD2012L04-REV",
  "2645A050",
  "U5MK8564",
  "3802429",
  "3937144",
  "1S9036",
  "7W2326",
  "4224861M1",
  "320/04133",
]);

function seedIzleriBul(kok) {
  const izler = [];

  // 1) seed.json hâlâ duruyor mu? (_uyari işaretiyle)
  const seedYolu = join(kok, "seed.json");
  if (existsSync(seedYolu)) {
    try {
      const veri = JSON.parse(readFileSync(seedYolu, "utf8"));
      if (veri._uyari) izler.push("seed.json kök dizinde duruyor (_uyari işareti mevcut)");
    } catch {
      izler.push("seed.json okunamadı ama dosya mevcut");
    }
  }

  // 2) İçerik dosyalarında sahte parça numarası var mı?
  const urunlerDizini = join(kok, "src", "content", "urunler");
  if (existsSync(urunlerDizini)) {
    for (const dosya of readdirSync(urunlerDizini)) {
      if (!dosya.endsWith(".json")) continue;
      try {
        const urun = JSON.parse(readFileSync(join(urunlerDizini, dosya), "utf8"));
        if (SAHTE_PARCA_NO.has(urun.parcaNo)) {
          izler.push(`sahte parça no içerikte: ${urun.parcaNo} (${dosya})`);
        }
      } catch {
        /* bozuk dosyayı burada ele almıyoruz, astro check yakalar */
      }
    }
  }

  return izler;
}

// Üretilmiş HTML'de yer tutucu metin sızıntısını arar (Aşama 4, §5). Bu işaretler
// içerik/ayar CMS'te doldurulmadığında görünür ve canlıya çıkmamalıdır.
const YER_TUTUCU_ISARET = [
  "[İçerik firmadan gelecek]",
  "[Content to be provided by the company]",
  "[Adres firmadan alınacak]",
  "[Çalışma saatleri firmadan alınacak]",
];

function htmlDosyalari(dizin, biriktir = []) {
  if (!existsSync(dizin)) return biriktir;
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) htmlDosyalari(yol, biriktir);
    else if (ad.endsWith(".html")) biriktir.push(yol);
  }
  return biriktir;
}

function yerTutucuIzleri(distDizini) {
  const bulunan = new Map(); // işaret → dosya sayısı
  for (const dosya of htmlDosyalari(distDizini)) {
    const icerik = readFileSync(dosya, "utf8");
    for (const isaret of YER_TUTUCU_ISARET) {
      if (icerik.includes(isaret)) bulunan.set(isaret, (bulunan.get(isaret) ?? 0) + 1);
    }
  }
  return [...bulunan.entries()].map(([isaret, n]) => `yer tutucu metin "${isaret}" ${n} sayfada`);
}

export default function seedGuard() {
  const kok = process.cwd();
  const canli = ["1", "true", "evet"].includes(String(process.env.CANLI ?? "").toLowerCase());
  const sanityYapili = !!process.env.SANITY_PROJECT_ID;

  function yayilim(log, baslik, izler, ekBilgi) {
    const detay = izler.map((s) => `  • ${s}`).join("\n");
    if (canli) {
      (log.error ?? console.error).call(log, `\n${baslik}\n${detay}\n${ekBilgi.canli}\n`);
      throw new Error(baslik);
    }
    (log.warn ?? console.warn).call(log, `\n${baslik}\n${detay}\n${ekBilgi.dev}\n`);
  }

  return {
    name: "pekparts-seed-guard",
    hooks: {
      "astro:build:start": ({ logger }) => {
        const log = logger ?? console;

        // Yayın derlemesinde Sanity zorunlu (yerel seed'e düşülmez).
        if (canli && !sanityYapili) {
          (log.error ?? console.error).call(
            log,
            "\nYAYIN DERLEMESİ İÇİN SANITY ZORUNLU — SANITY_PROJECT_ID tanımlı değil.\n" +
              "CANLI=1 ile içerik dosyalarına (seed) düşülemez. Ortam değişkenlerini ayarla.\n",
          );
          throw new Error("CANLI=1 ama Sanity yapılandırılmamış (seed-guard).");
        }

        const izler = seedIzleriBul(kok);
        if (izler.length === 0) return;
        yayilim(log, "TEST VERİSİ TESPİT EDİLDİ — bu build gerçek katalog içermiyor.", izler, {
          canli: "CANLI=1 ayarlı olduğu için build DURDURULDU. Gerçek katalogla yayına al.",
          dev: "Geliştirme build'i sürdürülüyor. Canlıda `CANLI=1 npm run build` kullan.",
        });
      },

      // Üretim sonrası: HTML'de yer tutucu metin sızıntısı taraması (§5).
      "astro:build:done": ({ dir, logger }) => {
        const log = logger ?? console;
        const distDizini = dir?.pathname
          ? decodeURIComponent(dir.pathname)
          : join(kok, "dist");
        const izler = yerTutucuIzleri(distDizini);
        if (izler.length === 0) return;
        yayilim(log, "YER TUTUCU METİN CANLIYA SIZDI — CMS'te doldurulmamış içerik var.", izler, {
          canli: "CANLI=1 ayarlı olduğu için build REDDEDİLDİ. Panelden içerikleri doldur.",
          dev: "Geliştirme build'i sürdürülüyor. Canlıdan önce içerikleri panelden doldur.",
        });
      },
    },
  };
}
