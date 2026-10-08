/**
 * Phone numbers as owners type them: a country picked from a list (Nigeria by default) plus the national number.
 * Stored in the international format (E.164, e.g. +2348031234567), so WhatsApp links and any later messaging tool work
 * the same for every number. No third-party phone library: the rules here are deliberately light.
 */

export type Country = { iso: string; name: string; dial: string };

/** ISO code, name and calling code. Sorted by name; `COUNTRY_OPTIONS` puts the likeliest ones first. */
const COUNTRY_TABLE = `AF Afghanistan 93|AL Albania 355|DZ Algeria 213|AD Andorra 376|AO Angola 244|AG Antigua and Barbuda 1|AR Argentina 54|AM Armenia 374|AU Australia 61|AT Austria 43|AZ Azerbaijan 994|BS Bahamas 1|BH Bahrain 973|BD Bangladesh 880|BB Barbados 1|BY Belarus 375|BE Belgium 32|BZ Belize 501|BJ Benin 229|BT Bhutan 975|BO Bolivia 591|BA Bosnia and Herzegovina 387|BW Botswana 267|BR Brazil 55|BN Brunei 673|BG Bulgaria 359|BF Burkina Faso 226|BI Burundi 257|CV Cabo Verde 238|KH Cambodia 855|CM Cameroon 237|CA Canada 1|CF Central African Republic 236|TD Chad 235|CL Chile 56|CN China 86|CO Colombia 57|KM Comoros 269|CG Congo 242|CD Congo (DRC) 243|CR Costa Rica 506|CI Côte d'Ivoire 225|HR Croatia 385|CU Cuba 53|CY Cyprus 357|CZ Czechia 420|DK Denmark 45|DJ Djibouti 253|DM Dominica 1|DO Dominican Republic 1|EC Ecuador 593|EG Egypt 20|SV El Salvador 503|GQ Equatorial Guinea 240|ER Eritrea 291|EE Estonia 372|SZ Eswatini 268|ET Ethiopia 251|FJ Fiji 679|FI Finland 358|FR France 33|GA Gabon 241|GM Gambia 220|GE Georgia 995|DE Germany 49|GH Ghana 233|GR Greece 30|GD Grenada 1|GT Guatemala 502|GN Guinea 224|GW Guinea-Bissau 245|GY Guyana 592|HT Haiti 509|HN Honduras 504|HK Hong Kong 852|HU Hungary 36|IS Iceland 354|IN India 91|ID Indonesia 62|IR Iran 98|IQ Iraq 964|IE Ireland 353|IL Israel 972|IT Italy 39|JM Jamaica 1|JP Japan 81|JO Jordan 962|KZ Kazakhstan 7|KE Kenya 254|KW Kuwait 965|KG Kyrgyzstan 996|LA Laos 856|LV Latvia 371|LB Lebanon 961|LS Lesotho 266|LR Liberia 231|LY Libya 218|LI Liechtenstein 423|LT Lithuania 370|LU Luxembourg 352|MG Madagascar 261|MW Malawi 265|MY Malaysia 60|MV Maldives 960|ML Mali 223|MT Malta 356|MR Mauritania 222|MU Mauritius 230|MX Mexico 52|MD Moldova 373|MC Monaco 377|MN Mongolia 976|ME Montenegro 382|MA Morocco 212|MZ Mozambique 258|MM Myanmar 95|NA Namibia 264|NP Nepal 977|NL Netherlands 31|NZ New Zealand 64|NI Nicaragua 505|NE Niger 227|NG Nigeria 234|MK North Macedonia 389|NO Norway 47|OM Oman 968|PK Pakistan 92|PS Palestine 970|PA Panama 507|PG Papua New Guinea 675|PY Paraguay 595|PE Peru 51|PH Philippines 63|PL Poland 48|PT Portugal 351|QA Qatar 974|RO Romania 40|RU Russia 7|RW Rwanda 250|KN Saint Kitts and Nevis 1|LC Saint Lucia 1|VC Saint Vincent and the Grenadines 1|WS Samoa 685|SM San Marino 378|ST São Tomé and Príncipe 239|SA Saudi Arabia 966|SN Senegal 221|RS Serbia 381|SC Seychelles 248|SL Sierra Leone 232|SG Singapore 65|SK Slovakia 421|SI Slovenia 386|SB Solomon Islands 677|SO Somalia 252|ZA South Africa 27|KR South Korea 82|SS South Sudan 211|ES Spain 34|LK Sri Lanka 94|SD Sudan 249|SR Suriname 597|SE Sweden 46|CH Switzerland 41|SY Syria 963|TW Taiwan 886|TJ Tajikistan 992|TZ Tanzania 255|TH Thailand 66|TL Timor-Leste 670|TG Togo 228|TO Tonga 676|TT Trinidad and Tobago 1|TN Tunisia 216|TR Türkiye 90|TM Turkmenistan 993|UG Uganda 256|UA Ukraine 380|AE United Arab Emirates 971|GB United Kingdom 44|US United States 1|UY Uruguay 598|UZ Uzbekistan 998|VU Vanuatu 678|VE Venezuela 58|VN Vietnam 84|YE Yemen 967|ZM Zambia 260|ZW Zimbabwe 263`;

