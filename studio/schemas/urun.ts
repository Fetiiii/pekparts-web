import { defineType, defineField } from "sanity";

// content.config.ts `urunler` ile BİREBİR (§8). Alan adları/enum değerleri
// ayrışırsa Excel aktarımı ve site okuması bozulur.
export const urunTipi = defineType({
  name: "urun",
  title: "Ürün",
  type: "document",
  groups: [
    { name: "genel", title: "Genel", default: true },
    { name: "ceviri", title: "Ad & Açıklama (diller)" },
    { name: "gorsel", title: "Görseller" },
  ],
  fields: [
    defineField({
      name: "parcaNo",
      title: "Parça No",
      type: "string",
      group: "genel",
      description: "Ürünün ana parça numarası. Girdiğiniz biçim korunur (normalize edilmez).",
      validation: (r) => r.required().min(3).error("Parça no zorunlu (en az 3 karakter)"),
    }),
    defineField({
      name: "muadilNo",
      title: "Muadil No",
      type: "array",
      of: [{ type: "string" }],
      group: "genel",
      description: "Çapraz referans numaraları.",
      options: { layout: "tags" },
    }),
    defineField({
      name: "marka",
      title: "Marka",
      type: "reference",
      to: [{ type: "marka" }],
      group: "genel",
      validation: (r) => r.required().error("Marka zorunlu"),
    }),
    defineField({
      name: "kategori",
      title: "Kategori",
      type: "reference",
      to: [{ type: "kategori" }],
      group: "genel",
      validation: (r) => r.required().error("Kategori zorunlu"),
    }),
    defineField({
      name: "uyumluMotorlar",
      title: "Uyumlu Motorlar",
      type: "array",
      of: [{ type: "string" }],
      group: "genel",
      description: 'Örn: "TCD 2012 L04", "BF4M 2012".',
      options: { layout: "tags" },
    }),
    defineField({
      name: "stokDurumu",
      title: "Stok Durumu",
      type: "string",
      group: "genel",
      options: {
        list: [
          { title: "Stokta", value: "stokta" },
          { title: "Siparişe bağlı", value: "siparise-bagli" },
          { title: "Tükendi", value: "tukendi" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required().error("Stok durumu zorunlu"),
    }),
    defineField({
      name: "durum",
      title: "Durum",
      type: "string",
      group: "genel",
      options: {
        list: [
          { title: "Orijinal", value: "orijinal" },
          { title: "Muadil", value: "muadil" },
          { title: "Revizyonlu", value: "revizyonlu" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required().error("Durum zorunlu"),
    }),
    defineField({
      name: "fiyat",
      title: "Fiyat",
      type: "number",
      group: "genel",
      description: "Sitede GÖSTERİLMEZ. Panelde saklanır, ileride bayi girişi için hazır.",
      validation: (r) => r.positive().error("Fiyat pozitif olmalı"),
    }),
    defineField({
      name: "paraBirimi",
      title: "Para Birimi",
      type: "string",
      group: "genel",
      options: {
        list: [
          { title: "TRY", value: "TRY" },
          { title: "USD", value: "USD" },
          { title: "EUR", value: "EUR" },
        ],
      },
    }),
    defineField({
      name: "oneCikan",
      title: "Öne Çıkan",
      type: "boolean",
      group: "genel",
      initialValue: false,
      description: "Ana sayfada gösterilsin mi?",
    }),
    defineField({
      name: "yayinda",
      title: "Yayında",
      type: "boolean",
      group: "genel",
      initialValue: true,
      description: "Kapalıysa ürün sitede görünmez.",
    }),
    defineField({
      name: "eklenmeTarihi",
      title: "Eklenme Tarihi",
      type: "date",
      group: "genel",
      options: { dateFormat: "DD.MM.YYYY" },
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (r) => r.required(),
    }),

    // —— Diller ——
    defineField({
      name: "ad",
      title: "Ad",
      type: "cevrilebilirAd",
      group: "ceviri",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "aciklama",
      title: "Açıklama",
      type: "cevrilebilirMetin",
      group: "ceviri",
    }),

    // —— Görseller ——
    defineField({
      name: "gorseller",
      title: "Görseller",
      type: "array",
      group: "gorsel",
      description: "İlk görsel kapak olur. Sürükleyerek sıralayabilirsiniz.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", title: "Alternatif metin", type: "cevrilebilirAd" },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { parcaNo: "parcaNo", adTr: "ad.tr", media: "gorseller.0", stok: "stokDurumu" },
    prepare({ parcaNo, adTr, media, stok }) {
      const etiket: Record<string, string> = {
        stokta: "Stokta", "siparise-bagli": "Siparişe bağlı", tukendi: "Tükendi",
      };
      return { title: `${parcaNo} — ${adTr ?? ""}`, subtitle: etiket[stok] ?? stok, media };
    },
  },
});
