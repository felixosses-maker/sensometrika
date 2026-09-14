/* ==========================================================================
   TEST DE PALANCAS - SENSO METRIKA
   - Circuitos unificados continuos (sin líneas intermedias)
   - Banco aleatorio en cada carga
   - Pista exclusiva para Demo y pistas diferentes para Examen Formal
   ========================================================================== */

const canvas = document.getElementById('lienzo-palancas');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo');
const txtTiempo = document.getElementById('txt-tiempo');
const lblReloj = document.getElementById('lbl-reloj');
const metricaToques = document.getElementById('metrica-toques');
const metricaTContacto = document.getElementById('metrica-tiempo-contacto');
const metricaCircuito = document.getElementById('metrica-circuito');
const panelEstado = document.getElementById('caja-instrucciones');
const btnAccion = document.getElementById('btn-accion-palancas');
const zonaCoordinacion = document.getElementById('zona-coordinacion-palancas');

// Definición de circuitos como polígonos continuos sin divisiones internas
const CIRCUITO_DEMO = {
  nombre: 'Calibración A',
  inicio: { x: 45, y: 45 },
  meta: { x: 285, y: 185 },
  poligono: [
    { x: 25, y: 25 }, { x: 170, y: 25 }, { x: 170, y: 105 }, { x: 305, y: 105 },
    { x: 305, y: 205 }, { x: 245, y: 205 }, { x: 245, y: 145 }, { x: 125, y: 145 },
    { x: 125, y: 65 }, { x: 25, y: 65 }
  ]
};

const BANCO_FORMAL = [
  {
    nombre: 'Trazado A (Escalera)',
    inicio: { x: 45, y: 45 },
    meta: { x: 285, y: 185 },
    poligono: [
      { x: 25, y: 25 }, { x: 155, y: 25 }, { x: 155, y: 85 }, { x: 245, y: 85 },
      { x: 245, y: 145 }, { x: 305, y: 145 }, { x: 305, y: 205 }, { x: 225, y: 205 },
      { x: 225, y: 125 }, { x: 135, y: 125 }, { x: 135, y: 65 }, { x: 25, y: 65 }
    ]
  },
  {
    nombre: 'Trazado B (Bayoneta)',
    inicio: { x: 45, y: 185 },
    meta: { x: 285, y: 45 },
    poligono: [
      { x: 25, y: 165 }, { x: 25, y: 205 }, { x: 140, y: 205 }, { x: 140, y: 110 },
      { x: 230, y: 110 }, { x: 230, y: 25 }, { x: 305, y: 25 }, { x: 305, y: 65 },
      { x: 270, y: 65 }, { x: 270, y: 150 }, { x: 180, y: 150 }, { x: 180, y: 165 }
    ]
  },
  {
    nombre: 'Trazado C (Zigzag Invertido)',
    inicio: { x: 285, y: 45 },
    meta: { x: 45, y: 185 },
    poligono: [
      { x: 305, y: 25 }, { x: 305, y: 65 }, { x: 190, y: 65 }, { x: 190, y: 125 },
      { x: 110, y: 125 }, { x: 110, y: 205 }, { x: 25, y: 205 }, { x: 25, y: 165 },
      { x: 70, y: 165 }, { x: 70, y: 85 }, { x: 150, y: 85 }, { x: 150, y: 25 }
    ]
  }
];

// Estado de la prueba
let fase = 'DEMO'; // 'DEMO' o 'FORMAL'
let estadoJuego = 'INACTIVO'; // 'INACTIVO', 'JUGANDO', 'FINALIZADO'
let circuitoActivo = CIRCUITO_DEMO;
let posPuntero = { ...circuitoActivo.inicio };
let toques = 0;
let tiempoContactoMs = 0;
let tiempoRestante = 20;
let temporizador = null;
let enColision = false;
let ultimoTimestampContacto = null;

// Control de teclas y botones
const teclasPresionadas = { Arriba: false, Abajo: false, Izq: false, Der: false };

