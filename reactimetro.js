/* ==========================================================================
   REACTÍMETRO (TIEMPO DE REACCIÓN SIMPLE Y COMPLEJO) - SENSOMETRIKA
   Baremos D.S. N° 170:
   - Faena Crítica / Clase A: <= 400 ms
   - Estándar Legal Base / Clase B: 401 a 450 ms (Apto con Obs.)
   - Tolerancia de Anticipaciones: Máx 2 permitidas
   ========================================================================== */

const luzVerde = document.getElementById('luz-verde');
const luzRoja = document.getElementById('luz-roja');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const metricaTiempo = document.getElementById('metrica-tiempo');
const metricaPromedio = document.getElementById('metrica-promedio');
const metricaAnticipaciones = document.getElementById('metrica-anticipaciones');
const badgeModo = document.getElementById('badge-modo');
const txtTiempoCabecera = document.getElementById('txt-tiempo-cabecera');
const zonaCoordinacion = document.getElementById('zona-coordinacion-test');

let modo = 'DEMO'; // 'DEMO' (5 ensayos) u 'OFICIAL' (10 estímulos)
let estado = 'INACTIVO'; // 'INACTIVO', 'ESPERANDO_ROJO', 'ROJO_ACTIVO', 'PAUSA_ENTRE_FASES'
let tiempoInicio = 0;
let temporizadorVerde = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipacionesOficiales = 0;
let contadorEnsayosDemo = 0;

const MAX_ENSAYOS_DEMO = 5;
const MAX_INTENTOS_OFICIALES = 10;

function obtenerRetardoAleatorio() {
  return Math.floor(Math.random() * (4200 - 1700 + 1)) + 1700;
}

btnAccion.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  
  if (estado === 'INACTIVO') {
    iniciarEstimulo();
  } else if (estado === 'ESPERANDO_ROJO') {
    registrarAnticipacion();
  } else if (estado === 'ROJO_ACTIVO') {
    registrarFreno();
  } else if (estado === 'PAUSA_ENTRE_FASES') {
    iniciarFaseOficial();
  }
});

function iniciarEstimulo() {
  estado = 'ESPERANDO_ROJO';
  luzVerde.classList.add('encendida');
  luzVerde.classList.remove('apagada');
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  panelEstado.innerText = 'Atento: mantén la calma y frena solo ante la luz ROJA';
  panelEstado.style.color = '#38bdf8';
  
  btnAccion.innerText = '¡FRENAR!';
  btnAccion.style.backgroundColor = '#dc2626';

  const retardo = obtenerRetardoAleatorio();

  temporizadorVerde = setTimeout(() => {
    estado = 'ROJO_ACTIVO';
    luzVerde.classList.remove('encendida');
    luzVerde.classList.add('apagada');
    luzRoja.classList.add('encendida');
    luzRoja.classList.remove('apagada');
    tiempoInicio = performance.now();
  }, retardo);
}

function registrarAnticipacion() {
  clearTimeout(temporizadorVerde);
  estado = 'INACTIVO';

  luzVerde.classList.remove('encendida');
  luzVerde.classList.add('apagada');

  if (modo === 'OFICIAL') {
    anticipacionesOficiales++;
    metricaAnticipaciones.innerText = anticipacionesOficiales;
  }

  panelEstado.innerText = '⚠️ Anticipación: Frenaste antes de encenderse la luz roja';
  panelEstado.style.color = '#f87171';

  btnAccion.innerText = 'Reintentar Estímulo';
  btnAccion.style.backgroundColor = '#0284c7';
}

