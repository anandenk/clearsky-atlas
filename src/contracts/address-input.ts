// Deterministic input handling, not an address validator or a geocoder.
export const ADDRESS_INPUT_LIMIT = 1000;
export const GEOCODE_REQUEST_LIMIT = 3;
export const GEOCODE_TIMEOUT_MS = 20_000;

export type AddressQuery = { address: string; adjustments: string[] };
export type AddressPlan = {
  normalizedAddress: string;
  assumedCalifornia: boolean;
  queries: AddressQuery[];
};

export class AddressInputError extends Error {}

// Recognize explicit US states without ever replacing them with California.
const stateNames =
  "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|Puerto Rico".split(
    "|",
  );
const stateCodes =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(
    " ",
  );
const statePattern = [...stateNames, ...stateCodes, "Calif\\.?", "C\\.A\\."]
  .sort((a, b) => b.length - a.length)
  .join("|");
const stateTail = new RegExp(
  `\\b(${statePattern})(?=\\s*(?:\\d{5}(?:-\\d{4})?)?\\s*$)`,
  "i",
);
const stateHead = new RegExp(
  `^(${stateCodes.join("|")})\\b(?=\\s+[^\\d,])`,
  "i",
);
const fullStatePrefix = new RegExp(`^(?:${stateNames.join("|")})\\b`, "i");
const zipOnly = /^\d{5}(?:-\d{4})?$/;
const houseStart =
  /\b\d+[a-z]?(?:-\d+[a-z]?)?(?:\s+\d\/\d)?(?=\s+[\p{L}\d])/giu;
const context =
  /\b(?:library|city hall|civic center|public works|courthouse)\b/i;

function tidy(value: string) {
  return value
    .replace(/\s*,\s*/g, ", ")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "");
}

/** Cheap canonicalization only. Never fetch or extract an address from a URL. */
export function normalizeAddressInput(input: unknown): string {
  if (typeof input !== "string" || !input.trim())
    throw new AddressInputError(
      "Enter a street number and street, with a city or ZIP code.",
    );
  if (input.length > ADDRESS_INPUT_LIMIT)
    throw new AddressInputError(
      "This looks longer than an address. Paste just the street address and city or ZIP (up to 1,000 characters).",
    );
  let value = input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\r\n;]+/g, ", ")
    .replace(/\s+/g, " ");
  if (
    /(?:[a-z][a-z\d+.-]*:\/\/|\bwww\.|\b(?:maps\.app\.goo\.gl|maps\.google\.com)\b)/i.test(
      value,
    )
  )
    throw new AddressInputError(
      "Paste the street address shown on the map, rather than a link. Links are not opened.",
    );
  if (/[\u0000-\u0008\u000E-\u001F\u007F]/.test(value))
    throw new AddressInputError(
      "Remove non-text characters and paste the street address again.",
    );
  value = tidy(
    value
      .replace(/^\s*(?:address|location)\s*:\s*/i, "")
      .replace(/^["“]|["”]$/g, ""),
  );
  // A country is not a Census onelineaddress field. Only remove a US suffix.
  value = tidy(
    value.replace(
      /(?:,?\s+|^)(?:United States(?: of America)?|U\.?S\.?A\.?|U\.?S\.?)\s*$/i,
      "",
    ),
  );
  return value;
}

function streetIndex(value: string) {
  const matches = [...value.matchAll(houseStart)];
  return (
    matches.find((m) => {
      // A leading ZIP in a reordered address is not the house number.
      if (zipOnly.test(m[0]) && matches.some((n) => n.index! > m.index!))
        return false;
      // Avoid treating a standalone unit before the street as its house number.
      return !/(?:\b(?:apt|apartment|suite|ste|unit|room|rm|floor|fl)\.?\s*#?|#)\s*$/i.test(
        value.slice(0, m.index),
      );
    })?.index ?? -1
  );
}

function statePart(value: string) {
  const parts = value.split(", ");
  // The last state-shaped component wins: Washington, DC is a city and state.
  for (let index = parts.length - 1; index >= 0; index--) {
    const part = parts[index];
    const match = part.match(stateTail) ?? part.match(stateHead);
    if (!match) continue;
    // Don't read a street's directional NE (etc.) as its state.
    if (
      parts.length > 1 &&
      streetIndex(part) === 0 &&
      !/\d{5}(?:-\d{4})?$/.test(part)
    )
      continue;
    return { index, match };
  }
  return null;
}

function normalizeState(value: string) {
  const found = statePart(value);
  if (!found) return value;
  return value
    .split(", ")
    .map((part, index) => {
      if (index !== found.index) return part;
      const { match } = found;
      const name = match[1];
      const stateIndex = stateNames.findIndex(
        (s) => s.toLowerCase() === name.toLowerCase(),
      );
      const code =
        stateIndex >= 0
          ? stateCodes[stateIndex]
          : /^(?:calif\.?|c\.a\.)$/i.test(name)
            ? "CA"
            : name.toUpperCase();
      const rest = part.slice(match.index! + name.length);
      if (match.index === 0 && stateHead.test(part) && rest.trim())
        return rest.trim() + ", " + code;
      return part.slice(0, match.index) + code + rest;
    })
    .join(", ");
}

