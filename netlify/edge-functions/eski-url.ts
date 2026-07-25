import type { Context } from "@netlify/edge-functions";
import { eskiUrlKarari } from "./lib/eski-url-karar.ts";

// Eski site URL geçişi (§11). Tüm istekleri erkenden süzer; yalnız eski
// desenlere müdahale eder, gerisini olduğu gibi geçirir. Mantık saf
// eskiUrlKarari()'de ve yerelde birim testli.
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const karar = eskiUrlKarari(url.pathname);

  if (karar.tip === "301") {
    return new Response(null, {
      status: 301,
      headers: { location: karar.hedef, "cache-control": "public, max-age=3600" },
    });
  }

  if (karar.tip === "410") {
    // 410 sayfasının içeriğini 410 durumuyla sun (kullanıcıyı kaybetme).
    const sayfa = await fetch(new URL("/410/", url.origin));
    return new Response(await sayfa.text(), {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return context.next();
};

export const config = { path: "/*" };
