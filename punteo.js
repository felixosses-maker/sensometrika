/* ==========================================================================
   SENSOMETRIKA - MÓDULO 3: TEST DE PUNTEO (punteo.js)
   • 1 Demo único de 15 s por módulo
   • Conteo y bloqueo 1/3, 2/3 y 3/3 sincronizado con CreditManager
   • Variación de secuencias de orificios (anti-memorización)
   ========================================================================== */
const canvas = document.getElementById('lienzo-punteo');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo-punteo');
const txtTiempo = document.getElementById('txt-tiempo-punteo');
const lblCrono = document.getElementById('lbl-crono-punteo');
const metricaAciertos = document.getElementById('metrica-aciertos');
const metricaFallos = document.getElementById('metrica-fallos');
const metricaEfectividad = document.getElementById('metrica-efectividad');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-punteo');
const zonaCoordinacion = document.getElementById('zona-coordinacion-punteo');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let pruebaActiva = false;
let intervalo = null;
let animacionFrame = null;

let tiempoRestante = 15;
let aciertos = 0;
let fallos = 0;

// Franja dorada central
const franjaX = 110;
const franjaAncho = 110;

// Banco dinámico de orificios (Anti-memorización de cadencia y posición)
let orificios = [];
let velocidadTambor = 2.4;

function generarOrificiosAleatorios() {
  const lista = [];
  const carrilesY = [45, 90, 135, 180];
  let xActual = 340;

  for (let i = 0; i < 35; i++) {
    const carrilAleatorio = carrilesY[Math.floor(Math.random() * carrilesY.length)];
    const separacion = Math.floor(Math.random() * (160 - 115 + 1)) + 115;
    xActual += separacion;

    lista.push({
      x: xActual,
      y: carrilAleatorio,
      radio: 12,
      tocado: false,
      fallado: false
    });
  }
  return lista;
}

window.addEventListener('DOMContentLoaded', () => {
  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'punteo');

  // 1. Bloqueo al llegar a 3/3
  if (!CreditManager.puedeRendir('punteo')) {
    bloquearModuloPorCupo();
    return;
  }

  // 2. Si ya completó el Demo en Punteo, salta directo al examen oficial
  if (CreditManager.demoYaRealizado('punteo')) {
    prepararVistaOficialDirecta();
  } else {
    orificios = generarOrificiosAleatorios();
    dibujarEscena();
  }
});

function bloquearModuloPorCupo() {
  btnIniciar.disabled = true;
  btnIniciar.style.opacity = '0.4';
  btnIniciar.innerText = 'Cupo Bloqueado (3/3 Realizadas)';
  panelEstado.innerText = 'Has alcanzado el límite de 3 simulaciones oficiales para este módulo.';
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado (3 de 3)</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">Completaste todas las simulaciones de tu Plan Básico.</p>
      <a href="menu.html" class="btn-principal" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  pruebaActiva = false;
  const numSim = CreditManager.obtenerNumeroSimulacionActual('punteo');

  badgeModo.innerText = `🔴 Simulación Oficial ${numSim} de 3 (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  txtTiempo.innerHTML = 'Evaluación Activa';
  panelEstado.innerText = 'Presiona "Iniciar Simulación Oficial" para comenzar.';
  panelEstado.style.color = '#38bdf8';

  btnIniciar.style.display = 'block';
  btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de 3)`;
  btnIniciar.style.backgroundColor = '#22c55e';

  orificios = generarOrificiosAleatorios();
  dibujarEscena();
}

btnIniciar.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (btnIniciar.disabled) return;

  if (!pruebaActiva) {
    iniciarPrueba();
  }
});

function iniciarPrueba() {
  pruebaActiva = true;
  aciertos = 0;
  fallos = 0;
  metricaAciertos.innerText = '0';
  metricaFallos.innerText = '0';
  metricaEfectividad.innerText = '-- %';
  btnIniciar.style.display = 'none';

  orificios = generarOrificiosAleatorios();

  if (modo === 'DEMO') {
    tiempoRestante = 15;
    lblCrono.innerText = `${tiempoRestante} s`;
    panelEstado.innerText = 'Fase Demo: Calibra el ritmo de inserción';
  } else {
    tiempoRestante = 30; // 30 s normativos
    panelEstado.innerText = 'Evaluación Oficial en curso: Precisión rítmica';
  }

  intervalo = setInterval(() => {
    tiempoRestante--;
    if (modo === 'DEMO' && lblCrono) {
      lblCrono.innerText = `${tiempoRestante} s`;
    }

    if (tiempoRestante <= 0) {
      clearInterval(intervalo);
      cancelAnimationFrame(animacionFrame);
      finalizarPrueba();
    }
  }, 1000);

  bucleAnimacion();
}

