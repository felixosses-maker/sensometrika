/* ==========================================================================
   REACTÍMETRO (TIEMPO DE REACCIÓN SIMPLE Y COMPLEJO) - SENSOMETRIKA
   Baremos D.S. N° 170:
   - Velocidad: Clase B <= 450 ms | Clase A / Faena <= 350 ms
   - Tolerancia de Anticipaciones: Máximo 2 permitidas
   ========================================================================== */

const luzVerde = document.getElementById('luz-verde');
const luzRoja = document.getElementById('luz-roja');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const contenedorAccion = document.getElementById('contenedor-accion');
const badgeModo = document.getElementById('badge-modo');
const txtCabecera = document.getElementById('txt-tiempo-cabecera');

const lblUltimo = document.getElementById('metrica-tiempo');
const lblPromedio = document.getElementById('metrica-promedio');
const lblAnticipaciones = document.getElementById('metrica-anticipaciones');

// ESTADOS: 'INACTIVO' | 'ESPERANDO_ROJA' | 'ROJA_ENCENDIDA'
let estadoActual = 'INACTIVO';
let fase = 'DEMO'; // 'DEMO' (5 ensayos) | 'OFICIAL' (10 estímulos a ciegas)
let intentoActual = 0;
const TOTAL_DEMO = 5;
const TOTAL_OFICIAL = 10;

let tiempos = [];
let anticipaciones = 0;
let tiempoInicioEstimulo = 0;
let timeoutSemaforo = null;

function manejarBotonPrincipal() {
  if (estadoActual === 'INACTIVO') {
    iniciarSecuenciaEstimulo();
  } else if (estadoActual === 'ESPERANDO_ROJA') {
    registrarAnticipacion();
  } else if (estadoActual === 'ROJA_ENCENDIDA') {
    registrarFrenada();
  }
}

function iniciarSecuenciaEstimulo() {
  estadoActual = 'ESPERANDO_ROJA';

  luzVerde.classList.remove('apagada');
  luzVerde.classList.add('encendida');
  luzRoja.classList.add('apagada');
  luzRoja.classList.remove('encendida');

  panelEstado.innerText = 'Atento: mantén la calma y frena solo ante la luz ROJA';
  panelEstado.style.color = '#38bdf8';

  btnAccion.innerText = '¡FRENAR!';
  btnAccion.classList.add('btn-frenar');

  // Intervalo aleatorio anti-anticipación (1.8 a 4.2 segundos)
  const demora = Math.floor(Math.random() * (4200 - 1800 + 1)) + 1800;

  clearTimeout(timeoutSemaforo);
  timeoutSemaforo = setTimeout(() => {
    activarLuzRoja();
  }, demora);
}

function activarLuzRoja() {
  estadoActual = 'ROJA_ENCENDIDA';
  tiempoInicioEstimulo = performance.now();

  luzVerde.classList.add('apagada');
  luzVerde.classList.remove('encendida');
  luzRoja.classList.remove('apagada');
  luzRoja.classList.add('encendida');

  panelEstado.innerText = '¡Frena ahora!';
  panelEstado.style.color = '#ef4444';
}

function registrarAnticipacion() {
  clearTimeout(timeoutSemaforo);
  estadoActual = 'INACTIVO';
  anticipaciones++;

  luzVerde.classList.add('apagada');
  luzVerde.classList.remove('encendida');

  lblAnticipaciones.innerText = anticipaciones;
  panelEstado.innerText = '⚠️ Anticipación: Frenaste antes de encenderse la luz roja';
  panelEstado.style.color = '#ef4444';

  btnAccion.classList.remove('btn-frenar');
  btnAccion.innerText = 'Reintentar Estímulo';
  btnAccion.style.backgroundColor = '#0284c7';
}

function registrarFrenada() {
  const tiempoFin = performance.now();
  const latencia = Math.round(tiempoFin - tiempoInicioEstimulo);
  estadoActual = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(40);

  luzRoja.classList.add('apagada');
  luzRoja.classList.remove('encendida');
  btnAccion.classList.remove('btn-frenar');
  btnAccion.style.backgroundColor = '#0284c7';

  intentoActual++;
  tiempos.push(latencia);

  lblUltimo.innerText = `${latencia} ms`;
  const promedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
  lblPromedio.innerText = `${promedio} ms`;

  // Feedback en tiempo real
  if (latencia <= 350) {
    panelEstado.innerText = `${latencia} ms: Rango Óptimo Profesional (Clase A)`;
    panelEstado.style.color = '#4ade80';
  } else if (latencia <= 450) {
    panelEstado.innerText = `${latencia} ms: Aprobado (Estándar Legal Clase B)`;
    panelEstado.style.color = '#38bdf8';
  } else {
    panelEstado.innerText = `${latencia} ms: Fuera de Estándar (> 450 ms)`;
    panelEstado.style.color = '#f87171';
  }

  if (fase === 'DEMO') {
    if (intentoActual < TOTAL_DEMO) {
      btnAccion.innerText = `Siguiente Ensayo Demo (${intentoActual + 1}/${TOTAL_DEMO})`;
    } else {
      concluirFaseDemo();
    }
  } else {
    // Fase oficial de 10 estímulos a ciegas
    if (intentoActual < TOTAL_OFICIAL) {
      btnAccion.innerText = 'Siguiente Estímulo Oficial';
    } else {
      concluirExamenOficial(promedio);
    }
  }
}

