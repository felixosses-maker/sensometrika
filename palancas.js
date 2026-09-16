/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Coordinación motriz bimanual D.S. N° 170
   • Conexión y descuento en CreditManager
   • Bloqueo estricto al completar cupo
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas ? canvas.getContext('2d') : null;

const elCronometro = document.getElementById('cronometro');
const elContactos = document.getElementById('contador-toques');
const panelMensaje = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-palancas') || document.getElementById('btn-iniciar');
const badgeModo = document.getElementById('badge-modo-palancas');
const zonaCoordinacion = document.getElementById('zona-coordinacion-palancas');

const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

let modo = 'DEMO';
let juegoActivo = false;
let toques = 0;
let tiempoRestante = 20;
let intervaloTiempo = null;
let animacionFrame = null;
let tocandoBorde = false;

let puntero = { x: 35, y: 40, radio: 6, velocidad: 2.2 };
let teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };

const CIRCUITOS = [
  {
    nombre: "Circuito A - Escalera Clásica",
    inicio: { x: 35, y: 40 },
    meta: { x: 275, y: 205, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 70, h: 30 },
      { x: 60, y: 25, w: 30, h: 100 },
      { x: 60, y: 95, w: 130, h: 30 },
      { x: 160, y: 95, w: 30, h: 90 },
      { x: 160, y: 155, w: 140, h: 30 },
      { x: 270, y: 155, w: 30, h: 80 }
    ]
  },
  {
    nombre: "Circuito B - Bayoneta Invertida",
    inicio: { x: 35, y: 40 },
    meta: { x: 40, y: 215, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 280, h: 30 },
      { x: 270, y: 25, w: 30, h: 110 },
      { x: 120, y: 105, w: 180, h: 30 },
      { x: 120, y: 105, w: 30, h: 100 },
      { x: 30, y: 175, w: 120, h: 30 },
      { x: 30, y: 175, w: 35, h: 70 }
    ]
  },
  {
    nombre: "Circuito C - Zigzag Continuo",
    inicio: { x: 35, y: 40 },
    meta: { x: 280, y: 215, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 30, h: 140 },
      { x: 20, y: 135, w: 120, h: 30 },
      { x: 110, y: 55, w: 30, h: 110 },
      { x: 110, y: 55, w: 130, h: 30 },
      { x: 210, y: 55, w: 30, h: 130 },
      { x: 210, y: 155, w: 90, h: 30 },
      { x: 270, y: 155, w: 35, h: 85 }
    ]
  }
];

let indicePista = 0;
let circuitoActual = CIRCUITOS[0];

function alternarPista() {
  indicePista = (indicePista + 1) % CIRCUITOS.length;
  circuitoActual = CIRCUITOS[indicePista];
  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
}

function inicializarModulo() {
  if (window.CreditManager) {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');

    if (!CreditManager.puedeRendir('palancas')) {
      bloquearModuloPorCupo();
      return;
    }

    if (CreditManager.demoYaRealizado('palancas')) {
      prepararVistaOficial();
      return;
    }
  }

  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
  renderizar();
}

function bloquearModuloPorCupo() {
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  if (btnIniciar) {
    btnIniciar.disabled = true;
    btnIniciar.style.display = 'block';
    btnIniciar.style.opacity = '0.4';
    btnIniciar.style.backgroundColor = '#475569';
    btnIniciar.innerText = `Cupo Bloqueado (${max}/${max})`;
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

function prepararVistaOficial() {
  modo = 'OFICIAL';
  juegoActivo = false;
  const actual = window.CreditManager ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
    badgeModo.style.color = '#38bdf8';
  }
  if (panelMensaje) {
    panelMensaje.innerText = 'Evaluación Oficial: Recorre la pista sin tocar los bordes (Máx. 3 contactos).';
    panelMensaje.style.color = '#fbbf24';
  }
  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.opacity = '1';
    btnIniciar.style.backgroundColor = '#22c55e';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
  }
  if (elCronometro) elCronometro.innerText = '60 s';

  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
  renderizar();
}

if (btnIniciar) {
  btnIniciar.addEventListener('click', (e) => {
    e.preventDefault();
    if (btnIniciar.disabled || juegoActivo) return;

    if (window.CreditManager && modo === 'OFICIAL' && !CreditManager.puedeRendir('palancas')) {
      bloquearModuloPorCupo();
      return;
    }
    iniciarRecorrido();
  });
}

