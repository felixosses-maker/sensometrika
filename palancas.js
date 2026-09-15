/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Cuota dinámica por Plan (Básico: 3 | Plus: 5 | Full: 8)
   • 1 Demo de calibración de 20 s único por módulo
   • Banco de trazados continuo anti-memorización
   • Botón directo para rendir la siguiente simulación oficial
   ========================================================================== */
const canvas = document.getElementById('canvas-circuito');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo');
const lblCronometro = document.getElementById('lbl-cronometro');
const txtTiempoCabecera = document.getElementById('txt-tiempo-cabecera');
const metricaContactos = document.getElementById('metrica-contactos');
const metricaTContacto = document.getElementById('metrica-t-contacto');
const metricaCircuito = document.getElementById('metrica-circuito');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const zonaCoordinacion = document.getElementById('zona-coordinacion-test');

const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

// Banco de trazados anti-memorización
const BANCO_CIRCUITOS = {
  DEMO: {
    nombre: 'Calibración A',
    inicio: { x: 30, y: 40 },
    meta: { x: 300, y: 140, radio: 10 },
    tramos: [
      { x1: 25, y1: 40, x2: 130, y2: 40 },
      { x1: 130, y1: 40, x2: 130, y2: 100 },
      { x1: 130, y1: 100, x2: 240, y2: 100 },
      { x1: 240, y1: 100, x2: 240, y2: 140 },
      { x1: 240, y1: 140, x2: 305, y2: 140 }
    ]
  },
  OFICIALES: [
    {
      nombre: 'Circuito 1 (Escalera Asimétrica)',
      inicio: { x: 30, y: 35 },
      meta: { x: 305, y: 145, radio: 10 },
      tramos: [
        { x1: 25, y1: 35, x2: 100, y2: 35 },
        { x1: 100, y1: 35, x2: 100, y2: 85 },
        { x1: 100, y1: 85, x2: 180, y2: 85 },
        { x1: 180, y1: 85, x2: 180, y2: 145 },
        { x1: 180, y1: 145, x2: 305, y2: 145 }
      ]
    },
    {
      nombre: 'Circuito 2 (Zigzag Invertido)',
      inicio: { x: 30, y: 145 },
      meta: { x: 305, y: 35, radio: 10 },
      tramos: [
        { x1: 25, y1: 145, x2: 120, y2: 145 },
        { x1: 120, y1: 145, x2: 120, y2: 90 },
        { x1: 120, y1: 90, x2: 220, y2: 90 },
        { x1: 220, y1: 90, x2: 220, y2: 35 },
        { x1: 220, y1: 35, x2: 305, y2: 35 }
      ]
    },
    {
      nombre: 'Circuito 3 (Doble Bahía / S)',
      inicio: { x: 30, y: 50 },
      meta: { x: 305, y: 130, radio: 10 },
      tramos: [
        { x1: 25, y1: 50, x2: 150, y2: 50 },
        { x1: 150, y1: 50, x2: 150, y2: 130 },
        { x1: 150, y1: 130, x2: 230, y2: 130 },
        { x1: 230, y1: 130, x2: 230, y2: 60 },
        { x1: 230, y1: 60, x2: 305, y2: 60 },
        { x1: 305, y1: 60, x2: 305, y2: 130 }
      ]
    },
    {
      nombre: 'Circuito 4 (Horquilla Envolvente)',
      inicio: { x: 30, y: 35 },
      meta: { x: 170, y: 90, radio: 10 },
      tramos: [
        { x1: 25, y1: 35, x2: 290, y2: 35 },
        { x1: 290, y1: 35, x2: 290, y2: 145 },
        { x1: 290, y1: 145, x2: 110, y2: 145 },
        { x1: 110, y1: 145, x2: 110, y2: 90 },
        { x1: 110, y1: 90, x2: 170, y2: 90 }
      ]
    }
  ]
};

let modo = 'DEMO';
let estado = 'INACTIVO';
let circuitoActivo = BANCO_CIRCUITOS.DEMO;
const anchoCanal = 26;
const radioPuntero = 6;
const VELOCIDAD = 2.2;

let posX = circuitoActivo.inicio.x;
let posY = circuitoActivo.inicio.y;
let velX = 0;
let velY = 0;

let contactos = 0;
let tiempoContactoMs = 0;
let enContacto = false;
let ultimoContactoTimestamp = 0;

let tiempoRestante = 20;
let temporizadorInterval = null;
let animacionFrame = null;
let tiempoInicioOficial = 0;

window.addEventListener('DOMContentLoaded', () => {
  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');

  // Validación de cuota dinámica según el plan
  if (!CreditManager.puedeRendir('palancas')) {
    bloquearModuloPorCupo();
    return;
  }

  // Si ya completó el demo de calibración, entra directo a la simulación oficial
  if (CreditManager.demoYaRealizado('palancas')) {
    seleccionarPistaOficialAleatoria();
    prepararVistaOficialDirecta();
  } else {
    cargarPista(BANCO_CIRCUITOS.DEMO);
  }
});

