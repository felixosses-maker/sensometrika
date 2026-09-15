/* ==========================================================================
   SENSOMETRIKA - MÓDULO 5: TAMIZAJE AUDITIVO (audicion.js)
   • 1 Demo de comprobación biaural de canales estéreo
   • Conteo y bloqueo 1/3, 2/3 y 3/3 mediante CreditManager
   • Variación aleatoria anti-memorización de pausas, frecuencias y lados
   ========================================================================== */
const chkAudifonos = document.getElementById('chk-audifonos');
const btnIniciar = document.getElementById('btn-iniciar-audio');
const panelEstado = document.getElementById('panel-estado');
const zonaBotones = document.getElementById('zona-botones-oidos');
const btnIzq = document.getElementById('btn-oido-izq');
const btnDer = document.getElementById('btn-oido-der');
const cajaAviso = document.getElementById('caja-aviso-audifonos');
const zonaCoordinacion = document.getElementById('zona-coordinacion-audio');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let audioCtx = null;
let indiceTono = 0;
let aciertos = 0;
let tonoActivo = null;
let esperandoRespuesta = false;
let bateriaTonos = [];

const FRECUENCIAS = [500, 1000, 2000, 4000];

window.addEventListener('DOMContentLoaded', () => {
  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'auditivo');

  if (!CreditManager.puedeRendir('auditivo')) {
    bloquearModuloPorCupo();
    return;
  }

  if (CreditManager.demoYaRealizado('auditivo')) {
    prepararVistaOficialDirecta();
  }
});

function bloquearModuloPorCupo() {
  btnIniciar.disabled = true;
  btnIniciar.style.opacity = '0.4';
  btnIniciar.innerText = 'Cupo Bloqueado (3/3 Realizadas)';
  panelEstado.innerText = 'Has alcanzado el límite de 3 simulaciones oficiales para este módulo.';
  panelEstado.style.color = '#f87171';
  cajaAviso.style.display = 'none';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado (3 de 3)</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">Completaste todas las simulaciones de tu Plan.</p>
      <a href="menu.html" class="btn-principal" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  const numSim = CreditManager.obtenerNumeroSimulacionActual('auditivo');
  panelEstado.innerText = 'Marca la casilla para iniciar tu Simulación Oficial.';
  panelEstado.style.color = '#38bdf8';
  btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de 3)`;
}

chkAudifonos.addEventListener('change', () => {
  if (chkAudifonos.checked) {
    btnIniciar.disabled = false;
    btnIniciar.style.opacity = '1';
    btnIniciar.style.backgroundColor = (modo === 'OFICIAL') ? '#22c55e' : '#0284c7';
  } else {
    btnIniciar.disabled = true;
    btnIniciar.style.opacity = '0.5';
  }
});

function generarBateriaAleatoria() {
  const lados = ['IZQ', 'DER'];
  const lista = [];
  const cantidad = (modo === 'DEMO') ? 2 : 6;

  for (let i = 0; i < cantidad; i++) {
    const f = FRECUENCIAS[Math.floor(Math.random() * FRECUENCIAS.length)];
    const lado = lados[Math.floor(Math.random() * lados.length)];
    const pausaPrevia = Math.floor(Math.random() * (2600 - 1400 + 1)) + 1400; // Silencio estocástico
    lista.push({ freq: f, pan: lado === 'IZQ' ? -1 : 1, ladoCorrecto: lado, retardo: pausaPrevia });
  }
  return lista;
}

btnIniciar.addEventListener('click', () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  cajaAviso.style.display = 'none';
  btnIniciar.style.display = 'none';
  zonaBotones.style.display = 'grid';

  indiceTono = 0;
  aciertos = 0;
  bateriaTonos = generarBateriaAleatoria();
  lanzarSiguienteEstimulo();
});

function lanzarSiguienteEstimulo() {
  esperandoRespuesta = false;
  btnIzq.disabled = true;
  btnDer.disabled = true;
  panelEstado.innerText = 'Atento... escuchando silencio ambiental';
  panelEstado.style.color = '#94a3b8';

  const t = bateriaTonos[indiceTono];

  setTimeout(() => {
    emitirTonoPuro(t.freq, t.pan, 0.45);
    panelEstado.innerText = '¿En qué oído escuchaste el tono?';
    panelEstado.style.color = '#38bdf8';
    esperandoRespuesta = true;
    btnIzq.disabled = false;
    btnDer.disabled = false;
  }, t.retardo);
}

function emitirTonoPuro(frecuencia, paneo, duracion) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracion);

  // Paneo binaural
  if (audioCtx.createStereoPanner) {
    const panner = audioCtx.createStereoPanner();
    panner.pan.setValueAtTime(paneo, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(audioCtx.destination);
  } else {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
  }

  osc.start();
  osc.stop(audioCtx.currentTime + duracion);
}

function registrarRespuestaOido(ladoPresionado) {
  if (!esperandoRespuesta) return;
  esperandoRespuesta = false;

  const t = bateriaTonos[indiceTono];
  if (ladoPresionado === t.ladoCorrecto) aciertos++;

  indiceTono++;
  if (indiceTono < bateriaTonos.length) {
    lanzarSiguienteEstimulo();
  } else {
    finalizarTestAuditivo();
  }
}

btnIzq.addEventListener('click', () => registrarRespuestaOido('IZQ'));
btnDer.addEventListener('click', () => registrarRespuestaOido('DER'));

function finalizarTestAuditivo() {
  zonaBotones.style.display = 'none';

  if (modo === 'DEMO') {
    CreditManager.marcarDemoCompletado('auditivo');
    const numSim = CreditManager.obtenerNumeroSimulacionActual('auditivo');
    panelEstado.innerText = `Calibración estéreo lista. Pasa a Simulación Oficial ${numSim} de 3.`;
    panelEstado.style.color = '#4ade80';

    cajaAviso.style.display = 'block';
    chkAudifonos.checked = false;
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = true;
    btnIniciar.style.opacity = '0.5';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de 3)`;
    btnIniciar.style.backgroundColor = '#22c55e';
    modo = 'OFICIAL';
  } else {
    const efectividad = Math.round((aciertos / 6) * 100);
    const aprobado = efectividad >= 80;
    const consumidas = CreditManager.registrarConsumo('auditivo');

    localStorage.setItem('sensometrika_auditivo', JSON.stringify({
      aciertos,
      efectividad,
      aprobado
    }));

    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'auditivo');
    const bloqueoTotal = consumidas >= CreditManager.LIMITE_SIMULACIONES;

    panelEstado.innerText = 'Tamizaje Auditivo Oficial completado.';

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#38bdf8' : '#ef4444'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
          ¡Simulación ${consumidas}/3 Finalizada!
        </h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 8px;">
          Efectividad auditiva: <strong style="color: #fff;">${efectividad}%</strong> (${aprobado ? 'Sin Alertas' : 'Observado'})
        </p>
        <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
          ${bloqueoTotal ? 'Has alcanzado el límite de 3/3 simulaciones de este módulo.' : `Te restan ${3 - consumidas} simulación(es) en este módulo.`}
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="informe.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:44px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
            📊 Ver Informe de Evaluación Consolidado →
          </a>
          <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:6px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}