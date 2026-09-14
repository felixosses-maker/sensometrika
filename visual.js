/* ==========================================================================
   MÓDULO 4: TAMIZAJE VISUAL (ISHIHARA + AGUDEZA CON CÁMARA FRONTAL)
   ========================================================================== */
const BANCO_ISHIHARA = [
  { numero: '12', fondo: '#e27d60', patron: '#41b3a3', opciones: ['12', '74', 'No distingo', '8'] },
  { numero: '8',  fondo: '#85dcba', patron: '#e8a87c', opciones: ['3', '8', 'No distingo', '5'] },
  { numero: '74', fondo: '#c38d9e', patron: '#41b3a3', opciones: ['21', '74', 'No distingo', '71'] },
  { numero: '29', fondo: '#a3e4d7', patron: '#e74c3c', opciones: ['70', '29', 'No distingo', '26'] }
];

const ANGULOS_E = [
  { ang: 0,   dir: 'Derecha' },
  { ang: 90,  dir: 'Abajo' },
  { ang: 180, dir: 'Izquierda' },
  { ang: 270, dir: 'Arriba' }
];

let bateriaPruebas = [];
let indiceActual = 0;
let aciertos = 0;
let pruebaFinalizada = false;
let camaraActiva = false;

// Elementos del DOM
const modalPermiso = document.getElementById('modal-permiso-camara');
const btnConceder = document.querySelector('#modal-permiso-camara button');
const btnModoManual = document.querySelector('#modal-permiso-camara a');
const video = document.getElementById('video-camara');
const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIsh = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const optotipo = document.getElementById('simbolo-optotipo');
const panelOpciones = document.getElementById('contenedor-opciones');
const lblFase = document.getElementById('indicador-fase');
const lblAciertos = document.getElementById('contador-aciertos');
const lblDistancia = document.getElementById('estado-distancia');

function generarBateria() {
  const cromaticos = [...BANCO_ISHIHARA].sort(() => Math.random() - 0.5).slice(0, 3).map(i => ({
    tipo: 'ISHIHARA',
    correcto: i.numero,
    fondo: i.fondo,
    patron: i.patron,
    opciones: i.opciones
  }));

  const escalas = ['3.8rem', '2.5rem', '1.6rem'];
  const agudeza = escalas.map(tam => {
    const elegido = ANGULOS_E[Math.floor(Math.random() * ANGULOS_E.length)];
    return {
      tipo: 'OPTOTIPO',
      correcto: elegido.dir,
      rotacion: elegido.ang,
      tamano: tam,
      opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo']
    };
  });

  return [...cromaticos, ...agudeza];
}

async function activarCamaraYEmpezar() {
  // Ocultar modal de inmediato para no congelar la pantalla
  if (modalPermiso) modalPermiso.style.display = 'none';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false
    });
    camaraActiva = true;
    if (video) {
      video.srcObject = stream;
      video.play();
    }
    if (lblDistancia) {
      lblDistancia.innerText = 'Óptima (~50 cm)';
      lblDistancia.style.color = '#4ade80';
    }
  } catch (err) {
    console.warn('Cámara no autorizada. Iniciando en Modo Asistido Brazo Extendido.');
    if (lblDistancia) {
      lblDistancia.innerText = 'Manual (Brazo Ext.)';
      lblDistancia.style.color = '#38bdf8';
    }
  }

  cargarEstimulo();
}

function activarModoManual(e) {
  if (e) e.preventDefault();
  if (modalPermiso) modalPermiso.style.display = 'none';
  if (lblDistancia) {
    lblDistancia.innerText = 'Manual (Brazo Ext.)';
    lblDistancia.style.color = '#38bdf8';
  }
  cargarEstimulo();
}

function cargarEstimulo() {
  if (indiceActual >= bateriaPruebas.length) {
    finalizarTamizaje();
    return;
  }

  const item = bateriaPruebas[indiceActual];
  if (lblAciertos) lblAciertos.innerText = `${aciertos}/${indiceActual}`;
  if (panelOpciones) panelOpciones.innerHTML = '';

  if (item.tipo === 'ISHIHARA') {
    if (lblFase) lblFase.innerText = 'Cromático (Ishihara)';
    if (canvasIshihara) canvasIshihara.style.display = 'block';
    if (optotipo) optotipo.style.display = 'none';
    dibujarIshihara(item.correcto, item.fondo, item.patron);
  } else {
    if (lblFase) lblFase.innerText = 'Agudeza Visual (Optotipo E)';
    if (canvasIshihara) canvasIshihara.style.display = 'none';
    if (optotipo) {
      optotipo.style.display = 'block';
      optotipo.innerText = 'E';
      optotipo.style.transform = `rotate(${item.rotacion}deg)`;
      optotipo.style.fontSize = item.tamano;
    }
  }

  item.opciones.forEach(opc => {
    const btn = document.createElement('button');
    btn.className = 'btn-opcion';
    btn.innerText = opc;
    btn.onclick = () => responder(opc === item.correcto);
    panelOpciones.appendChild(btn);
  });
}

function responder(esCorrecta) {
  if (pruebaFinalizada) return;
  if (esCorrecta) aciertos++;
  indiceActual++;
  cargarEstimulo();
}

function dibujarIshihara(texto, cFondo, cTexto) {
  if (!ctxIsh) return;
  ctxIsh.clearRect(0, 0, 200, 200);

  for (let i = 0; i < 450; i++) {
    const r = Math.random() * 85;
    const a = Math.random() * Math.PI * 2;
    const x = 100 + r * Math.cos(a);
    const y = 100 + r * Math.sin(a);
    ctxIsh.beginPath();
    ctxIsh.arc(x, y, Math.random() * 3 + 2, 0, Math.PI * 2);
    ctxIsh.fillStyle = cFondo;
    ctxIsh.globalAlpha = 0.7;
    ctxIsh.fill();
  }

  ctxIsh.font = 'bold 60px Arial';
  ctxIsh.fillStyle = cTexto;
  ctxIsh.textAlign = 'center';
  ctxIsh.textBaseline = 'middle';
  ctxIsh.globalAlpha = 0.95;
  ctxIsh.fillText(texto, 100, 105);
  ctxIsh.globalAlpha = 1.0;
}

function finalizarTamizaje() {
  pruebaFinalizada = true;
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  const efectividad = Math.round((aciertos / bateriaPruebas.length) * 100);
  const aprobado = efectividad >= 80;

  localStorage.setItem('sensometrika_visual', JSON.stringify({
    efectividad: efectividad,
    aciertos: aciertos,
    total: bateriaPruebas.length,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const permitidos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo', 'visual', 'auditivo'];
  const tieneAuditivo = permitidos.includes('auditivo');

  const siguienteUrl = tieneAuditivo ? 'audicion.html' : 'informe.html';
  const textoBoton = tieneAuditivo ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Dictamen e Informe Consolidado';

  panelOpciones.innerHTML = `
    <div style="grid-column: 1 / -1; background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; text-align: center;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0;">
        Tamizaje Visual: ${aprobado ? 'Aprobado' : 'Observado'} (${efectividad}%)
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">
        ${aprobado ? 'Cumple con discriminación cromática y agudeza mínima.' : 'Sugiere revisión oftalmológica ocupacional.'}
      </p>
      <a href="${siguienteUrl}" style="display: block; background: #0284c7; color: #fff; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: bold;">
        ${textoBoton}
      </a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  bateriaPruebas = generarBateria();
  if (btnConceder) btnConceder.addEventListener('click', activarCamaraYEmpezar);
  if (btnModoManual) btnModoManual.addEventListener('click', activarModoManual);
});