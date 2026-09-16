/**
 * Sensometrika - Módulo 3: Test de Punteo (Tambor de Lahy)
 * Estandarizado D.S. N° 170 MTT
 * Arquitectura: 1 Demo de 15s + Simulaciones Oficiales (30s) según Plan
 * Sincronización exacta de identificadores, animación fluida y reporte acumulado.
 */

const canvas = document.getElementById('lienzo-punteo');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo');
const lblTiempo = document.getElementById('lbl-tiempo');
const metricaAciertos = document.getElementById('metrica-aciertos');
const metricaFallos = document.getElementById('metrica-fallos');
const metricaEfectividad = document.getElementById('metrica-efectividad');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-punteo');
const zonaFinal = document.getElementById('zona-final-punteo');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let enJuego = false;
let animId = null;
let temporizador = null;
let tiempoRestante = 15;

let aciertos = 0;
let fallos = 0;
let orificios = [];
let ultimoSpawn = 0;
const totalCarriles = 4;
let anchoCarril = canvas.width / totalCarriles;
const velocidadTambor = 2.6;

document.addEventListener('DOMContentLoaded', () => {
  const demoListo = localStorage.getItem('sensometrika_punteo_demo_ok') === 'true';
  if (demoListo) {
    configurarModoOficial();
  } else {
    configurarModoDemo();
  }

  vincularEventos();
  redibujar();
});

function configurarModoDemo() {
  modo = 'DEMO';
  tiempoRestante = 15;
  badgeModo.innerText = '🟡 Demo Calibración (15 s)';
  badgeModo.style.color = '#facc15';
  lblTiempo.innerText = '15 s';

  panelEstado.innerText = 'CALIBRACIÓN RÍTMICA (Demo 15s): Pulsa los círculos dorados';
  panelEstado.style.color = '#38bdf8';

  btnIniciar.innerText = 'Iniciar Calibración (15 s)';
  btnIniciar.style.display = 'block';
  btnIniciar.style.backgroundColor = '#0284c7';
}

