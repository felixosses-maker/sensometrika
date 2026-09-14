/* ==========================================================================
   MÓDULO 4: TAMIZAJE VISUAL CON CÁMARA FRONTAL Y AUDITORÍA DE DISTANCIA
   Sensometrika SpA • D.S. N° 170
   ========================================================================== */

const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#84cc16', patron: '#ea580c', opciones: ['12', '74', 'No distingo', '8'] },
  { numero: '8',  fondo: '#a3e635', patron: '#ef4444', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#65a30d', patron: '#dc2626', opciones: ['21', '74', 'No distingo', '71'] },
  { numero: '6',  fondo: '#4d7c0f', patron: '#ea580c', opciones: ['5', '6', 'No distingo', '8'] },
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
let distanciaValidada = true;
let pruebaFinalizada = false;
let camaraAutorizada = false;
let intervaloCamara = null;

// Elementos DOM
const modalPermiso = document.getElementById('modal-permiso-camara');
const btnDarAutorizacion = document.getElementById('btn-dar-autorizacion');
const btnOmitirAutorizacion = document.getElementById('btn-omitir-autorizacion');

const video = document.getElementById('video-camara');
const cajaCamara = document.getElementById('caja-camara');
const etiquetaDistancia = document.getElementById('etiqueta-distancia');
const subDistancia = document.getElementById('sub-distancia');
const estadoDistancia = document.getElementById('estado-distancia');

const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');

const txtProgreso = document.getElementById('txt-progreso');
const txtTipo = document.getElementById('tipo-prueba-visual');
const txtAciertos = document.getElementById('contador-aciertos-vis');
const txtInstruccion = document.getElementById('txt-instruccion-visual');
const cajaOpciones = document.getElementById('caja-opciones');
const contenedorFinal = document.getElementById('contenedor-coordinacion-vis');

const botones = [
  document.getElementById('btn-op-1'),
  document.getElementById('btn-op-2'),
  document.getElementById('btn-op-3'),
  document.getElementById('btn-op-4')
];

if (btnDarAutorizacion) {
  btnDarAutorizacion.addEventListener('click', async () => {
    if (modalPermiso) modalPermiso.style.display = 'none';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      });

      camaraAutorizada = true;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          iniciarMonitoreoDistancia();
        };
      }
    } catch (err) {
      console.warn("Permiso de cámara no concedido o no disponible. Iniciando en modo manual.");
      activarModoManual();
    }
  });
}

if (btnOmitirAutorizacion) {
  btnOmitirAutorizacion.addEventListener('click', () => {
    if (modalPermiso) modalPermiso.style.display = 'none';
    activarModoManual();
  });
}

function activarModoManual() {
  camaraAutorizada = false;
  distanciaValidada = true;
  if (cajaCamara) cajaCamara.className = 'caja-monitor-camara distancia-ok';
  if (video) video.style.display = 'none';
  if (etiquetaDistancia) etiquetaDistancia.innerText = '📱 Modo Manual Asistido';
  if (subDistancia) subDistancia.innerText = 'Extiende tu brazo por completo a ~50-60 cm';
  if (estadoDistancia) {
    estadoDistancia.innerText = 'Manual';
    estadoDistancia.style.color = '#38bdf8';
  }
  actualizarEstadoBotones();
}

function iniciarMonitoreoDistancia() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 80;
  canvasAux.height = 60;

  intervaloCamara = setInterval(() => {
    if (pruebaFinalizada) {
      clearInterval(intervaloCamara);
      return;
    }
    if (!video || video.readyState < 2) return;

    ctxAux.drawImage(video, 0, 0, 80, 60);
    const frame = ctxAux.getImageData(0, 0, 80, 60).data;

    let pixelesRostro = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const r = frame[i], g = frame[i + 1], b = frame[i + 2];
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
        pixelesRostro++;
      }
    }

    const densidad = pixelesRostro / (80 * 60);
    const esOptotipo = bateriaPruebas[indiceActual] && bateriaPruebas[indiceActual].tipo === 'OPTOTIPO';

    if (esOptotipo) {
      if (densidad > 0.32) {
        distanciaValidada = false;
        cajaCamara.className = 'caja-monitor-camara distancia-alerta';
        etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
        estadoDistancia.innerText = 'Cerca';
        estadoDistancia.style.color = '#ef4444';
      } else if (densidad < 0.04) {
        distanciaValidada = false;
        cajaCamara.className = 'caja-monitor-camara distancia-alerta';
        etiquetaDistancia.innerText = '👤 Coloca tu rostro frente a la pantalla';
        estadoDistancia.innerText = 'Buscando';
        estadoDistancia.style.color = '#facc15';
      } else {
        distanciaValidada = true;
        cajaCamara.className = 'caja-monitor-camara distancia-ok';
        etiquetaDistancia.innerText = '✅ Distancia Correcta (~50-60 cm)';
        estadoDistancia.innerText = 'Óptima';
        estadoDistancia.style.color = '#4ade80';
      }
    } else {
      distanciaValidada = true;
      cajaCamara.className = 'caja-monitor-camara distancia-ok';
      etiquetaDistancia.innerText = '✅ Posición adecuada';
      estadoDistancia.innerText = 'Correcta';
      estadoDistancia.style.color = '#4ade80';
    }

    actualizarEstadoBotones();
  }, 250);
}

function actualizarEstadoBotones() {
  if (pruebaFinalizada) return;
  botones.forEach(btn => {
    if (btn) btn.disabled = !distanciaValidada;
  });
}

