import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import seedGuard from "./integrations/seed-guard.mjs";

// Alan adı canlıda pekparts.com — sitemap/hreflang/OG mutlak URL için gerekli.
const SITE = process.env.SITE_URL ?? "https://pekparts.com";

export default defineConfig({
  site: SITE,
  output: "static",
  // Sonda slash tutarlı: canonical/hreflang/sitemap/iç bağlantılar ve eski→yeni
  // yönlendirme hedefleri hep `/en/urun/x/` biçiminde.
  trailingSlash: "always",
  i18n: {
    // Varsayılan dil İngilizce (iş kararı). Yol segmentleri değişmez (urun/marka).
    defaultLocale: "en",
    locales: ["en", "tr", "ar", "ru"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  // Kök URL varsayılan dile (İngilizce). Netlify'da 301 olarak da tanımlı.
  redirects: {
    "/": "/en/",
  },
  integrations: [
    seedGuard(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", tr: "tr", ar: "ar", ru: "ru" },
      },
      // Hata sayfaları (404/410) ve eski spam URL'leri sitemap'te olmaz.
      filter: (sayfa) => !/\/(404|410)\/?$/.test(sayfa),
    }),
  ],
  vite: {
    plugins: [tailwind()],
  },
});
