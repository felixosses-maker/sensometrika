/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Sincronización estricta de cuotas en sensometrika_ejecuciones
   • 1 Demo de 20s + Simulaciones Oficiales (60s)
   • Tarjeta inferior ergonómica con botón al Módulo 3 y al Menú
   • Cálculo estandarizado de efectividad en porcentaje (%)
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
  { nombre: 'Circuito 1 (Bayoneta)', inicio: { x: 40, y: 40 }, fin: { x: 300, y: 180 } },
  { nombre: 'Circuito 2 (Escalera)', inicio: { x: 40, y: 180 }, fin: { x: 300, y: 40 } },
  { nombre: 'Circuito 3 (Zigzag)', inicio: { x: 40, y: 110 }, fin: { x: 300, y: 110 } },
  { nombre: 'Circuito 4 (Horquilla)', inicio: { x: 40, y: 50 }, fin: { x: 180, y: 140 } }
];
let circuitoActual = CIRCUITOS[0];

window.addEventListener('DOMContentLoaded', () => {
  configurarSesionYCupos();
  redibujar();
});

function configurarSesionYCupos() {
  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || { planId: 'part_full' };
  const ejecuciones = JSON.parse(localStorage.getItem('sensometrika_ejecuciones')) || {};
  const hechos = ejecuciones.palancas || 0;

  const esFull = (sesion.planId && (sesion.planId.includes('full') || sesion.planId === 'part_full'));
  const esPlus = (sesion.planId && (sesion.planId.includes('plus') || sesion.planId === 'part_plus'));
  const max = esFull ? 8 : (esPlus ? 5 : 3);

  const demoRealizado = localStorage.getItem('sensometrika_palancas_demo_ok') === 'true';

  if (hechos >= max) {
    btnIniciar.disabled = true;
    btnIniciar.style.opacity = '0.4';
    btnIniciar.innerText = `Cupo Completo (${max}/${max})`;
    panelEstado.innerText = 'Has completado todas las simulaciones de este módulo.';
    panelEstado.style.color = '#f87171';
    return;
  }

  if (demoRealizado) {
    modo = 'OFICIAL';
    const actual = hechos + 1;
    badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
    txtTiempo.innerText = 'Evaluación Activa (60 s)';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnIniciar.style.backgroundColor = '#22c55e';
    panelEstado.innerText = `Listo para iniciar la Simulación Oficial ${actual} de ${max}.`;
  } else {
    modo = 'DEMO';
    badgeModo.innerText = '🟡 Calibración Técnica (Demo 20 s)';
    txtTiempo.innerText = 'Fase de Inducción';
    btnIniciar.innerText = 'Iniciar Calibración Guiada (Demo)';
    btnIniciar.style.backgroundColor = '#0284c7';
    panelEstado.innerText = 'Fase de calibración: familiarízate con las palancas sin gastar intentos.';
  }

  // Asignar circuito aleatorio
  circuitoActual = CIRCUITOS[Math.floor(Math.random() * CIRCUITOS.length)];
  if (metricaCircuito) metricaCircuito.innerText = circuitoActual.nombre;
  posX = circuitoActual.inicio.x;
  posY = circuitoActual.inicio.y;
}

btnIniciar.addEventListener('click', () => {
  if (pruebaActiva) return;
  iniciarPrueba();
});

function iniciarPrueba() {
  pruebaActiva = true;
  contactos = 0;
  tiempoEnErrorTotal = 0;
  instanteInicioContacto = null;
  metricaContactos.innerText = '0';
  metricaTiempoContacto.innerText = '0.0 s';
  btnIniciar.style.display = 'none';

  tiempoRestante = (modo === 'DEMO') ? 20 : 60;
  lblCrono.innerText = `${tiempoRestante} s`;
  panelEstado.innerText = (modo === 'DEMO') 
    ? 'Calibrando mandos... Conduce el puntero a la meta.' 
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

  // Actualizar posición del puntero
  posX += velX;
  posY += velY;

  // Limitar al lienzo
  posX = Math.max(radioPuntero + 2, Math.min(canvas.width - radioPuntero - 2, posX));
  posY = Math.max(radioPuntero + 2, Math.min(canvas.height - radioPuntero - 2, posY));

  // Detección de contacto con muros
  verificarColision();

  // Detección de meta
  const distMeta = Math.hypot(posX - circuitoActual.fin.x, posY - circuitoActual.fin.y);
  if (distMeta < 14) {
    finalizarPrueba('META_ALCANZADA');
    return;
  }

  redibujar();
  animacionFrame = requestAnimationFrame(bucleAnimacion);
}

