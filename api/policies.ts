import { fetchPartyPoliciesFromDatabase } from './databaseService.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const partyId = req.query?.partyId as string | undefined;
  if (!partyId) {
    res.status(400).json({ error: 'Missing required query parameter "partyId"' });
    return;
  }

  try {
    const policies = await fetchPartyPoliciesFromDatabase(partyId);
    res.status(200).json(policies);
  } catch (error) {
    console.error('Error in /api/policies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
