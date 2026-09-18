/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Arquitectura homologada al Gabinete del Reactímetro
   • Rotación estocástica de circuitos anti-memorización
   • Físicas vectoriales, cálculo de efectividad y persistencia acumulativa
   ========================================================================== */

const canvas = document.getElementById('canvas-circuito');
const ctx = canvas ? canvas.getContext('2d') : null;

const lblCronometro = document.getElementById('lbl-cronometro');
const metricaContactos = document.getElementById('metrica-contactos');
const metricaEfectividad = document.getElementById('metrica-efectividad');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const zonaCoordinacion = document.getElementById('zona-coordinacion-test');
const badgeContador = document.getElementById('badge-contador-sim');
const placaIcono = document.getElementById('placa-estado-icono');
const placaSub = document.getElementById('placa-estado-sub');

const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let estado = 'INACTIVO'; // 'INACTIVO', 'JUGANDO', 'PAUSA_ENTRE_FASES', 'FINALIZADO'

let posX = 40;
let posY = 40;
const radioPuntero = 6;
let velX = 0;
let velY = 0;
const VELOCIDAD = 2.4;

let contactos = 0;
let tiempoContactoMs = 0;
let enContacto = false;
let ultimoContactoTimestamp = 0;

let tiempoRestante = 20;
let temporizadorInterval = null;
let animacionFrame = null;
let tiempoInicioOficial = 0;

// Banco de Circuitos Escalados al Ancho del Gabinete (440x220)
const BANCO_CIRCUITOS = [
  // Circuito 1: Escalera Proporcional
  {
    tramos: [
      { x1: 35, y1: 40, x2: 150, y2: 40 },
      { x1: 150, y1: 40, x2: 150, y2: 110 },
      { x1: 150, y1: 110, x2: 290, y2: 110 },
      { x1: 290, y1: 110, x2: 290, y2: 175 },
      { x1: 290, y1: 175, x2: 405, y2: 175 }
    ],
    inicio: { x: 40, y: 40 },
    meta: { x: 395, y: 175, radio: 11 }
  },
  // Circuito 2: Doble Bayoneta
  {
    tramos: [
      { x1: 35, y1: 50, x2: 130, y2: 50 },
      { x1: 130, y1: 50, x2: 130, y2: 165 },
      { x1: 130, y1: 165, x2: 260, y2: 165 },
      { x1: 260, y1: 165, x2: 260, y2: 60 },
      { x1: 260, y1: 60, x2: 405, y2: 60 }
    ],
    inicio: { x: 40, y: 50 },
    meta: { x: 395, y: 60, radio: 11 }
  },
  // Circuito 3: Zigzag Asimétrico
  {
    tramos: [
      { x1: 35, y1: 170, x2: 140, y2: 170 },
      { x1: 140, y1: 170, x2: 140, y2: 65 },
      { x1: 140, y1: 65, x2: 280, y2: 65 },
      { x1: 280, y1: 65, x2: 280, y2: 170 },
      { x1: 280, y1: 170, x2: 405, y2: 170 }
    ],
    inicio: { x: 40, y: 170 },
    meta: { x: 395, y: 170, radio: 11 }
  }
];

let indiceCircuitoActual = 0;
let circuitoActivo = BANCO_CIRCUITOS[0];
const anchoCanal = 28;

window.addEventListener('DOMContentLoaded', () => {
  actualizarPillCabecera();

  if (window.CreditManager && !CreditManager.puedeRendir('palancas')) {
    bloquearModuloPorCupo();
    return;
  }

  indiceCircuitoActual = Math.floor(Math.random() * BANCO_CIRCUITOS.length);
  circuitoActivo = BANCO_CIRCUITOS[indiceCircuitoActual];

  if (window.CreditManager && CreditManager.demoYaRealizado && CreditManager.demoYaRealizado('palancas')) {
    prepararVistaOficialDirecta();
  } else {
    resetearPuntero();
    dibujarEscena();
  }
});

function actualizarPillCabecera() {
  const actual = window.CreditManager ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  if (badgeContador) {
    badgeContador.innerText = `Simulación Oficial: ${actual} de ${max}`;
  }
}

