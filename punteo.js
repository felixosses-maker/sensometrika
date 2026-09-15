/* ==========================================================================
   SENSOMETRIKA - MÓDULO 3: TEST DE PUNTEO (punteo.js)
   • 1 Demo de 15 s por módulo
   • Cuota dinámica (B2C: 3, 5, 8 | B2B: 1 de 1)
   • En B2B deriva a la firma del trabajador antes del informe
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

let modo = 'DEMO';
let pruebaActiva = false;
let intervalo = null;
let animacionFrame = null;

let tiempoRestante = 15;
let aciertos = 0;
let fallos = 0;

const franjaX = 110;
const franjaAncho = 110;

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

  if (!CreditManager.puedeRendir('punteo')) {
    bloquearModuloPorCupo();
    return;
  }

  if (CreditManager.demoYaRealizado('punteo')) {
    prepararVistaOficialDirecta();
  } else {
    orificios = generarOrificiosAleatorios();
    dibujarEscena();
  }
});

function bloquearModuloPorCupo() {
  const esEmpresa = CreditManager.esB2B();
  const max = CreditManager.obtenerLimiteModulo('punteo');
  btnIniciar.disabled = true;
  btnIniciar.style.opacity = '0.4';
  btnIniciar.innerText = esEmpresa ? 'Examen Oficial Realizado (Bloqueado)' : `Cupo Bloqueado (${max}/${max} Realizadas)`;
  panelEstado.innerText = esEmpresa ? 'Ya completaste tu examen oficial de este módulo.' : `Has alcanzado el límite de ${max} simulaciones oficiales para este módulo.`;
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">
        ${esEmpresa ? 'Tu examen oficial de Punteo ya fue registrado.' : 'Completaste todas las simulaciones de tu Plan en este módulo.'}
      </p>
      <a href="menu.html" class="btn-principal" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  pruebaActiva = false;
  const esEmpresa = CreditManager.esB2B();
  const actual = CreditManager.obtenerNumeroSimulacionActual('punteo');
  const max = CreditManager.obtenerLimiteModulo('punteo');

  badgeModo.innerText = esEmpresa ? '🔴 Examen Oficial B2B 1 de 1 (D.S. N° 170)' : `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  txtTiempo.innerHTML = 'Evaluación Activa';
  panelEstado.innerText = esEmpresa ? 'Presiona iniciar para tu Examen Oficial B2B.' : 'Presiona "Iniciar Simulación Oficial" para comenzar.';
  panelEstado.style.color = '#38bdf8';

  btnIniciar.style.display = 'block';
  btnIniciar.innerText = esEmpresa ? 'Iniciar Examen Oficial (1 de 1)' : `Iniciar Simulación Oficial (${actual} de ${max})`;
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
    tiempoRestante = 30;
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

  for (let o of orificios) {
    o.x -= velocidadTambor;

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

canvas.addEventListener('pointerdown', (e) => {
  if (!pruebaActiva) return;
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touchX = e.clientX - rect.left;
  const touchY = e.clientY - rect.top;

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
  const esEmpresa = CreditManager.esB2B();
  const max = CreditManager.obtenerLimiteModulo('punteo');

  if (modo === 'DEMO') {
    CreditManager.marcarDemoCompletado('punteo');
    const actual = CreditManager.obtenerNumeroSimulacionActual('punteo');
    panelEstado.innerText = esEmpresa ? `¡Calibración lista! Efectividad: ${efectividad}%. Listo para tu Examen Oficial 1 de 1.` : `¡Calibración lista! Efectividad: ${efectividad}%. Pasa a Simulación Oficial ${actual} de ${max}.`;
    panelEstado.style.color = '#4ade80';

    btnIniciar.style.display = 'block';
    btnIniciar.innerText = esEmpresa ? 'Iniciar Examen Oficial (1 de 1)' : `Iniciar Simulación Oficial (${actual} de ${max})`;
    btnIniciar.style.backgroundColor = '#22c55e';
    modo = 'OFICIAL';
  } else {
    const consumidas = CreditManager.registrarConsumo('punteo');
    const aprobado = efectividad >= 80 && aciertos >= 12;

    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      efectividad: efectividad,
      aciertos: aciertos,
      aprobado: aprobado
    }));

    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'punteo');
    const agotado = consumidas >= max;

    const sesion = CreditManager.obtenerSesion();
    const tieneVisual = sesion.modulosPermitidos && sesion.modulosPermitidos.includes('visual');
    
    let siguienteUrl = '';
    let textoBoton = '';

    if (tieneVisual) {
      siguienteUrl = 'visual.html';
      textoBoton = 'Continuar a Módulo 4 (Tamizaje Visual) →';
    } else if (esEmpresa) {
      // En B2B, al terminar la batería psicomotriz debe rubricar en menu.html
      siguienteUrl = 'menu.html';
      textoBoton = '✍️ Continuar a Firma del Trabajador Evaluado →';
    } else {
      siguienteUrl = 'informe.html';
      textoBoton = '📊 Ver Informe de Evaluación Global';
    }

    panelEstado.innerText = 'Evaluación Oficial completada.';

    const tituloCierre = esEmpresa ? '¡Examen Finalizado!' : `¡Simulación ${consumidas} de ${max} Finalizada!`;
    const leyendaCierre = esEmpresa 
      ? 'Evaluación oficial de Punteo 1 de 1 completada para la empresa.' 
      : (agotado ? `Has completado tus ${max}/${max} simulaciones en este módulo.` : `Te restan ${max - consumidas} simulación(es) en este módulo.`);

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#38bdf8' : '#ef4444'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
          ${tituloCierre}
        </h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 8px;">
          Efectividad oficial: <strong style="color: #fff;">${efectividad}%</strong> (${aciertos} aciertos) - ${aprobado ? 'Aprobado' : 'Observado'}
        </p>
        <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
          ${leyendaCierre}
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

  ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
  ctx.fillRect(franjaX, 0, franjaAncho, canvas.height);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(franjaX, 0, franjaAncho, canvas.height);

  for (let o of orificios) {
    if (o.x + o.radio < 0 || o.x - o.radio > canvas.width) continue;

    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2);

    if (o.tocado) {
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
    } else if (o.fallado) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 6;
    }

    ctx.fill();
    ctx.shadowBlur = 0;
  }
}