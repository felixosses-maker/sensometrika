/**
 * Sensometrika - Servicio Serverless de Despacho de Correos (Resend API)
 * Archivo: api/enviar-correo.js
 */
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Configuración de cabeceras CORS
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
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Falta configurar RESEND_API_KEY en el servidor.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let rawUrl = process.env.FRONTEND_URL || 'https://www.sensometrika.com';
  let cleanDomain = 'https://www.sensometrika.com';
  const matchUrl = rawUrl.match(/https?:\/\/[^\s\]\)\'\"\/]+/);
  if (matchUrl) {
    cleanDomain = matchUrl[0];
  }

  try {
    let {
      tipo,
      email,
      emailDestino,
      nombre,
      nombreApr,
      nombreTrabajador,
      cargo,
      cargoTrabajador,
      rut,
      rutTrabajador,
      rutEmpresa,
      empresa,
      planNombre,
      cupos,
      codigoEmpresa,
      tipoDocumento,
      montoTotal,
      monto,
      vigencia,
      enlace,
      linkAcceso,
      detalles,
      duracion_minutos
    } = req.body || {};

    // Correo del destinatario principal
    const correoFinal = emailDestino || email || 'notificaciones@sensometrika.com';

    const enlaceEntrante = enlace || linkAcceso;
    const trabajadorNombre = nombreTrabajador || (detalles && detalles.nombreTrabajador) || nombre || 'Trabajador Evaluado';
    const destinatarioNombre =
      nombreApr ||
      nombreTrabajador ||
      nombre ||
      (tipo === 'b2b' ? 'Supervisión Técnica' : 'Postulante');
    const rutFinal = rutTrabajador || rut || (detalles && detalles.rutTrabajador) || 'N/A';
    const cargoFinal = cargoTrabajador || cargo || (detalles && detalles.cargo) || '';

    const tipoToken = (tipo === 'demo' || tipo === 'b2b' || tipo === 'b2b_apr_acceso') ? tipo : 'b2c';

    // Duración de vigencias por defecto (minutos)
    let minutosVigencia = 2880; // 48 horas B2C
    if (tipoToken === 'demo') {
      minutosVigencia = 6;
    } else if (tipoToken === 'b2b' || tipoToken === 'b2b_apr_acceso') {
      minutosVigencia = 4320; // 72 horas B2B
    }

    if (duracion_minutos && Number(duracion_minutos) > 0) {
      minutosVigencia = Number(duracion_minutos);
    }

    let enlaceFinal = '';

    // Sanitización o generación de enlace con token
    if (typeof enlaceEntrante === 'string' && enlaceEntrante.length > 5) {
      const matchCustom = enlaceEntrante.match(/https?:\/\/[^\s\]\)\'\"]+/);
      enlaceFinal = matchCustom ? matchCustom[0] : enlaceEntrante.trim();
    } else {
      const generatedToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + minutosVigencia * 60 * 1000).toISOString();

      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              token: generatedToken,
              type: tipoToken,
              email: correoFinal,
              metadata: detalles || {},
              expires_at: expiresAt
            })
          });
        } catch (tokenErr) {
          console.error('Error insertando token en Supabase:', tokenErr);
        }
      }

      enlaceFinal = `${cleanDomain}/demo_b2b_full.html?token=${generatedToken}`;
    }

    let asunto = '';
    let htmlContent = '';

    const esInforme =
      tipo === 'informe' ||
      (typeof planNombre === 'string' && /informe|dictamen|certificado/i.test(planNombre)) ||
      (typeof enlaceFinal === 'string' && /informe_b2b|informe_/i.test(enlaceFinal));

    if (esInforme) {
      // PLANTILLA DEDICADA: INFORME PERICIAL DEL TRABAJADOR
      const razonSocial = empresa || (detalles && detalles.razonSocial) || 'Empresa Acreditada';
      const nombrePlan = planNombre || (detalles && detalles.nombrePlan) || 'Evaluación Psicosensométrica D.S. N° 170';

      asunto = `Informe Pericial Disponible: ${trabajadorNombre} (${rutFinal}) — Sensometrika`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px; margin:0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #070d18;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">SENSOMETRIKA <span style="color: #38bdf8; font-size: 14px;">SpA</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Gabinete Sensotécnico Laboral • D.S. Nº 170 MTT</p>
            </div>
            <div style="padding: 28px 24px; background-color: #0f172a;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 20px; color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                📄 Informe Pericial del Trabajador
              </span>
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">Estimado(a) Supervisor(a) / Encargado APR:</h2>
              <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 18px 0;">
                Informamos que el trabajador <strong style="color: #ffffff;">${trabajadorNombre}</strong> ha finalizado su evaluación psicosensométrica para <strong style="color: #ffffff;">${razonSocial}</strong>. El <strong style="color: #38bdf8;">Informe Pericial y Dictamen Oficial</strong> ya se encuentra emitido y disponible para descarga:
              </p>

              <div style="background-color: #0b1320; border: 1px solid #1e293b; border-radius: 10px; padding: 15px; margin-bottom: 20px; text-align: left;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Trabajador Evaluado:</div>
                <div style="font-size: 14px; font-weight: 800; color: #ffffff; margin-bottom: 10px;">${trabajadorNombre}</div>

                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">RUT Evaluado:</div>
                <div style="font-size: 13px; font-weight: 800; color: #34d399; margin-bottom: 10px;">${rutFinal}</div>

                ${cargoFinal ? `
                  <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Cargo / Maquinaria:</div>
                  <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 10px;">${cargoFinal}</div>
                ` : ''}

                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Batería Evaluada:</div>
                <div style="font-size: 13px; font-weight: 700; color: #38bdf8;">${nombrePlan}</div>
              </div>

              <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 14px 0; font-weight: 600;">
                  Acceda al informe pericial completo y dictamen con código QR:
                </p>
                <a href="${enlaceFinal}" target="_blank" style="display: inline-block; background-color: #10b981; color: #000000; text-decoration: none; font-weight: 900; font-size: 14px; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
                  📄 Ver Informe del Trabajador →
                </a>
                <p style="font-size: 11px; color: #94a3b8; margin: 14px 0 0 0; word-break: break-all;">
                  Si el botón no abre, haz clic directo en este enlace seguro:<br>
                  <a href="${enlaceFinal}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${enlaceFinal}</a>
                </p>
              </div>
            </div>
            <div style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background-color: #070d18; font-size: 10px; color: #64748b;">
              Sensometrika SpA • Plataforma de Calibración & Gestión Psicosensométrica • Chile • contacto@sensometrika.com
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (tipo === 'b2b_apr_acceso') {
      // CONSOLA APR
      const razonSocial = empresa || (detalles && detalles.razonSocial) || 'Empresa Acreditada';
      const rutEmpFinal = rutEmpresa || (detalles && detalles.rutEmpresa) || '--';
      const planTexto = planNombre || 'Bolsa Corporativa B2B';
      const codigoFinal = codigoEmpresa || 'SENSE-B2B-ACTIVO';
      const docSiiTexto = tipoDocumento === 'BOLETA' ? 'Boleta Electrónica' : 'Factura Electrónica (DTE 33)';
      const totalTexto = montoTotal || monto || 'Confirmado';

      asunto = `Consola APR Activada: ${razonSocial} (${codigoFinal}) — Sensometrika`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px; margin:0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #070d18;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">SENSOMETRIKA <span style="color: #10b981; font-size: 14px;">B2B</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Consola de Gestión APR • D.S. Nº 170 MTT</p>
            </div>
            <div style="padding: 28px 24px; background-color: #0f172a;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                Credenciales Corporativas Activas
              </span>
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">Estimado(a) ${destinatarioNombre}:</h2>
              <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 18px 0;">
                Hemos habilitado su <strong style="color: #ffffff;">Consola de Administración APR</strong> para <strong style="color: #ffffff;">${razonSocial}</strong>.
              </p>

              <div style="background-color: #0b1320; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 22px; text-align: left;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Código de Acceso Empresa:</div>
                <div style="font-size: 16px; font-weight: 900; color: #34d399; letter-spacing: 1px; margin: 2px 0 10px 0;">${codigoFinal}</div>

                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Empresa / RUT:</div>
                <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin: 2px 0 10px 0;">${razonSocial} • ${rutEmpFinal}</div>

                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Plan Contratado:</div>
                <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin: 2px 0 10px 0;">${planTexto}</div>

                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Respaldo Tributario SII & Total:</div>
                <div style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-top: 2px;">${docSiiTexto} • ${totalTexto} (IVA Inc.)</div>
              </div>

              <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 18px;">
                <a href="${enlaceFinal}" target="_blank" style="display: inline-block; background-color: #10b981; color: #000000; text-decoration: none; font-weight: 900; font-size: 14px; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
                  Ir a Consola APR →
                </a>
              </div>
            </div>
            <div style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background-color: #070d18; font-size: 10px; color: #64748b;">
              Sensometrika SpA • Chile • contacto@sensometrika.com
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (tipo === 'b2b') {
      // NUEVA PLANTILLA B2B: CORREO DE PRESENTACIÓN COMERCIAL A EMPRESAS / APR (D.S. N° 170)
      const razonSocial = empresa || (detalles && detalles.razonSocial) || 'Empresa Mandante';
      const nombreAprPersona = nombreApr || destinatarioNombre || 'Prevencionista / APR';

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
      // PLANTILLA B2C / PARTICULARES
      const nombrePlan = planNombre || (detalles && detalles.nombrePlan) || (tipoToken === 'demo' ? 'Pase de Demostración' : 'Pase Psicomotriz (3 Sim)');
      const vigenciaTexto = vigencia || (detalles && detalles.vigencia) || (tipoToken === 'demo' ? '6 minutos' : '48 horas');

      asunto = (tipo === 'b2c_pago' || tipo === 'b2c_acceso')
        ? `Acceso Habilitado: ${nombrePlan} — Sensometrika`
        : `Tu Enlace de Acceso: Evaluación Psicotécnica — Sensometrika`;

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; padding: 30px 15px; margin:0;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            <div style="padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #070d18;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">SENSOMETRIKA <span style="color: #38bdf8; font-size: 14px;">SpA</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Gabinete Sensotécnico Laboral • D.S. Nº 170 MTT</p>
            </div>
            <div style="padding: 28px 24px; background-color: #0f172a;">
              <span style="display: inline-block; padding: 4px 12px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px;">
                Acceso Habilitado
              </span>
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #ffffff;">¡Hola, ${destinatarioNombre}!</h2>
              <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
                Tu acceso para <strong style="color: #ffffff;">${nombrePlan}</strong> ha sido activado exitosamente (vigencia: ${vigenciaTexto}). Ya puedes ingresar al simulador para preparar tu examen psicotécnico de licencia de conducir o faena laboral.
              </p>

              <div style="background-color: #0b1320; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; margin-bottom: 20px; text-align: left;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">RUT Evaluado:</div>
                <div style="font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">${rutFinal}</div>
                ${(montoTotal || monto) ? `
                  <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Detalle / Estado:</div>
                  <div style="font-size: 13px; font-weight: 800; color: #34d399;">${montoTotal || monto}</div>
                ` : ''}
              </div>

              <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <a href="${enlaceFinal}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
                  Comenzar Evaluación Ahora →
                </a>
                <p style="font-size: 11px; color: #94a3b8; margin: 14px 0 0 0; word-break: break-all;">
                  Si el botón no abre, haz clic directo en este enlace seguro:<br>
                  <a href="${enlaceFinal}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${enlaceFinal}</a>
                </p>
              </div>
            </div>
            <div style="padding: 16px; text-align: center; border-top: 1px solid #1e293b; background-color: #070d18; font-size: 10px; color: #64748b;">
              Sensometrika SpA • Plataforma de Calibración & Gestión Psicosensométrica • Chile • contacto@sensometrika.com
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const remitente = process.env.EMAIL_FROM || 'Sensometrika <notificaciones@sensometrika.com>';

    const emailPayload = {
      from: remitente,
      to: [correoFinal],
      bcc: ['contacto@sensometrika.com'],
      subject: asunto,
      html: htmlContent
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Error desde Resend:', data);
      return res.status(resendResponse.status).json({
        success: false,
        error: data.message || 'Error al enviar correo mediante Resend.',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      destinatario: correoFinal,
      enlaceGenerado: enlaceFinal
    });

  } catch (error) {
    console.error('Excepción al despachar correo:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor.' });
  }
};