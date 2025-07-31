exports.handler = async (event, context) => {
  console.log('Function called!', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      message: 'Function working!',
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    })
  };
};
