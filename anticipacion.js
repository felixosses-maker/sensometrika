/* ==========================================================================
   SENSOMETRIKA - MÓDULO: VELOCIDAD DE ANTICIPACIÓN (anticipacion.js)
   • Faenas Mineras y Forestales - Cálculo de trayectoria y tiempo
   • DEMO / B2B APR / ALTO DESEMPEÑO: Ejecución fluida sin bloqueo
   • B2C / B2B PAGADO: Control inmutable de cuotas
   ========================================================================== */

const objetoMovil = document.getElementById('objetoMovil');
const btnAccion = document.getElementById('btnAccion');
const statusText = document.getElementById('statusText');
const displayIntento = document.getElementById('displayIntento');
const displayDesfase = document.getElementById('displayDesfase');
const displayPrecision = document.getElementById('displayPrecision');
const badgeFase = document.getElementById('simulacionActualBadge');

// DETECCIÓN DINÁMICA DE PARÁMETROS URL Y MODO DEMO
const urlParams = new URLSearchParams(window.location.search);
const esModoDemo = urlParams.get('demo') === 'true' || urlParams.get('single') === 'true';
const returnUrl = urlParams.get('returnUrl') ? decodeURIComponent(urlParams.get('returnUrl')) : null;

// LIMPIEZA EXCLUSIVA DE CUOTAS CUANDO ES DEMOSTRACIÓN (No afecta a pagos B2C/B2B)
if (esModoDemo) {
  localStorage.removeItem('simulaciones_anticipacion');
  localStorage.removeItem('sensometrika_anticipacion_completado');
}

function obtenerMaximoSimulacionesAnticipacion() {
  if (esModoDemo) return 1; // En modo demo/single se ejecuta 1 simulación

  const esDemoToken = Boolean(sessionStorage.getItem('smk_token') || localStorage.getItem('sensometrika_demo_token'));
  if (esDemoToken) return 2;

  let sesion = {};
  try { sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {}; } catch(e){}
  const planId = String(sesion.planId || '').toLowerCase();
  if (planId.includes('full')) return 8;
  if (planId.includes('plus')) return 5;
  return 3; // Básico por defecto
}

let fase = 'DEMO';
let intentoActual = 0;
let totalIntentosTanda = 3; // 3 ensayos de prueba
let erroresTanda = [];
let isRunning = false;
let tiempoInicioMovimiento = 0;
let tiempoEsperadoLlegada = 0;
let animacionTimeout = null;

window.addEventListener('DOMContentLoaded', () => {
  const max = obtenerMaximoSimulacionesAnticipacion();
  const consumidas = parseInt(localStorage.getItem('simulaciones_anticipacion')) || 0;

  if (!esModoDemo && consumidas >= max) {
    bloquearModulo(max);
    return;
  }
  prepararFaseDemo();
});

function bloquearModulo(max) {
  if (btnAccion) {
    btnAccion.disabled = true;
    btnAccion.innerText = `Cupo Completado (${max}/${max})`;
    btnAccion.style.backgroundColor = '#1e293b';
  }
  if (badgeFase) {
    badgeFase.innerText = `🔴 Simulación Oficial ${max} de ${max} (Bloqueado)`;
    badgeFase.style.color = '#ef4444';
  }
  if (statusText) {
    statusText.innerText = `Has completado el límite de ${max} simulaciones oficiales.`;
    statusText.style.color = '#ef4444';
  }
}

function prepararFaseDemo() {
  fase = 'DEMO';
  intentoActual = 0;
  totalIntentosTanda = esModoDemo ? 2 : 3;
  erroresTanda = [];
  isRunning = false;

  if (badgeFase) {
    badgeFase.innerText = esModoDemo ? '🟡 Ensayo de Calibración' : '🟡 Calibración Anticipación (Demo)';
    badgeFase.style.color = '#facc15';
  }
  if (statusText) {
    statusText.innerText = 'Fase de Inducción: Presiona cuando el móvil cruce la meta.';
    statusText.style.color = '#94a3b8';
  }
  if (btnAccion) {
    btnAccion.disabled = false;
    btnAccion.style.backgroundColor = '#0284c7';
    btnAccion.innerText = 'Iniciar Calibración Demo';
  }

  if (displayIntento) displayIntento.innerText = `0 / ${totalIntentosTanda}`;
  if (displayDesfase) displayDesfase.innerText = '-- ms';
  if (displayPrecision) displayPrecision.innerText = '--';
}

