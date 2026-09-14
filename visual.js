/* ==========================================================================
   1. BANCO DE ESTÍMULOS ANTI-MEMORIZACIÓN
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

function mezclar(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generarBateria() {
  const cromatica = mezclar(BANCO_ISHIHARA).slice(0, 3).map(item => ({
    tipo: 'ISHIHARA',
    numero: item.numero,
    colorFondo: item.fondo,
    colorPatron: item.patron,
    opciones: mezclar(item.opciones)
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

const PRUEBAS_VISUALES = generarBateria();
let indiceActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
let distanciaValidada = true;
let pruebaFinalizada = false;
let camaraAutorizada = false;

/* ==========================================================================
   2. DOM Y CONTROL DE MODAL / AUTORIZACIÓN
   ========================================================================== */
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
const contenedorOpciones = document.getElementById('contenedor-opciones');
const panelEstado = document.getElementById('panel-estado');
const indicadorFase = document.getElementById('indicador-fase');
const contadorAciertos = document.getElementById('contador-aciertos');
const cajaInstruccion = document.getElementById('caja-instruccion');

// Asignación de eventos de autorización
if (btnDarAutorizacion) {
  btnDarAutorizacion.addEventListener('click', async () => {
    // 1. Ocultar el modal de inmediato para no congelar la vista
    cerrarModal();

    // 2. Solicitar stream de video
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
      activarModoManual();
    }
  });
}

if (btnOmitirAutorizacion) {
  btnOmitirAutorizacion.addEventListener('click', () => {
    cerrarModal();
    activarModoManual();
  });
}

function cerrarModal() {
  if (modalPermiso) {
    modalPermiso.style.display = 'none';
  }
}

function activarModoManual() {
  camaraAutorizada = false;
  distanciaValidada = true;

  if (cajaCamara) {
    cajaCamara.className = 'caja-monitor-camara distancia-ok';
    if (video) video.style.display = 'none';
    if (etiquetaDistancia) etiquetaDistancia.innerText = '📱 Modo Manual Asistido';
    if (subDistancia) subDistancia.innerText = 'Extiende tu brazo a ~50-60 cm';
  }
  if (estadoDistancia) {
    estadoDistancia.innerText = 'Manual';
    estadoDistancia.style.color = '#38bdf8';
  }
  actualizarEstadoBotones();
}

/* ==========================================================================
   3. LOOP DE MONITOREO DE DISTANCIA
   ========================================================================== */
