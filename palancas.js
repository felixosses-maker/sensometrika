/* ==========================================================================
   TEST DE PALANCAS - COORDINACIÓN BIMANUAL (SENSOMETRIKA)
   ========================================================================== */

const canvas = document.getElementById('canvas-palancas');
const ctx = canvas ? canvas.getContext('2d') : null;

const badgeFase = document.getElementById('badge-fase');
const txtTiempo = document.getElementById('txt-tiempo');
const lblToques = document.getElementById('contador-toques');
const lblTContacto = document.getElementById('contador-tiempo-toque');
const lblCircuito = document.getElementById('tipo-circuito');
const panelInstruccion = document.getElementById('caja-instruccion');
const btnIniciar = document.getElementById('btn-iniciar');
const contenedorAccion = document.getElementById('contenedor-accion');

// Asegurar enlace al modal sin disparar alert
const btnAyuda = document.getElementById('btn-abrir-ayuda');
if (btnAyuda) {
  btnAyuda.onclick = (e) => {
    e.preventDefault();
    if (typeof abrirModalGuia === 'function') abrirModalGuia();
  };
}

// Trazados continuos poligonales
const CIRCUITO_DEMO = {
  nombre: 'Calibración A',
  inicio: { x: 50, y: 50 },
  meta: { x: 330, y: 150, r: 12 },
  poligono: [
    { x: 25, y: 25 }, { x: 190, y: 25 }, { x: 190, y: 95 }, { x: 355, y: 95 },
    { x: 355, y: 175 }, { x: 275, y: 175 }, { x: 275, y: 135 }, { x: 140, y: 135 },
    { x: 140, y: 65 }, { x: 25, y: 65 }
  ]
};

const BANCO_OFICIAL = [
  {
    nombre: 'Circuito 1 (Escalera)',
    inicio: { x: 50, y: 50 },
    meta: { x: 330, y: 155, r: 12 },
    poligono: [
      { x: 25, y: 25 }, { x: 160, y: 25 }, { x: 160, y: 80 }, { x: 260, y: 80 },
      { x: 260, y: 135 }, { x: 355, y: 135 }, { x: 355, y: 180 }, { x: 220, y: 180 },
      { x: 220, y: 120 }, { x: 120, y: 120 }, { x: 120, y: 65 }, { x: 25, y: 65 }
    ]
  },
  {
    nombre: 'Circuito 2 (Bayoneta)',
    inicio: { x: 50, y: 150 },
    meta: { x: 330, y: 50, r: 12 },
    poligono: [
      { x: 25, y: 130 }, { x: 25, y: 175 }, { x: 170, y: 175 }, { x: 170, y: 95 },
      { x: 270, y: 95 }, { x: 270, y: 25 }, { x: 355, y: 25 }, { x: 355, y: 70 },
      { x: 310, y: 70 }, { x: 310, y: 135 }, { x: 210, y: 135 }, { x: 210, y: 140 }
    ]
  },
  {
    nombre: 'Circuito 3 (Zigzag)',
    inicio: { x: 330, y: 50 },
    meta: { x: 50, y: 150, r: 12 },
    poligono: [
      { x: 355, y: 25 }, { x: 355, y: 70 }, { x: 220, y: 70 }, { x: 220, y: 115 },
      { x: 125, y: 115 }, { x: 125, y: 175 }, { x: 25, y: 175 }, { x: 25, y: 130 },
      { x: 80, y: 130 }, { x: 80, y: 85 }, { x: 175, y: 85 }, { x: 175, y: 25 }
    ]
  }
];

let faseActual = 'DEMO'; // 'DEMO' (20 s) | 'OFICIAL' (60 s)
let jugando = false;
let circuitoActivo = CIRCUITO_DEMO;
let puntero = { x: 50, y: 50, r: 6.5 };
let toques = 0;
let tiempoContactoMs = 0;
let ultimoTimestamp = null;
let enColision = false;
let tiempoRestante = 20;
let timerReloj = null;
let animId = null;

const teclas = { Arriba: false, Abajo: false, Izq: false, Der: false };

