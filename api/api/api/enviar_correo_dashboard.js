/**
 * Sensometrika - Servicio Serverless Exclusivo para Dashboard (Campaña y Correos B2B)
 * Archivo: api/enviar_correo_dashboard.js
 */
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        return res.status(500).json({ error: 'Falta configurar RESEND_API_KEY en el servidor.' });
    }

    try {
        const { emailDestino, nombreApr, empresa, enlace, plan } = req.body || {};

        if (!emailDestino || !empresa) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (email o empresa).' });
        }

        const asunto = `Invitación Oficial • Evaluación Psicosensométrica B2B (D.S. N° 170) - ${empresa}`;
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px; margin:0;">
              <div style="max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; overflow: hidden;">
                <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background: #070d18;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff;">SENSOMETRIKA <span style="color: #38bdf8; font-size: 14px;">B2B</span></h1>
                </div>
                <div style="padding: 28px 24px;">
                  <h2 style="font-size: 18px; color: #ffffff;">Estimado/a ${nombreApr || 'Prevencionista'},</h2>
                  <p style="font-size: 13px; color: #94a3b8;">
                    Junto con saludar cordialmente, le invitamos a probar la vitrina de demostración bajo cumplimiento <strong>D.S. N° 170</strong> para su empresa <strong>${empresa}</strong> (Plan: <em>${plan || 'PLUS'}</em>).
                  </p>
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${enlace}" target="_blank" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 900; padding: 13px 28px; border-radius: 10px;">
                      🚀 Acceder a la Vitrina Demo B2B →
                    </a>
                  </div>
                </div>
              </div>
            </body>
            </html>
        `;

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'Sensometrika <notificaciones@sensometrika.com>',
                to: [emailDestino],
                bcc: ['contacto@sensometrika.com'],
                subject: asunto,
                html: htmlContent
            })
        });

        const data = await resendResponse.json();
        if (!resendResponse.ok) {
            return res.status(resendResponse.status).json({ success: false, error: data.message || 'Error en Resend.' });
        }

        return res.status(200).json({ success: true, id: data.id, destinatario: emailDestino });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};