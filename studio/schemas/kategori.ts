import { defineType, defineField } from "sanity";

// content.config.ts `kategoriler` ile birebir.
export const kategoriTipi = defineType({
  name: "kategori",
  title: "Kategori",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL'de kullanılır. Örn: yakit-sistemi.",
      options: { source: "ad.tr", maxLength: 60 },
      validation: (r) => r.required().error("Slug zorunlu"),
    }),
    defineField({
      name: "ad",
      title: "Ad",
      type: "cevrilebilirAd",
      validation: (r) => r.required(),
    }),
    defineField({ name: "aciklama", title: "Açıklama", type: "cevrilebilirMetin" }),
    defineField({
      name: "ikon",
      title: "İkon",
      type: "string",
      description: "İkon anahtarı (opsiyonel). Örn: filter, engine.",
    }),
    defineField({ name: "sira", title: "Sıra", type: "number", initialValue: 99 }),
  ],
  orderings: [{ name: "sira", title: "Sıra", by: [{ field: "sira", direction: "asc" }] }],
  preview: {
    select: { title: "ad.tr", subtitle: "slug.current" },
  },
});
