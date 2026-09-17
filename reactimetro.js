/* ==========================================================================
   SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
   • Calibración (Demo) obligatoria al iniciar (no opcional)
   • Transición automática al examen oficial de 7 estímulos (D.S. N° 170)
   • Descuento estricto de créditos y acumulación de historial por simulación
   • Posicionamiento inferior para navegación al Módulo 2 (Palancas)
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
const btnResetDebug = document.getElementById('btn-reset-debug');

// Modal Ayuda
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

const MAX_ENSAYOS_DEMO = 3;
const MAX_INTENTOS_OFICIALES = 7;

if (btnAbrirAyuda && modalAyuda) {
  btnAbrirAyuda.addEventListener('click', () => { modalAyuda.style.display = 'flex'; });
}
if (btnCerrarAyuda && modalAyuda) {
  btnCerrarAyuda.addEventListener('click', () => { modalAyuda.style.display = 'none'; });
}

if (btnResetDebug) {
  btnResetDebug.addEventListener('click', () => {
    localStorage.removeItem('sensometrika_demo_reactimetro');
    localStorage.removeItem('sensometrika_historial_reactimetro');
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
  }

  // Comienza SIEMPRE con el Demo obligatorio de inducción
  iniciarFaseDemo();
});

function iniciarFaseDemo() {
  modo = 'DEMO';
  estado = 'INACTIVO';
  tiemposDemo = [];

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica Obligatoria';
    badgeModo.style.color = '#facc15';
  }
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Fase de Inducción (3 Ensayos)';

  panelEstado.innerText = 'Presiona el botón para iniciar los ensayos de calibración.';
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
  panelEstado.innerText = `Has completado tus ${max} simulaciones oficiales.`;
  panelEstado.style.color = '#f87171';

  if (zonaCoordinacion) {
    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: #ef4444; margin: 0 0 6px 0; font-size: 1rem;">Módulo Bloqueado (${max} de ${max})</h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px;">Completaste la cuota oficial contratada en este módulo.</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="palancas.html" style="display: flex; align-items: center; justify-content: center; height: 44px; background-color: #0284c7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
            Continuar a Módulo 2 (Palancas) →
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

function prepararVistaOficial() {
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
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Evaluación Activa (7 Estímulos)';

  panelEstado.innerText = 'Atento a la señal luminosa';
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'block';
  btnAccion.disabled = false;
  btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
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
    prepararVistaOficial();
    iniciarEstimulo();
  }
});

function iniciarEstimulo() {
  estado = 'ESPERANDO_ROJO';
  luzVerde.classList.add('encendida');
  luzRoja.classList.remove('encendida');

  panelEstado.innerText = 'Atento: Frena sólo ante la luz ROJA';
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

  panelEstado.innerText = '¡Anticipación! Pulsaste antes del rojo';
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

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);

    if (tiemposDemo.length < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = `Siguiente Ensayo Demo (${tiemposDemo.length}/${MAX_ENSAYOS_DEMO})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      estado = 'PAUSA_ENTRE_FASES';
      panelEstado.innerText = 'Calibración lista. Presiona el botón verde para comenzar la evaluación oficial.';
      panelEstado.style.color = '#4ade80';

      const actual = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('reactimetro') : 1;
      const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;

      btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    tiemposOficiales.push(latencia);
    const promedio = Math.round(
      tiemposOficiales.reduce((acc, curr) => acc + curr, 0) / tiemposOficiales.length
    );
    if (metricaPromedio) metricaPromedio.innerText = `${promedio} ms`;

    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      btnAccion.innerText = 'Siguiente Estímulo';
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      finalizarSimulacionReactimetro(promedio);
    }
  }
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

  // Acumulación en array para la tabla de diagnóstico S1, S2, S3...
  let historialReact = JSON.parse(localStorage.getItem('sensometrika_historial_reactimetro')) || [];
  historialReact.push({
    simulacion: consumidas,
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado,
    motivoFalla: !aprobado ? (promedio > umbral ? `Latencia sobre umbral (${promedio} ms > ${umbral} ms)` : 'Exceso de anticipaciones (> 2)') : 'Aprobado'
  });
  localStorage.setItem('sensometrika_historial_reactimetro', JSON.stringify(historialReact));

  // Guardado consolidado
  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;
  const bloqueado = consumidas >= max;

  zonaCoordinacion.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 16px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.05rem;">
        ¡Simulación ${consumidas} de ${max} Completada!
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">
        Promedio: <strong style="color: #fff;">${promedio} ms</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${!bloqueado ? `
          <button onclick="location.reload()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max}
          </button>
        ` : ''}
        <a href="palancas.html" style="display:flex; justify-content:center; align-items:center; height:44px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          Continuar a Módulo 2 (Palancas) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}