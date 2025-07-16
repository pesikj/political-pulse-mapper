import { Country, PoliticalParty } from '@/types/political';

export const MOCK_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
];

export const MOCK_PARTIES: Record<string, PoliticalParty[]> = {
  US: [
    {
      id: 'dem',
      name: 'Democratic Party',
      shortName: 'Democrats',
      econFreedom: -3,
      personalFreedom: 6,
      ideology: 'liberal',
      description: 'The Democratic Party is one of the two major contemporary political parties in the United States. It generally supports social liberalism and economic progressivism.',
      website: 'https://democrats.org',
      founded: 1828,
      support: 45
    },
    {
      id: 'rep',
      name: 'Republican Party',
      shortName: 'Republicans',
      econFreedom: 7,
      personalFreedom: -2,
      ideology: 'conservative',
      description: 'The Republican Party is one of the two major contemporary political parties in the United States. It generally supports economic conservatism and traditional social values.',
      website: 'https://gop.com',
      founded: 1854,
      support: 42
    },
    {
      id: 'lib',
      name: 'Libertarian Party',
      shortName: 'Libertarians',
      econFreedom: 9,
      personalFreedom: 8,
      ideology: 'libertarian',
      description: 'The Libertarian Party advocates for minimal government intervention in both personal and economic matters.',
      website: 'https://lp.org',
      founded: 1971,
      support: 2
    },
    {
      id: 'green',
      name: 'Green Party',
      shortName: 'Greens',
      econFreedom: -6,
      personalFreedom: 7,
      ideology: 'green',
      description: 'The Green Party emphasizes environmental protection, social justice, grassroots democracy, and non-violence.',
      website: 'https://gp.org',
      founded: 1984,
      support: 1
    }
  ],
  UK: [
    {
      id: 'con',
      name: 'Conservative Party',
      shortName: 'Conservatives',
      econFreedom: 6,
      personalFreedom: -1,
      ideology: 'conservative',
      description: 'The Conservative Party is a centre-right political party in the United Kingdom. The party is committed to the principles of free market economics.',
      website: 'https://conservatives.com',
      founded: 1834,
      support: 35
    },
    {
      id: 'lab',
      name: 'Labour Party',
      shortName: 'Labour',
      econFreedom: -4,
      personalFreedom: 5,
      ideology: 'socialist',
      description: 'The Labour Party is a centre-left political party in the United Kingdom that has been described as an alliance of social democrats, democratic socialists and trade unionists.',
      website: 'https://labour.org.uk',
      founded: 1900,
      support: 40
    },
    {
      id: 'lib-dem',
      name: 'Liberal Democrats',
      shortName: 'Lib Dems',
      econFreedom: 2,
      personalFreedom: 7,
      ideology: 'liberal',
      description: 'The Liberal Democrats are a liberal political party in the United Kingdom, formed in 1988 from the merger of the Liberal Party and the Social Democratic Party.',
      website: 'https://libdems.org.uk',
      founded: 1988,
      support: 12
    },
    {
      id: 'green-uk',
      name: 'Green Party of England and Wales',
      shortName: 'Greens',
      econFreedom: -7,
      personalFreedom: 8,
      ideology: 'green',
      description: 'The Green Party of England and Wales is a green, left-wing political party in England and Wales.',
      website: 'https://greenparty.org.uk',
      founded: 1990,
      support: 4
    }
  ],
  DE: [
    {
      id: 'cdu',
      name: 'Christian Democratic Union',
      shortName: 'CDU',
      econFreedom: 4,
      personalFreedom: 1,
      ideology: 'conservative',
      description: 'The Christian Democratic Union of Germany is a Christian democratic and liberal-conservative political party in Germany.',
      website: 'https://cdu.de',
      founded: 1945,
      support: 25
    },
    {
      id: 'spd',
      name: 'Social Democratic Party',
      shortName: 'SPD',
      econFreedom: -3,
      personalFreedom: 4,
      ideology: 'socialist',
      description: 'The Social Democratic Party of Germany is a social democratic political party in Germany.',
      website: 'https://spd.de',
      founded: 1863,
      support: 22
    },
    {
      id: 'fdp',
      name: 'Free Democratic Party',
      shortName: 'FDP',
      econFreedom: 8,
      personalFreedom: 6,
      ideology: 'libertarian',
      description: 'The Free Democratic Party is a liberal political party in Germany.',
      website: 'https://fdp.de',
      founded: 1948,
      support: 11
    },
    {
      id: 'green-de',
      name: 'Alliance 90/The Greens',
      shortName: 'Greens',
      econFreedom: -2,
      personalFreedom: 8,
      ideology: 'green',
      description: 'Alliance 90/The Greens is a green political party in Germany.',
      website: 'https://gruene.de',
      founded: 1980,
      support: 18
    }
  ]
};

// Mock API functions
export const fetchCountries = async (): Promise<Country[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_COUNTRIES;
};

export const fetchParties = async (countryCode: string): Promise<PoliticalParty[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_PARTIES[countryCode] || [];
};