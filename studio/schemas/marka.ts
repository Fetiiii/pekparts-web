import { defineType, defineField } from "sanity";

// content.config.ts `markalar` ile birebir.
export const markaTipi = defineType({
  name: "marka",
  title: "Marka",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL'de kullanılır. Örn: deutz. Ürünlerdeki marka referansı buna bağlanır.",
      options: { source: "ad", maxLength: 60 },
      validation: (r) => r.required().error("Slug zorunlu"),
    }),
    defineField({
      name: "ad",
      title: "Ad",
      type: "string",
      validation: (r) => r.required().error("Marka adı zorunlu"),
    }),
    defineField({ name: "aciklama", title: "Açıklama", type: "cevrilebilirMetin" }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      description: "Yalnızca yetkili bayilik varsa kullanın (§13).",
    }),
    defineField({
      name: "logoKullanimIzni",
      title: "Logo kullanım izni var",
      type: "boolean",
      initialValue: false,
    }),
    defineField({ name: "sira", title: "Sıra", type: "number", initialValue: 99 }),
  ],
  orderings: [{ name: "sira", title: "Sıra", by: [{ field: "sira", direction: "asc" }] }],
  preview: { select: { title: "ad", subtitle: "slug.current" } },
});
