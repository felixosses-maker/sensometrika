/* ==========================================================================
   SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
   • 3 ensayos de Calibración Técnica (Demo)
   • 7 estímulos oficiales a ciegas (sin contadores numéricos que causen ansiedad)
   • Botón ¿Cómo funciona? + Repetir calibración manual
   • Descuento real en CreditManager y bloqueo al llegar a la cuota del plan
   ========================================================================== */

const luzVerde = document.getElementById('luz-verde');
const luzRoja = document.getElementById('luz-roja');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const metricaTiempo = document.getElementById('metrica-tiempo');
const metricaPromedio = document.getElementById('metrica-promedio');
const metricaAnticipaciones = document.getElementById('metrica-anticipaciones');
const badgeModo = document.getElementById('badge-modo');
const txtTiempoCabecera = document.getElementById('txt-tiempo-cabecera');
const zonaCoordinacion = document.getElementById('zona-coordinacion-test');
const btnRecalibrarDemo = document.getElementById('btn-recalibrar-demo');
const btnResetDebug = document.getElementById('btn-reset-debug');

// Elementos del Modal de Ayuda
const modalAyuda = document.getElementById('modal-ayuda');
const btnAbrirAyuda = document.getElementById('btn-abrir-ayuda');
const btnCerrarAyuda = document.getElementById('btn-cerrar-ayuda');

let modo = 'DEMO';
let estado = 'INACTIVO';
let tiempoInicio = 0;
let temporizadorVerde = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipacionesOficiales = 0;

// Parámetros definidos: 3 ensayos libres y 7 oficiales a ciegas
const MAX_ENSAYOS_DEMO = 3;
const MAX_INTENTOS_OFICIALES = 7;

// Control del Modal
if (btnAbrirAyuda && modalAyuda) {
  btnAbrirAyuda.addEventListener('click', () => {
    modalAyuda.style.display = 'flex';
  });
}
if (btnCerrarAyuda && modalAyuda) {
  btnCerrarAyuda.addEventListener('click', () => {
    modalAyuda.style.display = 'none';
  });
}

// Botón de Calibración Manual (permite repetir el Demo cuando el usuario quiera)
if (btnRecalibrarDemo) {
  btnRecalibrarDemo.addEventListener('click', () => {
    clearTimeout(temporizadorVerde);
    luzVerde.classList.remove('encendida');
    luzRoja.classList.remove('encendida');
    zonaCoordinacion.innerHTML = '';
    iniciarFaseDemo();
  });
}

// Botón Reset Debug para desarrollo
if (btnResetDebug) {
  btnResetDebug.addEventListener('click', () => {
    localStorage.removeItem('sensometrika_demo_reactimetro');
    const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
    if (sesion.simulacionesConsumidas) {
      sesion.simulacionesConsumidas['reactimetro'] = 0;
      localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    }
    location.reload();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');

    if (!CreditManager.puedeRendir('reactimetro')) {
      bloquearModuloPorCupo();
      return;
    }

    if (CreditManager.demoYaRealizado('reactimetro')) {
      prepararVistaOficialDirecta();
      return;
    }
  }

  iniciarFaseDemo();
});

function iniciarFaseDemo() {
  modo = 'DEMO';
  estado = 'INACTIVO';
  tiemposDemo = [];

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica (Demo)';
    badgeModo.style.color = '#facc15';
  }
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Fase de Práctica';

  panelEstado.innerText = 'Presiona el botón para iniciar la calibración';
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'block';
  btnAccion.disabled = false;
  btnAccion.innerText = 'Iniciar Calibración';
  btnAccion.style.backgroundColor = '#0284c7';
}

function bloquearModuloPorCupo() {
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;
  btnAccion.disabled = true;
  btnAccion.style.opacity = '0.4';
  btnAccion.innerText = `Cupo Bloqueado (${max}/${max})`;
  panelEstado.innerText = `Has completado el límite de ${max} simulaciones oficiales.`;
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado (${max} de ${max})</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">Completaste todas las simulaciones de tu Plan en este módulo.</p>
      <a href="menu.html" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff; font-weight:bold; font-size:0.9rem;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  estado = 'INACTIVO';
  tiemposOficiales = [];
  anticipacionesOficiales = 0;

  const actual = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('reactimetro') : 1;
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;

  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
    badgeModo.style.color = '#38bdf8';
  }
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Evaluación Activa';

  panelEstado.innerText = 'Atento a la señal luminosa';
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'block';
  btnAccion.disabled = false;
  btnAccion.innerText = 'Iniciar Simulación Oficial';
  btnAccion.style.backgroundColor = '#22c55e';
}

