module.exports = async (req, res) => {
  // Cabeceras CORS para peticiones desde producción y pruebas locales
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
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Falta la variable de entorno MP_ACCESS_TOKEN en Vercel.');
      return res.status(500).json({ error: 'Configuración de pasarela incompleta en el servidor.' });
    }

    const {
      planId,
      nombrePlan,
      monto,
      email,
      rut,
      nombre,
      rol,
      tipoDte,
      tipoDocumento,
      razonSocial,
      rutEmpresa,
      giro,
      direccion,
      cargo,
      datosTributarios
    } = req.body || {};

    if (!monto || !email) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios: monto y email.' });
    }

    // Identificador único de orden para trazabilidad comercial y SII
    const ordenId = `SMK-${Date.now()}`;

    // Dominio base oficial en producción (fallback dinámico en local)
    const host = req.headers.host || 'www.sensometrika.com';
    const esLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const baseUrl = esLocal ? `http://${host}` : 'https://www.sensometrika.com';

    const segmento = (rol === 'empresa' || (planId && planId.toLowerCase().includes('b2b'))) ? 'b2b' : 'b2c';
    const rawDoc = tipoDocumento || tipoDte || (segmento === 'b2b' ? 'FACTURA' : 'BOLETA');
    const docTrib = String(rawDoc).toUpperCase();

    // Consolidación de datos tributarios SII (compatibles con checkout.html y checkout_b2c.html)
    const tribRut = datosTributarios?.rut || rutEmpresa || rut || '';
    const tribRazon = datosTributarios?.razonSocial || razonSocial || nombre || '';
    const tribGiro = datosTributarios?.giro || giro || (docTrib === 'FACTURA' ? '' : 'Consumidor Final');
    const tribDireccion = datosTributarios?.direccion || direccion || '';
    const tribComuna = datosTributarios?.comuna || '';

    // Construcción de la Preferencia oficial Checkout Pro de Mercado Pago (Producción)
    const preferencia = {
      items: [
        {
          id: ordenId,
          title: `Sensometrika: ${nombrePlan || 'Evaluación Psicomotriz'}`,
          description: `Modalidad ${segmento.toUpperCase()} • Documento SII: ${docTrib}`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: Math.round(Number(monto))
        }
      ],
      payer: {
        name: nombre || '',
        email: email,
        identification: rut ? {
          type: 'RUT',
          number: String(rut).replace(/[^0-9kK]/g, '')
        } : undefined
      },
      external_reference: ordenId,
      metadata: {
        orden_id: ordenId,
        segmento: segmento,
        plan_id: planId || '',
        nombre_plan: nombrePlan || '',
        tipo_documento: docTrib,
        receptor_rut: tribRut,
        receptor_razon_social: tribRazon,
        receptor_giro: tribGiro,
        receptor_direccion: tribDireccion,
        receptor_comuna: tribComuna,
        cargo_responsable: cargo || '',
        receptor_correo: email
      },
      back_urls: {
        success: `${baseUrl}/pago-resultado.html?status=approved&orden=${ordenId}&seg=${segmento}&doc=${docTrib}`,
        failure: `${baseUrl}/pago-resultado.html?status=failure&orden=${ordenId}&seg=${segmento}`,
        pending: `${baseUrl}/pago-resultado.html?status=pending&orden=${ordenId}&seg=${segmento}`
      },
      auto_return: 'approved',
      statement_descriptor: 'SENSOMETRIKA'
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferencia)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok || !data.init_point) {
      console.error('Error desde API Mercado Pago:', data);
      return res.status(400).json({
        error: data.message || 'No se pudo generar la orden en Mercado Pago.',
        detalle: data.cause || null
      });
    }

    // Retorna la URL de pago en producción (init_point)
    return res.status(200).json({
      url: data.init_point,
      init_point: data.init_point,
      preferenceId: data.id,
      ordenId: ordenId
    });

  } catch (error) {
    console.error('Excepción interna en /api/crear-orden-mp:', error);
    return res.status(500).json({ error: 'Error interno al conectar con Mercado Pago.' });
  }
};