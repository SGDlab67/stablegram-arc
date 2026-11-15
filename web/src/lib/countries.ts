/**
 * Countries for the flag next to a name. The flag helps people tell apart look-alike names
 * ("the Dev I'm paying is in India"). It is self-reported and never checked; no ID is asked for.
 * Names come from the phone's own language settings (Intl.DisplayNames), so only ISO codes live here.
 */

export const COUNTRY_CODES = (
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ " +
  "DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI XK KW KG " +
  "LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE " +
  "PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV " +
  "UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW"
).split(" ");

/** Countries people pick most, shown first in the picker. */
export const POPULAR_COUNTRIES = ["US", "IN", "MX", "PH", "NG", "GB", "CA", "BR", "VN", "CN"];

/** 🇺🇸 from "US". */
export function flagOf(code?: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

let names: Intl.DisplayNames | null = null;
export function countryName(code?: string): string {
  if (!code) return "";
  try {
    names ??= new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** The country in the phone's language setting (en-US → US), as a starting suggestion. */
export function guessCountry(): string {
  if (typeof navigator === "undefined") return "";
  const region = (navigator.language || "").split("-")[1]?.toUpperCase();
  return region && COUNTRY_CODES.includes(region) ? region : "";
}
