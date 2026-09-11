/* ==========================================================================
   1. VALIDACIÓN PREVIA DE USO (PLAN ACOMPAÑAMIENTO)
   ========================================================================== */
if (typeof SessionTimer !== 'undefined' && !SessionTimer.puedeUsarModulo('visual')) {
  alert('Ya has completado tu evaluación visual única incluida en el plan.');
  window.location.href = 'menu.html';
}

/* ==========================================================================
   2. BANCO DE PRUEBAS ALEATORIAS ANTI-MEMORIZACIÓN
   ========================================================================== */
const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#e27d60', patron: '#41b3a3', opciones: ['12', '74', 'No distingo', '8'] },
  { numero: '8',  fondo: '#85dcba', patron: '#e8a87c', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#c38d9e', patron: '#41b3a3', opciones: ['21', '74', 'No distingo', '71'] },
  { numero: '6',  fondo: '#e8a87c', patron: '#5b92e5', opciones: ['5', '6', 'No distingo', '8'] },
  { numero: '29', fondo: '#a3e4d7', patron: '#e74c3c', opciones: ['70', '29', 'No distingo', '26'] },
  { numero: '5',  fondo: '#f6cd61', patron: '#0e9aa7', opciones: ['2', '5', 'No distingo', '3'] }
];

const ANGULOS_E = [
  { ang: 0,   dir: 'Derecha' },
  { ang: 90,  dir: 'Abajo' },
  { ang: 180, dir: 'Izquierda' },
  { ang: 270, dir: 'Arriba' }
];

function mezclarArreglo(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generarBateriaAleatoria() {
  const cromatica = mezclarArreglo(BANCO_ISHIHARA).slice(0, 3).map(item => ({
    tipo: 'ISHIHARA',
    numero: item.numero,
    colorFondo: item.fondo,
    colorPatron: item.patron,
    opciones: mezclarArreglo(item.opciones)
  }));

  const escalas = ['4.2rem', '2.8rem', '1.6rem'];
  const agudeza = escalas.map(tam => {
    const elegido = ANGULOS_E[Math.floor(Math.random() * ANGULOS_E.length)];
    return {
      tipo: 'OPTOTIPO',
      orientacion: elegido.ang,
      tamanoRem: tam,
      etiquetaOpciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo'],
      respuestaCorrecta: elegido.dir
    };
  });

  return [...cromatica, ...agudeza];
}

const PRUEBAS_VISUALES = generarBateriaAleatoria();
let indiceActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
let distanciaValidada = true;

/* ==========================================================================
   3. ELEMENTOS DEL DOM
   ========================================================================== */
const video = document.getElementById('video-camara');
const cajaCamara = document.getElementById('caja-camara');
const etiquetaDistancia = document.getElementById('etiqueta-distancia');
const estadoDistancia = document.getElementById('estado-distancia');
const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const panelEstado = document.getElementById('panel-estado');
const indicadorFase = document.getElementById('indicador-fase');
const contadorAciertos = document.getElementById('contador-aciertos');
const cajaInstruccion = document.getElementById('caja-instruccion');

/* ==========================================================================
   4. CÁMARA FRONTAL Y DETECCIÓN DE DISTANCIA
   ========================================================================== */
async function iniciarCamara() {
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
    etiquetaDistancia.innerText = '📱 Modo manual: Extiende el brazo a ~50 cm';
    estadoDistancia.innerText = 'Manual';
    estadoDistancia.style.color = '#facc15';
    cajaCamara.classList.add('distancia-correcta');
    distanciaValidada = true;
    actualizarEstadoBotones();
  }
}

function iniciarLoopMonitoreoDistancia() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 80;
  canvasAux.height = 60;

  setInterval(() => {
    if (video.readyState < 2) return;

    ctxAux.drawImage(video, 0, 0, 80, 60);
    const frame = ctxAux.getImageData(0, 0, 80, 60).data;

    let pixelesTonoPiel = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const r = frame[i];
      const g = frame[i + 1];
      const b = frame[i + 2];
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
        pixelesTonoPiel++;
      }
    }

    const densidadRostro = pixelesTonoPiel / (80 * 60);
    const esFaseOptotipo = (PRUEBAS_VISUALES[indiceActual] && PRUEBAS_VISUALES[indiceActual].tipo === 'OPTOTIPO');

    if (esFaseOptotipo) {
      if (densidadRostro > 0.32) {
        distanciaValidada = false;
        cajaCamara.classList.remove('distancia-correcta');
        etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
        estadoDistancia.innerText = 'Cerca';
        estadoDistancia.style.color = '#ef4444';
      } else if (densidadRostro < 0.05) {
        distanciaValidada = false;
        cajaCamara.classList.remove('distancia-correcta');
        etiquetaDistancia.innerText = '👤 Ubica tu rostro frente a la pantalla';
        estadoDistancia.innerText = 'Buscando';
        estadoDistancia.style.color = '#facc15';
      } else {
        distanciaValidada = true;
        cajaCamara.classList.add('distancia-correcta');
        etiquetaDistancia.innerText = '✅ Distancia Correcta (~50-60 cm)';
        estadoDistancia.innerText = 'Óptima';
        estadoDistancia.style.color = '#4ade80';
      }
    } else {
      distanciaValidada = true;
      cajaCamara.classList.add('distancia-correcta');
      etiquetaDistancia.innerText = '✅ Calibración facial activa';
      estadoDistancia.innerText = 'Correcta';
      estadoDistancia.style.color = '#4ade80';
    }

    actualizarEstadoBotones();
  }, 250);
}

