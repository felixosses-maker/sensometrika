/**
 * Sensometrika - Gestor de Sesión Demo & Reset de Intentos por Token
 */
(async function initSessionManager() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenUrl = urlParams.get('token');

  // Modal corporativo integrado
  function mostrarModalAviso(titulo, subtitulo, textoBtn, urlDestino) {
    const modalId = 'smk-modal-aviso';
    if (document.getElementById(modalId)) return;

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.94);
      backdrop-filter: blur(10px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f172a;
        border: 1px solid rgba(56, 189, 248, 0.45);
        border-radius: 20px;
        max-width: 420px;
        width: 100%;
        padding: 28px 24px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.2);
        color: #ffffff;
      ">
        <div style="display: flex; justify-content: center; margin-bottom: 16px;">
          <div style="
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            font-size: 26px;
          ">
            ⏱️
          </div>
        </div>

        <h3 style="font-size: 1.3rem; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; letter-spacing: 0.5px;">
          ${titulo}
        </h3>
        
        <p style="font-size: 0.88rem; color: #94a3b8; line-height: 1.55; margin: 0 0 22px 0;">
          ${subtitulo}
        </p>

        <button id="smk-btn-modal-accion" style="
          width: 100%;
          background: #0284c7;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 13px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
        ">
          ${textoBtn}
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('smk-btn-modal-accion').addEventListener('click', () => {
      window.location.href = urlDestino;
    });
  }

  // 1. Si viene un token nuevo en URL, validar y resetear intentos de módulos anteriores
  if (tokenUrl) {
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', token: tokenUrl })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        let msg = 'El enlace de acceso ingresado no es válido o ya no existe.';
        if (data.error === 'TOKEN_EXPIRED') {
          msg = 'Este enlace demo superó los 10 minutos de vigencia permitidos.';
        } else if (data.error === 'TOKEN_ALREADY_USED') {
          msg = 'Este enlace ya fue activado previamente.';
        }

        mostrarModalAviso('Enlace Inválido o Expirado', msg, 'Ver Planes de Evaluación →', 'index.html#planes');
        return;
      }

      // Guardar nueva sesión
      sessionStorage.setItem('smk_token', tokenUrl);
      sessionStorage.setItem('smk_type', data.type || 'demo');
      sessionStorage.setItem('smk_expires_at', data.expires_at);
      sessionStorage.removeItem('smk_session_expired');

      // RESETEAR CONTADORES LOCALES PARA EL NUEVO TOKEN
      localStorage.removeItem('simulaciones_palancas');
      localStorage.removeItem('simulaciones_reactimetro');
      localStorage.removeItem('simulaciones_punteo');
      localStorage.removeItem('sensometrika_palancas');
      localStorage.removeItem('sensometrika_reactimetro');
      localStorage.removeItem('sensometrika_punteo');
      localStorage.removeItem('sensometrika_historial_palancas');
      localStorage.removeItem('sensometrika_historial_reactimetro');
      localStorage.removeItem('sensometrika_historial_punteo');

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Error al contactar api/access:', err);
      mostrarModalAviso('Error de Red', 'No fue posible validar la autorización.', 'Reintentar', 'index.html');
      return;
    }
  }

  // 2. Verificar estado de expiración
  if (sessionStorage.getItem('smk_session_expired') === 'true') {
    mostrarModalAviso(
      'Sesión Demo Finalizada',
      'Tu tiempo de evaluación de prueba (10 min) ha concluido. Adquiere tu plan para continuar practicando sin límites.',
      'Ver Planes y Precios →',
      'index.html#planes'
    );
    return;
  }

  // 3. Comprobar credencial de sesión activa
  const tokenActivo = sessionStorage.getItem('smk_token');
  const expiraString = sessionStorage.getItem('smk_expires_at');

  if (!tokenActivo || !expiraString) {
    mostrarModalAviso(
      'Acceso Restringido',
      'Para ingresar a los módulos de evaluación se requiere un pase demo activo.',
      'Ir al Inicio →',
      'index.html'
    );
    return;
  }

  const expiraTimestamp = new Date(expiraString).getTime();

  // 4. Widget flotante de cronómetro
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

  // 5. Cuenta regresiva
  function tick() {
    const restanteMs = expiraTimestamp - Date.now();

    if (restanteMs <= 0) {
      clearInterval(intervalo);
      if (display) display.textContent = '00:00';
      if (dot) {
        dot.style.background = '#ef4444';
        dot.style.boxShadow = '0 0 8px #ef4444';
      }

      sessionStorage.setItem('smk_session_expired', 'true');
      sessionStorage.removeItem('smk_token');
      sessionStorage.removeItem('smk_expires_at');

      mostrarModalAviso(
        'Sesión Demo Finalizada',
        'Has completado tus 10 minutos de prueba. Para continuar evaluando y emitir informes con validez oficial conforme al D.S. N° 170, adquiere tu plan de evaluaciones.',
        'Ver Planes y Precios →',
        'index.html#planes'
      );
      return;
    }

    const minutos = Math.floor(restanteMs / 60000);
    const segundos = Math.floor((restanteMs % 60000) / 1000);
    const textoMin = String(minutos).padStart(2, '0');
    const textoSeg = String(segundos).padStart(2, '0');

    if (display) {
      display.textContent = `${textoMin}:${textoSeg}`;
      if (minutos < 2) {
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

  tick();
  const intervalo = setInterval(tick, 1000);
})();