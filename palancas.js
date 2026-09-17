/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: COORDINACIÓN BIMANUAL (palancas.js)
   • Bloqueo estricto e instantáneo al agotar cupo (puerta de entrada)
   • Calibración Demo obligatoria (20s) y Evaluación Oficial (60s, D.S. N° 170)
   • Variación de circuitos por simulación sin mecanización
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas ? canvas.getContext('2d') : null;

const badgeModo = document.getElementById('badge-modo-palancas') || document.querySelector('.badge-modo');
const panelEstado = document.getElementById('panel-estado');
const txtTiempo = document.getElementById('metrica-tiempo-palancas') || document.getElementById('metrica-tiempo');
const txtContactos = document.getElementById('metrica-contactos-palancas') || document.getElementById('metrica-contactos');
const txtCircuito = document.getElementById('metrica-circuito');
const btnIniciar = document.getElementById('btn-iniciar-palancas') || document.getElementById('btn-iniciar');
const zonaControles = document.getElementById('zona-coordinacion-palancas') || document.querySelector('.zona-controles');

// Mandos
const btnArr = document.getElementById('btn-arriba');
const btnAba = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let simulando = false;
let animacionId = null;
let temporizador = null;

let tiempoRestante = 20;
let tiempoTotal = 20;
let toques = 0;
let toquesEnDemora = 0;
let contactoActivo = false;

// Estado del puntero
let posX = 0;
let posY = 0;
const radioPuntero = 8;
const velocidad = 2.4;

let teclas = { arriba: false, abajo: false, izq: false, der: false };

// Definición de circuitos
const circuitos = [
  {
    nombre: 'Trazado 1',
    anchoPista: 26,
    meta: { x: 340, y: 220, r: 14 },
    trazarRuta: function(c) {
      c.beginPath();
      c.moveTo(50, 45);
      c.lineTo(260, 45);
      c.lineTo(260, 115);
      c.lineTo(80, 115);
      c.lineTo(80, 220);
      c.lineTo(340, 220);
      c.stroke();
    },
    inicio: { x: 50, y: 45 }
  },
  {
    nombre: 'Trazado 2',
    anchoPista: 26,
    meta: { x: 330, y: 210, r: 14 },
    trazarRuta: function(c) {
      c.beginPath();
      c.moveTo(50, 45);
      c.lineTo(130, 45);
      c.lineTo(130, 210);
      c.lineTo(230, 210);
      c.lineTo(230, 45);
      c.lineTo(330, 45);
      c.lineTo(330, 210);
      c.stroke();
    },
    inicio: { x: 50, y: 45 }
  },
  {
    nombre: 'Trazado 3',
    anchoPista: 26,
    meta: { x: 340, y: 45, r: 14 },
    trazarRuta: function(c) {
      c.beginPath();
      c.moveTo(50, 220);
      c.lineTo(180, 220);
      c.lineTo(180, 120);
      c.lineTo(60, 120);
      c.lineTo(60, 45);
      c.lineTo(340, 45);
      c.stroke();
    },
    inicio: { x: 50, y: 220 }
  }
];

let circuitoActual = circuitos[0];

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');

    // BARRERA DE ENTRADA INMEDIATA: Bloqueo estricto
    if (!CreditManager.puedeRendir('palancas')) {
      bloquearModuloPorCupo();
      return;
    }

    if (CreditManager.demoYaRealizado('palancas')) {
      prepararVistaOficial();
      return;
    }
  }

  prepararVistaDemo();
});

