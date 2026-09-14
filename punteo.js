/**
 * Sensometrika | Módulo 3: Test de Punteo (Disco de Lahy)
 * Baremos D.S. N° 170 MTT
 */

const canvas = document.getElementById('canvas-punteo');
const ctx = canvas ? canvas.getContext('2d') : null;
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const metricaAciertos = document.getElementById('metrica-aciertos');
const metricaFallos = document.getElementById('metrica-fallos');
const metricaEfectividad = document.getElementById('metrica-efectividad');
const metricaTiempo = document.getElementById('metrica-tiempo');
const badgeModo = document.getElementById('badge-modo');
const zonaCoordinacion = document.getElementById('zona-coordinacion-test');

let modo = 'DEMO'; // 'DEMO' (15 s) u 'OFICIAL' (30 s)
let pruebaActiva = false;
let tiempoRestante = 15;
let temporizador = null;
let animacionId = null;

let aciertos = 0;
let fallos = 0;
let orificios = [];
let ultimoOrificioId = 0;

// Configuración de la franja dorada central
const FRANJA = {
  x: 140,
  y: 40,
  ancho: 80,
  alto: 240
};

// Generador de orificios dinámicos en movimiento
function generarOrificio() {
  ultimoOrificioId++;
  const radio = 14;
  const x = FRANJA.x + Math.floor(Math.random() * (FRANJA.ancho - radio * 2)) + radio;
  const velocidad = (modo === 'DEMO') ? 2.2 : 3.0; // Velocidad de caída
  
  orificios.push({
    id: ultimoOrificioId,
    x: x,
    y: FRANJA.y - 20,
    radio: radio,
    velocidad: velocidad,
    tocado: false
  });
}

function dibujarPunteo() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo del tambor
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Franja dorada de calibración
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.strokeRect(FRANJA.x, FRANJA.y, FRANJA.ancho, FRANJA.alto);

  // Mover y dibujar orificios
  ctx.fillStyle = '#94a3b8';
  for (let i = orificios.length - 1; i >= 0; i--) {
    const o = orificios[i];
    o.y += o.velocidad;

    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);
    ctx.fill();

    // Si sale de la franja sin ser tocado, cuenta como fallo
    if (o.y - o.radio > FRANJA.y + FRANJA.alto) {
      if (!o.tocado && pruebaActiva) {
        fallos++;
        actualizarMetricas();
      }
      orificios.splice(i, 1);
    }
  }

  if (pruebaActiva) {
    // Frecuencia estocástica de caída de orificios
    if (Math.random() < 0.04) {
      generarOrificio();
    }
    animacionId = requestAnimationFrame(dibujarPunteo);
  }
}

function actualizarMetricas() {
  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  
  if (metricaAciertos) metricaAciertos.innerText = aciertos;
  if (metricaFallos) metricaFallos.innerText = fallos;
  if (metricaEfectividad) metricaEfectividad.innerText = `${efectividad}%`;
}

// Detección de toque en pantalla / clic sobre el orificio
if (canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    if (!pruebaActiva) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    let impacto = false;
    for (let i = 0; i < orificios.length; i++) {
      const o = orificios[i];
      const dist = Math.hypot(touchX - o.x, touchY - o.y);

      // Si el toque cae dentro del radio del orificio dentro de la franja dorada
      if (dist <= o.radio + 8 && !o.tocado) {
        if (o.y >= FRANJA.y && o.y <= FRANJA.y + FRANJA.alto) {
          o.tocado = true;
          aciertos++;
          impacto = true;
          if ('vibrate' in navigator) navigator.vibrate(30);
          orificios.splice(i, 1);
          break;
        }
      }
    }

    if (!impacto) {
      fallos++;
    }
    actualizarMetricas();
  });
}

if (btnAccion) {
  btnAccion.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!pruebaActiva && modo === 'DEMO') {
      iniciarDemo();
    } else if (!pruebaActiva && modo === 'OFICIAL') {
      iniciarOficial();
    }
  });
}

