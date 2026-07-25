// Dil değiştirirken URL'deki sorgu parametrelerini koru (arama ?s=, filtreler
// ?marka= vb.). Statik sayfada sorgu yalnızca istemcide olduğu için, dil
// linklerinin href'lerini güncel location.search ile tazeleriz.
export {};

function guncelleHedefler() {
  const sorgu = location.search;
  document
    .querySelectorAll<HTMLAnchorElement>(".lang-switcher a[hreflang]")
    .forEach((a) => {
      // Orijinal yolu (sorgusuz) sakla ki tekrar tekrar eklenmesin.
      let temel = a.dataset.temelYol;
      if (!temel) {
        temel = new URL(a.href, location.origin).pathname;
        a.dataset.temelYol = temel;
      }
      a.setAttribute("href", temel + sorgu);
    });
}

function kur() {
  guncelleHedefler(); // ilk yükleme (URL'de sorgu varsa)
  // Dropdown her açıldığında o anki sorguyla tazele (filtre/arama sonrası).
  document.querySelectorAll<HTMLDetailsElement>(".lang-switcher").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) guncelleHedefler();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", kur);
} else {
  kur();
}
