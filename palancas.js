/* ==========================================================================
   SENSOMETRIKA - MÓDULO 2: TEST DE PALANCAS (palancas.js)
   • Conexión estricta con CreditManager (descuento en menu.html)
   • Bloqueo en puerta si el cupo está agotado
   • 1 Demo de Calibración (20 s) + N Simulaciones Oficiales (60 s) según plan
   • Banco de circuitos anti-memorización y física de colisión continua
   • Modal estandarizado de finalización con navegación modular e informe
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo') || document.getElementById('txt-modo-palancas');
const txtContactos = document.getElementById('txt-contactos') || document.getElementById('contador-toques') || document.getElementById('metrica-contactos');
const txtTiempo = document.getElementById('txt-tiempo') || document.getElementById('cronometro') || document.getElementById('cronometro-palancas');
const txtCircuito = document.getElementById('txt-circuito') || document.getElementById('metrica-circuito');
const txtInstruccion = document.getElementById('txt-instruccion') || document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar') || document.getElementById('btn-iniciar-palancas');
const zonaResultados = document.getElementById('zona-resultados') || document.getElementById('zona-coordinacion-palancas');
const seccionMandos = document.getElementById('seccion-mandos');

// Mandos táctiles
const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

// Modal de guía (si existe en el HTML)
const modalGuia = document.getElementById('modal-guia');
const btnAbrirAyuda = document.getElementById('btn-abrir-ayuda') || document.getElementById('btn-guia-modulo');
const btnCerrarAyuda = document.getElementById('btn-cerrar-ayuda') || document.getElementById('btn-cerrar-guia');
if (btnAbrirAyuda && modalGuia) btnAbrirAyuda.onclick = () => modalGuia.style.display = 'flex';
if (btnCerrarAyuda && modalGuia) btnCerrarAyuda.onclick = () => modalGuia.style.display = 'none';

// Variables de estado
let fase = 'DEMO'; // 'DEMO', 'ESPERA_OFICIAL', 'OFICIAL', 'FINALIZADO'
let activo = false;
let relojInterval = null;
let animFrame = null;

let tiempoRestante = 20;
let toques = 0;
let tiempoErrorMs = 0;
let instanteContacto = null;
let enError = false;

// Puntero electromecánico
let px = 45, py = 50;
const radioPuntero = 7.5;
const vel = 2.6;
const teclas = { arriba: false, abajo: false, izq: false, der: false };

// BANCO DE CIRCUITOS NORMATIVOS
const PISTA_DEMO = {
  nombre: "Trazado Inducción",
  inicio: { x: 50, y: 55 },
  meta: { x: 380, y: 185, r: 13 },
  ancho: 34,
  puntos: [
    { x: 50, y: 55 },
    { x: 320, y: 55 },
    { x: 320, y: 120 },
    { x: 100, y: 120 },
    { x: 100, y: 185 },
    { x: 380, y: 185 }
  ]
};

const BANCO_OFICIAL = [
  {
    nombre: "Trazado Escalera",
    inicio: { x: 50, y: 55 },
    meta: { x: 380, y: 190, r: 13 },
    ancho: 32,
    puntos: [
      { x: 50, y: 55 },
      { x: 180, y: 55 },
      { x: 180, y: 130 },
      { x: 280, y: 130 },
      { x: 280, y: 70 },
      { x: 380, y: 70 },
      { x: 380, y: 190 }
    ]
  },
  {
    nombre: "Trazado Bayoneta",
    inicio: { x: 50, y: 185 },
    meta: { x: 380, y: 55, r: 13 },
    ancho: 32,
    puntos: [
      { x: 50, y: 185 },
      { x: 160, y: 185 },
      { x: 160, y: 90 },
      { x: 280, y: 90 },
      { x: 280, y: 185 },
      { x: 380, y: 185 },
      { x: 380, y: 55 }
    ]
  },
  {
    nombre: "Trazado Zigzag",
    inicio: { x: 50, y: 55 },
    meta: { x: 60, y: 195, r: 13 },
    ancho: 32,
    puntos: [
      { x: 50, y: 55 },
      { x: 370, y: 55 },
      { x: 370, y: 125 },
      { x: 160, y: 125 },
      { x: 160, y: 195 },
      { x: 60, y: 195 }
    ]
  }
];

let circuitoActivo = PISTA_DEMO;

// Inicialización de la pantalla y verificación de cupos
window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');

    if (!CreditManager.puedeRendir('palancas')) {
      bloquearModuloPorCupo();
      return;
    }
    
    // Si ya completó el demo anteriormente, pasar directo a la simulación oficial
    if (CreditManager.demoYaRealizado && CreditManager.demoYaRealizado('palancas')) {
      prepararOficialDirecto();
      dibujar();
      return;
    }
  }

  prepararDemo();
  dibujar();
});

function bloquearModuloPorCupo() {
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;
  if (btnIniciar) {
    btnIniciar.disabled = true;
    btnIniciar.style.opacity = '0.4';
    btnIniciar.style.backgroundColor = '#475569';
    btnIniciar.innerText = `Cupo Bloqueado (${max}/${max})`;
  }
  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulaciones ${max} de ${max} (Cupo Agotado)`;
    badgeModo.style.color = '#f87171';
  }
  if (txtInstruccion) {
    txtInstruccion.innerText = `Has completado el límite de ${max} simulaciones para este módulo.`;
    txtInstruccion.style.color = '#f87171';
  }
  if (zonaResultados) {
    zonaResultados.innerHTML = `
      <div style="background:#0f172a; border:1px solid #ef4444; border-radius:8px; padding:14px; text-align:center; margin-top:10px;">
        <p style="color:#f87171; font-weight:bold; margin-bottom:8px;">Cupo total consumido</p>
        <a href="menu.html" style="display:inline-block; background:#0284c7; color:#ffffff; padding:8px 16px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:0.85rem;">
          Volver al Menú Principal
        </a>
      </div>
    `;
  }
}

function prepararDemo() {
  fase = 'DEMO';
  circuitoActivo = PISTA_DEMO;
  tiempoRestante = 20;
  toques = 0;
  tiempoErrorMs = 0;
  enError = false;
  px = circuitoActivo.inicio.x;
  py = circuitoActivo.inicio.y;

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica (Demo 20s)';
    badgeModo.style.color = '#facc15';
    badgeModo.style.background = 'rgba(250, 204, 21, 0.1)';
    badgeModo.style.borderColor = 'rgba(250, 204, 21, 0.25)';
  }

  if (txtContactos) txtContactos.innerText = '0';
  if (txtTiempo) txtTiempo.innerText = '20 s';
  if (txtCircuito) txtCircuito.innerText = circuitoActivo.nombre;
  if (txtInstruccion) {
    txtInstruccion.innerText = 'Calibrando: Conduce el punto a la meta verde sin tocar los bordes.';
    txtInstruccion.style.color = '#f8fafc';
  }

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.opacity = '1';
    btnIniciar.style.backgroundColor = '#0284c7';
    btnIniciar.innerText = 'Iniciar Calibración (20 s)';
  }
}

function prepararOficialDirecto() {
  fase = 'ESPERA_OFICIAL';
  const numSim = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const maxSim = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  circuitoActivo = BANCO_OFICIAL[(numSim - 1) % BANCO_OFICIAL.length];
  tiempoRestante = 60;
  toques = 0;
  tiempoErrorMs = 0;
  enError = false;
  px = circuitoActivo.inicio.x;
  py = circuitoActivo.inicio.y;

  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${numSim} de ${maxSim} (D.S. N° 170)`;
    badgeModo.style.color = '#38bdf8';
    badgeModo.style.background = 'rgba(56, 189, 248, 0.1)';
    badgeModo.style.borderColor = 'rgba(56, 189, 248, 0.25)';
  }

  if (txtContactos) txtContactos.innerText = '0';
  if (txtTiempo) txtTiempo.innerText = '60 s';
  if (txtCircuito) txtCircuito.innerText = circuitoActivo.nombre;
  if (txtInstruccion) {
    txtInstruccion.innerText = 'Evaluación Oficial: Recorre la pista hasta la meta verde.';
    txtInstruccion.style.color = '#f8fafc';
  }

  if (btnIniciar) {
    btnIniciar.style.display = 'block';
    btnIniciar.disabled = false;
    btnIniciar.style.opacity = '1';
    btnIniciar.style.backgroundColor = '#22c55e';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de ${maxSim})`;
  }
}

function iniciarOficial() {
  fase = 'OFICIAL';
  const numSim = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
  const maxSim = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;

  circuitoActivo = BANCO_OFICIAL[(numSim - 1) % BANCO_OFICIAL.length];
  tiempoRestante = 60;
  toques = 0;
  tiempoErrorMs = 0;
  enError = false;
  px = circuitoActivo.inicio.x;
  py = circuitoActivo.inicio.y;

  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación Oficial ${numSim} de ${maxSim} (D.S. N° 170)`;
    badgeModo.style.color = '#38bdf8';
  }

  if (txtContactos) txtContactos.innerText = '0';
  if (txtTiempo) txtTiempo.innerText = '60 s';
  if (txtCircuito) txtCircuito.innerText = circuitoActivo.nombre;
  if (txtInstruccion) {
    txtInstruccion.innerText = 'En curso: Mantén el punto dentro del canal.';
    txtInstruccion.style.color = '#38bdf8';
  }

  if (btnIniciar) btnIniciar.style.display = 'none';
  iniciarLoop();
}

if (btnIniciar) {
  btnIniciar.addEventListener('click', () => {
    if (fase === 'DEMO') {
      btnIniciar.style.display = 'none';
      iniciarLoop();
    } else if (fase === 'ESPERA_OFICIAL') {
      iniciarOficial();
    }
  });
}

function iniciarLoop() {
  activo = true;
  clearInterval(relojInterval);
  relojInterval = setInterval(() => {
    if (!activo) return;
    tiempoRestante--;
    if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      concluir(false);
    }
  }, 1000);

  cancelAnimationFrame(animFrame);
  bucleFisicas();
}

function bucleFisicas() {
  if (!activo) return;

  if (teclas.arriba) py -= vel;
  if (teclas.abajo) py += vel;
  if (teclas.izq) px -= vel;
  if (teclas.der) px += vel;

  px = Math.max(radioPuntero + 2, Math.min(canvas.width - radioPuntero - 2, px));
  py = Math.max(radioPuntero + 2, Math.min(canvas.height - radioPuntero - 2, py));

  evaluarColision();
  evaluarMeta();
  dibujar();

  animFrame = requestAnimationFrame(bucleFisicas);
}

function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }

  return Math.hypot(px - xx, py - yy);
}

function evaluarColision() {
  const pts = circuitoActivo.puntos;
  const radioCanal = circuitoActivo.ancho / 2;
  let minDist = Infinity;

  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanciaPuntoASegmento(px, py, pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    if (d < minDist) minDist = d;
  }

  const enContacto = (minDist + radioPuntero) >= radioCanal;
  const ahora = performance.now();

  if (enContacto) {
    if (!enError) {
      enError = true;
      toques++;
      if (txtContactos) txtContactos.innerText = toques;
      instanteContacto = ahora;
      if ('vibrate' in navigator) navigator.vibrate(35);
    } else {
      tiempoErrorMs += (ahora - instanteContacto);
      instanteContacto = ahora;
    }
  } else {
    if (enError) {
      tiempoErrorMs += (ahora - instanteContacto);
      enError = false;
      instanteContacto = null;
    }
  }
}

function evaluarMeta() {
  const meta = circuitoActivo.meta;
  const d = Math.hypot(px - meta.x, py - meta.y);
  if (d <= meta.r + 3) {
    concluir(true);
  }
}

function concluir(metaAlcanzada) {
  activo = false;
  clearInterval(relojInterval);
  cancelAnimationFrame(animFrame);

  if (enError && instanteContacto) {
    tiempoErrorMs += (performance.now() - instanteContacto);
    enError = false;
  }

  const segError = (tiempoErrorMs / 1000).toFixed(2);

  if (fase === 'DEMO') {
    if (typeof CreditManager !== 'undefined' && CreditManager.marcarDemoCompletado) {
      CreditManager.marcarDemoCompletado('palancas');
    }

    fase = 'ESPERA_OFICIAL';
    if (txtInstruccion) {
      txtInstruccion.innerText = `Calibración finalizada: ${toques} toques (${segError} s en borde).`;
      txtInstruccion.style.color = '#4ade80';
    }

    const numSim = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('palancas') : 1;
    const maxSim = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('palancas') : 3;

    if (btnIniciar) {
      btnIniciar.style.display = 'block';
      btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de ${maxSim})`;
      btnIniciar.style.backgroundColor = '#22c55e';
    }
  } else {
    fase = 'FINALIZADO';
    guardarResultadoOficial(metaAlcanzada, segError);
  }
}

function guardarResultadoOficial(metaAlcanzada, segError) {
  // REGISTRO DE CONSUMO CENTRAL (Descuenta en menu.html de inmediato)
  let consumidas = 1;
  let maxSim = 3;

  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('palancas');
    maxSim = CreditManager.obtenerLimiteModulo('palancas');
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'palancas');
  } else {
    // Fallback estándar si CreditManager no está presente
    let simRaw = parseInt(localStorage.getItem('simulaciones_palancas')) || 0;
    consumidas = simRaw + 1;
    localStorage.setItem('simulaciones_palancas', consumidas);
  }

  const tiempoUsado = 60 - Math.max(0, tiempoRestante);
  const penalizacionToques = toques * 8;
  const penalizacionTiempoError = Math.round(parseFloat(segError) * 3);
  const efectividad = Math.max(10, Math.min(100, 100 - penalizacionToques - penalizacionTiempoError));
  const aprobado = metaAlcanzada && toques <= 3 && parseFloat(segError) <= 2.5;

  // Persistencia de la última simulación
  localStorage.setItem('sensometrika_palancas', JSON.stringify({
    toques: toques,
    contactos: toques,
    tiempo: tiempoUsado,
    tiempoError: parseFloat(segError),
    porcentaje: efectividad,
    efectividad: efectividad,
    aprobado: aprobado,
    circuito: circuitoActivo.nombre,
    fecha: new Date().toISOString()
  }));

  // Historial acumulado para informe.html
  let historial = [];
  try {
    const rawHist = localStorage.getItem('sensometrika_historial_palancas');
    historial = rawHist ? JSON.parse(rawHist) : [];
  } catch (e) {
    historial = [];
  }

  historial.push({
    simulacion: consumidas,
    toques: toques,
    tiempo: tiempoUsado,
    tiempoError: parseFloat(segError),
    efectividad: efectividad,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  });
  localStorage.setItem('sensometrika_historial_palancas', JSON.stringify(historial));

  const bloqueado = consumidas >= maxSim;
  if (seccionMandos) seccionMandos.style.display = 'none';

  if (txtInstruccion) {
    txtInstruccion.innerText = aprobado ? '¡Simulación Aprobada!' : 'Evaluación Fuera de Estándar D.S. 170';
    txtInstruccion.style.color = aprobado ? '#4ade80' : '#f87171';
  }

  // =========================================================================
  // MODAL FLOTANTE MEJORADO CON NAVEGACIÓN MODULAR Y ACCESO A INFORME
  // =========================================================================
  const modalExistente = document.getElementById('modal-resultado-palancas');
  if (modalExistente) modalExistente.remove();

  const modalHtml = `
    <div id="modal-resultado-palancas" style="position: fixed; inset: 0; background: rgba(5, 8, 18, 0.88); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; width: 100%; max-width: 380px; padding: 24px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); color: #f8fafc;">
        
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 700;">Simulación Finalizada</h3>
        <p style="color: #38bdf8; margin: 0 0 16px 0; font-size: 0.85rem; font-weight: 500;">
          Simulación ${consumidas} de ${maxSim}
        </p>

        <div style="margin-bottom: 18px;">
          <span style="display: inline-block; padding: 4px 18px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; background: ${aprobado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${aprobado ? '#10b981' : '#ef4444'}; color: ${aprobado ? '#34d399' : '#f87171'};">
            ${aprobado ? 'APROBADO' : 'OBSERVADO'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #090e1a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 12px; margin-bottom: 20px; text-align: left;">
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Contactos</span>
            <strong style="color: #f1f5f9; font-size: 0.95rem;">${toques}</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Tiempo en Borde</span>
            <strong style="color: #f1f5f9; font-size: 0.95rem;">${segError} s</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Efectividad</span>
            <strong style="color: #38bdf8; font-size: 0.95rem;">${efectividad}%</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Modo Evaluado</span>
            <strong style="color: #f1f5f9; font-size: 0.8rem;">B2C PARTICULAR</strong>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${!bloqueado ? `
            <button onclick="location.reload()" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
              Iniciar Calibración (${consumidas + 1}/${maxSim})
            </button>
          ` : `
            <button onclick="window.location.href='punteo.html'" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
              Completado · Ir a Punteo →
            </button>
          `}

          ${!bloqueado ? `
            <button onclick="window.location.href='punteo.html'" style="width: 100%; background: transparent; color: #38bdf8; border: 1px solid #0284c7; border-radius: 10px; padding: 10px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
              Pasar al Siguiente Módulo (Punteo) →
            </button>
          ` : ''}

          <div style="margin: 2px 0;">
            <button onclick="window.location.href='informe.html'" style="background: transparent; color: #38bdf8; border: none; cursor: pointer; font-size: 0.8rem; text-decoration: underline; padding: 4px;">
              Ver Informe en Pantalla
            </button>
          </div>

          <button onclick="window.location.href='menu.html'" style="width: 100%; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 10px; padding: 10px; font-weight: 500; cursor: pointer; font-size: 0.85rem;">
            Volver al Menú Principal
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Renderizado gráfico en Canvas
function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cuadrícula técnica sutil
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < canvas.width; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  const pts = circuitoActivo.puntos;

  // Canal exterior neón
  ctx.strokeStyle = enError ? '#ef4444' : '#0284c7';
  ctx.lineWidth = circuitoActivo.ancho + 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Interior de la pista
  ctx.strokeStyle = '#090e1c';
  ctx.lineWidth = circuitoActivo.ancho - 2;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  // Eje central punteado
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Meta verde
  const meta = circuitoActivo.meta;
  ctx.beginPath();
  ctx.arc(meta.x, meta.y, meta.r, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Puntero
  ctx.beginPath();
  ctx.arc(px, py, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = enError ? '#ef4444' : '#facc15';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Vinculación de mandos táctiles en pantalla
function enlazar(btn, dir) {
  if (!btn) return;
  const on = (e) => { e.preventDefault(); teclas[dir] = true; };
  const off = (e) => { e.preventDefault(); teclas[dir] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
}

enlazar(btnArriba, 'arriba');
enlazar(btnAbajo, 'abajo');
enlazar(btnIzq, 'izq');
enlazar(btnDer, 'der');

// Soporte de Teclado (Flechas y WASD)
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); teclas.arriba = true; }
  if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); teclas.abajo = true; }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); teclas.izq = true; }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); teclas.der = true; }
});

window.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'w', 'W'].includes(e.key)) teclas.arriba = false;
  if (['ArrowDown', 's', 'S'].includes(e.key)) teclas.abajo = false;
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) teclas.izq = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) teclas.der = false;
});