/* ==========================================================================
   SENSOMETRIKA - MÓDULO 3: TEST DE PUNTEO LAHY (punteo.js)
   • Detección geométrica calibrada para impacto certero (Aciertos y Errores)
   • Conteo estricto de dianas acertadas, omisiones al cruzar y toques en falso
   • Demo 15s -> Evaluación Oficial 30s
   • Integración y descuento con CreditManager
   • Modal flotante estandarizado con navegación modular y acceso a informe
   ========================================================================== */

const canvas = document.getElementById('lienzo-punteo');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo-punteo');
const txtPlacaModo = document.getElementById('txt-placa-modo');
const txtPlacaSub = document.getElementById('txt-placa-sub');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion-punteo');
const zonaCoordinacion = document.getElementById('zona-coordinacion-punteo');

const metricaAciertos = document.getElementById('metrica-aciertos');
const metricaErrores = document.getElementById('metrica-errores');
const metricaEfectividad = document.getElementById('metrica-efectividad');

// Modal de guía
const modalGuia = document.getElementById('modal-guia');
const btnAbrirAyuda = document.getElementById('btn-abrir-ayuda');
const btnCerrarAyuda = document.getElementById('btn-cerrar-ayuda');

if (btnAbrirAyuda) btnAbrirAyuda.onclick = () => modalGuia.style.display = 'flex';
if (btnCerrarAyuda) btnCerrarAyuda.onclick = () => modalGuia.style.display = 'none';

// Parámetros de la franja dorada (Zona de acierto reglamentaria)
const FRANJA = {
  y: 110,
  h: 46
};

// 4 Carriles equidistantes
const CARRILES = [60, 130, 210, 280];

let fase = 'DEMO'; // 'DEMO', 'PAUSA_OFICIAL', 'OFICIAL', 'FINALIZADO'
let enEjecucion = false;
let relojInterval = null;
let animacionFrame = null;

let tiempoRestante = 15;
let aciertos = 0;
let errores = 0;
let circulos = [];
let ultimoSpawn = 0;
const cadenciaSpawn = 650; // Cadencia de aparición

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.puedeRendir('punteo')) {
      bloquearModuloPorCupo();
      return;
    }
  }

  configurarDemo();
  dibujarEscena();
});

function bloquearModuloPorCupo() {
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('punteo') : 8;
  badgeModo.innerText = `Cupo Agotado (${max} de ${max})`;
  badgeModo.style.color = '#f87171';
  btnAccion.disabled = true;
  btnAccion.style.opacity = '0.35';
  btnAccion.innerText = `Cupo Bloqueado (${max}/${max})`;
  panelEstado.innerText = `Has completado el límite de ${max} simulaciones autorizadas para este módulo.`;
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1px solid #ef4444; border-radius:10px; padding:14px; text-align:center; margin-top:8px;">
      <a href="menu.html" style="color:#38bdf8; text-decoration:none; font-weight:bold;">Volver al Menú Principal</a>
    </div>
  `;
}

function configurarDemo() {
  fase = 'DEMO';
  tiempoRestante = 15;
  aciertos = 0;
  errores = 0;
  circulos = [];

  badgeModo.innerText = '🟡 Calibración Rítmica (Demo 15s)';
  badgeModo.style.color = '#facc15';
  badgeModo.style.background = 'rgba(250, 204, 21, 0.1)';
  badgeModo.style.borderColor = 'rgba(250, 204, 21, 0.25)';

  txtPlacaModo.innerText = '🟡 Calibración Rítmica';
  txtPlacaModo.style.color = '#facc15';
  txtPlacaSub.innerText = 'Fase de Inducción (15 s)';

  panelEstado.innerText = 'Presiona el botón para habituarte al ritmo del tambor.';
  panelEstado.style.color = '#94a3b8';

  btnAccion.style.display = 'block';
  btnAccion.style.backgroundColor = '#0284c7';
  btnAccion.innerText = 'Iniciar Calibración (15 s)';

  actualizarTableroMetricas();
}

function configurarOficial() {
  fase = 'OFICIAL';
  tiempoRestante = 30;
  aciertos = 0;
  errores = 0;
  circulos = [];

  const num = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('punteo') : 1;
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('punteo') : 8;

  badgeModo.innerText = `🔴 Simulación Oficial: ${num} de ${max}`;
  badgeModo.style.color = '#38bdf8';
  badgeModo.style.background = 'rgba(56, 189, 248, 0.1)';
  badgeModo.style.borderColor = 'rgba(56, 189, 248, 0.25)';

  txtPlacaModo.innerText = '🔴 Evaluación Activa';
  txtPlacaModo.style.color = '#38bdf8';
  txtPlacaSub.innerText = '30 s Oficiales';

  panelEstado.innerText = 'Evaluación Oficial: Toca los círculos dentro de la franja dorada.';
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'none';

  actualizarTableroMetricas();
  iniciarBuclePrueba();
}

btnAccion.addEventListener('click', () => {
  if (fase === 'DEMO') {
    btnAccion.style.display = 'none';
    iniciarBuclePrueba();
  } else if (fase === 'PAUSA_OFICIAL') {
    configurarOficial();
  }
});

function iniciarBuclePrueba() {
  enEjecucion = true;
  ultimoSpawn = performance.now();

  clearInterval(relojInterval);
  relojInterval = setInterval(() => {
    if (!enEjecucion) return;
    tiempoRestante--;

    txtPlacaSub.innerText = `Tiempo restante: ${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      concluirPrueba();
    }
  }, 1000);

  cancelAnimationFrame(animacionFrame);
  bucleAnimacion(performance.now());
}

