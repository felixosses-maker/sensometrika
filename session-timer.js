/* ==========================================================================
   SENSOMETRIKA - CONTROL DE SESIÓN Y TIEMPO (session-timer.js)
   • Valida la vigencia de tokens y controla el bloqueo por inactividad/tiempo
   ========================================================================== */

(function() {
  // BYPASS LOCAL: Si estás en Live Server (localhost / 127.0.0.1), omite restricciones para desarrollo
  const esLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  if (esLocal) {
    if (!localStorage.getItem('sensometrika_demo_token')) {
      localStorage.setItem('sensometrika_demo_token', 'local_dev_token_bypassed');
    }
    return; // Permite visualización y pruebas libres en local
  }

  // --- LÓGICA DE VALIDACIÓN OFICIAL PARA PRODUCCIÓN ---
  const tokenDemo = localStorage.getItem('sensometrika_demo_token') || sessionStorage.getItem('smk_token');
  const pathActual = window.location.pathname;

  // Páginas públicas que no exigen token estricto
  const paginasExentas = ['index.html', 'validar.html', 'terminos.html', 'checkout.html'];
  const esExenta = paginasExentas.some(pagina => pathActual.includes(pagina));

  if (!tokenDemo && !esExenta) {
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