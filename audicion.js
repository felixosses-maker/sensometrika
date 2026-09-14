/* ==========================================================================
   MÓDULO 5: TAMIZAJE AUDITIVO BIAURAL (500 a 4000 Hz) - SENSOMETRIKA
   ========================================================================== */

const FRECUENCIAS_BASE = [1000, 2000, 4000, 500, 2000, 1000];

let audioCtx = null;
let estimulos = [];
let indiceEstimulo = 0;
let aciertos = 0;
let esperandoRespuesta = false;
let timeoutVentana = null;

// Referencias del DOM
const chkAudifonos = document.getElementById('chk-audifonos');
const boxGatekeeper = document.getElementById('box-gatekeeper');
const btnIniciar = document.getElementById('btn-iniciar-aud');
const contenedorInicio = document.getElementById('contenedor-boton-inicio');
const cajaBotonesOido = document.getElementById('caja-botones-oido');
const btnOidoIzq = document.getElementById('btn-oido-izq');
const btnOidoDer = document.getElementById('btn-oido-der');

const txtProgreso = document.getElementById('txt-progreso-aud');
const txtFrecuencia = document.getElementById('txt-frecuencia-aud');
const txtAciertos = document.getElementById('contador-aciertos-aud');
const txtEfectividad = document.getElementById('efectividad-aud');
const txtEstadoAcustico = document.getElementById('txt-estado-acustico');
const iconoOnda = document.getElementById('icono-onda');
const contenedorFinal = document.getElementById('contenedor-coordinacion-aud');

// 1. Desbloqueo del botón de inicio según el Checkbox
if (chkAudifonos && btnIniciar) {
  chkAudifonos.addEventListener('change', () => {
    btnIniciar.disabled = !chkAudifonos.checked;
    if (txtEstadoAcustico) {
      txtEstadoAcustico.innerText = chkAudifonos.checked
        ? '¡Listo! Presiona "Comenzar Evaluación Sonora"'
        : 'Marca la confirmación de audífonos para activar la prueba';
    }
  });
}

// 2. Barajado aleatorio de canales y frecuencias
function armarBateria() {
  const canales = ['IZQ', 'DER'];
  const barajadas = [...FRECUENCIAS_BASE].sort(() => Math.random() - 0.5);

  return barajadas.map(freq => ({
    hz: freq,
    canal: canales[Math.floor(Math.random() * canales.length)]
  }));
}

// 3. Inicio formal de la prueba al hacer click
if (btnIniciar) {
  btnIniciar.addEventListener('click', () => {
    // Inicialización explícita del AudioContext en el evento del usuario
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Ocultar Gatekeeper y botón de inicio
    if (boxGatekeeper) boxGatekeeper.style.display = 'none';
    if (contenedorInicio) contenedorInicio.style.display = 'none';

    // Mostrar los botones binaurales de respuesta
    if (cajaBotonesOido) cajaBotonesOido.style.display = 'grid';

    estimulos = armarBateria();
    indiceEstimulo = 0;
    aciertos = 0;

    lanzarEstimulo();
  });
}

// 4. Síntesis acústica sinusoidal pura con paneo estéreo
function reproducirTonoPuro(frecuencia, canal) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();
  const paneo = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

  oscilador.type = 'sine';
  oscilador.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);

  // Rampa de ganancia suave para evitar chasquidos acústicos
  ganancia.gain.setValueAtTime(0.001, audioCtx.currentTime);
  ganancia.gain.exponentialRampToValueAtTime(0.20, audioCtx.currentTime + 0.1);
  ganancia.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.95);

  if (paneo) {
    paneo.pan.setValueAtTime(canal === 'IZQ' ? -1.0 : 1.0, audioCtx.currentTime);
    oscilador.connect(paneo);
    paneo.connect(ganancia);
  } else {
    oscilador.connect(ganancia);
  }

  ganancia.connect(audioCtx.destination);
  oscilador.start(audioCtx.currentTime + 0.05);
  oscilador.stop(audioCtx.currentTime + 1.0);
}