function registrarFreno() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(50);

  metricaTiempo.innerText = `${latencia} ms`;
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  // Evaluación en tiempo real ajustada a 400 ms
  if (latencia <= 400) {
    panelEstado.innerText = `${latencia} ms: Rango Óptimo Faena Crítica`;
    panelEstado.style.color = '#4ade80';
  } else if (latencia <= 450) {
    panelEstado.innerText = `${latencia} ms: Apto Clase B (Observación Faena)`;
    panelEstado.style.color = '#facc15';
  } else {
    panelEstado.innerText = `${latencia} ms: Fuera de Estándar Normativo (> 450 ms)`;
    panelEstado.style.color = '#f87171';
  }

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);
    contadorEnsayosDemo++;

    if (contadorEnsayosDemo < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = `Siguiente Ensayo Demo (${contadorEnsayosDemo + 1}/${MAX_ENSAYOS_DEMO})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      estado = 'PAUSA_ENTRE_FASES';
      panelEstado.innerText = 'Calibración lista (5 de 5). Presiona abajo para iniciar la evaluación oficial.';
      panelEstado.style.color = '#4ade80';

      btnAccion.innerText = 'Iniciar Evaluación Oficial (10 Estímulos)';
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    tiemposOficiales.push(latencia);
    const promedio = Math.round(
      tiemposOficiales.reduce((acc, curr) => acc + curr, 0) / tiemposOficiales.length
    );
    metricaPromedio.innerText = `${promedio} ms`;

    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      btnAccion.innerText = `Siguiente Estímulo Oficial (${tiemposOficiales.length + 1}/${MAX_INTENTOS_OFICIALES})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      finalizarModuloReactimetro(promedio);
    }
  }
}

function iniciarFaseOficial() {
  modo = 'OFICIAL';
  estado = 'INACTIVO';

  badgeModo.innerText = '🔴 Modo Oficial D.S. N° 170 (Calificatorio)';
  badgeModo.style.color = '#38bdf8';
  txtTiempoCabecera.innerHTML = 'Estímulos: <strong>10 pruebas oficiales</strong>';

  metricaTiempo.innerText = '-- ms';
  metricaPromedio.innerText = '-- ms';
  metricaAnticipaciones.innerText = '0';

  iniciarEstimulo();
}

function finalizarModuloReactimetro(promedio) {
  btnAccion.style.display = 'none';

  const tiempoOk = promedio <= 450;
  const anticipacionesOk = anticipacionesOficiales <= 2;
  const aptoFaena = promedio <= 400 && anticipacionesOk;
  const aprobadoLegal = tiempoOk && anticipacionesOk;

  // Persistir en localStorage
  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobadoLegal,
    aptoFaena: aptoFaena,
    fecha: new Date().toISOString()
  }));

  let colorResultado = '#22c55e';
  let textoTitulo = '✅ Aprobado: Óptimo Faena Crítica';
  let textoDetalle = `Promedio oficial: ${promedio} ms (≤ 400 ms). Latencia excelente para faena y transporte.`;

  if (!aprobadoLegal) {
    colorResultado = '#ef4444';
    if (!anticipacionesOk && tiempoOk) {
      textoTitulo = `⚠️ Fuera de Estándar: Exceso de Anticipaciones (${anticipacionesOficiales})`;
      textoDetalle = `Tiempo de frenado adecuado (${promedio} ms), pero superaste el límite reglamentario de anticipaciones (máx. 2).`;
    } else {
      textoTitulo = `⚠️ Fuera de Estándar Normativo (${promedio} ms)`;
      textoDetalle = `Supera el umbral reglamentario del D.S. N° 170 (≤ 450 ms).`;
    }
  } else if (!aptoFaena) {
    colorResultado = '#f59e0b';
    textoTitulo = '⚠️ Apto Estándar Legal Clase B (Obs. Faena)';
    textoDetalle = `Promedio oficial: ${promedio} ms. Cumple estándar legal nacional (≤ 450 ms) con observación para faenas de alta criticidad (≤ 400 ms).`;
  }

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid ${colorResultado}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${colorResultado}; margin: 0 0 6px 0; font-size: 1.05rem;">${textoTitulo}</h3>
      <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 14px; line-height: 1.4;">
        ${textoDetalle}
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="palancas.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7; font-size: 0.95rem;">
          Continuar a Módulo 2 (Test de Palancas) →
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}