function iniciarRecorrido() {
  alternarPista();
  toques = 0;
  tocandoBorde = false;
  juegoActivo = true;

  if (elContactos) elContactos.innerText = '0';
  if (btnIniciar) btnIniciar.style.display = 'none';

  if (modo === 'DEMO') {
    tiempoRestante = 20;
    if (panelMensaje) {
      panelMensaje.innerText = 'Modo Demo: Practica el control bimanual libremente.';
      panelMensaje.style.color = '#38bdf8';
    }
  } else {
    tiempoRestante = 60;
    if (panelMensaje) {
      panelMensaje.innerText = `Prueba Oficial en curso: ${circuitoActual.nombre}`;
      panelMensaje.style.color = '#38bdf8';
    }
  }

  if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

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

  const dentro = circuitoActual.tramos.some(t => (
    puntero.x - puntero.radio >= t.x &&
    puntero.x + puntero.radio <= t.x + t.w &&
    puntero.y - puntero.radio >= t.y &&
    puntero.y + puntero.radio <= t.y + t.h
  ));

  if (!dentro) {
    if (!tocandoBorde) {
      tocandoBorde = true;
      toques++;
      if (elContactos) elContactos.innerText = toques;
      if ('vibrate' in navigator) navigator.vibrate(40);
    }
  } else {
    tocandoBorde = false;
  }

  const m = circuitoActual.meta;
  if (
    puntero.x >= m.x &&
    puntero.x <= m.x + m.w &&
    puntero.y >= m.y &&
    puntero.y <= m.y + m.h
  ) {
    finalizarPrueba(true);
    return;
  }

  renderizar();
  animacionFrame = requestAnimationFrame(actualizar);
}

function finalizarPrueba(metaAlcanzada) {
  juegoActivo = false;
  clearInterval(intervaloTiempo);
  cancelAnimationFrame(animacionFrame);

  const duracionTotal = (modo === 'DEMO') ? 20 : 60;
  const tiempoUsado = duracionTotal - tiempoRestante;
  const aprobado = metaAlcanzada && toques <= 3;
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  if (modo === 'DEMO') {
    if (window.CreditManager) CreditManager.marcarDemoCompletado('palancas');
    const actual = window.CreditManager ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;

    if (panelMensaje) {
      panelMensaje.innerText = `¡Calibración lista! Contactos: ${toques}. Inicia tu Simulación Oficial.`;
      panelMensaje.style.color = '#4ade80';
    }

    if (btnIniciar) {
      btnIniciar.style.display = 'block';
      btnIniciar.disabled = false;
      btnIniciar.style.backgroundColor = '#22c55e';
      btnIniciar.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    }
    modo = 'OFICIAL';
  } else {
    // Modo Oficial: Descontar crédito de forma obligatoria en CreditManager
    const consumidas = window.CreditManager ? CreditManager.registrarConsumo('palancas') : 1;
    const bloqueoTotal = consumidas >= max;

    // Guardar resultado local para informes
    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques,
      tiempo: tiempoUsado,
      aprobado,
      fecha: new Date().toISOString()
    }));

    if (window.CreditManager) {
      CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
    }

    if (panelMensaje) {
      panelMensaje.innerText = aprobado 
        ? `¡Aprobado! ${toques} contactos en ${tiempoUsado} s.` 
        : `Reprobado (${toques} contactos o tiempo superado).`;
      panelMensaje.style.color = aprobado ? '#4ade80' : '#f87171';
    }

    if (zonaCoordinacion) {
      zonaCoordinacion.innerHTML = `
        <div style="background: #020617; border: 1.5px solid ${bloqueoTotal ? '#ef4444' : '#38bdf8'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
          <h3 style="color: ${bloqueoTotal ? '#f87171' : '#4ade80'}; margin: 0 0 6px 0;">¡Simulación ${consumidas} de ${max} Finalizada!</h3>
          <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">
            ${bloqueoTotal ? `Has completado el límite máximo de ${max}/${max} simulaciones.` : `Te restan ${max - consumidas} simulación(es) disponible(s).`}
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${!bloqueoTotal ? `
              <button onclick="location.reload()" class="btn-principal" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
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
        </div>
      `;
    }

    if (bloqueoTotal) {
      bloquearModuloPorCupo();
    }
  }

  renderizar();
}

function renderizar() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1e293b';
  circuitoActual.tramos.forEach(t => ctx.fillRect(t.x, t.y, t.w, t.h));

  const m = circuitoActual.meta;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(m.x, m.y, m.w, m.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('META', m.x - 2, m.y + 30);

  ctx.beginPath();
  ctx.arc(puntero.x, puntero.y, puntero.radio, 0, Math.PI * 2);
  ctx.fillStyle = tocandoBorde ? '#ef4444' : '#38bdf8';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.closePath();
}

function vincularBoton(btn, direccion) {
  if (!btn) return;
  const activar = (e) => { e.preventDefault(); teclas[direccion] = true; };
  const desactivar = (e) => { e.preventDefault(); teclas[direccion] = false; };
  btn.addEventListener('pointerdown', activar);
  btn.addEventListener('pointerup', desactivar);
  btn.addEventListener('pointerleave', desactivar);
}

vincularBoton(btnArriba, 'arriba');
vincularBoton(btnAbajo, 'abajo');
vincularBoton(btnIzq, 'izquierda');
vincularBoton(btnDer, 'derecha');

window.addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'W') teclas.arriba = true;
  if (e.key === 's' || e.key === 'S') teclas.abajo = true;
  if (e.key === 'ArrowLeft') teclas.izquierda = true;
  if (e.key === 'ArrowRight') teclas.derecha = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'w' || e.key === 'W') teclas.arriba = false;
  if (e.key === 's' || e.key === 'S') teclas.abajo = false;
  if (e.key === 'ArrowLeft') teclas.izquierda = false;
  if (e.key === 'ArrowRight') teclas.derecha = false;
});

window.addEventListener('DOMContentLoaded', inicializarModulo);