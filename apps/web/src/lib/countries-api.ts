export type CountryOption = {
  code: string;
  name: string;
  flag: string;
};

const WORLD_COUNTRIES_CDN =
  "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json";

let cache: CountryOption[] | null = null;
let inflight: Promise<CountryOption[]> | null = null;

function flagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "🏳️";
  return upper.replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0)),
  );
}

type WorldCountryRow = {
  name?: { common?: string };
  cca2?: string;
};

function parseRows(rows: WorldCountryRow[]): CountryOption[] {
  if (!Array.isArray(rows)) {
    throw new Error("Invalid countries payload");
  }
  return rows
    .map((row) => {
      const name = row.name?.common?.trim();
      const code = row.cca2?.trim();
      if (!name || !code) return null;
      return { code, name, flag: flagEmoji(code) };
    })
    .filter((row): row is CountryOption => row != null)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function fetchCountries(): Promise<CountryOption[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(WORLD_COUNTRIES_CDN);
    if (!res.ok) {
      throw new Error("Could not load countries.");
    }
    const data = (await res.json()) as WorldCountryRow[];
    cache = parseRows(data);
    return cache;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function findCountryByName(
  countries: CountryOption[],
  name: string,
): CountryOption | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return countries.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
}
