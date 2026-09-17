/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Escala calibrada 440x240 px (PC y Móvil proporcional)
   • 1 Único botón central reactivo
   • Cronómetro activo y física vectorial de colisión continua
   • Medición acumulada de tiempo en error (ms y segundos)
   • Banco de Circuitos variables anti-memorización
   • Persistencia total y sincronización con CreditManager
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo');
const txtContactos = document.getElementById('txt-contactos');
const txtTiempo = document.getElementById('txt-tiempo');
const txtCircuito = document.getElementById('txt-circuito');
const txtInstruccion = document.getElementById('txt-instruccion');
const btnIniciar = document.getElementById('btn-iniciar');
const zonaResultados = document.getElementById('zona-resultados');

// Mandos táctiles
const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

// Modal
const modalGuia = document.getElementById('modal-guia');
const btnAbrirAyuda = document.getElementById('btn-abrir-ayuda');
const btnCerrarAyuda = document.getElementById('btn-cerrar-ayuda');

if (btnAbrirAyuda) btnAbrirAyuda.onclick = () => modalGuia.style.display = 'flex';
if (btnCerrarAyuda) btnCerrarAyuda.onclick = () => modalGuia.style.display = 'none';

// Estados
let fase = 'DEMO'; // 'DEMO', 'ESPERA_OFICIAL', 'OFICIAL', 'FINALIZADO'
let activo = false;
let relojInterval = null;
let animFrame = null;

let tiempoRestante = 20;
let toques = 0;
let tiempoErrorMs = 0;
let instanteContacto = null;
let enError = false;

// Puntero electromecánico
let px = 45, py = 50;
const radioPuntero = 7.5;
const vel = 2.6;
const teclas = { arriba: false, abajo: false, izq: false, der: false };

// BANCO DE CIRCUITOS NORMATIVOS (440x240 px)
const PISTA_DEMO = {
  nombre: "Trazado 1 (Inducción)",
  inicio: { x: 50, y: 55 },
  meta: { x: 380, y: 185, r: 13 },
  ancho: 34,
  puntos: [
    { x: 50, y: 55 },
    { x: 320, y: 55 },
    { x: 320, y: 120 },
    { x: 100, y: 120 },
    { x: 100, y: 185 },
    { x: 380, y: 185 }
  ]
};

const BANCO_OFICIAL = [
  {
    nombre: "Trazado 2 (Escalera)",
    inicio: { x: 50, y: 55 },
    meta: { x: 380, y: 190, r: 13 },
    ancho: 32,
    puntos: [
      { x: 50, y: 55 },
      { x: 180, y: 55 },
      { x: 180, y: 130 },
      { x: 280, y: 130 },
      { x: 280, y: 70 },
      { x: 380, y: 70 },
      { x: 380, y: 190 }
    ]
  },
  {
    nombre: "Trazado 3 (Bayoneta)",
    inicio: { x: 50, y: 185 },
    meta: { x: 380, y: 55, r: 13 },
    ancho: 32,
    puntos: [
      { x: 50, y: 185 },
      { x: 160, y: 185 },
      { x: 160, y: 90 },
      { x: 280, y: 90 },
      { x: 280, y: 185 },
      { x: 380, y: 185 },
      { x: 380, y: 55 }
    ]
  },
  {
    nombre: "Trazado 4 (Zigzag)",
    inicio: { x: 50, y: 55 },
    meta: { x: 60, y: 195, r: 13 },
    ancho: 32,
    puntos: [
      { x: 50, y: 55 },
      { x: 370, y: 55 },
      { x: 370, y: 125 },
      { x: 160, y: 125 },
      { x: 160, y: 195 },
      { x: 60, y: 195 }
    ]
  }
];

let circuitoActivo = PISTA_DEMO;

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.puedeRendir('palancas')) {
      bloquearModuloPorCupo();
      return;
    }
  }
  prepararDemo();
  dibujar();
});

function bloquearModuloPorCupo() {
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  btnIniciar.disabled = true;
  btnIniciar.style.opacity = '0.4';
  btnIniciar.innerText = `Cupo Bloqueado (${max}/${max})`;
  txtInstruccion.innerText = `Has completado el límite de ${max} simulaciones para este módulo.`;
  txtInstruccion.style.color = '#f87171';
  zonaResultados.innerHTML = `
    <div style="background:#0f172a; border:1px solid #ef4444; border-radius:8px; padding:12px; text-align:center; margin-top:10px;">
      <a href="menu.html" style="color:#38bdf8; text-decoration:none; font-weight:bold;">Volver al Menú Principal</a>
    </div>
  `;
}

