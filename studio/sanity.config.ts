import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";
import { ExcelAraci } from "./tools/ExcelAraci";
import { GorselAraci } from "./tools/GorselAraci";

// Proje ID ve dataset ortamdan gelir (kod tabanına gömülmez).
const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";

export default defineConfig({
  name: "pekparts",
  title: "Pekparts Yönetim Paneli",
  projectId,
  dataset,

  plugins: [
    structureTool({
      title: "İçerik",
      structure: (S) =>
        S.list()
          .title("İçerik")
          .items([
            // Tekil: Site Ayarları
            S.listItem()
              .title("Site Ayarları")
              .id("siteAyarlari")
              .child(
                S.document().schemaType("siteAyarlari").documentId("siteAyarlari"),
              ),
            S.divider(),
            S.documentTypeListItem("urun").title("Ürünler"),
            S.documentTypeListItem("marka").title("Markalar"),
            S.documentTypeListItem("kategori").title("Kategoriler"),
            S.divider(),
            S.documentTypeListItem("sayfa").title("Sayfa Metinleri"),
            S.divider(),
            // Talepler — en yeni üstte
            S.listItem()
              .title("Talepler")
              .id("talepler")
              .child(
                S.documentTypeList("talep")
                  .title("Talepler")
                  .defaultOrdering([{ field: "tarih", direction: "desc" }]),
              ),
          ]),
    }),
    visionTool({ title: "Sorgu (GROQ)" }),
  ],

  // Özel araçlar: Excel toplu aktarım + toplu görsel eşleştirme
  tools: (prev) => [
    ...prev,
    { name: "excel", title: "Excel Aktarım", component: ExcelAraci },
    { name: "gorseller", title: "Toplu Görsel", component: GorselAraci },
  ],

  schema: { types: schemaTypes },

  document: {
    // Site Ayarları tekil: yeni oluşturma/silme menülerinden gizle
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter(
          (t) => t.templateId !== "siteAyarlari" && t.templateId !== "talep",
        );
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      if (schemaType === "siteAyarlari") {
        // tekil: sil/çoğalt yok
        return prev.filter(
          (a) => !["delete", "duplicate", "unpublish"].includes(a.action ?? ""),
        );
      }
      if (schemaType === "talep") {
        // talep elle oluşturulmaz; yalnızca yayın/silme/cevaplandı
        return prev.filter((a) => a.action !== "duplicate");
      }
      return prev;
    },
  },
});
