/* ==========================================================================
   SENSOMETRIKA - MÓDULO: PERCEPCIÓN DE PROFUNDIDAD / ESTEREOPSIS (estereopsis.js)
   • Evaluación de agudeza estereoscópica para maquinaria pesada y grúas
   ========================================================================== */

const btnIniciar = document.getElementById('btnIniciarEstereo');
const statusText = document.getElementById('statusText');
const badgeFase = document.getElementById('badgeFase');
const lblRonda = document.getElementById('lblRonda');
const lblAciertos = document.getElementById('lblAciertos');
const lblPrecision = document.getElementById('lblPrecision');
const bloquesGrid = document.getElementById('bloquesGrid');

let fase = 'DEMO';
let rondaActual = 0;
let totalRondas = 3;
let aciertos = 0;
let opcionCorrecta = 0;
let juegoActivo = false;

function obtenerMaximoSimulacionesEstereopsis() {
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') return 99;
  const esDemo = Boolean(sessionStorage.getItem('smk_token') || localStorage.getItem('sensometrika_demo_token'));
  if (esDemo) return 2;
  return 3;
}

btnIniciar.addEventListener('click', () => {
  if (!juegoActivo) {
    iniciarPrueba();
  }
});

function iniciarPrueba() {
  juegoActivo = true;
  rondaActual = 0;
  aciertos = 0;
  lblAciertos.innerText = '0';
  lblPrecision.innerText = '0%';
  
  badgeFase.innerText = fase === 'DEMO' ? '🟡 Estereopsis (Demo)' : '🔴 Estereopsis (Oficial)';
  statusText.innerText = 'Selecciona el bloque que percibes más cercano en cada ronda.';
  btnIniciar.disabled = true;
  btnIniciar.innerText = 'Prueba en curso...';

  siguienteRonda();
}

function siguienteRonda() {
  if (rondaActual >= totalRondas) {
    finalizarPrueba();
    return;
  }

  rondaActual++;
  lblRonda.innerText = `${rondaActual} / ${totalRondas}`;
  
  // Asignar aleatoriamente cuál bloque simula estar al frente (escala visual simulada con opacidad o tamaño)
  opcionCorrecta = Math.floor(Math.random() * 3);

  const bloques = bloquesGrid.children;
  for (let i = 0; i < bloques.length; i++) {
    // Simulamos profundidad visual alterando ligeramente la escala o sombra del elemento
    if (i === opcionCorrecta) {
      bloques[i].style.transform = 'scale(1.12)';
      bloques[i].style.borderColor = '#38bdf8';
      bloques[i].style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.4)';
    } else {
      bloques[i].style.transform = 'scale(0.95)';
      bloques[i].style.borderColor = '#334155';
      bloques[i].style.boxShadow = 'none';
    }
  }

  statusText.innerText = `Ronda ${rondaActual}: ¿Cuál elemento está más al frente?`;
}

window.seleccionarOpcion = function(index) {
  if (!juegoActivo) return;

  if (index === opcionCorrecta) {
    aciertos++;
    lblAciertos.innerText = aciertos;
    if ('vibrate' in navigator) navigator.vibrate(30);
  }

  const porcentaje = Math.round((aciertos / rondaActual) * 100);
  lblPrecision.innerText = `${porcentaje}%`;

  setTimeout(() => {
    siguienteRonda();
  }, 600);
};

function finalizarPrueba() {
  juegoActivo = false;
  const precisionFinal = Math.round((aciertos / totalRondas) * 100);

  if (fase === 'DEMO') {
    statusText.innerText = `Calibración lista (Aciertos: ${aciertos}/${totalRondas}). Iniciando Oficial...`;
    fase = 'OFICIAL';
    totalRondas = 5; // 5 rondas para la prueba oficial
    setTimeout(() => {
      iniciarPrueba();
    }, 2000);
  } else {
    statusText.innerText = `Prueba Oficial Completa. Precisión: ${precisionFinal}%`;
    btnIniciar.disabled = false;
    btnIniciar.innerText = 'Reiniciar Prueba';

    localStorage.setItem('sensometrika_estereopsis', JSON.stringify({
      precision: precisionFinal,
      aciertos,
      aprobado: precisionFinal >= 80
    }));

    alert(`Test de Percepción de Profundidad Finalizado\nPrecisión: ${precisionFinal}%\nEstado: ${precisionFinal >= 80 ? 'APROBADO' : 'OBSERVADO'}`);
    window.location.href = 'demo.html';
  }
}