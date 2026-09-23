/* ==========================================================================
   SENSOMETRIKA - MÓDULO: VELOCIDAD DE ANTICIPACIÓN (anticipacion.js)
   • Faenas Mineras y Forestales - Cálculo de trayectoria y tiempo
   • DEMO: 2 simulaciones oficiales (1/2 y 2/2)
   • B2C PAGADO: Básico (3), Plus (5), Full (8)
   ========================================================================== */

const objetoMovil = document.getElementById('objetoMovil');
const btnAccion = document.getElementById('btnAccion');
const statusText = document.getElementById('statusText');
const displayIntento = document.getElementById('displayIntento');
const displayDesfase = document.getElementById('displayDesfase');
const displayPrecision = document.getElementById('displayPrecision');
const badgeFase = document.getElementById('simulacionActualBadge');

// DETECCIÓN DINÁMICA DE CUOTA (Siguiendo el estándar de Palancas y Reactímetro)
function obtenerMaximoSimulacionesAnticipacion() {
  const esDemo = Boolean(sessionStorage.getItem('smk_token') || localStorage.getItem('sensometrika_demo_token'));
  if (esDemo) return 2; // DEMO ESTRICTAMENTE 2

  let sesion = {};
  try { sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {}; } catch(e){}
  const planId = String(sesion.planId || '').toLowerCase();
  if (planId.includes('full')) return 8;
  if (planId.includes('plus')) return 5;
  return 3; // Básico por defecto
}

let fase = 'DEMO';
let intentoActual = 0;
let totalIntentosTanda = 3; // 3 intentos para demo, 5 para oficial
let erroresTanda = [];
let isRunning = false;
let tiempoInicioMovimiento = 0;
let tiempoEsperadoLlegada = 0;
let animacionTimeout = null;

