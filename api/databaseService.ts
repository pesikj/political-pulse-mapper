import initSqlJs, { Database } from 'sql.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Country, PoliticalParty, Ideology, PolicyAnalysis } from '../src/types/political';

type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

let sqliteDb: Database | null = null;
let sqliteInitPromise: Promise<Database> | null = null;
let pgPool: PgPool | null = null;
let pgInitPromise: Promise<PgPool> | null = null;

const databaseUrl = typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined;
const usePostgres = Boolean(databaseUrl);

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

interface DBLLMResponse {
  party_id: string;
  response: string;
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

function resolvePgSslConfig(url: string): boolean | { rejectUnauthorized: boolean } {
  return /localhost|127\.0\.0\.1/i.test(url) ? false : { rejectUnauthorized: false };
}

async function createNeonQueryAdapter(connectionString: string): Promise<PgPool> {
  const moduleName = '@neondatabase/serverless';
  let neonModule: unknown;
  try {
    neonModule = await import(/* @vite-ignore */ moduleName);
  } catch (error) {
    throw new Error('Postgres support requires the optional dependency "@neondatabase/serverless". Please install it (npm install @neondatabase/serverless).');
  }

  const neonFactory = (neonModule as { neon?: (connectionString: string) => unknown }).neon;
  if (!neonFactory) {
    throw new Error('Failed to load Neon serverless driver. Ensure the "@neondatabase/serverless" package is installed correctly.');
  }

  const neonClient = neonFactory(connectionString) as { unsafe?: (query: string, params?: readonly any[]) => Promise<any[]> };
  if (typeof neonClient.unsafe !== 'function') {
    throw new Error('Neon driver does not expose the expected unsafe query interface.');
  }

  const adapter: PgPool = {
    async query(text: string, params: unknown[] = []) {
      const rows = await neonClient.unsafe!(text, params as readonly any[]);
      return { rows };
    }
  };

  await adapter.query('SELECT 1');
  return adapter;
}

async function createPgPool(connectionString: string): Promise<PgPool> {
  const moduleName = 'pg';
  let pgModule: unknown;
  try {
    pgModule = await import(/* @vite-ignore */ moduleName);
  } catch (error) {
    throw new Error('Postgres support requires the optional dependency "pg". Please install it (npm install pg) before enabling DATABASE_URL.');
  }

  const PoolConstructor = (pgModule as { Pool?: new (config: unknown) => PgPool }).Pool;
  if (!PoolConstructor) {
    throw new Error('Failed to load Postgres driver. Ensure the "pg" package is installed correctly.');
  }

  const pool: PgPool = new PoolConstructor({
    connectionString,
    ssl: resolvePgSslConfig(connectionString)
  });

  await pool.query('SELECT 1');
  return pool;
}

async function ensurePostgres(): Promise<PgPool> {
  if (!usePostgres) {
    throw new Error('Postgres is not enabled');
  }

  if (pgPool) {
    return pgPool;
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  if (!pgInitPromise) {
    pgInitPromise = (async () => {
      try {
        const pool = await createNeonQueryAdapter(databaseUrl);
        pgPool = pool;
        return pool;
      } catch (neonError) {
        console.warn('Falling back to pg client after Neon driver initialization failed:', neonError);
      }

      const pool = await createPgPool(databaseUrl);
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resolveSqlitePath(): Promise<string> {
  const candidates = [
    process.env.SQLITE_DB_PATH,
    path.join(process.cwd(), 'data', 'data.db'),
    path.join(process.cwd(), 'public', 'data.db'),
    path.join(__dirname, '..', 'data', 'data.db'),
    path.join(__dirname, '..', 'public', 'data.db')
  ].filter((candidate): candidate is string => typeof candidate === 'string');

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue searching
    }
  }

  throw new Error('Unable to locate local SQLite database file. Provide SQLITE_DB_PATH or place data.db in /data or /public.');
}

async function ensureSqlite(): Promise<Database> {
  if (sqliteDb) {
    return sqliteDb;
  }

  if (!sqliteInitPromise) {
    sqliteInitPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
      });

      const sqlitePath = await resolveSqlitePath();
      const buffer = await fs.readFile(sqlitePath);
      sqliteDb = new SQL.Database(new Uint8Array(buffer));
      console.log(`SQLite database initialized from ${sqlitePath}`);
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

export async function fetchCountriesFromDatabase(): Promise<Country[]> {
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

export async function fetchPartiesFromDatabase(countryCode: string): Promise<PoliticalParty[]> {
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

export async function fetchPartyPoliciesFromDatabase(partyId: string): Promise<PolicyAnalysis[]> {
  if (usePostgres) {
    try {
      const pool = await ensurePostgres();
      const { rows } = await pool.query(`
        SELECT
          id, party_id, country, timestamp, chunk_index, policy_id,
          policy, short_name, impact, impact_explanation,
          category, explanation, econ_freedom, personal_freedom, weight, error
        FROM llm_responses
        WHERE party_id = $1 AND policy IS NOT NULL AND error IS NULL
        ORDER BY chunk_index, policy_id
      `, [partyId]);

      if (!rows.length) {
        return [];
      }

      const policies: PolicyAnalysis[] = [];

      for (const row of rows) {
        const policyText = row.policy as string | null;
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
        policy, short_name, impact, impact_explanation,
        category, explanation, econ_freedom, personal_freedom, weight, error
      FROM llm_responses
      WHERE party_id = ? AND policy IS NOT NULL AND error IS NULL
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