function iniciarMonitoreoDistancia() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 80;
  canvasAux.height = 60;

  const timer = setInterval(() => {
    if (pruebaFinalizada) {
      clearInterval(timer);
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
    const esOptotipo = PRUEBAS_VISUALES[indiceActual] && PRUEBAS_VISUALES[indiceActual].tipo === 'OPTOTIPO';

    if (esOptotipo) {
      if (densidad > 0.32) {
        distanciaValidada = false;
        cajaCamara.className = 'caja-monitor-camara distancia-alerta';
        etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
        estadoDistancia.innerText = 'Cerca';
        estadoDistancia.style.color = '#ef4444';
      } else if (densidad < 0.05) {
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
      etiquetaDistancia.innerText = '✅ Calibración activa';
      estadoDistancia.innerText = 'Óptima';
      estadoDistancia.style.color = '#4ade80';
    }

    actualizarEstadoBotones();
  }, 250);
}

function actualizarEstadoBotones() {
  if (!contenedorOpciones || pruebaFinalizada) return;
  const botones = contenedorOpciones.querySelectorAll('.btn-opcion');
  botones.forEach(btn => {
    btn.disabled = !distanciaValidada;
  });
}

/* ==========================================================================
   4. RENDERIZADO Y CARGA DEL ESTÍMULO
   ========================================================================== */
function cargarPrueba() {
  if (indiceActual >= PRUEBAS_VISUALES.length) {
    finalizarTamizaje();
    return;
  }

  const item = PRUEBAS_VISUALES[indiceActual];
  contenedorOpciones.innerHTML = '';

  if (contadorAciertos) {
    contadorAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}/${indiceActual}`;
  }

  if (item.tipo === 'ISHIHARA') {
    if (indicadorFase) indicadorFase.innerText = 'Cromático';
    if (canvasIshihara) canvasIshihara.style.display = 'block';
    if (simboloOptotipo) simboloOptotipo.style.display = 'none';
    if (panelEstado) panelEstado.innerText = '¿Qué número ves dentro del círculo?';
    if (cajaInstruccion) {
      cajaInstruccion.innerHTML = '🎨 <strong>Visión Cromática:</strong> Identifica el dígito oculto entre los patrones.';
    }
    dibujarPlacaIshihara(item.numero, item.colorFondo, item.colorPatron);

    item.opciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.disabled = !distanciaValidada;
      btn.addEventListener('click', () => registrarRespuesta(opc === item.numero));
      contenedorOpciones.appendChild(btn);
    });
  } else {
    if (indicadorFase) indicadorFase.innerText = 'Agudeza (E)';
    if (canvasIshihara) canvasIshihara.style.display = 'none';
    if (simboloOptotipo) {
      simboloOptotipo.style.display = 'block';
      simboloOptotipo.innerText = 'E';
      simboloOptotipo.style.transform = `rotate(${item.orientacion}deg)`;
      simboloOptotipo.style.fontSize = item.tamanoRem;
    }
    if (panelEstado) panelEstado.innerText = '¿Hacia qué dirección apuntan las patas de la letra E?';
    if (cajaInstruccion) {
      cajaInstruccion.innerHTML = '👁️ <strong>Agudeza Visual:</strong> Brazo extendido. La cámara audita que no te acerques.';
    }

    item.etiquetaOpciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.disabled = !distanciaValidada;
      btn.addEventListener('click', () => registrarRespuesta(opc === item.respuestaCorrecta));
      contenedorOpciones.appendChild(btn);
    });
  }

  actualizarEstadoBotones();
}

function registrarRespuesta(correcta) {
  if (pruebaFinalizada) return;

  const item = PRUEBAS_VISUALES[indiceActual];
  if (item.tipo === 'ISHIHARA' && correcta) aciertosCromaticos++;
  if (item.tipo === 'OPTOTIPO' && correcta) aciertosAgudeza++;

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

  ctxIshihara.font = 'bold 64px Arial';
  ctxIshihara.fillStyle = colorTexto;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.globalAlpha = 0.95;
  ctxIshihara.fillText(texto, 100, 105);
  ctxIshihara.globalAlpha = 1.0;
}

/* ==========================================================================
   5. FINALIZACIÓN Y CONTINUACIÓN A AUDICIÓN / INFORME
   ========================================================================== */
function finalizarTamizaje() {
  pruebaFinalizada = true;

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  const totalAciertos = aciertosCromaticos + aciertosAgudeza;
  const efectividad = Math.round((totalAciertos / PRUEBAS_VISUALES.length) * 100);
  const aprobado = efectividad >= 80;

  localStorage.setItem('sensometrika_visual', JSON.stringify({
    aciertosCromaticos,
    aciertosAgudeza,
    efectividad,
    dictamenVisual: aprobado ? 'SIN ALERTAS PREVIAS' : 'ALERTA: Sugiere revisión óptica',
    aprobado,
    distanciaVerificadaCamara: camaraAutorizada
  }));

  if (indicadorFase) indicadorFase.innerText = 'Fin';
  if (contadorAciertos) contadorAciertos.innerText = `${totalAciertos}/6`;
  if (estadoDistancia) {
    estadoDistancia.innerText = aprobado ? 'Aprobado' : 'Observado';
    estadoDistancia.style.color = aprobado ? '#4ade80' : '#f87171';
  }
  if (panelEstado) {
    panelEstado.innerText = `Evaluación Finalizada: ${efectividad}% de acierto`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f59e0b';
  }
  if (cajaInstruccion) cajaInstruccion.style.display = 'none';

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const permitidos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo', 'visual', 'auditivo'];
  const tieneAuditivo = permitidos.includes('auditivo');

  const siguienteUrl = tieneAuditivo ? 'audicion.html' : 'informe.html';
  const textoBoton = tieneAuditivo 
    ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' 
    : '📊 Ver Dictamen e Informe Consolidado';

  contenedorOpciones.innerHTML = `
    <div style="grid-column: 1 / -1; background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 18px 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: #4ade80; margin: 0 0 6px 0; font-size: 1.1rem;">¡Módulo 4 Finalizado!</h3>
      <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0;">
        Efectividad registrada: <strong style="color: #fff;">${efectividad}%</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="${siguienteUrl}" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7; color: #fff; border-radius: 8px; font-weight: bold; font-size: 0.9rem;">
          ${textoBoton}
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.78rem; text-decoration: none; padding: 4px;">
          Regresar al Menú Principal
        </a>
      </div>
    </div>
  `;
}

// Cargar la primera lámina de inmediato
cargarPrueba();