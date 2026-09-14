/**
 * Sensometrika | Módulo 4: Screening Visual Preventivo (Ishihara y Optotipo E)
 */

const canvas = document.getElementById('canvas-ishihara');
const ctx = canvas ? canvas.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');
const panelEstado = document.getElementById('panel-estado');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const contadorAciertos = document.getElementById('contador-aciertos');
const indicadorFase = document.getElementById('indicador-fase');
const estadoAlerta = document.getElementById('estado-alerta');
const cajaInstruccion = document.getElementById('caja-instruccion');

let fase = 'CROMATICA'; // 'CROMATICA' (3 láminas) o 'AGUDEZA' (3 optotipos)
let pasoActual = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;

// Banco de láminas cromáticas Ishihara
const laminasIshihara = [
  { numero: 12, fondo: '#f97316', puntos: '#22c55e', opciones: [12, 72, 21, 'No distingo'] },
  { numero: 8, fondo: '#ef4444', puntos: '#84cc16', opciones: [8, 3, 9, 'No distingo'] },
  { numero: 74, fondo: '#eab308', puntos: '#06b6d4', opciones: [74, 21, 71, 'No distingo'] },
  { numero: 6, fondo: '#ec4899', puntos: '#10b981', opciones: [6, 5, 8, 'No distingo'] },
  { numero: 29, fondo: '#8b5cf6', puntos: '#f59e0b', opciones: [29, 70, 26, 'No distingo'] }
];

