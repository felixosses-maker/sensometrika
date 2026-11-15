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
      tipoDocumento,
      datosTributarios
    } = req.body || {};

    if (!monto || !email) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios: monto y email.' });
    }

    // Identificador único de orden para trazabilidad comercial y SII
    const ordenId = `SMK-${Date.now()}`;

    // Dominio base dinámico (funciona en sensometrika.vercel.app y dominio propio)
    const host = req.headers.host || 'sensometrika.vercel.app';
    const protocolo = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const baseUrl = `${protocolo}://${host}`;

    const segmento = (rol === 'empresa' || (planId && planId.toLowerCase().includes('b2b'))) ? 'b2b' : 'b2c';
    const docTrib = (tipoDocumento || (segmento === 'b2b' ? 'FACTURA' : 'BOLETA')).toUpperCase();

    // Construcción de la Preferencia oficial Checkout Pro de Mercado Pago
    const preferencia = {
      items: [
        {
          id: ordenId,
          title: `Sensometrika: ${nombrePlan || 'Evaluación Psicomotriz'}`,
          description: `Modalidad ${segmento.toUpperCase()} • Documento: ${docTrib}`,
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
        receptor_rut: datosTributarios?.rut || rut || '',
        receptor_razon_social: datosTributarios?.razonSocial || nombre || '',
        receptor_giro: datosTributarios?.giro || '',
        receptor_direccion: datosTributarios?.direccion || '',
        receptor_comuna: datosTributarios?.comuna || '',
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
      preferenceId: data.id,
      ordenId: ordenId
    });

  } catch (error) {
    console.error('Excepción interna en /api/crear-orden-mp:', error);
    return res.status(500).json({ error: 'Error interno al conectar con Mercado Pago.' });
  }
};