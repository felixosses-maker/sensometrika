/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Respuesta inmediata de mandos táctiles (Sin trabas ni bloqueos)
   • Bucle continuo de movimiento a 60 FPS
   • Soporte dual: Táctil móvil y Teclas PC (WASD / Flechas)
   • Sincronización con CreditManager
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');

const btnIniciar = document.getElementById('btn-iniciar-palancas');
const badgeModo = document.getElementById('badge-modo-palancas');
const txtTiempo = document.getElementById('txt-tiempo-palancas');
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

// Puntero y velocidad
let posX = 45;
let posY = 55;
const radioPuntero = 8;
const VELOCIDAD = 2.4;

// Estado de botones presionados
const teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };

// Banco de trazados limpios y continuos
const CIRCUITOS = [
  {
    nombre: 'Circuito 1 (Horquilla)',
    inicio: { x: 45, y: 55 },
    meta: { x: 160, y: 140, r: 12 },
    tramos: [
      { x1: 30, y1: 55, x2: 275, y2: 55 },
      { x1: 275, y1: 55, x2: 275, y2: 140 },
      { x1: 275, y1: 140, x2: 160, y2: 140 }
    ]
  },
  {
    nombre: 'Circuito 2 (Bayoneta)',
    inicio: { x: 45, y: 45 },
    meta: { x: 275, y: 155, r: 12 },
    tramos: [
      { x1: 30, y1: 45, x2: 160, y2: 45 },
      { x1: 160, y1: 45, x2: 160, y2: 155 },
      { x1: 160, y1: 155, x2: 275, y2: 155 }
    ]
  },
  {
    nombre: 'Circuito 3 (Zigzag)',
    inicio: { x: 45, y: 155 },
    meta: { x: 275, y: 45, r: 12 },
    tramos: [
      { x1: 30, y1: 155, x2: 160, y2: 155 },
      { x1: 160, y1: 155, x2: 160, y2: 45 },
      { x1: 160, y1: 45, x2: 275, y2: 45 }
    ]
  }
];
let circuitoActual = CIRCUITOS[0];
const anchoCanal = 32;

window.addEventListener('DOMContentLoaded', () => {
  // 1. Validar acceso con CreditManager si existe
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.validarAccesoOBloquear('palancas')) return;
    if (CreditManager.demoYaRealizado('palancas')) {
      prepararFaseOficial();
    } else {
      configurarFaseDemo();
    }
  } else {
    configurarFaseDemo();
  }

  redibujar();
  iniciarBucleFisica();
});

function configurarFaseDemo() {
  modo = 'DEMO';
  circuitoActual = CIRCUITOS[0];
  posX = circuitoActual.inicio.x;
  posY = circuitoActual.inicio.y;
  tiempoRestante = 20;

  if (metricaCircuito) metricaCircuito.innerText = 'Calibración A';
  if (badgeModo) badgeModo.innerText = '🟡 Calibración Técnica (Demo 20 s)';
  if (txtTiempo) txtTiempo.innerText = 'Fase de Inducción (20 s)';
  if (btnIniciar) {
    btnIniciar.innerText = 'Iniciar Calibración Guiada';
    btnIniciar.style.backgroundColor = '#0284c7';
    btnIniciar.style.display = 'block';
  }
  if (panelEstado) {
    panelEstado.innerText = 'Toca los botones o pulsa Iniciar para moverte hacia la meta verde.';
    panelEstado.style.color = '#38bdf8';
  }
}

