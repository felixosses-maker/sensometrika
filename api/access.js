const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // Encabezados CORS
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
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { action, token, type, email, metadata, duration_minutes } = req.body || {};

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Variables de entorno de Supabase no configuradas en Vercel'
    });
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // ACCIÓN 1: GENERAR LINK
    if (action === 'create') {
      const generatedToken = crypto.randomUUID();
      const minutes = type === 'demo' ? (duration_minutes || 10) : (duration_minutes || 2880);
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      const response = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          token: generatedToken,
          type: type || 'b2c',
          email: email || null,
          metadata: metadata || {},
          expires_at: expiresAt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al insertar token en Supabase');
      }

      const baseUrl = process.env.FRONTEND_URL || 'https://sensometrika.vercel.app';
      const path = type === 'demo' ? '/demo.html' : '/evaluacion.html';
      const link = `${baseUrl}${path}?token=${generatedToken}`;

      return res.status(200).json({
        success: true,
        link,
        token: generatedToken,
        type: type || 'b2c',
        expires_at: expiresAt
      });
    }

    // ACCIÓN 2: VALIDAR Y CONSUMIR TOKEN
    if (action === 'validate') {
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token requerido' });
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_access_token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_token: token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al ejecutar RPC en Supabase');
      }

      if (!data.success) {
        return res.status(403).json(data);
      }

      return res.status(200).json(data);
    }

    return res.status(400).json({ success: false, error: 'Acción no válida' });

  } catch (error) {
    console.error('Error en api/access:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};