function bloquearModuloPorCupo() {
  const max = CreditManager.obtenerLimiteModulo('palancas');
  btnAccion.disabled = true;
  btnAccion.style.opacity = '0.4';
  btnAccion.innerText = `Cupo Bloqueado (${max}/${max} Realizadas)`;
  panelEstado.innerText = `Has alcanzado el límite de ${max} simulaciones oficiales de tu Plan.`;
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado (${max} de ${max})</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">Completaste todas las simulaciones de tu Plan en este módulo.</p>
      <a href="menu.html" class="btn-principal" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function seleccionarPistaOficialAleatoria() {
  const consumidas = CreditManager.obtenerConsumidas('palancas');
  const indice = consumidas % BANCO_CIRCUITOS.OFICIALES.length;
  cargarPista(BANCO_CIRCUITOS.OFICIALES[indice]);
}

function cargarPista(pistaConfig) {
  circuitoActivo = pistaConfig;
  posX = pistaConfig.inicio.x;
  posY = pistaConfig.inicio.y;
  metricaCircuito.innerText = pistaConfig.nombre;
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
  metricaContactos.innerText = '0';
  metricaTContacto.innerText = '0.0 s';
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  estado = 'INACTIVO';
  const actual = CreditManager.obtenerNumeroSimulacionActual('palancas');
  const max = CreditManager.obtenerLimiteModulo('palancas');

  badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  txtTiempoCabecera.innerHTML = 'Evaluación Activa (60 s)';
  panelEstado.innerText = `Trazado generado: ${circuitoActivo.nombre}. Presiona iniciar.`;
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'block';
  btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
  btnAccion.style.backgroundColor = '#22c55e';
  dibujarEscena();
}

btnAccion.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (btnAccion.disabled) return;

  if (estado === 'INACTIVO') {
    iniciarRecorrido();
  } else if (estado === 'PAUSA_ENTRE_FASES') {
    iniciarFaseOficial();
  }
});

