import initSqlJs, { Database } from 'sql.js';
import { Country, PoliticalParty, Ideology, LLMPolicyResponse, PolicyAnalysis } from '@/types/political';

type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

let sqliteDb: Database | null = null;
let sqliteInitPromise: Promise<Database> | null = null;
let pgPool: PgPool | null = null;
let pgInitPromise: Promise<PgPool> | null = null;

const databaseUrl = typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined;
const isServerEnvironment = typeof window === 'undefined';
const usePostgres = Boolean(databaseUrl) && isServerEnvironment;

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

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolvePgSslConfig(url: string): boolean | { rejectUnauthorized: boolean } {
  return /localhost|127\.0\.0\.1/i.test(url) ? false : { rejectUnauthorized: false };
}

async function ensurePostgres(): Promise<PgPool> {
  if (!usePostgres) {
    throw new Error('Postgres is not enabled');
  }

  if (pgPool) {
    return pgPool;
  }

  if (!pgInitPromise) {
    pgInitPromise = (async () => {
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not defined');
      }

      const moduleName = 'pg';
      let pgModule: unknown;
      try {
        pgModule = await import(/* @vite-ignore */ moduleName);
      } catch (error) {
        throw new Error('Postgres support requires the optional dependency "pg". Please install it (npm install pg) before enabling DATABASE_URL.');
      }

      const PoolConstructor = (pgModule as unknown as { Pool?: new (config: unknown) => PgPool }).Pool;
      if (!PoolConstructor) {
        throw new Error('Failed to load Postgres driver. Ensure the "pg" package is installed correctly.');
      }
      const pool: PgPool = new PoolConstructor({
        connectionString: databaseUrl,
        ssl: resolvePgSslConfig(databaseUrl)
      });

      await pool.query('SELECT 1');
      pgPool = pool;
      return pool;
    })();
  }

  try {
    return await pgInitPromise;
  } catch (error) {
    pgInitPromise = null;
    pgPool = null;
    throw error;
  }
}

