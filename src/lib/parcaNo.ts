// Parça numarasının arayanların yazdığı diğer biçimleri (§6 arama, §11 SEO).
// "01174696" → ["0117 4696", "1174696"]; "0.065.1558.6/10" → ["00651558610"].
export function numaraVaryantlari(parcaNo: string, haric: string[] = []): string[] {
  const no = parcaNo.trim();
  const varyantlar: string[] = [];

  if (/^\d{8}$/.test(no)) {
    varyantlar.push(`${no.slice(0, 4)} ${no.slice(4)}`);
    if (no.startsWith("0")) varyantlar.push(no.replace(/^0+/, ""));
  } else {
    const sade = no.replace(/[\s.\-_/]/g, "");
    if (sade !== no) varyantlar.push(sade);
  }

  const gorulen = new Set([no, ...haric].map((n) => n.toLowerCase()));
  return varyantlar.filter((v) => v && !gorulen.has(v.toLowerCase()));
}
