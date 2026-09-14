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

// Modal de guía
const modalGuia = document.getElementById('modal-guia');
const btnGuiaModulo = document.getElementById('btn-guia-modulo');
const btnCerrarGuia = document.getElementById('btn-cerrar-guia');
const btnEntendidoGuia = document.getElementById('btn-entendido-guia');

if (btnGuiaModulo && modalGuia) {
  btnGuiaModulo.addEventListener('click', () => modalGuia.style.display = 'flex');
  btnCerrarGuia.addEventListener('click', () => modalGuia.style.display = 'none');
  btnEntendidoGuia.addEventListener('click', () => modalGuia.style.display = 'none');
  modalGuia.addEventListener('click', (e) => {
    if (e.target === modalGuia) modalGuia.style.display = 'none';
  });
}

let fase = 'DEMO'; // DEMO u OFICIAL
let estado = 'INACTIVO';
let tiempoInicio = 0;
let temporizadorVerde = null;
let historialTiempos = [];
let totalAnticipaciones = 0;
let intentosFase = 0;

// Parámetros normativos
const LIMITE_DEMO = 5;       // 5 estímulos de calibración
const LIMITE_OFICIAL = 10;   // 10 estímulos oficiales según gabinete municipal

btnAccion.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (estado === 'INACTIVO') {
    iniciarCiclo();
  } else if (estado === 'ESPERANDO_ROJO') {
    registrarAnticipacion();
  } else if (estado === 'ROJO_ACTIVO') {
    registrarFrenada();
  }
});

function iniciarCiclo() {
  estado = 'ESPERANDO_ROJO';
  luzVerde.classList.add('encendida');
  luzVerde.classList.remove('apagada');
  luzRoja.classList.remove('encendida');
  luzRoja.classList.add('apagada');

  panelEstado.innerText = 'Atento: ¡Frena únicamente ante la luz ROJA!';
  panelEstado.style.color = '#38bdf8';
  btnAccion.innerText = '¡FRENAR!';
  btnAccion.style.backgroundColor = '#dc2626';

  // Espera estocástica entre 1.6 s y 4.8 s para eliminar la mecanización
  const retardoAleatorio = Math.floor(Math.random() * (4800 - 1600 + 1)) + 1600;

  temporizadorVerde = setTimeout(() => {
    estado = 'ROJO_ACTIVO';
    luzVerde.classList.remove('encendida');
    luzVerde.classList.add('apagada');
    luzRoja.classList.add('encendida');
    luzRoja.classList.remove('apagada');
    tiempoInicio = performance.now();
  }, retardoAleatorio);
}

function registrarAnticipacion() {
  clearTimeout(temporizadorVerde);
  estado = 'INACTIVO';
  totalAnticipaciones++;
  metricaAnticipaciones.innerText = totalAnticipaciones;

  luzVerde.classList.remove('encendida');
  luzVerde.classList.add('apagada');

  panelEstado.innerText = '¡Anticipación! Pulsaste antes de la luz roja (Falta Grave)';
  panelEstado.style.color = '#f87171';

  intentosFase++;
  verificarFinFase();
}

function registrarFrenada() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(50);

  historialTiempos.push(latencia);
  metricaTiempo.innerText = `${latencia} ms`;

  const promedio = Math.round(
    historialTiempos.reduce((acc, curr) => acc + curr, 0) / historialTiempos.length
  );
  metricaPromedio.innerText = `${promedio} ms`;

  if (latencia <= 350) {
    panelEstado.innerText = `${latencia} ms: Rango Óptimo Profesional (Clase A)`;
    panelEstado.style.color = '#4ade80';
  } else if (latencia <= 450) {
    panelEstado.innerText = `${latencia} ms: Rango Aprobado Particular (Clase B)`;
    panelEstado.style.color = '#facc15';
  } else {
    panelEstado.innerText = `${latencia} ms: Fuera de rango municipal`;
    panelEstado.style.color = '#f87171';
  }

  intentosFase++;
  verificarFinFase();
}

function verificarFinFase() {
  if (fase === 'DEMO' && intentosFase >= LIMITE_DEMO) {
    // Paso automático a Evaluación Oficial
    fase = 'OFICIAL';
    intentosFase = 0;
    historialTiempos = [];
    totalAnticipaciones = 0;
    metricaTiempo.innerText = '-- ms';
    metricaPromedio.innerText = '-- ms';
    metricaAnticipaciones.innerText = '0';

    badgeModo.innerText = '🔴 Evaluación Oficial D.S. N° 170';
    badgeModo.style.borderColor = '#ef4444';
    txtTiempoCabecera.innerHTML = 'Evaluación Activa';

    panelEstado.innerText = '¡Calibración completada! Inicia la Evaluación Oficial';
    panelEstado.style.color = '#38bdf8';
    btnAccion.innerText = 'Comenzar Evaluación Oficial';
    btnAccion.style.backgroundColor = '#0284c7';
  } else if (fase === 'OFICIAL' && intentosFase >= LIMITE_OFICIAL) {
    finalizarModuloOficial();
  } else {
    // Botón ciego sin contadores de ansiedad
    btnAccion.innerText = 'Siguiente Estímulo';
    btnAccion.style.backgroundColor = '#0284c7';
  }
}

function finalizarModuloOficial() {
  btnAccion.disabled = true;
  btnAccion.style.opacity = '0.5';
  btnAccion.innerText = 'Módulo 1 Completado';

  const promedioFinal = historialTiempos.length > 0 
    ? Math.round(historialTiempos.reduce((acc, curr) => acc + curr, 0) / historialTiempos.length) 
    : 0;
  
  const aprobado = promedioFinal > 0 && promedioFinal <= 450 && totalAnticipaciones === 0;

  // Persistencia oficial
  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    promedio: promedioFinal,
    anticipaciones: totalAnticipaciones,
    aprobado: aprobado,
    tiempos: historialTiempos
  }));

  // Descontar ejecución del saldo contratado
  if (typeof SessionTimer !== 'undefined') {
    SessionTimer.descontarEjecucion('reactimetro');
  }

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; box-sizing: border-box;">
      <h3 style="color: #4ade80; font-size: 1.05rem; margin: 0 0 6px 0;">¡Módulo 1 Finalizado!</h3>
      <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0;">
        Promedio oficial: <strong style="color: #fff;">${promedioFinal} ms</strong> (${aprobado ? 'Aprobado' : 'Observado'})
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="palancas.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 44px; font-size: 0.9rem; background-color: #0284c7; color: #fff; border-radius: 8px; font-weight: bold;">
          Continuar a Módulo 2 (Palancas) →
        </a>
        <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
          Regresar al Menú Principal
        </a>
      </div>
    </div>
  `;
}