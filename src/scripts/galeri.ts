// Ürün detay galerisi: küçük görsele tıklayınca (veya klavyeyle Enter) ana
// görsel onunla değişir. Aktif küçük görsel vurgulanır (aria-current).
export {};

function kur(galeri: HTMLElement) {
  const ana = galeri.querySelector<HTMLImageElement>("[data-galeri-ana]");
  const kucukler = Array.from(
    galeri.querySelectorAll<HTMLButtonElement>("[data-galeri-kucuk]"),
  );
  if (!ana || kucukler.length === 0) return;

  for (const btn of kucukler) {
    btn.addEventListener("click", () => {
      ana.src = btn.dataset.yol ?? ana.src;
      ana.alt = btn.dataset.alt ?? ana.alt;
      for (const b of kucukler) {
        b.setAttribute("aria-current", b === btn ? "true" : "false");
      }
    });
  }
}

function baslat() {
  document.querySelectorAll<HTMLElement>("[data-galeri]").forEach(kur);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", baslat);
} else {
  baslat();
}