function bloquearModuloPorCupo() {
  const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  if (btnAccion) {
    btnAccion.disabled = true;
    btnAccion.style.opacity = '0.4';
    btnAccion.innerText = `Cupo Bloqueado (${max}/${max})`;
  }
  if (panelEstado) {
    panelEstado.innerText = `Has completado tus simulaciones oficiales en este módulo.`;
    panelEstado.style.color = '#f87171';
  }
  if (zonaCoordinacion) {
    zonaCoordinacion.innerHTML = `
      <div style="background:#090e1c; border:1px solid #ef4444; border-radius:10px; padding:14px; text-align:center; margin-top:8px;">
        <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; height:44px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; margin-bottom:8px;">
          Continuar a Módulo 3 (Test de Punteo) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none;">Volver al Menú Principal</a>
      </div>
    `;
  }
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  estado = 'INACTIVO';
  actualizarPillCabecera();

  indiceCircuitoActual = (indiceCircuitoActual + 1) % BANCO_CIRCUITOS.length;
  circuitoActivo = BANCO_CIRCUITOS[indiceCircuitoActual];

  tiempoRestante = 60;
  if (lblCronometro) lblCronometro.innerText = '60 s';
  if (panelEstado) {
    panelEstado.innerText = 'Evaluación Oficial activa: Conduce el puntero hasta la meta verde.';
    panelEstado.style.color = '#38bdf8';
  }
  if (placaIcono) placaIcono.innerHTML = '<span>🟢 Evaluación Oficial en Curso</span>';
  if (placaSub) placaSub.innerText = 'Serie Reglamentaria (60 s)';

  if (btnAccion) {
    const actual = window.CreditManager ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
    const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;
    btnAccion.style.display = 'flex';
    btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnAccion.style.backgroundColor = '#22c55e';
  }
  resetearPuntero();
  dibujarEscena();
}

function resetearPuntero() {
  posX = circuitoActivo.inicio.x;
  posY = circuitoActivo.inicio.y;
  velX = 0;
  velY = 0;
  contactos = 0;
  tiempoContactoMs = 0;
  enContacto = false;
  if (metricaContactos) metricaContactos.innerText = '0';
  if (metricaEfectividad) metricaEfectividad.innerText = '100%';
}

if (btnAccion) {
  btnAccion.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (btnAccion.disabled) return;

    if (estado === 'INACTIVO') {
      iniciarRecorrido();
    } else if (estado === 'PAUSA_ENTRE_FASES') {
      iniciarFaseOficial();
    }
  });
}

function iniciarRecorrido() {
  estado = 'JUGANDO';
  resetearPuntero();
  btnAccion.style.display = 'none';

  if (modo === 'DEMO') {
    tiempoRestante = 20;
    if (lblCronometro) lblCronometro.innerText = `${tiempoRestante} s`;
    if (panelEstado) {
      panelEstado.innerText = 'Fase Demo: Calibra la motricidad con ambas manos';
      panelEstado.style.color = '#facc15';
    }
  } else {
    tiempoRestante = 60;
    tiempoInicioOficial = performance.now();
    if (lblCronometro) lblCronometro.innerText = '60 s';
    if (panelEstado) {
      panelEstado.innerText = 'Evaluación Oficial en curso: Llega a la meta sin tocar los bordes.';
      panelEstado.style.color = '#4ade80';
    }
  }

  temporizadorInterval = setInterval(() => {
    tiempoRestante--;
    if (lblCronometro) lblCronometro.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      clearInterval(temporizadorInterval);
      finalizarRecorrido(false);
    }
  }, 1000);

  bucleAnimacion();
}

function bucleAnimacion() {
  if (estado !== 'JUGANDO') return;

  posX += velX;
  posY += velY;

  if (canvas) {
    if (posX < radioPuntero) posX = radioPuntero;
    if (posX > canvas.width - radioPuntero) posX = canvas.width - radioPuntero;
    if (posY < radioPuntero) posY = radioPuntero;
    if (posY > canvas.height - radioPuntero) posY = canvas.height - radioPuntero;
  }

  verificarColision();
  verificarMeta();

  dibujarEscena();
  animacionFrame = requestAnimationFrame(bucleAnimacion);
}

function verificarColision() {
  let dentro = false;
  for (let tramo of circuitoActivo.tramos) {
    const d = distanciaPuntoASegmento(posX, posY, tramo.x1, tramo.y1, tramo.x2, tramo.y2);
    if (d <= anchoCanal / 2) {
      dentro = true;
      break;
    }
  }

  const ahora = performance.now();
  if (!dentro) {
    if (!enContacto) {
      enContacto = true;
      contactos++;
      if (metricaContactos) metricaContactos.innerText = contactos;
      ultimoContactoTimestamp = ahora;
      if ('vibrate' in navigator) navigator.vibrate(50);
    } else {
      tiempoContactoMs += (ahora - ultimoContactoTimestamp);
      ultimoContactoTimestamp = ahora;
    }
  } else {
    enContacto = false;
  }

  const segError = (tiempoContactoMs / 1000);
  const efectividad = Math.max(10, Math.min(100, Math.round(100 - (contactos * 4) - (segError * 3))));
  if (metricaEfectividad) metricaEfectividad.innerText = `${efectividad}%`;
}

function verificarMeta() {
  const dx = posX - circuitoActivo.meta.x;
  const dy = posY - circuitoActivo.meta.y;
  if (Math.sqrt(dx * dx + dy * dy) <= (circuitoActivo.meta.radio + radioPuntero)) {
    finalizarRecorrido(true);
  }
}