function prepararFaseOficial() {
  fase = 'OFICIAL';
  intentoActual = 0;
  totalIntentosTanda = esModoDemo ? 3 : 5;
  erroresTanda = [];
  isRunning = false;

  const max = obtenerMaximoSimulacionesAnticipacion();
  const consumidas = parseInt(localStorage.getItem('simulaciones_anticipacion')) || 0;
  const actual = consumidas + 1;

  if (badgeFase) {
    badgeFase.innerText = `🔴 Simulación Oficial ${actual} de ${max}`;
    badgeFase.style.color = '#38bdf8';
  }
  if (statusText) {
    statusText.innerText = 'Evaluación Oficial en curso: Estima con precisión el tiempo de llegada.';
    statusText.style.color = '#fbbf24';
  }
  if (btnAccion) {
    btnAccion.disabled = false;
    btnAccion.style.backgroundColor = '#10b981';
    btnAccion.innerText = `Iniciar Simulación Oficial (${actual}/${max})`;
  }

  if (displayIntento) displayIntento.innerText = `0 / ${totalIntentosTanda}`;
  if (displayDesfase) displayDesfase.innerText = '-- ms';
  if (displayPrecision) displayPrecision.innerText = '--';
}

if (btnAccion) {
  btnAccion.addEventListener('click', () => {
    if (!isRunning && intentoActual === 0) {
      btnAccion.innerText = '¡MARCAR LLEGADA!';
      btnAccion.style.backgroundColor = '#0284c7';
      iniciarSiguienteIntento();
    } else {
      registrarImpacto();
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
    e.preventDefault();
    if (!isRunning && intentoActual === 0 && !btnAccion.disabled) {
      btnAccion.click();
    } else if (isRunning) {
      registrarImpacto();
    }
  }
});

function iniciarSiguienteIntento() {
  if (intentoActual >= totalIntentosTanda) {
    finalizarTanda();
    return;
  }

  intentoActual++;
  if (displayIntento) displayIntento.innerText = `${intentoActual} / ${totalIntentosTanda}`;
  if (statusText) statusText.innerText = "Atento... el móvil se desplaza tras la zona ciega.";

  // Reset posición
  if (objetoMovil) {
    objetoMovil.style.transition = 'none';
    objetoMovil.style.left = '0%';
    void objetoMovil.offsetWidth; // Reflow

    const duracionTrayectoMs = 2800; // 2.8 segundos de recorrido total
    objetoMovil.style.transition = `left ${duracionTrayectoMs}ms linear`;
    objetoMovil.style.left = '92%'; // Posición de la línea de meta

    tiempoInicioMovimiento = performance.now();
    tiempoEsperadoLlegada = tiempoInicioMovimiento + duracionTrayectoMs;
    isRunning = true;

    animacionTimeout = setTimeout(() => {
      if (isRunning) {
        registrarImpacto(450); // Penalización por tiempo agotado
      }
    }, duracionTrayectoMs + 600);
  }
}

function registrarImpacto(desfaseForzado = null) {
  if (!isRunning) return;
  isRunning = false;
  clearTimeout(animacionTimeout);

  const tiempoClick = performance.now();
  const desfaseMs = desfaseForzado !== null ? desfaseForzado : Math.round(tiempoClick - tiempoEsperadoLlegada);
  erroresTanda.push(Math.abs(desfaseMs));

  if (displayDesfase) displayDesfase.innerText = `${desfaseMs > 0 ? '+' : ''}${desfaseMs} ms`;
  
  if (displayPrecision && displayDesfase) {
    if (Math.abs(desfaseMs) <= 150) {
      displayPrecision.innerText = "Excelente";
      displayDesfase.className = "badge-tiempo-verde";
    } else if (Math.abs(desfaseMs) <= 250) {
      displayPrecision.innerText = "Aceptable";
      displayDesfase.className = "badge-tiempo-verde";
    } else {
      displayPrecision.innerText = "Desviado";
      displayDesfase.className = "col-metrica strong rojo";
    }
  }

  if (statusText) statusText.innerText = `Intento registrado. Desfase: ${desfaseMs} ms.`;

  setTimeout(() => {
    iniciarSiguienteIntento();
  }, 1200);
}

function finalizarTanda() {
  const promedioError = Math.round(erroresTanda.reduce((a, b) => a + b, 0) / (erroresTanda.length || 1));

  if (fase === 'DEMO') {
    if (statusText) statusText.innerText = `Calibración finalizada (Error promedio: ${promedioError} ms). Listo para oficial.`;
    prepararFaseOficial();
  } else {
    procesarCierreOficialAnticipacion(promedioError);
  }
}

function procesarCierreOficialAnticipacion(promedioError) {
  const max = obtenerMaximoSimulacionesAnticipacion();
  let consumidas = (parseInt(localStorage.getItem('simulaciones_anticipacion')) || 0) + 1;
  
  if (!esModoDemo) {
    localStorage.setItem('simulaciones_anticipacion', consumidas);
  }

  const aprobado = promedioError <= 220;

  localStorage.setItem('sensometrika_anticipacion', JSON.stringify({
    promedioError,
    aprobado,
    fecha: new Date().toISOString()
  }));

  mostrarModalResultadoAnticipacion(consumidas, max, promedioError, aprobado);
}

function mostrarModalResultadoAnticipacion(consumidas, max, promedioError, aprobado) {
  const modalPrevio = document.getElementById('modal-fin-anticipacion');
  if (modalPrevio) modalPrevio.remove();

  // DESTINO DE RETORNO INTELIGENTE (Prioriza returnUrl para no romper los Demos B2B / B2C)
  const urlDestino = returnUrl || (esModoDemo ? 'demo_b2b_apr.html' : 'menu.html');

  const modalHtml = `
    <div id="modal-fin-anticipacion" style="position: fixed; inset: 0; background: rgba(3, 7, 18, 0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; width: 100%; max-width: 380px; padding: 24px 20px; text-align: center; box-shadow: 0 20px 30px rgba(0,0,0,0.7); color: #f8fafc;">
        
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 800;">Simulación Finalizada</h3>
        <p style="color: #38bdf8; margin: 0 0 16px 0; font-size: 0.85rem; font-weight: 600;">
          ${esModoDemo ? 'Evaluación de Muestra Técnica' : `Simulación Oficial ${consumidas} de${max}`}
        </p>

        <div style="margin-bottom: 18px;">
          <span style="display: inline-block; padding: 5px 20px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; background: ${aprobado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${aprobado ? '#10b981' : '#ef4444'}; color: ${aprobado ? '#34d399' : '#f87171'};">
            ${aprobado ? 'APROBADO' : 'OBSERVADO'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #070b14; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 10px; margin-bottom: 20px; text-align: left;">
          <div><span style="display: block; font-size: 0.68rem; color: #94a3b8;">Error Promedio</span><strong style="color: #ffffff;">${promedioError} ms</strong></div>
          <div><span style="display: block; font-size: 0.68rem; color: #94a3b8;">Estado</span><strong style="color: #34d399;">${esModoDemo ? 'Registrado' : 'Guardado'}</strong></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="window.location.href='${urlDestino}'" style="width: 100%; background: #10b981; color: #000000; border: none; border-radius: 10px; padding: 12px; font-weight: 800; cursor: pointer; font-size: 0.88rem; text-transform: uppercase;">
            Volver al Menú de Pruebas →
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}