/**
 * SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
 * • 100% Adaptado a Vercel con soporte táctil unificado (pointerdown)
 * • Calibración Demo (3 estímulos) + Simulación Oficial (5 estímulos)
 * • Integración dinámica con CreditManager (Planes 3, 5 y 8)
 * • Modal dinámico de decisión: Rendir siguiente simulación o pasar a Palancas
 */

const pantallaEstimulo = document.getElementById('pantalla-estimulo');
const textoPantalla = document.getElementById('texto-pantalla');
const subtextoPantalla = document.getElementById('subtexto-pantalla');
const instruccionTxt = document.getElementById('instruccion-txt');
const btnAccion = document.getElementById('btn-iniciar-demo');
const badgeFase = document.getElementById('badge-modo-fase');

const elIntento = document.getElementById('metrica-intento');
const elUltimoTiempo = document.getElementById('metrica-ultimo-tiempo');
const elAnticipaciones = document.getElementById('metrica-anticipaciones');

// Estados: 'INACTIVO', 'DEMO_EN_CURSO', 'ESPERA_OFICIAL', 'OFICIAL_EN_CURSO', 'FINALIZADO'
let fase = 'INACTIVO';
let estadoSemaforo = 'APAGADO'; // 'APAGADO', 'VERDE_ESPERA', 'ROJO_ACTIVO'
let tiempoInicioEstimulo = 0;
let timerEstimulo = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipaciones = 0;

const TOTAL_DEMO = 3;
const TOTAL_OFICIAL = 5;

window.addEventListener('DOMContentLoaded', () => {
  if (window.CreditManager) {
    if (!CreditManager.puedeRendir('reactimetro')) {
      bloquearModuloPorCupo();
      return;
    }
  }
  prepararInicioDemo();
});

function bloquearModuloPorCupo() {
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;
  if (btnAccion) {
    btnAccion.disabled = true;
    btnAccion.innerText = `Cupo Completado (${max}/${max})`;
    btnAccion.style.backgroundColor = '#475569';
  }
  if (badgeFase) {
    badgeFase.innerText = `🔴 Simulación Oficial ${max} de ${max} (Bloqueado)`;
    badgeFase.style.color = '#ef4444';
  }
  if (instruccionTxt) {
    instruccionTxt.innerText = `Has alcanzado el límite de ${max} simulaciones para este módulo.`;
    instruccionTxt.style.color = '#ef4444';
  }
}

function prepararInicioDemo() {
  fase = 'INACTIVO';
  estadoSemaforo = 'APAGADO';
  tiemposDemo = [];
  tiemposOficiales = [];
  anticipaciones = 0;

  pantallaEstimulo.className = 'pantalla-freno';
  textoPantalla.innerText = 'Presiona Iniciar';
  subtextoPantalla.innerText = '';

  badgeFase.innerText = '🟡 Calibración Demo (3 estímulos)';
  badgeFase.style.color = '#facc15';

  instruccionTxt.innerText = 'Presiona "Iniciar Calibración Demo" para habituar tus reflejos antes de la Simulación Oficial 1.';
  instruccionTxt.style.color = '#94a3b8';

  btnAccion.disabled = false;
  btnAccion.style.display = 'flex';
  btnAccion.style.backgroundColor = '#0284c7';
  btnAccion.innerText = 'Iniciar Calibración Demo';

  elIntento.innerText = '0 / 0';
  elUltimoTiempo.innerText = '-- ms';
  elAnticipaciones.innerText = '0';
}

// Evento táctil prioritario para móviles y clic de escritorio
btnAccion.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (btnAccion.disabled) return;
  ejecutarAccionBoton();
});

function ejecutarAccionBoton() {
  if (fase === 'INACTIVO') {
    // Inicia el primer ensayo del Demo
    fase = 'DEMO_EN_CURSO';
    lanzarEstimuloVerde();
  } else if (fase === 'DEMO_EN_CURSO') {
    procesarPulsada(true);
  } else if (fase === 'ESPERA_OFICIAL') {
    // Inicia la serie oficial
    fase = 'OFICIAL_EN_CURSO';
    tiemposOficiales = [];
    anticipaciones = 0;
    elAnticipaciones.innerText = '0';
    lanzarEstimuloVerde();
  } else if (fase === 'OFICIAL_EN_CURSO') {
    procesarPulsada(false);
  }
}

