/* ==========================================================================
   SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
   • Validación y bloqueo estricto al retroceder o agotar cupos
   • 1 Demo de inducción + Simulaciones Oficiales según Plan
   • Descuento real en CreditManager sincronizado con menu.html
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
let contadorEnsayosDemo = 0;

const MAX_ENSAYOS_DEMO = 3;
const MAX_INTENTOS_OFICIALES = 5;

// BARRERA DE ENTRADA AL CARGAR LA PÁGINA
window.addEventListener('DOMContentLoaded', () => {
  // Si retrocede con la flecha del navegador y ya agotó el cupo, se expulsa
  if (!CreditManager.validarAccesoOBloquear('reactimetro')) {
    return;
  }

  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');

  if (CreditManager.demoYaRealizado('reactimetro')) {
    prepararVistaOficialDirecta();
  }
});

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  estado = 'INACTIVO';
  tiemposOficiales = [];
  anticipacionesOficiales = 0;

  const actual = CreditManager.obtenerNumeroSimulacionActual('reactimetro');
  const max = CreditManager.obtenerLimiteModulo('reactimetro');
  const esEmpresa = CreditManager.esB2B();

  if (badgeModo) {
    badgeModo.innerText = esEmpresa 
      ? '🔴 Examen Oficial B2B 1 de 1 (D.S. N° 170)' 
      : `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
    badgeModo.style.color = '#38bdf8';
  }

  if (txtTiempoCabecera) txtTiempoCabecera.innerHTML = 'Evaluación Activa (5 Estímulos)';
  if (panelEstado) {
    panelEstado.innerText = `Listo para iniciar Simulación Oficial ${actual} de ${max}.`;
    panelEstado.style.color = '#38bdf8';
  }

  if (btnAccion) {
    btnAccion.style.display = 'block';
    btnAccion.innerText = esEmpresa ? 'Iniciar Examen Oficial (1 de 1)' : `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnAccion.style.backgroundColor = '#22c55e';
  }
}

function obtenerRetardoAleatorio() {
  return Math.floor(Math.random() * (4000 - 1800 + 1)) + 1800;
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
  luzVerde.classList.remove('apagada');
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  panelEstado.innerText = 'Atento: Frena únicamente ante la luz ROJA';
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
    metricaAnticipaciones.innerText = anticipacionesOficiales;
  }

  panelEstado.innerText = '¡Anticipación! Frenaste antes de que encendiera la luz roja';
  panelEstado.style.color = '#f87171';

  btnAccion.innerText = 'Reintentar Estímulo';
  btnAccion.style.backgroundColor = '#0284c7';
}

function registrarFreno() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(60);

  metricaTiempo.innerText = `${latencia} ms`;
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  const esEmpresa = CreditManager.esB2B();
  const umbralFaena = 400; // Calibrado por latencia de pantallas móviles

  if (latencia <= umbralFaena) {
    panelEstado.innerText = `${latencia} ms: Rango Óptimo (Faena Crítica / Clase A)`;
    panelEstado.style.color = '#4ade80';
  } else if (latencia <= 450) {
    panelEstado.innerText = `${latencia} ms: Aprobado Clase B (Observación Técnica)`;
    panelEstado.style.color = '#facc15';
  } else {
    panelEstado.innerText = `${latencia} ms: Fuera de Norma`;
    panelEstado.style.color = '#f87171';
  }

  const max = CreditManager.obtenerLimiteModulo('reactimetro');

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);
    contadorEnsayosDemo++;

    if (contadorEnsayosDemo < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = `Siguiente Ensayo Demo (${contadorEnsayosDemo + 1}/${MAX_ENSAYOS_DEMO})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      CreditManager.marcarDemoCompletado('reactimetro');
      estado = 'PAUSA_ENTRE_FASES';
      const actual = CreditManager.obtenerNumeroSimulacionActual('reactimetro');
      panelEstado.innerText = `Calibración finalizada. Listo para Simulación Oficial ${actual} de ${max}.`;
      panelEstado.style.color = '#4ade80';

      btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    tiemposOficiales.push(latencia);
    const promedio = Math.round(
      tiemposOficiales.reduce((acc, curr) => acc + curr, 0) / tiemposOficiales.length
    );
    metricaPromedio.innerText = `${promedio} ms`;

    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      btnAccion.innerText = `Siguiente Estímulo (${tiemposOficiales.length + 1}/${MAX_INTENTOS_OFICIALES})`;
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

  // DESCUENTO REAL Y REGISTRO EN EL GESTOR
  const consumidas = CreditManager.registrarConsumo('reactimetro');
  const max = CreditManager.obtenerLimiteModulo('reactimetro');
  const esEmpresa = CreditManager.esB2B();
  const aprobado = promedio <= (esEmpresa ? 400 : 450) && anticipacionesOficiales <= 2;

  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');
  const agotado = consumidas >= max;

  const tituloCierre = esEmpresa 
    ? '¡Examen Oficial Finalizado!' 
    : `¡Simulación ${consumidas} de ${max} Finalizada!`;
  
  const leyendaCierre = esEmpresa
    ? 'Evaluación registrada para la carpeta corporativa.'
    : (agotado ? `Has completado el cupo total (${max}/${max}) de este módulo.` : `Te restan ${max - consumidas} simulación(es) disponibles.`);

  let bloqueBotones = '';
  if (!agotado && !esEmpresa) {
    bloqueBotones = `
      <button onclick="repetirSimulacionReactimetro()" style="width:100%; height:46px; background-color:#22c55e; color:#fff; border-radius:8px; font-weight:800; font-size:0.9rem; border:none; cursor:pointer; margin-bottom:8px;">
        🔄 Rendir Simulación ${consumidas + 1} de ${max} →
      </button>
      <a href="palancas.html" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:44px; background-color:#0284c7; color:#fff; border-radius:8px; font-weight:800; font-size:0.88rem;">
        Continuar a Módulo 2 (Palancas) →
      </a>
    `;
  } else {
    bloqueBotones = `
      <a href="palancas.html" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:46px; background-color:#0284c7; color:#fff; border-radius:8px; font-weight:800; font-size:0.9rem; margin-bottom:8px;">
        Continuar a Módulo 2 (Palancas) →
      </a>
    `;
  }

  zonaCoordinacion.innerHTML = `
    <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 14px; padding: 18px 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.15rem;">
        ${tituloCierre}
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 6px;">
        Latencia promedio: <strong style="color: #ffffff;">${promedio} ms</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <p style="color: #38bdf8; font-size: 0.82rem; font-weight: 700; margin-bottom: 14px;">
        ${leyendaCierre}
      </p>
      <div style="display: flex; flex-direction: column;">
        ${bloqueBotones}
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px; margin-top: 6px;">
          ← Volver al Menú Principal
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