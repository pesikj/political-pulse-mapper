export interface Country {
  code: string;
  name: string;
  flag?: string;
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