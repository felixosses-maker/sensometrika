const luzVerde = document.getElementById('luz-verde');
const luzRoja = document.getElementById('luz-roja');
const panelEstado = document.getElementById('panel-estado');
const btnAccion = document.getElementById('btn-accion');
const metricaTiempo = document.getElementById('metrica-tiempo');
const metricaPromedio = document.getElementById('metrica-promedio');
const metricaAnticipaciones = document.getElementById('metrica-anticipaciones');

let estado = 'INACTIVO'; // 'INACTIVO', 'ESPERANDO_ROJO', 'ROJO_ACTIVO'
let tiempoInicio = 0;
let temporizadorVerde = null;
let historialTiempos = [];
let totalAnticipaciones = 0;

// Perfiles temporales para evitar la cadencia fija en cada intento
const PERFILES_RETARDO = [
  { min: 1500, max: 2300, etiqueta: 'Reflejo Rápido' },
  { min: 2400, max: 3700, etiqueta: 'Cadencia Estándar' },
  { min: 3800, max: 5000, etiqueta: 'Resistencia / Espera Larga' }
];

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

  panelEstado.innerText = 'Atento: mantén la calma y frena solo ante la luz ROJA';
  panelEstado.style.color = '#38bdf8';
  
  btnAccion.innerText = '¡FRENAR!';
  btnAccion.style.backgroundColor = '#dc2626';

  const perfil = PERFILES_RETARDO[Math.floor(Math.random() * PERFILES_RETARDO.length)];
  const retardoAleatorio = Math.floor(Math.random() * (perfil.max - perfil.min + 1)) + perfil.min;

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

  panelEstado.innerText = '¡Falsa Alarma! Pulsaste antes del cambio';
  panelEstado.style.color = '#f87171';
  restablecerBoton();
}

function registrarFrenada() {
  const tiempoFinal = performance.now();
  const latencia = Math.round(tiempoFinal - tiempoInicio);
  estado = 'INACTIVO';

  if ('vibrate' in navigator) navigator.vibrate(60);

  historialTiempos.push(latencia);
  metricaTiempo.innerText = `${latencia} ms`;

  const promedio = Math.round(
    historialTiempos.reduce((acc, curr) => acc + curr, 0) / historialTiempos.length
  );
  metricaPromedio.innerText = `${promedio} ms`;

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

  // Persistencia para el informe consolidado
  localStorage.setItem('sensometrika_reactimetro', JSON.stringify({
    tiempo: latencia,
    aprobado: latencia <= 450
  }));

  restablecerBoton();
}

function restablecerBoton() {
  btnAccion.innerText = 'Siguiente Intento';
  btnAccion.style.backgroundColor = '#0284c7';
}