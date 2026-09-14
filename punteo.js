/* ==========================================================================
   TEST DE PUNTEO (DISCO DE LAHY / TAMBOR ROTATORIO) - SENSOMETRIKA
   ========================================================================== */
const canvas = document.getElementById('canvas-punteo');
const ctx = canvas ? canvas.getContext('2d') : null;

const btnAccion = document.getElementById('btn-iniciar');
const contenedorAccion = document.getElementById('contenedor-accion');
const lblAciertos = document.getElementById('contador-aciertos');
const lblFallos = document.getElementById('contador-fallos');
const lblEfectividad = document.getElementById('porcentaje-efectividad');
const badgeFase = document.getElementById('badge-fase');
const txtTiempo = document.getElementById('txt-tiempo');
const cajaTiempoCabecera = document.getElementById('caja-tiempo-cabecera');
const panelInstruccion = document.getElementById('caja-instruccion');

let animacionId = null;
let enEjecucion = false;
let faseActual = 'DEMO'; // 'DEMO' (15 s) | 'OFICIAL' (30 s sin reloj visible)
let tiempoRestante = 15;
let timerInterval = null;

let aciertos = 0;
let fallos = 0;
let orificios = [];

// CADENCIA Y ÁREA CALIBRADAS
const VELOCIDAD = 2.3;
const SEPARACION_ORIFICIOS = 135;
const RADIO_ORIFICIO = 16;

let franjaMinX = 135;
let franjaMaxX = 245;

function recalcularGeometria() {
  if (!canvas) return;
  const anchoContenedor = canvas.parentElement ? canvas.parentElement.clientWidth : 380;
  canvas.width = Math.min(380, Math.max(300, anchoContenedor));
  canvas.height = 200;

  const centro = canvas.width / 2;
  franjaMinX = centro - 55;
  franjaMaxX = centro + 55;

  dibujarEscenario();
}

function inicializarOrificios() {
  orificios = [];
  const total = 5;
  for (let i = 0; i < total; i++) {
    orificios.push({
      x: canvas.width + 40 + (i * SEPARACION_ORIFICIOS),
      y: 45 + Math.random() * (canvas.height - 90),
      radio: RADIO_ORIFICIO,
      tocado: false,
      acertado: false
    });
  }
}

function dibujarEscenario() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Fondo del tambor
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Franja dorada de inserción reglamentaria
  const anchoFranja = franjaMaxX - franjaMinX;
  ctx.fillStyle = 'rgba(234, 179, 8, 0.16)';
  ctx.fillRect(franjaMinX, 0, anchoFranja, canvas.height);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(franjaMinX, 0, anchoFranja, canvas.height);
  ctx.setLineDash([]);

  // 3. Orificios móviles
  orificios.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);

    if (o.tocado) {
      if (o.acertado) {
        ctx.fillStyle = '#eab308';
        ctx.strokeStyle = '#fef08a';
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#fca5a5';
      }
    } else {
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#d1fae5';
    }

    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(o.x, o.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
}

function actualizarFisica() {
  orificios.forEach(o => {
    o.x -= VELOCIDAD;

    if (o.x + o.radio < 0) {
      if (!o.tocado && enEjecucion) {
        fallos++;
        actualizarMarcadores();
      }

      let maxX = canvas.width;
      orificios.forEach(otro => {
        if (otro.x > maxX) maxX = otro.x;
      });

      o.x = maxX + SEPARACION_ORIFICIOS;
      o.y = 45 + Math.random() * (canvas.height - 90);
      o.tocado = false;
      o.acertado = false;
    }
  });
}

function bucleAnimacion() {
  if (!enEjecucion) return;
  actualizarFisica();
  dibujarEscenario();
  animacionId = requestAnimationFrame(bucleAnimacion);
}

function registrarImpacto(clientX, clientY) {
  if (!enEjecucion) return;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let impactoRegistrado = false;

  orificios.forEach(o => {
    const dist = Math.hypot(x - o.x, y - o.y);
    if (dist <= o.radio + 12 && !o.tocado) {
      impactoRegistrado = true;
      o.tocado = true;

      if (o.x >= franjaMinX && o.x <= franjaMaxX) {
        aciertos++;
        o.acertado = true;
        if ('vibrate' in navigator) navigator.vibrate(25);
      } else {
        fallos++;
        o.acertado = false;
      }
    }
  });

  if (!impactoRegistrado) {
    fallos++;
  }

  actualizarMarcadores();
}

