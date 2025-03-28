import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;
    const projectId = 'calmify-2a2a5';
    const location = 'global';
    const agentId = 'cff67e20-41cc-4c80-a8ec-1fe5603c94aa';

    // Get service account credentials from environment variable
    const apiKey = process.env.EXPO_PUBLIC_DIALOGFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('Dialogflow API key is not configured');
    }

    const credentials = JSON.parse(apiKey);

    // Create JWT token with proper signing
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
        sub: credentials.client_email
      },
      credentials.private_key.replace(/\\n/g, '\n'),
      {
        algorithm: 'RS256',
        keyid: credentials.private_key_id
      }
    );

    // Get access token using OAuth2
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => null);
      console.error('Token Error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
      });
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Send message to Dialogflow
    const response = await fetch(
      `https://${location}-dialogflow.googleapis.com/v3/projects/${projectId}/locations/${location}/agents/${agentId}/sessions/${sessionId}:detectIntent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          queryInput: {
            text: {
              text: message,
            },
            languageCode: 'en-US'
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Dialogflow API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in Dialogflow API:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
} 