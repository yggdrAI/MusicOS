import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { taskId } = req.query;
  if (!taskId || typeof taskId !== 'string') return res.status(400).json({ detail: 'Missing taskId' });
  try {
    const apiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Try all backend services for status (audio, ml, nlp)
    const urls = [
      `${apiUrl}/status/${taskId}`,
      `${apiUrl}/analyze/status/${taskId}`,
      `${apiUrl}/lyrics/status/${taskId}`
    ];
    let response;
    for (const url of urls) {
      try {
        response = await axios.get(url);
        if (response.status === 200) break;
      } catch {}
    }
    if (!response) throw new Error('Status not found');
    res.status(200).json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ detail: err.response?.data?.detail || 'Status fetch failed' });
  }
}