function prepararFaseOficial() {
  modo = 'OFICIAL';
  pruebaActiva = false;
  clearInterval(temporizadorPrueba);

  let consumidas = 0, max = 8, actual = 1;
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.obtenerConsumidas('palancas');
    max = CreditManager.obtenerLimiteModulo('palancas');
    actual = CreditManager.obtenerNumeroSimulacionActual('palancas');
  }

  // Rotar pista
  circuitoActual = CIRCUITOS[consumidas % CIRCUITOS.length];
  posX = circuitoActual.inicio.x;
  posY = circuitoActual.inicio.y;
  tiempoRestante = 60;

  if (metricaCircuito) metricaCircuito.innerText = circuitoActual.nombre;
  if (badgeModo) badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max}`;
  if (txtTiempo) txtTiempo.innerText = 'Evaluación Activa (60 s)';
  if (panelEstado) {
    panelEstado.innerText = `Listo para Simulación Oficial ${actual} de ${max}. Mantén el puntero en la pista.`;
    panelEstado.style.color = '#38bdf8';
  }
  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.innerText = `Comenzar Simulación (${actual} de ${max})`;
    btnIniciar.style.backgroundColor = '#22c55e';
  }

  resetearMetricas();
  redibujar();
}

function resetearMetricas() {
  contactos = 0;
  tiempoEnErrorTotal = 0;
  instanteInicioContacto = null;
  if (metricaContactos) metricaContactos.innerText = '0';
  if (metricaTiempoContacto) metricaTiempoContacto.innerText = '0.0 s';
}

if (btnIniciar) {
  btnIniciar.addEventListener('click', () => {
    arrancarEvaluacion();
  });
}

function arrancarEvaluacion() {
  if (pruebaActiva) return;
  pruebaActiva = true;
  resetearMetricas();
  if (btnIniciar) btnIniciar.style.display = 'none';

  tiempoRestante = (modo === 'DEMO') ? 20 : 60;
  if (panelEstado) {
    panelEstado.innerText = (modo === 'DEMO') 
      ? 'Fase Demo: Calibra ambas manos hacia la meta verde.' 
      : 'Evaluación Oficial en curso: Conduce sin tocar los bordes.';
    panelEstado.style.color = '#4ade80';
  }

  clearInterval(temporizadorPrueba);
  temporizadorPrueba = setInterval(() => {
    tiempoRestante--;
    if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s restantes`;

    if (tiempoRestante <= 0) {
      finalizarPrueba(false);
    }
  }, 1000);
}

// Bucle continuo de movimiento a 60 cuadros por segundo
function iniciarBucleFisica() {
  function loop() {
    // Si se presiona algún mando y aún no se presionó el botón grande, se auto-activa
    if (!pruebaActiva && (teclas.arriba || teclas.abajo || teclas.izquierda || teclas.derecha)) {
      arrancarEvaluacion();
    }

    if (pruebaActiva) {
      if (teclas.arriba) posY -= VELOCIDAD;
      if (teclas.abajo) posY += VELOCIDAD;
      if (teclas.izquierda) posX -= VELOCIDAD;
      if (teclas.derecha) posX += VELOCIDAD;

      // Límites del canvas
      posX = Math.max(radioPuntero + 4, Math.min(canvas.width - radioPuntero - 4, posX));
      posY = Math.max(radioPuntero + 4, Math.min(canvas.height - radioPuntero - 4, posY));

      verificarPistaYColision();

      // Comprobar llegada a meta
      const distMeta = Math.hypot(posX - circuitoActual.meta.x, posY - circuitoActual.meta.y);
      if (distMeta < (circuitoActual.meta.r + radioPuntero)) {
        finalizarPrueba(true);
      }
    }

    redibujar();
    animacionFrame = requestAnimationFrame(loop);
  }
  loop();
}

function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function verificarPistaYColision() {
  let dentro = false;
  for (let seg of circuitoActual.tramos) {
    const d = distanciaPuntoASegmento(posX, posY, seg.x1, seg.y1, seg.x2, seg.y2);
    if (d <= anchoCanal / 2) {
      dentro = true;
      break;
    }
  }

  const enColision = !dentro;
  const ahora = performance.now();

  if (enColision) {
    if (!instanteInicioContacto) {
      instanteInicioContacto = ahora;
      contactos++;
      if (metricaContactos) metricaContactos.innerText = contactos;
      if ('vibrate' in navigator) navigator.vibrate(40);
    }
    const delta = (ahora - instanteInicioContacto) / 1000;
    if (metricaTiempoContacto) metricaTiempoContacto.innerText = `${(tiempoEnErrorTotal + delta).toFixed(1)} s`;
  } else {
    if (instanteInicioContacto) {
      tiempoEnErrorTotal += (ahora - instanteInicioContacto) / 1000;
      instanteInicioContacto = null;
      if (metricaTiempoContacto) metricaTiempoContacto.innerText = `${tiempoEnErrorTotal.toFixed(1)} s`;
    }
  }
}

function redibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pista continua
  ctx.lineWidth = anchoCanal;
  ctx.strokeStyle = '#0284c7';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  circuitoActual.tramos.forEach((seg, i) => {
    if (i === 0) ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
  });
  ctx.stroke();

  // Canal interno oscuro
  ctx.lineWidth = anchoCanal - 6;
  ctx.strokeStyle = '#090d16';
  ctx.stroke();

  // Meta verde
  ctx.beginPath();
  ctx.arc(circuitoActual.meta.x, circuitoActual.meta.y, circuitoActual.meta.r, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#86efac';
  ctx.stroke();

  // Puntero del usuario
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = instanteInicioContacto ? '#ef4444' : '#facc15';
  ctx.shadowColor = instanteInicioContacto ? '#ef4444' : '#facc15';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function finalizarPrueba(llegoAMeta) {
  pruebaActiva = false;
  clearInterval(temporizadorPrueba);

  // Detener movimiento de teclas
  teclas.arriba = false;
  teclas.abajo = false;
  teclas.izquierda = false;
  teclas.derecha = false;

  if (instanteInicioContacto) {
    tiempoEnErrorTotal += (performance.now() - instanteInicioContacto) / 1000;
    instanteInicioContacto = null;
  }

  if (modo === 'DEMO') {
    if (typeof CreditManager !== 'undefined') {
      CreditManager.marcarDemoCompletado('palancas');
    }

    if (panelEstado) {
      panelEstado.innerText = '¡Calibración superada! Mandos listos para evaluación.';
      panelEstado.style.color = '#4ade80';
    }

    if (zonaCoordinacion) {
      zonaCoordinacion.innerHTML = `
        <div style="background:#0f172a; border:1.5px solid #0284c7; border-radius:12px; padding:14px; text-align:center; width:100%; box-sizing:border-box;">
          <h3 style="color:#38bdf8; margin:0 0 6px 0; font-size:1.05rem;">¡Calibración Lista!</h3>
          <p style="color:#94a3b8; font-size:0.8rem; margin:0 0 12px 0;">Mandos comprobados. Ahora inicia tu Simulación Oficial.</p>
          <button type="button" onclick="pasarDirectoAOficial()" style="width:100%; height:46px; background:#22c55e; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:0.92rem; cursor:pointer;">
            Comenzar Simulación Oficial →
          </button>
        </div>
      `;
    }
  } else {
    // Fase Oficial
    const porcentaje = Math.max(0, 100 - (contactos * 10));
    const aprobado = (contactos <= 3 && porcentaje >= 70);

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: contactos,
      contactos: contactos,
      efectividad: porcentaje,
      porcentaje: porcentaje,
      tiempoError: Number(tiempoEnErrorTotal.toFixed(1)),
      aprobado: aprobado,
      circuito: circuitoActual.nombre,
      fecha: new Date().toISOString()
    }));

    let consumidas = 1, max = 8;
    if (typeof CreditManager !== 'undefined') {
      consumidas = CreditManager.registrarConsumo('palancas');
      max = CreditManager.obtenerLimiteModulo('palancas');
    }
    const agotado = consumidas >= max;

    if (panelEstado) {
      panelEstado.innerText = 'Evaluación Oficial completada.';
      panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';
    }

    if (zonaCoordinacion) {
      zonaCoordinacion.innerHTML = `
        <div style="background:#0f172a; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:14px; padding:16px; text-align:center; width:100%; box-sizing:border-box;">
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
            <a href="punteo.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:46px; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:800; font-size:0.9rem;">
              Continuar a Módulo 3 (Punteo) →
            </a>
            ${!agotado ? `
              <button type="button" onclick="pasarDirectoAOficial()" style="width:100%; height:42px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                🔄 Rendir Simulación (${consumidas + 1} de ${max})
              </button>
            ` : ''}
            <a href="menu.html" style="display:flex; align-items:center; justify-content:center; width:100%; height:36px; background:transparent; color:#64748b; text-decoration:none; font-size:0.82rem;">
              ← Volver al Menú Principal
            </a>
          </div>
        </div>
      `;
    }
  }
}

window.pasarDirectoAOficial = function() {
  if (zonaCoordinacion) zonaCoordinacion.innerHTML = '';
  prepararFaseOficial();
};

// VINCULACIÓN ULTRA-SENSIBLE DE BOTONES TÁCTILES
function vincularMando(id, dir) {
  const btn = document.getElementById(id);
  if (!btn) return;

  const activar = (e) => {
    e.preventDefault();
    teclas[dir] = true;
    btn.classList.add('activo');
  };

  const desactivar = (e) => {
    e.preventDefault();
    teclas[dir] = false;
    btn.classList.remove('activo');
  };

  // Eventos Pointer para soporte unificado táctil y ratón
  btn.addEventListener('pointerdown', activar);
  btn.addEventListener('pointerup', desactivar);
  btn.addEventListener('pointercancel', desactivar);
  btn.addEventListener('pointerleave', desactivar);
}

vincularMando('btn-izq-arriba', 'arriba');
vincularMando('btn-izq-abajo', 'abajo');
vincularMando('btn-der-izq', 'izquierda');
vincularMando('btn-der-der', 'derecha');

// Soporte teclado PC
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