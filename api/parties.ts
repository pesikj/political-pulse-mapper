import { fetchPartiesFromDatabase } from './databaseService.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const country = req.query?.country as string | undefined;
  if (!country) {
    res.status(400).json({ error: 'Missing required query parameter "country"' });
    return;
  }

  try {
    const parties = await fetchPartiesFromDatabase(country);
    res.status(200).json(parties);
  } catch (error) {
    console.error('Error in /api/parties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
