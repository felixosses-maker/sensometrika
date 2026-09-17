/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Bucle de animación garantizado
   • Vinculación universal de botones y mandos (táctil y PC)
   • Demo 20s -> Oficial 60s -> Descuento e informe
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas') || document.getElementById('canvas-circuito') || document.querySelector('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Elementos de la interfaz
const badgeModo = document.getElementById('badge-modo-palancas') || document.getElementById('badge-modo');
const txtTiempoCabecera = document.getElementById('txt-tiempo-palancas') || document.getElementById('txt-tiempo-cabecera');
const elCronometro = document.getElementById('cronometro') || document.getElementById('lbl-crono-palancas') || document.getElementById('lbl-cronometro');
const elContactos = document.getElementById('contador-toques') || document.getElementById('metrica-contactos');
const metricaCircuito = document.getElementById('metrica-circuito');
const panelMensaje = document.getElementById('panel-estado');
const zonaControles = document.getElementById('zona-coordinacion-palancas') || document.getElementById('zona-coordinacion-test');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let juegoActivo = false;
let toques = 0;
let tiempoRestante = 20;
let intervaloTiempo = null;
let animacionFrame = null;
let tocandoBorde = false;

// Coordenadas y físicas
let puntero = { x: 35, y: 45, radio: 7, velocidad: 2.3 };
let teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };

// Circuitos
const CIRCUITOS = [
  {
    nombre: "Trazado 1",
    inicio: { x: 35, y: 45 },
    meta: { x: 285, y: 175, radio: 11 },
    puntos: [
      { x: 35, y: 45 },
      { x: 250, y: 45 },
      { x: 250, y: 110 },
      { x: 75, y: 110 },
      { x: 75, y: 175 },
      { x: 285, y: 175 }
    ],
    anchoCanal: 28
  },
  {
    nombre: "Trazado 2",
    inicio: { x: 35, y: 45 },
    meta: { x: 285, y: 175, radio: 11 },
    puntos: [
      { x: 35, y: 45 },
      { x: 140, y: 45 },
      { x: 140, y: 140 },
      { x: 230, y: 140 },
      { x: 230, y: 60 },
      { x: 285, y: 60 },
      { x: 285, y: 175 }
    ],
    anchoCanal: 28
  }
];

let circuitoActual = CIRCUITOS[0];

function inicializar() {
  if (!canvas || !ctx) return;

  // Ajustar dimensiones internas
  if (!canvas.width || canvas.width < 320) canvas.width = 330;
  if (!canvas.height || canvas.height < 200) canvas.height = 230;

  // Vincular botón de inicio principal
  conectarBotonInicio();

  // Vincular mandos de dirección
  conectarMandos();

  // Validar cuotas en CreditManager si existe
  if (typeof CreditManager !== 'undefined') {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
    if (!CreditManager.puedeRendir('palancas')) {
      bloquearCupo();
      return;
    }
  }

  // Configuración de Demo inicial
  modo = 'DEMO';
  circuitoActual = CIRCUITOS[0];
  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
  tiempoRestante = 20;

  if (badgeModo) badgeModo.innerText = '🟡 Calibración Técnica (Demo 20s)';
  if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Fase de Inducción';
  if (elCronometro) elCronometro.innerText = '20 s';
  if (metricaCircuito) metricaCircuito.innerText = circuitoActual.nombre;
  if (panelMensaje) {
    panelMensaje.innerText = 'Modo Demo: Practica el control bimanual libremente.';
    panelMensaje.style.color = '#38bdf8';
  }

  const btn = obtenerBotonInicio();
  if (btn) {
    btn.style.display = 'block';
    btn.disabled = false;
    btn.style.backgroundColor = '#0284c7';
    btn.innerText = 'Iniciar Calibración (20 s)';
  }

  renderizar();
}

function obtenerBotonInicio() {
  return document.getElementById('btn-iniciar') || 
         document.getElementById('btn-iniciar-palancas') || 
         document.getElementById('btn-accion');
}

function conectarBotonInicio() {
  const btn = obtenerBotonInicio();
  if (!btn) return;

  btn.onclick = function(e) {
    e.preventDefault();
    if (juegoActivo) return;
    arrancarMovimiento();
  };
}

