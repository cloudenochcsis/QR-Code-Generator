import type { NextApiRequest, NextApiResponse } from 'next';

type HealthData = {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthData>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const uptime = process.uptime();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime: uptime,
  });
}