// Banco de optotipos E Snellen (rotaciones en grados)
const optotipos = [
  { rotacion: 0, direccion: 'Derecha', opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo'] },
  { rotacion: 90, direccion: 'Abajo', opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo'] },
  { rotacion: 180, direccion: 'Izquierda', opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo'] },
  { rotacion: 270, direccion: 'Arriba', opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo'] }
];

let itemsPruebaCromatica = [];
let itemsPruebaAgudeza = [];

document.addEventListener('DOMContentLoaded', () => {
  // Barajar láminas para evitar memorización
  itemsPruebaCromatica = [...laminasIshihara].sort(() => Math.random() - 0.5).slice(0, 3);
  itemsPruebaAgudeza = [...optotipos].sort(() => Math.random() - 0.5).slice(0, 3);
  iniciarFaseCromatica();
});

function iniciarFaseCromatica() {
  fase = 'CROMATICA';
  pasoActual = 0;
  if (indicadorFase) indicadorFase.innerText = 'Cromático';
  if (canvas) canvas.style.display = 'block';
  if (simboloOptotipo) simboloOptotipo.style.display = 'none';
  cargarLaminaActual();
}

function cargarLaminaActual() {
  const item = itemsPruebaCromatica[pasoActual];
  if (!item) return;

  if (contadorAciertos) contadorAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}/6`;
  if (panelEstado) panelEstado.innerText = `Lámina ${pasoActual + 1} de 3: ¿Qué número observas?`;

  // Dibujar lámina simulada de Ishihara
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = item.fondo;
    ctx.beginPath();
    ctx.arc(100, 100, 95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = item.puntos;
    ctx.font = 'bold 70px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.numero, 100, 100);
  }

  // Barajar opciones
  const opciones = [...item.opciones].sort(() => Math.random() - 0.5);
  renderizarBotones(opciones, (opcionSeleccionada) => {
    if (opcionSeleccionada === item.numero) {
      aciertosCromaticos++;
    }
    pasoActual++;
    if (pasoActual < 3) {
      cargarLaminaActual();
    } else {
      iniciarFaseAgudeza();
    }
  });
}

function iniciarFaseAgudeza() {
  fase = 'AGUDEZA';
  pasoActual = 0;
  if (indicadorFase) indicadorFase.innerText = 'Agudeza E';
  if (canvas) canvas.style.display = 'none';
  if (simboloOptotipo) simboloOptotipo.style.display = 'block';
  if (cajaInstruccion) {
    cajaInstruccion.innerHTML = '📱 <strong>Agudeza Visual:</strong> Mantén el brazo extendido a ~50 cm e indica hacia dónde apuntan las patas de la E.';
  }
  cargarOptotipoActual();
}

function cargarOptotipoActual() {
  const item = itemsPruebaAgudeza[pasoActual];
  if (!item) return;

  if (contadorAciertos) contadorAciertos.innerText = `${aciertosCromaticos + aciertosAgudeza}/6`;
  if (panelEstado) panelEstado.innerText = `Optotipo ${pasoActual + 1} de 3: ¿Hacia dónde apuntan las barras?`;

  // Rotación y tamaño del optotipo E
  if (simboloOptotipo) {
    simboloOptotipo.style.transform = `rotate(${item.rotacion}deg)`;
    const tamanos = ['56px', '42px', '32px'];
    simboloOptotipo.style.fontSize = tamanos[pasoActual] || '38px';
  }

  const opciones = ['Arriba', 'Abajo', 'Izquierda', 'Derecha'];
  renderizarBotones(opciones, (opcionSeleccionada) => {
    if (opcionSeleccionada === item.direccion) {
      aciertosAgudeza++;
    }
    pasoActual++;
    if (pasoActual < 3) {
      cargarOptotipoActual();
    } else {
      finalizarTestVisual();
    }
  });
}

function renderizarBotones(opciones, callback) {
  if (!contenedorOpciones) return;
  contenedorOpciones.innerHTML = '';
  opciones.forEach(op => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-opcion';
    btn.innerText = op;
    btn.onclick = () => callback(op);
    contenedorOpciones.appendChild(btn);
  });
}

function finalizarTestVisual() {
  const total = aciertosCromaticos + aciertosAgudeza;
  const efectividad = Math.round((total / 6) * 100);
  const aprobado = (efectividad >= 80);

  localStorage.setItem('sensometrika_visual', JSON.stringify({
    efectividad: efectividad,
    aciertos: total,
    aprobado: aprobado
  }));

  const sesion = JSON.parse(localStorage.getItem('sensometrika_sesion')) || {};
  const modulosPermitidos = sesion.modulosPermitidos || [];
  const tieneAuditivo = modulosPermitidos.includes('auditivo');

  const siguienteUrl = tieneAuditivo ? 'audicion.html' : 'informe.html';
  const textoBoton = tieneAuditivo ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Informe y Dictamen Final';

  if (indicadorFase) indicadorFase.innerText = 'Fin';
  if (contadorAciertos) contadorAciertos.innerText = `${total}/6`;
  if (estadoAlerta) {
    estadoAlerta.innerText = aprobado ? 'Aprobado' : 'Observado';
    estadoAlerta.style.color = aprobado ? '#4ade80' : '#f87171';
  }

  if (panelEstado) {
    panelEstado.innerText = `Evaluación completada: ${efectividad}% acierto`;
    panelEstado.style.color = aprobado ? '#4ade80' : '#f87171';
  }

  if (contenedorOpciones) {
    contenedorOpciones.innerHTML = `
      <div style="grid-column: 1 / -1; background: #020617; border: 1.5px solid #38bdf8; border-radius: 12px; padding: 16px; margin-top: 10px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; font-size: 1.05rem; margin: 0 0 6px 0;">¡Módulo 4 Finalizado!</h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0;">
          Efectividad: <strong style="color: #fff;">${efectividad}%</strong> (${aprobado ? 'Sin Alertas' : 'Observado'})
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${siguienteUrl}" class="btn-principal" style="display: flex; justify-content: center; align-items: center; text-decoration: none; height: 46px; font-size: 0.95rem; background-color: #0284c7; color: #ffffff; border-radius: 8px; font-weight: bold;">
            ${textoBoton}
          </a>
          <a href="menu.html" style="color: #64748b; font-size: 0.8rem; text-decoration: none; padding: 6px;">
            Regresar al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}