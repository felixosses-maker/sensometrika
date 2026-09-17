/* ==========================================================================
   SENSOMETRIKA - MÓDULO 3: TEST DE PUNTEO LAHY (punteo.js)
   • Detección geométrica calibrada para impacto certero (Aciertos y Errores)
   • Conteo estricto de dianas acertadas, omisiones al cruzar y toques en falso
   • Demo 15s -> Evaluación Oficial 30s
   • Integración y descuento con CreditManager
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

// Modal
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

    if (fase === 'DEMO') {
      txtPlacaSub.innerText = `Tiempo restante: ${tiempoRestante} s`;
    } else {
      txtPlacaSub.innerText = `Tiempo restante: ${tiempoRestante} s`;
    }

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
    estado: 'activo' // 'activo', 'acertado', 'fallado'
  });
}

function actualizarFisicaCirculos() {
  for (let i = 0; i < circulos.length; i++) {
    const c = circulos[i];
    c.y += c.velocidad;

    // Si el círculo superó por completo la franja dorada sin haber sido tocado -> OMISIÓN
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

  // Tolerancia de contacto amplia (22px de radio de toque)
  const radioTolerancia = 22;

  for (let i = 0; i < circulos.length; i++) {
    const c = circulos[i];
    if (c.estado === 'activo') {
      const dist = Math.hypot(toqX - c.x, toqY - c.y);

      // El círculo es acertado si el toque está cerca y dentro de la franja dorada
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

  // Si el toque fue en falso (fuera de tiempo o al vacío) -> ERROR POR IMPRECISIÓN
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
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('punteo');
  }

  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('punteo') : 8;
  const aprobado = efectividad >= 80;

  // Persistir resultados
  localStorage.setItem('sensometrika_punteo', JSON.stringify({
    aciertos: aciertos,
    errores: errores,
    efectividad: efectividad,
    porcentaje: efectividad,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_punteo')) || [];
  historial.push({
    simulacion: consumidas,
    aciertos: aciertos,
    errores: errores,
    efectividad: efectividad,
    aprobado: aprobado,
    motivoFalla: !aprobado ? `Baja efectividad (${efectividad}% < 80%)` : 'Aprobado'
  });
  localStorage.setItem('sensometrika_historial_punteo', JSON.stringify(historial));

  btnAccion.style.display = 'none';
  panelEstado.innerText = `Evaluación Finalizada: ${efectividad}% de efectividad (${aprobado ? 'Aprobado' : 'Observado'})`;
  panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

  // Verificar salto a Visual o Informe según el plan
  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const planId = String(sesion.planId || '').toLowerCase();
  const modPerm = sesion.modulosPermitidos || [];
  const incluyeVisual = modPerm.includes('visual') || planId.includes('plus') || planId.includes('full') || planId.includes('integral');

  const urlSiguiente = incluyeVisual ? 'visual.html' : 'informe.html';
  const textoBotonSiguiente = incluyeVisual ? 'Continuar a Módulo 4 (Tamizaje Visual) →' : '📊 Ver Informe y Dictamen Final →';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:12px; padding:16px; text-align:center; margin-top:8px;">
      <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.05rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 12px 0;">
        Aciertos: <strong style="color:#4ade80;">${aciertos}</strong> &nbsp;|&nbsp; 
        Errores: <strong style="color:#f87171;">${errores}</strong> &nbsp;|&nbsp; 
        Efectividad: <strong style="color:#38bdf8;">${efectividad}%</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <a href="${urlSiguiente}" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:0.92rem;">
          ${textoBotonSiguiente}
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
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