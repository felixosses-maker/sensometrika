/**
 * Sensometrika - Gestor de Sesión y Cronómetro de Alto Contraste
 */
(async function initSessionManager() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenUrl = urlParams.get('token');

  // 1. Si viene un token en la URL, validar contra el backend
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

      sessionStorage.setItem('smk_token', tokenUrl);
      sessionStorage.setItem('smk_type', data.type || 'demo');
      sessionStorage.setItem('smk_expires_at', data.expires_at);

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Error al contactar api/access:', err);
      alert('Error de conectividad al verificar credencial de acceso.');
      window.location.href = 'index.html';
      return;
    }
  }

  // 2. Verificar existencia de sesión activa
  const tokenActivo = sessionStorage.getItem('smk_token');
  const expiraString = sessionStorage.getItem('smk_expires_at');

  if (!tokenActivo || !expiraString) {
    alert('Acceso restringido: Ingrese con un enlace demo o credencial autorizada.');
    window.location.href = 'index.html';
    return;
  }

  const expiraTimestamp = new Date(expiraString).getTime();

  // 3. Inyectar widget visual prominente en la esquina superior derecha
  let timerWidget = document.getElementById('smk-session-timer-widget');
  if (!timerWidget) {
    timerWidget = document.createElement('div');
    timerWidget.id = 'smk-session-timer-widget';
    timerWidget.style.cssText = `
      position: fixed;
      top: 14px;
      right: 18px;
      z-index: 999999;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 13, 24, 0.95));
      border: 2px solid rgba(56, 189, 248, 0.6);
      border-radius: 12px;
      padding: 8px 18px;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.25);
      backdrop-filter: blur(8px);
      user-select: none;
    `;
    timerWidget.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:flex-start; line-height: 1.1;">
        <span style="font-size: 9.5px; font-weight: 800; color: #94a3b8; letter-spacing: 1.2px; text-transform: uppercase;">
          TIEMPO DEMO
        </span>
        <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
          <span id="smk-pulse-dot" style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981; box-shadow: 0 0 8px #10b981;"></span>
          <span style="font-size: 11px; font-weight: 700; color: #38bdf8;">RESTANTE</span>
        </div>
      </div>
      <div style="height: 28px; width: 1px; background: rgba(51, 65, 85, 0.7);"></div>
      <span id="smk-timer-display" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 22px; font-weight: 900; color: #38bdf8; letter-spacing: 1.5px; text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);">
        --:--
      </span>
    `;
    document.body.appendChild(timerWidget);
  }

  const display = document.getElementById('smk-timer-display');
  const dot = document.getElementById('smk-pulse-dot');

  // 4. Actualización continua
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
        // Alerta roja de urgencia
        display.style.color = '#ef4444';
        display.style.textShadow = '0 0 12px rgba(239, 68, 68, 0.7)';
        timerWidget.style.borderColor = 'rgba(239, 68, 68, 0.8)';
        timerWidget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.7), 0 0 18px rgba(239, 68, 68, 0.4)';
        if (dot) {
          dot.style.background = '#ef4444';
          dot.style.boxShadow = '0 0 8px #ef4444';
        }
      }
    }
  }

  actualizarContador();
  const intervalo = setInterval(actualizarContador, 1000);
})();