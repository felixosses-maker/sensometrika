/**
 * Sensometrika - Servicio Serverless de Despacho de Correos (Resend API)
 * Archivo: api/enviar-correo.js
 */
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Falta RESEND_API_KEY' });

  let rawUrl = process.env.FRONTEND_URL || 'https://www.sensometrika.com';
  let cleanDomain = 'https://www.sensometrika.com';
  const matchUrl = rawUrl.match(/https?:\/\/[^\s\]\)\'\"\/]+/);
  if (matchUrl) cleanDomain = matchUrl[0];

  try {
    let { tipo, email, emailDestino, nombreApr, empresa, enlace, linkAcceso, plan } = req.body || {};

    const correoFinal = emailDestino || email || 'notificaciones@sensometrika.com';
    const razonSocial = empresa || 'Empresa Mandante';
    const nombreAprPersona = nombreApr || 'Prevención de Riesgos';
    
    const originUrl = cleanDomain;
    let enlaceFinal = enlace || linkAcceso || `${originUrl}/demo_empresa.html?empresa=${encodeURIComponent(razonSocial)}`;

    let asunto = '';
    let htmlContent = '';

    // ==========================================
    // 1. CONDICIÓN B2B PRIORITARIA (OBLIGATORIA)
    // ==========================================
    if (tipo === 'b2b') {
      asunto = `Evaluación psicotécnica D.S. N° 170 ágil y 100% digital — ${razonSocial}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px; margin:0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #070d18;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">SENSOMETRIKA <span style="color: #8b5cf6; font-size: 14px;">SpA</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Plataforma de Calibración & Evaluación Psicosométrica • D.S. Nº 170 MTT</p>
            </div>
            <div style="padding: 28px 24px; background-color: #0f172a;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 20px; color: #a78bfa; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                Presentación Comercial B2B
              </span>
              
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">Estimado/a ${nombreAprPersona},</h2>
              
              <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 14px 0;">
                Junto con saludarle cordialmente, le escribimos desde <strong>Sensometrika SpA</strong>. Sabemos lo crucial y exigente que es mantener los estándares de seguridad y cumplimiento normativo (D.S. N° 170) en las operaciones de su empresa <strong style="color: #ffffff;">${razonSocial}</strong>.
              </p>

              <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
                Por eso, hemos desarrollado una plataforma moderna, rápida y 100% digital que simplifica por completo la evaluación sensométrica y psicotécnica de sus trabajadores y conductores.
              </p>

              <div style="background-color: #0b1320; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 20px; text-align: left;">
                <div style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-bottom: 8px;">¿Qué nos hace diferentes?</div>
                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 4px;">• <strong>Resultados en tiempo real:</strong> Cero esperas, informes listos de inmediato.</div>
                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 4px;">• <strong>Acceso multidispositivo:</strong> Ágil, intuitivo y sin instalaciones complejas.</div>
                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">• <strong>Cumplimiento normativo:</strong> Diseñado a la medida de la exigencia industrial.</div>
              </div>

              <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 14px 0; font-weight: 600;">
                  Lo invitamos a explorar nuestra vitrina interactiva y probar la dinámica de nuestros módulos periciales:
                </p>
                <a href="${enlaceFinal}" target="_blank" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 26px; border-radius: 10px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                  Explorar Vitrina Demo B2B →
                </a>
                <p style="font-size: 11px; color: #94a3b8; margin: 14px 0 0 0; word-break: break-all;">
                  Si el botón no abre, haz clic directo en este enlace seguro:<br>
                  <a href="${enlaceFinal}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${enlaceFinal}</a>
                </p>
              </div>

              <p style="font-size: 13px; color: #cbd5e1; margin: 0 0 10px 0;">
                Quedamos a su entera disposición para coordinar una breve demostración personalizada o resolver cualquier duda.
              </p>
              <p style="font-size: 13px; color: #ffffff; font-weight: bold; margin: 0;">
                Atentamente,<br>
                Equipo Sensometrika<br>
                <span style="font-weight: normal; color: #94a3b8; font-size: 11px;">Plataforma de Calibración & Evaluación Psicosométrica • www.sensometrika.com</span>
              </p>
            </div>
            <div style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background-color: #070d18; font-size: 10px; color: #64748b;">
              Sensometrika SpA • Chile • contacto@sensometrika.com
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // 2. PLANTILLA B2C POR DEFECTO
      asunto = `Tu Enlace de Acceso: Evaluación Psicotécnica — Sensometrika`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background-color: #0b0f19; font-family: sans-serif; color: #ffffff; padding: 30px;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #38bdf8; border-radius: 16px; padding: 24px; text-align: center;">
            <h2>¡Hola, ${nombreAprPersona}!</h2>
            <p>Tu acceso ha sido activado exitosamente.</p>
            <a href="${enlaceFinal}" style="background-color: #0284c7; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 15px;">Comenzar Evaluación →</a>
          </div>
        </body>
        </html>
      `;
    }

    const remitente = process.env.EMAIL_FROM || 'Sensometrika <notificaciones@sensometrika.com>';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: remitente,
        to: [correoFinal],
        subject: asunto,
        html: htmlContent
      })
    });

    const data = await resendResponse.json();
    if (!resendResponse.ok) return res.status(resendResponse.status).json({ success: false, error: data.message });

    return res.status(200).json({ success: true, id: data.id });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};