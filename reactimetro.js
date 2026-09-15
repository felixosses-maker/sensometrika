/* ==========================================================================
   SENSOMETRIKA - MÓDULO 1: REACTÍMETRO (reactimetro.js)
   • Cuota dinámica (B2C: 3, 5, 8 | B2B: 1 de 1)
   • 1 Demo de 5 estímulos único por módulo
   • Textos formales adaptados por rol
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

let modo = 'DEMO';
let estado = 'INACTIVO';
let tiempoInicio = 0;
let temporizadorVerde = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipacionesOficiales = 0;
let contadorEnsayosDemo = 0;

const MAX_ENSAYOS_DEMO = 5;
const MAX_INTENTOS_OFICIALES = 10;

window.addEventListener('DOMContentLoaded', () => {
  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');

  if (!CreditManager.puedeRendir('reactimetro')) {
    bloquearModuloPorCupo();
    return;
  }

  if (CreditManager.demoYaRealizado('reactimetro')) {
    prepararVistaOficialDirecta();
  }
});

function bloquearModuloPorCupo() {
  const esEmpresa = CreditManager.esB2B();
  const max = CreditManager.obtenerLimiteModulo('reactimetro');
  btnAccion.disabled = true;
  btnAccion.style.opacity = '0.4';
  btnAccion.innerText = esEmpresa ? 'Examen Oficial Realizado (Bloqueado)' : `Cupo Bloqueado (${max}/${max} Realizadas)`;
  panelEstado.innerText = esEmpresa ? 'Ya completaste tu examen oficial de este módulo.' : `Has alcanzado el límite de ${max} simulaciones oficiales de tu Plan.`;
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">
        ${esEmpresa ? 'Tu examen oficial de Reactímetro ya quedó registrado.' : 'Completaste todas las simulaciones de tu Plan en este módulo.'}
      </p>
      <a href="menu.html" class="btn-principal" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  estado = 'INACTIVO';
  tiemposOficiales = [];
  anticipacionesOficiales = 0;

  const esEmpresa = CreditManager.esB2B();
  const actual = CreditManager.obtenerNumeroSimulacionActual('reactimetro');
  const max = CreditManager.obtenerLimiteModulo('reactimetro');

  badgeModo.innerText = esEmpresa ? '🔴 Examen Oficial B2B 1 de 1 (D.S. N° 170)' : `🔴 Simulación Oficial ${actual} de ${max} (D.S. N° 170)`;
  badgeModo.style.color = '#38bdf8';
  txtTiempoCabecera.innerHTML = 'Evaluación Activa (10 Estímulos)';
  panelEstado.innerText = esEmpresa ? 'Listo para iniciar Examen Oficial B2B.' : `Listo para iniciar Simulación Oficial ${actual} de ${max}.`;
  panelEstado.style.color = '#38bdf8';

  btnAccion.style.display = 'block';
  btnAccion.innerText = esEmpresa ? 'Iniciar Examen Oficial (1 de 1)' : `Iniciar Simulación Oficial (${actual} de ${max})`;
  btnAccion.style.backgroundColor = '#22c55e';
}

function obtenerRetardoAleatorio() {
  return Math.floor(Math.random() * (4200 - 1700 + 1)) + 1700;
}

btnAccion.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (btnAccion.disabled) return;

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

  panelEstado.innerText = 'Atento: Frena únicamente ante la luz ROJA';
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

  panelEstado.innerText = '¡Anticipación! Frenaste antes del cambio de luz';
  panelEstado.style.color = '#f87171';

  btnAccion.innerText = 'Reintentar Estímulo';
  btnAccion.style.backgroundColor = '#0284c7';
}

function registrarFreno() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(60);

  metricaTiempo.innerText = `${latencia} ms`;
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  if (latencia <= 350) {
    panelEstado.innerText = `${latencia} ms: Rango Óptimo - Nivel Profesional (Clase A)`;
    panelEstado.style.color = '#4ade80';
  } else if (latencia <= 450) {
    panelEstado.innerText = `${latencia} ms: Aprobado - Particular (Clase B)`;
    panelEstado.style.color = '#facc15';
  } else {
    panelEstado.innerText = `${latencia} ms: Fuera de rango municipal`;
    panelEstado.style.color = '#f87171';
  }

  const esEmpresa = CreditManager.esB2B();
  const max = CreditManager.obtenerLimiteModulo('reactimetro');

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);
    contadorEnsayosDemo++;

    if (contadorEnsayosDemo < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = `Siguiente Ensayo Demo (${contadorEnsayosDemo + 1}/${MAX_ENSAYOS_DEMO})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      CreditManager.marcarDemoCompletado('reactimetro');
      estado = 'PAUSA_ENTRE_FASES';
      const actual = CreditManager.obtenerNumeroSimulacionActual('reactimetro');
      panelEstado.innerText = esEmpresa ? 'Demo completado. Listo para tu Examen Oficial 1 de 1.' : `Demo completado. Listo para Simulación Oficial ${actual} de ${max}.`;
      panelEstado.style.color = '#4ade80';

      btnAccion.innerText = esEmpresa ? 'Iniciar Examen Oficial (1 de 1)' : `Iniciar Simulación Oficial (${actual} de ${max})`;
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    tiemposOficiales.push(latencia);
    const promedio = Math.round(
      tiemposOficiales.reduce((acc, curr) => acc + curr, 0) / tiemposOficiales.length
    );
    metricaPromedio.innerText = `${promedio} ms`;

    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      btnAccion.innerText = `Siguiente Estímulo (${tiemposOficiales.length + 1}/${MAX_INTENTOS_OFICIALES})`;
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      finalizarSimulacionReactimetro(promedio);
    }
  }
}

function iniciarFaseOficial() {
  prepararVistaOficialDirecta();
  iniciarEstimulo();
}

function finalizarSimulacionReactimetro(promedio) {
  btnAccion.style.display = 'none';

  const consumidas = CreditManager.registrarConsumo('reactimetro');
  const max = CreditManager.obtenerLimiteModulo('reactimetro');
  const esEmpresa = CreditManager.esB2B();
  const umbral = esEmpresa ? 350 : 450;
  const aprobado = promedio <= umbral && anticipacionesOficiales <= 2;

  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: aprobado
  }));

  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'reactimetro');
  const agotado = consumidas >= max;

  // Título corregido: '¡Examen Finalizado!' en B2B
  const tituloCierre = esEmpresa ? '¡Examen Finalizado!' : `¡Simulación ${consumidas} de ${max} Finalizada!`;
  const leyendaCierre = esEmpresa 
    ? 'Evaluación oficial 1 de 1 registrada con éxito para la empresa.' 
    : (agotado ? `Has completado tus ${max}/${max} simulaciones en este módulo.` : `Te restan ${max - consumidas} simulación(es) en este módulo.`);

  let bloqueBotones = '';
  if (!agotado && !esEmpresa) {
    bloqueBotones = `
      <button onclick="repetirSimulacionReactimetro()" class="btn-principal" style="width:100%; height:44px; background-color:#22c55e; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem; border:none; cursor:pointer; margin-bottom:8px;">
        🔄 Rendir Simulación ${consumidas + 1} de ${max} →
      </button>
      <a href="palancas.html" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:40px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.85rem;">
        Continuar a Módulo 2 (Palancas) →
      </a>
    `;
  } else {
    bloqueBotones = `
      <a href="palancas.html" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:44px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem; margin-bottom:8px;">
        Continuar a Módulo 2 (Palancas) →
      </a>
    `;
  }

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid ${aprobado ? '#38bdf8' : '#ef4444'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
      <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
        ${tituloCierre}
      </h3>
      <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 8px;">
        Latencia promedio: <strong style="color: #ffffff;">${promedio} ms</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
        ${leyendaCierre}
      </p>
      <div style="display: flex; flex-direction: column;">
        ${bloqueBotones}
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px; margin-top: 4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}

window.repetirSimulacionReactimetro = function() {
  zonaCoordinacion.innerHTML = '';
  metricaTiempo.innerText = '-- ms';
  metricaPromedio.innerText = '-- ms';
  metricaAnticipaciones.innerText = '0';
  prepararVistaOficialDirecta();
};