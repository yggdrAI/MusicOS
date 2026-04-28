import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    // Forward the file to the API Gateway
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const authHeader = req.headers['authorization'] || '';
    const response = await axios.post(`${apiUrl}/upload`, req, {
      headers: {
        ...req.headers,
        Authorization: authHeader,
      },
    });
    res.status(200).json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ detail: err.response?.data?.detail || 'Upload failed' });
  }
}
