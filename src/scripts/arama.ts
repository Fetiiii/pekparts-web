// İstemci tarafı arama (§6). Numara benzeri sorguda tam + alt dizi (bulanık YOK),
// metin sorgusunda ad üzerinde alt dizi eşleşmesi. Sonuçlar ürün bazında tekil.
export {}; // modül kapsamı (global çakışmayı önler)

interface Kayit {
  slug: string;
  parcaNo: string;
  ad: Record<string, string | undefined>;
  marka: string;
  motorOzet: string[];
  motorFazla: number;
  stok: string;
  gorsel: string | null;
  anahtarlar: string[];
  metin: string[];
}

interface Config {
  lang: string;
  indexUrl: string;
  whatsapp: string;
  waMesaj: string; // "... {sorgu}"
  urunYol: string; // "/tr/urun/"
  araYol: string; // "/tr/ara"
  ceviri: {
    fiyatSor: string;
    digerMotor: string; // "+{sayi} motor daha"
    sonucSayisi: string; // "{sayi} sonuç bulundu"
    aranan: string; // "Aranan: {sorgu}"
    bosBaslik: string;
    bosMetin: string;
    whatsappBos: string;
    yukleniyor: string;
    stok: Record<string, string>;
  };
}

// aramaAnahtari() ile AYNI normalizasyon (config.ts).
const norm = (s: string) => s.toLowerCase().replace(/[\s.\-_/]/g, "");

