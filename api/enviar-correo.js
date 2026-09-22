/**
 * Sensometrika - Servicio Serverless de Despacho de Correos (Resend API)
 */
module.exports = async (req, res) => {
  // Encabezados CORS
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

  // Lectura segura de la API Key desde las variables de entorno de Vercel
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY no está configurada en las variables de entorno.');
    return res.status(500).json({ error: 'Falta configurar RESEND_API_KEY en el servidor.' });
  }

  try {
    const { tipo, email, nombre, enlace, detalles } = req.body;

    if (!email || !enlace) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios: email y enlace.' });
    }

    const destinatarioNombre = nombre || (tipo === 'b2b' ? 'Supervisión Técnica' : 'Postulante');
    let asunto = '';
    let htmlContent = '';

    if (tipo === 'b2b') {
      // -------------------------------------------------------------
      // PLANTILLA B2B: EMPRESA / SUPERVISOR / APR
      // -------------------------------------------------------------
      const razonSocial = (detalles && detalles.razonSocial) ? detalles.razonSocial : 'Empresa Cliente';
      const rutEmpresa = (detalles && detalles.rutEmpresa) ? detalles.rutEmpresa : '--';
      const cupos = (detalles && detalles.cupos) ? detalles.cupos : '1';

      asunto = `Acceso Corporativo Activo: Evaluaciones Sensométricas — ${razonSocial}`;
      htmlContent = `
        <div style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px;">
          <div style="max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            
            <!-- Cabecera Oficial -->
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background: #070d18;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">SENSOMETRIKA <span style="color: #38bdf8; font-size: 14px;">SpA</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Gabinete Sensotécnico Laboral • D.S. Nº 170 MTT</p>
            </div>

            <!-- Contenido -->
            <div style="padding: 28px 24px;">
              <span style="display: inline-block; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 20px; color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                Plan Corporativo Activado
              </span>
              
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">Estimado(a) ${destinatarioNombre}:</h2>
              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
                Confirmamos la habilitación del pack de evaluaciones para <strong style="color: #ffffff;">${razonSocial}</strong> (RUT: ${rutEmpresa}) con un total de <strong>${cupos} evaluación(es)</strong> asignada(s).
              </p>

              <!-- Tarjeta de Enlace -->
              <div style="background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 14px 0; font-weight: 600;">
                  Enlace directo para distribución a trabajadores (WhatsApp / Correo):
                </p>
                <a href="${enlace}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 26px; border-radius: 10px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
                  Acceder a la Evaluación Faena →
                </a>
                <p style="font-size: 10.5px; color: #64748b; margin: 12px 0 0 0; word-break: break-all;">
                  ${enlace}
                </p>
              </div>

              <!-- Instructivo Técnico -->
              <div style="background: #090e1a; border-radius: 10px; padding: 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #38bdf8; display: block; margin-bottom: 6px;">📋 Protocolo de Rendición:</strong>
                • Cada trabajador ingresa con la razón social precargada y bloqueada.<br>
                • Debe estampar su firma digital y registrar su RUT antes de iniciar.<br>
                • Los informes aprobados bajo estándar D.S. N° 170 serán despachados automáticamente a esta casilla.
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background: #070d18; font-size: 10px; color: #64748b;">
              Sensometrika SpA • Plataforma de Certificación Laboral y Psicotécnica Automatizada<br>
              Chillán, Región de Ñuble, Chile.
            </div>

          </div>
        </div>
      `;
    } else {
      // -------------------------------------------------------------
      // PLANTILLA B2C: PARTICULAR (ENSAYO / PASE INTENSIVO)
      // -------------------------------------------------------------
      const nombrePlan = (detalles && detalles.nombrePlan) ? detalles.nombrePlan : 'Pase Psicomotriz';
      const vigencia = (detalles && detalles.vigencia) ? detalles.vigencia : 'Vigencia activa';

      asunto = `Tu Enlace de Acceso: Evaluación Psicotécnica — Sensometrika`;
      htmlContent = `
        <div style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px;">
          <div style="max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            
            <!-- Cabecera Oficial -->
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background: #070d18;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">SENSOMETRIKA <span style="color: #38bdf8; font-size: 14px;">SpA</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Gabinete Sensotécnico Laboral • D.S. Nº 170 MTT</p>
            </div>

            <!-- Contenido -->
            <div style="padding: 28px 24px;">
              <span style="display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                Acceso Habilitado
              </span>
              
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">¡Hola, ${destinatarioNombre}!</h2>
              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
                Tu acceso para <strong style="color: #ffffff;">${nombrePlan}</strong> ha sido activado exitosamente (${vigencia}). Ya puedes ingresar al simulador para preparar tu examen psicotécnico de licencia de conducir o faena laboral.
              </p>

              <!-- Botón Principal -->
              <div style="background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <a href="${enlace}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
                  Comenzar Evaluación Ahora →
                </a>
                <p style="font-size: 11px; color: #64748b; margin: 14px 0 0 0; word-break: break-all;">
                  Si el botón no abre, copia y pega este enlace en tu navegador:<br>
                  <span style="color: #38bdf8;">${enlace}</span>
                </p>
              </div>

              <!-- Recomendaciones Técnicas -->
              <div style="background: #090e1a; border-radius: 10px; padding: 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #38bdf8; display: block; margin-bottom: 6px;">💡 Recomendaciones Técnicas:</strong>
                • Rendir en un lugar iluminado y libre de distracciones.<br>
                • Utiliza teclado físico (barra espaciadora) o pantalla táctil calibrada.<br>
                • Realiza siempre la fase de calibración demo antes de iniciar cada simulación oficial.
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background: #070d18; font-size: 10px; color: #64748b;">
              Sensometrika SpA • Plataforma de Certificación Laboral y Psicotécnica Automatizada<br>
              Chillán, Región de Ñuble, Chile.
            </div>

          </div>
        </div>
      `;
    }

    // Remitente de prueba en Resend Sandbox
    const remitente = process.env.EMAIL_FROM || 'Sensometrika <onboarding@resend.dev>';

    // Llamada HTTPS directa a Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: remitente,
        to: [email],
        subject: asunto,
        html: htmlContent
      })
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Error desde Resend:', data);
      return res.status(resendResponse.status).json({
        success: false,
        error: data.message || 'Error al enviar correo mediante Resend.'
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      destinatario: email
    });

  } catch (error) {
    console.error('Excepción al despachar correo:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor.' });
  }
};