import { defineType, defineField } from "sanity";

// Kurumsal/yasal sayfa metinleri (§5). Firma bunları geliştirici olmadan
// doldurur: hakkimizda, kvkk, cerez-politikasi. Site slug'a göre okur; boşsa
// açıkça işaretli yer tutucu gösterir (yer tutucu canlıya sızamaz — kontrol var).
export const sayfaTipi = defineType({
  name: "sayfa",
  title: "Sayfa Metni",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      title: "Sayfa",
      type: "string",
      description: "Hangi sayfa? Sabit değerlerden biri.",
      options: {
        list: [
          { title: "Hakkımızda", value: "hakkimizda" },
          { title: "KVKK Aydınlatma Metni", value: "kvkk" },
          { title: "Çerez Politikası", value: "cerez-politikasi" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "baslik", title: "Başlık", type: "cevrilebilirAd" }),
    defineField({
      name: "icerik",
      title: "İçerik",
      type: "cevrilebilirMetin",
      description: "Paragraflar boş satırla ayrılır.",
    }),
  ],
  preview: {
    select: { slug: "slug", baslik: "baslik.tr" },
    prepare: ({ slug, baslik }) => ({ title: baslik || slug, subtitle: slug }),
  },
});
