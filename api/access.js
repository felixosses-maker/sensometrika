const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Inicialización del cliente Supabase con privilegios de backend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // Configuración de encabezados CORS para peticiones desde el frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Respuesta preflight para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Restricción a método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { action, token, type, email, metadata, duration_minutes } = req.body || {};

  try {
    // -------------------------------------------------------------
    // ACCIÓN 1: GENERAR LINK (B2C, B2B o Demo 10 min)
    // -------------------------------------------------------------
    if (action === 'create') {
      const generatedToken = crypto.randomUUID();
      
      // Duración: 10 min para demo, o el valor indicado (default 48 horas = 2880 min)
      const minutes = type === 'demo' ? (duration_minutes || 10) : (duration_minutes || 2880);
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('access_tokens')
        .insert({
          token: generatedToken,
          type: type || 'b2c',
          email: email || null,
          metadata: metadata || {},
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      const baseUrl = process.env.FRONTEND_URL || 'https://sensometrika.vercel.app';
      const path = type === 'demo' ? '/demo.html' : '/evaluacion.html';
      const link = `${baseUrl}${path}?token=${generatedToken}`;

      return res.status(200).json({
        success: true,
        link,
        token: generatedToken,
        type: data.type,
        expires_at: expiresAt,
      });
    }

    // -------------------------------------------------------------
    // ACCIÓN 2: VALIDAR Y QUEMAR EL TOKEN AL INGRESAR
    // -------------------------------------------------------------
    if (action === 'validate') {
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token requerido' });
      }

      // Consumo seguro y atómico mediante la función RPC en Supabase
      const { data, error } = await supabase.rpc('consume_access_token', {
        p_token: token,
      });

      if (error) throw error;

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