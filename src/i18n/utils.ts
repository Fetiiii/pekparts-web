import { ui, diller, varsayilanDil, rtlDiller, type Dil } from "./ui";

/** URL yolundan aktif dili çıkarır. Tanınmayan önek → varsayılan dil. */
export function dilBul(url: URL): Dil {
  const [, ilk] = url.pathname.split("/");
  if ((diller as readonly string[]).includes(ilk)) return ilk as Dil;
  return varsayilanDil;
}

/** Verilen dil için çeviri fonksiyonu. Boş/eksik değerde İngilizce'ye,
 *  o da yoksa Türkçe'ye, en son anahtarın kendisine düşer.
 *  İkinci argümanla `{ad}` gibi yer tutucular doldurulur. */
export function ceviriYap(dil: Dil) {
  return function t(
    anahtar: string,
    degerler?: Record<string, string | number>,
  ): string {
    const ham = ui[dil][anahtar] || ui.en[anahtar] || ui.tr[anahtar] || anahtar;
    if (!degerler) return ham;
    return ham.replace(/\{(\w+)\}/g, (_, ad: string) =>
      ad in degerler ? String(degerler[ad]) : `{${ad}}`,
    );
  };
}

/** Bir yolu belirtilen dilin önekiyle, sonda slash ile üretir.
 *  `urunler` → `/en/urunler/`. (trailingSlash: "always" ile tutarlı.) */
export function dilliYol(dil: Dil, yol = ""): string {
  const temiz = yol.replace(/^\/+/, "").replace(/\/+$/, "");
  return temiz ? `/${dil}/${temiz}/` : `/${dil}/`;
}

/** Aktif URL'nin dil önekini soyup geriye kalan yolu verir (dil değiştirici için). */
export function yolunGerisi(url: URL): string {
  const parcalar = url.pathname.split("/").filter(Boolean);
  if ((diller as readonly string[]).includes(parcalar[0])) parcalar.shift();
  return parcalar.join("/");
}

/** Dilin yazım yönü. */
export function yon(dil: Dil): "rtl" | "ltr" {
  return rtlDiller.includes(dil) ? "rtl" : "ltr";
}

export { diller, varsayilanDil, type Dil };