function prepararDemo() {
  fase = 'DEMO';
  circuitoActivo = PISTA_DEMO;
  tiempoRestante = 20;
  toques = 0;
  tiempoErrorMs = 0;
  enError = false;
  px = circuitoActivo.inicio.x;
  py = circuitoActivo.inicio.y;

  badgeModo.innerText = '🟡 Calibración Técnica (Demo 20s)';
  badgeModo.style.color = '#facc15';
  badgeModo.style.background = 'rgba(250, 204, 21, 0.1)';
  badgeModo.style.borderColor = 'rgba(250, 204, 21, 0.25)';

  txtContactos.innerText = '0';
  txtTiempo.innerText = '20 s';
  txtCircuito.innerText = circuitoActivo.nombre;
  txtInstruccion.innerText = 'Calibrando: Conduce el punto amarillo a la meta verde.';
  
  btnIniciar.style.display = 'block';
  btnIniciar.style.backgroundColor = '#0284c7';
  btnIniciar.innerText = 'Iniciar Calibración (20 s)';
}

function prepararOficial() {
  fase = 'OFICIAL';
  const numSim = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const maxSim = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  // Rotación aleatoria del trazado oficial
  const idx = (numSim - 1) % BANCO_OFICIAL.length;
  circuitoActivo = BANCO_OFICIAL[idx];

  tiempoRestante = 60;
  toques = 0;
  tiempoErrorMs = 0;
  enError = false;
  px = circuitoActivo.inicio.x;
  py = circuitoActivo.inicio.y;

  badgeModo.innerText = `🔴 Simulación Oficial ${numSim} de ${maxSim} (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  badgeModo.style.background = 'rgba(56, 189, 248, 0.1)';
  badgeModo.style.borderColor = 'rgba(56, 189, 248, 0.25)';

  txtContactos.innerText = '0';
  txtTiempo.innerText = '60 s';
  txtCircuito.innerText = circuitoActivo.nombre;
  txtInstruccion.innerText = 'Evaluación Oficial: Recorre la pista sin tocar los bordes.';

  btnIniciar.style.display = 'none';
  iniciarLoop();
}

btnIniciar.addEventListener('click', () => {
  if (fase === 'DEMO') {
    btnIniciar.style.display = 'none';
    iniciarLoop();
  } else if (fase === 'ESPERA_OFICIAL') {
    prepararOficial();
  }
});

function iniciarLoop() {
  activo = true;
  clearInterval(relojInterval);
  relojInterval = setInterval(() => {
    if (!activo) return;
    tiempoRestante--;
    txtTiempo.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      concluir(false);
    }
  }, 1000);

  cancelAnimationFrame(animFrame);
  bucleFisicas();
}

function bucleFisicas() {
  if (!activo) return;

  if (teclas.arriba) py -= vel;
  if (teclas.abajo) py += vel;
  if (teclas.izq) px -= vel;
  if (teclas.der) px += vel;

  px = Math.max(radioPuntero + 2, Math.min(canvas.width - radioPuntero - 2, px));
  py = Math.max(radioPuntero + 2, Math.min(canvas.height - radioPuntero - 2, py));

  evaluarColision();
  evaluarMeta();
  dibujar();

  animFrame = requestAnimationFrame(bucleFisicas);
}

// Distancia mínima punto-segmento
function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }

  return Math.hypot(px - xx, py - yy);
}

function evaluarColision() {
  const pts = circuitoActivo.puntos;
  const radioCanal = circuitoActivo.ancho / 2;
  let minDist = Infinity;

  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanciaPuntoASegmento(px, py, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    if (d < minDist) minDist = d;
  }

  const enContacto = (minDist + radioPuntero) >= radioCanal;
  const ahora = performance.now();

  if (enContacto) {
    if (!enError) {
      enError = true;
      toques++;
      txtContactos.innerText = toques;
      instanteContacto = ahora;
      if ('vibrate' in navigator) navigator.vibrate(35);
    } else {
      tiempoErrorMs += (ahora - instanteContacto);
      instanteContacto = ahora;
    }
  } else {
    if (enError) {
      tiempoErrorMs += (ahora - instanteContacto);
      enError = false;
      instanteContacto = null;
    }
  }
}

function evaluarMeta() {
  const meta = circuitoActivo.meta;
  const d = Math.hypot(px - meta.x, py - meta.y);
  if (d <= meta.r + 3) {
    concluir(true);
  }
}

function concluir(metaAlcanzada) {
  activo = false;
  clearInterval(relojInterval);
  cancelAnimationFrame(animFrame);

  if (enError && instanteContacto) {
    tiempoErrorMs += (performance.now() - instanteContacto);
    enError = false;
  }

  const segError = (tiempoErrorMs / 1000).toFixed(2);

  if (fase === 'DEMO') {
    fase = 'ESPERA_OFICIAL';
    txtInstruccion.innerText = `Calibración finalizada: ${toques} toques (${segError}s en error).`;
    txtInstruccion.style.color = '#4ade80';

    const numSim = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
    const maxSim = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('palancas') : 3;

    btnIniciar.style.display = 'block';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de ${maxSim})`;
    btnIniciar.style.backgroundColor = '#22c55e';
  } else {
    fase = 'FINALIZADO';
    guardarResultadoOficial(metaAlcanzada, segError);
  }
}