function puntoEnPoligono(punto, vs) {
  let x = punto.x, y = punto.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function inicializarPistaAleatoria(tipo) {
  if (tipo === 'DEMO') {
    circuitoActivo = CIRCUITO_DEMO;
  } else {
    const indice = Math.floor(Math.random() * BANCO_FORMAL.length);
    circuitoActivo = BANCO_FORMAL[indice];
  }
  posPuntero = { ...circuitoActivo.inicio };
  metricaCircuito.innerText = circuitoActivo.nombre;
  dibujarEscena();
}

function dibujarEscena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Trazar el circuito continuo sin líneas horizontales divisorias
  ctx.beginPath();
  const poly = circuitoActivo.poligono;
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) {
    ctx.lineTo(poly[i].x, poly[i].y);
  }
  ctx.closePath();

  // Fondo del canal y bordes limpios
  ctx.fillStyle = '#031024';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#0284c7';
  ctx.stroke();

  // 2. Meta (punto verde)
  ctx.beginPath();
  ctx.arc(circuitoActivo.meta.x, circuitoActivo.meta.y, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#86efac';
  ctx.stroke();

  // 3. Puntero del evaluado (punto amarillo con halo)
  ctx.beginPath();
  ctx.arc(posPuntero.x, posPuntero.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = enColision ? '#ef4444' : '#facc15';
  ctx.fill();
  ctx.lineWidth = enColision ? 2.5 : 1.5;
  ctx.strokeStyle = enColision ? '#ffffff' : '#fef08a';
  ctx.stroke();
}

function actualizarFisica() {
  if (estadoJuego !== 'JUGANDO') return;

  const velocidad = 1.6;
  let nx = posPuntero.x;
  let ny = posPuntero.y;

  if (teclasPresionadas.Arriba) ny -= velocidad;
  if (teclasPresionadas.Abajo) ny += velocidad;
  if (teclasPresionadas.Izq) nx -= velocidad;
  if (teclasPresionadas.Der) nx += velocidad;

  // Restricción a límites del canvas
  nx = Math.max(10, Math.min(canvas.width - 10, nx));
  ny = Math.max(10, Math.min(canvas.height - 10, ny));

  posPuntero.x = nx;
  posPuntero.y = ny;

  // Verificación de colisión (el centro del puntero debe estar dentro del polígono)
  const dentro = puntoEnPoligono(posPuntero, circuitoActivo.poligono);
  const ahora = performance.now();

  if (!dentro) {
    if (!enColision) {
      enColision = true;
      toques++;
      metricaToques.innerText = toques;
      ultimoTimestampContacto = ahora;
      if ('vibrate' in navigator) navigator.vibrate(35);
    } else {
      tiempoContactoMs += ahora - ultimoTimestampContacto;
      ultimoTimestampContacto = ahora;
      metricaTContacto.innerText = (tiempoContactoMs / 1000).toFixed(1) + ' s';
    }
  } else {
    enColision = false;
    ultimoTimestampContacto = null;
  }

  // Comprobar llegada a meta
  const distMeta = Math.hypot(posPuntero.x - circuitoActivo.meta.x, posPuntero.y - circuitoActivo.meta.y);
  if (distMeta < 12) {
    finalizarPrueba(true);
    return;
  }

  dibujarEscena();
  requestAnimationFrame(actualizarFisica);
}

function iniciarPrueba() {
  estadoJuego = 'JUGANDO';
  toques = 0;
  tiempoContactoMs = 0;
  metricaToques.innerText = '0';
  metricaTContacto.innerText = '0.0 s';
  posPuntero = { ...circuitoActivo.inicio };

  tiempoRestante = (fase === 'DEMO') ? 20 : 60;
  lblReloj.innerText = `${tiempoRestante} s`;

  btnAccion.style.display = 'none';
  panelEstado.innerText = (fase === 'DEMO') 
    ? 'Fase Demo: Calibra tus movimientos hacia la meta verde' 
    : 'Evaluación Oficial activa: Mantén la precisión';

  temporizador = setInterval(() => {
    tiempoRestante--;
    lblReloj.innerText = `${tiempoRestante} s`;
    if (tiempoRestante <= 0) {
      clearInterval(temporizador);
      finalizarPrueba(false);
    }
  }, 1000);

  requestAnimationFrame(actualizarFisica);
}

function finalizarPrueba(llegoAMeta) {
  estadoJuego = 'FINALIZADO';
  clearInterval(temporizador);

  if (fase === 'DEMO') {
    panelEstado.innerHTML = llegoAMeta 
      ? '✅ <strong>¡Demo superado!</strong> Has calibrado los mandos correctamente.' 
      : '⏱️ <strong>Tiempo agotado de práctica.</strong>';

    btnAccion.style.display = 'block';
    btnAccion.innerText = 'Iniciar Evaluación Oficial (60 s)';
    btnAccion.style.backgroundColor = '#16a34a';

    btnAccion.onclick = () => {
      fase = 'FORMAL';
      badgeModo.innerText = '🔴 Evaluación Oficial D.S. N° 170';
      badgeModo.style.borderColor = '#ef4444';
      txtTiempo.innerHTML = 'Tiempo: <strong>60 s</strong>';
      inicializarPistaAleatoria('FORMAL');
      btnAccion.innerText = 'Comenzar Examen Oficial';
      btnAccion.style.backgroundColor = '#0284c7';
      btnAccion.onclick = iniciarPrueba;
    };
  } else {
    // Fase Formal finalizada
    const aprobado = toques <= 3 && llegoAMeta;
    panelEstado.innerHTML = aprobado 
      ? '🎯 <strong>Aprobado:</strong> Coordinación dentro del estándar normativo.' 
      : '⚠️ <strong>Finalizado:</strong> Se registraron contactos o tiempo excedido.';

    localStorage.setItem('sensometrika_palancas', JSON.stringify({
      toques: toques,
      tiempoContacto: (tiempoContactoMs / 1000).toFixed(1),
      aprobado: aprobado,
      circuito: circuitoActivo.nombre
    }));

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 14px; text-align: center;">
        <h3 style="color: #4ade80; font-size: 1rem; margin: 0 0 6px 0;">Módulo 2 Completado</h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px;">Contactos: <strong style="color:#fff;">${toques}</strong> | T. Contacto: <strong style="color:#fff;">${(tiempoContactoMs/1000).toFixed(1)}s</strong></p>
        <a href="punteo.html" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 44px; font-size: 0.9rem;">
          Continuar a Módulo 3 (Test de Punteo) →
        </a>
      </div>
    `;
  }
}

// Configuración de controles táctiles y ratón
function asociarControl(elemId, clave) {
  const elem = document.getElementById(elemId);
  const activar = (e) => { e.preventDefault(); teclasPresionadas[clave] = true; };
  const desactivar = (e) => { e.preventDefault(); teclasPresionadas[clave] = false; };
  elem.addEventListener('pointerdown', activar);
  elem.addEventListener('pointerup', desactivar);
  elem.addEventListener('pointerleave', desactivar);
}

asociarControl('btn-arriba', 'Arriba');
asociarControl('btn-abajo', 'Abajo');
asociarControl('btn-izq', 'Izq');
asociarControl('btn-der', 'Der');

// Soporte teclado para PC
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'KeyW'].includes(e.code)) teclasPresionadas.Arriba = true;
  if (['ArrowDown', 'KeyS'].includes(e.code)) teclasPresionadas.Abajo = true;
  if (['ArrowLeft', 'KeyA'].includes(e.code)) teclasPresionadas.Izq = true;
  if (['ArrowRight', 'KeyD'].includes(e.code)) teclasPresionadas.Der = true;
});
window.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'KeyW'].includes(e.code)) teclasPresionadas.Arriba = false;
  if (['ArrowDown', 'KeyS'].includes(e.code)) teclasPresionadas.Abajo = false;
  if (['ArrowLeft', 'KeyA'].includes(e.code)) teclasPresionadas.Izq = false;
  if (['ArrowRight', 'KeyD'].includes(e.code)) teclasPresionadas.Der = false;
});

btnAccion.onclick = iniciarPrueba;
inicializarPistaAleatoria('DEMO');