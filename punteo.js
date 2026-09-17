/* ==========================================================================
   SENSOMETRIKA - MÓDULO 3: TEST DE PUNTEO DE LAHY (punteo.js)
   • Flujo descendente vertical (de arriba hacia abajo)
   • 4 Columnas alternadas (izquierda y derecha) para obligar el uso bimanual
   • Franja dorada horizontal de inserción reglamentaria
   • 1 Demo de 15 s + Simulación Oficial de 30 s con avance al Informe
   ========================================================================== */

const canvas = document.getElementById('lienzo-punteo') || document.getElementById('canvas-punteo') || document.querySelector('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const badgeModo = document.getElementById('badge-modo-punteo') || document.getElementById('badge-modo') || document.querySelector('.badge-modo');
const elCronometro = document.getElementById('cronometro-punteo') || document.getElementById('lbl-crono-punteo') || document.getElementById('lbl-cronometro');
const elAciertos = document.getElementById('contador-aciertos') || document.getElementById('metrica-aciertos');
const elFallos = document.getElementById('contador-errores') || document.getElementById('contador-fallos') || document.getElementById('metrica-fallos');
const elEfectividad = document.getElementById('metrica-efectividad');
const panelMensaje = document.getElementById('panel-estado');
const zonaAcciones = document.getElementById('zona-coordinacion-punteo') || document.getElementById('contenedor-accion');

let btnAccion = document.getElementById('btn-iniciar-punteo') || document.getElementById('btn-accion-punteo') || document.getElementById('btn-iniciar');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let juegoActivo = false;
let tiempoRestante = 15;
let intervaloTiempo = null;
let animacionFrame = null;

let aciertos = 0;
let fallos = 0;
let orificios = [];
let velocidadTambor = 2.4;

// Franja horizontal reglamentaria de inserción
let franjaY = 140;
let franjaAlto = 48;

function inicializarPunteo() {
  if (!canvas || !ctx) return;

  // Ajuste de proporciones verticales de cabina
  if (!canvas.width || canvas.width < 320) canvas.width = 340;
  if (!canvas.height || canvas.height < 240) canvas.height = 250;

  franjaY = Math.round(canvas.height * 0.60);
  franjaAlto = 46;

  btnAccion = document.getElementById('btn-iniciar-punteo') || document.getElementById('btn-accion-punteo') || document.getElementById('btn-iniciar');
  if (btnAccion) {
    btnAccion.onclick = function(e) {
      e.preventDefault();
      if (juegoActivo) return;
      arrancarPrueba();
    };
  }

  // Soporte multitáctil y mouse en pantalla
  canvas.onpointerdown = function(e) {
    e.preventDefault();
    if (!juegoActivo) return;
    registrarPunteo(e);
  };

  if (typeof CreditManager !== 'undefined') {
    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'punteo');
    if (!CreditManager.puedeRendir('punteo')) {
      bloquearCupoPunteo();
      return;
    }
  }

  prepararModoDemo();
}

function prepararModoDemo() {
  modo = 'DEMO';
  juegoActivo = false;
  tiempoRestante = 15;
  aciertos = 0;
  fallos = 0;

  if (badgeModo) {
    badgeModo.innerText = '🟡 Calibración Técnica (Demo 15s)';
    badgeModo.style.color = '#facc15';
  }
  if (elCronometro) elCronometro.innerText = '15 s';
  if (elAciertos) elAciertos.innerText = '0';
  if (elFallos) elFallos.innerText = '0';
  if (elEfectividad) elEfectividad.innerText = '-- %';

  if (panelMensaje) {
    panelMensaje.innerText = 'Modo Calibración: Usa ambas manos para tocar los círculos en la franja central.';
    panelMensaje.style.color = '#38bdf8';
  }

  if (btnAccion) {
    btnAccion.style.display = 'block';
    btnAccion.disabled = false;
    btnAccion.style.backgroundColor = '#0284c7';
    btnAccion.innerText = 'Iniciar Calibración (15 s)';
  }

  orificios = generarOrificiosDescendentes();
  renderizarTambor();
}

