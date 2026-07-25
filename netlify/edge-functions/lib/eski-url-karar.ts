// Eski URL geçiş kararı — SAF fonksiyon (Netlify Edge + Node testi ortak).
// Şartname §11: gerçek ürünler 301, spam ülke sayfaları 410, gerisi geçer.

export type Karar =
  | { tip: "301"; hedef: string }
  | { tip: "410" }
  | { tip: "gecir" };

// Eski gerçek ürün sayfaları: /<slug>/p/<id> → yeni ürün URL'si (301, birebir).
// Yalnız bu 9 id'nin karşılığı var; diğerleri geçer (doğal 404).
const URUN_HARITA: Record<string, string> = {
  "1504": "/en/urun/04289952/",
  "1534": "/en/urun/02937551/",
  "1370": "/en/urun/04156548/",
  "1360": "/en/urun/02937454/",
  "1349": "/en/urun/01172715/",
  "1404": "/en/urun/04287663/",
  "1425": "/en/urun/79268600/",
  "1385": "/en/urun/04214159/",
  "1500": "/en/urun/0-065-1558-6-10/", // SDF Pump Gear Set (0.065.1558.6/10)
};

// Eski marka/kategori liste sayfaları: /<slug>/k/<id>
const KATEGORI_HARITA: Record<string, Karar> = {
  "245": { tip: "301", hedef: "/en/marka/cnh/" }, // cnh yeni sitede var
  "238": { tip: "410" }, // nural yok ve sayfa boştu
};

// Spam ülke sayfaları için ülke adı listesi. Kök seviyedeki <kelime>-<ülke>
// yolları 410 döner. Liste kapsamlı; gerçek sayfalar dil önekli (/en/ vb.)
// olduğu ve bu desenle çakışmadığı için yanlış 410 riski yok.
const ULKELER = new Set([
  "afghanistan","albania","algeria","angola","argentina","armenia","australia","austria",
  "azerbaijan","bahrain","bangladesh","belarus","belgium","benin","bolivia","bosnia",
  "botswana","brazil","bulgaria","burkina-faso","burundi","cambodia","cameroon","canada",
  "chad","chile","china","colombia","congo","costa-rica","croatia","cuba","cyprus","czechia",
  "denmark","djibouti","dominican-republic","ecuador","egypt","el-salvador","eritrea",
  "estonia","ethiopia","fiji","finland","france","gabon","gambia","georgia","germany","ghana",
  "greece","guatemala","guinea","guyana","haiti","honduras","hungary","iceland","india",
  "indonesia","iran","iraq","ireland","israel","italy","ivory-coast","jamaica","japan",
  "jordan","kazakhstan","kenya","kosovo","kuwait","kyrgyzstan","laos","latvia","lebanon",
  "lesotho","liberia","libya","lithuania","luxembourg","macedonia","north-macedonia",
  "madagascar","malawi","malaysia","maldives","mali","malta","mauritania","mauritius",
  "mexico","moldova","mongolia","montenegro","morocco","mozambique","myanmar","namibia",
  "nepal","netherlands","new-zealand","nicaragua","niger","nigeria","norway","oman",
  "pakistan","palestine","panama","papua-new-guinea","paraguay","peru","philippines",
  "poland","portugal","qatar","romania","russia","rwanda","saudi-arabia","senegal","serbia",
  "sierra-leone","singapore","slovakia","slovenia","somalia","south-africa","south-korea",
  "south-sudan","spain","sri-lanka","sudan","sweden","switzerland","syria","taiwan",
  "tajikistan","tanzania","thailand","togo","tunisia","turkey","turkmenistan","uganda",
  "ukraine","united-arab-emirates","united-kingdom","united-states","uruguay","uzbekistan",
  "venezuela","vietnam","yemen","zambia","zimbabwe","uae","uk","usa",
]);

function ulkeIleBitiyor(segment: string): boolean {
  // "gaskets-albania", "engine-parts-saudi-arabia" → sondaki ülke adını bul.
  for (const ulke of ULKELER) {
    if (segment === ulke) continue; // tek başına ülke adı değil, <kelime>-<ülke> olmalı
    if (segment.endsWith("-" + ulke)) return true;
  }
  return false;
}

export function eskiUrlKarari(pathname: string): Karar {
  const yol = pathname.replace(/\/+$/, "").toLowerCase(); // sondaki slash'ları at

  // /<slug>/p/<id> — başı değişken/çok-segmentli olabilir
  const urunEsl = yol.match(/\/p\/(\d+)$/);
  if (urunEsl) {
    const hedef = URUN_HARITA[urunEsl[1]];
    return hedef ? { tip: "301", hedef } : { tip: "gecir" };
  }

  // /<slug>/k/<id>
  const katEsl = yol.match(/\/k\/(\d+)$/);
  if (katEsl) {
    return KATEGORI_HARITA[katEsl[1]] ?? { tip: "gecir" };
  }

  // Kök seviye tek segment <kelime>-<ülke> → 410 (spam)
  const kokEsl = yol.match(/^\/([a-z0-9-]+)$/);
  if (kokEsl && ulkeIleBitiyor(kokEsl[1])) {
    return { tip: "410" };
  }

  return { tip: "gecir" };
}
