import { useCallback, useState } from "react";
import { useClient } from "sanity";
import { Card, Stack, Button, Text, Heading, Box, Flex, Badge, Spinner } from "@sanity/ui";
import { anahtarla } from "../lib/urun-excel";

// Toplu görsel eşleştirme (§8). Dosya adı parça numarasıyla eşleşirse
// (04910987-1.jpg → 04910987, sıra 1) otomatik doğru ürüne bağlanır.
// Yeniden boyutlandırma/WebP Sanity görsel CDN'i tarafından teslimde yapılır;
// burada orijinaller yüklenir.

interface EslesmeSatiri {
  dosya: File;
  parcaNo: string; // dosya adından çıkarılan
  sira: number;
  urunId?: string;
  urunParcaNo?: string;
}

// "04910987-1.jpg" → { parca: "04910987", sira: 1 }
function adiCoz(adi: string): { parca: string; sira: number } {
  const taban = adi.replace(/\.[^.]+$/, ""); // uzantıyı at
  const m = taban.match(/^(.*?)[-_](\d+)$/);
  if (m) return { parca: m[1], sira: Number(m[2]) };
  return { parca: taban, sira: 0 };
}

export function GorselAraci() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [satirlar, setSatirlar] = useState<EslesmeSatiri[]>([]);
  const [mesgul, setMesgul] = useState(false);
  const [mesaj, setMesaj] = useState("");

  const dosyaSec = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setMesgul(true);
      setMesaj("Dosyalar eşleştiriliyor…");
      try {
        const urunler = await client.fetch<{ _id: string; parcaNo: string }[]>(
          `*[_type=="urun"]{_id,parcaNo}`,
        );
        const harita = new Map(urunler.map((u) => [anahtarla(u.parcaNo), u]));
        const sonuc: EslesmeSatiri[] = Array.from(files).map((dosya) => {
          const { parca, sira } = adiCoz(dosya.name);
          const urun = harita.get(anahtarla(parca));
          return {
            dosya,
            parcaNo: parca,
            sira,
            urunId: urun?._id,
            urunParcaNo: urun?.parcaNo,
          };
        });
        // parça + sıraya göre sırala (kapak = en küçük sıra)
        sonuc.sort((a, b) => a.parcaNo.localeCompare(b.parcaNo) || a.sira - b.sira);
        setSatirlar(sonuc);
        setMesaj("");
      } finally {
        setMesgul(false);
      }
    },
    [client],
  );

  const yukle = useCallback(async () => {
    const eslesenler = satirlar.filter((s) => s.urunId);
    if (!eslesenler.length) return;
    setMesgul(true);
    try {
      // Ürün bazında grupla, sıraya göre görselleri ekle
      const gruplar = new Map<string, EslesmeSatiri[]>();
      for (const s of eslesenler) {
        const g = gruplar.get(s.urunId!) ?? [];
        g.push(s);
        gruplar.set(s.urunId!, g);
      }
      let toplam = 0;
      let i = 0;
      for (const [urunId, grup] of gruplar) {
        i++;
        setMesaj(`Yükleniyor… (${i}/${gruplar.size} ürün)`);
        const gorseller = [];
        for (const s of grup.sort((a, b) => a.sira - b.sira)) {
          const asset = await client.assets.upload("image", s.dosya, {
            filename: s.dosya.name,
          });
          gorseller.push({
            _type: "image",
            _key: `${anahtarla(s.parcaNo)}-${s.sira}`,
            asset: { _type: "reference", _ref: asset._id },
          });
          toplam++;
        }
        // İlk görsel kapak: mevcut görsellerin ÜSTÜNE ekle (setIfMissing + append)
        await client
          .patch(urunId)
          .setIfMissing({ gorseller: [] })
          .append("gorseller", gorseller)
          .commit();
      }
      setMesaj(`${toplam} görsel ${gruplar.size} ürüne bağlandı. Değişiklikler birkaç dakika içinde sitede görünecek.`);
      setSatirlar([]);
    } catch (err) {
      setMesaj(`Yükleme hatası: ${(err as Error).message}`);
    } finally {
      setMesgul(false);
    }
  }, [satirlar, client]);

  const eslesen = satirlar.filter((s) => s.urunId).length;
  const eslesmeyen = satirlar.length - eslesen;

  return (
    <Box padding={4} style={{ maxWidth: 900, margin: "0 auto" }}>
      <Stack space={4}>
        <Heading size={2}>Toplu Görsel Yükleme</Heading>
        <Text muted size={1}>
          Dosya adı parça numarasıyla eşleşirse görsel otomatik doğru ürüne bağlanır.
          Örnek: <code>04910987-1.jpg</code> → parça 04910987, 1. görsel (kapak).
        </Text>

        <Card
          padding={5}
          radius={2}
          tone="transparent"
          style={{ border: "2px dashed #ccc", textAlign: "center" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            dosyaSec(e.dataTransfer.files);
          }}
        >
          <Stack space={3}>
            <Text muted size={1}>Görselleri buraya sürükleyin veya seçin</Text>
            <Box>
              <label>
                <Button as="span" text="Görsel seç…" tone="primary" disabled={mesgul} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => dosyaSec(e.target.files)}
                  disabled={mesgul}
                />
              </label>
            </Box>
          </Stack>
        </Card>

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

        {satirlar.length > 0 && (
          <Stack space={3}>
            <Flex gap={2}>
              <Badge tone="positive">Eşleşen: {eslesen}</Badge>
              <Badge tone={eslesmeyen ? "critical" : "default"}>Eşleşmeyen: {eslesmeyen}</Badge>
            </Flex>
            <Box style={{ maxHeight: 300, overflowY: "auto" }}>
              <Stack space={2}>
                {satirlar.map((s, i) => (
                  <Text key={i} size={1}>
                    {s.urunId ? "✓" : "✗"} <strong>{s.dosya.name}</strong> →{" "}
                    {s.urunId ? `${s.urunParcaNo} (sıra ${s.sira})` : "eşleşen ürün yok"}
                  </Text>
                ))}
              </Stack>
            </Box>
            {eslesen > 0 && (
              <Button text={`${eslesen} görseli ürünlere bağla`} tone="positive" disabled={mesgul} onClick={yukle} />
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
