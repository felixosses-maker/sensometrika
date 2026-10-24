/* ==========================================================================
   SENSOMETRIKA - MÓDULO: RESISTENCIA A LA FATIGA / PVT (fatiga.js)
   • Monitoreo de atención sostenida y detección de micro-sueños
   • MODO DEMO / SINGLE / B2B: Sesión única, aislamiento por RUT y retorno dinámico
   ========================================================================== */

const visor = document.getElementById('visorFatiga');
const txtVisor = document.getElementById('txtVisor');
const btnIniciar = document.getElementById('btnIniciarFatiga');
const statusText = document.getElementById('statusText');
const badgeFase = document.getElementById('badgeFase');
const lblEstimulo = document.getElementById('lblEstimulo');
const lblLatencia = document.getElementById('lblLatencia');
const lblLapsos = document.getElementById('lblLapsos');

// DETECCIÓN DINÁMICA DE PARÁMETROS URL Y MODO DEMO
const urlParams = new URLSearchParams(window.location.search);
const esModoDemo = urlParams.get('demo') === 'true' || urlParams.get('single') === 'true';
const returnUrl = urlParams.get('returnUrl') ? decodeURIComponent(urlParams.get('returnUrl')) : null;

// CAPTURA DE RUT Y SESIÓN ÚNICA PARA AISLAMIENTO B2B
const rutEvalFatiga = urlParams.get('rut') || 'GENERICO';
const cleanRutFatiga = rutEvalFatiga.replace(/[^0-9Kk]/g, '');
const sessionParamFatiga = urlParams.get('session') || '';

// LLAVES DE ALMACENAMIENTO AISLADAS POR SESIÓN Y RUT
const claveHistorialFatiga = sessionParamFatiga 
    ? `sensometrika_historial_fatiga_karolinska_${cleanRutFatiga}_${sessionParamFatiga}` 
    : `sensometrika_historial_fatiga_${cleanRutFatiga}`;

const claveLastFatiga = sessionParamFatiga 
    ? `sensometrika_last_fatiga_karolinska_${cleanRutFatiga}_${sessionParamFatiga}` 
    : `sensometrika_last_fatiga_${cleanRutFatiga}`;

// LIMPIEZA EXCLUSIVA EN MODO DEMOSTRACIÓN (Sin afectar ejecuciones reales pagadas)
if (esModoDemo) {
  localStorage.removeItem('sensometrika_fatiga_completado');
}

let fase = 'DEMO';
let estado = 'IDLE'; // IDLE, WAITING, ACTIVE
let estimuloActual = 0;
let totalEstimulos = esModoDemo ? 2 : 5; // 2 estímulos en demo para agilizar
let tiemposRespuesta = [];
let lapsosAtencion = 0;
let timerEstimulo = null;
let tiempoInicio = 0;

function obtenerMaximoSimulacionesFatiga() {
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') return 99;
  if (esModoDemo) return 1;
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
  if (lblLapsos) lblLapsos.innerText = '0';
  
  if (badgeFase) {
    badgeFase.innerText = fase === 'DEMO' 
      ? (esModoDemo ? '🟡 ensayando Calibración' : '🟡 Test de Fatiga (Demo)') 
      : '🔴 Test de Fatiga (Oficial)';
  }
  if (statusText) statusText.innerText = 'Atención constante... Esperando estímulo.';
  
  lanzarSiguienteEstimulo();
}

function lanzarSiguienteEstimulo() {
  if (estimuloActual >= totalEstimulos) {
    finalizarPrueba();
    return;
  }

  estado = 'WAITING';
  if (txtVisor) txtVisor.innerText = 'Esperando...';
  if (visor) visor.className = 'contenedor-visor';

  // Intervalo aleatorio entre 1.5 y 3.5 segundos
  const demora = Math.floor(Math.random() * 2000) + 1500;

  clearTimeout(timerEstimulo);
  timerEstimulo = setTimeout(() => {
    activarEstimuloVisual();
  }, demora);
}