async function ensureSqlite(): Promise<Database> {
  if (sqliteDb) {
    return sqliteDb;
  }

  if (!sqliteInitPromise) {
    sqliteInitPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      const response = await fetch('/data.db');
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


// Helper function to determine ideology based on coordinates
function determineIdeology(leftRight: number, authLib: number): Ideology {
  // left_right: negative = left, positive = right
  // auth_lib: negative = authoritarian, positive = libertarian

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

// Database types
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

interface DBLLMResponse {
  party_id: string;
  response: string;
}

// Transform database party to app format
function transformDBPartyToAppParty(dbParty: DBParty): PoliticalParty {
  const econFreedom = dbParty.econ_freedom ?? 0;
  const personalFreedom = dbParty.personal_freedom ?? 0;

  const ideology = determineIdeology(econFreedom, personalFreedom);

  // Use first word as short name, or first two words if name is very short
  const nameWords = dbParty.name.split(' ');
  const shortName = nameWords.length > 2 ? nameWords[0] : nameWords.slice(0, 2).join(' ');

  return {
    id: dbParty.id,
    name: dbParty.name,
    shortName: shortName,
    econFreedom: econFreedom,
    personalFreedom: personalFreedom,
    ideology: ideology,
    description: `${dbParty.name} is a ${dbParty.type} in ${dbParty.country.toUpperCase()}.`,
    website: dbParty.website ?? undefined,
    logo: undefined,
    founded: dbParty.founded ?? undefined,
    support: undefined
  };
}

// Parse LLM response to extract political coordinates from policy categories
function parseLLMResponse(response: string): { left_right: number; auth_lib: number } | null {
  try {
    // The LLM response contains an array of policies with categories
    const data = JSON.parse(response);

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Map category strings to numerical values
    const categoryWeights: Record<string, { economic: number; authority: number }> = {
      'strongly left': { economic: -5, authority: 0 },
      'moderately left': { economic: -2.5, authority: 0 },
      'centrist': { economic: 0, authority: 0 },
      'moderately right': { economic: 2.5, authority: 0 },
      'strongly right': { economic: 5, authority: 0 },
      'strongly authoritarian': { economic: 0, authority: -5 },
      'moderately authoritarian': { economic: 0, authority: -2.5 },
      'moderately libertarian': { economic: 0, authority: 2.5 },
      'strongly libertarian': { economic: 0, authority: 5 },
    };

    let totalEconomic = 0;
    let totalAuthority = 0;
    let totalWeight = 0;

    // Process each policy
    for (const policy of data) {
      if (!policy.category || !Array.isArray(policy.category)) continue;

      const impact = policy.impact === 'high' ? 3 : policy.impact === 'medium' ? 2 : 1;

      for (const cat of policy.category) {
        const catLower = cat.toLowerCase();
        const weight = categoryWeights[catLower];

        if (weight) {
          totalEconomic += weight.economic * impact;
          totalAuthority += weight.authority * impact;
          totalWeight += impact;
        }
      }
    }

    if (totalWeight === 0) {
      return null;
    }

    // Calculate weighted averages
    const left_right = totalEconomic / totalWeight;
    const auth_lib = totalAuthority / totalWeight;

    return {
      left_right: Math.round(left_right * 10) / 10, // Round to 1 decimal
      auth_lib: Math.round(auth_lib * 10) / 10
    };
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return null;
  }
}

// Fetch countries
export async function fetchCountries(): Promise<Country[]> {
  if (usePostgres) {
    try {
      const pool = await ensurePostgres();
      const { rows } = await pool.query(`
        SELECT DISTINCT country
        FROM parties
        ORDER BY country
      `);

      if (!rows.length) {
        return [];
      }

      return rows
        .map((row) => row.country as string | null)
        .filter((name): name is string => typeof name === 'string' && name.length > 0)
        .map((name) => ({
          code: name,
          name,
          flag: COUNTRY_FLAGS[name]
        }));
    } catch (error) {
      console.error('Error fetching countries from Postgres:', error);
      return [];
    }
  }

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
    console.error('Error fetching countries from SQLite:', error);
    return [];
  }
}

// Fetch parties for a country
export async function fetchParties(countryCode: string): Promise<PoliticalParty[]> {
  if (usePostgres) {
    try {
      const pool = await ensurePostgres();
      const { rows } = await pool.query(`
        SELECT id, name, type, country, founded, website, econ_freedom, personal_freedom
        FROM parties
        WHERE country = $1
        ORDER BY name
      `, [countryCode]);

      if (!rows.length) {
        return [];
      }

      return rows.map((row) => {
        const dbParty: DBParty = {
          id: row.id as string,
          name: row.name as string,
          type: row.type as string,
          country: row.country as string,
          founded: toNullableNumber(row.founded),
          website: (row.website as string | null) ?? null,
          econ_freedom: toNullableNumber(row.econ_freedom),
          personal_freedom: toNullableNumber(row.personal_freedom),
        };

        return transformDBPartyToAppParty(dbParty);
      });
    } catch (error) {
      console.error(`Error fetching parties for ${countryCode} from Postgres:`, error);
      return [];
    }
  }

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
    console.error(`Error fetching parties for ${countryCode} from SQLite:`, error);
    return [];
  }
}

// Fetch party policies from llm_responses table
export async function fetchPartyPolicies(partyId: string): Promise<PolicyAnalysis[]> {
  if (usePostgres) {
    try {
      const pool = await ensurePostgres();
      const { rows } = await pool.query(`
        SELECT
          id, party_id, country, timestamp, chunk_index, policy_id,
          policy_text, short_name, impact, impact_explanation,
          category, explanation, econ_freedom, personal_freedom, weight, error
        FROM llm_responses
        WHERE party_id = $1 AND policy_text IS NOT NULL AND error IS NULL
        ORDER BY chunk_index, policy_id
      `, [partyId]);

      if (!rows.length) {
        return [];
      }

      const policies: PolicyAnalysis[] = [];

      for (const row of rows) {
        const policyText = row.policy_text as string | null;
        const shortName = row.short_name as string | null;
        const impact = row.impact as string | null;
        const impactExplanation = row.impact_explanation as string | null;
        const categoryJson = row.category as string | null;
        const explanation = row.explanation as string | null;
        const econFreedom = toNullableNumber(row.econ_freedom);
        const personalFreedom = toNullableNumber(row.personal_freedom);

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
      console.error(`Error fetching policies for party ${partyId} from Postgres:`, error);
      return [];
    }
  }

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
    console.error(`Error fetching policies for party ${partyId} from SQLite:`, error);
    return [];
  }
}

// Export for compatibility with existing code
export const COUNTRIES = fetchCountries;