// Genera orificios que caen de arriba a abajo por columnas izquierda/derecha
function generarOrificiosDescendentes() {
  const lista = [];
  // 4 columnas verticales: 2 para mano izquierda y 2 para mano derecha
  const columnasX = [
    Math.round(canvas.width * 0.18),
    Math.round(canvas.width * 0.38),
    Math.round(canvas.width * 0.62),
    Math.round(canvas.width * 0.82)
  ];

  let yActual = -30;
  for (let i = 0; i < 45; i++) {
    // Alterna columnas obligando el cambio de mano
    const colX = columnasX[Math.floor(Math.random() * columnasX.length)];
    const separacion = Math.floor(Math.random() * (110 - 75 + 1)) + 75;
    yActual -= separacion;

    lista.push({
      x: colX,
      y: yActual,
      radio: 13,
      acertado: false,
      fallado: false
    });
  }
  return lista;
}

function arrancarPrueba() {
  juegoActivo = true;
  aciertos = 0;
  fallos = 0;
  if (elAciertos) elAciertos.innerText = '0';
  if (elFallos) elFallos.innerText = '0';
  if (elEfectividad) elEfectividad.innerText = '-- %';

  if (btnAccion) btnAccion.style.display = 'none';

  tiempoRestante = (modo === 'DEMO') ? 15 : 30;
  if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

  if (panelMensaje) {
    panelMensaje.innerText = (modo === 'DEMO') 
      ? 'Calibrando: Usa pulgar izquierdo y derecho al cruzar la franja.' 
      : 'Evaluación oficial activa: Mantén el ritmo bimanual.';
    panelMensaje.style.color = '#4ade80';
  }

  orificios = generarOrificiosDescendentes();

  clearInterval(intervaloTiempo);
  intervaloTiempo = setInterval(() => {
    tiempoRestante--;
    if (elCronometro) elCronometro.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      terminarPruebaPunteo();
    }
  }, 1000);

  cancelAnimationFrame(animacionFrame);
  bucleTambor();
}

function bucleTambor() {
  if (!juegoActivo) return;

  // Los círculos se desplazan verticalmente hacia abajo
  for (let i = 0; i < orificios.length; i++) {
    const o = orificios[i];
    o.y += velocidadTambor;

    // Si cruza la franja dorada hacia abajo sin ser pulsado, es fallo
    if (!o.acertado && !o.fallado && (o.y - o.radio > (franjaY + franjaAlto))) {
      o.fallado = true;
      fallos++;
      if (elFallos) elFallos.innerText = fallos;
      actualizarMetricaEfectividad();
    }
  }

  renderizarTambor();
  animacionFrame = requestAnimationFrame(bucleTambor);
}

function registrarPunteo(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

  // El toque es válido únicamente dentro de la franja dorada horizontal
  if (clickY < franjaY || clickY > (franjaY + franjaAlto)) {
    fallos++;
    if (elFallos) elFallos.innerText = fallos;
    actualizarMetricaEfectividad();
    return;
  }

  let acerto = false;
  for (let i = 0; i < orificios.length; i++) {
    const o = orificios[i];
    const d = Math.hypot(clickX - o.x, clickY - o.y);
    if (d <= o.radio + 12 && !o.acertado) {
      o.acertado = true;
      aciertos++;
      acerto = true;
      if (elAciertos) elAciertos.innerText = aciertos;
      if ('vibrate' in navigator) navigator.vibrate(30);
      actualizarMetricaEfectividad();
      break;
    }
  }

  if (!acerto) {
    fallos++;
    if (elFallos) elFallos.innerText = fallos;
    actualizarMetricaEfectividad();
  }
}

function actualizarMetricaEfectividad() {
  const total = aciertos + fallos;
  const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  if (elEfectividad) elEfectividad.innerText = `${pct} %`;
}