function concluirFaseDemo() {
  fase = 'OFICIAL';
  intentoActual = 0;
  tiempos = [];
  anticipaciones = 0;

  badgeModo.innerText = '🔴 Modo Oficial D.S. N° 170 (Calificatorio)';
  badgeModo.style.borderColor = '#ef4444';
  txtCabecera.innerText = 'Evaluación Activa (10 Estímulos)';

  lblUltimo.innerText = '-- ms';
  lblPromedio.innerText = '-- ms';
  lblAnticipaciones.innerText = '0';

  panelEstado.innerHTML = '✅ <strong>Calibración completada.</strong> Comenzando evaluación oficial a ciegas.';
  panelEstado.style.color = '#38bdf8';

  btnAccion.innerText = 'Iniciar Evaluación Oficial (10 Estímulos)';
  btnAccion.style.backgroundColor = '#16a34a';
}

function concluirExamenOficial(promedio) {
  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const datosUser = JSON.parse(localStorage.getItem('sensometrika_datos_usuario')) || {};
  
  const esEmpresa = (sesion.rol === 'empresa') || 
                    Boolean(localStorage.getItem('sensometrika_plan_empresa')) || 
                    (datosUser.empresa && datosUser.empresa.toLowerCase() !== 'particular');

  const umbralTiempo = esEmpresa ? 350 : 450;
  const tiempoOk = promedio <= umbralTiempo;
  const anticipacionesOk = anticipaciones <= 2;
  const aprobadoGlobal = tiempoOk && anticipacionesOk;

  // Persistencia para el informe final
  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipaciones,
    aprobado: aprobadoGlobal,
    umbralTiempo: umbralTiempo,
    fecha: new Date().toISOString()
  }));

  panelEstado.innerText = '';

  // GENERACIÓN DEL DIAGNÓSTICO ESPECÍFICO
  let tituloResultado = '';
  let colorBorde = '';
  let colorTexto = '';
  let detalleCausa = '';

  if (aprobadoGlobal) {
    colorBorde = '#22c55e';
    colorTexto = '#4ade80';
    if (promedio <= 350) {
      tituloResultado = `✅ Aprobado: Rango Profesional (${promedio} ms)`;
      detalleCausa = `Excelente desempeño: latencia óptima (≤ 350 ms) y control motor adecuado (${anticipaciones} anticipaciones).`;
    } else {
      tituloResultado = `✅ Aprobado: Estándar Normativo (${promedio} ms)`;
      detalleCausa = `Promedio conforme a norma Clase B (≤ 450 ms) con ${anticipaciones} anticipación(es) (tolerancia máx: 2).`;
    }
  } else {
    colorBorde = '#ef4444';
    colorTexto = '#f87171';

    // Diagnóstico exacto del motivo de reprobación
    if (tiempoOk && !anticipacionesOk) {
      tituloResultado = `⚠️ Fuera de Estándar: Exceso de Anticipaciones (${anticipaciones})`;
      detalleCausa = `Tu tiempo de frenado fue bueno (<strong>${promedio} ms ≤ ${umbralTiempo} ms</strong>), pero registraste <strong>${anticipaciones} anticipaciones</strong> (el D.S. N° 170 tolera máx. 2 por impulsividad motriz).`;
    } else if (!tiempoOk && anticipacionesOk) {
      tituloResultado = `⚠️ Fuera de Estándar: Latencia Lenta (${promedio} ms)`;
      detalleCausa = `Superaste el umbral reglamentario exigido (≤ ${umbralTiempo} ms), aunque tu control motor fue correcto (${anticipaciones} anticipaciones).`;
    } else {
      tituloResultado = `⚠️ Fuera de Estándar: Tiempo y Anticipaciones`;
      detalleCausa = `Promedio de frenado lento (${promedio} ms > ${umbralTiempo} ms) y exceso de anticipaciones (${anticipaciones} registradas, máx: 2).`;
    }
  }

  contenedorAccion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid ${colorBorde}; border-radius: 12px; padding: 16px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${colorTexto}; font-size: 1.02rem; margin: 0 0 6px 0;">
        ${tituloResultado}
      </h3>
      <p style="color: #94a3b8; font-size: 0.8rem; line-height: 1.4; margin: 0 0 14px 0;">
        ${detalleCausa}
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="palancas.html" class="btn-principal" style="text-decoration: none; background-color: #0284c7; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 0.92rem;">
          Continuar a Módulo 2 (Test de Palancas) →
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
          Regresar al Menú Principal
        </a>
      </div>
    </div>
  `;
}