function arrancarMovimiento() {
  juegoActivo = true;
  toques = 0;
  tocandoBorde = false;

  if (elContactos) elContactos.innerText = '0';
  const btn = obtenerBotonInicio();
  if (btn) btn.style.display = 'none';

  tiempoRestante = (modo === 'DEMO') ? 20 : 60;
  if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

  if (panelMensaje) {
    panelMensaje.innerText = (modo === 'DEMO') 
      ? 'Calibrando: Conduce el punto a la meta verde.' 
      : 'Evaluación oficial: Conduce sin tocar los bordes.';
    panelMensaje.style.color = '#4ade80';
  }

  clearInterval(intervaloTiempo);
  intervaloTiempo = setInterval(() => {
    tiempoRestante--;
    if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      terminarPrueba(false);
    }
  }, 1000);

  // Iniciar ciclo de físicas
  cancelAnimationFrame(animacionFrame);
  bucle();
}

function bucle() {
  if (!juegoActivo) return;

  // Actualizar coordenadas
  if (teclas.arriba) puntero.y -= puntero.velocidad;
  if (teclas.abajo) puntero.y += puntero.velocidad;
  if (teclas.izquierda) puntero.x -= puntero.velocidad;
  if (teclas.derecha) puntero.x += puntero.velocidad;

  // Delimitar canvas
  puntero.x = Math.max(puntero.radio + 2, Math.min(canvas.width - puntero.radio - 2, puntero.x));
  puntero.y = Math.max(puntero.radio + 2, Math.min(canvas.height - puntero.radio - 2, puntero.y));

  // Detectar contacto
  const fuera = verificarSalidaPista(puntero.x, puntero.y);
  if (fuera) {
    if (!tocandoBorde) {
      tocandoBorde = true;
      toques++;
      if (elContactos) elContactos.innerText = toques;
      if ('vibrate' in navigator) navigator.vibrate(35);
    }
  } else {
    tocandoBorde = false;
  }

  // Detectar meta
  const meta = circuitoActual.meta;
  const dist = Math.hypot(puntero.x - meta.x, puntero.y - meta.y);
  if (dist <= meta.radio + 3) {
    terminarPrueba(true);
    return;
  }

  renderizar();
  animacionFrame = requestAnimationFrame(bucle);
}

function verificarSalidaPista(px, py) {
  const pts = circuitoActual.puntos;
  const radioPuntero = puntero.radio;
  const radioCanal = circuitoActual.anchoCanal / 2;

  let minDis = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanciaPuntoASegmento(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    if (d < minDis) minDis = d;
  }
  return (minDis + radioPuntero) >= radioCanal;
}

function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  return Math.hypot(px - xx, py - yy);
}