function finalizarRecorrido(llegoAMeta) {
  cancelAnimationFrame(animacionFrame);
  clearInterval(temporizadorInterval);
  estado = 'FINALIZADO';

  if (modo === 'DEMO') {
    if (window.CreditManager && CreditManager.marcarDemoCompletado) {
      CreditManager.marcarDemoCompletado('palancas');
    }
    estado = 'PAUSA_ENTRE_FASES';

    const actual = window.CreditManager ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
    const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;

    if (panelEstado) {
      panelEstado.innerText = `¡Calibración lista! Tuviste ${contactos} contactos. Pasa a la prueba oficial.`;
      panelEstado.style.color = '#4ade80';
    }
    if (placaIcono) placaIcono.innerHTML = '<span>🟢 Calibración Superada</span>';
    if (placaSub) placaSub.innerText = 'Lista para Evaluación Oficial';

    if (btnAccion) {
      btnAccion.style.display = 'flex';
      btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    const tiempoUsado = Math.min(60, Math.round((performance.now() - tiempoInicioOficial) / 1000));
    const segError = Number((tiempoContactoMs / 1000).toFixed(1));
    const penalizacionContactos = contactos * 8;
    const penalizacionTiempo = Math.round(segError * 3);
    const porcentajeEfectividad = Math.max(10, Math.min(100, 100 - penalizacionContactos - penalizacionTiempo));
    const aprobado = llegoAMeta && contactos <= 3 && segError <= 2.5;

    let consumidas = 1;
    if (window.CreditManager) {
      consumidas = CreditManager.registrarConsumo('palancas');
    }

    const max = window.CreditManager ? CreditManager.obtenerLimiteModulo('palancas') : 3;

    let historial = JSON.parse(localStorage.getItem('sensometrika_historial_palancas')) || [];
    historial.push({
      simulacion: consumidas,
      porcentaje: porcentajeEfectividad,
      efectividad: porcentajeEfectividad,
      contactos: contactos,
      tiempoError: segError,
      tiempo: tiempoUsado,
      aprobado: aprobado,
      circuito: indiceCircuitoActual + 1
    });
    localStorage.setItem('sensometrika_historial_palancas', JSON.stringify(historial));

    if (panelEstado) {
      panelEstado.innerText = llegoAMeta ? '¡Circuito completado con éxito!' : 'Tiempo reglamentario cumplido (60 s)';
    }

    if (zonaCoordinacion) {
      zonaCoordinacion.innerHTML = `
        <div style="background:#0d1527; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:12px; padding:16px; text-align:center; margin-top:10px;">
          <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.05rem;">
            ¡Simulación ${consumidas} de ${max} Finalizada!
          </h3>
          <p style="color:#94a3b8; font-size:0.82rem; margin-bottom:12px;">
            Efectividad: <strong style="color:#38bdf8;">${porcentajeEfectividad}%</strong> | Contactos: <strong style="color:#fff;">${contactos}</strong> (${segError}s)
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; height:44px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
              Continuar a Módulo 3 (Test de Punteo) →
            </a>
            <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
              Volver al Menú Principal
            </a>
          </div>
        </div>
      `;
    }
  }
}

function iniciarFaseOficial() {
  modo = 'OFICIAL';
  prepararVistaOficialDirecta();
  iniciarRecorrido();
}

function dibujarEscena() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pared exterior
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = anchoCanal;
  ctx.strokeStyle = '#0369a1';
  ctx.beginPath();
  circuitoActivo.tramos.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(p.x2, p.y2);
  });
  ctx.stroke();

  // Interior del canal
  ctx.lineWidth = anchoCanal - 4;
  ctx.strokeStyle = '#020617';
  ctx.stroke();

  // Meta verde
  ctx.beginPath();
  ctx.arc(circuitoActivo.meta.x, circuitoActivo.meta.y, circuitoActivo.meta.radio, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();

  // Puntero
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = enContacto ? '#ef4444' : '#facc15';
  ctx.shadowColor = enContacto ? '#ef4444' : '#facc15';
  ctx.shadowBlur = enContacto ? 12 : 6;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function vincularBoton(btn, accPresionar, accSoltar) {
  if (!btn) return;
  const pres = (e) => { e.preventDefault(); if (estado === 'JUGANDO') accPresionar(); };
  const solt = (e) => { e.preventDefault(); accSoltar(); };
  btn.addEventListener('pointerdown', pres);
  btn.addEventListener('pointerup', solt);
  btn.addEventListener('pointerleave', solt);
  btn.addEventListener('pointercancel', solt);
}

vincularBoton(btnArriba, () => velY = -VELOCIDAD, () => velY = 0);
vincularBoton(btnAbajo, () => velY = VELOCIDAD, () => velY = 0);
vincularBoton(btnIzq, () => velX = -VELOCIDAD, () => velX = 0);
vincularBoton(btnDer, () => velX = VELOCIDAD, () => velX = 0);