function iniciarRecorrido() {
  estado = 'JUGANDO';
  resetearPuntero();
  btnAccion.style.display = 'none';

  if (modo === 'DEMO') {
    tiempoRestante = 20;
    lblCronometro.innerText = `${tiempoRestante} s`;
    panelEstado.innerText = 'Fase Demo: Calibra el movimiento con ambas manos';
  } else {
    tiempoRestante = 60;
    tiempoInicioOficial = performance.now();
    txtTiempoCabecera.innerHTML = 'Tiempo: <strong id="lbl-cronometro">60 s</strong>';
    panelEstado.innerText = 'Evaluación Oficial activa: Mantén el pulso en el canal';
  }

  temporizadorInterval = setInterval(() => {
    tiempoRestante--;
    const elCrono = document.getElementById('lbl-cronometro');
    if (elCrono) elCrono.innerText = `${tiempoRestante} s`;

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

  if (posX < radioPuntero) posX = radioPuntero;
  if (posX > canvas.width - radioPuntero) posX = canvas.width - radioPuntero;
  if (posY < radioPuntero) posY = radioPuntero;
  if (posY > canvas.height - radioPuntero) posY = canvas.height - radioPuntero;

  verificarColisionParedes();
  verificarLlegadaMeta();

  dibujarEscena();
  animacionFrame = requestAnimationFrame(bucleAnimacion);
}

function verificarColisionParedes() {
  let dentroDeCanal = false;
  for (let tramo of circuitoActivo.tramos) {
    const dist = distanciaPuntoASegmento(posX, posY, tramo.x1, tramo.y1, tramo.x2, tramo.y2);
    if (dist <= anchoCanal / 2) {
      dentroDeCanal = true;
      break;
    }
  }

  const ahora = performance.now();
  if (!dentroDeCanal) {
    if (!enContacto) {
      enContacto = true;
      contactos++;
      metricaContactos.innerText = contactos;
      ultimoContactoTimestamp = ahora;
      if ('vibrate' in navigator) navigator.vibrate(50);
    } else {
      tiempoContactoMs += (ahora - ultimoContactoTimestamp);
      ultimoContactoTimestamp = ahora;
      metricaTContacto.innerText = `${(tiempoContactoMs / 1000).toFixed(1)} s`;
    }
  } else {
    enContacto = false;
  }
}

function verificarLlegadaMeta() {
  const dx = posX - circuitoActivo.meta.x;
  const dy = posY - circuitoActivo.meta.y;
  const distMeta = Math.sqrt(dx * dx + dy * dy);

  if (distMeta <= (circuitoActivo.meta.radio + radioPuntero)) {
    clearInterval(temporizadorInterval);
    cancelAnimationFrame(animacionFrame);
    finalizarRecorrido(true);
  }
}

function finalizarRecorrido(llegoAMeta) {
  cancelAnimationFrame(animacionFrame);
  clearInterval(temporizadorInterval);
  estado = 'FINALIZADO';

  const max = CreditManager.obtenerLimiteModulo('palancas');

  if (modo === 'DEMO') {
    CreditManager.marcarDemoCompletado('palancas');
    estado = 'PAUSA_ENTRE_FASES';

    const actual = CreditManager.obtenerNumeroSimulacionActual('palancas');
    panelEstado.innerText = `¡Calibración lista! Tuviste ${contactos} contactos. Pasa a Simulación Oficial ${actual} de ${max}.`;
    panelEstado.style.color = '#4ade80';

    btnAccion.style.display = 'block';
    btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnAccion.style.backgroundColor = '#22c55e';
  } else {
    // Registro de la simulación oficial completada
    const consumidas = CreditManager.registrarConsumo('palancas');
    const tiempoUsado = Math.min(60, Math.round((performance.now() - tiempoInicioOficial) / 1000));
    const aprobado = llegoAMeta && contactos <= 3;

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      contactos: contactos,
      tiempo: tiempoUsado,
      tContacto: (tiempoContactoMs / 1000).toFixed(1),
      circuito: circuitoActivo.nombre,
      aprobado: aprobado
    }));

    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
    const agotado = consumidas >= max;

    panelEstado.innerText = llegoAMeta ? '¡Circuito completado!' : 'Tiempo límite cumplido (60 s)';

    let bloqueBotones = '';
    if (!agotado) {
      bloqueBotones = `
        <button onclick="repetirSimulacionPalancas()" class="btn-principal" style="width:100%; height:44px; background-color:#22c55e; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem; border:none; cursor:pointer; margin-bottom:8px;">
          🔄 Rendir Simulación ${consumidas + 1} de ${max} →
        </button>
        <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:40px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.85rem;">
          Continuar a Módulo 3 (Test de Punteo) →
        </a>
      `;
    } else {
      bloqueBotones = `
        <a href="punteo.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:44px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem; margin-bottom:8px;">
          Continuar a Módulo 3 (Test de Punteo) →
        </a>
      `;
    }

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#38bdf8' : '#ef4444'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
          ${aprobado ? '✔ Módulo 2 Superado' : '⚠ Módulo 2 Fuera de Estándar'} (${contactos} contactos)
        </h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 8px;">
          Tiempo empleado: <strong style="color: #fff;">${tiempoUsado} s</strong> | Pista: <strong style="color: #38bdf8;">${circuitoActivo.nombre}</strong>
        </p>
        <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
          ${agotado ? `Has completado tus ${max}/${max} simulaciones en este módulo.` : `Simulación ${consumidas} de ${max} registrada. Te restan ${max - consumidas}.`}
        </p>
        <div style="display: flex; flex-direction: column;">
          ${bloqueBotones}
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px; margin-top: 4px;">
            Regresar al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

window.repetirSimulacionPalancas = function() {
  zonaCoordinacion.innerHTML = '';
  seleccionarPistaOficialAleatoria();
  prepararVistaOficialDirecta();
};

function iniciarFaseOficial() {
  modo = 'OFICIAL';
  seleccionarPistaOficialAleatoria();
  prepararVistaOficialDirecta();
  iniciarRecorrido();
}

function dibujarEscena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  ctx.lineWidth = anchoCanal - 4;
  ctx.strokeStyle = '#020617';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(circuitoActivo.meta.x, circuitoActivo.meta.y, circuitoActivo.meta.radio, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = enContacto ? '#ef4444' : '#facc15';
  ctx.shadowColor = enContacto ? '#ef4444' : '#facc15';
  ctx.shadowBlur = enContacto ? 15 : 8;
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

function configurarBotonMando(boton, setVel, resetVel) {
  const iniciar = (e) => { e.preventDefault(); if (estado === 'JUGANDO') setVel(); };
  const frenar = (e) => { e.preventDefault(); resetVel(); };

  boton.addEventListener('pointerdown', iniciar);
  boton.addEventListener('pointerup', frenar);
  boton.addEventListener('pointerleave', frenar);
  boton.addEventListener('pointercancel', frenar);
}

configurarBotonMando(btnArriba, () => velY = -VELOCIDAD, () => velY = 0);
configurarBotonMando(btnAbajo, () => velY = VELOCIDAD, () => velY = 0);
configurarBotonMando(btnIzq, () => velX = -VELOCIDAD, () => velX = 0);
configurarBotonMando(btnDer, () => velX = VELOCIDAD, () => velX = 0);

window.addEventListener('keydown', (e) => {
  if (estado !== 'JUGANDO') return;
  if (e.key === 'ArrowUp' || e.key === 'w') velY = -VELOCIDAD;
  if (e.key === 'ArrowDown' || e.key === 's') velY = VELOCIDAD;
  if (e.key === 'ArrowLeft' || e.key === 'a') velX = -VELOCIDAD;
  if (e.key === 'ArrowRight' || e.key === 'd') velX = VELOCIDAD;
});

window.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) velY = 0;
  if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) velX = 0;
});