import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

// Astro 7 Content Layer: koleksiyonlar glob() loader ile tanımlanır.
// Şema özü (zod alanları, cevrilebilir(), reference(), aramaAnahtari())
// verildiği gibi korunmuştur; yalnızca koleksiyon sarmalı loader kullanır.
// Sanity'ye taşınırken bu zod şeması referans alınır.

export const DILLER = ["tr", "en", "ar", "ru"] as const;
export type Dil = (typeof DILLER)[number];

export const RTL_DILLER: Dil[] = ["ar"];

const cevrilebilir = <T extends z.ZodType>(sema: T) =>
  z.object({
    tr: sema,
    en: sema.optional(),
    ar: sema.optional(),
    ru: sema.optional(),
  });

const gorsel = z.object({
  dosya: z.string(),
  alt: cevrilebilir(z.string()).optional(),
});

const urunler = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/urunler" }),
  schema: z.object({
    parcaNo: z.string().min(3),
    muadilNo: z.array(z.string()).default([]),
    marka: reference("markalar"),
    kategori: reference("kategoriler"),
    uyumluMotorlar: z.array(z.string()).default([]),
    stokDurumu: z.enum(["stokta", "siparise-bagli", "tukendi"]),
    durum: z.enum(["orijinal", "muadil", "revizyonlu"]),
    fiyat: z.number().positive().optional(),
    paraBirimi: z.enum(["TRY", "USD", "EUR"]).optional(),
    gorseller: z.array(gorsel).default([]),
    oneCikan: z.boolean().default(false),
    yayinda: z.boolean().default(true),
    eklenmeTarihi: z.coerce.date(),
    ad: cevrilebilir(z.string().min(1)),
    aciklama: cevrilebilir(z.string()).optional(),
  }),
});

const markalar = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/markalar" }),
  schema: z.object({
    slug: z.string(),
    ad: z.string(),
    aciklama: cevrilebilir(z.string()).optional(),
    logo: z.string().optional(),
    logoKullanimIzni: z.boolean().default(false),
    sira: z.number().default(99),
  }),
});

const kategoriler = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/kategoriler" }),
  schema: z.object({
    slug: z.string(),
    ad: cevrilebilir(z.string()),
    aciklama: cevrilebilir(z.string()).optional(),
    ikon: z.string().optional(),
    sira: z.number().default(99),
  }),
});

export const collections = { urunler, markalar, kategoriler };

export function aramaAnahtari(deger: string): string {
  return deger.toLowerCase().replace(/[\s.\-_/]/g, "");
}
