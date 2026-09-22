/**
 * Sensometrika - Gestor de Sesión y Temporizador de Acceso
 */
(async function initSessionManager() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenUrl = urlParams.get('token');

  // 1. Si viene un token en la URL, se valida y consume contra el backend
  if (tokenUrl) {
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', token: tokenUrl })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        let msg = 'Enlace de acceso no válido o no encontrado.';
        if (data.error === 'TOKEN_EXPIRED') {
          msg = 'El enlace de acceso ha expirado (tiempo límite superado).';
        } else if (data.error === 'TOKEN_ALREADY_USED') {
          msg = 'Este enlace ya fue utilizado previamente.';
        }
        alert(msg);
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
      }

      // Guardar sesión autorizada
      sessionStorage.setItem('smk_token', tokenUrl);
      sessionStorage.setItem('smk_type', data.type || 'demo');
      sessionStorage.setItem('smk_expires_at', data.expires_at);

      // Limpiar el parámetro de la barra de URL para evitar revalidación en recargas (F5)
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Error al contactar api/access:', err);
      alert('Error de conectividad al verificar credencial de acceso.');
      window.location.href = 'index.html';
      return;
    }
  }

  // 2. Comprobar existencia de sesión activa
  const tokenActivo = sessionStorage.getItem('smk_token');
  const expiraString = sessionStorage.getItem('smk_expires_at');

  if (!tokenActivo || !expiraString) {
    alert('Acceso restringido: Ingrese con un enlace demo o credencial autorizada.');
    window.location.href = 'index.html';
    return;
  }

  const expiraTimestamp = new Date(expiraString).getTime();

  // 3. Crear el widget visual del temporizador si no existe en el DOM
  let timerWidget = document.getElementById('smk-session-timer-widget');
  if (!timerWidget) {
    timerWidget = document.createElement('div');
    timerWidget.id = 'smk-session-timer-widget';
    timerWidget.style.cssText = `
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 99999;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 10px;
      padding: 6px 14px;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
    `;
    timerWidget.innerHTML = `
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; animation: pulse 1.5s infinite;"></span>
      <span style="font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">DEMO:</span>
      <span id="smk-timer-display" style="font-family:monospace; font-weight:700; color:#38bdf8; font-size:13px;">--:--</span>
    `;
    document.body.appendChild(timerWidget);
  }

  const display = document.getElementById('smk-timer-display');

  // 4. Intervalo de actualización de cuenta regresiva
  function actualizarContador() {
    const restanteMs = expiraTimestamp - Date.now();

    if (restanteMs <= 0) {
      clearInterval(intervalo);
      if (display) display.textContent = '00:00';
      alert('Tu sesión de prueba de 10 minutos ha finalizado.');
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }

    const minutos = Math.floor(restanteMs / 60000);
    const segundos = Math.floor((restanteMs % 60000) / 1000);
    const textoMin = String(minutos).padStart(2, '0');
    const textoSeg = String(segundos).padStart(2, '0');

    if (display) {
      display.textContent = `${textoMin}:${textoSeg}`;
      if (minutos < 2) {
        display.style.color = '#ef4444'; // Alerta roja cuando queda poco tiempo
      }
    }
  }

  actualizarContador();
  const intervalo = setInterval(actualizarContador, 1000);
})();