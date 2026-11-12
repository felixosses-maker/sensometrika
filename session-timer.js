// ============================================================================
// SENSOMETRIKA - INTERCEPTOR GLOBAL DE ALERTAS Y HARDWARE DEL SIMULADOR
// Reemplaza los alert() nativos del navegador por modales propios del sistema
// ============================================================================
(function () {
  if (window.__sensometrikaUIInitialized) return;
  window.__sensometrikaUIInitialized = true;

  // 1. Inyectar el modal en el DOM tan pronto como esté disponible
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

  // 2. Función pública para mostrar cualquier aviso dentro del simulador
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

    // Caso A: Error de cámara / MediaPipe / sensor óptico
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

      // Actualizar recuadro de biometría en el encabezado si existe
      setTimeout(() => {
        const bioBox = document.querySelector('.biometria-box, #camaraBox, [id*="biometria"]');
        if (bioBox && !bioBox.querySelector('img[src^="data:image"]')) {
          bioBox.innerHTML = '<span style="font-size:0.52rem; color:#38bdf8; font-weight:800; display:block; padding-top:12px;">MODO MANUAL</span>';
        }
      }, 50);
      return;
    }

    // Caso B: Error de micrófono o audio
    if (lower.includes('microphone') || lower.includes('audio')) {
      window.mostrarModalSimulador(
        '🎧',
        'CALIBRACIÓN DE AUDIO',
        texto,
        'ENTENDIDO →'
      );
      return;
    }

    // Caso C: Cualquier otro alert() de validación o instrucción del módulo
    window.mostrarModalSimulador(
      'ℹ️',
      'SISTEMA SENSOMETRIKA',
      texto,
      'ACEPTAR →'
    );
  };

  // Pre-crear el modal en cuanto cargue el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', asegurarModalSimulador);
  } else {
    asegurarModalSimulador();
  }
})();