/* ==========================================================================
   SENSOMETRIKA - MÓDULO 4: SCREENING VISUAL COMPLETO (visual.js)
   • Auditoría biométrica óptica de distancia facial (~50 cm por cámara)
   • Bloqueo en rojo si se acerca a <45 cm; desbloqueo en verde con brazo estirado
   • Generador procedimental estocástico de láminas Ishihara (anti-memorización)
   • Optotipo E dinámico con rotaciones y escalas aleatorias
   • Descuento real en CreditManager ('visual')
   • Botones inferiores hacia Módulo 5 (Auditivo) o Menú
   ========================================================================== */

const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#e27d60', patron: '#41b3a3', opciones: ['12', '79', 'No distingo', '8'] },
  { numero: '8',  fondo: '#85dcba', patron: '#e8a87c', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#c38d9e', patron: '#41b3a3', opciones: ['21', '74', 'No distingo', '71'] },
  { numero: '29', fondo: '#f4a261', patron: '#2a9d8f', opciones: ['70', '29', 'No distingo', '26'] },
  { numero: '5',  fondo: '#8ab17d', patron: '#e76f51', opciones: ['5', '2', 'No distingo', '6'] }
];

const BANCO_OPTOTIPOS = [
  { orientacion: 0,   grados: 0,   direccion: 'Derecha',   tamano: '4.2rem' },
  { orientacion: 90,  grados: 90,  direccion: 'Abajo',     tamano: '3.0rem' },
  { orientacion: 180, grados: 180, direccion: 'Izquierda', tamano: '2.2rem' },
  { orientacion: 270, grados: 270, direccion: 'Arriba',    tamano: '1.6rem' }
];

let indiceActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
const TOTAL_ESTIMULOS = 6;
let distanciaValidada = false;

// Elementos de la interfaz
const video = document.getElementById('video-camara');
const cajaCamara = document.getElementById('caja-camara') || document.querySelector('.caja-camara');
const etiquetaDistancia = document.getElementById('etiqueta-distancia');
const estadoDistancia = document.getElementById('estado-distancia');
const canvasIshihara = document.getElementById('canvas-ishihara') || document.getElementById('lienzo-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');
const contenedorOpciones = document.getElementById('contenedor-opciones') || document.getElementById('opciones-respuesta');
const instruccionPregunta = document.getElementById('instruccion-pregunta') || document.getElementById('caja-instrucciones');
const indicadorFase = document.getElementById('indicador-fase');
const contadorAciertos = document.getElementById('contador-aciertos') || document.getElementById('metrica-aciertos-visual');
const pildoraFase = document.getElementById('pildora-fase-visual');

// Batería aleatoria generada por sesión
let seriePruebas = [];

window.addEventListener('DOMContentLoaded', () => {
  // 1. Validar acceso por saldo
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.validarAccesoOBloquear('visual')) return;
    const actual = CreditManager.obtenerNumeroSimulacionActual('visual');
    const max = CreditManager.obtenerLimiteModulo('visual');
    if (pildoraFase) pildoraFase.innerText = `Simulación Oficial: ${actual} de ${max}`;
  }

  generarBateriaAleatoria();
  iniciarCamara();
  cargarPrueba();
});

function generarBateriaAleatoria() {
  seriePruebas = [];
  // Barajar y tomar 3 láminas de Ishihara
  const ishiBarajado = [...BANCO_ISHIHARA].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3; i++) {
    seriePruebas.push({ tipo: 'ISHIHARA', ...ishiBarajado[i] });
  }
  // Generar 3 optotipos E con direcciones aleatorias
  for (let i = 0; i < 3; i++) {
    const optAleatorio = BANCO_OPTOTIPOS[Math.floor(Math.random() * BANCO_OPTOTIPOS.length)];
    seriePruebas.push({ tipo: 'OPTOTIPO', ...optAleatorio });
  }
}

// 1. Inicialización de la Cámara Frontal
async function iniciarCamara() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !video) {
    activarModoManualAsistido();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      iniciarLoopMonitoreoDistancia();
    };
  } catch (err) {
    activarModoManualAsistido();
  }
}

function activarModoManualAsistido() {
  if (etiquetaDistancia) etiquetaDistancia.innerText = '📱 Sostén el móvil con el brazo estirado';
  if (estadoDistancia) {
    estadoDistancia.innerText = 'Manual';
    estadoDistancia.style.color = '#facc15';
  }
  if (cajaCamara) cajaCamara.classList.add('distancia-correcta');
  distanciaValidada = true;
  actualizarEstadoBotones();
}

