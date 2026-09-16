/* ==========================================================================
   SENSOMETRIKA - MÓDULO 4: TAMIZAJE VISUAL CON AUDITORÍA BIOMÉTRICA ACTIVA
   ========================================================================== */

const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#84cc16', patron: '#ea580c', opciones: ['12', '74', 'No distingo', '8'] },
  { numero: '8',  fondo: '#a3e635', patron: '#ef4444', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#65a30d', patron: '#dc2626', opciones: ['21', '74', 'No distingo', '71'] },
  { numero: '29', fondo: '#facc15', patron: '#b91c1c', opciones: ['70', '29', 'No distingo', '26'] }
];

const ANGULOS_E = [
  { ang: 0,   dir: 'Derecha' },
  { ang: 90,  dir: 'Abajo' },
  { ang: 180, dir: 'Izquierda' },
  { ang: 270, dir: 'Arriba' }
];

let bateriaPruebas = [];
let indiceActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
let distanciaValidada = false; // Bloqueado por defecto hasta calibrar
let pruebaFinalizada = false;
let intervaloCamara = null;

// Elementos DOM
const video = document.getElementById('video-camara');
const cajaCamara = document.getElementById('caja-camara') || document.querySelector('.caja-camara');
const etiquetaDistancia = document.getElementById('etiqueta-distancia');
const estadoDistancia = document.getElementById('estado-distancia');
const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');
const contenedorOpciones = document.getElementById('contenedor-opciones') || document.getElementById('caja-opciones');
const instruccionPregunta = document.getElementById('instruccion-pregunta') || document.getElementById('txt-instruccion-visual');
const contenedorCentral = document.getElementById('contenedor-central') || document.getElementById('contenedor-coordinacion-vis');

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined' && CreditManager.validarAccesoOBloquear) {
    if (!CreditManager.validarAccesoOBloquear('visual')) return;
  }
  generarBateria();
  iniciarCamara();
  cargarEstimulo();
});

function generarBateria() {
  const cromaticos = [...BANCO_ISHIHARA].sort(() => Math.random() - 0.5).slice(0, 3).map(i => ({
    tipo: 'ISHIHARA',
    numero: i.numero,
    fondo: i.fondo,
    patron: i.patron,
    opciones: [...i.opciones].sort(() => Math.random() - 0.5)
  }));

  const escalas = ['3.8rem', '2.6rem', '1.6rem'];
  const agudeza = escalas.map(tam => {
    const elegido = ANGULOS_E[Math.floor(Math.random() * ANGULOS_E.length)];
    return {
      tipo: 'OPTOTIPO',
      orientacion: elegido.ang,
      tamanoRem: tam,
      valor: elegido.dir,
      opciones: ['Arriba', 'Abajo', 'Izquierda', 'Derecha']
    };
  });

  bateriaPruebas = [...cromaticos, ...agudeza];
}

// 1. CÁMARA FRONTAL
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
      video.play();
      iniciarLoopDistancia();
    };
  } catch (err) {
    activarModoManual();
  }
}

function activarModoManual() {
  distanciaValidada = true;
  if (etiquetaDistancia) etiquetaDistancia.innerText = '📱 Modo Manual (Brazo estirado)';
  if (estadoDistancia) {
    estadoDistancia.innerText = 'Manual';
    estadoDistancia.style.color = '#38bdf8';
  }
  actualizarEstadoBotones();
}

