// Edge function sarmalayıcı testi — gerçek HTTP yanıtlarını (301/410/geçir)
// fetch/context taklidiyle doğrular. Çalıştır (proje kökünden):
//   node --experimental-strip-types netlify/edge-functions/eski-url.test.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const burada = dirname(fileURLToPath(import.meta.url));
const kok = join(burada, "..", "..");

// 410 sayfasının gerçek build çıktısını fetch taklidine ver.
const p410 = join(kok, "dist", "410", "index.html");
const html410 = existsSync(p410) ? readFileSync(p410, "utf8") : "<h1>410</h1>";
globalThis.fetch = async () => new Response(html410, { status: 200 });

const { default: edge } = await import("./eski-url.ts");
const ctx = { next: () => ({ __gecti: true }) };
const istek = (yol) => new Request(`https://pekparts.com${yol}`);

let gecti = 0, kaldi = 0;
const ok = (k, ad, ek = "") => (k ? (gecti++, console.log(`✓ ${ad}`)) : (kaldi++, console.log(`✗ ${ad} ${ek}`)));

// 1) Gerçek ürün → 301 + doğru Location
let r = await edge(istek("/deutz-gasket/p/1504"), ctx);
ok(r?.status === 301 && r.headers.get("location") === "/en/urun/04289952/", "/p/1504 → 301 /en/urun/04289952/", `(${r?.status} ${r?.headers.get("location")})`);

// 2) SDF ürün → 301 doğru slug
r = await edge(istek("/x/p/1500"), ctx);
ok(r?.headers.get("location") === "/en/urun/0-065-1558-6-10/", "/p/1500 → SDF slug");

// 3) cnh /k/245 → 301 marka
r = await edge(istek("/cnh/k/245"), ctx);
ok(r?.status === 301 && r.headers.get("location") === "/en/marka/cnh/", "/k/245 → 301 /en/marka/cnh/");

// 4) nural /k/238 → 410 + gerçek 410 sayfa içeriği
r = await edge(istek("/nural/k/238"), ctx);
ok(r?.status === 410 && (await r.clone().text()).includes("410"), "/k/238 → 410 (410 sayfası)");

// 5) Spam ülke → 410
r = await edge(istek("/gaskets-albania"), ctx);
ok(r?.status === 410, "/gaskets-albania → 410", `(${r?.status})`);

// 6) Gerçek sayfa → geçir (context.next)
r = await edge(istek("/en/urun/04289952/"), ctx);
ok(r?.__gecti === true, "gerçek sayfa → geçir (next)");

// 7) Haritada olmayan /p/id → geçir
r = await edge(istek("/eski/p/9999"), ctx);
ok(r?.__gecti === true, "bilinmeyen /p/id → geçir");

console.log(`\n=== ${gecti} geçti, ${kaldi} kaldı ===`);
if (kaldi > 0) process.exit(1);
