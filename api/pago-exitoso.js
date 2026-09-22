module.exports = async (req, res) => {
  // Manejar cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rescatar el token enviado por Flow (admite POST y GET)
  const token = (req.body && req.body.token) || req.query.token || '';

  // Redirigir por GET hacia la página visual de confirmación
  const urlDestino = token 
    ? `/pago-resultado.html?token=${encodeURIComponent(token)}` 
    : '/pago-resultado.html';

  res.writeHead(302, { Location: urlDestino });
  res.end();
};