function terminarPrueba(metaAlcanzada) {
  juegoActivo = false;
  clearInterval(intervaloTiempo);
  cancelAnimationFrame(animacionFrame);

  teclas.arriba = false;
  teclas.abajo = false;
  teclas.izquierda = false;
  teclas.derecha = false;

  const duracion = (modo === 'DEMO') ? 20 : 60;
  const tiempoUsado = duracion - tiempoRestante;
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  if (modo === 'DEMO') {
    modo = 'OFICIAL';
    circuitoActual = CIRCUITOS[1];
    puntero.x = circuitoActual.inicio.x;
    puntero.y = circuitoActual.inicio.y;

    const actual = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;

    if (badgeModo) {
      badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max}`;
      badgeModo.style.color = '#38bdf8';
    }
    if (txtTiempoCabecera) txtTiempoCabecera.innerText = 'Evaluación Oficial (60 s)';
    if (elCronometro) elCronometro.innerText = '60 s';
    if (panelMensaje) {
      panelMensaje.innerText = '¡Calibración completada! Inicia tu simulación oficial.';
      panelMensaje.style.color = '#4ade80';
    }

    const btn = obtenerBotonInicio();
    if (btn) {
      btn.style.display = 'block';
      btn.style.backgroundColor = '#22c55e';
      btn.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    }
  } else {
    // Fase Oficial
    const consumidas = (typeof CreditManager !== 'undefined') ? CreditManager.registrarConsumo('palancas') : 1;
    const porcentaje = Math.max(0, 100 - (toques * 10));
    const aprobado = metaAlcanzada && toques <= 3;
    const motivoFalla = !metaAlcanzada ? 'Tiempo agotado (> 60 s)' : (toques > 3 ? `Exceso de toques (${toques} > 3)` : 'Aprobado');

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques,
      tiempo: tiempoUsado,
      porcentaje,
      aprobado,
      fecha: new Date().toISOString()
    }));

    let historial = JSON.parse(localStorage.getItem('sensometrika_historial_palancas')) || [];
    historial.push({
      simulacion: consumidas,
      toques,
      porcentaje,
      tiempo: tiempoUsado,
      aprobado,
      motivoFalla
    });
    localStorage.setItem('sensometrika_historial_palancas', JSON.stringify(historial));

    if (typeof CreditManager !== 'undefined') {
      CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
    }

    const contenedor = zonaControles || (panelMensaje && panelMensaje.parentNode);
    const card = document.createElement('div');
    card.style.cssText = 'background: #0f172a; border: 1.5px solid #22c55e; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;';
    card.innerHTML = `
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0;">¡Simulación ${consumidas} de ${max} Finalizada!</h3>
      <p style="color: #cbd5e1; font-size: 0.9rem; margin: 4px 0 10px 0;">
        Precisión: <strong style="color: #38bdf8;">${porcentaje}%</strong> (${toques} contactos)
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${consumidas < max ? `
          <button onclick="location.reload()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max} →
          </button>
        ` : ''}
        <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          Continuar a Módulo 3 (Punteo) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    `;
    if (contenedor) {
      contenedor.innerHTML = '';
      contenedor.appendChild(card);
    }
  }

  renderizar();
}

function bloquearCupo() {
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación ${max} de ${max} (Bloqueado)`;
    badgeModo.style.color = '#f87171';
  }
  if (panelMensaje) {
    panelMensaje.innerText = `Has completado el límite de ${max} simulaciones.`;
    panelMensaje.style.color = '#f87171';
  }
  const btn = obtenerBotonInicio();
  if (btn) btn.style.display = 'none';
}

function renderizar() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo
  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cuadrícula
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  const pts = circuitoActual.puntos;

  // Canal
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = circuitoActual.anchoCanal + 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  ctx.strokeStyle = '#0b1329';
  ctx.lineWidth = circuitoActual.anchoCanal - 2;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Guía punteada
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Meta
  const meta = circuitoActual.meta;
  ctx.beginPath();
  ctx.arc(meta.x, meta.y, meta.radio, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Puntero
  ctx.beginPath();
  ctx.arc(puntero.x, puntero.y, puntero.radio, 0, Math.PI * 2);
  ctx.fillStyle = tocandoBorde ? '#ef4444' : '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Conexión universal de mandos táctiles
function conectarMandos() {
  function enlazarBoton(selectores, direccion) {
    let el = null;
    for (let sel of selectores) {
      el = document.querySelector(sel);
      if (el) break;
    }
    if (!el) return;

    const activar = (e) => {
      e.preventDefault();
      if (!juegoActivo) arrancarMovimiento(); // Auto-inicia al tocar los mandos
      teclas[direccion] = true;
    };
    const desactivar = (e) => {
      e.preventDefault();
      teclas[direccion] = false;
    };

    el.addEventListener('pointerdown', activar);
    el.addEventListener('pointerup', desactivar);
    el.addEventListener('pointerleave', desactivar);
  }

  enlazarBoton(['#btn-arriba', '#btn-izq-arriba'], 'arriba');
  enlazarBoton(['#btn-abajo', '#btn-izq-abajo'], 'abajo');
  enlazarBoton(['#btn-izq', '#btn-der-izq'], 'izquierda');
  enlazarBoton(['#btn-der', '#btn-der-der'], 'derecha');

  // Soporte teclado PC
  window.addEventListener('keydown', (e) => {
    if (!juegoActivo && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD'].includes(e.code)) {
      arrancarMovimiento();
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') teclas.arriba = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') teclas.abajo = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') teclas.izquierda = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') teclas.derecha = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') teclas.arriba = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') teclas.abajo = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') teclas.izquierda = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') teclas.derecha = false;
  });
}

window.addEventListener('DOMContentLoaded', inicializar);