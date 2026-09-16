/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Cuota dinámica por Plan (Full: 8 | Plus: 5 | Básico: 3 | B2B: 1)
   • Demo de calibración de 20s que se registra y no se repite
   • Transición inmediata a Simulación Oficial
   • Sincronización estricta con CreditManager
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');

const btnIniciar = document.getElementById('btn-iniciar-palancas');
const badgeModo = document.getElementById('badge-modo-palancas');
const txtTiempo = document.getElementById('txt-tiempo-palancas');
const lblCrono = document.getElementById('lbl-crono-palancas');
const metricaContactos = document.getElementById('metrica-contactos');
const metricaTiempoContacto = document.getElementById('metrica-tiempo-contacto');
const metricaCircuito = document.getElementById('metrica-circuito');
const panelEstado = document.getElementById('panel-estado');
const zonaCoordinacion = document.getElementById('zona-coordinacion-palancas');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let pruebaActiva = false;
let animacionFrame = null;
let temporizadorPrueba = null;
let tiempoRestante = 20;

let contactos = 0;
let tiempoEnErrorTotal = 0;
let instanteInicioContacto = null;

// Puntero y controles táctiles
let posX = 40;
let posY = 40;
const radioPuntero = 10;
let velX = 0;
let velY = 0;
const VELOCIDAD = 2.4;

// Banco de Circuitos anti-memorización
const CIRCUITOS = [
  { nombre: 'Circuito 1 (Horquilla)', inicio: { x: 40, y: 50 }, fin: { x: 180, y: 140 } },
  { nombre: 'Circuito 2 (Bayoneta)', inicio: { x: 40, y: 40 }, fin: { x: 280, y: 160 } },
  { nombre: 'Circuito 3 (Zigzag Invertido)', inicio: { x: 40, y: 150 }, fin: { x: 280, y: 40 } }
];
let circuitoActual = CIRCUITOS[0];

window.addEventListener('DOMContentLoaded', () => {
  // 1. Validar acceso por saldo
  if (!CreditManager.validarAccesoOBloquear('palancas')) {
    return;
  }

  // 2. Verificar si el Demo ya fue completado previamente
  const demoYaHecho = CreditManager.demoYaRealizado('palancas');
  if (demoYaHecho) {
    prepararFaseOficial();
  } else {
    configurarFaseDemo();
  }

  redibujar();
});

function configurarFaseDemo() {
  modo = 'DEMO';
  circuitoActual = CIRCUITOS[0];
  if (metricaCircuito) metricaCircuito.innerText = 'Calibración Guiada';
  if (badgeModo) badgeModo.innerText = '🟡 Calibración Técnica (Demo 20 s)';
  if (txtTiempo) txtTiempo.innerText = 'Fase de Inducción';
  if (lblCrono) lblCrono.innerText = '20 s';
  if (btnIniciar) {
    btnIniciar.innerText = 'Iniciar Calibración Guiada (Demo)';
    btnIniciar.style.backgroundColor = '#0284c7';
    btnIniciar.style.display = 'block';
  }
  if (panelEstado) {
    panelEstado.innerText = 'Fase de calibración: familiarízate con las palancas sin gastar intentos.';
    panelEstado.style.color = '#38bdf8';
  }
  posX = circuitoActual.inicio.x;
  posY = circuitoActual.inicio.y;
}

