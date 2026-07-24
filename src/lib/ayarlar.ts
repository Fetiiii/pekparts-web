import { sanityYapili, sanityAyarlar } from "./sanity";
import { varsayilanAyarlar } from "@/site";
import type { Ayarlar } from "./tipler";

const canli = ["1", "true", "evet"].includes(String(process.env.CANLI ?? "").toLowerCase());

let _ayarlar: Promise<Ayarlar> | null = null;

/** Site iletişim ayarları. Sanity yapılandırılmışsa oradan; değilse dev yedeği.
 *  Yayın derlemesinde (CANLI=1) Sanity zorunlu. Build boyunca önbelleklenir. */
export function getAyarlar(): Promise<Ayarlar> {
  if (!_ayarlar) _ayarlar = _yukle();
  return _ayarlar;
}

async function _yukle(): Promise<Ayarlar> {
  if (sanityYapili()) {
    const a = await sanityAyarlar();
    if (a) return a;
    if (canli) throw new Error("siteAyarlari dokümanı Sanity'de bulunamadı (CANLI=1).");
  } else if (canli) {
    throw new Error("Yayın derlemesi için Sanity zorunlu; site ayarları yer tutucuya düşemez.");
  }
  return varsayilanAyarlar;
}
