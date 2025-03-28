// Test function to verify Dialogflow connection
export async function testDialogflowConnection() {
  try {
    console.log('Testing Dialogflow connection...');
    const testMessage = "Hello, how are you?";
    const sessionId = Date.now().toString();
    
    const response = await sendMessageToDialogflow(testMessage, sessionId);
    console.log('Test successful! Response:', response);
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

function base64Encode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64Decode(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

function createJWT(credentials: any): string {
  // Create header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id
  };

  // Create payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
    sub: credentials.client_email
  };

  // Encode header and payload
  const headerEncoded = base64Encode(JSON.stringify(header));
  const payloadEncoded = base64Encode(JSON.stringify(payload));

  // Create signature
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  const privateKey = credentials.private_key.replace(/\\n/g, '\n');
  
  // For now, we'll use the private key as the signature
  // In a production environment, you should use a proper RSA signing implementation
  const signature = base64Encode(privateKey);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export async function sendMessageToDialogflow(message: string, sessionId: string) {
  try {
    const projectId = 'calmify-mental-health-ass-nuaa';
    const location = 'global';
    
    console.log('Sending request to Dialogflow:', {
      projectId,
      location,
      sessionId,
      messageLength: message.length,
    });

    const apiKey = process.env.EXPO_PUBLIC_DIALOGFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('Dialogflow API key is not configured. Please check your .env file.');
    }

    // Parse the service account credentials
    const credentials = JSON.parse(apiKey);
    
    // Create JWT token
    const jwt = createJWT(credentials);

    // Get access token using OAuth2
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
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
    console.log('Got access token successfully');

    // Send message to Dialogflow with exact request format from curl
    const response = await fetch(
      `https://dialogflow.googleapis.com/v2beta1/projects/${projectId}/locations/${location}/agent/sessions/${sessionId}:detectIntent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          queryInput: {
            text: {
              text: message,
              languageCode: 'en'
            }
          },
          queryParams: {
            source: 'DIALOGFLOW_CONSOLE',
            timeZone: 'Asia/Calcutta'
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Dialogflow API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        headers: {
          contentType: response.headers.get('content-type'),
          authorization: 'Bearer [REDACTED]'
        }
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your API key configuration.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please verify your service account permissions.');
      } else if (response.status === 404) {
        throw new Error(`Agent not found. Please verify project ID: ${projectId}`);
      } else {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('Dialogflow response:', {
      hasResponse: !!data.queryResult?.responseMessages?.[0]?.text?.text?.[0],
      fulfillmentText: data.queryResult?.fulfillmentText,
    });

    return data.queryResult?.responseMessages?.[0]?.text?.text?.[0] || 
           data.queryResult?.fulfillmentText || 
           'I apologize, but I am unable to process your request at the moment.';
  } catch (error) {
    console.error('Error in Dialogflow API:', error);
    throw error;
  }
}