export const COUNTRIES: Country[] = COUNTRY_TABLE.split("|").map((entry) => {
  const [iso, ...rest] = entry.split(" ");
  const dial = rest.pop()!;
  return { iso, name: rest.join(" "), dial };
});

export const DEFAULT_COUNTRY = "NG";

/** Shown first in the list: Nigeria, then where Nigerian owners and their diaspora most often are. */
const PRIORITY = ["NG", "GH", "KE", "ZA", "GB", "US", "CA", "AE"];

export const COUNTRY_OPTIONS: Country[] = [
  ...PRIORITY.map((iso) => COUNTRIES.find((country) => country.iso === iso)!),
  ...COUNTRIES.filter((country) => !PRIORITY.includes(country.iso)),
];

export function countryByIso(iso: string | null | undefined): Country {
  return COUNTRIES.find((country) => country.iso === iso) ?? COUNTRIES.find((country) => country.iso === DEFAULT_COUNTRY)!;
}

/** The flag as an emoji, built from the ISO code (some Windows browsers show the two letters instead). */
export function flagOf(iso: string) {
  return String.fromCodePoint(...iso.toUpperCase().split("").map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/** Countries whose numbers keep their leading 0 after the country code, so it must not be dropped. */
const KEEPS_LEADING_ZERO = new Set(["IT", "SM", "CI"]);

/**
 * Cleans what the owner typed into the number box: digits only, and the local leading 0 dropped (in Nigeria
 * 0803… becomes 803…, because +234 replaces the 0). A pasted international number ("+234 803…" or "234803…") is
 * understood too: `iso` then says which country it belongs to.
 */
export function cleanNationalNumber(iso: string, typed: string): { iso: string; national: string; droppedZero: boolean } {
  const pastedInternational = typed.trim().startsWith("+") || typed.trim().startsWith("00");
  let digits = typed.replace(/\D/g, "");
  if (typed.trim().startsWith("00")) digits = digits.slice(2);
  let country = countryByIso(iso);
  if (pastedInternational) {
    // Longest calling code first, preferring the country already chosen when several share it (+1, +7).
    const matches = COUNTRIES.filter((item) => digits.startsWith(item.dial)).sort((a, b) => b.dial.length - a.dial.length);
    const best = matches.find((item) => item.dial === matches[0]?.dial && item.iso === country.iso) ?? matches[0];
    if (best) {
      country = best;
      digits = digits.slice(best.dial.length);
    }
  } else if (digits.length > 10 && digits.startsWith(country.dial) && country.iso === "NG") {
    // "2348031234567" typed without the plus.
    digits = digits.slice(country.dial.length);
  }
  let droppedZero = false;
  if (!KEEPS_LEADING_ZERO.has(country.iso) && digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
    droppedZero = true;
  }
  return { iso: country.iso, national: digits.slice(0, 14), droppedZero };
}

/** A problem with the number, worded for the owner, or null when it looks right. An empty number is fine (optional). */
export function phoneProblem(iso: string, national: string): string | null {
  if (!national) return null;
  if (iso === "NG") return /^[789][01]\d{8}$/.test(national) ? null : "Nigerian numbers have 10 digits after +234, e.g. 803 123 4567.";
  return national.length >= 6 && national.length <= 14 ? null : "That number looks too short or too long.";
}

/** The number in international format (+2348031234567), or "" when none was given. */
export function toInternational(iso: string, national: string) {
  return national ? `+${countryByIso(iso).dial}${national}` : "";
}

/** Reads back a stored number ("+2348031234567") into a country and national number, for editing. */
export function fromInternational(value: string | null | undefined, preferredIso = DEFAULT_COUNTRY): { iso: string; national: string } {
  if (!value) return { iso: preferredIso, national: "" };
  const { iso, national } = cleanNationalNumber(preferredIso, value.trim().startsWith("+") ? value : `+${value.replace(/^\+?/, "")}`);
  return { iso, national };
}

/** Server-side check of a stored number: + and 7 to 15 digits, the E.164 limits. */
export const INTERNATIONAL_PHONE = /^\+[1-9]\d{6,14}$/;