function bloquearModuloPorCupo() {
  simulando = false;
  cancelAnimationFrame(animacionId);
  clearInterval(temporizador);

  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  if (btnIniciar) {
    btnIniciar.disabled = true;
    btnIniciar.style.opacity = '0.4';
    btnIniciar.style.backgroundColor = '#475569';
    btnIniciar.innerText = `Cupo Bloqueado (${max}/${max} Realizadas)`;
  }
  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${max} de ${max} (Bloqueado)`;
    badgeModo.style.color = '#f87171';
  }
  if (panelEstado) {
    panelEstado.innerText = `Has completado el límite de ${max} simulaciones para este módulo.`;
    panelEstado.style.color = '#f87171';
  }

  deshabilitarControles();

  // Reemplazo del área de acción por bloqueo inmediato
  const areaBloqueo = zonaControles || panelEstado;
  if (areaBloqueo) {
    areaBloqueo.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 18px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: #ef4444; margin: 0 0 6px 0; font-size: 1.1rem;">Módulo Palancas Bloqueado (${max}/${max})</h3>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 14px;">Completaste todas las simulaciones de tu Plan en este módulo.</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <a href="punteo.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:0.9rem;">
            Continuar a Módulo 3 (Punteo) →
          </a>
          <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

function prepararVistaDemo() {
  modo = 'DEMO';
  tiempoRestante = 20;
  tiempoTotal = 20;
  toques = 0;
  circuitoActual = circuitos[0];

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica (Demo 20 s)';
    badgeModo.style.color = '#facc15';
  }
  if (panelEstado) {
    panelEstado.innerText = 'Calibrando: Conduce el punto a la meta verde.';
    panelEstado.style.color = '#4ade80';
  }
  if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;
  if (txtContactos) txtContactos.innerText = `${toques}`;
  if (txtCircuito) txtCircuito.innerText = circuitoActual.nombre;

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.opacity = '1';
    btnIniciar.innerText = 'Iniciar Calibración (20 s)';
    btnIniciar.style.backgroundColor = '#0284c7';
  }

  inicializarCanvas();
}

function prepararVistaOficial() {
  modo = 'OFICIAL';
  tiempoRestante = 60;
  tiempoTotal = 60;
  toques = 0;

  const actual = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  // Selección rotativa de trazado
  circuitoActual = circuitos[(actual - 1) % circuitos.length];

  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max}`;
    badgeModo.style.color = '#38bdf8';
  }
  if (panelEstado) {
    panelEstado.innerText = 'Evaluación oficial: Conduce sin tocar los bordes.';
    panelEstado.style.color = '#38bdf8';
  }
  if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;
  if (txtContactos) txtContactos.innerText = `${toques}`;
  if (txtCircuito) txtCircuito.innerText = circuitoActual.nombre;

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.opacity = '1';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnIniciar.style.backgroundColor = '#22c55e';
  }

  inicializarCanvas();
}

function inicializarCanvas() {
  if (!canvas || !ctx) return;
  posX = circuitoActual.inicio.x;
  posY = circuitoActual.inicio.y;
  dibujarEscenario();
}

function dibujarEscenario() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cuadrícula de fondo
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 25) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 25) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Pista de neón
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = circuitoActual.anchoPista;
  ctx.strokeStyle = '#0284c7';
  circuitoActual.trazarRuta(ctx);

  // Carril central
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e1b4b';
  ctx.setLineDash([4, 4]);
  circuitoActual.trazarRuta(ctx);
  ctx.setLineDash([]);

  // Meta
  ctx.beginPath();
  ctx.arc(circuitoActual.meta.x, circuitoActual.meta.y, circuitoActual.meta.r, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Puntero
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = contactoActivo ? '#ef4444' : '#f59e0b';
  ctx.shadowColor = contactoActivo ? '#ef4444' : '#f59e0b';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

if (btnIniciar) {
  btnIniciar.addEventListener('click', () => {
    if (simulando) return;
    comenzarPrueba();
  });
}

function comenzarPrueba() {
  simulando = true;
  btnIniciar.style.display = 'none';
  toques = 0;
  toquesEnDemora = 0;
  contactoActivo = false;

  habilitarControles();

  temporizador = setInterval(() => {
    tiempoRestante--;
    if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      clearInterval(temporizador);
      finalizarPrueba(false);
    }
  }, 1000);

  bucleAnimacion();
}

function bucleAnimacion() {
  if (!simulando) return;

  actualizarPosicion();
  verificarColision();
  verificarMeta();
  dibujarEscenario();

  animacionId = requestAnimationFrame(bucleAnimacion);
}

function actualizarPosicion() {
  if (teclas.arriba) posY -= velocidad;
  if (teclas.abajo) posY += velocidad;
  if (teclas.izq) posX -= velocidad;
  if (teclas.der) posX += velocidad;

  // Límites del canvas
  posX = Math.max(radioPuntero, Math.min(canvas.width - radioPuntero, posX));
  posY = Math.max(radioPuntero, Math.min(canvas.height - radioPuntero, posY));
}