function kacis(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function sablonla(sablon: string, degerler: Record<string, string | number>): string {
  return sablon.replace(/\{(\w+)\}/g, (_, a) => String(degerler[a] ?? `{${a}}`));
}

function ara(kayitlar: Kayit[], sorgu: string): Kayit[] {
  const n = norm(sorgu);
  if (n.length < 2) return [];

  const rakam = (n.match(/\d/g)?.length ?? 0) / n.length;
  const numaraModu = rakam >= 0.5;
  if (numaraModu && n.length < 3) return [];

  const puanli: { k: Kayit; puan: number }[] = [];
  for (const k of kayitlar) {
    let puan = -1;
    // Numara alanları: tam > önek > alt dizi. Bulanık YOK.
    for (const a of k.anahtarlar) {
      if (a === n) puan = Math.max(puan, 100);
      else if (a.startsWith(n)) puan = Math.max(puan, 70);
      else if (a.includes(n)) puan = Math.max(puan, 50);
    }
    // Metin modunda ada göre de eşleştir.
    if (!numaraModu) {
      for (const m of k.metin) {
        if (m.includes(n)) puan = Math.max(puan, m.startsWith(n) ? 60 : 40);
      }
    }
    if (puan >= 0) puanli.push({ k, puan });
  }
  puanli.sort((a, b) => b.puan - a.puan);
  return puanli.map((p) => p.k);
}

function kartHtml(k: Kayit, c: Config): string {
  const ad = kacis(k.ad[c.lang] || k.ad.en || k.ad.tr || "");
  const stokEtiket = kacis(c.ceviri.stok[k.stok] ?? k.stok);
  const stokSinif =
    k.stok === "stokta"
      ? "bg-vurgu text-kagit"
      : k.stok === "siparise-bagli"
        ? "border border-bakir text-bakir-koyu"
        : "border border-kenarlik text-murekkep/55";
  const motor =
    k.motorOzet.length > 0
      ? `<p class="parca-no text-xs text-murekkep/60">${kacis(k.motorOzet.join(" · "))}${
          k.motorFazla > 0 ? " " + kacis(sablonla(c.ceviri.digerMotor, { sayi: k.motorFazla })) : ""
        }</p>`
      : "";
  // Sonda slash zorunlu (trailingSlash: "always"); yoksa 404.
  const url = kacis(c.urunYol.replace(/\/$/, "") + "/" + k.slug + "/");
  // Kapak: görsel varsa <img>, yoksa yer tutucu (liste kartıyla aynı davranış).
  const gorselIc = k.gorsel
    ? `<img src="${kacis(k.gorsel)}" alt="${ad}" loading="lazy" decoding="async" class="h-full w-full object-cover">`
    : `<span class="flex h-full w-full items-center justify-center text-murekkep/40"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg></span>`;
  return `<article class="urun-kart flex h-full flex-col overflow-hidden rounded border border-kenarlik bg-kagit">
    <a href="${url}" class="block aspect-4/3 overflow-hidden border-b border-kenarlik bg-yuzey no-underline" tabindex="-1" aria-hidden="true">
      ${gorselIc}
    </a>
    <div class="flex flex-1 flex-col gap-2 p-3">
      <p class="parca-no text-sm font-semibold text-bakir-koyu">${kacis(k.parcaNo)}</p>
      <h3 class="text-sm leading-snug font-medium"><a href="${url}" class="text-murekkep no-underline hover:text-vurgu">${ad}</a></h3>
      ${motor}
      <div class="mt-auto flex items-center justify-between gap-2 pt-1">
        <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${stokSinif}">${stokEtiket}</span>
        <span class="text-xs font-medium text-vurgu">${kacis(c.ceviri.fiyatSor)}</span>
      </div>
    </div>
  </article>`;
}

function bosHtml(sorgu: string, c: Config): string {
  const wa = `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(
    sablonla(c.waMesaj, { sorgu }),
  )}`;
  return `<div class="rounded border border-kenarlik bg-yuzey p-6 sm:p-8 text-center">
    <h2 class="text-lg font-semibold">${kacis(c.ceviri.bosBaslik)}</h2>
    <p class="mx-auto mt-2 max-w-md text-murekkep/70">${kacis(c.ceviri.bosMetin)}</p>
    <a href="${kacis(wa)}" rel="noopener" class="mt-4 inline-block rounded bg-vurgu px-5 py-3 font-medium text-kagit no-underline hover:bg-vurgu/90">${kacis(c.ceviri.whatsappBos)}</a>
  </div>`;
}

async function baslat() {
  const kok = document.querySelector<HTMLElement>("[data-ara]");
  if (!kok) return;
  const config: Config = JSON.parse(
    document.getElementById("ara-config")?.textContent ?? "{}",
  );
  const sonucEl = kok.querySelector<HTMLElement>("[data-ara-sonuc]");
  const durumEl = kok.querySelector<HTMLElement>("[data-ara-durum]");
  const form = kok.querySelector<HTMLFormElement>("form[role='search']");
  const giris = form?.querySelector<HTMLInputElement>("input[name='s']");
  if (!sonucEl || !durumEl) return;
  const sonuc: HTMLElement = sonucEl;
  const durum: HTMLElement = durumEl;

  let kayitlar: Kayit[] | null = null;
  async function indeks(): Promise<Kayit[]> {
    if (!kayitlar) {
      const r = await fetch(config.indexUrl);
      kayitlar = (await r.json()) as Kayit[];
    }
    return kayitlar;
  }

  function sorguOku(): string {
    return new URL(location.href).searchParams.get("s")?.trim() ?? "";
  }

  async function calistir(sorgu: string) {
    if (giris && giris.value !== sorgu) giris.value = sorgu;
    if (!sorgu) {
      sonuc.innerHTML = "";
      durum.textContent = "";
      return;
    }
    durum.textContent = config.ceviri.yukleniyor;
    const bulunan = ara(await indeks(), sorgu);
    durum.textContent = sablonla(config.ceviri.sonucSayisi, { sayi: bulunan.length });
    if (bulunan.length === 0) {
      sonuc.innerHTML = bosHtml(sorgu, config);
    } else {
      sonuc.innerHTML = `<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">${bulunan
        .map((k) => kartHtml(k, config))
        .join("")}</div>`;
    }
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const sorgu = giris?.value.trim() ?? "";
    const url = new URL(location.href);
    if (sorgu) url.searchParams.set("s", sorgu);
    else url.searchParams.delete("s");
    history.pushState(null, "", url);
    calistir(sorgu);
  });

  window.addEventListener("popstate", () => calistir(sorguOku()));

  calistir(sorguOku());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", baslat);
} else {
  baslat();
}
