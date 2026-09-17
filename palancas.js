/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Medición dual: Cantidad de toques y Tiempo acumulado en error
   • Secuencia: Demo Calibración (20 s) ➔ Simulación Oficial (60 s)
   • Conteo y persistencia sincronizada con CreditManager e informe.html
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas') || document.querySelector('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const elCronometro = document.getElementById('cronometro') || document.getElementById('lbl-crono-palancas');
const elContactos = document.getElementById('contador-toques') || document.getElementById('metrica-contactos');
const panelMensaje = document.getElementById('panel-estado');
const badgeModo = document.getElementById('badge-modo-palancas') || document.querySelector('.badge-modo');
const txtCircuito = document.getElementById('metrica-circuito');
const zonaControles = document.getElementById('zona-coordinacion-palancas');

const btnArriba = document.getElementById('btn-izq-arriba') || document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-izq-abajo') || document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-der-izq') || document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der-der') || document.getElementById('btn-der');

let btnIniciar = null;

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let juegoActivo = false;
let toques = 0;
let tiempoRestante = 20;
let intervaloTiempo = null;
let animacionFrame = null;

// Telemetría de error
let tocandoBorde = false;
let inicioContactoTimestamp = 0;
let tiempoTotalErrorMs = 0;

// Puntero electromecánico
let puntero = { x: 38, y: 45, radio: 7, velocidad: 2.3 };
let teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };

// Circuitos normativos (D.S. N° 170)
const CIRCUITOS = [
  {
    nombre: "Trazado 1 (Demo)",
    inicio: { x: 38, y: 45 },
    meta: { x: 290, y: 175, radio: 11 },
    puntos: [
      { x: 35, y: 45 },
      { x: 250, y: 45 },
      { x: 250, y: 110 },
      { x: 75, y: 110 },
      { x: 75, y: 175 },
      { x: 295, y: 175 }
    ],
    anchoCanal: 30
  },
  {
    nombre: "Trazado Oficial",
    inicio: { x: 38, y: 45 },
    meta: { x: 290, y: 175, radio: 11 },
    puntos: [
      { x: 35, y: 45 },
      { x: 140, y: 45 },
      { x: 140, y: 140 },
      { x: 230, y: 140 },
      { x: 230, y: 60 },
      { x: 295, y: 60 },
      { x: 295, y: 175 }
    ],
    anchoCanal: 28
  }
];

let circuitoActual = CIRCUITOS[0];

window.addEventListener('DOMContentLoaded', () => {
  inicializarModulo();
});

function inicializarModulo() {
  if (!canvas || !ctx) return;

  if (!canvas.width || canvas.width < 320) canvas.width = 340;
  if (!canvas.height || canvas.height < 200) canvas.height = 220;

  unificarBotonIniciar();

  if (window.CreditManager) {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');

    if (!CreditManager.puedeRendir('palancas')) {
      bloquearModuloPorCupo();
      return;
    }
  }

  prepararFaseDemo();
}

function unificarBotonIniciar() {
  const posiblesBotones = document.querySelectorAll('#btn-iniciar, #btn-iniciar-palancas');
  if (posiblesBotones.length > 1) {
    for (let i = 1; i < posiblesBotones.length; i++) {
      posiblesBotones[i].remove();
    }
  }

  btnIniciar = document.getElementById('btn-iniciar') || document.getElementById('btn-iniciar-palancas');

  if (!btnIniciar) {
    btnIniciar = document.createElement('button');
    btnIniciar.id = 'btn-iniciar';
    btnIniciar.style.cssText = 'width: 100%; height: 46px; border: none; border-radius: 8px; font-weight: 800; font-size: 0.95rem; color: #fff; background: #0284c7; margin: 12px 0; cursor: pointer; display: block;';
    
    if (panelMensaje && panelMensaje.parentNode) {
      panelMensaje.parentNode.insertBefore(btnIniciar, panelMensaje.nextSibling);
    }
  }

  btnIniciar.onclick = (e) => {
    e.preventDefault();
    if (btnIniciar.disabled || juegoActivo) return;
    iniciarRecorrido();
  };
}

function prepararFaseDemo() {
  modo = 'DEMO';
  juegoActivo = false;
  toques = 0;
  tiempoTotalErrorMs = 0;
  tocandoBorde = false;
  circuitoActual = CIRCUITOS[0];
  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
  tiempoRestante = 20;

  const previo = document.getElementById('panel-final-palancas');
  if (previo) previo.remove();

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica (Demo 20s)';
    badgeModo.style.color = '#facc15';
  }
  if (txtCircuito) txtCircuito.innerText = 'Trazado 1';
  if (elCronometro) elCronometro.innerText = '20 s';
  if (elContactos) elContactos.innerText = '0';

  if (panelMensaje) {
    panelMensaje.innerText = 'Calibrando: Conduce el punto a la meta verde.';
    panelMensaje.style.color = '#38bdf8';
  }

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.backgroundColor = '#0284c7';
    btnIniciar.innerText = 'Iniciar Calibración (20 s)';
  }

  renderizar();
}