function actualizarEstadoBotones() {
  const botones = contenedorOpciones.querySelectorAll('.btn-opcion');
  botones.forEach(btn => {
    btn.disabled = !distanciaValidada;
  });
}

/* ==========================================================================
   5. CONTROL DE FLUJO Y RENDERIZADO
   ========================================================================== */
function cargarPrueba() {
  const item = PRUEBAS_VISUALES[indiceActual];
  contenedorOpciones.innerHTML = '';
  contadorAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}/${indiceActual}`;

  if (item.tipo === 'ISHIHARA') {
    indicadorFase.innerText = 'Cromático';
    canvasIshihara.style.display = 'block';
    simboloOptotipo.style.display = 'none';
    panelEstado.innerText = '¿Qué número ves dentro del círculo?';
    cajaInstruccion.innerHTML = '🎨 <strong>Visión Cromática:</strong> Distingue el dígito entre los patrones.';
    dibujarPlacaIshihara(item.numero, item.colorFondo, item.colorPatron);

    item.opciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.disabled = !distanciaValidada;
      btn.addEventListener('click', () => validarRespuesta(opc === item.numero));
      contenedorOpciones.appendChild(btn);
    });
  } else {
    indicadorFase.innerText = 'Agudeza (E)';
    canvasIshihara.style.display = 'none';
    simboloOptotipo.style.display = 'block';
    simboloOptotipo.style.transform = `rotate(${item.orientacion}deg)`;
    simboloOptotipo.style.fontSize = item.tamanoRem;
    panelEstado.innerText = '¿Hacia qué dirección apuntan las patas de la letra E?';
    cajaInstruccion.innerHTML = '👁️ <strong>Agudeza Visual:</strong> Brazo extendido. La cámara valida tu distancia.';

    item.etiquetaOpciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.disabled = !distanciaValidada;
      btn.addEventListener('click', () => validarRespuesta(opc === item.respuestaCorrecta));
      contenedorOpciones.appendChild(btn);
    });
  }
}

function validarRespuesta(esCorrecta) {
  const item = PRUEBAS_VISUALES[indiceActual];
  if (item.tipo === 'ISHIHARA' && esCorrecta) aciertosCromaticos++;
  if (item.tipo === 'OPTOTIPO' && esCorrecta) aciertosAgudeza++;

  indiceActual++;
  if (indiceActual < PRUEBAS_VISUALES.length) {
    cargarPrueba();
  } else {
    finalizarTamizaje();
  }
}

function dibujarPlacaIshihara(texto, colorFondo, colorTexto) {
  if (!ctxIshihara) return;
  ctxIshihara.clearRect(0, 0, 200, 200);

  for (let i = 0; i < 500; i++) {
    const radioC = Math.random() * 85;
    const angulo = Math.random() * Math.PI * 2;
    const x = 100 + radioC * Math.cos(angulo);
    const y = 100 + radioC * Math.sin(angulo);
    const radioPunto = Math.random() * 3.5 + 2;

    ctxIshihara.beginPath();
    ctxIshihara.arc(x, y, radioPunto, 0, Math.PI * 2);
    ctxIshihara.fillStyle = colorFondo;
    ctxIshihara.globalAlpha = 0.6 + Math.random() * 0.4;
    ctxIshihara.fill();
  }

  ctxIshihara.font = 'bold 62px Arial';
  ctxIshihara.fillStyle = colorTexto;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.globalAlpha = 0.95;
  ctxIshihara.fillText(texto, 100, 105);
  ctxIshihara.globalAlpha = 1.0;
}

function finalizarTamizaje() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  const totalCorrectas = aciertosCromaticos + aciertosAgudeza;
  const efectividad = Math.round((totalCorrectas / 6) * 100);
  const aprobado = efectividad >= 80;

  // Persistir resultados para el informe consolidado
  localStorage.setItem('sensometrika_visual', JSON.stringify({
    aciertosCromaticos,
    aciertosAgudeza,
    efectividad: efectividad,
    dictamenVisual: aprobado ? 'SIN ALERTAS PREVIAS' : 'ALERTA: Sugiere revisión médica óptica',
    aprobado: aprobado,
    distanciaVerificadaCamara: true
  }));

  // Consumir el intento único
  if (typeof SessionTimer !== 'undefined') {
    SessionTimer.consumirUsoModulo('visual');
  }

  indicadorFase.innerText = 'Fin';
  estadoDistancia.innerText = aprobado ? 'Aprobado' : 'Observado';
  estadoDistancia.style.color = aprobado ? '#4ade80' : '#f87171';
  panelEstado.innerText = `Evaluación completada: ${efectividad}% de acierto`;
  panelEstado.style.color = aprobado ? '#4ade80' : '#ef4444';
  cajaInstruccion.innerHTML = '✅ <strong>Guardado con éxito.</strong> Volviendo al menú principal...';
  contenedorOpciones.innerHTML = '';

  setTimeout(() => {
    window.location.href = 'menu.html';
  }, 2200);
}

iniciarCamara();
cargarPrueba();