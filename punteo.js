const canvas = document.getElementById('lienzo-punteo');
const ctx = canvas.getContext('2d');
const elAciertos = document.getElementById('metrica-aciertos');
const elFallos = document.getElementById('metrica-fallos');
const elEfectividad = document.getElementById('metrica-efectividad');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-punteo');
const badgeModo = document.getElementById('badge-modo-punteo');
const txtTiempo = document.getElementById('txt-tiempo-punteo');
const zonaCoordinacion = document.getElementById('zona-coordinacion-punteo');

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

  // Zona de inserción delimitada (Franja Dorada Central)
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 3;
  ctx.strokeRect(125, 15, 80, 200);

  circulos.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radio, 0, Math.PI * 2);
    ctx.fillStyle = c.tocado ? "#64748b" : "#22c55e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  });
}

function programarSiguienteCirculo() {
  if (!activo) return;

  const velVariacion = 1.7 + Math.random() * 0.8;
  circulos.push({
    x: -15,
    y: 35 + Math.random() * 160,
    radio: 14,
    velocidad: velVariacion,
    tocado: false
  });

  const proximoIntervalo = Math.floor(Math.random() * (1800 - 1100 + 1)) + 1100;
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
  if (activo) return;
  iniciarCicloPunteo();
});

function iniciarCicloPunteo() {
  activo = true;
  aciertos = 0;
  fallos = 0;
  circulos = [];
  elAciertos.innerText = "0";
  elFallos.innerText = "0";
  elEfectividad.innerText = "-- %";

  const duracion = (fase === 'DEMO') ? 15000 : 30000;
  panelEstado.innerText = (fase === 'DEMO') 
    ? 'Fase Demo: Ensayo libre (15 s)' 
    : '¡Evaluación Oficial (30 s)! Mantén el ritmo';
  panelEstado.style.color = '#38bdf8';

  btnIniciar.innerText = "En curso...";
  btnIniciar.disabled = true;

  clearTimeout(temporizadorGeneracion);
  clearTimeout(temporizadorFin);

  programarSiguienteCirculo();

  temporizadorFin = setTimeout(() => {
    finalizarCicloPunteo();
  }, duracion);

  actualizar();
}

canvas.addEventListener('pointerdown', (e) => {
  if (!activo) return;
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  let impacto = false;
  circulos.forEach(c => {
    const dist = Math.hypot(c.x - px, c.y - py);
    if (dist <= c.radio + 8 && !c.tocado) {
      c.tocado = true;
      if (c.x >= 120 && c.x <= 210) {
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

function finalizarCicloPunteo() {
  activo = false;
  clearTimeout(temporizadorGeneracion);
  clearTimeout(temporizadorFin);

  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  elEfectividad.innerText = `${efectividad}%`;

  if (fase === 'DEMO') {
    fase = 'OFICIAL';
    badgeModo.innerText = '🔴 Evaluación Oficial (30 s)';
    badgeModo.style.borderColor = '#ef4444';
    txtTiempo.innerHTML = 'Tiempo: <strong>30 s</strong>';

    panelEstado.innerText = '¡Demo finalizada! Pulsa para la Evaluación Oficial';
    panelEstado.style.color = '#facc15';
    btnIniciar.innerText = "Iniciar Evaluación Oficial (30 s)";
    btnIniciar.disabled = false;
  } else {
    btnIniciar.innerText = "Módulo 3 Completado";
    const aprobado = efectividad >= 80;

    panelEstado.innerText = aprobado ? `Aprobado (${efectividad}%)` : `Reprobado (${efectividad}%)`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

    // Persistencia oficial
    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      efectividad: efectividad,
      aciertos: aciertos,
      fallos: fallos,
      aprobado: aprobado
    }));

    // Tarjeta interactiva hacia el Módulo 4 (Visual) o Informe
    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; box-sizing: border-box;">
        <h3 style="color: #4ade80; font-size: 1.05rem; margin: 0 0 6px 0;">¡Módulo 3 Finalizado!</h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0;">
          Efectividad registrada: <strong style="color: #fff;">${efectividad}%</strong> (${aprobado ? 'Aprobado D.S. 170' : 'Reprobado'})
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="visual.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 44px; font-size: 0.9rem; background-color: #0284c7; color: #fff; border-radius: 8px; font-weight: bold;">
            Continuar a Módulo 4 (Tamizaje Visual) →
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 4px;">
            Regresar al Menú Principal
          </a>
        </div>
      </div>
    `;
  }

  renderizar();
}

renderizar();