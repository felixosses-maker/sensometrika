// api/enviar-correo.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  const { tipo, emailDestino, nombreTrabajador, rutTrabajador, dictamen, linkAcceso, empresa, planNombre, monto } = req.body;

  if (!emailDestino) {
    return res.status(400).json({ error: 'Falta el correo de destino obligatorio.' });
  }

  let asunto = '';
  let htmlBody = '';

  // -------------------------------------------------------------
  // PLANTILLA 1: CORREO B2C (CONFIRMACIÓN DE PAGO Y ENLACE)
  // -------------------------------------------------------------
  if (tipo === 'b2c_pago') {
    asunto = `[SENSOMETRIKA] Confirmación de Compra - ${planNombre || 'Plan Psicotécnico'}`;
    htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070d18; color: #f8fafc; margin: 0; padding: 20px; }
          .card { background-color: #0b1324; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; max-width: 520px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }
          .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.85rem; }
          .info-table td { padding: 8px 0; border-bottom: 1px solid #1a2638; color: #cbd5e1; }
          .info-table td.label { color: #94a3b8; font-weight: 600; width: 40%; }
          .btn { display: block; width: 100%; background-color: #10b981; color: #ffffff !important; text-align: center; padding: 14px 0; border-radius: 8px; font-weight: 800; text-decoration: none; margin-top: 20px; text-transform: uppercase; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
          .footer { font-size: 0.7rem; color: #64748b; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="color: #38bdf8; margin: 0; font-size: 1.2rem;">SENSOMETRIKA SpA</h2>
            <p style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">COMPROBANTE DE COMPRA Y ACCESO A SIMULACIONES</p>
          </div>

          <p style="font-size: 0.9rem; line-height: 1.5;">¡Gracias por tu compra! Tu pago se ha procesado con éxito. Ya tienes acceso a tu plataforma de entrenamiento psicosensométrico.</p>

          <table class="info-table">
            <tr><td class="label">Plan Contratado:</td><td><strong style="color:#38bdf8;">${planNombre || 'Evaluación Psicomotriz DS 170'}</strong></td></tr>
            <tr><td class="label">Monto Pagado:</td><td><strong>$${monto || '9.900'} CLP</strong></td></tr>
            <tr><td class="label">Estado Transacción:</td><td><span class="badge">PAGO APROBADO</span></td></tr>
            <tr><td class="label">RUT Registrado:</td><td><strong>${rutTrabajador || 'S/RUT'}</strong></td></tr>
          </table>

          <a href="${linkAcceso}" target="_blank" class="btn">🚀 INICIAR SIMULACIONES PSICOTÉCNICAS</a>

          <div class="footer">
            <p>Puedes guardar este correo como comprobante. Tu enlace directo mantendrá tus intentos asignados.</p>
            <p>© SENSOMETRIKA SpA • Chile</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } 
  // -------------------------------------------------------------
  // PLANTILLA 2: CORREO B2B (INFORME PERICIAL CONSOLIDADO)
  // -------------------------------------------------------------
  else {
    asunto = `[Certificado Pericial] ${nombreTrabajador || 'Evaluado'} - RUT ${rutTrabajador || 'S/RUT'}`;
    htmlBody = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070d18; color: #f8fafc; margin: 0; padding: 20px; }
          .card { background-color: #0b1324; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; max-width: 520px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 6px 16px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.5px; text-transform: uppercase; }
          .aprobado { background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }
          .reprobado { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; }
          .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.85rem; }
          .info-table td { padding: 8px 0; border-bottom: 1px solid #1a2638; color: #cbd5e1; }
          .info-table td.label { color: #94a3b8; font-weight: 600; width: 40%; }
          .btn { display: block; width: 100%; background-color: #0284c7; color: #ffffff !important; text-align: center; padding: 14px 0; border-radius: 8px; font-weight: 800; text-decoration: none; margin-top: 20px; text-transform: uppercase; font-size: 0.9rem; }
          .footer { font-size: 0.7rem; color: #64748b; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="color: #38bdf8; margin: 0; font-size: 1.2rem;">SENSOMETRIKA SpA</h2>
            <p style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">SISTEMA DE EVALUACIÓN PSICOSENSOMÉTRICA PERICIAL</p>
          </div>

          <p style="font-size: 0.9rem; line-height: 1.5;">Se ha emitido un nuevo informe de evaluación psicosensométrica telemétrica bajo estándar D.S. N° 170 MTT y CORMA.</p>

          <table class="info-table">
            <tr><td class="label">Trabajador Evaluado:</td><td><strong>${nombreTrabajador || 'S/N'}</strong></td></tr>
            <tr><td class="label">RUT / ID:</td><td><strong>${rutTrabajador || 'S/RUT'}</strong></td></tr>
            <tr><td class="label">Empresa / Faena:</td><td><strong>${empresa || 'Particular'}</strong></td></tr>
            <tr><td class="label">Dictamen Pericial:</td>
              <td>
                <span class="badge ${dictamen && dictamen.includes('APTO') && !dictamen.includes('NO') ? 'aprobado' : 'reprobado'}">${dictamen || 'EVALUACIÓN'}</span>
              </td>
            </tr>
          </table>

          <a href="${linkAcceso}" target="_blank" class="btn">📄 VER Y DESCARGAR CERTIFICADO DIGITAL</a>

          <div class="footer">
            <p>Validez legal telemétrica comprobada mediante Hash de inmutabilidad.</p>
            <p>© SENSOMETRIKA SpA • Chile</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.log('Simulación de envío de correo:', { tipo, emailDestino, linkAcceso });
      return res.status(200).json({ success: true, message: 'Correo simulado (sin RESEND_API_KEY).' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Sensometrika <notificaciones@sensometrika.cl>',
        to: [emailDestino],
        subject: asunto,
        html: htmlBody
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno en el servidor de correo', details: error.message });
  }
}