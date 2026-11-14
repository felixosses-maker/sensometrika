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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  const body = req.body || {};
  const {
    tipo = 'b2b_dictamen',
    emailDestino,
    email,
    nombre,
    nombreEncargado,
    nombreTrabajador,
    rutTrabajador,
    cargo,
    empresa,
    planNombre,
    folios,
    monto,
    dictamen,
    dictamenGlobal,
    linkAcceso,
    linkInforme,
    enlace
  } = body;

  const correoFinal = (emailDestino || email || '').trim();
  if (!correoFinal) {
    return res.status(400).json({ error: 'Falta el correo de destino obligatorio (emailDestino).' });
  }

  const baseUrl = (process.env.FRONTEND_URL || 'https://sensometrika.com').replace(/\/$/, '');
  const urlFinal = (linkAcceso || linkInforme || enlace || baseUrl).trim();
  const veredictoTexto = (dictamenGlobal || dictamen || 'EVALUACIÓN REGISTRADA').toUpperCase();
  const esAprobado =
    (veredictoTexto.includes('APROBADO') || veredictoTexto.includes('APTO')) &&
    !veredictoTexto.includes('NO ') &&
    !veredictoTexto.includes('REPROBADO') &&
    !veredictoTexto.includes('OBSERVADO');

  // Helper de layout corporativo unificado Sensometrika
  const renderLayout = ({ subtitulo, introHtml, filasHtml, ctaTexto, ctaColor, notaPie }) => `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 24px 12px;">
      <div style="background-color: #091122; border: 1px solid #1e293b; border-radius: 16px; padding: 26px; max-width: 540px; margin: 0 auto; box-shadow: 0 18px 40px rgba(0,0,0,0.65);">
        <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #00e5ff; margin: 0; font-size: 1.25rem; letter-spacing: 0.12em;">SENSOMETRIKA</h2>
          <p style="font-size: 0.72rem; color: #94a3b8; margin: 5px 0 0 0; letter-spacing: 0.06em; text-transform: uppercase;">${subtitulo}</p>
        </div>

        <div style="font-size: 0.9rem; line-height: 1.55; color: #e2e8f0; margin-bottom: 18px;">
          ${introHtml}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.85rem;">
          ${filasHtml}
        </table>

        <div style="margin-top: 22px; text-align: center;">
          <a href="${urlFinal}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; background-color: ${ctaColor}; color: #ffffff !important; text-align: center; padding: 14px 18px; border-radius: 10px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 0.86rem; letter-spacing: 0.04em;">
            ${ctaTexto}
          </a>
          <p style="font-size: 0.72rem; color: #64748b; margin-top: 12px; word-break: break-all;">
            Enlace directo:<br>
            <a href="${urlFinal}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${urlFinal}</a>
          </p>
        </div>

        <div style="font-size: 0.72rem; color: #64748b; text-align: center; margin-top: 22px; padding-top: 14px; border-top: 1px solid #1e293b;">
          <p style="margin: 0 0 4px 0;">${notaPie}</p>
          <p style="margin: 0;">© SENSOMETRIKA SpA • Chile • contacto@sensometrika.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const row = (label, valueHtml) => `
    <tr>
      <td style="padding: 9px 4px; border-bottom: 1px solid #1a2638; color: #94a3b8; font-weight: 600; width: 42%;">${label}</td>
      <td style="padding: 9px 4px; border-bottom: 1px solid #1a2638; color: #f8fafc;">${valueHtml}</td>
    </tr>
  `;

  let asunto = '';
  let htmlBody = '';

  // -------------------------------------------------------------
  // 1. PLANTILLA B2C: CONFIRMACIÓN DE PAGO Y ENLACE DE PRÁCTICA
  // -------------------------------------------------------------
  if (tipo === 'b2c_pago' || tipo === 'b2c') {
    asunto = `[SENSOMETRIKA] Confirmación de Acceso - ${planNombre || 'Plan Psicotécnico B2C'}`;
    htmlBody = renderLayout({
      subtitulo: 'COMPROBANTE DE COMPRA Y ACCESO A SIMULACIONES',
      introHtml: `Hola <strong>${nombreTrabajador || nombre || 'Postulante'}</strong>, tu acceso a la plataforma de entrenamiento psicosensométrico ya está activo.`,
      filasHtml: [
        row('Plan Contratado:', `<strong style="color:#38bdf8;">${planNombre || 'Evaluación Psicomotriz D.S. 170'}</strong>`),
        row('Monto Pagado:', `<strong>$${monto || '9.900'} CLP</strong>`),
        row('Estado:', `<span style="display:inline-block;padding:4px 10px;border-radius:5px;font-weight:800;font-size:0.75rem;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid #10b981;">ACTIVO / APROBADO</span>`),
        row('RUT Registrado:', `<strong>${rutTrabajador || 'S/RUT'}</strong>`)
      ].join(''),
      ctaTexto: '🚀 INICIAR SIMULACIONES PSICOTÉCNICAS',
      ctaColor: '#10b981',
      notaPie: 'Conserva este correo para retomar tus simulaciones disponibles en cualquier momento.'
    });
  }
  // -------------------------------------------------------------
  // 2. PLANTILLA B2B (A): ALTA EMPRESA Y ACCESO A CONSOLA APR
  // -------------------------------------------------------------
  else if (tipo === 'b2b_apr_acceso' || tipo === 'b2b_empresa') {
    asunto = `[SENSOMETRIKA B2B] Acceso Consola APR • ${empresa || 'Empresa Mandante'}`;
    htmlBody = renderLayout({
      subtitulo: 'CONSOLA CORPORATIVA DE GESTIÓN & CONTROL APR',
      introHtml: `Estimado/a <strong>${nombreEncargado || nombre || 'Encargado APR / HSEQ'}</strong>, tu cuenta corporativa ha sido habilitada para gestionar evaluaciones psicosensométricas en faena.`,
      filasHtml: [
        row('Empresa Mandante:', `<strong>${empresa || 'Empresa Registrada'}</strong>`),
        row('Administrador APR:', `<strong>${nombreEncargado || nombre || 'Responsable HSEQ'}</strong>`),
        row('Plan Corporativo:', `<strong style="color:#38bdf8;">${planNombre || 'Plan Laboral B2B'}</strong>`),
        row('Folios Habilitados:', `<strong>${folios || 'Según Bolsa Contratada'}</strong>`)
      ].join(''),
      ctaTexto: '🛡️ INGRESAR A CONSOLA APR B2B',
      ctaColor: '#0284c7',
      notaPie: 'Desde tu Consola APR podrás emitir enlaces únicos con validación biométrica para cada trabajador.'
    });
  }
  // -------------------------------------------------------------
  // 3. PLANTILLA B2B (B): CITACIÓN Y LINK ÚNICO AL TRABAJADOR
  // -------------------------------------------------------------
  else if (tipo === 'b2b_trabajador_link' || tipo === 'b2b_citacion') {
    asunto = `[SENSOMETRIKA] Citación Evaluación Psicosensométrica • ${empresa || 'Faena'}`;
    htmlBody = renderLayout({
      subtitulo: 'VERIFICACIÓN BIOMÉTRICA Y EVALUACIÓN LABORAL D.S. N° 170',
      introHtml: `Estimado/a <strong>${nombreTrabajador || 'Trabajador/a'}</strong>, la empresa <strong>${empresa || 'Mandante'}</strong> te ha asignado una evaluación psicosensométrica obligatoria. Ingresa desde un dispositivo con cámara frontal activa.`,
      filasHtml: [
        row('Trabajador:', `<strong>${nombreTrabajador || 'Evaluado'}</strong>`),
        row('RUT:', `<strong>${rutTrabajador || 'S/RUT'}</strong>`),
        row('Cargo / Función:', `<strong>${cargo || 'Operador / Conductor'}</strong>`),
        row('Vigencia Enlace:', `<strong style="color:#fbbf24;">72 Horas (Uso Único)</strong>`)
      ].join(''),
      ctaTexto: '🎥 INICIAR VERIFICACIÓN Y EVALUACIÓN',
      ctaColor: '#0284c7',
      notaPie: 'Asegúrate de contar con buena iluminación frontal y mantener una distancia de 35 a 65 cm de la cámara.'
    });
  }
  // -------------------------------------------------------------
  // 4. PLANTILLA B2B (C): INFORME PERICIAL CONSOLIDADO AL APR
  // -------------------------------------------------------------
  else {
    asunto = `[Certificado Pericial] ${nombreTrabajador || 'Evaluado'} • RUT ${rutTrabajador || 'S/RUT'}`;
    const badgeStyle = esAprobado
      ? 'background:rgba(16,185,129,0.15);color:#10b981;border:1px solid #10b981;'
      : 'background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid #ef4444;';

    htmlBody = renderLayout({
      subtitulo: 'SISTEMA DE EVALUACIÓN PSICOSENSOMÉTRICA PERICIAL',
      introHtml: `Se ha emitido un nuevo informe de evaluación psicosensométrica telemétrica bajo estándar <strong>D.S. N° 170 MTT</strong>.`,
      filasHtml: [
        row('Trabajador Evaluado:', `<strong>${nombreTrabajador || 'S/N'}</strong>`),
        row('RUT / ID:', `<strong>${rutTrabajador || 'S/RUT'}</strong>`),
        row('Cargo / Función:', `<strong>${cargo || 'Operador'}</strong>`),
        row('Empresa / Faena:', `<strong>${empresa || 'Corporativa'}</strong>`),
        row('Dictamen Pericial:', `<span style="display:inline-block;padding:5px 12px;border-radius:6px;font-weight:800;font-size:0.78rem;letter-spacing:0.5px;${badgeStyle}">${veredictoTexto}</span>`)
      ].join(''),
      ctaTexto: '📄 VER Y DESCARGAR CERTIFICADO DIGITAL',
      ctaColor: '#0284c7',
      notaPie: 'Validez legal telemétrica comprobada mediante trazabilidad biométrica y firma digital.'
    });
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const remitente = process.env.EMAIL_FROM || 'Sensometrika <notificaciones@sensometrika.com>';

    if (!RESEND_API_KEY) {
      console.log('Simulación de envío de correo (sin RESEND_API_KEY):', { tipo, correoFinal, asunto, urlFinal });
      return res.status(200).json({
        success: true,
        simulated: true,
        destinatario: correoFinal,
        message: 'Correo simulado (falta configurar RESEND_API_KEY en Vercel).'
      });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: remitente,
        to: [correoFinal],
        bcc: ['contacto@sensometrika.com'],
        subject: asunto,
        html: htmlBody
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error desde Resend API:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Resend rechazó el envío del correo.',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      destinatario: correoFinal
    });
  } catch (error) {
    console.error('Excepción en /api/enviar-correo:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno en el servidor de correo',
      details: error.message
    });
  }
}