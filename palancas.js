/**
 * Sensometrika - Módulo 2: Test de Palancas Bimanual
 * Estandarizado D.S. N° 170 MTT
 * Arquitectura: 1 Demo de 20s + Simulaciones Oficiales según Plan B2C/B2B
 * Guarda historial dinámico por simulación para diagnóstico de fallas en pantalla
 */

const canvas = document.getElementById('canvas-palancas');
const ctx = canvas ? canvas.getContext('2d') : null;
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar');
const metricaToques = document.getElementById('metrica-toques');
const metricaTiempo = document.getElementById('metrica-tiempo');
const metricaEfectividad = document.getElementById('metrica-efectividad');

let animId = null;
let enEjecucion = false;
let modoActual = 'DEMO'; // 'DEMO' o 'OFICIAL'
let tiempoInicio = 0;
let tiempoLimite = 20; // 20 s en Demo, 60 s en Oficial
let toquesActuales = 0;
let maxToquesPermitidos = 3;

// Posición y dimensiones del puntero
let posX = 30;
let posY = 150;
const radioPuntero = 7;
let velocidad = 3.5;

// Variables de control de entrada (Touch y Teclado)
const teclas = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// Circuitos dinámicos (Paredes de laberinto continuo)
let circuitoActual = [];

const CIRCUITOS = [
  // Circuito 1: Escalera Asimétrica
  [
    { x: 10, y: 120, w: 90, h: 60 },
    { x: 70, y: 40, w: 60, h: 100 },
    { x: 100, y: 40, w: 100, h: 60 },
    { x: 170, y: 70, w: 60, h: 110 },
    { x: 200, y: 120, w: 110, h: 60 }
  ],
  // Circuito 2: Doble Bahía
  [
    { x: 10, y: 70, w: 110, h: 60 },
    { x: 90, y: 100, w: 60, h: 90 },
    { x: 120, y: 130, w: 110, h: 60 },
    { x: 200, y: 60, w: 60, h: 90 },
    { x: 230, y: 60, w: 80, h: 60 }
  ]
];

document.addEventListener('DOMContentLoaded', () => {
  ajustarResolucionCanvas();
  configurarModoInicial();
  vincularControles();
});

function ajustarResolucionCanvas() {
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 320;
  canvas.height = 240;
}

function configurarModoInicial() {
  const demoHecho = localStorage.getItem('sensometrika_palancas_demo_ok') === 'true';
  if (demoHecho) {
    activarModoOficial();
  } else {
    modoActual = 'DEMO';
    tiempoLimite = 20;
    if (panelEstado) {
      panelEstado.innerText = 'CALIBRACIÓN PREVIA (Demo 20s): Prueba los controles';
      panelEstado.style.color = '#38bdf8';
    }
    if (btnIniciar) btnIniciar.innerText = 'Iniciar Calibración Demo (20s)';
    prepararPista(0);
  }
}

function activarModoOficial() {
  modoActual = 'OFICIAL';
  tiempoLimite = 60;
  toquesActuales = 0;
  localStorage.setItem('sensometrika_palancas_demo_ok', 'true');

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  let consumidas = 0;
  let limiteMax = 3;

  if (window.CreditManager && typeof window.CreditManager.obtenerConsumidas === 'function') {
    consumidas = window.CreditManager.obtenerConsumidas('palancas');
    limiteMax = window.CreditManager.obtenerLimiteModulo('palancas');
  }

  if (panelEstado) {
    panelEstado.innerText = `EVALUACIÓN OFICIAL: Recorre la pista en menos de 60s (Máx. 3 toques) [Intento ${consumidas + 1}/${limiteMax}]`;
    panelEstado.style.color = '#facc15';
  }
  if (btnIniciar) {
    btnIniciar.innerText = `Iniciar Simulación Oficial (${consumidas + 1}/${limiteMax})`;
    btnIniciar.style.backgroundColor = '#16a34a';
  }
  prepararPista(1);
}

function prepararPista(indice) {
  circuitoActual = CIRCUITOS[indice % CIRCUITOS.length];
  posX = 25;
  posY = circuitoActual[0].y + (circuitoActual[0].h / 2);
  renderizarCanvas();
}

function vincularControles() {
  window.addEventListener('keydown', (e) => {
    if (teclas.hasOwnProperty(e.key)) teclas[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (teclas.hasOwnProperty(e.key)) teclas[e.key] = false;
  });

  // Botones táctiles virtuales si existen
  document.querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const dir = btn.getAttribute('data-dir');
      if (dir === 'up') teclas.ArrowUp = true;
      if (dir === 'down') teclas.ArrowDown = true;
      if (dir === 'left') teclas.ArrowLeft = true;
      if (dir === 'right') teclas.ArrowRight = true;
    });
    btn.addEventListener('pointerup', () => {
      teclas.ArrowUp = false; teclas.ArrowDown = false; teclas.ArrowLeft = false; teclas.ArrowRight = false;
    });
    btn.addEventListener('pointerleave', () => {
      teclas.ArrowUp = false; teclas.ArrowDown = false; teclas.ArrowLeft = false; teclas.ArrowRight = false;
    });
  });

  if (btnIniciar) {
    btnIniciar.addEventListener('click', () => {
      if (!enEjecucion) iniciarPrueba();
    });
  }
}

