const crypto = require('crypto');

// Credenciales oficiales Flow Sandbox
const FLOW_API_KEY = '4CD0FED0-B215-4816-BBB8-1LB8FA502219';
const FLOW_SECRET_KEY = '0cf7126b008a28dd3c3538f71cda5b15a567cf09';
const FLOW_URL = 'https://sandbox.flow.cl/api';

module.exports = async (req, res) => {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  try {
    const { planId, nombrePlan, monto, email, rut, nombre, empresa, rol, modulosPermitidos, intentos } = req.body;

    if (!monto || !email || !nombrePlan) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios de la orden.' });
    }

    // Identificador único de orden para el comercio
    const commerceOrder = 'SMK-' + Date.now();

    // Determinar dominio base dinámicamente
    const host = req.headers.host || 'sensometrika.vercel.app';
    const protocolo = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocolo}://${host}`;

    // Parámetros obligatorios exigidos por la API de Flow
    const params = {
      apiKey: FLOW_API_KEY,
      commerceOrder: commerceOrder,
      subject: `Sensometrika: ${nombrePlan}`,
      currency: 'CLP',
      amount: Math.round(Number(monto)),
      email: email,
      urlConfirmation: `${baseUrl}/pago-resultado.html`,
      urlReturn: `${baseUrl}/pago-resultado.html`
    };

    // Firma HMAC-SHA256 según el estándar oficial de Flow
    const keys = Object.keys(params).sort();
    let toSign = '';
    keys.forEach(key => {
      toSign += `${key}${params[key]}`;
    });

    const signature = crypto.createHmac('sha256', FLOW_SECRET_KEY).update(toSign).digest('hex');

    // Construcción del payload URL Encoded
    const bodyFormData = new URLSearchParams();
    keys.forEach(key => bodyFormData.append(key, params[key]));
    bodyFormData.append('s', signature);

    // Llamada HTTP al servicio Sandbox de Flow
    const respuestaFlow = await fetch(`${FLOW_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyFormData.toString()
    });

    const resultado = await respuestaFlow.json();

    if (!respuestaFlow.ok || !resultado.url) {
      console.error('Fallo en respuesta Flow:', resultado);
      return res.status(400).json({ error: resultado.message || 'Error al comunicarse con Flow.' });
    }

    // Retorno de la URL directa a Webpay Plus
    return res.status(200).json({
      url: `${resultado.url}?token=${resultado.token}`,
      flowToken: resultado.token,
      commerceOrder: commerceOrder
    });

  } catch (error) {
    console.error('Excepción al crear orden:', error);
    return res.status(500).json({ error: 'Fallo interno en el servidor de pagos.' });
  }
};