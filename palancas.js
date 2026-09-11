const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');

const elCronometro = document.getElementById('cronometro');
const elContactos = document.getElementById('contador-toques');
const elEstado = document.getElementById('estado-evaluacion');
const panelMensaje = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar');

const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzq = document.getElementById('btn-izq');
const btnDer = document.getElementById('btn-der');

let puntero = { x: 35, y: 40, radio: 6, velocidad: 2.2 };
let teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };

let juegoActivo = false;
let toques = 0;
let tiempoRestante = 60;
let intervaloTiempo = null;
let tocandoBorde = false;
let indicePistaActual = 0;

// Banco de pistas para variar el trazado en cada intento
const CIRCUITOS = [
  {
    nombre: "Circuito A - Escalera Clásica",
    inicio: { x: 35, y: 40 },
    meta: { x: 275, y: 205, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 70, h: 30 },
      { x: 60, y: 25, w: 30, h: 100 },
      { x: 60, y: 95, w: 130, h: 30 },
      { x: 160, y: 95, w: 30, h: 90 },
      { x: 160, y: 155, w: 140, h: 30 },
      { x: 270, y: 155, w: 30, h: 80 }
    ]
  },
  {
    nombre: "Circuito B - Doble Escuadra Invertida",
    inicio: { x: 35, y: 40 },
    meta: { x: 40, y: 215, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 280, h: 30 },
      { x: 270, y: 25, w: 30, h: 110 },
      { x: 120, y: 105, w: 180, h: 30 },
      { x: 120, y: 105, w: 30, h: 100 },
      { x: 30, y: 175, w: 120, h: 30 },
      { x: 30, y: 175, w: 35, h: 70 }
    ]
  },
  {
    nombre: "Circuito C - Zigzag Sinuoso",
    inicio: { x: 35, y: 40 },
    meta: { x: 280, y: 215, w: 22, h: 22 },
    tramos: [
      { x: 20, y: 25, w: 30, h: 140 },
      { x: 20, y: 135, w: 120, h: 30 },
      { x: 110, y: 55, w: 30, h: 110 },
      { x: 110, y: 55, w: 130, h: 30 },
      { x: 210, y: 55, w: 30, h: 130 },
      { x: 210, y: 155, w: 90, h: 30 },
      { x: 270, y: 155, w: 35, h: 85 }
    ]
  }
];

let circuitoActual = CIRCUITOS[0];

function alternarPista() {
  indicePistaActual = (indicePistaActual + 1) % CIRCUITOS.length;
  circuitoActual = CIRCUITOS[indicePistaActual];
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
  requestAnimationFrame(actualizar);
}

btnIniciar.addEventListener('click', () => {
  alternarPista();

  toques = 0;
  tiempoRestante = 60;
  tocandoBorde = false;
  juegoActivo = true;

  elContactos.innerText = "0";
  elCronometro.innerText = "60 s";
  elEstado.innerText = "En curso";
  elEstado.style.color = "#38bdf8";

  panelMensaje.innerText = `Pista asignada: ${circuitoActual.nombre}`;
  panelMensaje.style.color = "#f8fafc";
  btnIniciar.innerText = "Reiniciar Pista";

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

  const tiempoUsado = 60 - tiempoRestante;
  const aprobado = completado && toques <= 3;

  localStorage.setItem('sensometrika_palancas', JSON.stringify({
    toques: toques,
    tiempo: tiempoUsado,
    aprobado: aprobado
  }));

  if (completado && toques <= 3) {
    elEstado.innerText = "APROBADO";
    elEstado.style.color = "#4ade80";
    panelMensaje.innerText = `Completado en ${tiempoUsado} s con ${toques} contacto(s).`;
    panelMensaje.style.color = "#4ade80";
  } else if (!completado) {
    elEstado.innerText = "TIEMPO AGOTADO";
    elEstado.style.color = "#f87171";
    panelMensaje.innerText = "Reprobado: Se superó el límite de 60 segundos.";
    panelMensaje.style.color = "#f87171";
  } else {
    elEstado.innerText = "REPROBADO";
    elEstado.style.color = "#f87171";
    panelMensaje.innerText = `Reprobado por toques (${toques} contactos. Máximo: 3).`;
    panelMensaje.style.color = "#f87171";
  }

  renderizar();
}

function vincularBoton(btn, direccion) {
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

window.addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'W') teclas.arriba = true;
  if (e.key === 's' || e.key === 'S') teclas.abajo = true;
  if (e.key === 'ArrowLeft') teclas.izquierda = true;
  if (e.key === 'ArrowRight') teclas.derecha = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'w' || e.key === 'W') teclas.arriba = false;
  if (e.key === 's' || e.key === 'S') teclas.abajo = false;
  if (e.key === 'ArrowLeft') teclas.izquierda = false;
  if (e.key === 'ArrowRight') teclas.derecha = false;
});

renderizar();