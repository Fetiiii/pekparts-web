import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";
import seedGuard from "./integrations/seed-guard.mjs";

// Alan adı canlıda pekparts.com — sitemap/hreflang/OG mutlak URL için gerekli.
const SITE = process.env.SITE_URL ?? "https://pekparts.com";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: "tr",
    locales: ["tr", "en", "ar", "ru"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  // Kök URL, varsayılan dile gider. Dil seçimi kalıcı olsun diye tarayıcı
  // algılamasını Aşama 2'de istemci tarafında ele alacağız; şimdilik tr.
  redirects: {
    "/": "/tr/",
  },
  integrations: [seedGuard()],
  vite: {
    plugins: [tailwind()],
  },
});
