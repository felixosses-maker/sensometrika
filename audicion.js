/* ==========================================================================
   1. VALIDACIÓN PREVIA DE USO (PLAN ACOMPAÑAMIENTO)
   ========================================================================== */
if (typeof SessionTimer !== 'undefined' && !SessionTimer.puedeUsarModulo('auditivo')) {
  alert('Ya has completado tu evaluación auditiva única incluida en el plan.');
  window.location.href = 'menu.html';
}

/* ==========================================================================
   2. CONFIGURACIÓN Y GENERACIÓN ESTOCÁSTICA
   ========================================================================== */
const FRECUENCIAS_BASE = [500, 1000, 1000, 2000, 2000, 4000];

function armarEstimulosAleatorios() {
  const canales = ['left', 'right'];
  const barajadas = [...FRECUENCIAS_BASE].sort(() => Math.random() - 0.5);

  return barajadas.map(freq => ({
    freq: freq,
    canal: canales[Math.floor(Math.random() * canales.length)]
  }));
}

const ESTIMULOS = armarEstimulosAleatorios();
let indiceEstimulo = 0;
let aciertosAudio = 0;
let aciertosIzquierdo = 0;
let aciertosDerecho = 0;
let puedeResponder = false;
let timeoutRespuesta = null;
let audioCtx = null;

function alternarGatekeeper() {
  const chk = document.getElementById('chk-audifonos');
  const btn = document.getElementById('btn-comenzar-audio');
  btn.disabled = !chk.checked;
}

function iniciarEvaluacionAuditiva() {
  document.getElementById('seccion-bloqueo-audifonos').style.display = 'none';
  const secActiva = document.getElementById('seccion-prueba-activa');
  secActiva.style.display = 'flex';

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  ejecutarEstimulo();
}

function reproducirTonoPuro(frecuencia, canal) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();
  const paneador = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

  oscilador.type = 'sine';
  oscilador.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);

  // Calibración acústica para evitar picos bruscos
  ganancia.gain.setValueAtTime(0.001, audioCtx.currentTime);
  ganancia.gain.exponentialRampToValueAtTime(0.20, audioCtx.currentTime + 0.12);
  ganancia.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.85);

  if (paneador) {
    paneador.pan.setValueAtTime(canal === 'left' ? -1.0 : 1.0, audioCtx.currentTime);
    oscilador.connect(paneador);
    paneador.connect(ganancia);
  } else {
    oscilador.connect(ganancia);
  }

  ganancia.connect(audioCtx.destination);
  oscilador.start(audioCtx.currentTime + 0.05);
  oscilador.stop(audioCtx.currentTime + 0.95);
}

function ejecutarEstimulo() {
  puedeResponder = false;
  const est = ESTIMULOS[indiceEstimulo];

  document.getElementById('metrica-paso').innerText = `${indiceEstimulo + 1}/${ESTIMULOS.length}`;
  document.getElementById('metrica-frecuencia').innerText = `${est.freq} Hz`;
  document.getElementById('metrica-aciertos-audio').innerText = aciertosAudio;

  const panel = document.getElementById('panel-estado');
  panel.innerText = 'Atento... emitiendo tono';
  panel.style.color = '#38bdf8';

  // Silencio aleatorio entre 1.0s y 2.2s anti-anticipación
  const esperaAleatoria = 1000 + Math.random() * 1200;

  setTimeout(() => {
    reproducirTonoPuro(est.freq, est.canal);
    puedeResponder = true;
    panel.innerText = '¿En qué oído escuchaste el pitido?';
    panel.style.color = '#f8fafc';

    timeoutRespuesta = setTimeout(() => {
      if (puedeResponder) {
        avanzarEstimulo(false);
      }
    }, 3200);
  }, esperaAleatoria);
}

function responderLado(ladoElegido) {
  if (!puedeResponder) return;
  clearTimeout(timeoutRespuesta);
  puedeResponder = false;

  const est = ESTIMULOS[indiceEstimulo];
  const esCorrecto = (ladoElegido === est.canal);

  if (esCorrecto) {
    aciertosAudio++;
    if (est.canal === 'left') aciertosIzquierdo++;
    if (est.canal === 'right') aciertosDerecho++;
  }

  avanzarEstimulo(esCorrecto);
}

function avanzarEstimulo(acerto) {
  const panel = document.getElementById('panel-estado');
  panel.innerText = acerto ? '✅ Tono percibido' : '❌ No percibido';
  panel.style.color = acerto ? '#4ade80' : '#f87171';

  indiceEstimulo++;
  if (indiceEstimulo < ESTIMULOS.length) {
    setTimeout(() => {
      ejecutarEstimulo();
    }, 900);
  } else {
    finalizarScreeningAuditivo();
  }
}

function finalizarScreeningAuditivo() {
  document.getElementById('metrica-aciertos-audio').innerText = `${aciertosAudio}/${ESTIMULOS.length}`;

  const sinAlertas = aciertosAudio >= 5;
  const dictamen = sinAlertas 
    ? 'SIN ALERTAS PREVIAS' 
    : 'ALERTA: Sugiere audiometría clínica preventiva';

  localStorage.setItem('sensometrika_audicion', JSON.stringify({
    aciertosIzquierdo,
    aciertosDerecho,
    total: aciertosAudio,
    dictamenAuditivo: dictamen,
    aprobado: sinAlertas,
    audifonosConfirmados: true
  }));

  // Consumir el intento único
  if (typeof SessionTimer !== 'undefined') {
    SessionTimer.consumirUsoModulo('auditivo');
  }

  const panel = document.getElementById('panel-estado');
  panel.innerText = dictamen;
  panel.style.color = sinAlertas ? '#4ade80' : '#ef4444';

  setTimeout(() => {
    window.location.href = 'menu.html';
  }, 2200);
}