function obtenerRetardoAleatorio() {
  return Math.floor(Math.random() * (4200 - 1700 + 1)) + 1700;
}

btnAccion.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (btnAccion.disabled) return;

  if (estado === 'INACTIVO') {
    iniciarEstimulo();
  } else if (estado === 'ESPERANDO_ROJO') {
    registrarAnticipacion();
  } else if (estado === 'ROJO_ACTIVO') {
    registrarFreno();
  } else if (estado === 'PAUSA_ENTRE_FASES') {
    iniciarFaseOficial();
  }
});

function iniciarEstimulo() {
  estado = 'ESPERANDO_ROJO';
  luzVerde.classList.add('encendida');
  luzRoja.classList.remove('encendida');

  panelEstado.innerText = 'Atento: Frena únicamente ante la luz ROJA';
  panelEstado.style.color = '#38bdf8';

  btnAccion.innerText = '¡FRENAR!';
  btnAccion.style.backgroundColor = '#dc2626';

  const retardo = obtenerRetardoAleatorio();

  temporizadorVerde = setTimeout(() => {
    estado = 'ROJO_ACTIVO';
    luzVerde.classList.remove('encendida');
    luzRoja.classList.add('encendida');
    tiempoInicio = performance.now();
  }, retardo);
}

function registrarAnticipacion() {
  clearTimeout(temporizadorVerde);
  estado = 'INACTIVO';

  luzVerde.classList.remove('encendida');

  if (modo === 'OFICIAL') {
    anticipacionesOficiales++;
    if (metricaAnticipaciones) metricaAnticipaciones.innerText = anticipacionesOficiales;
  }

  panelEstado.innerText = '¡Anticipación! Pulsaste antes de tiempo';
  panelEstado.style.color = '#f87171';

  btnAccion.innerText = 'Reintentar Estímulo';
  btnAccion.style.backgroundColor = '#0284c7';
}

function registrarFreno() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(60);

  luzRoja.classList.remove('encendida');

  if (metricaTiempo) metricaTiempo.innerText = `${latencia} ms`;
  panelEstado.innerText = ''; // Sin texto intermedio numérico

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);

    if (tiemposDemo.length < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = 'Siguiente Ensayo Demo';
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      if (typeof CreditManager !== 'undefined') {
        CreditManager.marcarDemoCompletado('reactimetro');
      }
      estado = 'PAUSA_ENTRE_FASES';
      panelEstado.innerText = 'Calibración completada. Presiona abajo para iniciar la evaluación oficial.';
      panelEstado.style.color = '#4ade80';

      btnAccion.innerText = 'Iniciar Simulación Oficial';
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    tiemposOficiales.push(latencia);
    const promedio = Math.round(
      tiemposOficiales.reduce((acc, curr) => acc + curr, 0) / tiemposOficiales.length
    );
    if (metricaPromedio) metricaPromedio.innerText = `${promedio} ms`;

    // Ejecución a ciegas: el botón muestra únicamente texto de acción
    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      btnAccion.innerText = 'Siguiente Estímulo';
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      finalizarSimulacionReactimetro(promedio);
    }
  }
}

function iniciarFaseOficial() {
  prepararVistaOficialDirecta();
  iniciarEstimulo();
}

function finalizarSimulacionReactimetro(promedio) {
  btnAccion.style.display = 'none';

  let consumidas = 1;
  let rol = 'particular';

  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('reactimetro');
    const sesion = CreditManager.obtenerSesion();
    rol = sesion.rol || 'particular';
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');
  }

  const umbral = (rol === 'empresa') ? 350 : 450;
  const aprobado = promedio <= umbral && anticipacionesOficiales <= 2;

  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;
  const bloqueado = consumidas >= max;

  const contenedor = zonaCoordinacion || panelEstado;
  contenedor.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 18px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">
        Latencia promedio: <strong style="color: #fff;">${promedio} ms</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${!bloqueado ? `
          <button onclick="location.reload()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max} →
          </button>
        ` : ''}
        <a href="palancas.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          Continuar a Módulo 2 (Palancas) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}