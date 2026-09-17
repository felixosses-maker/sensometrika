/* ==========================================================================
   SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
   • 1 Demo guiado de 2 estímulos de prueba
   • Fase oficial de 5 estímulos con registro estricto
   • Transición blindada hacia Palancas
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

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let estado = 'INACTIVO'; // 'INACTIVO', 'ESPERANDO_ROJO', 'ROJO_ACTIVO', 'PAUSA_ENTRE_FASES'
let tiempoInicio = 0;
let temporizadorVerde = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipacionesOficiales = 0;
let contadorEnsayosDemo = 0;

const MAX_ENSAYOS_DEMO = 2;
const MAX_INTENTOS_OFICIALES = 5;

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');

    if (!CreditManager.puedeRendir('reactimetro')) {
      bloquearModuloPorCupo();
      return;
    }
  }

  iniciarModoDemo();
});

function iniciarModoDemo() {
  modo = 'DEMO';
  estado = 'INACTIVO';
  contadorEnsayosDemo = 0;
  tiemposDemo = [];

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica (Demo)';
    badgeModo.style.color = '#facc15';
  }
  if (txtTiempoCabecera) txtTiempoCabecera.innerHTML = 'Fase de Inducción';
  if (panelEstado) {
    panelEstado.innerText = 'Pulsa el botón para iniciar la calibración.';
    panelEstado.style.color = '#38bdf8';
  }
  if (btnAccion) {
    btnAccion.style.display = 'block';
    btnAccion.disabled = false;
    btnAccion.style.backgroundColor = '#0284c7';
    btnAccion.innerText = 'Iniciar Calibración';
  }
}

function bloquearModuloPorCupo() {
  if (btnAccion) {
    btnAccion.disabled = true;
    btnAccion.style.opacity = '0.4';
    btnAccion.innerText = 'Cupo Bloqueado';
  }
  if (panelEstado) {
    panelEstado.innerText = 'Has alcanzado el límite de simulaciones permitidas.';
    panelEstado.style.color = '#f87171';
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
  if (txtTiempoCabecera) txtTiempoCabecera.innerHTML = 'Evaluación Oficial (5 Estímulos)';
  if (panelEstado) {
    panelEstado.innerText = 'Presiona abajo para iniciar la evaluación oficial.';
    panelEstado.style.color = '#38bdf8';
  }
  if (btnAccion) {
    btnAccion.style.display = 'block';
    btnAccion.disabled = false;
    btnAccion.style.backgroundColor = '#22c55e';
    btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
  }
}

function obtenerRetardoAleatorio() {
  return Math.floor(Math.random() * (3500 - 1500 + 1)) + 1500;
}

if (btnAccion) {
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
    }
  });
}

function iniciarEstimulo() {
  estado = 'ESPERANDO_ROJO';
  luzVerde.classList.add('encendida');
  luzVerde.classList.remove('apagada');
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  panelEstado.innerText = 'Atento: ¡Frena únicamente ante la luz ROJA!';
  panelEstado.style.color = '#38bdf8';

  btnAccion.innerText = '¡FRENAR!';
  btnAccion.style.backgroundColor = '#dc2626';

  const retardo = obtenerRetardoAleatorio();

  temporizadorVerde = setTimeout(() => {
    estado = 'ROJO_ACTIVO';
    luzVerde.classList.remove('encendida');
    luzVerde.classList.add('apagada');
    luzRoja.classList.add('encendida');
    luzRoja.classList.remove('apagada');
    tiempoInicio = performance.now();
  }, retardo);
}

function registrarAnticipacion() {
  clearTimeout(temporizadorVerde);
  estado = 'INACTIVO';

  luzVerde.classList.remove('encendida');
  luzVerde.classList.add('apagada');

  if (modo === 'OFICIAL') {
    anticipacionesOficiales++;
    if (metricaAnticipaciones) metricaAnticipaciones.innerText = anticipacionesOficiales;
  }

  panelEstado.innerText = '¡Anticipación! Frenaste antes de la luz roja.';
  panelEstado.style.color = '#f87171';

  btnAccion.innerText = 'Reintentar Estímulo';
  btnAccion.style.backgroundColor = '#0284c7';
}

function registrarFreno() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(60);

  if (metricaTiempo) metricaTiempo.innerText = `${latencia} ms`;
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);
    contadorEnsayosDemo++;

    if (contadorEnsayosDemo < MAX_ENSAYOS_DEMO) {
      panelEstado.innerText = `Calibración ${contadorEnsayosDemo}/${MAX_ENSAYOS_DEMO}: ${latencia} ms`;
      panelEstado.style.color = '#4ade80';
      btnAccion.innerText = `Siguiente Ensayo Demo (${contadorEnsayosDemo + 1}/${MAX_ENSAYOS_DEMO})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      estado = 'PAUSA_ENTRE_FASES';
      panelEstado.innerText = '¡Calibración completada! Listo para la simulación formal.';
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

    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      panelEstado.innerText = `Estímulo ${tiemposOficiales.length}/${MAX_INTENTOS_OFICIALES}: ${latencia} ms`;
      panelEstado.style.color = '#38bdf8';
      btnAccion.innerText = 'Siguiente Estímulo Oficial';
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      finalizarSimulacionReactimetro(promedio);
    }
  }
}

function finalizarSimulacionReactimetro(promedio) {
  btnAccion.style.display = 'none';

  let consumidas = 1;
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('reactimetro');
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');
  }

  const aprobado = promedio <= 450 && anticipacionesOficiales <= 2;

  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_reactimetro')) || [];
  historial.push({
    simulacion: consumidas,
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado,
    motivoFalla: !aprobado ? (promedio > 450 ? `Latencia alta (${promedio} ms)` : 'Exceso de anticipaciones') : 'Aprobado'
  });
  localStorage.setItem('sensometrika_historial_reactimetro', JSON.stringify(historial));

  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('reactimetro') : 3;
  const bloqueado = consumidas >= max;

  const contenedor = zonaCoordinacion || panelEstado;
  contenedor.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 18px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.15rem;">
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