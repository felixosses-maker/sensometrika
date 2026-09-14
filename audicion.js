let audioCtx = null;
let indiceTono = 0;
let aciertosAudio = 0;
let estimuloActivo = false;

const TONOS = [
  { freq: 1000, pan: -1, lado: 'left' },
  { freq: 2000, pan: 1,  lado: 'right' },
  { freq: 500,  pan: -1, lado: 'left' },
  { freq: 4000, pan: 1,  lado: 'right' },
  { freq: 1000, pan: 1,  lado: 'right' },
  { freq: 2000, pan: -1, lado: 'left' }
];

const chkAudifonos = document.getElementById('chk-audifonos');
const btnComenzar = document.getElementById('btn-comenzar-audio');
const secBloqueo = document.getElementById('seccion-bloqueo-audifonos');
const secPrueba = document.getElementById('seccion-prueba-activa');
const txtPaso = document.getElementById('metrica-paso');
const txtFreq = document.getElementById('metrica-frecuencia');
const txtAciertos = document.getElementById('metrica-aciertos-audio');
const panelEstado = document.getElementById('panel-estado');
const zonaCoordinacion = document.getElementById('zona-coordinacion-audicion');

function alternarGatekeeper() {
  if (chkAudifonos && btnComenzar) {
    btnComenzar.disabled = !chkAudifonos.checked;
    btnComenzar.style.opacity = chkAudifonos.checked ? '1' : '0.5';
  }
}

function iniciarEvaluacionAuditiva() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  if (secBloqueo && secPrueba) {
    secBloqueo.style.display = 'none';
    secPrueba.style.display = 'flex';
  }

  indiceTono = 0;
  aciertosAudio = 0;
  reproducirSiguienteTono();
}

function reproducirSiguienteTono() {
  if (indiceTono >= TONOS.length) {
    finalizarTamizajeAuditivo();
    return;
  }

  const tono = TONOS[indiceTono];
  txtPaso.innerText = `${indiceTono + 1}/6`;
  txtFreq.innerText = `${tono.freq} Hz`;
  txtAciertos.innerText = aciertosAudio;
  panelEstado.innerText = 'Escuchando tono puro... ¿Por cuál lado suena?';
  panelEstado.style.color = '#38bdf8';
  estimuloActivo = true;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(tono.freq, audioCtx.currentTime);

  // Curva de ganancia suave para evitar chasquidos acústicos
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

  if (panner) {
    panner.pan.setValueAtTime(tono.pan, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(audioCtx.destination);
  } else {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
  }

  osc.start(audioCtx.currentTime + 0.1);
  osc.stop(audioCtx.currentTime + 1.3);
}

function responderLado(ladoElegido) {
  if (!estimuloActivo) return;
  estimuloActivo = false;

  const tonoActual = TONOS[indiceTono];
  if (ladoElegido === tonoActual.lado) {
    aciertosAudio++;
  }

  indiceTono++;
  setTimeout(() => {
    reproducirSiguienteTono();
  }, 600);
}

function finalizarTamizajeAuditivo() {
  const efectividad = Math.round((aciertosAudio / 6) * 100);
  const aprobado = efectividad >= 80;

  // Persistir en memoria para el informe consolidado
  localStorage.setItem('sensometrika_audicion', JSON.stringify({
    aciertos: aciertosAudio,
    efectividad: efectividad,
    dictamen: aprobado ? 'SIN ALERTAS PREVIAS' : 'ALERTA: Sugiere audiometría clínica',
    aprobado: aprobado,
    audifonosDeclarados: true
  }));

  panelEstado.innerText = `Evaluación completada: ${efectividad}% de efectividad`;
  panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

  // Despliegue de la tarjeta final con salto al Certificado Global
  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; box-sizing: border-box;">
      <h3 style="color: #4ade80; font-size: 1.05rem; margin: 0 0 6px 0;">¡Batería de Exámenes Completada!</h3>
      <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0;">
        Has finalizado los 5 módulos de evaluación psicométrica y sensorial.
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="informe.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; font-size: 0.95rem; background-color: #0284c7; color: #fff; border-radius: 8px; font-weight: bold;">
          📊 Ver Certificado e Informe Global →
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
          Regresar al Menú Principal
        </a>
      </div>
    </div>
  `;
}