function prepararFaseOficial() {
  modo = 'OFICIAL';
  juegoActivo = false;
  toques = 0;
  tiempoTotalErrorMs = 0;
  tocandoBorde = false;
  circuitoActual = CIRCUITOS[1];
  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
  tiempoRestante = 60;

  const previo = document.getElementById('panel-final-palancas');
  if (previo) previo.remove();

  const actual = window.CreditManager ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
    badgeModo.style.color = '#38bdf8';
  }
  if (txtCircuito) txtCircuito.innerText = 'Trazado Oficial';
  if (elCronometro) elCronometro.innerText = '60 s';
  if (elContactos) elContactos.innerText = '0';

  if (panelMensaje) {
    panelMensaje.innerText = 'Evaluación Oficial: Recorre la pista sin rozar bordes (Máx. 3 toques / ≤ 2.0 s de error).';
    panelMensaje.style.color = '#fbbf24';
  }

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.backgroundColor = '#22c55e';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
  }

  renderizar();
}

function iniciarRecorrido() {
  toques = 0;
  tiempoTotalErrorMs = 0;
  tocandoBorde = false;
  juegoActivo = true;

  if (elContactos) elContactos.innerText = '0';
  if (btnIniciar) btnIniciar.style.display = 'none';

  tiempoRestante = (modo === 'DEMO') ? 20 : 60;
  if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

  if (panelMensaje) {
    panelMensaje.innerText = (modo === 'DEMO')
      ? 'Fase Calibración: Conduce el punto a la meta verde.'
      : 'Evaluación Oficial en curso: Mantén el pulso constante.';
    panelMensaje.style.color = '#38bdf8';
  }

  clearInterval(intervaloTiempo);
  intervaloTiempo = setInterval(() => {
    tiempoRestante--;
    if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      finalizarPrueba(false);
    }
  }, 1000);

  actualizar();
}

function actualizar() {
  if (!juegoActivo) return;

  if (teclas.arriba) puntero.y -= puntero.velocidad;
  if (teclas.abajo) puntero.y += puntero.velocidad;
  if (teclas.izquierda) puntero.x -= puntero.velocidad;
  if (teclas.derecha) puntero.x += puntero.velocidad;

  const colisiona = evaluarContactoBorde(puntero.x, puntero.y);
  const ahora = performance.now();

  if (colisiona) {
    if (!tocandoBorde) {
      tocandoBorde = true;
      inicioContactoTimestamp = ahora;
      toques++;
      if (elContactos) elContactos.innerText = toques;
      if ('vibrate' in navigator) navigator.vibrate(40);
    } else {
      // Acumular tiempo mientras sigue en contacto con el borde
      tiempoTotalErrorMs += (ahora - inicioContactoTimestamp);
      inicioContactoTimestamp = ahora;
    }
  } else {
    if (tocandoBorde) {
      tiempoTotalErrorMs += (ahora - inicioContactoTimestamp);
      tocandoBorde = false;
    }
  }

  const meta = circuitoActual.meta;
  const distMeta = Math.hypot(puntero.x - meta.x, puntero.y - meta.y);
  if (distMeta <= meta.radio + 4) {
    finalizarPrueba(true);
    return;
  }

  renderizar();
  animacionFrame = requestAnimationFrame(actualizar);
}

