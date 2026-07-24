// Teklif/iletişim formu istemci geliştirmesi. Tarayıcı doğrulaması geçince
// submit olayı tetiklenir; JSON olarak fonksiyona gönderir ve sayfada onay
// ekranını gösterir (yeniden yönlendirme yok). JS yoksa form normal POST yapar
// ve fonksiyon HTML onay döndürür — her iki yol da çalışır (§9).
export {};

function kur(form: HTMLFormElement) {
  const kok = form.closest<HTMLElement>("[data-teklif-kok]");
  const btn = form.querySelector<HTMLButtonElement>("[data-gonder]");
  const hata = form.querySelector<HTMLElement>("[data-hata]");
  const basari = kok?.querySelector<HTMLElement>("[data-basari]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (hata) hata.hidden = true;
    const eskiMetin = btn?.dataset.metin ?? "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = btn.dataset.gonderiliyor ?? eskiMetin;
    }
    try {
      const veri = Object.fromEntries(new FormData(form).entries());
      const r = await fetch(form.action, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(veri),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (r.ok && j.ok) {
        form.hidden = true;
        if (basari) {
          basari.hidden = false;
          basari.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      throw new Error("basarisiz");
    } catch {
      if (hata) hata.hidden = false;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = eskiMetin;
      }
    }
  });
}

function baslat() {
  document.querySelectorAll<HTMLFormElement>("[data-teklif]").forEach(kur);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", baslat);
} else {
  baslat();
}
