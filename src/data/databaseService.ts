import initSqlJs, { Database } from 'sql.js';
import { Country, PoliticalParty, Ideology, PolicyAnalysis } from '@/types/political';

let sqliteDb: Database | null = null;
let sqliteInitPromise: Promise<Database> | null = null;

const COUNTRY_FLAGS: Record<string, string> = {
  'Czech Republic': '🇨🇿',
  'Slovakia': '🇸🇰',
  'Poland': '🇵🇱',
  'Germany': '🇩🇪',
  'Austria': '🇦🇹',
  'Hungary': '🇭🇺',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
};

const isBrowserEnvironment = typeof window !== 'undefined';

async function ensureSqlite(): Promise<Database> {
  if (sqliteDb) {
    return sqliteDb;
  }

  if (!sqliteInitPromise) {
    sqliteInitPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      const response = await fetch('/data.db', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      sqliteDb = new SQL.Database(new Uint8Array(buffer));
      console.log('SQLite database initialized successfully');
      return sqliteDb;
    })();
  }

  try {
    return await sqliteInitPromise;
  } catch (error) {
    sqliteInitPromise = null;
    sqliteDb = null;
    throw error;
  }
}

function determineIdeology(leftRight: number, authLib: number): Ideology {
  if (Math.abs(leftRight) < 1 && Math.abs(authLib) < 1) {
    return 'centrist';
  }

  if (leftRight < -2 && authLib > 2) {
    return 'liberal';
  }

  if (leftRight > 2 && authLib < -2) {
    return 'conservative';
  }

  if (leftRight > 2 && authLib > 2) {
    return 'libertarian';
  }

  if (leftRight < -2 && authLib < -2) {
    return 'authoritarian';
  }

  if (leftRight < -3) {
    return 'socialist';
  }

  if (authLib > 3) {
    return 'green';
  }

  return 'centrist';
}

interface DBParty {
  id: string;
  name: string;
  type: string;
  country: string;
  founded: number | null;
  website: string | null;
  econ_freedom: number | null;
  personal_freedom: number | null;
}

function transformDBPartyToAppParty(dbParty: DBParty): PoliticalParty {
  const econFreedom = dbParty.econ_freedom ?? 0;
  const personalFreedom = dbParty.personal_freedom ?? 0;
  const ideology = determineIdeology(econFreedom, personalFreedom);

  const nameWords = dbParty.name.split(' ');
  const shortName = nameWords.length > 2 ? nameWords[0] : nameWords.slice(0, 2).join(' ');

  return {
    id: dbParty.id,
    name: dbParty.name,
    shortName,
    econFreedom,
    personalFreedom,
    ideology,
    description: `${dbParty.name} is a ${dbParty.type} in ${dbParty.country.toUpperCase()}.`,
    website: dbParty.website ?? undefined,
    logo: undefined,
    founded: dbParty.founded ?? undefined,
    support: undefined
  };
}

async function fetchFromApi<T>(path: string): Promise<T | null> {
  if (!isBrowserEnvironment) {
    return null;
  }

  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Falling back to bundled SQLite after API request failure for ${path}:`, error);
    return null;
  }
}

export async function fetchCountriesFallback(): Promise<Country[]> {
  try {
    const db = await ensureSqlite();
    const result = db.exec(`
      SELECT DISTINCT country
      FROM parties
      ORDER BY country
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    return result[0].values
      .map((row) => row[0] as string | null)
      .filter((name): name is string => typeof name === 'string' && name.length > 0)
      .map((name) => ({
        code: name,
        name,
        flag: COUNTRY_FLAGS[name]
      }));
  } catch (error) {
    console.error('Error fetching countries from SQLite fallback:', error);
    return [];
  }
}

export async function fetchCountries(): Promise<Country[]> {
  const apiData = await fetchFromApi<Country[]>('/api/countries');
  if (apiData) {
    return apiData;
  }

  return fetchCountriesFallback();
}

export async function fetchPartiesFallback(countryCode: string): Promise<PoliticalParty[]> {
  try {
    const db = await ensureSqlite();
    const partiesResult = db.exec(`
      SELECT id, name, type, country, founded, website, econ_freedom, personal_freedom
      FROM parties
      WHERE country = ?
      ORDER BY name
    `, [countryCode]);

    if (partiesResult.length === 0 || partiesResult[0].values.length === 0) {
      return [];
    }

    const parties: PoliticalParty[] = [];

    for (const row of partiesResult[0].values) {
      const dbParty: DBParty = {
        id: row[0] as string,
        name: row[1] as string,
        type: row[2] as string,
        country: row[3] as string,
        founded: row[4] as number | null,
        website: row[5] as string | null,
        econ_freedom: row[6] as number | null,
        personal_freedom: row[7] as number | null,
      };

      parties.push(transformDBPartyToAppParty(dbParty));
    }

    return parties;
  } catch (error) {
    console.error(`Error fetching parties for ${countryCode} from SQLite fallback:`, error);
    return [];
  }
}

export async function fetchParties(countryCode: string): Promise<PoliticalParty[]> {
  const apiUrl = `/api/parties?country=${encodeURIComponent(countryCode)}`;
  const apiData = await fetchFromApi<PoliticalParty[]>(apiUrl);
  if (apiData) {
    return apiData;
  }

  return fetchPartiesFallback(countryCode);
}

export async function fetchPartyPoliciesFallback(partyId: string): Promise<PolicyAnalysis[]> {
  try {
    const db = await ensureSqlite();
    const result = db.exec(`
      SELECT
        id, party_id, country, timestamp, chunk_index, policy_id,
        policy_text, short_name, impact, impact_explanation,
        category, explanation, econ_freedom, personal_freedom, weight, error
      FROM llm_responses
      WHERE party_id = ? AND policy_text IS NOT NULL AND error IS NULL
      ORDER BY chunk_index, policy_id
    `, [partyId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const policies: PolicyAnalysis[] = [];

    for (const row of result[0].values) {
      const policyText = row[6] as string | null;
      const shortName = row[7] as string | null;
      const impact = row[8] as string | null;
      const impactExplanation = row[9] as string | null;
      const categoryJson = row[10] as string | null;
      const explanation = row[11] as string | null;
      const econFreedom = row[12] as number | null;
      const personalFreedom = row[13] as number | null;

      if (!policyText || !shortName) {
        continue;
      }

      let categories: string[] = [];
      if (categoryJson) {
        try {
          const parsed = JSON.parse(categoryJson);
          categories = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('Failed to parse category JSON:', categoryJson);
        }
      }

      policies.push({
        policyText,
        shortName,
        impact: (impact as 'high' | 'medium' | 'low') || 'medium',
        categories,
        explanation: explanation || impactExplanation || '',
        econFreedom,
        personalFreedom
      });
    }

    return policies;
  } catch (error) {
    console.error(`Error fetching policies for party ${partyId} from SQLite fallback:`, error);
    return [];
  }
}

export async function fetchPartyPolicies(partyId: string): Promise<PolicyAnalysis[]> {
  const apiUrl = `/api/policies?partyId=${encodeURIComponent(partyId)}`;
  const apiData = await fetchFromApi<PolicyAnalysis[]>(apiUrl);
  if (apiData) {
    return apiData;
  }

  return fetchPartyPoliciesFallback(partyId);
}

export const COUNTRIES = fetchCountries;