function puntoEnPoligono(pt, vs) {
  let x = pt.x, y = pt.y, inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function inicializarPista(tipo) {
  if (tipo === 'DEMO') {
    circuitoActivo = CIRCUITO_DEMO;
  } else {
    const r = Math.floor(Math.random() * BANCO_OFICIAL.length);
    circuitoActivo = BANCO_OFICIAL[r];
  }
  puntero.x = circuitoActivo.inicio.x;
  puntero.y = circuitoActivo.inicio.y;
  if (lblCircuito) lblCircuito.innerText = circuitoActivo.nombre;
  dibujarEscena();
}

function dibujarEscena() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Canal continuo
  ctx.beginPath();
  const poly = circuitoActivo.poligono;
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) {
    ctx.lineTo(poly[i].x, poly[i].y);
  }
  ctx.closePath();

  ctx.fillStyle = '#020617';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#0284c7';
  ctx.stroke();

  // 2. Meta verde
  ctx.beginPath();
  ctx.arc(circuitoActivo.meta.x, circuitoActivo.meta.y, circuitoActivo.meta.r, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#86efac';
  ctx.stroke();

  // 3. Puntero evaluado
  ctx.beginPath();
  ctx.arc(puntero.x, puntero.y, puntero.r, 0, Math.PI * 2);
  ctx.fillStyle = enColision ? '#ef4444' : '#facc15';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = enColision ? '#ffffff' : '#fef08a';
  ctx.stroke();
}

function actualizarFisica() {
  if (!jugando) return;

  const vel = 2.2;
  let nx = puntero.x;
  let ny = puntero.y;

  if (teclas.Arriba) ny -= vel;
  if (teclas.Abajo) ny += vel;
  if (teclas.Izq) nx -= vel;
  if (teclas.Der) nx += vel;

  nx = Math.max(10, Math.min(canvas.width - 10, nx));
  ny = Math.max(10, Math.min(canvas.height - 10, ny));

  puntero.x = nx;
  puntero.y = ny;

  const dentro = puntoEnPoligono(puntero, circuitoActivo.poligono);
  const ahora = performance.now();

  if (!dentro) {
    if (!enColision) {
      enColision = true;
      toques++;
      if (lblToques) lblToques.innerText = toques;
      ultimoTimestamp = ahora;
      if ('vibrate' in navigator) navigator.vibrate(30);
    } else {
      tiempoContactoMs += (ahora - ultimoTimestamp);
      ultimoTimestamp = ahora;
      if (lblTContacto) lblTContacto.innerText = (tiempoContactoMs / 1000).toFixed(1) + ' s';
    }
  } else {
    enColision = false;
    ultimoTimestamp = null;
  }

  // Verificar llegada a meta
  const distMeta = Math.hypot(puntero.x - circuitoActivo.meta.x, puntero.y - circuitoActivo.meta.y);
  if (distMeta < circuitoActivo.meta.r + 2) {
    concluirPrueba(true);
    return;
  }

  dibujarEscena();
  animId = requestAnimationFrame(actualizarFisica);
}

function iniciarPalancas() {
  jugando = true;
  toques = 0;
  tiempoContactoMs = 0;
  enColision = false;
  if (lblToques) lblToques.innerText = '0';
  if (lblTContacto) lblTContacto.innerText = '0.0 s';

  puntero.x = circuitoActivo.inicio.x;
  puntero.y = circuitoActivo.inicio.y;

  tiempoRestante = (faseActual === 'DEMO') ? 20 : 60;
  if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;

  if (btnIniciar) btnIniciar.style.display = 'none';
  if (panelInstruccion) {
    panelInstruccion.innerText = (faseActual === 'DEMO') 
      ? 'Fase Demo: Calibra tus manos hacia la meta verde' 
      : 'Evaluación Oficial activa: Mantén el pulso en el canal';
  }

  clearInterval(timerReloj);
  timerReloj = setInterval(() => {
    tiempoRestante--;
    if (txtTiempo) txtTiempo.innerText = `${tiempoRestante} s`;
    if (tiempoRestante <= 0) {
      clearInterval(timerReloj);
      concluirPrueba(false);
    }
  }, 1000);

  animId = requestAnimationFrame(actualizarFisica);
}

