// Referencias del DOM
const chkAudifonos = document.getElementById('chk-audifonos');
const btnComenzar = document.getElementById('btn-comenzar-test');
const seccionAviso = document.getElementById('seccion-aviso');
const seccionPrueba = document.getElementById('seccion-prueba');
const panelEstado = document.getElementById('panel-estado');
const txtFrecuencia = document.getElementById('txt-frecuencia');
const txtPaso = document.getElementById('txt-paso');
const txtAciertos = document.getElementById('txt-aciertos');
const txtSubtitulo = document.getElementById('txt-subtitulo-audio');
const btnIzquierdo = document.getElementById('btn-izquierdo');
const btnDerecho = document.getElementById('btn-derecho');
const btnNoEscucho = document.getElementById('btn-no-escucho');
const zonaCoordinacion = document.getElementById('zona-coordinacion-audio');

// Configuración de frecuencias normativas (D.S. N° 170: 500 a 4000 Hz)
const FRECUENCIAS_BASE = [1000, 2000, 4000, 500, 2000, 1000];

// Secuencia barajada al azar para evitar que se memorice el lado o la secuencia
function armarEstimulos() {
  const canales = ['IZQ', 'DER'];
  const frecuenciasBarajadas = [...FRECUENCIAS_BASE].sort(() => Math.random() - 0.5);

  return frecuenciasBarajadas.map(freq => ({
    hz: freq,
    canal: canales[Math.floor(Math.random() * canales.length)]
  }));
}

let estimulos = [];
let indicePaso = 0;
let aciertos = 0;
let aciertosIzquierdo = 0;
let aciertosDerecho = 0;
let esperandoRespuesta = false;
let timeoutVentana = null;

let audioCtx = null;

// 1. Control del Gatekeeper (Casilla obligatoria de audífonos)
chkAudifonos.addEventListener('change', (e) => {
  if (e.target.checked) {
    btnComenzar.style.opacity = '1';
    btnComenzar.style.pointerEvents = 'auto';
  } else {
    btnComenzar.style.opacity = '0.45';
    btnComenzar.style.pointerEvents = 'none';
  }
});

// 2. Inicio del Test y desbloqueo del motor Web Audio API
btnComenzar.addEventListener('click', () => {
  // Desbloqueo estricto de audio tras interacción de usuario
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  seccionAviso.style.display = 'none';
  seccionPrueba.style.display = 'block';

  estimulos = armarEstimulos();
  indicePaso = 0;
  aciertos = 0;
  aciertosIzquierdo = 0;
  aciertosDerecho = 0;

  lanzarEstimulo();
});

// 3. Síntesis acústica sinusoidal pura con paneo estéreo
function reproducirTono(frecuencia, lado) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();
  const paneo = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

  oscilador.type = 'sine';
  oscilador.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);

  // Calibración de rampa acústica suave
  ganancia.gain.setValueAtTime(0.001, audioCtx.currentTime);
  ganancia.gain.exponentialRampToValueAtTime(0.20, audioCtx.currentTime + 0.1);
  ganancia.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.85);

  if (paneo) {
    paneo.pan.setValueAtTime(lado === 'IZQ' ? -1.0 : 1.0, audioCtx.currentTime);
    oscilador.connect(paneo);
    paneo.connect(ganancia);
  } else {
    oscilador.connect(ganancia);
  }

  ganancia.connect(audioCtx.destination);
  oscilador.start(audioCtx.currentTime + 0.05);
  oscilador.stop(audioCtx.currentTime + 0.95);
}

