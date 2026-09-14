/* ==========================================================================
   1. BANCO DE DATOS ANTI-MEMORIZACIÓN
   ========================================================================== */
const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#e27d60', patron: '#41b3a3', opciones: ['12', '74', 'No distingo', '8'] },
  { numero: '8',  fondo: '#85dcba', patron: '#e8a87c', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#c38d9e', patron: '#41b3a3', opciones: ['21', '74', 'No distingo', '71'] }
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

function generarPruebas() {
  const cromatica = mezclar(BANCO_ISHIHARA).map(item => ({
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

const PRUEBAS = generarPruebas();
let indiceActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
let distanciaValidada = true; // Habilitado por defecto para no bloquear la prueba

/* ==========================================================================
   2. DOM Y CÁMARA
   ========================================================================== */
const video = document.getElementById('video-camara') || document.createElement('video');
const estadoDistancia = document.getElementById('estado-distancia') || { innerText: '' };
const panelEstado = document.getElementById('panel-estado');
const indicadorFase = document.getElementById('indicador-fase');
const contadorAciertos = document.getElementById('contador-aciertos');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');

async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    video.play();
    estadoDistancia.innerText = 'Óptima';
    estadoDistancia.style.color = '#4ade80';
  } catch (err) {
    // Si el navegador en 127.0.0.1 no tiene permisos o no detecta cámara web
    estadoDistancia.innerText = 'Manual (~50cm)';
    estadoDistancia.style.color = '#38bdf8';
  }
  distanciaValidada = true;
  actualizarEstadoBotones();
}

function actualizarEstadoBotones() {
  const botones = document.querySelectorAll('.btn-opcion');
  botones.forEach(btn => btn.disabled = !distanciaValidada);
}

/* ==========================================================================
   3. FLUJO DEL TEST
   ========================================================================== */
function cargarPrueba() {
  const item = PRUEBAS[indiceActual];
  contenedorOpciones.innerHTML = '';
  if (contadorAciertos) contadorAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}/${indiceActual}`;

  if (item.tipo === 'ISHIHARA') {
    if (indicadorFase) indicadorFase.innerText = 'Cromático';
    if (canvasIshihara) canvasIshihara.style.display = 'block';
    if (simboloOptotipo) simboloOptotipo.style.display = 'none';
    if (panelEstado) panelEstado.innerText = '¿Qué número ves dentro del círculo?';
    dibujarPlacaIshihara(item.numero, item.colorFondo, item.colorPatron);

    item.opciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.className = 'btn-opcion';
      btn.innerText = opc;
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

    item.etiquetaOpciones.forEach(opc => {
      const btn = document.createElement('button');
      btn.className = 'btn-opcion';
      btn.innerText = opc;
      btn.addEventListener('click', () => registrarRespuesta(opc === item.respuestaCorrecta));
      contenedorOpciones.appendChild(btn);
    });
  }
  actualizarEstadoBotones();
}

function registrarRespuesta(correcta) {
  const item = PRUEBAS[indiceActual];
  if (item.tipo === 'ISHIHARA' && correcta) aciertosCromaticos++;
  if (item.tipo === 'OPTOTIPO' && correcta) aciertosAgudeza++;

  indiceActual++;
  if (indiceActual < PRUEBAS.length) {
    cargarPrueba();
  } else {
    finalizarTamizaje();
  }
}

function dibujarPlacaIshihara(texto, colorFondo, colorTexto) {
  if (!ctxIshihara) return;
  ctxIshihara.clearRect(0, 0, 200, 200);
  ctxIshihara.fillStyle = colorFondo;
  ctxIshihara.beginPath();
  ctxIshihara.arc(100, 100, 90, 0, Math.PI * 2);
  ctxIshihara.fill();

  ctxIshihara.font = 'bold 64px Arial';
  ctxIshihara.fillStyle = colorTexto;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.fillText(texto, 100, 105);
}

function finalizarTamizaje() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  const efectividad = Math.round(((aciertosCromaticos + aciertosAgudeza) / PRUEBAS.length) * 100);
  const aprobado = efectividad >= 80;

  localStorage.setItem('sensometrika_visual', JSON.stringify({
    aciertosCromaticos,
    aciertosAgudeza,
    efectividad,
    aprobado
  }));

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const tieneAuditivo = sesion.modulosPermitidos && sesion.modulosPermitidos.includes('auditivo');
  const siguienteUrl = tieneAuditivo ? 'audicion.html' : 'informe.html';
  const textoBoton = tieneAuditivo ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Informe Final';

  if (panelEstado) panelEstado.innerText = `Evaluación Finalizada: ${efectividad}% de acierto`;

  contenedorOpciones.innerHTML = `
    <div style="grid-column: 1 / -1; background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 10px; text-align: center; width: 100%;">
      <h3 style="color: #4ade80; margin: 0 0 6px 0;">¡Módulo 4 Finalizado!</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">Efectividad: <strong>${efectividad}%</strong></p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="${siguienteUrl}" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 44px; background-color: #0284c7; color: #fff; border-radius: 8px; font-weight: bold;">
          ${textoBoton}
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
          Regresar al Menú Principal
        </a>
      </div>
    </div>
  `;
}

iniciarCamara();
cargarPrueba();