function iniciarDemo() {
  pruebaActiva = true;
  tiempoRestante = 15;
  aciertos = 0;
  fallos = 0;
  orificios = [];
  actualizarMetricas();

  btnAccion.style.display = 'none';
  panelEstado.innerText = 'Presiona los círculos únicamente dentro del marco dorado';
  panelEstado.style.color = '#38bdf8';

  dibujarPunteo();

  temporizador = setInterval(() => {
    tiempoRestante--;
    if (metricaTiempo) metricaTiempo.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      clearInterval(temporizador);
      pruebaActiva = false;
      cancelAnimationFrame(animacionId);
      finalizarDemo();
    }
  }, 1000);
}

function finalizarDemo() {
  modo = 'OFICIAL';
  panelEstado.innerText = 'Calibración lista. Presiona el botón verde para la Evaluación Oficial.';
  panelEstado.style.color = '#4ade80';

  btnAccion.style.display = 'block';
  btnAccion.innerText = 'Iniciar Evaluación Oficial (30 s)';
  btnAccion.style.backgroundColor = '#22c55e';
}

function iniciarOficial() {
  pruebaActiva = true;
  tiempoRestante = 30;
  aciertos = 0;
  fallos = 0;
  orificios = [];
  actualizarMetricas();

  if (badgeModo) {
    badgeModo.innerText = '🔴 Evaluación Oficial D.S. N° 170';
    badgeModo.style.color = '#38bdf8';
  }

  btnAccion.style.display = 'none';
  panelEstado.innerText = 'Evaluación Oficial en curso...';
  panelEstado.style.color = '#38bdf8';

  dibujarPunteo();

  temporizador = setInterval(() => {
    tiempoRestante--;
    if (metricaTiempo) metricaTiempo.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      clearInterval(temporizador);
      pruebaActiva = false;
      cancelAnimationFrame(animacionId);
      finalizarPruebaOficial();
    }
  }, 1000);
}

function finalizarPruebaOficial() {
  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const aprobado = (efectividad >= 80);

  // 1. Guardar resultado para el informe consolidado
  localStorage.setItem('sensometrika_punteo', JSON.stringify({
    efectividad: efectividad,
    aciertos: aciertos,
    fallos: fallos,
    aprobado: aprobado
  }));

  // 2. Comprobar permisos del plan adquirido
  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const modulosPermitidos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo'];
  const tieneVisual = modulosPermitidos.includes('visual');
  const tieneAuditivo = modulosPermitidos.includes('auditivo');

  // Enrutamiento dinámico según el plan:
  let siguienteUrl = 'informe.html';
  let textoBoton = '📊 Ver Informe y Dictamen Final';

  if (tieneVisual) {
    siguienteUrl = 'visual.html';
    textoBoton = 'Continuar a Módulo 4 (Tamizaje Visual) →';
  } else if (tieneAuditivo) {
    siguienteUrl = 'audicion.html';
    textoBoton = 'Continuar a Módulo 5 (Tamizaje Auditivo) →';
  }

  const colorResultado = aprobado ? '#4ade80' : '#f87171';
  const textoTitulo = aprobado ? '¡Módulo 3 Finalizado!' : 'Módulo 3 Finalizado (Fuera de Rango)';

  if (zonaCoordinacion) {
    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${colorResultado}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${colorResultado}; margin: 0 0 6px 0; font-size: 1.05rem;">${textoTitulo}</h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 14px;">
          Efectividad registrada: <strong style="color: #ffffff;">${efectividad}%</strong> (${aciertos} aciertos)<br>
          <span style="font-size: 0.76rem; color: ${colorResultado};">Resultado: <strong>${aprobado ? 'APROBADO' : 'NO APTO'}</strong> (Exigencia D.S. N° 170: &ge; 80%)</span>
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${siguienteUrl}" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7; font-size: 0.95rem;">
            ${textoBoton}
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
            Regresar al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}