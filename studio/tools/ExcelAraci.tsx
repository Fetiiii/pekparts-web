import { useCallback, useState } from "react";
import { useClient } from "sanity";
import { Card, Stack, Button, Text, Heading, Box, Flex, Badge, Spinner } from "@sanity/ui";
import {
  sablonUret,
  ayristir,
  dogrula,
  disaAktar,
  anahtarla,
  type Rapor,
  type UrunVeri,
} from "../lib/urun-excel";

// Excel toplu aktarım aracı (§8). Şablon indir · dışa aktar · yükle→önizle→aktar.
// Doğrulama motoru saf modülde (urun-excel.ts) ve testli; burası yalnızca
// Sanity ile konuşur.

function indir(buf: ArrayBuffer, adi: string) {
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = adi;
  a.click();
  URL.revokeObjectURL(url);
}

const slugId = (parcaNo: string) => `urun-${anahtarla(parcaNo)}`;

export function ExcelAraci() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [rapor, setRapor] = useState<Rapor | null>(null);
  const [mesaj, setMesaj] = useState<string>("");
  const [mesgul, setMesgul] = useState(false);
  // slug→_id haritaları (aktarım sırasında referans çözümü için)
  const [haritalar, setHaritalar] = useState<{
    marka: Map<string, string>;
    kategori: Map<string, string>;
    mevcut: Map<string, string>; // normalize parcaNo → _id
  } | null>(null);

  const baglamGetir = useCallback(async () => {
    const [markalar, kategoriler, urunler] = await Promise.all([
      client.fetch<{ _id: string; slug: string; ad: string }[]>(
        `*[_type=="marka"]{_id,"slug":slug.current,ad}`,
      ),
      client.fetch<{ _id: string; slug: string; adlar: string[] }[]>(
        `*[_type=="kategori"]{_id,"slug":slug.current,"adlar":[ad.tr,ad.en,ad.ar,ad.ru][defined(@)]}`,
      ),
      client.fetch<{ _id: string; parcaNo: string }[]>(
        `*[_type=="urun"]{_id,parcaNo}`,
      ),
    ]);
    const markaId = new Map(markalar.map((m) => [m.slug, m._id]));
    const kategoriId = new Map(kategoriler.map((k) => [k.slug, k._id]));
    const mevcut = new Map(urunler.map((u) => [anahtarla(u.parcaNo), u._id]));
    setHaritalar({ marka: markaId, kategori: kategoriId, mevcut });
    return {
      markalar: markalar.map((m) => ({ slug: m.slug, ad: m.ad })),
      kategoriler: kategoriler.map((k) => ({ slug: k.slug, adlar: k.adlar })),
      mevcutParcaNolar: urunler.map((u) => u.parcaNo),
    };
  }, [client]);

  const dosyaSec = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const dosya = e.target.files?.[0];
      if (!dosya) return;
      setMesgul(true);
      setMesaj("Dosya okunuyor ve doğrulanıyor…");
      setRapor(null);
      try {
        const buf = await dosya.arrayBuffer();
        const ham = await ayristir(buf);
        const baglam = await baglamGetir();
        const r = dogrula(ham, baglam);
        setRapor(r);
        setMesaj("");
      } catch (err) {
        setMesaj(`Dosya okunamadı: ${(err as Error).message}`);
      } finally {
        setMesgul(false);
        e.target.value = ""; // aynı dosya tekrar seçilebilsin
      }
    },
    [baglamGetir],
  );

  const aktar = useCallback(async () => {
    if (!rapor || !haritalar) return;
    setMesgul(true);
    setMesaj("Aktarılıyor…");
    try {
      let yeni = 0;
      let guncel = 0;
      // Küçük gruplar halinde transaction (büyük dosyalarda API sınırları için)
      const grupla = <T,>(a: T[], n: number) =>
        Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

      for (const grup of grupla(rapor.gecerliUrunler, 50)) {
        const tx = client.transaction();
        for (const u of grup) {
          const mevcutId = haritalar.mevcut.get(anahtarla(u.parcaNo));
          const alanlar = urunAlanlari(u, haritalar);
          if (mevcutId) {
            // GÜNCELLEME: yalnızca Excel alanlarını yaz; görseller korunur.
            tx.patch(mevcutId, (p) => p.set(alanlar));
            guncel++;
          } else {
            // YENİ: deterministik _id (aynı parça iki kez oluşmasın)
            tx.createOrReplace({ _id: slugId(u.parcaNo), _type: "urun", ...alanlar });
            yeni++;
          }
        }
        await tx.commit();
      }
      setMesaj(`Aktarım tamam: ${yeni} yeni, ${guncel} güncelleme. Değişiklikler birkaç dakika içinde sitede görünecek.`);
      setRapor(null);
    } catch (err) {
      setMesaj(`Aktarım hatası: ${(err as Error).message}`);
    } finally {
      setMesgul(false);
    }
  }, [rapor, haritalar, client]);

  const disaAktarTikla = useCallback(async () => {
    setMesgul(true);
    setMesaj("Katalog dışa aktarılıyor…");
    try {
      const urunler = await client.fetch<UrunVeri[]>(`*[_type=="urun"]{
        parcaNo, muadilNo, "marka": marka->slug.current, "kategori": kategori->slug.current,
        uyumluMotorlar, stokDurumu, durum, fiyat, paraBirimi, oneCikan, yayinda,
        "eklenmeTarihi": eklenmeTarihi, ad, aciklama
      }`);
      const buf = await disaAktar(urunler.map(temizle));
      indir(buf, `pekparts-katalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setMesaj(`${urunler.length} ürün dışa aktarıldı.`);
    } catch (err) {
      setMesaj(`Dışa aktarım hatası: ${(err as Error).message}`);
    } finally {
      setMesgul(false);
    }
  }, [client]);

  return (
    <Box padding={4} style={{ maxWidth: 900, margin: "0 auto" }}>
      <Stack space={4}>
        <Heading size={2}>Excel Toplu Aktarım</Heading>
        <Text muted size={1}>
          Yüzlerce ürünü tek tek girmek yerine Excel ile toplu ekleyin veya güncelleyin.
          Parça numarası eşleşen ürünler güncellenir (görselleri korunur), yenileri eklenir.
        </Text>

        <Flex gap={2} wrap="wrap">
          <Button
            text="Boş şablon indir"
            tone="primary"
            mode="ghost"
            disabled={mesgul}
            onClick={async () => indir(await sablonUret(), "pekparts-sablon.xlsx")}
          />
          <Button
            text="Mevcut katalogu dışa aktar"
            mode="ghost"
            disabled={mesgul}
            onClick={disaAktarTikla}
          />
          <Box>
            <label>
              <Button as="span" text="Dosya yükle…" tone="primary" disabled={mesgul} />
              <input
                type="file"
                accept=".xlsx"
                style={{ display: "none" }}
                onChange={dosyaSec}
                disabled={mesgul}
              />
            </label>
          </Box>
        </Flex>

        {mesgul && (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1}>{mesaj}</Text>
          </Flex>
        )}
        {!mesgul && mesaj && (
          <Card tone="positive" padding={3} radius={2}>
            <Text size={1}>{mesaj}</Text>
          </Card>
        )}

        {rapor && <Onizleme rapor={rapor} onAktar={aktar} mesgul={mesgul} />}
      </Stack>
    </Box>
  );
}

function Onizleme({ rapor, onAktar, mesgul }: { rapor: Rapor; onAktar: () => void; mesgul: boolean }) {
  const hataliSatirlar = rapor.satirlar.filter((s) => s.islem === "hata");
  return (
    <Stack space={3}>
      <Flex gap={2} wrap="wrap">
        <Badge tone="primary">Toplam: {rapor.toplam}</Badge>
        <Badge tone="positive">Yeni: {rapor.yeni}</Badge>
        <Badge tone="caution">Güncelleme: {rapor.guncelleme}</Badge>
        <Badge tone={rapor.hatali ? "critical" : "default"}>Hatalı: {rapor.hatali}</Badge>
      </Flex>

      {hataliSatirlar.length > 0 && (
        <Card tone="critical" padding={3} radius={2}>
          <Stack space={2}>
            <Text weight="semibold" size={1}>
              Hatalı satırlar atlanacak ({hataliSatirlar.length}). Düzeltip tekrar yükleyebilirsiniz:
            </Text>
            <Box style={{ maxHeight: 260, overflowY: "auto" }}>
              <Stack space={2}>
                {hataliSatirlar.map((s) => (
                  <Text key={s.satir} size={1}>
                    <strong>{s.satir}. satır</strong>
                    {s.parcaNo ? ` (${s.parcaNo})` : ""}: {s.hatalar.join("; ")}
                  </Text>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Card>
      )}

      {rapor.gecerliUrunler.length > 0 ? (
        <Button
          text={`${rapor.gecerliUrunler.length} geçerli ürünü aktar (${rapor.yeni} yeni, ${rapor.guncelleme} güncelleme)`}
          tone="positive"
          disabled={mesgul}
          onClick={onAktar}
        />
      ) : (
        <Text size={1} muted>
          Aktarılacak geçerli satır yok.
        </Text>
      )}
    </Stack>
  );
}

// UrunVeri → Sanity alan seti (referanslar çözülür, çeviri objeleri _type alır).
function urunAlanlari(
  u: UrunVeri,
  haritalar: { marka: Map<string, string>; kategori: Map<string, string> },
) {
  return {
    parcaNo: u.parcaNo,
    muadilNo: u.muadilNo,
    marka: { _type: "reference", _ref: haritalar.marka.get(u.marka)! },
    kategori: { _type: "reference", _ref: haritalar.kategori.get(u.kategori)! },
    uyumluMotorlar: u.uyumluMotorlar,
    stokDurumu: u.stokDurumu,
    durum: u.durum,
    ...(u.fiyat !== undefined ? { fiyat: u.fiyat } : {}),
    ...(u.paraBirimi ? { paraBirimi: u.paraBirimi } : {}),
    oneCikan: u.oneCikan,
    yayinda: u.yayinda,
    eklenmeTarihi: u.eklenmeTarihi,
    ad: { _type: "cevrilebilirAd", ...u.ad },
    ...(u.aciklama ? { aciklama: { _type: "cevrilebilirMetin", ...u.aciklama } } : {}),
  };
}

// GROQ'tan gelen ham objeyi disaAktar'ın beklediği UrunVeri'ye sadeleştirir.
function temizle(u: any): UrunVeri {
  return {
    parcaNo: u.parcaNo ?? "",
    muadilNo: u.muadilNo ?? [],
    marka: u.marka ?? "",
    kategori: u.kategori ?? "",
    uyumluMotorlar: u.uyumluMotorlar ?? [],
    stokDurumu: u.stokDurumu,
    durum: u.durum,
    fiyat: u.fiyat ?? undefined,
    paraBirimi: u.paraBirimi ?? undefined,
    oneCikan: !!u.oneCikan,
    yayinda: u.yayinda !== false,
    eklenmeTarihi: (u.eklenmeTarihi ?? "").slice(0, 10),
    ad: u.ad ?? { tr: "" },
    aciklama: u.aciklama ?? undefined,
  };
}
