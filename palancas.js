const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');
const elCronometro = document.getElementById('cronometro');
const elContactos = document.getElementById('contador-toques');
const elEstado = document.getElementById('estado-evaluacion');
const panelMensaje = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar');
const txtModo = document.getElementById('txt-modo-palancas');
const txtTiempoCabecera = document.getElementById('txt-tiempo-cabecera');
const seccionMandos = document.getElementById('seccion-mandos');
const zonaCoordinacion = document.getElementById('zona-coordinacion-palancas');

const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

let modo = 'DEMO'; // 'DEMO' (20 s) u 'OFICIAL' (60 s)
let juegoActivo = false;
let toques = 0;
let tiempoLimite = 20;
let tiempoRestante = 20;
let intervaloTiempo = null;
let animacionLoop = null;
let tocandoBorde = false;

let puntero = { x: 35, y: 40, radio: 6, velocidad: 2.2 };
let teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };

// BANCO DE 4 PISTAS DINÁMICAS (Para evitar que se memorice la secuencia)
const CIRCUITOS = [
  {
    nombre: "Pista A - Escalera Clásica",
    inicio: { x: 35, y: 40 },
    meta: { x: 275, y: 195, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 70, h: 30 },
      { x: 60, y: 25, w: 30, h: 90 },
      { x: 60, y: 85, w: 130, h: 30 },
      { x: 160, y: 85, w: 30, h: 80 },
      { x: 160, y: 145, w: 140, h: 30 },
      { x: 270, y: 145, w: 30, h: 75 }
    ]
  },
  {
    nombre: "Pista B - Bayoneta Invertida",
    inicio: { x: 35, y: 40 },
    meta: { x: 40, y: 195, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 275, h: 30 },
      { x: 265, y: 25, w: 30, h: 95 },
      { x: 120, y: 90, w: 175, h: 30 },
      { x: 120, y: 90, w: 30, h: 85 },
      { x: 30, y: 155, w: 120, h: 30 },
      { x: 30, y: 155, w: 35, h: 60 }
    ]
  },
  {
    nombre: "Pista C - Zigzag Asimétrico",
    inicio: { x: 35, y: 40 },
    meta: { x: 275, y: 200, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 30, h: 140 },
      { x: 20, y: 135, w: 120, h: 30 },
      { x: 110, y: 45, w: 30, h: 120 },
      { x: 110, y: 45, w: 120, h: 30 },
      { x: 200, y: 45, w: 30, h: 130 },
      { x: 200, y: 145, w: 100, h: 30 },
      { x: 270, y: 145, w: 30, h: 75 }
    ]
  },
  {
    nombre: "Pista D - Horquilla Perimetral",
    inicio: { x: 275, y: 40 },
    meta: { x: 150, y: 125, w: 22, h: 22 },
    tramos: [
      { x: 40, y: 25, w: 255, h: 30 },
      { x: 40, y: 25, w: 30, h: 180 },
      { x: 40, y: 185, w: 255, h: 30 },
      { x: 265, y: 95, w: 30, h: 120 },
      { x: 140, y: 95, w: 155, h: 30 },
      { x: 140, y: 95, w: 30, h: 55 }
    ]
  }
];

let circuitoActual = CIRCUITOS[0];

function seleccionarPistaAleatoria() {
  const indiceAzar = Math.floor(Math.random() * CIRCUITOS.length);
  circuitoActual = CIRCUITOS[indiceAzar];
  puntero.x = circuitoActual.inicio.x;
  puntero.y = circuitoActual.inicio.y;
}

function renderizar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1e293b";
  circuitoActual.tramos.forEach(tramo => {
    ctx.fillRect(tramo.x, tramo.y, tramo.w, tramo.h);
  });

  const m = circuitoActual.meta;
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(m.x, m.y, m.w, m.h);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText("META", m.x - 2, m.y + 30);

  ctx.beginPath();
  ctx.arc(puntero.x, puntero.y, puntero.radio, 0, Math.PI * 2);
  ctx.fillStyle = tocandoBorde ? "#ef4444" : "#38bdf8";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.closePath();
}