// 4. Ciclo de estímulos y captura de respuestas
function lanzarEstimulo() {
  if (indicePaso >= estimulos.length) {
    finalizarTamizajeAuditivo();
    return;
  }

  esperandoRespuesta = false;
  const pasoActual = estimulos[indicePaso];

  txtPaso.innerText = `${indicePaso + 1}/${estimulos.length}`;
  txtFrecuencia.innerText = `${pasoActual.hz} Hz`;
  txtAciertos.innerText = aciertos;

  panelEstado.innerText = 'Escucha con atención...';
  panelEstado.style.color = '#38bdf8';
  txtSubtitulo.innerText = 'Emitiendo frecuencia pura...';

  // Espera silenciosa aleatoria (entre 1.1 y 2.2 s) anti-anticipación
  const esperaSilencio = Math.floor(Math.random() * (2200 - 1100 + 1)) + 1100;

  setTimeout(() => {
    reproducirTono(pasoActual.hz, pasoActual.canal);

    // Permitir respuesta tras iniciar el sonido
    setTimeout(() => {
      esperandoRespuesta = true;
      panelEstado.innerText = '¿En qué oído escuchaste el pitido?';
      panelEstado.style.color = '#facc15';
      txtSubtitulo.innerText = 'Selecciona el oído correspondiente';

      // Ventana de tiempo límite para responder (3.5 segundos)
      timeoutVentana = setTimeout(() => {
        if (esperandoRespuesta) {
          registrarRespuesta('TIMEOUT');
        }
      }, 3500);
    }, 400);
  }, esperaSilencio);
}

function registrarRespuesta(ladoElegido) {
  if (!esperandoRespuesta) return;
  clearTimeout(timeoutVentana);
  esperandoRespuesta = false;

  const pasoActual = estimulos[indicePaso];
  const esCorrecto = (ladoElegido === pasoActual.canal);

  if (esCorrecto) {
    aciertos++;
    if (pasoActual.canal === 'IZQ') aciertosIzquierdo++;
    if (pasoActual.canal === 'DER') aciertosDerecho++;
    panelEstado.innerText = '✅ Tono percibido correctamente';
    panelEstado.style.color = '#4ade80';
  } else {
    panelEstado.innerText = ladoElegido === 'TIMEOUT' ? '⏱️ Tiempo agotado (No percibido)' : '❌ Lado incorrecto o no percibido';
    panelEstado.style.color = '#f87171';
  }

  txtAciertos.innerText = aciertos;
  indicePaso++;

  setTimeout(() => {
    lanzarEstimulo();
  }, 900);
}

btnIzquierdo.addEventListener('click', () => registrarRespuesta('IZQ'));
btnDerecho.addEventListener('click', () => registrarRespuesta('DER'));
btnNoEscucho.addEventListener('click', () => registrarRespuesta('NO_ESCUCHO'));

// 5. Cierre definitivo, persistencia y coordinación al informe
function finalizarTamizajeAuditivo() {
  seccionPrueba.style.display = 'none';

  const efectividad = Math.round((aciertos / estimulos.length) * 100);
  const aprobado = efectividad >= 80;

  // Persistir resultado oficial en localStorage para que lo tome informe.html y menu.html
  localStorage.setItem('sensometrika_auditivo', JSON.stringify({
    aciertos: aciertos,
    aciertosIzquierdo: aciertosIzquierdo,
    aciertosDerecho: aciertosDerecho,
    total: estimulos.length,
    efectividad: efectividad,
    dictamen: aprobado ? 'SIN ALERTAS AUDITIVAS' : 'OBSERVADO: Sugiere audiometría clínica',
    aprobado: aprobado,
    audifonosConfirmados: true
  }));

  // Desplegar tarjeta oficial de fin de módulo
  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 18px; margin-top: 14px; text-align: center; width: 100%;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.15rem;">
        ${aprobado ? '¡Tamizaje Auditivo Culminado!' : 'Tamizaje Auditivo con Observación'}
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 14px;">
        Aciertos biaurales oficiales: <strong style="color: #ffffff;">${aciertos}/${estimulos.length} (${efectividad}%)</strong>
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="informe.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 48px; background-color: #0284c7; font-size: 0.95rem;">
          📊 Ver Dictamen e Informe Consolidado Final →
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}