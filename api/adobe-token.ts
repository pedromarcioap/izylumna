import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed', 
      message: 'Only POST requests are allowed.' 
    });
  }

  try {
    const { code, redirect_uri } = req.body || {};

    if (!code) {
      return res.status(400).json({ 
        error: 'Missing Code', 
        message: 'Authorization code is required.' 
      });
    }

    const clientId = process.env.VITE_ADOBE_CLIENT_ID || process.env.ADOBE_CLIENT_ID || '';
    const clientSecret = process.env.ADOBE_CLIENT_SECRET || process.env.VITE_ADOBE_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      console.error('[Adobe Token Serverless] Missing configuration:', {
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret)
      });
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'ADOBE_CLIENT_ID or ADOBE_CLIENT_SECRET is missing in server environment variables.'
      });
    }

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirect_uri || ''
    });

    const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Adobe Token Serverless] Adobe IMS Error:', data);
      return res.status(response.status).json({
        error: data.error || 'adobe_ims_error',
        error_description: data.error_description || 'Failed to exchange authorization code with Adobe IMS.',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Adobe Token Serverless] Server exception:', err);
    return res.status(500).json({
      error: 'internal_server_error',
      message: err.message || 'An unexpected server error occurred during token exchange.'
    });
  }
}
