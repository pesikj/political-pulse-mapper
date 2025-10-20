export interface Country {
  code: string;
  name: string;
  flag?: string;
}

// API Response types
export interface ApiPartyResponse {
  party_id: string;
  country: string;
  left_right: number;
  auth_lib: number;
  updated_at: string;
}

export interface PoliticalParty {
  id: string;
  name: string;
  shortName: string;
  econFreedom: number; // -10 to +10
  personalFreedom: number; // -10 to +10
  ideology: Ideology;
  description: string;
  website?: string;
  logo?: string;
  founded?: number;
  support?: number; // percentage
}

export type Ideology = 
  | 'liberal'
  | 'conservative' 
  | 'libertarian'
  | 'authoritarian'
  | 'centrist'
  | 'socialist'
  | 'green';

export interface CompassPoint {
  party: PoliticalParty;
  x: number; // economic freedom
  y: number; // personal freedom
}

export interface CountryData {
  country: Country;
  parties: PoliticalParty[];
}

export const IDEOLOGY_LABELS: Record<Ideology, string> = {
  liberal: 'Liberal',
  conservative: 'Conservative',
  libertarian: 'Libertarian',
  authoritarian: 'Authoritarian',
  centrist: 'Centrist',
  socialist: 'Socialist',
  green: 'Green'
};

export const IDEOLOGY_COLORS: Record<Ideology, string> = {
  liberal: 'hsl(var(--ideology-liberal))',
  conservative: 'hsl(var(--ideology-conservative))',
  libertarian: 'hsl(var(--ideology-libertarian))',
  authoritarian: 'hsl(var(--ideology-authoritarian))',
  centrist: 'hsl(var(--ideology-centrist))',
  socialist: 'hsl(var(--ideology-socialist))',
  green: 'hsl(var(--ideology-green))'
};

// LLM Response types
export interface LLMPolicyResponse {
  id: number;
  party_id: string;
  country: string;
  timestamp: string;
  chunk_index: number;
  policy_id: number | null;
  policy_text: string | null;
  short_name: string | null;
  impact: 'high' | 'medium' | 'low' | null;
  impact_explanation: string | null;
  category: string | null; // JSON array string like '["moderately right"]'
  explanation: string | null;
  econ_freedom: number | null;
  personal_freedom: number | null;
  weight: number | null;
  error: string | null;
}

export interface PolicyAnalysis {
  policyText: string;
  shortName: string;
  impact: 'high' | 'medium' | 'low';
  categories: string[];
  explanation: string;
  econFreedom: number | null;
  personalFreedom: number | null;
}