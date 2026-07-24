import { defineType, defineField } from "sanity";

// Teklif formu gönderimleri (§9). Form fonksiyonu bu dokümanı yazar; işletme
// sahibi panelde "Talepler"de görür, "cevaplandı" işaretler. Yalnızca e-postaya
// güvenilmez — buraya da kaydedilir.
export const talepTipi = defineType({
  name: "talep",
  title: "Talep",
  type: "document",
  // Talepler yalnızca form tarafından oluşturulur; panelde elle oluşturma anlamsız.
  fields: [
    defineField({ name: "parcaNo", title: "Parça No", type: "string", readOnly: true }),
    defineField({ name: "urunAd", title: "Ürün", type: "string", readOnly: true }),
    defineField({ name: "ad", title: "Gönderen adı", type: "string", readOnly: true }),
    defineField({ name: "iletisim", title: "Telefon / e-posta", type: "string", readOnly: true }),
    defineField({ name: "adet", title: "Adet", type: "number", readOnly: true }),
    defineField({ name: "mesaj", title: "Mesaj", type: "text", rows: 3, readOnly: true }),
    defineField({ name: "dil", title: "Dil", type: "string", readOnly: true }),
    defineField({ name: "tarih", title: "Gönderim tarihi", type: "datetime", readOnly: true }),
    defineField({
      name: "cevaplandi",
      title: "Cevaplandı",
      type: "boolean",
      initialValue: false,
      description: "Talebe dönüş yapıldığında işaretleyin.",
    }),
  ],
  orderings: [
    { name: "yeni", title: "En yeni", by: [{ field: "tarih", direction: "desc" }] },
  ],
  preview: {
    select: { parcaNo: "parcaNo", ad: "ad", cevaplandi: "cevaplandi", tarih: "tarih" },
    prepare({ parcaNo, ad, cevaplandi, tarih }) {
      const t = tarih ? new Date(tarih).toLocaleDateString("tr-TR") : "";
      return {
        title: `${parcaNo ?? "—"} · ${ad ?? ""}`,
        subtitle: `${cevaplandi ? "✓ cevaplandı" : "• bekliyor"} — ${t}`,
      };
    },
  },
});