function configurarModoOficial() {
  modo = 'OFICIAL';
  tiempoRestante = 30;

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  let cuotaMax = 3;
  if (sesion.planId && sesion.planId.includes('full')) cuotaMax = 8;
  else if (sesion.planId && (sesion.planId.includes('plus') || sesion.planId.includes('semi'))) cuotaMax = 5;

  const hPunt = JSON.parse(localStorage.getItem('sensometrika_historial_punteo')) || [];
  const intentoActual = Math.min(cuotaMax, hPunt.length + 1);

  badgeModo.innerText = `🔴 Simulación Oficial ${intentoActual} de ${cuotaMax} (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  lblTiempo.innerText = '30 s';

  panelEstado.innerText = `EVALUACIÓN OFICIAL (30s): Mantén efectividad ≥ 80% (Intento ${intentoActual}/${cuotaMax})`;
  panelEstado.style.color = '#facc15';

  btnIniciar.innerText = `Iniciar Simulación Oficial (${intentoActual} de ${cuotaMax})`;
  btnIniciar.style.display = 'block';
  btnIniciar.style.backgroundColor = '#16a34a';
}

function vincularEventos() {
  // Manejador del botón principal
  btnIniciar.addEventListener('click', () => {
    if (!enJuego) arrancarPrueba();
  });

  // Detección de toques sobre el tambor (Pointer events para móvil y PC)
  canvas.addEventListener('pointerdown', (e) => {
    if (!enJuego) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    let aciertoEncontrado = false;
    for (let o of orificios) {
      if (!o.tocado) {
        const d = Math.hypot(clickX - o.x, clickY - o.y);
        if (d <= o.radio + 14) { // Zona de tolerancia ampliada
          o.tocado = true;
          aciertos++;
          aciertoEncontrado = true;
          if ('vibrate' in navigator) navigator.vibrate(30);
          break;
        }
      }
    }

    if (!aciertoEncontrado) {
      fallos++;
    }

    actualizarMetricas();
  });
}

function arrancarPrueba() {
  enJuego = true;
  aciertos = 0;
  fallos = 0;
  orificios = [];
  ultimoSpawn = performance.now();

  metricaAciertos.innerText = '0';
  metricaFallos.innerText = '0';
  metricaEfectividad.innerText = '-- %';

  btnIniciar.style.display = 'none';
  zonaFinal.innerHTML = '';

  clearInterval(temporizador);
  temporizador = setInterval(() => {
    tiempoRestante--;
    lblTiempo.innerText = `${tiempoRestante} s`;
    if (tiempoRestante <= 0) {
      finalizarPrueba();
    }
  }, 1000);

  bucleAnimacion();
}

function bucleAnimacion() {
  if (!enJuego) return;

  const ahora = performance.now();

  // Generar orificios a cadencia regular
  if (ahora - ultimoSpawn > 550) {
    const carril = Math.floor(Math.random() * totalCarriles);
    orificios.push({
      x: carril * anchoCarril + (anchoCarril / 2),
      y: -15,
      radio: 13,
      tocado: false
    });
    ultimoSpawn = ahora;
  }

  // Desplazar orificios
  for (let i = orificios.length - 1; i >= 0; i--) {
    let o = orificios[i];
    o.y += velocidadTambor;

    // Si escapa de la zona de inserción sin ser pulsado
    if (o.y > canvas.height + 20) {
      if (!o.tocado) {
        fallos++;
        actualizarMetricas();
      }
      orificios.splice(i, 1);
    }
  }

  redibujar();
  animId = requestAnimationFrame(bucleAnimacion);
}

function actualizarMetricas() {
  metricaAciertos.innerText = aciertos;
  metricaFallos.innerText = fallos;
  const total = aciertos + fallos;
  const ef = total > 0 ? Math.round((aciertos / total) * 100) : 100;
  metricaEfectividad.innerText = `${ef}%`;
}

function redibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Rejilla técnica de fondo
  ctx.strokeStyle = '#0a1628';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 25) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }

  // 2. Carriles guía del tambor
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  for (let c = 1; c < totalCarriles; c++) {
    ctx.beginPath();
    ctx.moveTo(c * anchoCarril, 0);
    ctx.lineTo(c * anchoCarril, canvas.height);
    ctx.stroke();
  }

  // 3. Franja óptima de inserción (Sector calibrado iluminado)
  const yZona = canvas.height - 110;
  const hZona = 70;
  ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
  ctx.fillRect(0, yZona, canvas.width, hZona);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, yZona, canvas.width, hZona);

  // 4. Dibujar orificios rotatorios
  orificios.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);
    if (o.tocado) {
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function finalizarPrueba() {
  enJuego = false;
  clearInterval(temporizador);
  cancelAnimationFrame(animId);

  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;

  if (modo === 'DEMO') {
    localStorage.setItem('sensometrika_punteo_demo_ok', 'true');
    panelEstado.innerText = `¡Calibración completada! Efectividad lograda: ${efectividad}%`;
    panelEstado.style.color = '#4ade80';

    zonaFinal.innerHTML = `
      <div style="background: #0f172a; border: 1.5px solid #0284c7; border-radius: 10px; padding: 14px; text-align: center; margin-top: 10px;">
        <h3 style="color: #38bdf8; margin: 0 0 6px 0; font-size: 1rem;">¡Ritmo de Tambor Asimilado!</h3>
        <p style="color: #94a3b8; font-size: 0.78rem; margin: 0 0 12px 0;">Has probado la franja de inserción. Ya puedes rendir tu simulación oficial.</p>
        <button type="button" onclick="iniciarOficialDirectoPunteo()" style="width: 100%; height: 44px; background: #16a34a; color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.90rem; cursor: pointer;">
          Comenzar Simulación Oficial →
        </button>
      </div>
    `;
  } else {
    // OFICIAL (D.S. N° 170)
    const aprobado = efectividad >= 80;
    const motivoFalla = aprobado ? 'Aprobado' : `Efectividad bajo estándar normativo (${efectividad}% < 80%)`;

    // 1. Acumular en historial
    let hPunt = JSON.parse(localStorage.getItem('sensometrika_historial_punteo')) || [];
    const numSim = hPunt.length + 1;

    hPunt.push({
      simulacion: numSim,
      efectividad: efectividad,
      aciertos: aciertos,
      fallos: fallos,
      aprobado: aprobado,
      motivoFalla: motivoFalla
    });
    localStorage.setItem('sensometrika_historial_punteo', JSON.stringify(hPunt));

    // 2. Guardar resultado consolidado
    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      efectividad: efectividad,
      aciertos: aciertos,
      errores: fallos,
      aprobado: aprobado
    }));

    panelEstado.innerText = `Simulación ${numSim} finalizada: ${efectividad}% efectividad`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

    // Identificar siguiente destino según plan
    const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
    const permitidos = sesion.modulosPermitidos || ['reactimetro', 'palancas', 'punteo'];
    const tieneVisual = permitidos.includes('visual');
    const urlSiguiente = tieneVisual ? 'visual.html' : 'informe.html';
    const txtSiguiente = tieneVisual ? 'Continuar a Módulo 4 (Visual) →' : '📊 Ver Dictamen e Informe Final →';

    zonaFinal.innerHTML = `
      <div style="background: #0f172a; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 14px; text-align: center; margin-top: 10px;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.05rem;">
          ${aprobado ? '✔ Módulo 3 Superado' : '⚠ Módulo 3 Fuera de Norma'} (${efectividad}%)
        </h3>
        <p style="color: #cbd5e1; font-size: 0.85rem; margin: 0 0 4px 0;">
          Aciertos: <strong style="color: #4ade80;">${aciertos}</strong> | Fallos: <strong style="color: #ef4444;">${fallos}</strong>
        </p>
        <small style="color: #94a3b8; display: block; margin-bottom: 12px;">Estándar legal D.S. N° 170: ≥ 80% efectividad</small>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${urlSiguiente}" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 44px; background: #0284c7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 0.88rem; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);">
            ${txtSiguiente}
          </a>
          <a href="menu.html" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 38px; color: #94a3b8; text-decoration: none; font-size: 0.80rem; font-weight: 600;">
            ← Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

window.iniciarOficialDirectoPunteo = function() {
  zonaFinal.innerHTML = '';
  configurarModoOficial();
  arrancarPrueba();
};