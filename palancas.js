const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');
const elContactos = document.getElementById('metrica-contactos') || { innerText: '' };
const elTiempoContacto = document.getElementById('metrica-tiempo-contacto') || { innerText: '' };
const elCircuito = document.getElementById('metrica-circuito') || { innerText: '' };
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-palancas') || document.querySelector('button.btn-principal');
const cronometro = document.getElementById('cronometro-palancas') || document.querySelector('.tiempo');
const badgeModo = document.getElementById('badge-modo');
const zonaCoordinacion = document.getElementById('zona-coordinacion-palancas') || panelEstado.parentElement;

let fase = 'DEMO'; // 'DEMO' o 'OFICIAL'
let activo = false;
let contactos = 0;
let tiempoContactoSegundos = 0;
let tiempoRestante = 20;
let intervaloReloj = null;
let animacionFrame = null;

let posX = 30;
let posY = 40;
const radioPuntero = 6;
const velocidad = 3;

// Meta del circuito (punto final de llegada)
const meta = { x: 290, y: 195, radio: 12 };

const CIRCUITOS = [
  {
    nombre: 'Circuito 1 (Escalera)',
    meta: { x: 290, y: 195 },
    trazado: [
      { x1: 20, y1: 25, x2: 120, y2: 55 },
      { x1: 90, y1: 55, x2: 120, y2: 135 },
      { x1: 90, y1: 105, x2: 240, y2: 135 },
      { x1: 210, y1: 135, x2: 240, y2: 205 },
      { x1: 210, y1: 175, x2: 310, y2: 205 }
    ]
  }
];

let circuitoActual = CIRCUITOS[0];

function dibujarCircuito() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#020617";
  circuitoActual.trazado.forEach(seg => {
    ctx.fillRect(seg.x1, seg.y1, seg.x2 - seg.x1, seg.y2 - seg.y1);
  });

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  circuitoActual.trazado.forEach(seg => {
    ctx.strokeRect(seg.x1, seg.y1, seg.x2 - seg.x1, seg.y2 - seg.y1);
  });

  // Dibujar Meta
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(circuitoActual.meta.x, circuitoActual.meta.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Puntero
  ctx.beginPath();
  ctx.arc(posX, posY, radioPuntero, 0, Math.PI * 2);
  ctx.fillStyle = "#facc15";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function validarColisionYMeta() {
  let dentro = false;
  circuitoActual.trazado.forEach(seg => {
    if (
      posX - radioPuntero >= seg.x1 &&
      posX + radioPuntero <= seg.x2 &&
      posY - radioPuntero >= seg.y1 &&
      posY + radioPuntero <= seg.y2
    ) {
      dentro = true;
    }
  });

  if (!dentro && activo) {
    contactos++;
    tiempoContactoSegundos += 0.05;
    if (elContactos) elContactos.innerText = contactos;
    if (elTiempoContacto) elTiempoContacto.innerText = tiempoContactoSegundos.toFixed(1) + ' s';
    if ('vibrate' in navigator) navigator.vibrate(30);
  }

  // Detección de llegada a meta
  const distMeta = Math.hypot(posX - circuitoActual.meta.x, posY - circuitoActual.meta.y);
  if (distMeta < 12 && activo) {
    finalizarTiempo(true);
  }
}

function bucleJuego() {
  if (!activo) return;
  validarColisionYMeta();
  dibujarCircuito();
  animacionFrame = requestAnimationFrame(bucleJuego);
}

const teclas = {};
function moverPuntero() {
  if (!activo) return;
  if (teclas['Arriba'] && posY > 15) posY -= velocidad;
  if (teclas['Abajo'] && posY < canvas.height - 15) posY += velocidad;
  if (teclas['Izq'] && posX > 15) posX -= velocidad;
  if (teclas['Der'] && posX < canvas.width - 15) posX += velocidad;
}
setInterval(moverPuntero, 25);

function asignarBoton(id, accion) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); teclas[accion] = true; });
  btn.addEventListener('pointerup', (e) => { e.preventDefault(); teclas[accion] = false; });
  btn.addEventListener('pointerleave', (e) => { e.preventDefault(); teclas[accion] = false; });
}

asignarBoton('btn-arriba', 'Arriba');
asignarBoton('btn-abajo', 'Abajo');
asignarBoton('btn-izq', 'Izq');
asignarBoton('btn-der', 'Der');

if (btnIniciar) {
  btnIniciar.addEventListener('click', () => {
    if (activo) return;
    iniciarFase();
  });
}

function iniciarFase() {
  activo = true;
  contactos = 0;
  tiempoContactoSegundos = 0;
  posX = 30;
  posY = 40;
  if (elContactos) elContactos.innerText = '0';
  if (elTiempoContacto) elTiempoContacto.innerText = '0.0 s';

  tiempoRestante = (fase === 'DEMO') ? 20 : 60;
  if (cronometro) cronometro.innerText = `${tiempoRestante} s`;
  if (panelEstado) {
    panelEstado.innerText = (fase === 'DEMO') 
      ? 'Fase Demo: Calibra tus manos (20 s)' 
      : '¡Evaluación Oficial en curso! Llega a la meta';
    panelEstado.style.color = '#38bdf8';
  }

  btnIniciar.style.display = 'none';

  clearInterval(intervaloReloj);
  intervaloReloj = setInterval(() => {
    tiempoRestante--;
    if (cronometro) cronometro.innerText = `${tiempoRestante} s`;

    if (tiempoRestante <= 0) {
      clearInterval(intervaloReloj);
      finalizarTiempo(false);
    }
  }, 1000);

  bucleJuego();
}

function finalizarTiempo(llegoAMeta) {
  activo = false;
  clearInterval(intervaloReloj);
  cancelAnimationFrame(animacionFrame);

  if (fase === 'DEMO') {
    fase = 'OFICIAL';
    if (badgeModo) {
      badgeModo.innerText = '🔴 Evaluación Oficial (60 s)';
      badgeModo.style.borderColor = '#ef4444';
    }
    panelEstado.innerText = '¡Calibración lista! Pulsa para la Evaluación Oficial (60 s)';
    panelEstado.style.color = '#facc15';

    btnIniciar.innerText = 'Iniciar Evaluación Oficial (60 s)';
    btnIniciar.style.display = 'block';
  } else {
    btnIniciar.style.display = 'none';
    const aprobado = llegoAMeta && contactos <= 3;
    const tiempoConsumido = 60 - tiempoRestante;

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      contactos: contactos,
      tiempoUsado: tiempoConsumido,
      aprobado: aprobado
    }));

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; box-sizing: border-box;">
        <h3 style="color: #4ade80; font-size: 1.05rem; margin: 0 0 6px 0;">¡Módulo 2 Finalizado!</h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0;">
          Contactos: <strong style="color: #fff;">${contactos}</strong> | Estado: <strong style="color: #fff;">${aprobado ? 'Aprobado' : 'Observado'}</strong>
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="punteo.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 44px; font-size: 0.9rem; background-color: #0284c7; color: #fff; border-radius: 8px; font-weight: bold;">
            Continuar a Módulo 3 (Test de Punteo) →
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
            Regresar al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}

dibujarCircuito();