function evaluarContactoBorde(px, py) {
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
  if (param < 0) {
    xx = x1; yy = y1;
  } else if (param > 1) {
    xx = x2; yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return Math.hypot(px - xx, py - yy);
}

function finalizarPrueba(metaAlcanzada) {
  juegoActivo = false;
  clearInterval(intervaloTiempo);
  cancelAnimationFrame(animacionFrame);

  if (tocandoBorde) {
    tiempoTotalErrorMs += (performance.now() - inicioContactoTimestamp);
    tocandoBorde = false;
  }

  const duracionTotal = (modo === 'DEMO') ? 20 : 60;
  const tiempoUsado = duracionTotal - Math.max(0, tiempoRestante);
  const tiempoErrorSegundos = (tiempoTotalErrorMs / 1000).toFixed(2);
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  if (modo === 'DEMO') {
    if (panelMensaje) {
      panelMensaje.innerText = `Calibración finalizada: ${toques} toques (${tiempoErrorSegundos} s en error). Pasa a la prueba oficial.`;
      panelMensaje.style.color = '#4ade80';
    }
    prepararFaseOficial();
  } else {
    // Criterio normativo: meta completada, toques <= 3 y permanencia en error <= 2.5 s
    const aprobado = metaAlcanzada && toques <= 3 && parseFloat(tiempoErrorSegundos) <= 2.5;
    let efectividad = Math.max(0, 100 - (toques * 10) - Math.round(parseFloat(tiempoErrorSegundos) * 5));

    const consumidas = window.CreditManager ? CreditManager.registrarConsumo('palancas') : 1;
    const bloqueoTotal = consumidas >= max;

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: toques,
      tiempoError: parseFloat(tiempoErrorSegundos),
      tiempo: tiempoUsado,
      porcentaje: efectividad,
      aprobado: aprobado,
      fecha: new Date().toISOString()
    }));

    if (window.CreditManager) {
      CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
    }

    if (panelMensaje) {
      panelMensaje.innerText = aprobado 
        ? `¡Aprobado! ${tiempoUsado} s recorridos con ${toques} contactos (${tiempoErrorSegundos} s error).` 
        : `Reprobado (${!metaAlcanzada ? 'Tiempo agotado' : `${toques} toques / ${tiempoErrorSegundos} s error`}).`;
      panelMensaje.style.color = aprobado ? '#4ade80' : '#f87171';
    }

    // Ocultar botón de calibración para evitar duplicados visuales
    if (btnIniciar) btnIniciar.style.display = 'none';

    const contenedorDestino = zonaControles || panelMensaje.parentNode;
    const panelFinal = document.createElement('div');
    panelFinal.id = 'panel-final-palancas';
    panelFinal.style.cssText = `background: #020617; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 16px; margin: 14px 0; text-align: center; width: 100%; box-sizing: border-box;`;
    
    panelFinal.innerHTML = `
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color: #cbd5e1; font-size: 0.9rem; margin: 4px 0 10px 0;">
        <strong>Errores:</strong> ${toques} toques &nbsp;|&nbsp; 
        <strong>Permanencia en error:</strong> ${tiempoErrorSegundos} s
      </p>
      <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px;">
        ${bloqueoTotal ? `Has alcanzado el límite máximo de ${max}/${max} simulaciones.` : `Te restan ${max - consumidas} simulación(es) disponible(s).`}
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${!bloqueoTotal ? `
          <button onclick="prepararFaseOficialDirecta()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.9rem;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max} →
          </button>
        ` : ''}
        <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:0.9rem;">
          Continuar a Módulo 3 (Punteo) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    `;

    const previo = document.getElementById('panel-final-palancas');
    if (previo) previo.remove();
    contenedorDestino.prepend(panelFinal);

    if (bloqueoTotal) {
      bloquearModuloPorCupo();
    }
  }

  renderizar();
}

window.prepararFaseOficialDirecta = function() {
  const panel = document.getElementById('panel-final-palancas');
  if (panel) panel.remove();
  prepararFaseOficial();
};

function bloquearModuloPorCupo() {
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  if (btnIniciar) {
    btnIniciar.disabled = true;
    btnIniciar.style.display = 'none';
  }
  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${max} de ${max} (Bloqueado)`;
    badgeModo.style.color = '#f87171';
  }
  if (panelMensaje) {
    panelMensaje.innerText = `Has completado tus ${max} simulaciones permitidas para este módulo.`;
    panelMensaje.style.color = '#f87171';
  }
  renderizar();
}

function renderizar() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  const pts = circuitoActual.puntos;

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

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  const meta = circuitoActual.meta;
  ctx.beginPath();
  ctx.arc(meta.x, meta.y, meta.radio, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(puntero.x, puntero.y, puntero.radio, 0, Math.PI * 2);
  ctx.fillStyle = tocandoBorde ? '#ef4444' : '#eab308';
  ctx.shadowColor = tocandoBorde ? '#ef4444' : '#eab308';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function vincularBoton(btn, direccion) {
  if (!btn) return;
  const activar = (e) => { 
    e.preventDefault(); 
    if (!juegoActivo && btnIniciar && btnIniciar.style.display !== 'none') {
      iniciarRecorrido();
    }
    teclas[direccion] = true; 
  };
  const desactivar = (e) => { 
    e.preventDefault(); 
    teclas[direccion] = false; 
  };
  btn.addEventListener('pointerdown', activar);
  btn.addEventListener('pointerup', desactivar);
  btn.addEventListener('pointerleave', desactivar);
  btn.addEventListener('touchstart', activar, { passive: false });
  btn.addEventListener('touchend', desactivar, { passive: false });
}

vincularBoton(btnArriba, 'arriba');
vincularBoton(btnAbajo, 'abajo');
vincularBoton(btnIzq, 'izquierda');
vincularBoton(btnDer, 'derecha');

window.addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') teclas.arriba = true;
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') teclas.abajo = true;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') teclas.izquierda = true;
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') teclas.derecha = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') teclas.arriba = false;
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') teclas.abajo = false;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') teclas.izquierda = false;
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') teclas.derecha = false;
});