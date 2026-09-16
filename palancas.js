/**
 * Sensometrika - Módulo 2: Test de Palancas Bimanual
 * Estandarizado D.S. N° 170 MTT
 * Arquitectura: Circuitos complejos en bayoneta, túnel de neón, partículas de colisión,
 * persistencia acumulada en informe y transición directa al Módulo 3.
 */

const canvas = document.getElementById('canvas-palancas');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo');
const txtTiempoCabecera = document.getElementById('txt-tiempo-cabecera');
const metricaContactos = document.getElementById('metrica-contactos');
const metricaTiempo = document.getElementById('metrica-tiempo');
const metricaCircuito = document.getElementById('metrica-circuito');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar');
const zonaFinal = document.getElementById('zona-final-palancas');

// Mandos
const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let enJuego = false;
let animId = null;
let temporizador = null;
let tiempoRestante = 20;
let duracionTotalSeg = 0;
let tiempoInicioPrueba = 0;

// Estado del puntero y física bimanual
let posX = 30;
let posY = 40;
const radioPuntero = 6.5;
let velX = 0;
let velY = 0;
const VELOCIDAD = 2.4;

let contactos = 0;
let enContacto = false;
let tiempoFueraMs = 0;
let instanteContacto = 0;

// BANCO DE 3 CIRCUITOS COMPLEJOS (Curvas cerradas, bayonetas y horquillas continuas)
const CIRCUITOS = [
  {
    nombre: 'Bayoneta Doble',
    puntos: [
      { x: 30, y: 40 },
      { x: 140, y: 40 },
      { x: 140, y: 115 },
      { x: 260, y: 115 },
      { x: 260, y: 190 },
      { x: 380, y: 190 }
    ],
    anchoCanal: 28,
    meta: { x: 380, y: 190, r: 11 }
  },
  {
    nombre: 'Zigzag Asimétrico',
    puntos: [
      { x: 30, y: 190 },
      { x: 120, y: 190 },
      { x: 120, y: 55 },
      { x: 240, y: 55 },
      { x: 240, y: 140 },
      { x: 380, y: 140 }
    ],
    anchoCanal: 26,
    meta: { x: 380, y: 140, r: 11 }
  },
  {
    nombre: 'Horquilla y Retorno',
    puntos: [
      { x: 30, y: 45 },
      { x: 300, y: 45 },
      { x: 300, y: 115 },
      { x: 90, y: 115 },
      { x: 90, y: 185 },
      { x: 380, y: 185 }
    ],
    anchoCanal: 27,
    meta: { x: 380, y: 185, r: 11 }
  }
];

let circuitoActual = CIRCUITOS[0];

document.addEventListener('DOMContentLoaded', () => {
  const demoListo = localStorage.getItem('sensometrika_palancas_demo_ok') === 'true';
  if (demoListo) {
    configurarModoOficial();
  } else {
    configurarModoDemo();
  }

  vincularControles();
  redibujarEscena();
});

function configurarModoDemo() {
  modo = 'DEMO';
  tiempoRestante = 20;
  circuitoActual = CIRCUITOS[0];
  posX = circuitoActual.puntos[0].x;
  posY = circuitoActual.puntos[0].y;

  badgeModo.innerText = '🟡 Calibración Técnica (Demo 20s)';
  badgeModo.style.color = '#facc15';
  txtTiempoCabecera.innerText = 'Fase de Inducción';
  metricaTiempo.innerText = '20 s';
  metricaCircuito.innerText = circuitoActual.nombre;

  panelEstado.innerText = 'Prueba el movimiento: Izquierda controla vertical, Derecha horizontal.';
  panelEstado.style.color = '#38bdf8';

  btnIniciar.innerText = 'Iniciar Calibración Guiada (Demo)';
  btnIniciar.style.display = 'block';
  btnIniciar.style.backgroundColor = '#0284c7';
}

