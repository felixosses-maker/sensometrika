/* ==========================================================================
   SENSOMETRIKA - MÓDULO 4: SCREENING VISUAL COMPLETO (visual.js)
   • Carga directa e inmediata de opciones (Sin pantallas congeladas)
   • 3 Láminas cromáticas Ishihara generadas en Canvas
   • 3 Optotipos de agudeza visual E (Snellen estandarizado)
   • Monitoreo biométrico de distancia facial por cámara frontal
   • Descuento estricto en CreditManager ('visual')
   • Botones de navegación ergonómicos al concluir hacia Módulo 5 o Menú
   ========================================================================== */

const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#e27d60', patron: '#41b3a3', opciones: ['12', '79', 'No distingo', '8'] },
  { numero: '8',  fondo: '#85dcba', patron: '#e8a87c', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#c38d9e', patron: '#41b3a3', opciones: ['21', '74', 'No distingo', '71'] },
  { numero: '29', fondo: '#f4a261', patron: '#2a9d8f', opciones: ['70', '29', 'No distingo', '26'] }
];

const BANCO_OPTOTIPOS = [
  { orientacion: 0,   grados: 0,   direccion: 'Derecha',   tamano: '3.8rem' },
  { orientacion: 90,  grados: 90,  direccion: 'Abajo',     tamano: '2.8rem' },
  { orientacion: 180, grados: 180, direccion: 'Izquierda', tamano: '2.0rem' },
  { orientacion: 270, grados: 270, direccion: 'Arriba',    tamano: '1.5rem' }
];

let indiceActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
const TOTAL_ESTIMULOS = 6;
let distanciaValidada = true;
let seriePruebas = [];

// Elementos del DOM
const video = document.getElementById('video-camara');
const cajaCamara = document.getElementById('caja-camara');
const etiquetaDistancia = document.getElementById('etiqueta-distancia');
const estadoDistancia = document.getElementById('estado-distancia');
const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const instruccionPregunta = document.getElementById('instruccion-pregunta');
const contenedorCentral = document.getElementById('contenedor-central');

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.validarAccesoOBloquear('visual')) return;
  }
  generarBateriaAleatoria();
  iniciarCamara();
  cargarEstimuloActual();
});

function generarBateriaAleatoria() {
  seriePruebas = [];
  const ishiBarajado = [...BANCO_ISHIHARA].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3; i++) {
    seriePruebas.push({ tipo: 'ISHIHARA', ...ishiBarajado[i] });
  }
  for (let i = 0; i < 3; i++) {
    const opt = BANCO_OPTOTIPOS[Math.floor(Math.random() * BANCO_OPTOTIPOS.length)];
    seriePruebas.push({ tipo: 'OPTOTIPO', ...opt });
  }
}

// Inicialización de la cámara frontal
async function iniciarCamara() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !video) {
    activarModoManual();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 160 }, height: { ideal: 120 } },
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      iniciarMonitoreoDistancia();
    };
  } catch (err) {
    activarModoManual();
  }
}

function activarModoManual() {
  if (etiquetaDistancia) etiquetaDistancia.innerText = '📱 Sostén el móvil con brazo extendido';
  if (estadoDistancia) {
    estadoDistancia.innerText = 'Normal';
    estadoDistancia.style.color = '#4ade80';
  }
  distanciaValidada = true;
}

function iniciarMonitoreoDistancia() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 40;
  canvasAux.height = 30;

  setInterval(() => {
    if (!video || video.readyState < 2) return;
    ctxAux.drawImage(video, 0, 0, 40, 30);
    const frame = ctxAux.getImageData(0, 0, 40, 30).data;

    let pixelesPiel = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const r = frame[i], g = frame[i + 1], b = frame[i + 2];
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
        pixelesPiel++;
      }
    }
    const densidad = pixelesPiel / (40 * 30);
    const esOptotipo = seriePruebas[indiceActual] && seriePruebas[indiceActual].tipo === 'OPTOTIPO';

    if (esOptotipo) {
      if (densidad > 0.35) {
        distanciaValidada = false;
        cajaCamara.style.borderColor = '#ef4444';
        etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
        estadoDistancia.innerText = 'Muy cerca';
        estadoDistancia.style.color = '#ef4444';
      } else {
        distanciaValidada = true;
        cajaCamara.style.borderColor = '#22c55e';
        etiquetaDistancia.innerText = '✅ Distancia Óptima (Brazo extendido)';
        estadoDistancia.innerText = 'Óptima';
        estadoDistancia.style.color = '#4ade80';
      }
    } else {
      distanciaValidada = true;
      cajaCamara.style.borderColor = '#22c55e';
      etiquetaDistancia.innerText = '✅ Distancia de lectura normal';
      estadoDistancia.innerText = 'Normal';
      estadoDistancia.style.color = '#4ade80';
    }

    const botones = contenedorOpciones.querySelectorAll('.btn-opcion-visual');
    botones.forEach(b => {
      b.disabled = !distanciaValidada;
      b.style.opacity = distanciaValidada ? '1' : '0.4';
      b.style.cursor = distanciaValidada ? 'pointer' : 'not-allowed';
    });
  }, 300);
}

