import { defineType, defineField } from "sanity";

// Çevrilebilir metin — content.config.ts'teki cevrilebilir() ile aynı şekil:
// { tr (zorunlu), en?, ar?, ru? }. Panelde katlanabilir tek blok; ürünü dört
// kez girme derdi yok. `zorunlu` parametresi tr alanını zorunlu yapar.
export const cevrilebilirTipi = (ad: string, tr_zorunlu = false) =>
  defineType({
    name: ad,
    title: "Çeviriler",
    type: "object",
    options: { collapsible: true, collapsed: false, columns: 2 },
    fields: [
      defineField({
        name: "tr",
        title: "Türkçe",
        type: "string",
        validation: tr_zorunlu ? (r) => r.required().error("Türkçe değer zorunlu") : undefined,
      }),
      defineField({ name: "en", title: "İngilizce", type: "string" }),
      defineField({ name: "ar", title: "Arapça", type: "string" }),
      defineField({ name: "ru", title: "Rusça", type: "string" }),
    ],
  });

// Çok satırlı (açıklama) çeşidi
export const cevrilebilirMetinTipi = (ad: string) =>
  defineType({
    name: ad,
    title: "Çeviriler",
    type: "object",
    options: { collapsible: true, collapsed: true, columns: 1 },
    fields: [
      defineField({ name: "tr", title: "Türkçe", type: "text", rows: 3 }),
      defineField({ name: "en", title: "İngilizce", type: "text", rows: 3 }),
      defineField({ name: "ar", title: "Arapça", type: "text", rows: 3 }),
      defineField({ name: "ru", title: "Rusça", type: "text", rows: 3 }),
    ],
  });