function prepararFaseOficial() {
  modo = 'OFICIAL';
  pruebaActiva = false;
  clearInterval(temporizadorPrueba);
  cancelAnimationFrame(animacionFrame);

  const consumidas = CreditManager.obtenerConsumidas('palancas');
  const max = CreditManager.obtenerLimiteModulo('palancas');
  const actual = CreditManager.obtenerNumeroSimulacionActual('palancas');
  const esEmpresa = CreditManager.esB2B();

  // Rotar circuito según número de simulación
  const idx = consumidas % CIRCUITOS.length;
  circuitoActual = CIRCUITOS[idx];

  if (metricaCircuito) metricaCircuito.innerText = circuitoActual.nombre;
  if (badgeModo) {
    badgeModo.innerText = esEmpresa 
      ? '🔴 Examen Oficial B2B (1 de 1)' 
      : `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
  }
  if (txtTiempo) txtTiempo.innerText = 'Evaluación Activa (60 s)';
  if (lblCrono) lblCrono.innerText = '60 s';
  if (panelEstado) {
    panelEstado.innerText = `Listo para iniciar la Simulación Oficial ${actual} de ${max}.`;
    panelEstado.style.color = '#38bdf8';
  }
  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnIniciar.style.backgroundColor = '#22c55e';
  }

  resetearMetricas();
  redibujar();
}

function resetearMetricas() {
  posX = circuitoActual.inicio.x;
  posY = circuitoActual.inicio.y;
  velX = 0;
  velY = 0;
  contactos = 0;
  tiempoEnErrorTotal = 0;
  instanteInicioContacto = null;
  if (metricaContactos) metricaContactos.innerText = '0';
  if (metricaTiempoContacto) metricaTiempoContacto.innerText = '0.0 s';
}

btnIniciar.addEventListener('click', () => {
  if (pruebaActiva) return;
  iniciarPrueba();
});

function iniciarPrueba() {
  pruebaActiva = true;
  resetearMetricas();
  btnIniciar.style.display = 'none';

  tiempoRestante = (modo === 'DEMO') ? 20 : 60;
  lblCrono.innerText = `${tiempoRestante} s`;
  panelEstado.innerText = (modo === 'DEMO') 
    ? 'Calibrando mandos... Conduce el puntero a la meta verde.' 
    : 'Evaluación en curso: Mantén el puntero dentro de la pista.';
  panelEstado.style.color = '#38bdf8';

  temporizadorPrueba = setInterval(() => {
    tiempoRestante--;
    lblCrono.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      finalizarPrueba('TIEMPO_AGOTADO');
    }
  }, 1000);

  bucleAnimacion();
}

function bucleAnimacion() {
  if (!pruebaActiva) return;

  posX += velX;
  posY += velY;

  posX = Math.max(radioPuntero + 2, Math.min(canvas.width - radioPuntero - 2, posX));
  posY = Math.max(radioPuntero + 2, Math.min(canvas.height - radioPuntero - 2, posY));

  verificarColision();

  // Detección de meta
  const distMeta = Math.hypot(posX - circuitoActual.fin.x, posY - circuitoActual.fin.y);
  if (distMeta < 15) {
    finalizarPrueba('META_ALCANZADA');
    return;
  }

  redibujar();
  animacionFrame = requestAnimationFrame(bucleAnimacion);
}

function verificarColision() {
  let enPista = false;
  if (circuitoActual.nombre.includes('Horquilla')) {
    if ((posY >= 30 && posY <= 70 && posX >= 30 && posX <= 290) ||
        (posX >= 250 && posX <= 290 && posY >= 50 && posY <= 160) ||
        (posY >= 120 && posY <= 160 && posX >= 120 && posX <= 270) ||
        (posX >= 120 && posX <= 160 && posY >= 120 && posY <= 160)) {
      enPista = true;
    }
  } else {
    enPista = (posX > 25 && posX < 305 && posY > 25 && posY < 185);
  }

  const enColision = !enPista;

  if (enColision) {
    if (!instanteInicioContacto) {
      instanteInicioContacto = performance.now();
      contactos++;
      metricaContactos.innerText = contactos;
      if ('vibrate' in navigator) navigator.vibrate(50);
    }
    const delta = (performance.now() - instanteInicioContacto) / 1000;
    metricaTiempoContacto.innerText = `${(tiempoEnErrorTotal + delta).toFixed(1)} s`;
  } else {
    if (instanteInicioContacto) {
      tiempoEnErrorTotal += (performance.now() - instanteInicioContacto) / 1000;
      instanteInicioContacto = null;
      metricaTiempoContacto.innerText = `${tiempoEnErrorTotal.toFixed(1)} s`;
    }
  }
}

function redibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pista guía
  ctx.lineWidth = 26;
  ctx.strokeStyle = '#0284c7';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  if (circuitoActual.nombre.includes('Horquilla')) {
    ctx.moveTo(40, 50);
    ctx.lineTo(270, 50);
    ctx.lineTo(270, 140);
    ctx.lineTo(160, 140);
  } else if (circuitoActual.nombre.includes('Bayoneta')) {
    ctx.moveTo(40, 40);
    ctx.lineTo(150, 40);
    ctx.lineTo(150, 160);
    ctx.lineTo(280, 160);
  } else {
    ctx.moveTo(40, 150);
    ctx.lineTo(160, 150);
    ctx.lineTo(160, 40);
    ctx.lineTo(280, 40);
  }
  ctx.stroke();

  // Línea central
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();

  // Meta
  ctx.beginPath();
  ctx.arc(circuitoActual.fin.x, circuitoActual.fin.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();

  // Puntero
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = instanteInicioContacto ? '#ef4444' : '#f59e0b';
  ctx.shadowColor = instanteInicioContacto ? '#ef4444' : '#f59e0b';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function finalizarPrueba(motivo) {
  pruebaActiva = false;
  clearInterval(temporizadorPrueba);
  cancelAnimationFrame(animacionFrame);
  velX = 0;
  velY = 0;

  if (instanteInicioContacto) {
    tiempoEnErrorTotal += (performance.now() - instanteInicioContacto) / 1000;
    instanteInicioContacto = null;
  }

  // Si estábamos en Demo de Calibración
  if (modo === 'DEMO') {
    // 1. Guardar permanentemente que el demo ya se hizo
    CreditManager.marcarDemoCompletado('palancas');

    panelEstado.innerText = '¡Calibración completada con éxito!';
    panelEstado.style.color = '#4ade80';

    zonaCoordinacion.innerHTML = `
      <div style="background:#0f172a; border:1.5px solid #0284c7; border-radius:12px; padding:16px; text-align:center; width:100%; margin-top:12px; box-sizing:border-box;">
        <h3 style="color:#38bdf8; margin:0 0 6px 0;">¡Calibración Finalizada!</h3>
        <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 14px 0;">Mandos probados correctamente. Ya puedes comenzar tu evaluación oficial reglamentaria.</p>
        <button type="button" onclick="pasarDirectoAOficial()" style="width:100%; height:46px; background:#22c55e; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:0.92rem; cursor:pointer;">
          Comenzar Simulación Oficial →
        </button>
      </div>
    `;
    return;
  }

  // FASE OFICIAL: Registrar consumo de saldo y guardar resultado
  let porcentaje = Math.max(0, 100 - (contactos * 10));
  const aprobado = (contactos <= 3 && porcentaje >= 70);

  localStorage.setItem('sensometrika_palancas', JSON.stringify({
    toques: contactos,
    efectividad: porcentaje,
    porcentaje: porcentaje,
    tiempoError: Number(tiempoEnErrorTotal.toFixed(1)),
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  const consumidas = CreditManager.registrarConsumo('palancas');
  const max = CreditManager.obtenerLimiteModulo('palancas');
  const agotado = consumidas >= max;

  panelEstado.innerText = 'Evaluación Oficial de Palancas completada.';

  zonaCoordinacion.innerHTML = `
    <div style="background:#0f172a; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:14px; padding:18px 16px; margin-top:14px; text-align:center; width:100%; box-sizing:border-box;">
      <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.1rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color:#ffffff; font-size:0.95rem; font-weight:700; margin:4px 0 6px 0;">
        Resultado: <span style="color:#38bdf8;">${porcentaje}% de precisión</span>
      </p>
      <p style="color:#94a3b8; font-size:0.78rem; margin:0 0 14px 0;">
        ${contactos} contactos (${tiempoEnErrorTotal.toFixed(1)} s fuera) • ${aprobado ? 'APROBADO' : 'OBSERVADO'}
      </p>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="punteo.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:46px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:800; font-size:0.9rem; box-shadow:0 4px 12px rgba(2,132,199,0.35);">
          Continuar a Módulo 3 (Punteo) →
        </a>
        ${!agotado ? `
          <button type="button" onclick="pasarDirectoAOficial()" style="width:100%; height:42px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">
            🔄 Rendir Simulación de Palancas (${consumidas + 1} de ${max})
          </button>
        ` : ''}
        <a href="menu.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:38px; background:transparent; color:#64748b; text-decoration:none; font-size:0.82rem; font-weight:600;">
          ← Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}

window.pasarDirectoAOficial = function() {
  zonaCoordinacion.innerHTML = '';
  prepararFaseOficial();
};

// Controles táctiles
function moverManoIzq(dir) { if (pruebaActiva) velY = (dir === 'ARRIBA') ? -VELOCIDAD : VELOCIDAD; }
function frenarManoIzq() { velY = 0; }
function moverManoDer(dir) { if (pruebaActiva) velX = (dir === 'IZQ') ? -VELOCIDAD : VELOCIDAD; }
function frenarManoDer() { velX = 0; }

const bindBtn = (id, fnStart, fnEnd) => {
  const el = document.getElementById(id);
  if (!el) return;
  ['pointerdown', 'touchstart'].forEach(e => el.addEventListener(e, (ev) => { ev.preventDefault(); fnStart(); }));
  ['pointerup', 'pointerleave', 'touchend'].forEach(e => el.addEventListener(e, (ev) => { ev.preventDefault(); fnEnd(); }));
};

bindBtn('btn-izq-arriba', () => moverManoIzq('ARRIBA'), frenarManoIzq);
bindBtn('btn-izq-abajo', () => moverManoIzq('ABAJO'), frenarManoIzq);
bindBtn('btn-der-izq', () => moverManoDer('IZQ'), frenarManoDer);
bindBtn('btn-der-der', () => moverManoDer('DER'), frenarManoDer);