function configurarModoOficial() {
  modo = 'OFICIAL';
  tiempoRestante = 60;

  // Seleccionar circuito alternativo para erradicar memorización
  const numAleatorio = Math.floor(Math.random() * CIRCUITOS.length);
  circuitoActual = CIRCUITOS[numAleatorio];
  posX = circuitoActual.puntos[0].x;
  posY = circuitoActual.puntos[0].y;

  // Determinar número de simulación según el plan contratado
  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  let cuotaMax = 3;
  if (sesion.planId && sesion.planId.includes('full')) cuotaMax = 8;
  else if (sesion.planId && (sesion.planId.includes('plus') || sesion.planId.includes('semi'))) cuotaMax = 5;

  const hPal = JSON.parse(localStorage.getItem('sensometrika_historial_palancas')) || [];
  const intentoActual = Math.min(cuotaMax, hPal.length + 1);

  badgeModo.innerText = `🔴 Simulación Oficial ${intentoActual} de ${cuotaMax} (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  txtTiempoCabecera.innerText = 'Evaluación Activa (60 s)';
  metricaTiempo.innerText = '60 s';
  metricaCircuito.innerText = circuitoActual.nombre;

  panelEstado.innerText = 'Evaluación Oficial: Recorre la pista sin tocar los bordes (Máx. 3 contactos).';
  panelEstado.style.color = '#facc15';

  btnIniciar.innerText = `Iniciar Simulación Oficial (${intentoActual} de ${cuotaMax})`;
  btnIniciar.style.display = 'block';
  btnIniciar.style.backgroundColor = '#16a34a';
}

function vincularControles() {
  // Manejadores de pointer para móviles y mouse
  const asignarBoton = (btn, onPulsar, onSoltar) => {
    if (!btn) return;
    const activar = (e) => {
      e.preventDefault();
      btn.classList.add('pulsado');
      onPulsar();
      // Si el usuario toca un mando sin haber pulsado el botón de inicio, se inicia automáticamente
      if (!enJuego && btnIniciar.style.display !== 'none') {
        arrancarEvaluacion();
      }
    };
    const desactivar = (e) => {
      e.preventDefault();
      btn.classList.remove('pulsado');
      onSoltar();
    };

    btn.addEventListener('pointerdown', activar);
    btn.addEventListener('pointerup', desactivar);
    btn.addEventListener('pointerleave', desactivar);
    btn.addEventListener('pointercancel', desactivar);
  };

  asignarBoton(btnArriba, () => velY = -VELOCIDAD, () => velY = 0);
  asignarBoton(btnAbajo, () => velY = VELOCIDAD, () => velY = 0);
  asignarBoton(btnIzq, () => velX = -VELOCIDAD, () => velX = 0);
  asignarBoton(btnDer, () => velX = VELOCIDAD, () => velX = 0);

  // Soporte teclado PC (WASD y Flechas)
  window.addEventListener('keydown', (e) => {
    if (!enJuego && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','s','a','d'].includes(e.key)) {
      arrancarEvaluacion();
    }
    if (e.key === 'ArrowUp' || e.key === 'w') velY = -VELOCIDAD;
    if (e.key === 'ArrowDown' || e.key === 's') velY = VELOCIDAD;
    if (e.key === 'ArrowLeft' || e.key === 'a') velX = -VELOCIDAD;
    if (e.key === 'ArrowRight' || e.key === 'd') velX = VELOCIDAD;
  });

  window.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) velY = 0;
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) velX = 0;
  });

  btnIniciar.addEventListener('click', () => {
    arrancarEvaluacion();
  });
}

function arrancarEvaluacion() {
  if (enJuego) return;
  enJuego = true;
  contactos = 0;
  tiempoFueraMs = 0;
  enContacto = false;
  instanteContacto = 0;

  metricaContactos.innerText = '0';
  btnIniciar.style.display = 'none';
  zonaFinal.innerHTML = '';

  posX = circuitoActual.puntos[0].x;
  posY = circuitoActual.puntos[0].y;
  tiempoInicioPrueba = performance.now();

  panelEstado.innerText = (modo === 'DEMO')
    ? 'Calibrando mandos... Conduce el puntero a la meta verde.'
    : '¡Evaluación en curso! Mantén el puntero dentro del canal.';
  panelEstado.style.color = '#38bdf8';

  clearInterval(temporizador);
  temporizador = setInterval(() => {
    tiempoRestante--;
    metricaTiempo.innerText = `${tiempoRestante} s`;
    if (tiempoRestante <= 0) {
      finalizarPrueba(false);
    }
  }, 1000);

  bucleAnimacion();
}

function bucleAnimacion() {
  if (!enJuego) return;

  posX += velX;
  posY += velY;

  // Limitar al área del canvas
  posX = Math.max(radioPuntero + 2, Math.min(canvas.width - radioPuntero - 2, posX));
  posY = Math.max(radioPuntero + 2, Math.min(canvas.height - radioPuntero - 2, posY));

  evaluarColision();
  evaluarMeta();

  redibujarEscena();
  animId = requestAnimationFrame(bucleAnimacion);
}

function evaluarColision() {
  let dentro = false;
  const pts = circuitoActual.puntos;
  const radioTolerancia = circuitoActual.anchoCanal / 2;

  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanciaPuntoASegmento(posX, posY, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    if (d <= radioTolerancia) {
      dentro = true;
      break;
    }
  }

  const ahora = performance.now();
  if (!dentro) {
    if (!enContacto) {
      enContacto = true;
      contactos++;
      metricaContactos.innerText = contactos;
      instanteContacto = ahora;
      if ('vibrate' in navigator) navigator.vibrate(50);
    } else {
      tiempoFueraMs += (ahora - instanteContacto);
      instanteContacto = ahora;
    }
  } else {
    enContacto = false;
  }
}

function evaluarMeta() {
  const meta = circuitoActual.meta;
  const dist = Math.hypot(posX - meta.x, posY - meta.y);
  if (dist <= meta.r + radioPuntero) {
    finalizarPrueba(true);
  }
}

function redibujarEscena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Dibujar fondo con rejilla técnica sutil
  ctx.strokeStyle = '#0a1628';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 25) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 25) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  const pts = circuitoActual.puntos;

  // 2. Muros externos del canal con resplandor neón cian
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = circuitoActual.anchoCanal + 6;
  ctx.strokeStyle = '#0284c7';
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pista interna oscura transitada
  ctx.lineWidth = circuitoActual.anchoCanal;
  ctx.strokeStyle = '#040d1a';
  ctx.stroke();

  // 4. Guía central luminiscente
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Dibujar Meta verde esmeralda
  const meta = circuitoActual.meta;
  ctx.beginPath();
  ctx.arc(meta.x, meta.y, meta.r, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 6. Puntero móvil con efecto de alarma en colisión
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = enContacto ? '#ef4444' : '#facc15';
  ctx.shadowColor = enContacto ? '#ef4444' : '#facc15';
  ctx.shadowBlur = enContacto ? 20 : 10;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function finalizarPrueba(cruzoMeta) {
  enJuego = false;
  clearInterval(temporizador);
  cancelAnimationFrame(animId);
  velX = 0;
  velY = 0;

  duracionTotalSeg = Math.min(60, Math.round((performance.now() - tiempoInicioPrueba) / 1000));

  if (modo === 'DEMO') {
    localStorage.setItem('sensometrika_palancas_demo_ok', 'true');
    panelEstado.innerText = `¡Calibración completada! Registraste ${contactos} contactos.`;
    panelEstado.style.color = '#4ade80';

    zonaFinal.innerHTML = `
      <div style="background: #0f172a; border: 1.5px solid #0284c7; border-radius: 10px; padding: 14px; text-align: center; margin-top: 10px;">
        <h3 style="color: #38bdf8; margin: 0 0 6px 0; font-size: 1rem;">¡Mandos Calibrados con Éxito!</h3>
        <p style="color: #94a3b8; font-size: 0.78rem; margin: 0 0 12px 0;">Has probado el movimiento vertical y horizontal. Ya puedes rendir tu simulación oficial.</p>
        <button type="button" onclick="iniciarOficialDirecto()" style="width: 100%; height: 44px; background: #16a34a; color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.90rem; cursor: pointer;">
          Comenzar Simulación Oficial →
        </button>
      </div>
    `;
  } else {
    // EVALUACIÓN OFICIAL (D.S. N° 170)
    const aprobado = cruzoMeta && (contactos <= 3);
    let motivoFalla = 'Aprobado';
    if (!aprobado) {
      if (!cruzoMeta) motivoFalla = 'Tiempo agotado (60 s) antes de la meta';
      else motivoFalla = `Exceso de contactos (${contactos} toques > 3 permitidos)`;
    }

    const efectividad = Math.max(0, 100 - (contactos * 20));

    // 1. Acumular en historial dinámico
    let hPal = JSON.parse(localStorage.getItem('sensometrika_historial_palancas')) || [];
    const numSim = hPal.length + 1;

    hPal.push({
      simulacion: numSim,
      toques: contactos,
      efectividad: efectividad,
      duracion: duracionTotalSeg,
      aprobado: aprobado,
      motivoFalla: motivoFalla
    });
    localStorage.setItem('sensometrika_historial_palancas', JSON.stringify(hPal));

    // 2. Persistir consolidado
    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: contactos,
      efectividad: efectividad,
      tiempo: duracionTotalSeg,
      aprobado: aprobado
    }));

    panelEstado.innerText = `Simulación ${numSim} finalizada: ${contactos} contactos (${duracionTotalSeg} s)`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

    // 3. Botones ergonómicos inferiores de navegación fluida
    zonaFinal.innerHTML = `
      <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 14px; text-align: center; margin-top: 10px;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.05rem;">
          ${aprobado ? '✔ Módulo 2 Superado' : '⚠ Módulo 2 Fuera de Estándar'} (${contactos} contactos)
        </h3>
        <p style="color: #cbd5e1; font-size: 0.85rem; margin: 0 0 4px 0;">
          Efectividad: <strong style="color: #38bdf8;">${efectividad}%</strong> en ${duracionTotalSeg} s
        </p>
        <small style="color: #94a3b8; display: block; margin-bottom: 12px;">Norma legal D.S. N° 170: ≤ 3 contactos en 60 s</small>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="punteo.html" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 44px; background: #0284c7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 0.88rem; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
            Continuar a Módulo 3 (Punteo) →
          </a>
          <a href="menu.html" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 38px; color: #94a3b8; text-decoration: none; font-size: 0.80rem; font-weight: 600;">
            ← Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

window.iniciarOficialDirecto = function() {
  zonaFinal.innerHTML = '';
  configurarModoOficial();
  arrancarEvaluacion();
};