import type { APIRoute } from "astro";

// robots.txt — yayın anahtarına bağlı. PUBLIC_SITE_INDEXABLE=true olana kadar
// tüm site kapalı (Disallow: /). Yayında Sitemap satırı + tam erişim.
export const GET: APIRoute = ({ site }) => {
  const indexlenebilir =
    (import.meta.env.PUBLIC_SITE_INDEXABLE ?? process.env.PUBLIC_SITE_INDEXABLE) === "true";

  const govde = indexlenebilir
    ? [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${new URL("sitemap-index.xml", site).href}`,
        "",
      ].join("\n")
    : [
        "# Site henüz yayında değil — indekslemeye kapalı.",
        "User-agent: *",
        "Disallow: /",
        "",
      ].join("\n");

  return new Response(govde, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