function concluirPrueba(llegoAMeta) {
  jugando = false;
  clearInterval(timerReloj);
  cancelAnimationFrame(animId);

  if (faseActual === 'DEMO') {
    faseActual = 'OFICIAL';
    if (badgeFase) {
      badgeFase.innerText = '🔴 Modo Oficial D.S. N° 170 (60 s)';
      badgeFase.style.borderColor = '#ef4444';
    }
    if (txtTiempo) txtTiempo.innerText = '60 s';

    if (panelInstruccion) {
      panelInstruccion.innerHTML = llegoAMeta 
        ? '✅ <strong>¡Demo superado!</strong> Has calibrado los mandos correctamente.' 
        : '⏱️ <strong>Demo finalizado.</strong> Ahora comienza la prueba oficial.';
    }

    if (btnIniciar) {
      btnIniciar.style.display = 'block';
      btnIniciar.innerText = 'Iniciar Evaluación Oficial (60 s)';
      btnIniciar.style.backgroundColor = '#16a34a';
      btnIniciar.onclick = () => {
        inicializarPista('OFICIAL');
        btnIniciar.innerText = 'Comenzar';
        btnIniciar.style.backgroundColor = '#0284c7';
        btnIniciar.onclick = iniciarPalancas;
        iniciarPalancas();
      };
    }
  } else {
    // Oficial completado
    const aprobado = llegoAMeta && toques <= 3;
    const tiempoUsado = 60 - tiempoRestante;

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: toques,
      tiempo: tiempoUsado,
      tiempoContacto: (tiempoContactoMs / 1000).toFixed(1),
      aprobado: aprobado,
      circuito: circuitoActivo.nombre,
      fecha: new Date().toISOString()
    }));

    mostrarBotonSalto(aprobado, toques, tiempoUsado);
  }
}

function mostrarBotonSalto(aprobado, toques, tiempoUsado) {
  if (contenedorAccion) {
    contenedorAccion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; font-size: 1.05rem; margin: 0 0 6px 0;">
          ${aprobado ? '✅ Módulo 2 Superado' : '⚠️ Fuera de Estándar'} (${toques} contactos)
        </h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px;">
          Tiempo empleado: ${tiempoUsado} s (Estándar legal: ≤ 3 contactos en 60 s)[cite: 1, 3].
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="punteo.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; background-color: #0284c7; font-size: 0.92rem;">
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

// Asignación de mandos táctiles y ratón
function vincularBoton(id, direccion) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const presionar = (e) => { e.preventDefault(); teclas[direccion] = true; };
  const soltar = (e) => { e.preventDefault(); teclas[direccion] = false; };

  btn.addEventListener('pointerdown', presionar);
  btn.addEventListener('pointerup', soltar);
  btn.addEventListener('pointerleave', soltar);
}

vincularBoton('btn-arriba', 'Arriba');
vincularBoton('btn-abajo', 'Abajo');
vincularBoton('btn-izq', 'Izq');
vincularBoton('btn-der', 'Der');

// Teclas físicas
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'KeyW'].includes(e.code)) teclas.Arriba = true;
  if (['ArrowDown', 'KeyS'].includes(e.code)) teclas.Abajo = true;
  if (['ArrowLeft', 'KeyA'].includes(e.code)) teclas.Izq = true;
  if (['ArrowRight', 'KeyD'].includes(e.code)) teclas.Der = true;
});
window.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'KeyW'].includes(e.code)) teclas.Arriba = false;
  if (['ArrowDown', 'KeyS'].includes(e.code)) teclas.Abajo = false;
  if (['ArrowLeft', 'KeyA'].includes(e.code)) teclas.Izq = false;
  if (['ArrowRight', 'KeyD'].includes(e.code)) teclas.Der = false;
});

document.addEventListener('DOMContentLoaded', () => {
  inicializarPista('DEMO');
});