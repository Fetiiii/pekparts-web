// teklif-core testi — fetch taklitlenir; honeypot/KVKK/zorunlu/oran/e-posta.
// Çalıştır: node --experimental-strip-types teklif-core.test.ts
import { teklifIsle, type TeklifConfig } from "../netlify/functions/lib/teklif-core.ts";

let gecti = 0, kaldi = 0;
const ok = (k: boolean, ad: string, ek = "") =>
  k ? (gecti++, console.log(`✓ ${ad}`)) : (kaldi++, console.log(`✗ ${ad} ${ek}`));

// fetch taklidi — çağrıları kaydeder, Resend/Sanity için 200 döner.
let cagrilar: { url: string; body: any }[] = [];
(globalThis as any).fetch = async (url: string, init?: any) => {
  const body = init?.body ? JSON.parse(init.body) : undefined;
  cagrilar.push({ url, body });
  if (url.includes("data/query")) {
    return { ok: true, json: async () => ({ result: "talep@pekparts.com" }) };
  }
  return { ok: true, json: async () => ({}) };
};

const temelConfig = (): TeklifConfig => ({
  resendKey: "re_test",
  from: "Pekparts <bildirim@pekparts.com>",
  sanity: { projectId: "abc", dataset: "production", token: "tok" },
  ip: `ip-${Math.random()}`,
});

// 1) Honeypot dolu → sessizce ok, e-posta YOK
cagrilar = [];
let r = await teklifIsle(
  { website: "http://spam", ad: "Bot", iletisim: "x", kvkk: "true" },
  temelConfig(),
);
ok(r.ok && r.status === 200, "honeypot dolu → ok (sessiz)");
ok(!cagrilar.some((c) => c.url.includes("resend")), "honeypot → e-posta gönderilmedi");

// 2) KVKK onayı yok → 400
cagrilar = [];
r = await teklifIsle({ ad: "Ali", iletisim: "5551112233" }, temelConfig());
ok(!r.ok && r.status === 400 && r.kod === "kvkk", "KVKK yok → 400 kvkk", JSON.stringify(r));

// 3) Zorunlu alan eksik → 400 eksik
r = await teklifIsle({ ad: "", iletisim: "", kvkk: "on" }, temelConfig());
ok(!r.ok && r.kod === "eksik", "ad/iletişim boş → 400 eksik", JSON.stringify(r));

// 4) Geçerli → e-posta gönderildi, konu parça no + adet, talep yazıldı
cagrilar = [];
r = await teklifIsle(
  { ad: "Ayşe Yılmaz", iletisim: "ayse@firma.com", adet: "3", parcaNo: "04175848", urunAd: "Yakıt pompası", dil: "tr", kvkk: "true", mesaj: "Acil" },
  temelConfig(),
);
ok(r.ok && r.status === 200, "geçerli gönderim → ok");
const mail = cagrilar.find((c) => c.url.includes("resend"));
ok(!!mail, "Resend çağrıldı");
ok(mail?.body.subject === "Teklif talebi: 04175848 — 3 adet", "konu parça no + adet içeriyor", mail?.body.subject);
ok(mail?.body.reply_to === "ayse@firma.com", "reply-to müşterinin e-postası", mail?.body.reply_to);
ok(mail?.body.from.includes("bildirim@pekparts.com"), "gönderici kendi alan adı");
ok(mail?.body.to?.[0] === "talep@pekparts.com", "alıcı = panelden talep e-postası");
const yazim = cagrilar.find((c) => c.url.includes("data/mutate"));
ok(!!yazim && yazim.body.mutations[0].create._type === "talep", "Sanity'ye talep yazıldı");

// 5) reply-to: telefon girildiyse YOK
cagrilar = [];
r = await teklifIsle(
  { ad: "Veli", iletisim: "0555 111 22 33", adet: "1", parcaNo: "X1", kvkk: "1" },
  temelConfig(),
);
const mail2 = cagrilar.find((c) => c.url.includes("resend"));
ok(mail2 && !("reply_to" in mail2.body), "telefon → reply-to yok");

// 6) Oran sınırlama: aynı IP'den 6. istek → 429
const cfg = { ...temelConfig(), ip: "sabit-ip" };
let sonKod = "";
for (let i = 0; i < 6; i++) {
  const rr = await teklifIsle({ ad: "A", iletisim: "a@b.com", kvkk: "on" }, cfg);
  sonKod = rr.kod;
}
ok(sonKod === "oran", "6. istek → oran sınırı (429)", sonKod);

// 7) Yapılandırma eksik (resendKey yok) → 500
r = await teklifIsle(
  { ad: "A", iletisim: "a@b.com", kvkk: "on" },
  { from: "x", sanity: undefined, ip: "y" } as TeklifConfig,
);
ok(!r.ok && r.kod === "yapilandirma", "resendKey yok → 500 yapılandırma", JSON.stringify(r));

console.log(`\n=== ${gecti} geçti, ${kaldi} kaldı ===`);
if (kaldi > 0) process.exit(1);