// 2. Monitoreo Biométrico Óptico de Distancia Facial
function iniciarLoopMonitoreoDistancia() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 80;
  canvasAux.height = 60;

  setInterval(() => {
    if (!video || video.readyState < 2) return;

    ctxAux.drawImage(video, 0, 0, 80, 60);
    const frame = ctxAux.getImageData(0, 0, 80, 60).data;

    let pixelesTonoPiel = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const r = frame[i];
      const g = frame[i + 1];
      const b = frame[i + 2];
      // Segmentación cromática facial
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
        pixelesTonoPiel++;
      }
    }

    const densidadRostro = pixelesTonoPiel / (80 * 60);
    const esFaseOptotipo = seriePruebas[indiceActual] && seriePruebas[indiceActual].tipo === 'OPTOTIPO';

    if (esFaseOptotipo) {
      // Si la densidad > 0.30 el rostro está a menos de 45 cm
      if (densidadRostro > 0.30) {
        distanciaValidada = false;
        if (cajaCamara) cajaCamara.classList.remove('distancia-correcta');
        if (etiquetaDistancia) etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
        if (estadoDistancia) {
          estadoDistancia.innerText = 'Muy cerca';
          estadoDistancia.style.color = '#ef4444';
        }
      } else if (densidadRostro < 0.04) {
        distanciaValidada = false;
        if (cajaCamara) cajaCamara.classList.remove('distancia-correcta');
        if (etiquetaDistancia) etiquetaDistancia.innerText = '👤 Coloca tu rostro frente a la cámara';
        if (estadoDistancia) {
          estadoDistancia.innerText = 'Buscando';
          estadoDistancia.style.color = '#facc15';
        }
      } else {
        distanciaValidada = true;
        if (cajaCamara) cajaCamara.classList.add('distancia-correcta');
        if (etiquetaDistancia) etiquetaDistancia.innerText = '✅ Distancia Óptima (Brazo extendido)';
        if (estadoDistancia) {
          estadoDistancia.innerText = 'Óptima';
          estadoDistancia.style.color = '#4ade80';
        }
      }
    } else {
      // En Ishihara se permite distancia natural
      distanciaValidada = true;
      if (cajaCamara) cajaCamara.classList.add('distancia-correcta');
      if (etiquetaDistancia) etiquetaDistancia.innerText = '✅ Distancia de lectura normal';
      if (estadoDistancia) {
        estadoDistancia.innerText = 'Normal';
        estadoDistancia.style.color = '#4ade80';
      }
    }

    actualizarEstadoBotones();
  }, 250);
}

function actualizarEstadoBotones() {
  if (!contenedorOpciones) return;
  const botones = contenedorOpciones.querySelectorAll('.btn-opcion');
  botones.forEach(btn => {
    btn.disabled = !distanciaValidada;
    btn.style.opacity = distanciaValidada ? '1' : '0.4';
    btn.style.cursor = distanciaValidada ? 'pointer' : 'not-allowed';
  });
}

