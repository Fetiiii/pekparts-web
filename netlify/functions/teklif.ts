import type { Handler } from "@netlify/functions";
import { teklifIsle, type TeklifVeri } from "./lib/teklif-core";
// Netlify'a özel İNCE sarmalayıcı. Tüm mantık host-nötr teklif-core'da.
// Host değişirse yalnızca bu dosya yeniden yazılır.
function config() {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET ?? "production";
  const token = process.env.SANITY_WRITE_TOKEN;
  return {
    resendKey: process.env.RESEND_API_KEY,
    from: process.env.TEKLIF_FROM ?? "Pekparts <bildirim@pekparts.com>",
    talepEpostasiYedek: process.env.TALEP_EPOSTA,
    sanity: projectId && token ? { projectId, dataset, token } : undefined,
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
  };
}
function govdeAyristir(body: string, tur: string): TeklifVeri {
  if (tur.includes("application/json")) return JSON.parse(body || "{}");
  const p = new URLSearchParams(body);
  return Object.fromEntries(p.entries()) as TeklifVeri;
}
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Yalnızca POST" };
  }
  const tur = event.headers["content-type"] ?? "application/json";
  let veri: TeklifVeri;
  try {
    veri = govdeAyristir(event.body ?? "", tur);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ kod: "eksik" }) };
  }
  const ip =
    event.headers["x-nf-client-connection-ip"] ??
    (event.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  const sonuc = await teklifIsle(veri, { ...config(), ip });
  // JS'siz gönderim (form-encoded): basit HTML onay/uyarı döndür.
  if (!tur.includes("application/json")) {
    const html = sonuc.ok
      ? `<!doctype html><meta charset=utf-8><title>Talebiniz alındı</title><body style="font-family:sans-serif;max-width:38rem;margin:3rem auto;padding:0 1rem"><h1>Talebiniz alındı</h1><p>Genellikle aynı gün içinde dönüş yapıyoruz.</p><p><a href="/">Ana sayfaya dön</a></p>`
      : `<!doctype html><meta charset=utf-8><title>Gönderilemedi</title><body style="font-family:sans-serif;max-width:38rem;margin:3rem auto;padding:0 1rem"><h1>Gönderilemedi</h1><p>Lütfen telefon veya WhatsApp'tan bize ulaşın.</p><p><a href="/">Ana sayfaya dön</a></p>`;
    return {
      statusCode: sonuc.ok ? 200 : sonuc.status,
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html,
    };
  }
  return {
    statusCode: sonuc.status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: sonuc.ok, kod: sonuc.kod }),
  };
};
