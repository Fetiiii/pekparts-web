import { defineType, defineField } from "sanity";

// Tekil doküman: site genelindeki iletişim bilgileri tek yerden yönetilir (§8).
// Telefon numarası şu an her sayfada geçiyor; koda gömülü kalırsa değişiklikte
// geliştirici gerekir. Site bunları build'de buradan okur.
export const siteAyarlariTipi = defineType({
  name: "siteAyarlari",
  title: "Site Ayarları",
  type: "document",
  // Tekil: __experimental_actions ile silme/oluşturma gizlenir (yapıda da tek).
  fields: [
    defineField({
      name: "telefon",
      title: "Telefon",
      type: "string",
      description: "Görünen biçim. Örn: +90 342 000 00 00",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "whatsapp",
      title: "WhatsApp numarası",
      type: "string",
      description: "Yalnızca rakam, ülke koduyla, + ve boşluksuz. Örn: 905320000000",
      validation: (r) =>
        r.required().regex(/^\d{8,15}$/, { name: "rakam" }).error("Sadece rakam, 8-15 hane"),
    }),
    defineField({
      name: "eposta",
      title: "E-posta (genel)",
      type: "string",
      validation: (r) => r.required().email().error("Geçerli e-posta girin"),
    }),
    defineField({
      name: "talepEpostasi",
      title: "Talep bildirimlerinin gideceği e-posta",
      type: "string",
      description: "Teklif formu gönderimleri bu adrese düşer. Boşsa genel e-posta kullanılır.",
      validation: (r) => r.email().error("Geçerli e-posta girin"),
    }),
    defineField({ name: "adres", title: "Adres", type: "text", rows: 3 }),
    defineField({
      name: "calismaSaatleri",
      title: "Çalışma Saatleri",
      type: "string",
      description: "Örn: Hafta içi 08:30–18:00, Cumartesi 09:00–14:00",
    }),
    defineField({
      name: "haritaGomu",
      title: "Harita gömme bağlantısı",
      type: "url",
      description: "Google Haritalar 'Yeri paylaş → Harita yerleştir' iframe src bağlantısı.",
    }),
    defineField({
      name: "sosyal",
      title: "Sosyal medya bağlantıları",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "etiket", title: "Etiket", type: "string" },
            { name: "url", title: "Bağlantı", type: "url" },
          ],
          preview: { select: { title: "etiket", subtitle: "url" } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site Ayarları" }) },
});