// 2. AUDITORÍA DE DISTANCIA (BLOQUEO ACTIVO)
function iniciarLoopDistancia() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 40;
  canvasAux.height = 30;

  intervaloCamara = setInterval(() => {
    if (pruebaFinalizada) {
      clearInterval(intervaloCamara);
      return;
    }
    if (!video || video.readyState < 2) return;

    ctxAux.drawImage(video, 0, 0, 40, 30);
    const frame = ctxAux.getImageData(0, 0, 40, 30).data;

    let pixelesRostro = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const r = frame[i];
      const g = frame[i + 1];
      const b = frame[i + 2];
      // Detección facial de contraste
      if (r > 50 && g > 30 && b > 15 && (r - g) > 8 && r > b) {
        pixelesRostro++;
      }
    }

    const densidad = pixelesRostro / (40 * 30);
    const esOptotipo = bateriaPruebas[indiceActual] && bateriaPruebas[indiceActual].tipo === 'OPTOTIPO';

    // En agudeza visual (E) se exige el brazo extendido
    if (esOptotipo) {
      if (densidad > 0.28) {
        // MUY CERCA: BLOQUEAR BOTONES
        distanciaValidada = false;
        if (cajaCamara) cajaCamara.style.borderColor = '#ef4444';
        if (etiquetaDistancia) etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
        if (estadoDistancia) {
          estadoDistancia.innerText = 'Muy cerca';
          estadoDistancia.style.color = '#ef4444';
        }
      } else if (densidad < 0.03) {
        // ROSTRO NO DETECTADO
        distanciaValidada = false;
        if (cajaCamara) cajaCamara.style.borderColor = '#eab308';
        if (etiquetaDistancia) etiquetaDistancia.innerText = '👤 Coloca tu rostro frente a la cámara';
        if (estadoDistancia) {
          estadoDistancia.innerText = 'Buscando';
          estadoDistancia.style.color = '#eab308';
        }
      } else {
        // DISTANCIA CORRECTA
        distanciaValidada = true;
        if (cajaCamara) cajaCamara.style.borderColor = '#22c55e';
        if (etiquetaDistancia) etiquetaDistancia.innerText = '✅ Distancia Óptima (Brazo extendido)';
        if (estadoDistancia) {
          estadoDistancia.innerText = 'Óptima';
          estadoDistancia.style.color = '#4ade80';
        }
      }
    } else {
      // En Ishihara se permite distancia de lectura
      distanciaValidada = true;
      if (cajaCamara) cajaCamara.style.borderColor = '#22c55e';
      if (etiquetaDistancia) etiquetaDistancia.innerText = '✅ Distancia de lectura normal';
      if (estadoDistancia) {
        estadoDistancia.innerText = 'Normal';
        estadoDistancia.style.color = '#4ade80';
      }
    }

    actualizarEstadoBotones();
  }, 200);
}

// 3. APLICACIÓN DEL BLOQUEO EN TIEMPO REAL
function actualizarEstadoBotones() {
  if (!contenedorOpciones) return;
  const botones = contenedorOpciones.querySelectorAll('button');
  botones.forEach(btn => {
    btn.disabled = !distanciaValidada;
    btn.style.opacity = distanciaValidada ? '1' : '0.35';
    btn.style.cursor = distanciaValidada ? 'pointer' : 'not-allowed';
    btn.style.pointerEvents = distanciaValidada ? 'auto' : 'none';
  });
}

// 4. FLUJO DE PRUEBAS
function cargarEstimulo() {
  if (indiceActual >= bateriaPruebas.length) {
    finalizarTamizaje();
    return;
  }

  const item = bateriaPruebas[indiceActual];
  if (contenedorOpciones) contenedorOpciones.innerHTML = '';

  if (item.tipo === 'ISHIHARA') {
    if (canvasIshihara) canvasIshihara.style.display = 'block';
    if (simboloOptotipo) simboloOptotipo.style.display = 'none';
    if (instruccionPregunta) {
      instruccionPregunta.innerText = `Lámina ${indiceActual + 1} de ${bateriaPruebas.length}: ¿Qué número ves en el círculo?`;
    }
    dibujarPlacaIshihara(item.numero, item.fondo, item.patron);

    item.opciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.onclick = () => responder(opc === item.numero);
      contenedorOpciones.appendChild(btn);
    });
  } else {
    if (canvasIshihara) canvasIshihara.style.display = 'none';
    if (simboloOptotipo) {
      simboloOptotipo.style.display = 'flex';
      simboloOptotipo.style.alignItems = 'center';
      simboloOptotipo.style.justifyContent = 'center';
      simboloOptotipo.innerHTML = `
        <span style="font-size: ${item.tamanoRem}; font-weight: 900; color: #0f172a; transform: rotate(${item.orientacion}deg); display: inline-block;">E</span>
      `;
    }
    if (instruccionPregunta) {
      instruccionPregunta.innerText = `Lámina ${indiceActual + 1} de ${bateriaPruebas.length}: ¿Hacia dónde apuntan las patitas de la letra E?`;
    }

    item.opciones.forEach(dir => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcion';
      btn.innerText = dir;
      btn.onclick = () => responder(dir.toUpperCase() === item.valor.toUpperCase());
      contenedorOpciones.appendChild(btn);
    });
  }

  // Asegura aplicar el bloqueo de inmediato según el estado actual
  actualizarEstadoBotones();
}

