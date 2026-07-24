// Teklif formu işleme çekirdeği — HOST-NÖTR. Netlify'a özel hiçbir şey yok;
// yalnızca düz nesneler ve fetch. Host değişirse (Cloudflare vb.) sadece ince
// sarmalayıcı (teklif.ts) yeniden yazılır, bu çekirdek aynı kalır. Şartname §9.

export interface TeklifVeri {
  ad?: string;
  iletisim?: string;
  adet?: string | number;
  mesaj?: string;
  parcaNo?: string;
  urunAd?: string;
  dil?: string;
  kvkk?: string | boolean;
  website?: string; // honeypot — gerçek kullanıcı boş bırakır
}

export interface TeklifConfig {
  resendKey?: string;
  from: string; // "Pekparts <bildirim@pekparts.com>"
  talepEpostasiYedek?: string; // Sanity'den okunamazsa
  sanity?: { projectId: string; dataset: string; token: string };
  ip?: string;
}

export interface TeklifSonuc {
  ok: boolean;
  status: number;
  kod: "ok" | "kvkk" | "eksik" | "oran" | "yapilandirma" | "eposta";
}

// —— Oran sınırlama (best-effort, bellek içi). Kalıcı sınırlama için host KV /
// Netlify Rate Limiting kullanılmalı; sıcak instance'larda bu yeterli engel. ——
const PENCERE_MS = 10 * 60 * 1000;
const MAKS = 5;
const gecmis = new Map<string, number[]>();
function oranAsildi(ip: string): boolean {
  const simdi = Date.now();
  const liste = (gecmis.get(ip) ?? []).filter((t) => simdi - t < PENCERE_MS);
  liste.push(simdi);
  gecmis.set(ip, liste);
  return liste.length > MAKS;
}

const dogru = (v: unknown) =>
  v === true || v === "true" || v === "on" || v === "1" || v === "evet";

export async function teklifIsle(veri: TeklifVeri, config: TeklifConfig): Promise<TeklifSonuc> {
  // 1) Honeypot — doluysa bot; başarılıymış gibi sessizce yut (CAPTCHA yok, §9).
  if (veri.website && String(veri.website).trim() !== "") {
    return { ok: true, status: 200, kod: "ok" };
  }

  // 2) KVKK onayı zorunlu
  if (!dogru(veri.kvkk)) return { ok: false, status: 400, kod: "kvkk" };

  // 3) Zorunlu alanlar
  const ad = (veri.ad ?? "").toString().trim();
  const iletisim = (veri.iletisim ?? "").toString().trim();
  if (!ad || !iletisim) return { ok: false, status: 400, kod: "eksik" };

  // 4) Oran sınırlama
  // if (config.ip && oranAsildi(config.ip)) return { ok: false, status: 429, kod: "oran" };

  const parcaNo = (veri.parcaNo ?? "").toString().trim();
  const urunAd = (veri.urunAd ?? "").toString().trim();
  const adet = Number(veri.adet) || 1;
  const mesaj = (veri.mesaj ?? "").toString().trim();

  // Talep e-postası: panelden (siteAyarlari) oku; yoksa yedek.
  const alici = (await talepEpostasiGetir(config)) || config.talepEpostasiYedek;
  if (!config.resendKey || !alici) return { ok: false, status: 500, kod: "yapilandirma" };

  // Panele kayıt (best-effort — e-posta düşse bile talep kaybolmasın)
  await sanityyeYaz(config, { ad, iletisim, adet, mesaj, parcaNo, urunAd, dil: veri.dil }).catch(
    () => {},
  );

  // E-posta — bu sitenin ürettiği asıl değer. Konu satırında parça no (§9).
  const konu = parcaNo
    ? `Teklif talebi: ${parcaNo} — ${adet} adet`
    : `Teklif talebi — ${adet} adet`;
  const govde = [
    `Parça no: ${parcaNo || "—"}`,
    `Ürün: ${urunAd || "—"}`,
    `Adet: ${adet}`,
    `Gönderen: ${ad}`,
    `İletişim: ${iletisim}`,
    mesaj ? `Mesaj: ${mesaj}` : "",
    `Dil: ${veri.dil || "—"}`,
  ]
    .filter(Boolean)
    .join("\n");

  // reply-to müşterinin e-postası (e-posta girdiyse): işletme sahibi doğrudan
  // "yanıtla" ile müşteriye ulaşır (§ kullanıcı notu).
  const replyTo = iletisim.includes("@") ? iletisim : undefined;

  const gonderildi = await resendGonder(config, { to: alici, konu, govde, replyTo });
  if (!gonderildi) return { ok: false, status: 502, kod: "eposta" };

  return { ok: true, status: 200, kod: "ok" };
}

async function talepEpostasiGetir(config: TeklifConfig): Promise<string | null> {
  if (!config.sanity) return null;
  try {
    const { projectId, dataset } = config.sanity;
    const q = encodeURIComponent(`*[_type=="siteAyarlari"][0].talepEpostasi`);
    const url = `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${q}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = (await r.json()) as { result?: string };
    return j.result ?? null;
  } catch {
    return null;
  }
}

async function sanityyeYaz(
  config: TeklifConfig,
  t: { ad: string; iletisim: string; adet: number; mesaj: string; parcaNo: string; urunAd: string; dil?: string },
): Promise<void> {
  if (!config.sanity?.token) return;
  const { projectId, dataset, token } = config.sanity;
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      mutations: [
        {
          create: {
            _type: "talep",
            parcaNo: t.parcaNo,
            urunAd: t.urunAd,
            ad: t.ad,
            iletisim: t.iletisim,
            adet: t.adet,
            mesaj: t.mesaj,
            dil: t.dil,
            tarih: new Date().toISOString(),
            cevaplandi: false,
          },
        },
      ],
    }),
  });
}

async function resendGonder(
  config: TeklifConfig,
  m: { to: string; konu: string; govde: string; replyTo?: string },
): Promise<boolean> {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.resendKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [m.to],
        subject: m.konu,
        text: m.govde,
        ...(m.replyTo ? { reply_to: m.replyTo } : {}),
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
