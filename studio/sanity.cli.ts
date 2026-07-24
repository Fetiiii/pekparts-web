import { defineCliConfig } from "sanity/cli";

// Proje ID ve dataset ortam değişkenlerinden okunur (.env dosyası).
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  },
});
