// Güncel Excel şablonunu üretir ve proje köküne yazar.
// Çalıştır (studio/ içinde): node --experimental-strip-types scripts/sablon-uret.mjs
import { writeFileSync } from "node:fs";
import { sablonUret, SUTUNLAR } from "../lib/urun-excel.ts";

const buf = await sablonUret();
const cikti = "../pekparts-urun-sablonu.xlsx";
writeFileSync(cikti, Buffer.from(buf));
console.log(`✓ Şablon üretildi: pekparts-urun-sablonu.xlsx (${(buf.byteLength / 1024).toFixed(1)} KB)`);
console.log(`  Kolonlar (${SUTUNLAR.length}): ${SUTUNLAR.map((s) => s.baslik).join(", ")}`);