function guardarResultadoOficial(metaAlcanzada, segError) {
  let consumidas = 1;
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('palancas');
  }

  const maxSim = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  const tiempoUsado = 60 - Math.max(0, tiempoRestante);
  const aprobado = metaAlcanzada && toques <= 3 && parseFloat(segError) <= 2.5;
  const efectividad = Math.max(0, 100 - (toques * 10) - Math.round(parseFloat(segError) * 4));

  localStorage.setItem('sensometrika_palancas', JSON.stringify({
    toques: toques,
    contactos: toques,
    tiempo: tiempoUsado,
    tiempoError: parseFloat(segError),
    porcentaje: efectividad,
    efectividad: efectividad,
    aprobado: aprobado,
    circuito: circuitoActivo.nombre,
    fecha: new Date().toISOString()
  }));

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_palancas')) || [];
  historial.push({
    simulacion: consumidas,
    toques: toques,
    tiempo: tiempoUsado,
    tiempoError: parseFloat(segError),
    efectividad: efectividad,
    aprobado: aprobado
  });
  localStorage.setItem('sensometrika_historial_palancas', JSON.stringify(historial));

  const bloqueado = consumidas >= maxSim;
  txtInstruccion.innerText = aprobado ? '¡Simulación Aprobada!' : 'Evaluación Fuera de Estándar';
  txtInstruccion.style.color = aprobado ? '#4ade80' : '#f87171';

  zonaResultados.innerHTML = `
    <div style="background:#090e1c; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:12px; padding:16px; text-align:center; margin-top:10px;">
      <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.05rem;">
        ¡Simulación ${consumidas} de ${maxSim} Finalizada!
      </h3>
      <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 12px 0;">
        Contactos: <strong style="color:#fff;">${toques}</strong> &nbsp;|&nbsp; 
        Tiempo en error: <strong style="color:#fff;">${segError} s</strong> &nbsp;|&nbsp;
        Efectividad: <strong style="color:#38bdf8;">${efectividad}%</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${!bloqueado ? `
          <button onclick="location.reload()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${maxSim} →
          </button>
        ` : ''}
        <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:0.92rem;">
          Continuar a Módulo 3 (Punteo) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}

function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cuadrícula técnica sutil
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < canvas.width; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  const pts = circuitoActivo.puntos;

  // Canal exterior neón
  ctx.strokeStyle = enError ? '#ef4444' : '#0284c7';
  ctx.lineWidth = circuitoActivo.ancho + 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Interior de la pista
  ctx.strokeStyle = '#090e1c';
  ctx.lineWidth = circuitoActivo.ancho - 2;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Eje central punteado
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Meta verde luminosa
  const meta = circuitoActivo.meta;
  ctx.beginPath();
  ctx.arc(meta.x, meta.y, meta.r, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Puntero electromecánico
  ctx.beginPath();
  ctx.arc(px, py, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = enError ? '#ef4444' : '#facc15';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Mandos táctiles
function enlazar(btn, dir) {
  const on = (e) => { e.preventDefault(); teclas[dir] = true; };
  const off = (e) => { e.preventDefault(); teclas[dir] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
}

enlazar(btnArriba, 'arriba');
enlazar(btnAbajo, 'abajo');
enlazar(btnIzq, 'izq');
enlazar(btnDer, 'der');

// Teclado PC (W/A/S/D y Flechas)
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); teclas.arriba = true; }
  if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); teclas.abajo = true; }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); teclas.izq = true; }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); teclas.der = true; }
});
window.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'w', 'W'].includes(e.key)) teclas.arriba = false;
  if (['ArrowDown', 's', 'S'].includes(e.key)) teclas.abajo = false;
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) teclas.izq = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) teclas.der = false;
});