function actualizarMarcadores() {
  const total = aciertos + fallos;
  const ef = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  if (lblAciertos) lblAciertos.innerText = aciertos;
  if (lblFallos) lblFallos.innerText = fallos;
  if (lblEfectividad) lblEfectividad.innerText = `${ef} %`;
}

function iniciarFase() {
  if (enEjecucion) return;
  enEjecucion = true;
  aciertos = 0;
  fallos = 0;
  actualizarMarcadores();

  tiempoRestante = (faseActual === 'DEMO') ? 15 : 30;

  if (faseActual === 'DEMO') {
    if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;
    if (btnAccion) {
      btnAccion.disabled = true;
      btnAccion.innerText = `Calibrando... (${tiempoRestante} s)`;
    }
  } else {
    // EN EXAMEN OFICIAL: CRONÓMETRO OCULTO
    if (cajaTiempoCabecera) cajaTiempoCabecera.innerHTML = '<strong>Evaluación Activa</strong>';
    if (btnAccion) {
      btnAccion.disabled = true;
      btnAccion.innerText = 'Evaluando...';
    }
  }

  inicializarOrificios();
  bucleAnimacion();

  timerInterval = setInterval(() => {
    tiempoRestante--;

    // Solo actualiza el texto de tiempo visible si es fase DEMO
    if (faseActual === 'DEMO') {
      if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;
      if (btnAccion) btnAccion.innerText = `Calibrando... (${tiempoRestante} s)`;
    }

    if (tiempoRestante <= 0) {
      finalizarFase();
    }
  }, 1000);
}

function finalizarFase() {
  clearInterval(timerInterval);
  cancelAnimationFrame(animacionId);
  enEjecucion = false;

  const total = aciertos + fallos;
  const ef = total > 0 ? Math.round((aciertos / total) * 100) : 0;

  if (faseActual === 'DEMO') {
    faseActual = 'OFICIAL';
    badgeFase.innerText = '🔴 Modo Oficial D.S. N° 170 (Calificatorio)';
    badgeFase.style.borderColor = '#ef4444';

    // Se retira el cronómetro de 30 seg de la cabecera
    if (cajaTiempoCabecera) cajaTiempoCabecera.innerHTML = '<strong>Evaluación Activa</strong>';

    panelInstruccion.innerHTML = '✅ <strong>Demo finalizado.</strong> Ahora comienza la evaluación reglamentaria.';

    if (btnAccion) {
      btnAccion.disabled = false;
      btnAccion.innerText = 'Iniciar Evaluación Oficial';
      btnAccion.style.backgroundColor = '#16a34a';
    }
  } else {
    // Fin de evaluación oficial
    const aprobado = ef >= 80;
    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      efectividad: ef,
      aciertos: aciertos,
      fallos: fallos,
      aprobado: aprobado,
      fecha: new Date().toISOString()
    }));

    mostrarBotonContinuar(ef, aprobado);
  }
}

function mostrarBotonContinuar(ef, aprobado) {
  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const permitidos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo'];
  const tieneVisual = permitidos.includes('visual');

  const siguienteUrl = tieneVisual ? 'visual.html' : 'informe.html';
  const textoBoton = tieneVisual ? 'Continuar a Módulo 4 (Tamizaje Visual) →' : '📋 Ver Certificado e Informe Final';

  if (contenedorAccion) {
    contenedorAccion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 10px; padding: 14px; text-align: center; margin-top: 6px;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.05rem;">
          ${aprobado ? '✅ Módulo Superado' : '⚠️ Bajo Estándar Normativo'} (${ef}%)
        </h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px;">
          Exigencia legal: Mínimo 80% de efectividad rítmica[cite: 2, 6].
        </p>
        <a href="${siguienteUrl}" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7;">
          ${textoBoton}
        </a>
      </div>
    `;
  }
}

// Interacción con mouse y táctil
if (canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    registrarImpacto(e.clientX, e.clientY);
  });
}

if (btnAccion) {
  btnAccion.addEventListener('click', iniciarFase);
}

window.addEventListener('resize', recalcularGeometria);
document.addEventListener('DOMContentLoaded', () => {
  recalcularGeometria();
  inicializarOrificios();
  dibujarEscenario();
});