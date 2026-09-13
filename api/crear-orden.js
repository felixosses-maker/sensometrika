const crypto = require('crypto');
const https = require('https');

const FLOW_API_KEY = '4CD0FED0-B215-4816-BBB8-1LB8FA502219';
const FLOW_SECRET_KEY = '0cf7126b008a28dd3c3538f71cda5b15a567cf09';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  try {
    const { nombrePlan, monto, email } = req.body || {};

    if (!monto || !email) {
      return res.status(400).json({ error: 'Faltan parámetros: monto y email son obligatorios.' });
    }

    const commerceOrder = 'SMK-' + Date.now();
    const baseUrl = 'https://sensometrika.vercel.app';

    // Las URLs de confirmación y retorno apuntan al intermediario serverless para evitar el error 405
    const params = {
      apiKey: FLOW_API_KEY,
      commerceOrder: commerceOrder,
      subject: `Sensometrika: ${nombrePlan || 'Plan Psicomotriz'}`,
      currency: 'CLP',
      amount: Math.round(Number(monto)),
      email: email,
      urlConfirmation: `${baseUrl}/api/pago-exitoso`,
      urlReturn: `${baseUrl}/api/pago-exitoso`
    };

    // Generar firma HMAC-SHA256 según estándar oficial de Flow
    const keys = Object.keys(params).sort();
    let toSign = '';
    keys.forEach(k => { toSign += `${k}${params[k]}`; });

    const signature = crypto.createHmac('sha256', FLOW_SECRET_KEY).update(toSign).digest('hex');

    const postData = new URLSearchParams();
    keys.forEach(k => postData.append(k, params[k]));
    postData.append('s', signature);

    const postDataString = postData.toString();

    // Petición HTTPS a la API Sandbox de Flow
    const options = {
      hostname: 'sandbox.flow.cl',
      port: 443,
      path: '/api/payment/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataString)
      }
    };

    const flowReq = https.request(options, (flowRes) => {
      let data = '';
      flowRes.on('data', (chunk) => { data += chunk; });
      flowRes.on('end', () => {
        try {
          const respuesta = JSON.parse(data);
          if (respuesta.url && respuesta.token) {
            return res.status(200).json({
              url: `${respuesta.url}?token=${respuesta.token}`
            });
          } else {
            console.error('Respuesta Flow no válida:', respuesta);
            return res.status(400).json({ error: respuesta.message || 'Error en pasarela Flow' });
          }
        } catch (e) {
          console.error('Error parseando JSON Flow:', data);
          return res.status(500).json({ error: 'Respuesta inválida de Flow' });
        }
      });
    });

    flowReq.on('error', (err) => {
      console.error('Error HTTPS con Flow:', err);
      return res.status(500).json({ error: 'Error de conexión con Flow Sandbox' });
    });

    flowReq.write(postDataString);
    flowReq.end();

  } catch (error) {
    console.error('Fallo general en backend:', error);
    return res.status(500).json({ error: 'Error interno en el servidor' });
  }
};