function verificarColision() {
  // Simulación geométrica de pista: si se sale del canal permitido
  let enPista = false;
  // Margen de pista virtual simple
  if (circuitoActual.nombre.includes('Horquilla')) {
    if ((posY >= 30 && posY <= 70 && posX >= 30 && posX <= 290) ||
        (posX >= 250 && posX <= 290 && posY >= 50 && posY <= 160) ||
        (posY >= 120 && posY <= 160 && posX >= 120 && posX <= 270) ||
        (posX >= 120 && posX <= 160 && posY >= 120 && posY <= 160)) {
      enPista = true;
    }
  } else {
    // Tolerancia general
    enPista = (posX > 20 && posX < 320 && posY > 25 && posY < 195);
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

  // 1. Dibujar pista guía
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
  } else {
    ctx.moveTo(circuitoActual.inicio.x, circuitoActual.inicio.y);
    ctx.lineTo(circuitoActual.fin.x, circuitoActual.fin.y);
  }
  ctx.stroke();

  // Línea central fina
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();

  // 2. Meta
  ctx.beginPath();
  ctx.arc(circuitoActual.fin.x, circuitoActual.fin.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();

  // 3. Puntero
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

  // Cálculo de efectividad estandarizada en porcentaje (%)
  let porcentaje = Math.max(0, 100 - (contactos * 10));
  const aprobado = (contactos <= 3 && porcentaje >= 70);

  if (modo === 'DEMO') {
    localStorage.setItem('sensometrika_palancas_demo_ok', 'true');
    panelEstado.innerText = '¡Calibración lista! Mandos probados correctamente.';
    panelEstado.style.color = '#4ade80';

    zonaCoordinacion.innerHTML = `
      <div style="background:#0f172a; border:1.5px solid #0284c7; border-radius:12px; padding:16px; text-align:center; width:100%; margin-top:12px;">
        <h3 style="color:#38bdf8; margin:0 0 6px 0;">¡Calibración Finalizada!</h3>
        <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 14px 0;">Has comprobado el manejo de ambas palancas. Pasa a tu Simulación Oficial.</p>
        <button onclick="location.reload()" style="width:100%; height:46px; background:#22c55e; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:0.92rem; cursor:pointer;">
          Comenzar Simulación Oficial →
        </button>
      </div>
    `;
  } else {
    // Guardar métrica oficial para informe
    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: contactos,
      efectividad: porcentaje,
      porcentaje: porcentaje,
      tiempoError: Number(tiempoEnErrorTotal.toFixed(1)),
      aprobado: aprobado,
      fecha: new Date().toISOString()
    }));

    // DESCUENTO REAL Y PERSISTENTE EN EL MENÚ
    const ejecuciones = JSON.parse(localStorage.getItem('sensometrika_ejecuciones')) || {};
    const consumidas = (ejecuciones.palancas || 0) + 1;
    ejecuciones.palancas = consumidas;
    localStorage.setItem('sensometrika_ejecuciones', JSON.stringify(ejecuciones));

    const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
    const esFull = (sesion.planId && sesion.planId.includes('full'));
    const esPlus = (sesion.planId && sesion.planId.includes('plus'));
    const max = esFull ? 8 : (esPlus ? 5 : 3);
    const agotado = consumidas >= max;

    panelEstado.innerText = 'Evaluación Oficial de Palancas completada.';

    // BOTONES INFERIORES ERGONÓMICOS (SIN ALERTAS MOLESTAS)
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

        <!-- BOTONES INFERIORES CLAROS -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <a href="punteo.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:46px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:800; font-size:0.9rem; box-shadow:0 4px 12px rgba(2,132,199,0.35);">
            Continuar a Módulo 3 (Punteo) →
          </a>
          ${!agotado ? `
            <button onclick="location.reload()" style="width:100%; height:42px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">
              🔄 Repetir Simulación de Palancas (${consumidas + 1} de ${max})
            </button>
          ` : ''}
          <a href="menu.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:38px; background:transparent; color:#64748b; text-decoration:none; font-size:0.82rem; font-weight:600;">
            ← Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

// Control de mandos en pantalla táctil
function moverManoIzq(dir) {
  if (!pruebaActiva) return;
  velY = (dir === 'ARRIBA') ? -VELOCIDAD : (dir === 'ABAJO' ? VELOCIDAD : 0);
}
function frenarManoIzq() { velY = 0; }

function moverManoDer(dir) {
  if (!pruebaActiva) return;
  velX = (dir === 'IZQ') ? -VELOCIDAD : (dir === 'DER' ? VELOCIDAD : 0);
}
function frenarManoDer() { velX = 0; }

// Asignación de eventos de botones táctiles
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