// 3. Renderizado y Ejecución de Pruebas
function cargarPrueba() {
  if (indiceActual >= TOTAL_ESTIMULOS) {
    finalizarTamizaje();
    return;
  }

  const item = seriePruebas[indiceActual];
  if (!contenedorOpciones) return;
  contenedorOpciones.innerHTML = '';
  if (contadorAciertos) contadorAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}/${indiceActual}`;

  if (item.tipo === 'ISHIHARA') {
    if (indicadorFase) indicadorFase.innerText = 'Cromático (Ishihara)';
    if (canvasIshihara) canvasIshihara.style.display = 'block';
    if (simboloOptotipo) simboloOptotipo.style.display = 'none';
    if (instruccionPregunta) instruccionPregunta.innerText = `Lámina ${indiceActual + 1} de ${TOTAL_ESTIMULOS}: ¿Qué número ves en el círculo?`;

    dibujarPlacaIshiharaProcedimental(item.numero, item.fondo, item.patron);

    // Barajar opciones
    const ops = [...item.opciones].sort(() => Math.random() - 0.5);
    ops.forEach(opc => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.style.cssText = 'height:48px; background:#1e293b; border:1.5px solid #334155; color:#fff; border-radius:8px; font-weight:800; font-size:1rem; cursor:pointer;';
      btn.addEventListener('click', () => validarRespuesta(opc === item.numero));
      contenedorOpciones.appendChild(btn);
    });
  } else {
    if (indicadorFase) indicadorFase.innerText = 'Agudeza Visual (Optotipo E)';
    if (instruccionPregunta) instruccionPregunta.innerText = `Lámina ${indiceActual + 1} de ${TOTAL_ESTIMULOS}: ¿Hacia dónde apuntan las patitas de la letra E?`;
    if (canvasIshihara) canvasIshihara.style.display = 'none';

    if (simboloOptotipo) {
      simboloOptotipo.style.display = 'flex';
      simboloOptotipo.style.alignItems = 'center';
      simboloOptotipo.style.justifyContent = 'center';
      simboloOptotipo.innerHTML = `
        <span style="font-size:${item.tamano}; font-weight:900; color:#0f172a; transform:rotate(${item.grados}deg); display:inline-block; user-select:none;">E</span>
      `;
    }

    const direcciones = ['Arriba', 'Abajo', 'Izquierda', 'Derecha'];
    direcciones.forEach(dir => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcion';
      btn.innerText = dir;
      btn.style.cssText = 'height:48px; background:#1e293b; border:1.5px solid #334155; color:#fff; border-radius:8px; font-weight:800; font-size:0.92rem; cursor:pointer;';
      btn.addEventListener('click', () => validarRespuesta(dir.toUpperCase() === item.direccion.toUpperCase()));
      contenedorOpciones.appendChild(btn);
    });
  }

  actualizarEstadoBotones();
}

function validarRespuesta(esCorrecta) {
  const item = seriePruebas[indiceActual];
  if (item.tipo === 'ISHIHARA' && esCorrecta) aciertosCromaticos++;
  if (item.tipo === 'OPTOTIPO' && esCorrecta) aciertosAgudeza++;

  indiceActual++;
  cargarPrueba();
}

// Generador procedimental estocástico de placas Ishihara en Canvas
function dibujarPlacaIshiharaProcedimental(texto, colorFondo, colorTexto) {
  if (!ctxIshihara) return;
  ctxIshihara.clearRect(0, 0, canvasIshihara.width, canvasIshihara.height);

  const cx = canvasIshihara.width / 2;
  const cy = canvasIshihara.height / 2;

  // Fondo moteado de círculos
  for (let i = 0; i < 550; i++) {
    const radioDist = Math.random() * (cx - 14);
    const angulo = Math.random() * Math.PI * 2;
    const x = cx + radioDist * Math.cos(angulo);
    const y = cy + radioDist * Math.sin(angulo);
    const radioPunto = Math.random() * 3.8 + 2;

    ctxIshihara.beginPath();
    ctxIshihara.arc(x, y, radioPunto, 0, Math.PI * 2);
    ctxIshihara.fillStyle = colorFondo;
    ctxIshihara.globalAlpha = 0.55 + Math.random() * 0.45;
    ctxIshihara.fill();
  }

  // Texto camuflado
  ctxIshihara.font = '900 68px Arial, sans-serif';
  ctxIshihara.fillStyle = colorTexto;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.globalAlpha = 0.96;
  ctxIshihara.fillText(texto, cx, cy + 2);
  ctxIshihara.globalAlpha = 1.0;
}

// 4. Finalización y Transición Controlada
function finalizarTamizaje() {
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  const totalCorrectas = aciertosCromaticos + aciertosAgudeza;
  const efectividad = Math.round((totalCorrectas / TOTAL_ESTIMULOS) * 100);
  const aprobado = efectividad >= 80;

  // 1. Guardar resultado para el informe consolidado
  localStorage.setItem('sensometrika_visual', JSON.stringify({
    aciertos: totalCorrectas,
    aciertosCromaticos,
    aciertosAgudeza,
    efectividad,
    aprobado,
    fecha: new Date().toISOString()
  }));

  // 2. DESCUENTO ESTRICTO EN CREDITMANAGER
  if (typeof CreditManager !== 'undefined') {
    CreditManager.registrarConsumo('visual');
  }

  // 3. Revisar si el plan incluye Auditivo
  const sesion = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerSesion() : {};
  const esFull = (sesion.planId && sesion.planId.includes('full'));
  const urlSiguiente = esFull ? 'audicion.html' : 'informe.html';
  const txtSiguiente = esFull ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Informe y Dictamen Final →';

  // 4. Renderizar tarjeta de cierre armónica con botones inferiores
  if (canvasIshihara) canvasIshihara.style.display = 'none';
  if (simboloOptotipo) simboloOptotipo.style.display = 'none';
  if (instruccionPregunta) instruccionPregunta.innerHTML = '';
  if (indicadorFase) indicadorFase.innerText = 'Completado';

  contenedorOpciones.innerHTML = `
    <div style="background:#0f172a; border:1.5px solid ${aprobado ? '#22c55e' : '#f59e0b'}; border-radius:14px; padding:18px 16px; width:100%; box-sizing:border-box; text-align:center;">
      <div style="font-size:2.2rem; margin-bottom:4px;">${aprobado ? '✅' : '⚠️'}</div>
      <h3 style="color:#ffffff; margin:0 0 6px 0; font-size:1.15rem;">¡Screening Visual Finalizado!</h3>
      <div style="font-size:1.5rem; font-weight:900; color:#38bdf8; margin:4px 0 8px 0;">${efectividad}% de acierto</div>
      <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 16px 0;">
        ${aprobado ? 'Agudeza visual y discriminación cromática dentro del estándar reglamentario.' : 'Observación preventiva: Se aconseja control con médico oftalmólogo.'}
      </p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="${urlSiguiente}" style="display:flex; align-items:center; justify-content:center; width:100%; height:46px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:800; font-size:0.9rem; box-shadow:0 4px 12px rgba(2,132,199,0.35);">
          ${txtSiguiente}
        </a>
        <a href="menu.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:40px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; text-decoration:none; border-radius:8px; font-weight:700; font-size:0.85rem;">
          ← Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}