function actualizar() {
  if (!juegoActivo) return;

  if (teclas.arriba) puntero.y -= puntero.velocidad;
  if (teclas.abajo) puntero.y += puntero.velocidad;
  if (teclas.izquierda) puntero.x -= puntero.velocidad;
  if (teclas.derecha) puntero.x += puntero.velocidad;

  let dentroDeCanal = circuitoActual.tramos.some(tramo => {
    return (
      puntero.x - puntero.radio >= tramo.x &&
      puntero.x + puntero.radio <= tramo.x + tramo.w &&
      puntero.y - puntero.radio >= tramo.y &&
      puntero.y + puntero.radio <= tramo.y + tramo.h
    );
  });

  if (!dentroDeCanal) {
    if (!tocandoBorde) {
      tocandoBorde = true;
      toques++;
      elContactos.innerText = toques;
      if ('vibrate' in navigator) navigator.vibrate(40);
    }
  } else {
    tocandoBorde = false;
  }

  const m = circuitoActual.meta;
  if (
    puntero.x >= m.x &&
    puntero.x <= m.x + m.w &&
    puntero.y >= m.y &&
    puntero.y <= m.y + m.h
  ) {
    finalizarPrueba(true);
    return;
  }

  renderizar();
  animacionLoop = requestAnimationFrame(actualizar);
}

btnIniciar.addEventListener('click', () => {
  seleccionarPistaAleatoria();

  toques = 0;
  tocandoBorde = false;
  juegoActivo = true;

  tiempoRestante = (modo === 'DEMO') ? 20 : 60;
  tiempoLimite = tiempoRestante;

  elContactos.innerText = "0";
  elCronometro.innerText = `${tiempoRestante} s`;
  elEstado.innerText = "En curso";
  elEstado.style.color = "#38bdf8";

  btnIniciar.style.display = 'none';
  panelMensaje.innerText = (modo === 'DEMO') 
    ? `Demo de Calibración: ${circuitoActual.nombre}` 
    : `Oficial: ${circuitoActual.nombre}`;
  panelMensaje.style.color = "#f8fafc";

  clearInterval(intervaloTiempo);
  intervaloTiempo = setInterval(() => {
    tiempoRestante--;
    elCronometro.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      finalizarPrueba(false);
    }
  }, 1000);

  actualizar();
});

function finalizarPrueba(completado) {
  juegoActivo = false;
  clearInterval(intervaloTiempo);
  cancelAnimationFrame(animacionLoop);

  const tiempoUsado = tiempoLimite - tiempoRestante;

  if (modo === 'DEMO') {
    modo = 'OFICIAL';
    txtModo.innerText = '🔴 Modo Oficial D.S. N° 170 (Calificatorio)';
    txtModo.style.color = '#38bdf8';
    txtTiempoCabecera.innerHTML = 'Tiempo límite: <strong>60 s</strong>';

    elEstado.innerText = 'Calibrado';
    elEstado.style.color = '#4ade80';
    panelMensaje.innerText = 'Calibración lista. Presiona para rendir el examen oficial con un nuevo circuito.';
    btnIniciar.innerText = 'Iniciar Evaluación Oficial (60 s)';
    btnIniciar.style.display = 'block';
    renderizar();
  } else {
    seccionMandos.style.display = 'none';
    const aprobado = completado && toques <= 3;

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: toques,
      tiempo: tiempoUsado,
      aprobado: aprobado
    }));

    if (completado && toques <= 3) {
      elEstado.innerText = "APROBADO";
      elEstado.style.color = "#4ade80";
      panelMensaje.innerText = `${tiempoUsado} s: Aprobado (${toques} contactos)`;
      panelMensaje.style.color = "#4ade80";
    } else {
      elEstado.innerText = "REPROBADO";
      elEstado.style.color = "#f87171";
      panelMensaje.innerText = completado ? `Reprobado: ${toques} contactos (máx: 3)` : 'Reprobado: Tiempo límite de 60 s superado';
      panelMensaje.style.color = "#f87171";
    }

    renderizar();

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%;">
        <h3 style="color: #4ade80; margin: 0 0 6px 0; font-size: 1.1rem;">¡Módulo 2 Finalizado con Éxito!</h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 14px;">
          Contactos oficiales: <strong style="color: #ffffff;">${toques}</strong> | Tiempo empleado: <strong style="color: #ffffff;">${tiempoUsado} s</strong>
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="punteo.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7; font-size: 0.95rem;">
            Continuar a Módulo 3 (Test de Punteo) →
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

function vincularBoton(btn, direccion) {
  if (!btn) return;
  const activar = (e) => { e.preventDefault(); teclas[direccion] = true; };
  const desactivar = (e) => { e.preventDefault(); teclas[direccion] = false; };
  btn.addEventListener('pointerdown', activar);
  btn.addEventListener('pointerup', desactivar);
  btn.addEventListener('pointerleave', desactivar);
}

vincularBoton(btnArriba, 'arriba');
vincularBoton(btnAbajo, 'abajo');
vincularBoton(btnIzq, 'izquierda');
vincularBoton(btnDer, 'derecha');

puntero.x = circuitoActual.inicio.x;
puntero.y = circuitoActual.inicio.y;
renderizar();