function responder(esCorrecta) {
  if (!distanciaValidada) return; // Doble candado: no responde si está bloqueado

  const item = bateriaPruebas[indiceActual];
  if (item.tipo === 'ISHIHARA' && esCorrecta) aciertosCromaticos++;
  if (item.tipo === 'OPTOTIPO' && esCorrecta) aciertosAgudeza++;

  indiceActual++;
  cargarEstimulo();
}

function dibujarPlacaIshihara(texto, colorFondo, colorTexto) {
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

// 5. FINALIZACIÓN Y DESCUENTO
function finalizarTamizaje() {
  pruebaFinalizada = true;
  clearInterval(intervaloCamara);

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  const totalAciertos = aciertosCromaticos + aciertosAgudeza;
  const total = bateriaPruebas.length;
  const efectividad = Math.round((totalAciertos / total) * 100);
  const aprobado = efectividad >= 80;

  localStorage.setItem('sensometrika_visual', JSON.stringify({
    aciertosCromaticos,
    aciertosAgudeza,
    efectividad,
    aprobado,
    fecha: new Date().toISOString()
  }));

  if (typeof CreditManager !== 'undefined' && CreditManager.registrarConsumo) {
    CreditManager.registrarConsumo('visual');
  }

  if (canvasIshihara) canvasIshihara.style.display = 'none';
  if (simboloOptotipo) simboloOptotipo.style.display = 'none';
  if (instruccionPregunta) instruccionPregunta.style.display = 'none';
  if (contenedorOpciones) contenedorOpciones.style.display = 'none';

  const sesion = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerSesion() : {};
  const esFull = (sesion.planId && sesion.planId.includes('full'));
  const urlSiguiente = esFull ? 'audicion.html' : 'informe.html';
  const txtSiguiente = esFull ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Informe y Dictamen Final →';

  if (contenedorCentral) {
    contenedorCentral.innerHTML = `
      <div style="text-align:center; padding: 16px; width: 100%;">
        <div style="font-size: 2.2rem; margin-bottom: 4px;">${aprobado ? '✅' : '⚠️'}</div>
        <h3 style="color:#ffffff; margin:0 0 6px 0; font-size:1.15rem;">¡Screening Visual Finalizado!</h3>
        <div style="font-size:1.6rem; font-weight:900; color:#38bdf8; margin:6px 0;">${efectividad}% de acierto</div>
        <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 16px 0;">
          ${aprobado ? 'Agudeza visual y percepción cromática dentro del estándar.' : 'Observación preventiva: Se aconseja control con oftalmólogo.'}
        </p>
        <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
          <a href="${urlSiguiente}" style="display:flex; align-items:center; justify-content:center; height:46px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:800; font-size:0.9rem;">
            ${txtSiguiente}
          </a>
          <a href="menu.html" style="display:flex; align-items:center; justify-content:center; height:40px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; text-decoration:none; border-radius:8px; font-weight:700; font-size:0.85rem;">
            ← Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}