// 5. Ciclo de estímulos
function lanzarEstimulo() {
  if (indiceEstimulo >= estimulos.length) {
    finalizarTamizaje();
    return;
  }

  esperandoRespuesta = false;
  deshabilitarBotonesRespuesta(true);

  const paso = estimulos[indiceEstimulo];
  if (txtProgreso) txtProgreso.innerText = `${indiceEstimulo + 1} / ${estimulos.length}`;
  if (txtFrecuencia) txtFrecuencia.innerText = `${paso.hz} Hz`;
  actualizarMetricas();

  if (txtEstadoAcustico) {
    txtEstadoAcustico.innerText = 'Escuchando tono...';
    txtEstadoAcustico.style.color = '#38bdf8';
  }
  if (iconoOnda) iconoOnda.innerText = '🔊';

  // Espera silenciosa aleatoria (entre 1.2s y 2.4s) anti-anticipación
  const esperaAleatoria = Math.floor(Math.random() * (2400 - 1200 + 1)) + 1200;

  setTimeout(() => {
    reproducirTonoPuro(paso.hz, paso.canal);

    setTimeout(() => {
      esperandoRespuesta = true;
      deshabilitarBotonesRespuesta(false);

      if (txtEstadoAcustico) {
        txtEstadoAcustico.innerText = '¿En qué oído escuchaste el pitido?';
        txtEstadoAcustico.style.color = '#facc15';
      }
      if (iconoOnda) iconoOnda.innerText = '👂';

      // Ventana límite de 3.5 segundos para responder
      clearTimeout(timeoutVentana);
      timeoutVentana = setTimeout(() => {
        if (esperandoRespuesta) {
          procesarRespuesta('TIMEOUT');
        }
      }, 3500);
    }, 400);
  }, esperaAleatoria);
}

function deshabilitarBotonesRespuesta(bloqueados) {
  if (btnOidoIzq) btnOidoIzq.disabled = bloqueados;
  if (btnOidoDer) btnOidoDer.disabled = bloqueados;
}

function procesarRespuesta(ladoElegido) {
  if (!esperandoRespuesta) return;
  clearTimeout(timeoutVentana);
  esperandoRespuesta = false;
  deshabilitarBotonesRespuesta(true);

  const paso = estimulos[indiceEstimulo];
  const acerto = (ladoElegido === paso.canal);

  if (acerto) {
    aciertos++;
    if ('vibrate' in navigator) navigator.vibrate(25);
    if (txtEstadoAcustico) {
      txtEstadoAcustico.innerText = '✅ Tono percibido correctamente';
      txtEstadoAcustico.style.color = '#4ade80';
    }
  } else {
    if (txtEstadoAcustico) {
      txtEstadoAcustico.innerText = ladoElegido === 'TIMEOUT' ? '⏱️ Tiempo agotado (No percibido)' : '❌ Lado incorrecto o no percibido';
      txtEstadoAcustico.style.color = '#f87171';
    }
  }

  indiceEstimulo++;
  actualizarMetricas();

  setTimeout(() => {
    lanzarEstimulo();
  }, 900);
}

function actualizarMetricas() {
  const ef = indiceEstimulo > 0 ? Math.round((aciertos / indiceEstimulo) * 100) : 0;
  if (txtAciertos) txtAciertos.innerText = aciertos;
  if (txtEfectividad) txtEfectividad.innerText = indiceEstimulo > 0 ? `${ef} %` : '-- %';
}

if (btnOidoIzq) btnOidoIzq.addEventListener('click', () => procesarRespuesta('IZQ'));
if (btnOidoDer) btnOidoDer.addEventListener('click', () => procesarRespuesta('DER'));

// 6. Cierre de prueba y redirección al informe final
function finalizarTamizaje() {
  if (cajaBotonesOido) cajaBotonesOido.style.display = 'none';

  const total = estimulos.length;
  const efectividadFinal = Math.round((aciertos / total) * 100);
  const aprobado = efectividadFinal >= 80;

  // Persistir en localStorage
  localStorage.setItem('sensometrika_auditivo', JSON.stringify({
    aciertos: aciertos,
    total: total,
    efectividad: efectividadFinal,
    aprobado: aprobado,
    audifonosDeclarados: true,
    fecha: new Date().toISOString()
  }));

  if (txtEstadoAcustico) txtEstadoAcustico.innerText = '';
  if (iconoOnda) iconoOnda.innerText = '✅';

  if (contenedorFinal) {
    contenedorFinal.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 16px; text-align: center; margin-top: 6px;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.05rem;">
          ${aprobado ? '¡Tamizaje Auditivo Culminado con Éxito!' : 'Tamizaje Auditivo Observado'} (${efectividadFinal}%)
        </h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin: 0 0 14px 0;">
          Aciertos biaurales registrados: <strong style="color: #fff;">${aciertos} de ${total}</strong> (Estándar legal: ≥ 80%).
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="informe.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 48px; background-color: #0284c7;">
            📊 Ver Dictamen e Informe Consolidado Final →
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}