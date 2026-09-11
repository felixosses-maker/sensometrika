const canvas = document.getElementById('lienzo-punteo');
const ctx = canvas.getContext('2d');
const elAciertos = document.getElementById('metrica-aciertos');
const elFallos = document.getElementById('metrica-fallos');
const elEfectividad = document.getElementById('metrica-efectividad');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-punteo');

let activo = false;
let aciertos = 0;
let fallos = 0;
let circulos = [];
let temporizadorGeneracion = null;
let temporizadorFin = null;

function renderizar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Zona de inserción delimitada
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.strokeRect(130, 20, 80, 220);

  circulos.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radio, 0, Math.PI * 2);
    ctx.fillStyle = c.tocado ? "#94a3b8" : "#22c55e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  });
}

function programarSiguienteCirculo() {
  if (!activo) return;

  const velVariacion = 1.6 + Math.random() * 0.7; // Velocidad con microvariaciones
  circulos.push({
    x: -15,
    y: 40 + Math.random() * 180,
    radio: 14,
    velocidad: velVariacion,
    tocado: false
  });

  // Intervalo asimétrico para romper compases mecánicos
  const proximoIntervalo = Math.floor(Math.random() * (1900 - 1200 + 1)) + 1200;
  temporizadorGeneracion = setTimeout(programarSiguienteCirculo, proximoIntervalo);
}

function actualizar() {
  if (!activo) return;

  circulos.forEach(c => {
    c.x += c.velocidad;
  });

  circulos = circulos.filter(c => {
    if (c.x > canvas.width + 20) {
      if (!c.tocado) {
        fallos++;
        elFallos.innerText = fallos;
      }
      return false;
    }
    return true;
  });

  renderizar();
  requestAnimationFrame(actualizar);
}

btnIniciar.addEventListener('click', () => {
  activo = true;
  aciertos = 0;
  fallos = 0;
  circulos = [];
  elAciertos.innerText = "0";
  elFallos.innerText = "0";
  elEfectividad.innerText = "-- %";
  panelEstado.innerText = "¡Prueba en curso! Mantén el ritmo";
  panelEstado.style.color = "#38bdf8";
  btnIniciar.innerText = "En curso...";
  btnIniciar.disabled = true;

  clearTimeout(temporizadorGeneracion);
  clearTimeout(temporizadorFin);

  programarSiguienteCirculo();

  temporizadorFin = setTimeout(() => {
    finalizarPunteo();
  }, 30000);

  actualizar();
});

canvas.addEventListener('pointerdown', (e) => {
  if (!activo) return;
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  let impacto = false;
  circulos.forEach(c => {
    const dist = Math.hypot(c.x - px, c.y - py);
    if (dist <= c.radio + 6 && !c.tocado) {
      c.tocado = true;
      if (c.x >= 120 && c.x <= 220) {
        aciertos++;
        impacto = true;
      } else {
        fallos++;
      }
    }
  });

  elAciertos.innerText = aciertos;
  elFallos.innerText = fallos;
  if ('vibrate' in navigator && impacto) navigator.vibrate(30);
});

function finalizarPunteo() {
  activo = false;
  clearTimeout(temporizadorGeneracion);
  clearTimeout(temporizadorFin);

  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  elEfectividad.innerText = `${efectividad}%`;

  const aprobado = efectividad >= 80;
  panelEstado.innerText = aprobado ? `Aprobado (${efectividad}%)` : `Reprobado (${efectividad}%)`;
  panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';
  btnIniciar.innerText = "Iniciar Prueba (30 s)";
  btnIniciar.disabled = false;

  localStorage.setItem('sensometrika_punteo', JSON.stringify({
    efectividad: efectividad,
    aprobado: aprobado
  }));

  renderizar();
}

renderizar();