function bucleAnimacion(ahora) {
  if (!enEjecucion) return;

  if (ahora - ultimoSpawn > cadenciaSpawn) {
    generarCirculo();
    ultimoSpawn = ahora;
  }

  actualizarFisicaCirculos();
  dibujarEscena();

  animacionFrame = requestAnimationFrame(bucleAnimacion);
}

function generarCirculo() {
  const carril = CARRILES[Math.floor(Math.random() * CARRILES.length)];
  circulos.push({
    x: carril,
    y: -15,
    radio: 12,
    velocidad: 2.7,
    estado: 'activo'
  });
}

function actualizarFisicaCirculos() {
  for (let i = 0; i < circulos.length; i++) {
    const c = circulos[i];
    c.y += c.velocidad;

    // Si superó por completo la franja dorada sin toque -> OMISIÓN
    if (c.estado === 'activo' && c.y > (FRANJA.y + FRANJA.h + c.radio)) {
      c.estado = 'fallado';
      errores++;
      actualizarTableroMetricas();
    }
  }

  // Filtrar los que salen del lienzo
  circulos = circulos.filter(c => c.y < canvas.height + 25);
}

function actualizarTableroMetricas() {
  metricaAciertos.innerText = aciertos;
  metricaErrores.innerText = errores;

  const total = aciertos + errores;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 100;
  metricaEfectividad.innerText = `${efectividad}%`;

  if (efectividad >= 80) {
    metricaEfectividad.style.color = '#38bdf8';
  } else {
    metricaEfectividad.style.color = '#f87171';
  }
}

// CAPTURA DE IMPACTO DIRECTA Y CALIBRADA
function procesarImpacto(evento) {
  if (!enEjecucion) return;
  evento.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  const clienteX = evento.touches ? evento.touches[0].clientX : evento.clientX;
  const clienteY = evento.touches ? evento.touches[0].clientY : evento.clientY;

  const toqX = (clienteX - rect.left) * escalaX;
  const toqY = (clienteY - rect.top) * escalaY;

  let impactoExitoso = false;
  const radioTolerancia = 22;

  for (let i = 0; i < circulos.length; i++) {
    const c = circulos[i];
    if (c.estado === 'activo') {
      const dist = Math.hypot(toqX - c.x, toqY - c.y);
      const dentroDeZona = (c.y + c.radio >= FRANJA.y - 6) && (c.y - c.radio <= FRANJA.y + FRANJA.h + 6);

      if (dist <= (c.radio + radioTolerancia) && dentroDeZona) {
        c.estado = 'acertado';
        aciertos++;
        impactoExitoso = true;
        if ('vibrate' in navigator) navigator.vibrate(25);
        break;
      }
    }
  }

  // Toque en falso (fuera de tiempo o al vacío)
  if (!impactoExitoso) {
    errores++;
    if ('vibrate' in navigator) navigator.vibrate(50);
  }

  actualizarTableroMetricas();
}

canvas.addEventListener('pointerdown', procesarImpacto);

function concluirPrueba() {
  enEjecucion = false;
  clearInterval(relojInterval);
  cancelAnimationFrame(animacionFrame);

  const total = aciertos + errores;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 100;

  if (fase === 'DEMO') {
    fase = 'PAUSA_OFICIAL';
    txtPlacaSub.innerText = 'Calibración Completada';
    panelEstado.innerText = `Calibración lista: ${aciertos} aciertos y ${errores} errores (${efectividad}% efectividad).`;
    panelEstado.style.color = '#4ade80';

    const num = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('punteo') : 1;
    const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('punteo') : 8;

    btnAccion.style.display = 'block';
    btnAccion.innerText = `Iniciar Simulación Oficial (${num} de ${max})`;
    btnAccion.style.backgroundColor = '#22c55e';
  } else {
    fase = 'FINALIZADO';
    finalizarExamenOficial(efectividad);
  }
}

