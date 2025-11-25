const axios = require('axios');

exports.handler = async (event) => {
  console.log('🚀 Function started');
  
  // CORS handling
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔧 CORS preflight');
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
    console.log('❌ Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('📨 Received data:', JSON.stringify(body, null, 2));
    
    // DIRECT APPROACH - No async polling
    console.log('🔄 Calling Hugging Face API directly...');
    
    const response = await axios.post(
      'https://syedalaibarehman-integrate.hf.space/gradio_api/call/predict_fn',
      {
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
        ]
      },
      { 
        timeout: 8000, // 8 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Function/1.0'
        }
      }
    );

    console.log('✅ API Response received:', JSON.stringify(response.data, null, 2));

    // If it returns event_id, that's fine - we'll return it
    if (response.data.event_id) {
      console.log('📝 Async response - event_id:', response.data.event_id);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          event_id: response.data.event_id,
          message: 'Prediction submitted successfully. Use event_id to check status.',
          note: 'This is a direct response from Hugging Face API'
        })
      };
    } else {
      // Direct prediction result
      console.log('🎯 Direct prediction result');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          prediction: response.data,
          source: 'direct-api'
        })
      };
    }
    
  } catch (error) {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });

    // Detailed error response
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        code: error.code,
        status: error.response?.status,
        response_data: error.response?.data,
        note: 'Check Netlify function logs for detailed error information'
      })
    };
  }
};