function bucleAnimacion() {
  if (!pruebaActiva) return;

  // Desplazar tambor hacia la izquierda
  for (let o of orificios) {
    o.x -= velocidadTambor;

    // Si salió de la franja dorada sin ser tocado, cuenta fallo
    if (!o.tocado && !o.fallado && (o.x + o.radio < franjaX)) {
      o.fallado = true;
      fallos++;
      metricaFallos.innerText = fallos;
      actualizarEfectividad();
    }
  }

  dibujarEscena();
  animacionFrame = requestAnimationFrame(bucleAnimacion);
}

// Detección de toque táctil o clic
canvas.addEventListener('pointerdown', (e) => {
  if (!pruebaActiva) return;
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touchX = e.clientX - rect.left;
  const touchY = e.clientY - rect.top;

  // Solo es válido dentro de la franja dorada reglamentaria
  if (touchX < franjaX || touchX > franjaX + franjaAncho) {
    fallos++;
    metricaFallos.innerText = fallos;
    actualizarEfectividad();
    return;
  }

  let acerto = false;
  for (let o of orificios) {
    const dist = Math.hypot(touchX - o.x, touchY - o.y);
    if (dist <= o.radio + 10 && !o.tocado) {
      o.tocado = true;
      aciertos++;
      acerto = true;
      if ('vibrate' in navigator) navigator.vibrate(40);
      metricaAciertos.innerText = aciertos;
      actualizarEfectividad();
      break;
    }
  }

  if (!acerto) {
    fallos++;
    metricaFallos.innerText = fallos;
    actualizarEfectividad();
  }
});

function actualizarEfectividad() {
  const total = aciertos + fallos;
  const efec = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  metricaEfectividad.innerText = `${efec} %`;
}

function finalizarPrueba() {
  pruebaActiva = false;
  clearInterval(intervalo);
  cancelAnimationFrame(animacionFrame);

  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;

  if (modo === 'DEMO') {
    CreditManager.marcarDemoCompletado('punteo');
    const numSim = CreditManager.obtenerNumeroSimulacionActual('punteo');
    panelEstado.innerText = `¡Calibración lista! Efectividad: ${efectividad}%. Pasa a Simulación Oficial ${numSim} de 3.`;
    panelEstado.style.color = '#4ade80';

    btnIniciar.style.display = 'block';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de 3)`;
    btnIniciar.style.backgroundColor = '#22c55e';
    modo = 'OFICIAL';
  } else {
    // Oficial: Descontar simulación
    const consumidas = CreditManager.registrarConsumo('punteo');
    const aprobado = efectividad >= 80 && aciertos >= 12;

    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      efectividad: efectividad,
      aciertos: aciertos,
      aprobado: aprobado
    }));

    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'punteo');
    const bloqueoTotal = consumidas >= CreditManager.LIMITE_SIMULACIONES;

    // Detectar si el plan incluye módulos sensoriales para el botón siguiente
    const sesion = CreditManager.obtenerSesion();
    const tieneVisual = sesion.modulosPermitidos && sesion.modulosPermitidos.includes('visual');
    const siguienteUrl = tieneVisual ? 'visual.html' : 'informe.html';
    const textoBoton = tieneVisual ? 'Continuar a Módulo 4 (Tamizaje Visual) →' : '📊 Ver Informe de Evaluación Global';

    panelEstado.innerText = 'Evaluación Oficial completada.';

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#38bdf8' : '#ef4444'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
          ¡Simulación ${consumidas}/3 Finalizada!
        </h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 8px;">
          Efectividad oficial: <strong style="color: #fff;">${efectividad}%</strong> (${aciertos} aciertos) - ${aprobado ? 'Aprobado' : 'Observado'}
        </p>
        <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
          ${bloqueoTotal ? 'Has completado el cupo máximo de 3/3 simulaciones de este módulo.' : `Te restan ${3 - consumidas} simulación(es) en este módulo.`}
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${siguienteUrl}" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:44px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
            ${textoBoton}
          </a>
          <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:6px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

function dibujarEscena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Franja dorada de inserción
  ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
  ctx.fillRect(franjaX, 0, franjaAncho, canvas.height);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(franjaX, 0, franjaAncho, canvas.height);

  // Orificios móviles
  for (let o of orificios) {
    if (o.x + o.radio < 0 || o.x - o.radio > canvas.width) continue;

    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);

    if (o.tocado) {
      ctx.fillStyle = '#eab308'; // Acierto dorado
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
    } else if (o.fallado) {
      ctx.fillStyle = '#ef4444'; // Fallo rojo
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#22c55e'; // Verde de inserción
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 6;
    }

    ctx.fill();
    ctx.shadowBlur = 0;
  }
}