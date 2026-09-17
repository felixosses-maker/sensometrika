/* ==========================================================================
   SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
   • 3 ensayos de Calibración Técnica (Demo)
   • 7 estímulos oficiales a ciegas (promedio representativo D.S. N° 170)
   • Baremos: Particular <= 450 ms | Faena/Empresa <= 350 ms
   • Transición blindada: no ofrece módulos agotados
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
const zonaCoordinacion = document.getElementById('zona-coordinacion-test') || document.getElementById('contenedor-accion');

let modo = 'DEMO';
let estado = 'INACTIVO';
let tiempoInicio = 0;
let temporizadorVerde = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipacionesOficiales = 0;

const MAX_ENSAYOS_DEMO = 3;
const MAX_INTENTOS_OFICIALES = 7;

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

  modo = 'DEMO';
  estado = 'INACTIVO';
  if (badgeModo) badgeModo.innerText = '🟡 Calibración Técnica (Demo)';
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Fase de Práctica';
  panelEstado.innerText = 'Presiona el botón para iniciar la calibración';
  panelEstado.style.color = '#38bdf8';
  btnAccion.innerText = 'Iniciar Calibración';
  btnAccion.style.backgroundColor = '#0284c7';
});

function bloquearModuloPorCupo() {
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;
  btnAccion.disabled = true;
  btnAccion.style.opacity = '0.4';
  btnAccion.innerText = `Cupo Bloqueado (${max}/${max})`;
  panelEstado.innerText = `Has alcanzado el límite de ${max} simulaciones oficiales de tu Plan.`;
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
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

  if (badgeModo) badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Evaluación Activa (7 Estímulos)';
  panelEstado.innerText = `Listo para iniciar Simulación Oficial ${actual} de ${max}.`;
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'block';
  btnAccion.disabled = false;
  btnAccion.style.opacity = '1';
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

  if (latencia <= 350) {
    panelEstado.innerText = `${latencia} ms: Rango Óptimo - Profesional (Clase A)`;
    panelEstado.style.color = '#4ade80';
  } else if (latencia <= 450) {
    panelEstado.innerText = `${latencia} ms: Aprobado - Particular (Clase B)`;
    panelEstado.style.color = '#facc15';
  } else {
    panelEstado.innerText = `${latencia} ms: Fuera de rango municipal`;
    panelEstado.style.color = '#f87171';
  }

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);

    if (tiemposDemo.length < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = `Siguiente Ensayo Demo (${tiemposDemo.length + 1}/${MAX_ENSAYOS_DEMO})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      if (typeof CreditManager !== 'undefined') {
        CreditManager.marcarDemoCompletado('reactimetro');
      }
      estado = 'PAUSA_ENTRE_FASES';
      panelEstado.innerText = 'Calibración completada. Presiona abajo para iniciar la evaluación oficial.';
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

function iniciarFaseOficial() {
  prepararVistaOficialDirecta();
  iniciarEstimulo();
}

function finalizarSimulacionReactimetro(promedio) {
  btnAccion.style.display = 'none';

  let consumidas = 1;
  let rol = 'particular';
  let max = 3;

  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('reactimetro');
    const sesion = CreditManager.obtenerSesion();
    rol = sesion.rol || 'particular';
    max = CreditManager.obtenerLimiteModulo('reactimetro');
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

  const bloqueado = consumidas >= max;

  // Verificación estricta: ¿Palancas o Punteo tienen saldo disponible?
  const palancasTieneCupo = (typeof CreditManager !== 'undefined') ? CreditManager.puedeRendir('palancas') : false;
  const punteoTieneCupo = (typeof CreditManager !== 'undefined') ? CreditManager.puedeRendir('punteo') : false;

  let enlaceSiguiente = '';
  if (palancasTieneCupo) {
    enlaceSiguiente = `
      <a href="palancas.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:42px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
        Continuar a Módulo 2 (Palancas) →
      </a>
    `;
  } else if (punteoTieneCupo) {
    enlaceSiguiente = `
      <a href="punteo.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:42px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
        Continuar a Módulo 3 (Punteo) →
      </a>
    `;
  } else {
    enlaceSiguiente = `
      <a href="menu.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:42px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
        Ver Menú Principal e Informe →
      </a>
    `;
  }

  const contenedor = zonaCoordinacion || panelEstado;
  contenedor.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 18px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 8px;">
        Latencia promedio: <strong style="color: #fff;">${promedio} ms</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
        ${bloqueado ? `Has completado el cupo de ${max}/${max} simulaciones en este módulo.` : `Te restan ${max - consumidas} simulación(es) en este módulo.`}
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${!bloqueado ? `
          <button onclick="repetirSimulacionReactimetro()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max} →
          </button>
        ` : ''}
        ${enlaceSiguiente}
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}

window.repetirSimulacionReactimetro = function() {
  zonaCoordinacion.innerHTML = '';
  metricaTiempo.innerText = '-- ms';
  metricaPromedio.innerText = '-- ms';
  metricaAnticipaciones.innerText = '0';
  prepararVistaOficialDirecta();
};