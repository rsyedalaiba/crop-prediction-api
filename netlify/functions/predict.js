const axios = require('axios');

exports.handler = async (event) => {
  // CORS handle karna
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('Received data:', body);
    
    // Gradio API ko call karenge
    const submitResponse = await axios.post(
      'https://syedalaibarehman-integrate.hf.space/gradio_api/queue/push',
      {
        fn_index: 0,
        data: [
          body.province,
          body.district, 
          body.crop_type,
          body.soil_type,
          body.sowing_date,
          body.harvest_date,
          parseFloat(body.area),
          parseInt(body.year),
          parseFloat(body.temperature),
          parseFloat(body.rainfall),
          parseFloat(body.nitrogen),
          parseFloat(body.phosphorus),
          parseFloat(body.potassium),
          parseFloat(body.soil_ph),
          parseFloat(body.ndvi)
        ],
        session_hash: Math.random().toString(36).substring(2)
      }
    );

    const hash = submitResponse.data.hash;
    console.log('Prediction submitted, hash:', hash);

    // Result ka wait karenge
    const result = await pollForResult(hash);
    console.log('Prediction result:', result);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        prediction: result 
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};

// Polling function
async function pollForResult(hash, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await axios.get(
        `https://syedalaibarehman-integrate.hf.space/gradio_api/queue/status?hash=${hash}`
      );
      
      const status = statusResponse.data;
      console.log(`Polling attempt ${attempt + 1}:`, status.status);
      
      if (status.status === 'COMPLETED') {
        return status.data?.data?.[0];
      } else if (status.status === 'FAILED') {
        throw new Error('Prediction job failed');
      }
      
      // 1 second wait
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }
  throw new Error('Prediction timeout - took too long');
}