function cargarEstimuloActual() {
  if (indiceActual >= TOTAL_ESTIMULOS) {
    finalizarTamizajeVisual();
    return;
  }

  const item = seriePruebas[indiceActual];
  contenedorOpciones.innerHTML = '';

  if (item.tipo === 'ISHIHARA') {
    canvasIshihara.style.display = 'block';
    simboloOptotipo.style.display = 'none';
    instruccionPregunta.innerText = `Lámina ${indiceActual + 1} de ${TOTAL_ESTIMULOS}: ¿Qué número ves en el círculo?`;

    dibujarPlacaIshiharaProcedimental(item.numero, item.fondo, item.patron);

    const ops = [...item.opciones].sort(() => Math.random() - 0.5);
    ops.forEach(opc => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcion-visual';
      btn.innerText = opc;
      btn.onclick = () => responder(opc === item.numero);
      contenedorOpciones.appendChild(btn);
    });
  } else {
    canvasIshihara.style.display = 'none';
    simboloOptotipo.style.display = 'flex';
    instruccionPregunta.innerText = `Lámina ${indiceActual + 1} de ${TOTAL_ESTIMULOS}: ¿Hacia dónde apuntan las patitas de la letra E?`;

    simboloOptotipo.innerHTML = `
      <span style="font-size: ${item.tamano}; font-weight: 900; color: #0f172a; transform: rotate(${item.grados}deg); display: inline-block;">E</span>
    `;

    const direcciones = ['Arriba', 'Abajo', 'Izquierda', 'Derecha'];
    direcciones.forEach(dir => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcion-visual';
      btn.innerText = dir;
      btn.onclick = () => responder(dir.toUpperCase() === item.direccion.toUpperCase());
      contenedorOpciones.appendChild(btn);
    });
  }
}

function responder(esCorrecta) {
  const item = seriePruebas[indiceActual];
  if (item.tipo === 'ISHIHARA' && esCorrecta) aciertosCromaticos++;
  if (item.tipo === 'OPTOTIPO' && esCorrecta) aciertosAgudeza++;

  indiceActual++;
  cargarEstimuloActual();
}

function dibujarPlacaIshiharaProcedimental(texto, colorFondo, colorTexto) {
  if (!ctxIshihara) return;
  ctxIshihara.clearRect(0, 0, canvasIshihara.width, canvasIshihara.height);

  const cx = canvasIshihara.width / 2;
  const cy = canvasIshihara.height / 2;

  for (let i = 0; i < 450; i++) {
    const radioDist = Math.random() * (cx - 10);
    const angulo = Math.random() * Math.PI * 2;
    const x = cx + radioDist * Math.cos(angulo);
    const y = cy + radioDist * Math.sin(angulo);
    const r = Math.random() * 3.5 + 2;

    ctxIshihara.beginPath();
    ctxIshihara.arc(x, y, r, 0, Math.PI * 2);
    ctxIshihara.fillStyle = colorFondo;
    ctxIshihara.globalAlpha = 0.6 + Math.random() * 0.4;
    ctxIshihara.fill();
  }

  ctxIshihara.font = '900 64px Arial, sans-serif';
  ctxIshihara.fillStyle = colorTexto;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.globalAlpha = 0.95;
  ctxIshihara.fillText(texto, cx, cy);
  ctxIshihara.globalAlpha = 1.0;
}

function finalizarTamizajeVisual() {
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  const totalAciertos = aciertosCromaticos + aciertosAgudeza;
  const efectividad = Math.round((totalAciertos / TOTAL_ESTIMULOS) * 100);
  const aprobado = efectividad >= 80;

  // Guardar métrica en localStorage
  localStorage.setItem('sensometrika_visual', JSON.stringify({
    aciertos: totalAciertos,
    efectividad: efectividad,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  // Descontar ejecución en CreditManager
  if (typeof CreditManager !== 'undefined') {
    CreditManager.registrarConsumo('visual');
  }

  // Ocultar elementos de prueba
  canvasIshihara.style.display = 'none';
  simboloOptotipo.style.display = 'none';
  instruccionPregunta.style.display = 'none';
  contenedorOpciones.style.display = 'none';

  // Revisar si el plan incluye Auditivo
  const sesion = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerSesion() : {};
  const esFull = (sesion.planId && sesion.planId.includes('full'));
  const urlSiguiente = esFull ? 'audicion.html' : 'informe.html';
  const txtSiguiente = esFull ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Informe y Dictamen Final →';

  // Mostrar tarjeta de resultados ergonómica
  contenedorCentral.style.minHeight = 'auto';
  contenedorCentral.innerHTML = `
    <div style="text-align:center; padding: 10px 0; width: 100%;">
      <div style="font-size: 2.2rem; margin-bottom: 4px;">${aprobado ? '✅' : '⚠️'}</div>
      <h3 style="color:#ffffff; margin:0 0 6px 0; font-size:1.15rem;">¡Screening Visual Finalizado!</h3>
      <div style="font-size:1.6rem; font-weight:900; color:#38bdf8; margin:6px 0;">${efectividad}% de acierto</div>
      <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 16px 0;">
        ${aprobado ? 'Agudeza visual y percepción cromática dentro del estándar.' : 'Observación preventiva: Se aconseja control con oftalmólogo.'}
      </p>
      <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
        <a href="${urlSiguiente}" style="display:flex; align-items:center; justify-content:center; height:46px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:800; font-size:0.9rem; box-shadow:0 4px 12px rgba(2,132,199,0.35);">
          ${txtSiguiente}
        </a>
        <a href="menu.html" style="display:flex; align-items:center; justify-content:center; height:40px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; text-decoration:none; border-radius:8px; font-weight:700; font-size:0.85rem;">
          ← Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}