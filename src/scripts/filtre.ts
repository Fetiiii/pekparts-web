// İstemci tarafı ürün filtreleme. Kartlar sunucuda üretilir (JS'siz de okunur);
// bu betik yalnızca gizle/göster yapar ve seçili durumu URL'de tutar
// (paylaşılabilir link + geri tuşu). Şartname §4.
export {}; // modül kapsamı (global çakışmayı önler)

const GRUPLAR = ["kategori", "marka", "motor", "stok"] as const;
type Grup = (typeof GRUPLAR)[number];

function kur(liste: HTMLElement) {
  const form = liste.querySelector<HTMLFormElement>("[data-filtre]");
  const kartlar = Array.from(liste.querySelectorAll<HTMLElement>(".urun-kart"));
  const sayac = liste.querySelector<HTMLElement>("[data-sayac]");
  const bos = liste.querySelector<HTMLElement>("[data-bos]");
  const sablon = sayac?.dataset.sablon ?? "{sayi}";
  if (!form) return;

  const kutular = () =>
    Array.from(form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));

  function seciliOku(): Record<Grup, string[]> {
    const sonuc = { kategori: [], marka: [], motor: [], stok: [] } as Record<Grup, string[]>;
    for (const k of kutular()) {
      if (k.checked && k.dataset.grup) sonuc[k.dataset.grup as Grup].push(k.value);
    }
    return sonuc;
  }

  function uygula(urlYaz: "push" | "yok") {
    const secili = seciliOku();
    let gorunur = 0;
    for (const kart of kartlar) {
      const eslesir = GRUPLAR.every((g) => {
        const sec = secili[g];
        if (sec.length === 0) return true;
        if (g === "motor") {
          const motorlar = (kart.dataset.motor ?? "").split(",").filter(Boolean);
          return sec.some((s) => motorlar.includes(s));
        }
        return sec.includes(kart.dataset[g] ?? "");
      });
      kart.hidden = !eslesir;
      if (eslesir) gorunur++;
    }
    if (sayac) sayac.textContent = sablon.replace("{sayi}", String(gorunur));
    if (bos) bos.hidden = gorunur !== 0;
    if (urlYaz === "push") yaz(secili);
  }

  function yaz(secili: Record<Grup, string[]>) {
    const url = new URL(location.href);
    for (const g of GRUPLAR) {
      if (secili[g].length) url.searchParams.set(g, secili[g].join(","));
      else url.searchParams.delete(g);
    }
    history.pushState(null, "", url);
  }

  function urldenKutulari() {
    const url = new URL(location.href);
    const istenen: Record<string, Set<string>> = {};
    for (const g of GRUPLAR) {
      const ham = url.searchParams.get(g);
      istenen[g] = new Set(ham ? ham.split(",") : []);
    }
    for (const k of kutular()) {
      const g = k.dataset.grup ?? "";
      k.checked = istenen[g]?.has(k.value) ?? false;
    }
  }

  form.addEventListener("change", () => uygula("push"));

  liste.querySelector("[data-temizle]")?.addEventListener("click", (e) => {
    e.preventDefault();
    for (const k of kutular()) k.checked = false;
    uygula("push");
  });

  window.addEventListener("popstate", () => {
    urldenKutulari();
    uygula("yok");
  });

  // İlk yükleme: URL'deki durumu uygula ama yeni geçmiş kaydı ekleme.
  urldenKutulari();
  uygula("yok");
}

function baslat() {
  document
    .querySelectorAll<HTMLElement>("[data-urun-liste]")
    .forEach((liste) => kur(liste));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", baslat);
} else {
  baslat();
}