function iniciarPrueba() {
  enEjecucion = true;
  toquesActuales = 0;
  tiempoInicio = performance.now();
  if (btnIniciar) btnIniciar.style.display = 'none';

  bucleAnimacion();
}

function bucleAnimacion() {
  if (!enEjecucion) return;

  const ahora = performance.now();
  const transcurridoSeg = (ahora - tiempoInicio) / 1000;
  const tiempoRestante = Math.max(0, tiempoLimite - transcurridoSeg);

  if (metricaTiempo) metricaTiempo.innerText = `${Math.ceil(tiempoRestante)} s`;

  // Mover puntero
  if (teclas.ArrowUp) posY -= velocidad;
  if (teclas.ArrowDown) posY += velocidad;
  if (teclas.ArrowLeft) posX -= velocidad;
  if (teclas.ArrowRight) posX += velocidad;

  // Chequear límites y colisiones
  validarColisiones();

  // Condición de meta (llegar al extremo derecho de la última caja)
  const meta = circuitoActual[circuitoActual.length - 1];
  if (posX >= (meta.x + meta.w - radioPuntero)) {
    finalizarPrueba(true, transcurridoSeg);
    return;
  }

  // Condición de tiempo agotado
  if (tiempoRestante <= 0) {
    finalizarPrueba(false, tiempoLimite);
    return;
  }

  renderizarCanvas();
  animId = requestAnimationFrame(bucleAnimacion);
}

function validarColisiones() {
  let dentroDePista = false;
  for (let b of circuitoActual) {
    if (posX >= b.x && posX <= (b.x + b.w) && posY >= b.y && posY <= (b.y + b.h)) {
      dentroDePista = true;
      break;
    }
  }

  if (!dentroDePista) {
    toquesActuales++;
    if ('vibrate' in navigator) navigator.vibrate(40);
    if (metricaToques) metricaToques.innerText = toquesActuales;

    // Reposicionar al centro del tramo actual
    const tramo = circuitoActual[0];
    posX = tramo.x + 15;
    posY = tramo.y + (tramo.h / 2);
  }
}

function renderizarCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar Pista
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;

  circuitoActual.forEach(b => {
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  });

  // Meta
  const m = circuitoActual[circuitoActual.length - 1];
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(m.x + m.w - 12, m.y, 12, m.h);

  // Dibujar Puntero
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function finalizarPrueba(cruzoMeta, duracion) {
  enEjecucion = false;
  cancelAnimationFrame(animId);

  if (modoActual === 'DEMO') {
    if (panelEstado) {
      panelEstado.innerText = '¡Demo finalizada! Ya calibraste los movimientos.';
      panelEstado.style.color = '#4ade80';
    }
    if (btnIniciar) {
      btnIniciar.style.display = 'block';
      btnIniciar.innerText = 'Pasar a Evaluación Oficial →';
      btnIniciar.style.backgroundColor = '#16a34a';
      btnIniciar.onclick = () => {
        activarModoOficial();
      };
    }
    return;
  }

  // MODO OFICIAL
  const aprobado = cruzoMeta && (toquesActuales <= maxToquesPermitidos);
  let motivoFalla = 'Aprobado';
  if (!aprobado) {
    if (!cruzoMeta) {
      motivoFalla = 'Tiempo límite agotado (60 s) antes de la meta';
    } else {
      motivoFalla = `Exceso de toques (${toquesActuales} toques > 3 permitidos)`;
    }
  }

  // 1. Acumular historial dinámico
  let historialPal = JSON.parse(localStorage.getItem('sensometrika_historial_palancas')) || [];
  const numeroSim = historialPal.length + 1;

  historialPal.push({
    simulacion: numeroSim,
    toques: toquesActuales,
    duracionSeg: Math.round(duracion),
    aprobado: aprobado,
    motivoFalla: motivoFalla
  });
  localStorage.setItem('sensometrika_historial_palancas', JSON.stringify(historialPal));

  // 2. Guardar consolidado
  localStorage.setItem('sensometrika_palancas', JSON.stringify({
    toques: toquesActuales,
    aprobado: aprobado,
    efectividad: Math.max(0, Math.round(100 - (toquesActuales * 20)))
  }));

  // 3. Descontar intento en CreditManager
  if (window.CreditManager && typeof window.CreditManager.registrarConsumo === 'function') {
    window.CreditManager.registrarConsumo('palancas');
  }

  if (panelEstado) {
    panelEstado.innerText = `Simulación ${numeroSim} finalizada: ${toquesActuales} toques en ${Math.round(duracion)}s`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';
  }

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.innerText = 'Continuar a Módulo 3 (Punteo) →';
    btnIniciar.style.backgroundColor = '#0284c7';
    btnIniciar.onclick = () => {
      window.location.href = 'punteo.html';
    };
  }
}