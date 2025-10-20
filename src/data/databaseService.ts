import initSqlJs, { Database } from 'sql.js';
import { Country, PoliticalParty, Ideology, LLMPolicyResponse, PolicyAnalysis } from '@/types/political';

let db: Database | null = null;
let initPromise: Promise<void> | null = null;

// Initialize the database
async function initDatabase(): Promise<void> {
  if (db) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Fetch the database file
      const response = await fetch('/data.db');
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buffer));

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  })();

  await initPromise;
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
  await initDatabase();

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.exec(`
      SELECT DISTINCT country
      FROM parties
      ORDER BY country
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const countryFlags: Record<string, string> = {
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

    return result[0].values.map((row) => {
      const name = row[0] as string;
      return {
        code: name, // Use full name as code since that's what's in the database
        name: name,
        flag: countryFlags[name]
      };
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

// Fetch parties for a country
export async function fetchParties(countryCode: string): Promise<PoliticalParty[]> {
  await initDatabase();

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Get all parties for the country
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
    console.error(`Error fetching parties for ${countryCode}:`, error);
    return [];
  }
}

// Fetch party policies from llm_responses table
export async function fetchPartyPolicies(partyId: string): Promise<PolicyAnalysis[]> {
  await initDatabase();

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
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

      // Skip if essential fields are missing
      if (!policyText || !shortName) {
        continue;
      }

      // Parse category JSON array
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
    console.error(`Error fetching policies for party ${partyId}:`, error);
    return [];
  }
}

// Export for compatibility with existing code
export const COUNTRIES = fetchCountries;
