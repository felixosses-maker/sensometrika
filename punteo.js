const canvas = document.getElementById('lienzo-punteo');
const ctx = canvas.getContext('2d');
const elAciertos = document.getElementById('metrica-aciertos');
const elFallos = document.getElementById('metrica-fallos');
const elEfectividad = document.getElementById('metrica-efectividad');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-punteo');
const badgeModo = document.getElementById('badge-modo-punteo');
const txtTiempo = document.getElementById('txt-tiempo-punteo');
const cajaInstrucciones = document.getElementById('caja-instrucciones');
const zonaCoordinacion = document.getElementById('zona-coordinacion-punteo');

let modo = 'DEMO'; // 'DEMO' (15s) u 'OFICIAL' (30s)
let activo = false;
let aciertos = 0;
let fallos = 0;
let circulos = [];
let animacionLoop = null;
let temporizadorGeneracion = null;
let temporizadorFin = null;

function renderizar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
  ctx.fillRect(125, 15, 80, 210);
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.strokeRect(125, 15, 80, 210);

  circulos.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radio, 0, Math.PI * 2);
    ctx.fillStyle = c.tocado ? "#475569" : "#22c55e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.tocado ? "#64748b" : "#ffffff";
    ctx.stroke();
    ctx.closePath();
  });
}

function generarCirculo() {
  if (!activo) return;

  circulos.push({
    x: -15,
    y: 35 + Math.random() * 170,
    radio: 13,
    velocidad: 1.8 + Math.random() * 0.6,
    tocado: false
  });

  const intervalo = Math.floor(Math.random() * (1500 - 1000 + 1)) + 1000;
  temporizadorGeneracion = setTimeout(generarCirculo, intervalo);
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
  animacionLoop = requestAnimationFrame(actualizar);
}

btnIniciar.addEventListener('click', () => {
  activo = true;
  aciertos = 0;
  fallos = 0;
  circulos = [];
  elAciertos.innerText = "0";
  elFallos.innerText = "0";
  elEfectividad.innerText = "-- %";
  panelEstado.innerText = "¡Prueba en curso! Toca en la franja dorada";
  panelEstado.style.color = "#38bdf8";
  btnIniciar.style.display = "none";

  clearTimeout(temporizadorGeneracion);
  clearTimeout(temporizadorFin);
  cancelAnimationFrame(animacionLoop);

  generarCirculo();

  const duracion = (modo === 'DEMO') ? 15000 : 30000;
  temporizadorFin = setTimeout(() => {
    finalizarPunteo();
  }, duracion);

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
    if (dist <= c.radio + 8 && !c.tocado) {
      c.tocado = true;
      if (c.x >= 125 && c.x <= 205) {
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
  cancelAnimationFrame(animacionLoop);

  const total = aciertos + fallos;
  const efectividad = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  elEfectividad.innerText = `${efectividad}%`;

  if (modo === 'DEMO') {
    modo = 'OFICIAL';
    badgeModo.innerText = '🔴 Modo Oficial D.S. N° 170 (Calificatorio)';
    badgeModo.style.color = '#38bdf8';
    txtTiempo.innerHTML = 'Tiempo límite: <strong>30 s</strong>';

    panelEstado.innerText = `Calibración lista (${efectividad}%). Inicia el examen formal.`;
    panelEstado.style.color = '#4ade80';

    btnIniciar.innerText = 'Iniciar Evaluación Oficial (30 s)';
    btnIniciar.style.display = 'block';
    renderizar();
  } else {
    cajaInstrucciones.style.display = 'none';
    const aprobado = efectividad >= 80;

    panelEstado.innerText = aprobado ? `Aprobado (${efectividad}%)` : `Reprobado (${efectividad}%)`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';

    localStorage.setItem('sensometrika_punteo', JSON.stringify({
      efectividad: efectividad,
      aciertos: aciertos,
      aprobado: aprobado
    }));

    renderizar();

    const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || { modulosPermitidos: [] };
    const tieneVisual = sesion.modulosPermitidos && sesion.modulosPermitidos.includes('visual');
    const tieneAuditivo = sesion.modulosPermitidos && sesion.modulosPermitidos.includes('auditivo');

    let siguienteUrl = 'informe.html';
    let textoBoton = '📊 Ver Dictamen e Informe Consolidado';

    if (tieneVisual) {
      siguienteUrl = 'visual.html';
      textoBoton = 'Continuar a Módulo 4 (Tamizaje Visual) →';
    } else if (tieneAuditivo) {
      siguienteUrl = 'audicion.html';
      textoBoton = 'Continuar a Módulo 5 (Tamizaje Auditivo) →';
    }

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%;">
        <h3 style="color: #4ade80; margin: 0 0 6px 0; font-size: 1.1rem;">¡Módulo 3 Finalizado con Éxito!</h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 14px;">
          Efectividad oficial: <strong style="color: #ffffff;">${efectividad}%</strong> (${aciertos} aciertos)
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${siguienteUrl}" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7; font-size: 0.95rem;">
            ${textoBoton}
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
            Volver al Menú Principal (Práctica Libre)
          </a>
        </div>
      </div>
    `;
  }
}

renderizar();