/* ==========================================================================
   SENSOMETRIKA - CONTROL DE SESIÓN, TIEMPO Y MODALES DEL SIMULADOR
   • Intercepta alertas nativas del navegador (cámara/hardware) en modales UI
   • Valida la vigencia de tokens y controla el acceso en producción
   ========================================================================== */

(function () {
  if (window.__sensometrikaUIInitialized) return;
  window.__sensometrikaUIInitialized = true;

  // 1. Inyectar el modal global del simulador en el DOM
  function asegurarModalSimulador() {
    if (document.getElementById('smkGlobalModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'smkGlobalModalOverlay';
    overlay.style.cssText = [
      'display: none',
      'position: fixed',
      'inset: 0',
      'background: rgba(4, 8, 16, 0.88)',
      'backdrop-filter: blur(6px)',
      '-webkit-backdrop-filter: blur(6px)',
      'z-index: 99999',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');

    overlay.innerHTML = `
      <div style="background: #0b1320; border: 1.5px solid #38bdf8; border-radius: 16px; padding: 22px 20px; width: 100%; max-width: 390px; text-align: center; box-shadow: 0 15px 45px rgba(0, 191, 255, 0.25); display: flex; flex-direction: column; gap: 12px;">
        <div id="smkModalIcon" style="font-size: 2.1rem; line-height: 1;">⚙️</div>
        <h3 id="smkModalTitle" style="font-size: 0.95rem; font-weight: 900; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
          AVISO DEL SIMULADOR
        </h3>
        <p id="smkModalBody" style="font-size: 0.78rem; color: #94a3b8; line-height: 1.45; margin: 0;">
        </p>
        <button type="button" id="smkModalBtn" style="background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; cursor: pointer; margin-top: 4px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);">
          CONTINUAR AL SIMULADOR →
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('smkModalBtn').addEventListener('click', () => {
      overlay.style.display = 'none';
    });
  }

  // 2. Función pública para mostrar avisos dentro del simulador
  window.mostrarModalSimulador = function (icono, titulo, mensajeHtml, textoBoton) {
    const render = () => {
      asegurarModalSimulador();
      const overlay = document.getElementById('smkGlobalModalOverlay');
      document.getElementById('smkModalIcon').textContent = icono || '⚙️';
      document.getElementById('smkModalTitle').textContent = titulo || 'AVISO DEL SIMULADOR';
      document.getElementById('smkModalBody').innerHTML = mensajeHtml || '';
      document.getElementById('smkModalBtn').textContent = textoBoton || 'CONTINUAR AL SIMULADOR →';
      overlay.style.display = 'flex';
    };

    if (document.body) {
      render();
    } else {
      window.addEventListener('DOMContentLoaded', render, { once: true });
    }
  };

  // 3. Sobrescribir window.alert() globalmente en todos los módulos
  window.alert = function (mensaje) {
    const texto = String(mensaje || '').trim();
    const lower = texto.toLowerCase();

    if (
      lower.includes('camera') ||
      lower.includes('notfounderror') ||
      lower.includes('permissiondenied') ||
      lower.includes('notallowederror') ||
      lower.includes('requested device not found')
    ) {
      window.mostrarModalSimulador(
        '📷',
        'SENSOR ÓPTICO NO DETECTADO',
        'No se encontró una cámara web activa en este equipo. El módulo continuará operando en <strong style="color:#38bdf8;">Modo Calibración Táctil / Teclado</strong> sin afectar su evaluación.',
        'CONTINUAR AL SIMULADOR →'
      );

      setTimeout(() => {
        const bioBox = document.querySelector('.biometria-box, #camaraBox, [id*="biometria"]');
        if (bioBox && !bioBox.querySelector('img[src^="data:image"]')) {
          bioBox.innerHTML = '<span style="font-size:0.52rem; color:#38bdf8; font-weight:800; display:block; padding-top:12px;">MODO MANUAL</span>';
        }
      }, 50);
      return;
    }

    if (lower.includes('microphone') || lower.includes('audio')) {
      window.mostrarModalSimulador(
        '🎧',
        'CALIBRACIÓN DE AUDIO',
        texto,
        'ENTENDIDO →'
      );
      return;
    }

    window.mostrarModalSimulador(
      'ℹ️',
      'SISTEMA SENSOMETRIKA',
      texto,
      'ACEPTAR →'
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', asegurarModalSimulador);
  } else {
    asegurarModalSimulador();
  }
})();

/* ==========================================================================
   CONTROL ORIGINAL DE SESIÓN Y VIGENCIA DE ACCESO
   ========================================================================== */
(function() {
  // BYPASS LOCAL: Si estás en Live Server (localhost / 127.0.0.1), omite restricciones para desarrollo
  const esLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  if (esLocal) {
    if (!localStorage.getItem('sensometrika_demo_token')) {
      localStorage.setItem('sensometrika_demo_token', 'local_dev_token_bypassed');
    }
    return;
  }

  // --- LÓGICA DE VALIDACIÓN OFICIAL PARA PRODUCCIÓN ---
  const urlParams = new URLSearchParams(window.location.search);
  const tieneSesionActiva =
    localStorage.getItem('sensometrika_demo_token') ||
    sessionStorage.getItem('smk_token') ||
    localStorage.getItem('sensometrika_b2b_token') ||
    localStorage.getItem('sensometrika_b2c_mode') === 'true' ||
    urlParams.has('plan') ||
    urlParams.has('rut');

  const pathActual = window.location.pathname;

  // Páginas públicas o de entrada que no exigen token previo
  const paginasExentas = ['index', 'validar', 'terminos', 'checkout', 'registro_b2c', 'registro_B2B', 'dashboard_apr'];
  const esExenta = pathActual === '/' || paginasExentas.some(pagina => pathActual.includes(pagina));

  if (!tieneSesionActiva && !esExenta) {
    document.addEventListener('DOMContentLoaded', () => {
      mostrarModalAccesoRestringido();
    });
  }

  function mostrarModalAccesoRestringido() {
    const modalExistente = document.getElementById('modalAccesoRestringidoGlobal');
    if (modalExistente) return;

    const modalHtml = `
      <div id="modalAccesoRestringidoGlobal" style="position: fixed; inset: 0; background: rgba(3, 7, 18, 0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 18px; width: 100%; max-width: 380px; padding: 28px 20px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.8); color: #f8fafc;">
          
          <div style="font-size: 2rem; margin-bottom: 12px;">⏰</div>
          <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 800;">Acceso Restringido</h3>
          <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 0.85rem; line-height: 1.5;">
            Para ingresar a los módulos de evaluación se requiere un pase demo activo o una sesión corporativa válida.
          </p>

          <button onclick="window.location.href='index.html'" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-weight: 700; cursor: pointer; font-size: 0.9rem; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
            Ir al Inicio →
          </button>

        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
})();