function lanzarEstimuloVerde() {
  estadoSemaforo = 'VERDE_ESPERA';
  pantallaEstimulo.className = 'pantalla-freno verde';
  textoPantalla.innerText = '¡ATENTO!';
  subtextoPantalla.innerText = 'Mantén la calma y frena al ver ROJO';

  btnAccion.innerText = '¡FRENAR!';
  btnAccion.style.backgroundColor = '#dc2626';

  // Retardo aleatorio normativo (1.8s a 3.8s)
  const retardo = Math.floor(Math.random() * 2000) + 1800;
  clearTimeout(timerEstimulo);

  timerEstimulo = setTimeout(() => {
    estadoSemaforo = 'ROJO_ACTIVO';
    pantallaEstimulo.className = 'pantalla-freno roja';
    textoPantalla.innerText = '¡FRENA AHORA!';
    subtextoPantalla.innerText = 'Presiona el botón de inmediato';
    tiempoInicioEstimulo = performance.now();
  }, retardo);
}

function procesarPulsada(esDemo) {
  if (estadoSemaforo === 'VERDE_ESPERA') {
    // Anticipación
    clearTimeout(timerEstimulo);
    estadoSemaforo = 'APAGADO';
    anticipaciones++;
    elAnticipaciones.innerText = anticipaciones;

    pantallaEstimulo.className = 'pantalla-freno';
    textoPantalla.innerText = '⚠️ ANTICIPACIÓN';
    subtextoPantalla.innerText = 'Frenaste antes de la señal roja';

    instruccionTxt.innerText = 'No te adelantes al estímulo. Espera ver la pantalla roja.';
    instruccionTxt.style.color = '#ef4444';

    btnAccion.innerText = 'Reintentar Estímulo';
    btnAccion.style.backgroundColor = '#0284c7';

    // Se reanuda el estímulo tras breve pausa
    setTimeout(() => {
      if (fase === 'DEMO_EN_CURSO' || fase === 'OFICIAL_EN_CURSO') {
        lanzarEstimuloVerde();
      }
    }, 1200);

  } else if (estadoSemaforo === 'ROJO_ACTIVO') {
    // Frenado válido
    const latencia = Math.round(performance.now() - tiempoInicioEstimulo);
    estadoSemaforo = 'APAGADO';

    if ('vibrate' in navigator) navigator.vibrate(50);

    pantallaEstimulo.className = 'pantalla-freno';
    textoPantalla.innerText = `${latencia} ms`;
    subtextoPantalla.innerText = 'Frenada registrada con éxito';
    elUltimoTiempo.innerText = `${latencia} ms`;

    if (esDemo) {
      tiemposDemo.push(latencia);
      elIntento.innerText = `${tiemposDemo.length} / ${TOTAL_DEMO}`;

      if (tiemposDemo.length < TOTAL_DEMO) {
        instruccionTxt.innerText = `Ensayo Demo ${tiemposDemo.length} de ${TOTAL_DEMO} completado. Preparando siguiente...`;
        instruccionTxt.style.color = '#38bdf8';
        setTimeout(() => {
          if (fase === 'DEMO_EN_CURSO') lanzarEstimuloVerde();
        }, 1200);
      } else {
        // Concluye la fase demo
        fase = 'ESPERA_OFICIAL';
        const actual = window.CreditManager ? CreditManager.obtenerConsumoModulo('reactimetro') + 1 : 1;
        const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;

        badgeFase.innerText = `🔴 Simulación Oficial ${actual} de ${max}`;
        badgeFase.style.color = '#38bdf8';

        instruccionTxt.innerText = '¡Calibración Demo finalizada! Presiona el botón verde para iniciar tu Simulación Oficial.';
        instruccionTxt.style.color = '#4ade80';

        btnAccion.style.backgroundColor = '#22c55e';
        btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
      }
    } else {
      // Modo oficial
      tiemposOficiales.push(latencia);
      elIntento.innerText = `${tiemposOficiales.length} / ${TOTAL_OFICIAL}`;

      if (tiemposOficiales.length < TOTAL_OFICIAL) {
        instruccionTxt.innerText = `Estímulo oficial ${tiemposOficiales.length} de ${TOTAL_OFICIAL} completado.`;
        instruccionTxt.style.color = '#38bdf8';
        setTimeout(() => {
          if (fase === 'OFICIAL_EN_CURSO') lanzarEstimuloVerde();
        }, 1200);
      } else {
        concluirSimulacionOficialReactimetro();
      }
    }
  }
}