function generarBateria() {
  const cromaticos = [...BANCO_ISHIHARA].sort(() => Math.random() - 0.5).slice(0, 3).map(i => ({
    tipo: 'ISHIHARA',
    numero: i.numero,
    fondo: i.fondo,
    patron: i.patron,
    opciones: [...i.opciones].sort(() => Math.random() - 0.5)
  }));

  const escalas = ['4.2rem', '2.8rem', '1.6rem'];
  const agudeza = escalas.map(tam => {
    const elegido = ANGULOS_E[Math.floor(Math.random() * ANGULOS_E.length)];
    return {
      tipo: 'OPTOTIPO',
      orientacion: elegido.ang,
      tamanoRem: tam,
      valor: elegido.dir,
      opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo'].sort(() => Math.random() - 0.5)
    };
  });

  return [...cromaticos, ...agudeza];
}

function cargarEstimulo() {
  if (indiceActual >= bateriaPruebas.length) {
    finalizarTamizaje();
    return;
  }

  const p = bateriaPruebas[indiceActual];
  txtProgreso.innerText = `${indiceActual + 1} / ${bateriaPruebas.length}`;
  txtAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}`;

  botones.forEach((btn, i) => {
    if (btn) {
      btn.innerText = p.opciones[i];
      btn.dataset.valor = p.opciones[i];
      btn.disabled = !distanciaValidada;
    }
  });

  if (p.tipo === 'ISHIHARA') {
    txtTipo.innerText = 'Ishihara';
    txtTipo.style.color = '#38bdf8';
    txtInstruccion.innerText = 'Identifica el número dentro de la placa cromática';
    canvasIshihara.style.display = 'block';
    simboloOptotipo.style.display = 'none';
    dibujarPlacaIshihara(p.numero, p.fondo, p.patron);
  } else {
    txtTipo.innerText = 'Agudeza (E)';
    txtTipo.style.color = '#4ade80';
    txtInstruccion.innerText = '¿Hacia qué dirección apuntan las barras de la letra E?';
    canvasIshihara.style.display = 'none';
    simboloOptotipo.style.display = 'block';
    simboloOptotipo.innerText = 'E';
    simboloOptotipo.style.transform = `rotate(${p.orientacion}deg)`;
    simboloOptotipo.style.fontSize = p.tamanoRem;
  }

  actualizarEstadoBotones();
}

function dibujarPlacaIshihara(texto, colorFondo, colorTexto) {
  if (!ctxIshihara) return;
  ctxIshihara.clearRect(0, 0, 200, 200);

  for (let i = 0; i < 480; i++) {
    const radioC = Math.random() * 85;
    const angulo = Math.random() * Math.PI * 2;
    const x = 100 + radioC * Math.cos(angulo);
    const y = 100 + radioC * Math.sin(angulo);
    const radioPunto = Math.random() * 3.5 + 2;

    ctxIshihara.beginPath();
    ctxIshihara.arc(x, y, radioPunto, 0, Math.PI * 2);
    ctxIshihara.fillStyle = colorFondo;
    ctxIshihara.globalAlpha = 0.65 + Math.random() * 0.35;
    ctxIshihara.fill();
  }

  ctxIshihara.font = 'bold 64px Arial';
  ctxIshihara.fillStyle = colorTexto;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.globalAlpha = 0.95;
  ctxIshihara.fillText(texto, 100, 105);
  ctxIshihara.globalAlpha = 1.0;
}

function manejarRespuesta(indiceBoton) {
  if (pruebaFinalizada) return;
  const btn = botones[indiceBoton];
  if (!btn || btn.disabled) return;

  const respuestaSeleccionada = btn.dataset.valor;
  const pruebaActual = bateriaPruebas[indiceActual];

  if (pruebaActual.tipo === 'ISHIHARA') {
    if (respuestaSeleccionada === pruebaActual.numero) {
      aciertosCromaticos++;
      if ('vibrate' in navigator) navigator.vibrate(25);
    }
  } else {
    if (respuestaSeleccionada === pruebaActual.valor) {
      aciertosAgudeza++;
      if ('vibrate' in navigator) navigator.vibrate(25);
    }
  }

  indiceActual++;
  cargarEstimulo();
}

function finalizarTamizaje() {
  pruebaFinalizada = true;
  clearInterval(intervaloCamara);

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
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
    distanciaAuditadaCamara: camaraAutorizada,
    fecha: new Date().toISOString()
  }));

  cajaOpciones.style.display = 'none';
  txtInstruccion.innerText = '';

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const esFull = (sesion.nombrePlan && sesion.nombrePlan.toLowerCase().includes('full')) || 
                 (sesion.planId && sesion.planId.includes('full'));
  const modulos = sesion.modulosPermitidos || [];
  const tieneAuditivo = esFull || modulos.includes('auditivo') || modulos.includes('audicion');

  // REDIRECCIÓN CORREGIDA: Apunta exactamente a audicion.html
  const siguienteUrl = tieneAuditivo ? 'audicion.html' : 'informe.html';
  const textoBoton = tieneAuditivo 
    ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' 
    : '📋 Ver Informe de Resultados Final →';

  contenedorFinal.innerHTML = `
    <div style="background: #020617; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 16px; text-align: center; margin-top: 6px;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.05rem;">
        ${aprobado ? '✅ Tamizaje Visual Superado' : '⚠️ Observación Visual Preventiva'} (${efectividad}%)
      </h3>
      <p style="color: #94a3b8; font-size: 0.8rem; margin: 0 0 14px 0;">
        Aciertos: ${totalAciertos} de ${total} estímulos evaluados (Exigencia legal: ≥ 80%).
      </p>
      <a href="${siguienteUrl}" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 48px; background-color: #0284c7;">
        ${textoBoton}
      </a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  bateriaPruebas = generarBateria();
  cargarEstimulo();
});