function activarEstimuloVisual() {
  estado = 'ACTIVE';
  tiempoInicio = performance.now();
  if (txtVisor) txtVisor.innerText = '¡PRESIONE!';
  if (visor) visor.className = 'contenedor-visor activo';
}

function procesarAccion() {
  if (estado === 'WAITING') {
    // Anticipación en prueba de fatiga
    lapsosAtencion++;
    if (lblLapsos) lblLapsos.innerText = lapsosAtencion;
    clearTimeout(timerEstimulo);
    if (txtVisor) txtVisor.innerText = '⚠️ ¡Anticipación!';
    if (visor) visor.className = 'contenedor-visor';
    if (statusText) statusText.innerText = 'Presionaste antes de tiempo. Mantén la calma.';
    
    setTimeout(() => {
      lanzarSiguienteEstimulo();
    }, 1200);

  } else if (estado === 'ACTIVE') {
    const latencia = Math.round(performance.now() - tiempoInicio);
    tiemposRespuesta.push(latencia);
    estimuloActual++;

    if (lblEstimulo) lblEstimulo.innerText = `${estimuloActual} / ${totalEstimulos}`;
    if (lblLatencia) lblLatencia.innerText = `${latencia} ms`;
    if (txtVisor) txtVisor.innerText = `${latencia} ms`;
    if (visor) visor.className = 'contenedor-visor';

    if (latencia > 500) {
      lapsosAtencion++;
      if (lblLapsos) lblLapsos.innerText = lapsosAtencion;
    }

    if ('vibrate' in navigator) navigator.vibrate(30);

    setTimeout(() => {
      lanzarSiguienteEstimulo();
    }, 1000);
  }
}

function finalizarPrueba() {
  estado = 'IDLE';
  const promedio = Math.round(tiemposRespuesta.reduce((a, b) => a + b, 0) / (tiemposRespuesta.length || 1));
  
  if (fase === 'DEMO') {
    if (statusText) statusText.innerText = `Calibración lista (Promedio: ${promedio} ms). Iniciando Oficial...`;
    fase = 'OFICIAL';
    totalEstimulos = esModoDemo ? 3 : 10; // 3 estímulos en modo demo, 10 en oficial real
    setTimeout(() => {
      iniciarTanda();
    }, 1500);
  } else {
    if (statusText) statusText.innerText = `Prueba Completa. Promedio: ${promedio} ms | Lapsos: ${lapsosAtencion}`;
    if (txtVisor) txtVisor.innerText = 'COMPLETADO';
    if (btnIniciar) {
      btnIniciar.disabled = false;
      btnIniciar.innerText = 'Reiniciar Prueba';
    }

    const aprobado = promedio <= 400 && lapsosAtencion <= 1;

    // Guardado riguroso en el historial aislado por sesión
    let historialActual = JSON.parse(localStorage.getItem(claveHistorialFatiga)) || [];
    historialActual.push({
      promedioLatencia: promedio,
      lapsos: lapsosAtencion,
      aprobado: aprobado,
      fecha: new Date().toISOString()
    });
    localStorage.setItem(claveHistorialFatiga, JSON.stringify(historialActual));

    // Guardado del último resultado individual para trazabilidad del menú B2B y consola
    localStorage.setItem(claveLastFatiga, JSON.stringify({
      promedioLatencia: promedio,
      lapsos: lapsosAtencion,
      aprobado: aprobado,
      go_no_go_flag: aprobado,
      fecha: new Date().toISOString()
    }));

    // DESTINO DE RETORNO INTELIGENTE (Prioriza returnUrl enviado desde las demos)
    const urlDestino = returnUrl || (esModoDemo ? 'demo_b2b_apr.html' : 'menu.html');

    setTimeout(() => {
      alert(`Test de Resistencia a la Fatiga Finalizado\nLatencia Media: ${promedio} ms\nLapsos detectados: ${lapsosAtencion}\nEstado: ${aprobado ? 'APROBADO' : 'OBSERVADO'}`);
      window.location.href = urlDestino;
    }, 400);
  }
}