function finalizarExamenOficial(efectividad) {
  let consumidas = 1;
  let max = 8;

  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('punteo');
    max = CreditManager.obtenerLimiteModulo('punteo');
  } else {
    let simRaw = parseInt(localStorage.getItem('simulaciones_punteo')) || 0;
    consumidas = simRaw + 1;
    localStorage.setItem('simulaciones_punteo', consumidas);
  }

  const aprobado = efectividad >= 80;

  // Persistir resultados en localStorage
  localStorage.setItem('sensometrika_punteo', JSON.stringify({
    aciertos: aciertos,
    errores: errores,
    efectividad: efectividad,
    porcentaje: efectividad,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = [];
  try {
    const rawHist = localStorage.getItem('sensometrika_historial_punteo');
    historial = rawHist ? JSON.parse(rawHist) : [];
  } catch (e) {
    historial = [];
  }

  historial.push({
    simulacion: consumidas,
    aciertos: aciertos,
    errores: errores,
    efectividad: efectividad,
    aprobado: aprobado,
    motivoFalla: !aprobado ? `Baja efectividad (${efectividad}% < 80%)` : 'Aprobado',
    fecha: new Date().toISOString()
  });
  localStorage.setItem('sensometrika_historial_punteo', JSON.stringify(historial));

  btnAccion.style.display = 'none';
  panelEstado.innerText = `Evaluación Finalizada: ${efectividad}% de efectividad (${aprobado ? 'Aprobado' : 'Observado'})`;
  panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

  // Detección del flujo según plan del usuario
  let sesion = {};
  try {
    sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  } catch (e) {
    sesion = {};
  }

  const planId = String(sesion.planId || '').toLowerCase();
  const modPerm = sesion.modulosPermitidos || [];
  const incluyeVisual = modPerm.includes('visual') || planId.includes('plus') || planId.includes('full') || planId.includes('integral');

  const urlSiguiente = incluyeVisual ? 'visual.html' : 'informe.html';
  const nombreSiguiente = incluyeVisual ? 'Módulo 4: Tamizaje Visual' : 'Informe y Dictamen Final';

  const bloqueado = consumidas >= max;

  // =========================================================================
  // MODAL FLOTANTE MEJORADO CON NAVEGACIÓN MODULAR Y ACCESO A INFORME
  // =========================================================================
  const modalExistente = document.getElementById('modal-resultado-punteo');
  if (modalExistente) modalExistente.remove();

  const modalHtml = `
    <div id="modal-resultado-punteo" style="position: fixed; inset: 0; background: rgba(5, 8, 18, 0.88); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; width: 100%; max-width: 380px; padding: 24px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); color: #f8fafc;">
        
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 700;">Simulación Finalizada</h3>
        <p style="color: #38bdf8; margin: 0 0 16px 0; font-size: 0.85rem; font-weight: 500;">
          Simulación ${consumidas} de ${max}
        </p>

        <div style="margin-bottom: 18px;">
          <span style="display: inline-block; padding: 4px 18px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; background: ${aprobado ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${aprobado ? '#10b981' : '#ef4444'}; color: ${aprobado ? '#34d399' : '#f87171'};">
            ${aprobado ? 'APROBADO' : 'OBSERVADO'}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #090e1a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 12px; margin-bottom: 20px; text-align: left;">
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Aciertos</span>
            <strong style="color: #4ade80; font-size: 0.95rem;">${aciertos}</strong>
          </div>
          <div>
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 2px;">Errores / Omisiones</span>
            <strong style="color: #f87171; font-size: 0.95rem;">${errores}</strong>
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
              Iniciar Calibración (${consumidas + 1}/${max})
            </button>
          ` : `
            <button onclick="window.location.href='${urlSiguiente}'" style="width: 100%; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; padding: 12px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
              Completado · Continuar a ${incluyeVisual ? 'Visual' : 'Informe'} →
            </button>
          `}

          ${!bloqueado ? `
            <button onclick="window.location.href='${urlSiguiente}'" style="width: 100%; background: transparent; color: #38bdf8; border: 1px solid #0284c7; border-radius: 10px; padding: 10px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
              Pasar al Siguiente Módulo (${incluyeVisual ? 'Visual' : 'Informe'}) →
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

function dibujarEscena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Carriles verticales guía
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1;
  CARRILES.forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  });

  // Franja dorada de impacto
  ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
  ctx.fillRect(10, FRANJA.y, canvas.width - 20, FRANJA.h);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(10, FRANJA.y, canvas.width - 20, FRANJA.h);

  // Línea central segmentada
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(10, FRANJA.y + (FRANJA.h / 2));
  ctx.lineTo(canvas.width - 10, FRANJA.y + (FRANJA.h / 2));
  ctx.stroke();
  ctx.setLineDash([]);

  // Círculos móviles
  circulos.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radio, 0, Math.PI * 2);

    if (c.estado === 'acertado') {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.strokeStyle = '#22c55e';
    } else if (c.estado === 'fallado') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#ffffff';
    }

    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  });
}