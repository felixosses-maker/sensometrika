/**
 * Sensometrika - Módulo 3: Test de Punteo (Tambor de Lahy)
 * Estandarizado D.S. N° 170 MTT
 * Arquitectura: 1 Demo de 15s + Simulaciones Oficiales según Plan B2C/B2B
 * Guarda historial acumulado por simulación para informe diagnóstico
 */

const canvas = document.getElementById('canvas-punteo');
const ctx = canvas ? canvas.getContext('2d') : null;
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const metricaAciertos = document.getElementById('metrica-aciertos');
const metricaErrores = document.getElementById('metrica-errores');
const metricaEfectividad = document.getElementById('metrica-efectividad');
const metricaTiempo = document.getElementById('metrica-tiempo');

let animId = null;
let enEjecucion = false;
let modoActual = 'DEMO'; // 'DEMO' o 'OFICIAL'
let tiempoInicio = 0;
let tiempoLimite = 15; // 15s en Demo, 30s en Oficial
let aciertos = 0;
let fallos = 0;

let orificios = [];
let velocidadTambor = 2.4;
const totalCarriles = 4;
let anchoCarril = 60;

document.addEventListener('DOMContentLoaded', () => {
  ajustarCanvas();
  iniciarConfiguracion();
  vincularPuntero();
});

function ajustarCanvas() {
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 320;
  canvas.height = 360;
  anchoCarril = canvas.width / totalCarriles;
}

function iniciarConfiguracion() {
  const demoListo = localStorage.getItem('sensometrika_punteo_demo_ok') === 'true';
  if (demoListo) {
    activarModoOficial();
  } else {
    modoActual = 'DEMO';
    tiempoLimite = 15;
    if (panelEstado) {
      panelEstado.innerText = 'CALIBRACIÓN RÍTMICA (Demo 15s): Pulsa los círculos dorados';
      panelEstado.style.color = '#38bdf8';
    }
    if (btnAccion) btnAccion.innerText = 'Iniciar Calibración Demo (15s)';
  }
}

function activarModoOficial() {
  modoActual = 'OFICIAL';
  tiempoLimite = 30;
  aciertos = 0;
  fallos = 0;
  localStorage.setItem('sensometrika_punteo_demo_ok', 'true');

  let consumidas = 0;
  let limite = 3;
  if (window.CreditManager && typeof window.CreditManager.obtenerConsumidas === 'function') {
    consumidas = window.CreditManager.obtenerConsumidas('punteo');
    limite = window.CreditManager.obtenerLimiteModulo('punteo');
  }

  if (panelEstado) {
    panelEstado.innerText = `EVALUACIÓN OFICIAL (30s): Mantén efectividad ≥ 80% [Intento ${consumidas + 1}/${limite}]`;
    panelEstado.style.color = '#facc15';
  }
  if (btnAccion) {
    btnAccion.innerText = `Iniciar Simulación Oficial (${consumidas + 1}/${limite})`;
    btnAccion.style.backgroundColor = '#16a34a';
  }
}

function generarOrificio() {
  const carril = Math.floor(Math.random() * totalCarriles);
  orificios.push({
    x: carril * anchoCarril + (anchoCarril / 2),
    y: -20,
    radio: 14,
    tocado: false
  });
}

function vincularPuntero() {
  if (!canvas) return;
  canvas.addEventListener('pointerdown', (e) => {
    if (!enEjecucion) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let impacto = false;
    for (let o of orificios) {
      if (!o.tocado) {
        const dist = Math.hypot(clickX - o.x, clickY - o.y);
        if (dist <= o.radio + 12) {
          o.tocado = true;
          aciertos++;
          impacto = true;
          if ('vibrate' in navigator) navigator.vibrate(30);
          break;
        }
      }
    }

    if (!impacto) fallos++;
    actualizarMetricas();
  });

  if (btnAccion) {
    btnAccion.addEventListener('click', () => {
      if (!enEjecucion) comenzarCiclo();
    });
  }
}

function comenzarCiclo() {
  enEjecucion = true;
  aciertos = 0;
  fallos = 0;
  orificios = [];
  tiempoInicio = performance.now();
  if (btnAccion) btnAccion.style.display = 'none';

  bucleAnimacion();
}

