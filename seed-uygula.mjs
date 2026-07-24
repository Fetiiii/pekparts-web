import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const KOK = "src/content";
const veri = JSON.parse(readFileSync("seed.json", "utf8"));

for (const [koleksiyon, kayitlar] of Object.entries({
  kategoriler: veri.kategoriler,
  markalar: veri.markalar,
  urunler: veri.urunler,
})) {
  const dizin = join(KOK, koleksiyon);
  rmSync(dizin, { recursive: true, force: true });
  mkdirSync(dizin, { recursive: true });

  for (const kayit of kayitlar) {
    const ad = (kayit.slug ?? kayit.parcaNo)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    writeFileSync(join(dizin, `${ad}.json`), JSON.stringify(kayit, null, 2) + "\n");
  }
  console.log(`${koleksiyon}: ${kayitlar.length} dosya`);
}
