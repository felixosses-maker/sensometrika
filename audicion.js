/* ==========================================================================
   SENSOMETRIKA - MÓDULO 5: TAMIZAJE AUDITIVO (audicion.js)
   • Gatekeeper con checkbox obligatorio de audífonos estéreo
   • Desbloqueo activo del motor Web Audio API (AudioContext)
   • Batería aleatoria anti-memorización (500 a 4000 Hz)
   • Fase Demo (2 tonos) -> Fase Oficial (6 tonos)
   • Descuento estricto en CreditManager y salida directa a informe.html
   ========================================================================== */

const chkAudifonos = document.getElementById('chk-audifonos');
const btnIniciar = document.getElementById('btn-iniciar-audio');
const cajaGatekeeper = document.getElementById('caja-gatekeeper');
const panelInstruccion = document.getElementById('panel-instruccion');
const grillaDiscriminacion = document.getElementById('grilla-discriminacion');
const btnIzq = document.getElementById('btn-oido-izq');
const btnDer = document.getElementById('btn-oido-der');
const txtEstadoAudio = document.getElementById('txt-estado-audio');

const badgeModo = document.getElementById('badge-modo');
const txtPlacaModo = document.getElementById('txt-placa-modo');
const txtPlacaSub = document.getElementById('txt-placa-sub');

const metricaFrecuencia = document.getElementById('metrica-frecuencia');
const metricaPaso = document.getElementById('metrica-paso');
const metricaEfectividad = document.getElementById('metrica-efectividad');
const zonaCoordinacion = document.getElementById('zona-coordinacion-audio');

// Modal
const modalGuia = document.getElementById('modal-guia');
const btnAbrirAyuda = document.getElementById('btn-abrir-ayuda');
const btnCerrarAyuda = document.getElementById('btn-cerrar-ayuda');

if (btnAbrirAyuda) btnAbrirAyuda.onclick = () => modalGuia.style.display = 'flex';
if (btnCerrarAyuda) btnCerrarAyuda.onclick = () => modalGuia.style.display = 'none';

let audioCtx = null;
let fase = 'DEMO'; // 'DEMO', 'PAUSA_OFICIAL', 'OFICIAL', 'FINALIZADO'
let bateriaActiva = [];
let pasoActual = 0;
let aciertos = 0;
let esperandoRespuesta = false;
let timeoutFallo = null;

const FRECUENCIAS = [500, 1000, 2000, 4000];

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.puedeRendir('auditivo')) {
      bloquearModuloPorCupo();
      return;
    }
  }

  configurarDemo();
});

