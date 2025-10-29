import { fetchCountriesFromDatabase } from './databaseService.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const countries = await fetchCountriesFromDatabase();
    res.status(200).json(countries);
  } catch (error) {
    console.error('Error in /api/countries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
