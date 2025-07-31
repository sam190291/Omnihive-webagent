exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body safely
    let agentId;
    try {
      const body = JSON.parse(event.body || '{}');
      agentId = body.agentId;
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    if (!agentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'agentId is required' })
      };
    }

    // Your Retell API key
    const retellApiKey = process.env.RETELL_API_KEY;
    
    if (!retellApiKey) {
      console.error('RETELL_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    console.log('Calling Retell API for agent:', agentId);

    // Call Retell API to create web call
    const retellResponse = await fetch('https://api.retellai.com/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: {
          user_id: 'web-user',
          source: 'omnihive-website'
        }
      })
    });

    console.log('Retell API response status:', retellResponse.status);

    if (!retellResponse.ok) {
      const errorText = await retellResponse.text();
      console.error('Retell API error:', retellResponse.status, errorText);
      return {
        statusCode: retellResponse.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create call with Retell',
          details: errorText,
          status: retellResponse.status
        })
      };
    }

    const callData = await retellResponse.json();
    console.log('Call created successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(callData)
    };

  } catch (error) {
    console.error('Error in function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