function terminarPruebaPunteo() {
  juegoActivo = false;
  clearInterval(intervaloTiempo);
  cancelAnimationFrame(animacionFrame);

  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('punteo') : 3;

  if (modo === 'DEMO') {
    modo = 'OFICIAL';
    const actual = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerNumeroSimulacionActual('punteo') : 1;

    if (badgeModo) {
      badgeModo.innerText = `🔴 Simulación Oficial ${actual} de ${max}`;
      badgeModo.style.color = '#38bdf8';
    }
    if (elCronometro) elCronometro.innerText = '30 s';
    if (panelMensaje) {
      panelMensaje.innerText = `¡Calibración terminada! (${efectividad}% efectividad). Inicia tu examen oficial.`;
      panelMensaje.style.color = '#4ade80';
    }

    btnAccion = document.getElementById('btn-iniciar-punteo') || document.getElementById('btn-accion-punteo') || document.getElementById('btn-iniciar');
    if (btnAccion) {
      btnAccion.style.display = 'block';
      btnAccion.style.backgroundColor = '#22c55e';
      btnAccion.innerText = `Iniciar Simulación Oficial (${actual} de ${max})`;
    }

    orificios = generarOrificiosDescendentes();
    renderizarTambor();
  } else {
    const consumidas = (typeof CreditManager !== 'undefined') ? CreditManager.registrarConsumo('punteo') : 1;
    const aprobado = efectividad >= 80 && aciertos >= 12;
    const motivoFalla = !aprobado ? (efectividad < 80 ? `Baja efectividad (${efectividad}%)` : 'Pocos aciertos') : 'Aprobado';

    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      aciertos,
      fallos,
      efectividad,
      aprobado,
      fecha: new Date().toISOString()
    }));

    let historial = JSON.parse(localStorage.getItem('sensometrika_historial_punteo')) || [];
    historial.push({
      simulacion: consumidas,
      aciertos,
      porcentaje: efectividad,
      aprobado,
      motivoFalla
    });
    localStorage.setItem('sensometrika_historial_punteo', JSON.stringify(historial));

    if (typeof CreditManager !== 'undefined') {
      CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'punteo');
    }

    const sesion = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerSesion() : {};
    const modulos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo'];
    const tieneVisual = modulos.includes('visual');
    const siguienteUrl = tieneVisual ? 'visual.html' : 'informe.html';
    const siguienteTxt = tieneVisual ? 'Continuar a Módulo 4 (Visual) →' : '📊 Ver Informe y Resultados Finales →';

    const contenedor = zonaAcciones || (panelMensaje && panelMensaje.parentNode);
    const card = document.createElement('div');
    card.style.cssText = 'background: #0f172a; border: 1.5px solid #22c55e; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;';
    card.innerHTML = `
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0;">¡Simulación ${consumidas} de ${max} Finalizada!</h3>
      <p style="color: #cbd5e1; font-size: 0.9rem; margin: 4px 0 10px 0;">
        Efectividad: <strong style="color: #38bdf8;">${efectividad}%</strong> (${aciertos} aciertos / ${fallos} fallos)
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${consumidas < max ? `
          <button onclick="location.reload()" style="height:42px; background:#22c55e; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">
            🔄 Rendir Simulación ${consumidas + 1} de ${max} →
          </button>
        ` : ''}
        <a href="${siguienteUrl}" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          ${siguienteTxt}
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    `;
    if (contenedor) {
      contenedor.innerHTML = '';
      contenedor.appendChild(card);
    }
  }
}

function bloquearCupoPunteo() {
  const max = (typeof CreditManager !== 'undefined') ? CreditManager.obtenerLimiteModulo('punteo') : 3;
  if (badgeModo) {
    badgeModo.innerText = `🔴 Simulación ${max} de ${max} (Bloqueado)`;
    badgeModo.style.color = '#f87171';
  }
  if (panelMensaje) {
    panelMensaje.innerText = `Has completado el límite de ${max} simulaciones para este módulo.`;
    panelMensaje.style.color = '#f87171';
  }
  if (btnAccion) btnAccion.style.display = 'none';
}

function renderizarTambor() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo del tambor
  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Carriles verticales sutiles
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1;
  const colX = [canvas.width * 0.18, canvas.width * 0.38, canvas.width * 0.62, canvas.width * 0.82];
  colX.forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  });

  // Franja dorada horizontal de inserción reglamentaria
  ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
  ctx.fillRect(0, franjaY, canvas.width, franjaAlto);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, franjaY, canvas.width, franjaAlto);

  // Línea guía central punteada
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, franjaY + franjaAlto / 2);
  ctx.lineTo(canvas.width, franjaY + franjaAlto / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orificios móviles que descienden
  for (let i = 0; i < orificios.length; i++) {
    const o = orificios[i];
    if (o.y + o.radio < 0 || o.y - o.radio > canvas.height) continue;

    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);

    if (o.acertado) {
      ctx.fillStyle = '#eab308'; // Dorado si fue tocado a tiempo en la franja
    } else if (o.fallado) {
      ctx.fillStyle = '#ef4444'; // Rojo si pasó de largo sin toque
    } else {
      ctx.fillStyle = '#22c55e'; // Verde listo para pulsar
    }

    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

window.addEventListener('DOMContentLoaded', inicializarPunteo);