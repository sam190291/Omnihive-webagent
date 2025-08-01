// netlify/functions/create-web-call.js
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
    // Parse request body
    const { agentId } = JSON.parse(event.body || '{}');

    if (!agentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'agentId is required' })
      };
    }

    // Your Retell API key (set this in Netlify environment variables)
    const retellApiKey = process.env.RETELL_API_KEY;
    
    if (!retellApiKey) {
      console.error('RETELL_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    console.log('Creating web call for agent:', agentId);

    // Call Retell API V2 to create web call (using correct format)
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_version: 1,
        metadata: {
          user_id: 'web-user',
          source: 'omnihive-website'
        },
        retell_llm_dynamic_variables: {}
      })
    });

    console.log('Retell API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Retell API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create call',
          details: errorText,
          retell_status: response.status
        })
      };
    }

    const callData = await response.json();
    console.log('Web call created successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(callData)
    };

  } catch (error) {
    console.error('Error creating call:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