function reorder(value: string): string {
  const parts = value.split(", ");
  const start = streetIndex(value);
  if (start < 0) return value;
  // Preserve locality words, but put the numbered street before them.
  if (parts.length === 1)
    return start > 0
      ? reorder(tidy(value.slice(start) + ", " + value.slice(0, start)))
      : value;
  const street = parts.findIndex((part) => streetIndex(part) >= 0);
  if (street < 0) return value;
  const splitAt = streetIndex(parts[street]);
  const streetPart = parts[street].slice(splitAt);
  const prefix = tidy(parts[street].slice(0, splitAt));
  const rest = parts.flatMap((part, i) =>
    i !== street ? [part] : prefix ? [prefix] : [],
  );
  const explicitState = statePart(value);
  const states: string[] = [],
    zips: string[] = [],
    cities: string[] = [];
  for (const part of rest) {
    if (zipOnly.test(part)) zips.push(part);
    else if (/^\d{5}(?:-\d{4})?\s+\p{L}/u.test(part)) {
      const split = part.indexOf(" ");
      zips.push(part.slice(0, split));
      cities.push(part.slice(split + 1));
    } else if (
      parts.indexOf(part) === explicitState?.index &&
      part.match(stateTail)?.index === 0
    )
      states.push(part);
    else cities.push(part);
  }
  return tidy([streetPart, ...cities, ...states, ...zips].join(", "));
}

function withoutUnit(value: string) {
  return tidy(
    value
      // A comma-delimited unit/floor line, or one following a street suffix.
      .replace(
        /(^|,\s*)(?:apt|apartment|suite|ste|unit|room|rm|floor|fl)\.?\s*#?\s*[\p{L}\d-]+(?=,|$)/giu,
        "$1",
      )
      .replace(
        /(\b(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place|pkwy|parkway)\.?)\s+(?:apt|apartment|suite|ste|unit|room|rm|floor|fl)\.?\s*#?\s*[\p{L}\d-]+\b/giu,
        "$1",
      )
      .replace(/\s+#\s*[\p{L}\d-]+\b/gu, ""),
  );
}

/** At most three distinct queries, stopping at the first nonempty source result. */
export function planAddressQueries(input: unknown): AddressPlan {
  const normalizedAddress = normalizeAddressInput(input);
  if (
    streetIndex(normalizedAddress) < 0 ||
    /\b(?:P\.?\s*O\.?\s*Box|Post Office Box)\b/i.test(normalizedAddress)
  )
    throw new AddressInputError(
      "Include a building number and street, plus a city or ZIP. Place names, intersections, PO boxes and map links cannot be resolved as street addresses.",
    );
  const preliminaryOrder = reorder(normalizedAddress);
  const explicitState =
    statePart(normalizedAddress) ?? statePart(preliminaryOrder);
  // Preserve state-before-city text even when a safe split is unclear
  // (California City is also a city name). Leave that constraint to Census.
  const prefixState = fullStatePrefix.test(
    normalizedAddress.slice(0, streetIndex(normalizedAddress)),
  );
  // A supplied non-CA ZIP must not be rewritten into a California search.
  const zip = [...normalizedAddress.matchAll(/\b\d{5}(?:-\d{4})?\b/g)].find(
    (m) => m.index !== streetIndex(normalizedAddress),
  );
  const assumedCalifornia =
    !explicitState &&
    !prefixState &&
    (!zip || /^(?:9[0-5]\d|96[01])/.test(zip[0]));
  const stateNormalized = normalizeState(normalizedAddress);
  const qualify = (value: string) => {
    if (!assumedCalifornia) return value;
    // Keep CA before a trailing ZIP, not after it.
    return /\b\d{5}(?:-\d{4})?$/.test(value)
      ? value.replace(/\b(\d{5}(?:-\d{4})?)$/, "CA $1")
      : value + ", CA";
  };
  const queries: AddressQuery[] = [];
  const add = (value: string, adjustments: string[]) => {
    const address = qualify(tidy(value));
    if (
      !queries.some((q) => q.address.toLowerCase() === address.toLowerCase()) &&
      queries.length < GEOCODE_REQUEST_LIMIT
    )
      queries.push({ address, adjustments });
  };
  add(stateNormalized, []);
  // Keep the original interpretation first. Rearrangement is a no-match fallback.
  const ordered = normalizeState(reorder(stateNormalized));
  const reordered =
    ordered !== stateNormalized
      ? ["Street and locality components reordered."]
      : [];
  add(ordered, reordered);
  const parts = ordered.split(", ");
  const noContext = parts
    .filter(
      (part) =>
        !(context.test(part) && streetIndex(part) < 0 && !stateTail.test(part)),
    )
    .join(", ");
  const unitless = withoutUnit(noContext);
  const relaxed = unitless.replace(
    /\b(\d{5})-\d{4}\b/g,
    (full, fiveDigits: string, index: number) =>
      index === streetIndex(unitless) ? full : fiveDigits,
  );
  const adjustments = [...reordered];
  if (noContext !== ordered)
    adjustments.push(
      "Building-name context omitted; confirm the numbered street.",
    );
  if (unitless !== noContext)
    adjustments.push(
      "Unit or floor omitted; Census does not locate individual units.",
    );
  if (relaxed !== unitless)
    adjustments.push("ZIP+4 reduced to its five-digit ZIP.");
  add(relaxed, adjustments);
  return { normalizedAddress, assumedCalifornia, queries };
}