let ultimoSpawn = 0;
function bucleAnimacion() {
  if (!enEjecucion) return;

  const ahora = performance.now();
  const transcurrido = (ahora - tiempoInicio) / 1000;
  const restante = Math.max(0, tiempoLimite - transcurrido);

  if (metricaTiempo) metricaTiempo.innerText = `${Math.ceil(restante)} s`;

  // Generar nuevos orificios periódicamente
  if (ahora - ultimoSpawn > 580) {
    generarOrificio();
    ultimoSpawn = ahora;
  }

  // Mover orificios
  for (let i = orificios.length - 1; i >= 0; i--) {
    let o = orificios[i];
    o.y += velocidadTambor;

    // Si sale de pantalla sin ser tocado
    if (o.y > canvas.height + 20) {
      if (!o.tocado) fallos++;
      orificios.splice(i, 1);
      actualizarMetricas();
    }
  }

  dibujar();

  if (restante <= 0) {
    terminarPrueba();
    return;
  }

  animId = requestAnimationFrame(bucleAnimacion);
}

function actualizarMetricas() {
  if (metricaAciertos) metricaAciertos.innerText = aciertos;
  if (metricaErrores) metricaErrores.innerText = fallos;

  const total = aciertos + fallos;
  const ef = total > 0 ? Math.round((aciertos / total) * 100) : 100;
  if (metricaEfectividad) metricaEfectividad.innerText = `${ef}%`;
}

function dibujar() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Líneas de carriles
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let c = 1; c < totalCarriles; c++) {
    ctx.beginPath();
    ctx.moveTo(c * anchoCarril, 0);
    ctx.lineTo(c * anchoCarril, canvas.height);
    ctx.stroke();
  }

  // Zona óptima de impacto (Franja dorada)
  ctx.fillStyle = 'rgba(234, 179, 8, 0.08)';
  ctx.fillRect(0, canvas.height - 110, canvas.width, 70);

  // Orificios
  orificios.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);
    ctx.fillStyle = o.tocado ? '#22c55e' : '#eab308';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function terminarPrueba() {
  enEjecucion = false;
  cancelAnimationFrame(animId);

  const total = aciertos + fallos;
  const ef = total > 0 ? Math.round((aciertos / total) * 100) : 0;

  if (modoActual === 'DEMO') {
    if (panelEstado) {
      panelEstado.innerText = '¡Calibración lista! Has asimilado el ritmo del tambor.';
      panelEstado.style.color = '#4ade80';
    }
    if (btnAccion) {
      btnAccion.style.display = 'block';
      btnAccion.innerText = 'Comenzar Evaluación Oficial →';
      btnAccion.style.backgroundColor = '#16a34a';
      btnAccion.onclick = () => {
        activarModoOficial();
      };
    }
    return;
  }

  // MODO OFICIAL
  const aprobado = ef >= 80;
  const motivoFalla = aprobado ? 'Aprobado' : `Efectividad bajo estándar normativo (${ef}% < 80%)`;

  let historialPunt = JSON.parse(localStorage.getItem('sensometrika_historial_punteo')) || [];
  const numeroSim = historialPunt.length + 1;

  historialPunt.push({
    simulacion: numeroSim,
    efectividad: ef,
    aciertos: aciertos,
    fallos: fallos,
    aprobado: aprobado,
    motivoFalla: motivoFalla
  });
  localStorage.setItem('sensometrika_historial_punteo', JSON.stringify(historialPunt));

  localStorage.setItem('sensometrika_punteo', JSON.stringify({
    efectividad: ef,
    aciertos: aciertos,
    errores: fallos,
    aprobado: aprobado
  }));

  if (window.CreditManager && typeof window.CreditManager.registrarConsumo === 'function') {
    window.CreditManager.registrarConsumo('punteo');
  }

  if (panelEstado) {
    panelEstado.innerText = `Simulación ${numeroSim} finalizada: ${ef}% efectividad`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';
  }

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const permitidos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo'];
  const tieneVisual = permitidos.includes('visual');

  if (btnAccion) {
    btnAccion.style.display = 'block';
    if (tieneVisual) {
      btnAccion.innerText = 'Continuar a Módulo 4 (Visual) →';
      btnAccion.onclick = () => { window.location.href = 'visual.html'; };
    } else {
      btnAccion.innerText = 'Ver Dictamen e Informe en Pantalla →';
      btnAccion.style.backgroundColor = '#0284c7';
      btnAccion.onclick = () => { window.location.href = 'informe.html'; };
    }
  }
}