function concluirSimulacionOficialReactimetro() {
  fase = 'FINALIZADO';
  clearTimeout(timerEstimulo);

  let consumidas = 1;
  let max = 3;

  if (window.CreditManager) {
    consumidas = CreditManager.registrarConsumo('reactimetro');
    max = CreditManager.obtenerLimiteModulo('reactimetro');
  }

  const promedio = Math.round(tiemposOficiales.reduce((a, b) => a + b, 0) / tiemposOficiales.length);
  const aprobado = promedio <= 450 && anticipaciones <= 2;

  // Persistencia local
  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    promedio,
    anticipaciones,
    aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_reactimetro')) || [];
  historial.push({
    simulacion: consumidas,
    promedio,
    anticipaciones,
    aprobado
  });
  localStorage.setItem('sensometrika_historial_reactimetro', JSON.stringify(historial));

  mostrarModalResultadoReactimetro(consumidas, max, promedio, anticipaciones, aprobado);
}

function mostrarModalResultadoReactimetro(consumidas, max, promedio, ant, aprobado) {
  const quedanSimulaciones = consumidas < max;
  const modalPrevio = document.getElementById('modal-fin-reactimetro');
  if (modalPrevio) modalPrevio.remove();

  const modalHtml = `
    <div id="modal-fin-reactimetro" style="position: fixed; inset: 0; background: rgba(3, 7, 18, 0.88); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #090e1a; border: 1px solid #1e293b; border-radius: 18px; width: 100%; max-width: 380px; padding: 24px 20px; text-align: center; box-shadow: 0 20px 30px rgba(0,0,0,0.6); color: #f8fafc;">
        
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 800;">Simulación Finalizada</h3>
        <p style="color: #38bdf8; margin: 0 0 16px 0; font-size: 0.85rem; font-weight: 600;">
          Simulación ${consumidas} de ${max}
        </p>

        <div style="margin-bottom: 18px;">
          <span style="display: inline-block; padding: 5px 20px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; background: ${aprobado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${aprobado ? '#10b981' : '#ef4444'}; color: ${aprobado ? '#34d399' : '#f87171'};">
            ${aprobado ? 'APROBADO' : 'OBSERVADO'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #030712; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 12px; margin-bottom: 20px; text-align: left;">
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8;">Latencia Media</span>
            <strong style="color: #ffffff; font-size: 1rem;">${promedio} ms</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8;">Anticipaciones</span>
            <strong style="color: #ffffff; font-size: 1rem;">${ant}</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8;">Estándar DS 170</span>
            <strong style="color: #38bdf8; font-size: 0.85rem;">≤ 450 ms</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8;">Cupo Disponible</span>
            <strong style="color: #38bdf8; font-size: 0.95rem;">${max - consumidas} restante(s)</strong>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${quedanSimulaciones ? `
            <button id="btn-repetir-reactimetro" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 8px; padding: 12px; font-weight: 700; cursor: pointer; font-size: 0.88rem;">
              🔄 Iniciar Calibración (${consumidas + 1}/${max})
            </button>
          ` : ''}

          <a href="palancas.html" style="display: flex; justify-content: center; align-items: center; width: 100%; box-sizing: border-box; background: ${quedanSimulaciones ? 'transparent' : '#0284c7'}; color: ${quedanSimulaciones ? '#38bdf8' : '#ffffff'}; border: 1px solid #0284c7; border-radius: 8px; padding: 11px; font-weight: 700; font-size: 0.85rem; text-decoration: none;">
            Pasar al Siguiente Módulo (Palancas) →
          </a>

          <a href="menu.html" style="display: flex; justify-content: center; align-items: center; width: 100%; box-sizing: border-box; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-weight: 600; font-size: 0.85rem; text-decoration: none;">
            Volver al Menú Principal
          </a>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const btnRepetir = document.getElementById('btn-repetir-reactimetro');
  if (btnRepetir) {
    btnRepetir.addEventListener('click', () => {
      document.getElementById('modal-fin-reactimetro').remove();
      prepararInicioDemo();
    });
  }
}