window.addEventListener('DOMContentLoaded', () => {
  const max = obtenerMaximoSimulacionesAnticipacion();
  const consumidas = parseInt(localStorage.getItem('simulaciones_anticipacion')) || 0;

  if (consumidas >= max) {
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
  totalIntentosTanda = 3;
  erroresTanda = [];
  isRunning = false;

  if (badgeFase) {
    badgeFase.innerText = '🟡 Calibración Anticipación (Demo 3 intentos)';
    badgeFase.style.color = '#facc15';
  }
  if (statusText) {
    statusText.innerText = 'Fase de Inducción: Presiona cuando el móvil cruce la meta.';
    statusText.style.color = '#94a3b8';
  }
  if (btnAccion) {
    btnAccion.disabled = false;
    btnAccion.style.backgroundColor = '#0284c7';
    btnAccion.innerText = 'Iniciar Calibración Demo (3 int)';
  }

  if (displayIntento) displayIntento.innerText = `0 / ${totalIntentosTanda}`;
  if (displayDesfase) displayDesfase.innerText = '-- ms';
  if (displayPrecision) displayPrecision.innerText = '--';
}

function prepararFaseOficial() {
  fase = 'OFICIAL';
  intentoActual = 0;
  totalIntentosTanda = 5;
  erroresTanda = [];
  isRunning = false;

  const max = obtenerMaximoSimulacionesAnticipacion();
  const consumidas = parseInt(localStorage.getItem('simulaciones_anticipacion')) || 0;
  const actual = consumidas + 1;

  if (badgeFase) {
    badgeFase.innerText = `🔴 Simulación Oficial ${actual} de ${max} (5 intentos)`;
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
  displayIntento.innerText = `${intentoActual} / ${totalIntentosTanda}`;
  statusText.innerText = "Atento... el móvil se desplaza tras la zona ciega.";

  // Reset posición
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

function registrarImpacto(desfaseForzado = null) {
  if (!isRunning) return;
  isRunning = false;
  clearTimeout(animacionTimeout);

  const tiempoClick = performance.now();
  const desfaseMs = desfaseForzado !== null ? desfaseForzado : Math.round(tiempoClick - tiempoEsperadoLlegada);
  erroresTanda.push(Math.abs(desfaseMs));

  displayDesfase.innerText = `${desfaseMs > 0 ? '+' : ''}${desfaseMs} ms`;
  
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

  statusText.innerText = `Intento registrado. Desfase: ${desfaseMs} ms.`;

  setTimeout(() => {
    iniciarSiguienteIntento();
  }, 1200);
}

function finalizarTanda() {
  const promedioError = Math.round(erroresTanda.reduce((a, b) => a + b, 0) / erroresTanda.length);

  if (fase === 'DEMO') {
    statusText.innerText = `Calibración finalizada (Error promedio: ${promedioError} ms). Listo para oficial.`;
    prepararFaseOficial();
  } else {
    procesarCierreOficialAnticipacion(promedioError);
  }
}

function procesarCierreOficialAnticipacion(promedioError) {
  const max = obtenerMaximoSimulacionesAnticipacion();
  let consumidas = (parseInt(localStorage.getItem('simulaciones_anticipacion')) || 0) + 1;
  localStorage.setItem('simulaciones_anticipacion', consumidas);

  const aprobado = promedioError <= 220;

  localStorage.setItem('sensometrika_anticipacion', JSON.stringify({
    promedioError,
    aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = [];
  try {
    historial = JSON.parse(localStorage.getItem('sensometrika_historial_anticipacion')) || [];
  } catch(e) {}

  historial.push({
    simulacion: consumidas,
    promedioError,
    aprobado
  });
  localStorage.setItem('sensometrika_historial_anticipacion', JSON.stringify(historial));

  mostrarModalResultadoAnticipacion(consumidas, max, promedioError, aprobado);
}

function mostrarModalResultadoAnticipacion(consumidas, max, promedioError, aprobado) {
  const quedanSimulaciones = consumidas < max;
  const modalPrevio = document.getElementById('modal-fin-anticipacion');
  if (modalPrevio) modalPrevio.remove();

  const esDemo = Boolean(sessionStorage.getItem('smk_token') || localStorage.getItem('sensometrika_demo_token'));
  const urlRetorno = esDemo ? 'demo.html' : 'menu.html';

  const modalHtml = `
    <div id="modal-fin-anticipacion" style="position: fixed; inset: 0; background: rgba(3, 7, 18, 0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; width: 100%; max-width: 380px; padding: 24px 20px; text-align: center; box-shadow: 0 20px 30px rgba(0,0,0,0.7); color: #f8fafc;">
        
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 800;">Simulación Finalizada</h3>
        <p style="color: #38bdf8; margin: 0 0 16px 0; font-size: 0.85rem; font-weight: 600;">
          Simulación Oficial ${consumidas} de ${max}
        </p>

        <div style="margin-bottom: 18px;">
          <span style="display: inline-block; padding: 5px 20px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; background: ${aprobado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${aprobado ? '#10b981' : '#ef4444'}; color: ${aprobado ? '#34d399' : '#f87171'};">
            ${aprobado ? 'APROBADO' : 'OBSERVADO'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #070b14; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 10px; margin-bottom: 20px; text-align: left;">
          <div><span style="display: block; font-size: 0.68rem; color: #94a3b8;">Error Promedio</span><strong style="color: #ffffff;">${promedioError} ms</strong></div>
          <div><span style="display: block; font-size: 0.68rem; color: #94a3b8;">Restantes</span><strong style="color: #34d399;">${max - consumidas}</strong></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${quedanSimulaciones ? `
            <button id="btn-repetir-anticipacion" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-weight: 700; cursor: pointer; font-size: 0.88rem;">
              🔄 Iniciar Oficial (${consumidas + 1}/${max})
            </button>
          ` : `
            <button onclick="window.location.href='demo.html'" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-weight: 700; cursor: pointer; font-size: 0.88rem;">
              Completado · Volver al Menú →
            </button>
          `}

          <button onclick="window.location.href='${urlRetorno}'" style="width: 100%; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; padding: 10px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
            Volver al Menú Pruebas
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const btnRepetir = document.getElementById('btn-repetir-anticipacion');
  if (btnRepetir) {
    btnRepetir.addEventListener('click', () => {
      document.getElementById('modal-fin-anticipacion').remove();
      prepararFaseOficial();
    });
  }
}