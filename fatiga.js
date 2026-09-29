/* ==========================================================================
   SENSOMETRIKA - MÓDULO: RESISTENCIA A LA FATIGA / PVT (fatiga.js)
   • Monitoreo de atención sostenida y detección de micro-sueños
   ========================================================================== */

const visor = document.getElementById('visorFatiga');
const txtVisor = document.getElementById('txtVisor');
const btnIniciar = document.getElementById('btnIniciarFatiga');
const statusText = document.getElementById('statusText');
const badgeFase = document.getElementById('badgeFase');
const lblEstimulo = document.getElementById('lblEstimulo');
const lblLatencia = document.getElementById('lblLatencia');
const lblLapsos = document.getElementById('lblLapsos');

let fase = 'DEMO';
let estado = 'IDLE'; // IDLE, WAITING, ACTIVE
let estimuloActual = 0;
let totalEstimulos = 5;
let tiemposRespuesta = [];
let lapsosAtencion = 0;
let timerEstimulo = null;
let tiempoInicio = 0;

function obtenerMaximoSimulacionesFatiga() {
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') return 99;
  const esDemo = Boolean(sessionStorage.getItem('smk_token') || localStorage.getItem('sensometrika_demo_token'));
  if (esDemo) return 2;
  return 3;
}

btnIniciar.addEventListener('click', () => {
  if (estado === 'IDLE') {
    iniciarTanda();
  }
});

visor.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  procesarAccion();
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter') {
    e.preventDefault();
    if (estado === 'IDLE' && !btnIniciar.disabled) {
      iniciarTanda();
    } else {
      procesarAccion();
    }
  }
});

function iniciarTanda() {
  estado = 'WAITING';
  btnIniciar.disabled = true;
  estimuloActual = 0;
  tiemposRespuesta = [];
  lapsosAtencion = 0;
  lblLapsos.innerText = '0';
  
  badgeFase.innerText = fase === 'DEMO' ? '🟡 Test de Fatiga (Demo)' : '🔴 Test de Fatiga (Oficial)';
  statusText.innerText = 'Atención constante... Esperando estímulo.';
  
  lanzarSiguienteEstimulo();
}

function lanzarSiguienteEstimulo() {
  if (estimuloActual >= totalEstimulos) {
    finalizarPrueba();
    return;
  }

  estado = 'WAITING';
  txtVisor.innerText = 'Esperando...';
  visor.className = 'contenedor-visor';

  // Intervalo aleatorio entre 2 y 5 segundos para evitar automatismo
  const demora = Math.floor(Math.random() * 3000) + 2000;

  clearTimeout(timerEstimulo);
  timerEstimulo = setTimeout(() => {
    activarEstimuloVisual();
  }, demora);
}

function activarEstimuloVisual() {
  estado = 'ACTIVE';
  tiempoInicio = performance.now();
  txtVisor.innerText = '¡PRESIONE!';
  visor.className = 'contenedor-visor activo';
}

function procesarAccion() {
  if (estado === 'WAITING') {
    // Anticipación en prueba de fatiga
    lapsosAtencion++;
    lblLapsos.innerText = lapsosAtencion;
    clearTimeout(timerEstimulo);
    txtVisor.innerText = '⚠️ ¡Anticipación!';
    visor.className = 'contenedor-visor';
    statusText.innerText = 'Presionaste antes de tiempo. Mantén la calma.';
    
    setTimeout(() => {
      lanzarSiguienteEstimulo();
    }, 1200);

  } else if (estado === 'ACTIVE') {
    const latencia = Math.round(performance.now() - tiempoInicio);
    tiemposRespuesta.push(latencia);
    estimuloActual++;

    lblEstimulo.innerText = `${estimuloActual} / ${totalEstimulos}`;
    lblLatencia.innerText = `${latencia} ms`;
    txtVisor.innerText = `${latencia} ms`;
    visor.className = 'contenedor-visor';

    if (latencia > 500) {
      lapsosAtencion++;
      lblLapsos.innerText = lapsosAtencion;
    }

    if ('vibrate' in navigator) navigator.vibrate(30);

    setTimeout(() => {
      lanzarSiguienteEstimulo();
    }, 1000);
  }
}

function finalizarPrueba() {
  estado = 'IDLE';
  const promedio = Math.round(tiemposRespuesta.reduce((a,b)=>a+b,0) / tiemposRespuesta.length);
  
  if (fase === 'DEMO') {
    statusText.innerText = `Calibración lista (Promedio: ${promedio} ms). Iniciando Oficial...`;
    fase = 'OFICIAL';
    totalEstimulos = 10; // 10 estímulos para la prueba oficial de fatiga
    setTimeout(() => {
      iniciarTanda();
    }, 2000);
  } else {
    statusText.innerText = `Prueba de Fatiga Completa. Promedio: ${promedio} ms | Lapsos: ${lapsosAtencion}`;
    txtVisor.innerText = 'COMPLETADO';
    btnIniciar.disabled = false;
    btnIniciar.innerText = 'Reiniciar Prueba';

    localStorage.setItem('sensometrika_fatiga', JSON.stringify({
      promedioLatencia: promedio,
      lapsos: lapsosAtencion,
      aprobado: promedio <= 400 && lapsosAtencion <= 1
    }));

    alert(`Test de Resistencia a la Fatiga Finalizado\nLatencia Media: ${promedio} ms\nLapsos detectados: ${lapsosAtencion}\nEstado: ${promedio <= 400 && lapsosAtencion <= 1 ? 'APROBADO' : 'OBSERVADO'}`);
    window.location.href = 'demo.html';
  }
}