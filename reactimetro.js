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

let modo = 'DEMO'; // 'DEMO' (5 ensayos de prueba) u 'OFICIAL' (10 estímulos reglamentarios)
let estado = 'INACTIVO'; // 'INACTIVO', 'ESPERANDO_ROJO', 'ROJO_ACTIVO', 'PAUSA_ENTRE_FASES'
let tiempoInicio = 0;
let temporizadorVerde = null;

let tiemposDemo = [];
let tiemposOficiales = [];
let anticipacionesOficiales = 0;
let contadorEnsayosDemo = 0;

// Configuración interna (ciega para el postulante)
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

  // Evaluación en tiempo real según D.S. N° 170
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

  if (modo === 'DEMO') {
    tiemposDemo.push(latencia);
    contadorEnsayosDemo++;

    if (contadorEnsayosDemo < MAX_ENSAYOS_DEMO) {
      btnAccion.innerText = 'Siguiente Ensayo Demo';
      btnAccion.style.backgroundColor = '#0284c7';
    } else {
      estado = 'PAUSA_ENTRE_FASES';
      panelEstado.innerText = 'Calibración lista. Presiona abajo para iniciar la evaluación oficial.';
      panelEstado.style.color = '#4ade80';

      btnAccion.innerText = 'Iniciar Evaluación Oficial';
      btnAccion.style.backgroundColor = '#22c55e';
    }
  } else {
    // Fase Oficial a ciegas (sin mostrar contadores de progreso)
    tiemposOficiales.push(latencia);
    const promedio = Math.round(
      tiemposOficiales.reduce((acc, curr) => acc + curr, 0) / tiemposOficiales.length
    );
    metricaPromedio.innerText = `${promedio} ms`;

    if (tiemposOficiales.length < MAX_INTENTOS_OFICIALES) {
      btnAccion.innerText = 'Siguiente Estímulo Oficial';
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
  txtTiempoCabecera.innerHTML = 'Evaluación Activa';

  metricaTiempo.innerText = '-- ms';
  metricaPromedio.innerText = '-- ms';
  metricaAnticipaciones.innerText = '0';

  iniciarEstimulo();
}

function finalizarModuloReactimetro(promedio) {
  btnAccion.style.display = 'none';

  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: promedio,
    anticipaciones: anticipacionesOficiales,
    aprobado: promedio <= 450
  }));

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%;">
      <h3 style="color: #4ade80; margin: 0 0 6px 0; font-size: 1.1rem;">¡Módulo 1 Finalizado con Éxito!</h3>
      <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 14px;">
        Latencia promedio oficial: <strong style="color: #ffffff;">${promedio} ms</strong> | Anticipaciones: <strong style="color: #ffffff;">${anticipacionesOficiales}</strong>
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