function bloquearModuloPorCupo() {
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('auditivo') : 4;
  badgeModo.innerText = `Cupo Agotado (${max} de ${max})`;
  badgeModo.style.color = '#f87171';
  cajaGatekeeper.style.display = 'none';
  btnIniciar.style.display = 'none';
  panelInstruccion.innerText = 'Has completado tus simulaciones autorizadas para este módulo.';
  panelInstruccion.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1px solid #ef4444; border-radius:10px; padding:14px; text-align:center; margin-top:8px;">
      <a href="informe.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; margin-bottom:8px;">
        📊 Ver Informe y Dictamen Final →
      </a>
      <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none;">Volver al Menú Principal</a>
    </div>
  `;
}

// 1. GATEKEEPER Y ACTIVACIÓN DEL BOTÓN
chkAudifonos.addEventListener('change', () => {
  if (chkAudifonos.checked) {
    btnIniciar.disabled = false;
    panelInstruccion.innerText = (fase === 'DEMO') 
      ? 'Presiona para iniciar los 2 tonos de calibración.' 
      : 'Presiona para iniciar tu evaluación oficial.';
    panelInstruccion.style.color = '#38bdf8';
  } else {
    btnIniciar.disabled = true;
    panelInstruccion.innerText = 'Marca la casilla de confirmación para habilitar la prueba sonora.';
    panelInstruccion.style.color = '#94a3b8';
  }
});

// 2. CONFIGURACIÓN DE FASE DEMO
function configurarDemo() {
  fase = 'DEMO';
  pasoActual = 0;
  aciertos = 0;

  badgeModo.innerText = '🟡 Calibración Acústica (Demo)';
  badgeModo.style.color = '#facc15';
  badgeModo.style.background = 'rgba(250, 204, 21, 0.1)';
  badgeModo.style.borderColor = 'rgba(250, 204, 21, 0.25)';

  txtPlacaModo.innerText = '🟡 Calibración Biaural';
  txtPlacaModo.style.color = '#facc15';
  txtPlacaSub.innerText = '2 Tonos de Ensayo';

  metricaFrecuencia.innerText = '1000 Hz';
  metricaPaso.innerText = '0 / 2';
  metricaEfectividad.innerText = '100%';

  cajaGatekeeper.style.display = 'flex';
  chkAudifonos.checked = false;
  btnIniciar.disabled = true;
  btnIniciar.style.display = 'block';
  btnIniciar.style.backgroundColor = '#0284c7';
  btnIniciar.innerText = 'Iniciar Calibración Acústica (Demo)';

  grillaDiscriminacion.style.display = 'none';
}

// 3. GENERADOR ESTOCÁSTICO ANTI-MEMORIZACIÓN
function generarBateria(cantidad) {
  const lista = [];
  const lados = ['IZQ', 'DER'];

  for (let i = 0; i < cantidad; i++) {
    const freq = FRECUENCIAS[Math.floor(Math.random() * FRECUENCIAS.length)];
    const lado = lados[Math.floor(Math.random() * lados.length)];
    const pausaPrevia = Math.floor(Math.random() * 1200) + 1400; // 1.4 a 2.6 s
    lista.push({ freq, lado, pausaPrevia });
  }
  return lista;
}

// 4. INICIO DE LA PRUEBA (DESBLOQUEA AUDIO API)
btnIniciar.addEventListener('click', () => {
  // Inicialización explícita dentro del gesto del usuario para evitar bloqueo del navegador
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  cajaGatekeeper.style.display = 'none';
  btnIniciar.style.display = 'none';
  grillaDiscriminacion.style.display = 'grid';

  pasoActual = 0;
  aciertos = 0;
  bateriaActiva = (fase === 'DEMO') ? generarBateria(2) : generarBateria(6);

  metricaPaso.innerText = `0 / ${bateriaActiva.length}`;
  lanzarEstimulo();
});

// 5. EMISIÓN DE TONOS Y PANTALLA
function lanzarEstimulo() {
  if (pasoActual >= bateriaActiva.length) {
    if (fase === 'DEMO') {
      concluirDemo();
    } else {
      finalizarPruebaAuditiva();
    }
    return;
  }

  esperandoRespuesta = false;
  btnIzq.disabled = true;
  btnDer.disabled = true;

  const t = bateriaActiva[pasoActual];
  metricaFrecuencia.innerText = `${t.freq} Hz`;
  metricaPaso.innerText = `${pasoActual + 1} / ${bateriaActiva.length}`;

  txtEstadoAudio.innerText = 'Atento... escuchando silencio';
  txtEstadoAudio.style.color = '#94a3b8';
  panelInstruccion.innerText = 'Escuchando ambiente...';
  panelInstruccion.style.color = '#94a3b8';

  setTimeout(() => {
    reproducirTonoPuro(t.freq, t.lado);

    esperandoRespuesta = true;
    btnIzq.disabled = false;
    btnDer.disabled = false;

    txtEstadoAudio.innerText = '¿En qué oído percibiste el sonido?';
    txtEstadoAudio.style.color = '#38bdf8';
    panelInstruccion.innerText = 'Presiona Oído Izquierdo u Oído Derecho';
    panelInstruccion.style.color = '#38bdf8';

    // Ventana de 3.5 segundos para responder
    clearTimeout(timeoutFallo);
    timeoutFallo = setTimeout(() => {
      if (esperandoRespuesta) {
        registrarRespuesta('NINGUNO');
      }
    }, 3500);
  }, t.pausaPrevia);
}

function reproducirTonoPuro(freq, lado) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.85);

  if (panner) {
    panner.pan.setValueAtTime(lado === 'IZQ' ? -1.0 : 1.0, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(audioCtx.destination);
  } else {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
  }

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.9);
}

function registrarRespuesta(ladoElegido) {
  if (!esperandoRespuesta) return;
  clearTimeout(timeoutFallo);
  esperandoRespuesta = false;

  btnIzq.disabled = true;
  btnDer.disabled = true;

  const t = bateriaActiva[pasoActual];
  const acerto = (ladoElegido === t.lado);

  if (acerto) aciertos++;
  pasoActual++;

  const pct = Math.round((aciertos / pasoActual) * 100);
  metricaEfectividad.innerText = `${pct}%`;

  txtEstadoAudio.innerText = acerto ? '✔ Tono Reconocido' : '✖ Estímulo No Percibido o Incorrecto';
  txtEstadoAudio.style.color = acerto ? '#4ade80' : '#f87171';

  setTimeout(lanzarEstimulo, 800);
}

btnIzq.onclick = () => registrarRespuesta('IZQ');
btnDer.onclick = () => registrarRespuesta('DER');

// 6. PAUSA TÉCNICA ENTRE FASES
function concluirDemo() {
  fase = 'PAUSA_OFICIAL';
  grillaDiscriminacion.style.display = 'none';

  const num = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('auditivo') : 1;
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('auditivo') : 4;

  badgeModo.innerText = `🔴 Simulación Oficial: ${num} de ${max}`;
  badgeModo.style.color = '#38bdf8';
  badgeModo.style.background = 'rgba(56, 189, 248, 0.1)';
  badgeModo.style.borderColor = 'rgba(56, 189, 248, 0.25)';

  txtPlacaModo.innerText = '🔴 Evaluación Activa';
  txtPlacaModo.style.color = '#38bdf8';
  txtPlacaSub.innerText = '6 Tonos Clínicos';

  txtEstadoAudio.innerText = '¡Calibración estéreo completada!';
  txtEstadoAudio.style.color = '#4ade80';

  cajaGatekeeper.style.display = 'flex';
  chkAudifonos.checked = false;

  btnIniciar.style.display = 'block';
  btnIniciar.disabled = true;
  btnIniciar.style.backgroundColor = '#22c55e';
  btnIniciar.innerText = `Iniciar Simulación Oficial (${num} de ${max})`;

  panelInstruccion.innerText = 'Vuelve a confirmar tus audífonos para iniciar el examen oficial.';
  panelInstruccion.style.color = '#94a3b8';
}

// 7. FINALIZACIÓN Y REGISTRO EN CREDITMANAGER
function finalizarPruebaAuditiva() {
  fase = 'FINALIZADO';
  grillaDiscriminacion.style.display = 'none';

  let consumidas = 1;
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('auditivo');
  }

  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('auditivo') : 4;
  const pct = Math.round((aciertos / bateriaActiva.length) * 100);
  const aprobado = pct >= 80;

  localStorage.setItem('sensometrika_auditivo', JSON.stringify({
    efectividad: pct,
    porcentaje: pct,
    aciertos: aciertos,
    total: bateriaActiva.length,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_audicion')) || [];
  historial.push({
    simulacion: consumidas,
    efectividad: pct,
    aprobado: aprobado
  });
  localStorage.setItem('sensometrika_historial_audicion', JSON.stringify(historial));

  txtEstadoAudio.innerText = `Evaluación Finalizada: ${pct}% de discriminación`;
  txtEstadoAudio.style.color = aprobado ? '#4ade80' : '#f87171';
  panelInstruccion.innerText = aprobado ? 'Audición normal sin alteraciones referenciales' : 'Observado: Frecuencias no percibidas';
  panelInstruccion.style.color = aprobado ? '#4ade80' : '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:12px; padding:16px; text-align:center; margin-top:8px;">
      <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.05rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 12px 0;">
        Efectividad Global: <strong style="color:#38bdf8;">${pct}%</strong> &nbsp;|&nbsp; 
        Aciertos: <strong style="color:#fff;">${aciertos}/${bateriaActiva.length}</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <a href="informe.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:0.92rem;">
          📊 Ver Informe y Dictamen Final →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}