function verificarColision() {
  if (!ctx) return;
  // Detección de contacto con los bordes (pixel fuera de ruta azul/carril)
  const pixel = ctx.getImageData(Math.round(posX), Math.round(posY), 1, 1).data;
  const esPista = (pixel[0] === 2 && pixel[1] === 132 && pixel[2] === 199) || 
                  (pixel[0] === 30 && pixel[1] === 27 && pixel[2] === 75) ||
                  (pixel[0] === 34 && pixel[1] === 197 && pixel[2] === 94);

  if (!esPista) {
    if (!contactoActivo) {
      contactoActivo = true;
      toques++;
      if (txtContactos) txtContactos.innerText = `${toques}`;
      if ('vibrate' in navigator) navigator.vibrate(50);
    }
    toquesEnDemora += 0.016;
  } else {
    contactoActivo = false;
  }
}

function verificarMeta() {
  const dx = posX - circuitoActual.meta.x;
  const dy = posY - circuitoActual.meta.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < circuitoActual.meta.r) {
    clearInterval(temporizador);
    finalizarPrueba(true);
  }
}

function finalizarPrueba(metaAlcanzada) {
  simulando = false;
  cancelAnimationFrame(animacionId);
  deshabilitarControles();

  const tiempoUsado = tiempoTotal - tiempoRestante;

  if (modo === 'DEMO') {
    if (typeof CreditManager !== 'undefined') {
      CreditManager.marcarDemoCompletado('palancas');
    }
    if (panelEstado) {
      panelEstado.innerText = 'Calibración concluida. Prepárate para la Simulación Oficial.';
      panelEstado.style.color = '#4ade80';
    }
    prepararVistaOficial();
    return;
  }

  // FASE OFICIAL
  let consumidas = 1;
  let max = 3;
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('palancas');
    max = CreditManager.obtenerLimiteModulo('palancas');
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
  }

  const aprobado = metaAlcanzada && toques <= 3;
  const precision = Math.max(0, Math.round(100 - (toques * 10)));

  localStorage.setItem('sensometrika_palancas', JSON.stringify({
    toques: toques,
    tiempoUsado: tiempoUsado,
    meta: metaAlcanzada,
    precision: precision,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  const bloqueado = consumidas >= max;
  const punteoTieneCupo = (typeof CreditManager !== 'undefined') ? CreditManager.puedeRendir('punteo') : false;

  let enlaceSiguiente = '';
  if (punteoTieneCupo) {
    enlaceSiguiente = `
      <a href="punteo.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:42px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
        Continuar a Módulo 3 (Punteo) →
      </a>
    `;
  } else {
    enlaceSiguiente = `
      <a href="menu.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:42px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
        Ver Menú Principal e Informe →
      </a>
    `;
  }

  const contenedor = zonaControles || panelEstado;
  contenedor.innerHTML = `
    <div style="background: #020617; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 18px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 8px;">
        Precisión: <strong style="color: #fff;">${precision}%</strong> (${toques} contactos en ${tiempoUsado} s)
      </p>
      <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
        ${bloqueado ? `Has completado tus ${max}/${max} simulaciones en este módulo.` : `Te restan ${max - consumidas} simulación(es) en este módulo.`}
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${!bloqueado ? `
          <button onclick="location.reload()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max} →
          </button>
        ` : ''}
        ${enlaceSiguiente}
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}

// Control de pulsadores táctiles
function configurarBoton(elemento, direccion) {
  if (!elemento) return;
  const activar = (e) => { e.preventDefault(); if (simulando) teclas[direccion] = true; };
  const desactivar = (e) => { e.preventDefault(); teclas[direccion] = false; };

  elemento.addEventListener('pointerdown', activar);
  elemento.addEventListener('pointerup', desactivar);
  elemento.addEventListener('pointerleave', desactivar);
  elemento.addEventListener('pointercancel', desactivar);
}

configurarBoton(btnArr, 'arriba');
configurarBoton(btnAba, 'abajo');
configurarBoton(btnIzq, 'izq');
configurarBoton(btnDer, 'der');

function habilitarControles() {
  [btnArr, btnAba, btnIzq, btnDer].forEach(b => { if (b) b.disabled = false; });
}

function deshabilitarControles() {
  teclas = { arriba: false, abajo: false, izq: false, der: false };
  [btnArr, btnAba, btnIzq, btnDer].forEach(b => { if (b) b.disabled = true; });
}