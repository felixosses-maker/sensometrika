/* ==========================================================================
   SENSOMETRIKA - MÓDULO 4: TAMIZAJE VISUAL (visual.js)
   • 1 Demo de calibración de distancia facial (~50 cm)
   • Conteo y bloqueo 1/3, 2/3 y 3/3 mediante CreditManager
   • Batería aleatoria anti-memorización (Ishihara + Optotipos E rotados)
   ========================================================================== */
const video = document.getElementById('video-camara');
const cajaCamara = document.getElementById('caja-camara');
const etiquetaDistancia = document.getElementById('etiqueta-distancia');
const estadoDistancia = document.getElementById('estado-distancia');
const canvasIshihara = document.getElementById('canvas-ishihara');
const ctxIshihara = canvasIshihara ? canvasIshihara.getContext('2d') : null;
const simboloOptotipo = document.getElementById('simbolo-optotipo');
const panelEstado = document.getElementById('panel-estado');
const btnIniciar = document.getElementById('btn-iniciar-visual');
const contenedorOpciones = document.getElementById('contenedor-opciones');
const zonaCoordinacion = document.getElementById('zona-coordinacion-visual');

let modo = 'DEMO'; // 'DEMO' u 'OFICIAL'
let distanciaOptima = true;
let indicePrueba = 0;
let aciertosCromaticos = 0;
let aciertosAgudeza = 0;
let bateriaActual = [];

// Banco anti-memorización
const BANCO_ISHIHARA = [
  { num: '12', fondo: '#e27d60', pat: '#41b3a3', opc: ['12', '74', '8', 'No distingo'] },
  { num: '8',  fondo: '#85dcba', pat: '#e8a87c', opc: ['3', '8', '5', 'No distingo'] },
  { num: '74', fondo: '#c38d9e', pat: '#41b3a3', opc: ['21', '74', '71', 'No distingo'] },
  { num: '6',  fondo: '#e8a87c', pat: '#5b92e5', opc: ['5', '6', '8', 'No distingo'] },
  { num: '29', fondo: '#a3e4d7', pat: '#e74c3c', opc: ['70', '29', '26', 'No distingo'] },
  { num: '5',  fondo: '#f6cd61', pat: '#0e9aa7', opc: ['2', '5', '3', 'No distingo'] }
];

const ANGULOS_E = [
  { ang: 0, dir: 'Derecha' },
  { ang: 90, dir: 'Abajo' },
  { ang: 180, dir: 'Izquierda' },
  { ang: 270, dir: 'Arriba' }
];

window.addEventListener('DOMContentLoaded', () => {
  CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'visual');

  if (!CreditManager.puedeRendir('visual')) {
    bloquearModuloPorCupo();
    return;
  }

  iniciarCamaraBiometrica();

  if (CreditManager.demoYaRealizado('visual')) {
    prepararVistaOficialDirecta();
  }
});

function bloquearModuloPorCupo() {
  btnIniciar.disabled = true;
  btnIniciar.style.opacity = '0.4';
  btnIniciar.innerText = 'Cupo Bloqueado (3/3 Realizadas)';
  panelEstado.innerText = 'Has alcanzado el límite de 3 simulaciones oficiales para este módulo.';
  panelEstado.style.color = '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background: #020617; border: 1.5px solid #dc2626; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center;">
      <h3 style="color: #ef4444; margin: 0 0 6px 0;">Módulo Bloqueado (3 de 3)</h3>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px;">Completaste todas las simulaciones de tu Plan.</p>
      <a href="menu.html" class="btn-principal" style="display:inline-block; text-decoration:none; background:#0284c7; padding:10px 16px; border-radius:6px; color:#fff;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function prepararVistaOficialDirecta() {
  modo = 'OFICIAL';
  const numSim = CreditManager.obtenerNumeroSimulacionActual('visual');
  panelEstado.innerText = 'Listo para Evaluación Oficial. Mantén el brazo extendido.';
  panelEstado.style.color = '#38bdf8';

  btnIniciar.style.display = 'block';
  btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de 3)`;
  btnIniciar.style.backgroundColor = '#22c55e';
}

// Validación óptica por cámara frontal
async function iniciarCamaraBiometrica() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false
    });
    video.srcObject = stream;
    monitorearDistanciaFacial();
  } catch (err) {
    etiquetaDistancia.innerText = '📱 Modo manual: Mantén brazo estirado (~50 cm)';
    estadoDistancia.innerText = 'Manual';
    estadoDistancia.style.color = '#facc15';
    distanciaOptima = true;
  }
}

function monitorearDistanciaFacial() {
  const canvasAux = document.createElement('canvas');
  const ctxAux = canvasAux.getContext('2d', { willReadFrequently: true });
  canvasAux.width = 60;
  canvasAux.height = 45;

  setInterval(() => {
    if (video.readyState < 2) return;
    ctxAux.drawImage(video, 0, 0, 60, 45);
    const frame = ctxAux.getImageData(0, 0, 60, 45).data;

    let pixelesRostro = 0;
    for (let i = 0; i < frame.length; i += 4) {
      const r = frame[i], g = frame[i + 1], b = frame[i + 2];
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) pixelesRostro++;
    }

    const densidad = pixelesRostro / (60 * 45);

    if (densidad > 0.34) {
      distanciaOptima = false;
      cajaCamara.className = 'caja-camara-estatus distancia-incorrecta';
      etiquetaDistancia.innerText = '⚠️ Muy cerca: Estira el brazo (~50 cm)';
      estadoDistancia.innerText = 'Cerca';
      estadoDistancia.style.color = '#ef4444';
    } else if (densidad < 0.04) {
      distanciaOptima = false;
      cajaCamara.className = 'caja-camara-estatus distancia-incorrecta';
      etiquetaDistancia.innerText = '👤 Enfoca tu rostro a la cámara';
      estadoDistancia.innerText = 'Buscando';
      estadoDistancia.style.color = '#facc15';
    } else {
      distanciaOptima = true;
      cajaCamara.className = 'caja-camara-estatus distancia-correcta';
      etiquetaDistancia.innerText = '✅ Distancia Correcta (~50-60 cm)';
      estadoDistancia.innerText = 'Óptima';
      estadoDistancia.style.color = '#4ade80';
    }

    actualizarHabilitacionBotones();
  }, 250);
}

function actualizarHabilitacionBotones() {
  const botones = contenedorOpciones.querySelectorAll('.btn-opcion-vis');
  botones.forEach(btn => btn.disabled = !distanciaOptima);
}

function armarBateriaAleatoria() {
  const cromatica = [...BANCO_ISHIHARA].sort(() => Math.random() - 0.5).slice(0, 3).map(it => ({
    tipo: 'ISHIHARA',
    num: it.num,
    fondo: it.fondo,
    pat: it.pat,
    opciones: [...it.opc].sort(() => Math.random() - 0.5)
  }));

  const escalas = ['4.2rem', '2.8rem', '1.6rem'];
  const agudeza = escalas.map(tam => {
    const itemE = ANGULOS_E[Math.floor(Math.random() * ANGULOS_E.length)];
    return {
      tipo: 'OPTOTIPO',
      orientacion: itemE.ang,
      tamano: tam,
      respuestaCorrecta: itemE.dir,
      opciones: ['Derecha', 'Izquierda', 'Arriba', 'Abajo']
    };
  });

  return modo === 'DEMO' ? [cromatica[0], agudeza[0]] : [...cromatica, ...agudeza];
}

btnIniciar.addEventListener('click', () => {
  btnIniciar.style.display = 'none';
  contenedorOpciones.style.display = 'grid';
  indicePrueba = 0;
  aciertosCromaticos = 0;
  aciertosAgudeza = 0;
  bateriaActual = armarBateriaAleatoria();
  presentarEstimulo();
});

function presentarEstimulo() {
  const est = bateriaActual[indicePrueba];
  contenedorOpciones.innerHTML = '';

  if (est.tipo === 'ISHIHARA') {
    canvasIshihara.style.display = 'block';
    simboloOptotipo.style.display = 'none';
    panelEstado.innerText = `Placa Cromática ${indicePrueba + 1}: ¿Qué número ves?`;
    panelEstado.style.color = '#38bdf8';
    dibujarPlacaIshihara(est.num, est.fondo, est.pat);

    est.opciones.forEach(opc => {
      const b = document.createElement('button');
      b.className = 'btn-opcion-vis';
      b.innerText = opc;
      b.disabled = !distanciaOptima;
      b.onclick = () => procesarRespuesta(opc === est.num);
      contenedorOpciones.appendChild(b);
    });
  } else {
    canvasIshihara.style.display = 'none';
    simboloOptotipo.style.display = 'block';
    simboloOptotipo.style.transform = `rotate(${est.orientacion}deg)`;
    simboloOptotipo.style.fontSize = est.tamano;
    panelEstado.innerText = 'Agudeza: ¿Hacia qué dirección apuntan las patas de la E?';
    panelEstado.style.color = '#4ade80';

    est.opciones.forEach(dir => {
      const b = document.createElement('button');
      b.className = 'btn-opcion-vis';
      b.innerText = dir;
      b.disabled = !distanciaOptima;
      b.onclick = () => procesarRespuesta(dir === est.respuestaCorrecta);
      contenedorOpciones.appendChild(b);
    });
  }
}

function procesarRespuesta(acerto) {
  const est = bateriaActual[indicePrueba];
  if (est.tipo === 'ISHIHARA' && acerto) aciertosCromaticos++;
  if (est.tipo === 'OPTOTIPO' && acerto) aciertosAgudeza++;

  indicePrueba++;
  if (indicePrueba < bateriaActual.length) {
    presentarEstimulo();
  } else {
    finalizarTestVisual();
  }
}

function dibujarPlacaIshihara(num, fondo, pat) {
  ctxIshihara.clearRect(0, 0, 200, 200);
  for (let i = 0; i < 500; i++) {
    const radioC = Math.random() * 85;
    const ang = Math.random() * Math.PI * 2;
    const x = 100 + radioC * Math.cos(ang);
    const y = 100 + radioC * Math.sin(ang);
    ctxIshihara.beginPath();
    ctxIshihara.arc(x, y, Math.random() * 3.5 + 2, 0, Math.PI * 2);
    ctxIshihara.fillStyle = fondo;
    ctxIshihara.globalAlpha = 0.7;
    ctxIshihara.fill();
  }
  ctxIshihara.font = 'bold 64px Arial';
  ctxIshihara.fillStyle = pat;
  ctxIshihara.textAlign = 'center';
  ctxIshihara.textBaseline = 'middle';
  ctxIshihara.globalAlpha = 0.95;
  ctxIshihara.fillText(num, 100, 105);
  ctxIshihara.globalAlpha = 1.0;
}

function finalizarTestVisual() {
  contenedorOpciones.style.display = 'none';

  if (modo === 'DEMO') {
    CreditManager.marcarDemoCompletado('visual');
    const numSim = CreditManager.obtenerNumeroSimulacionActual('visual');
    panelEstado.innerText = `Calibración visual completada. Listo para Simulación Oficial ${numSim} de 3.`;
    panelEstado.style.color = '#4ade80';

    btnIniciar.style.display = 'block';
    btnIniciar.innerText = `Iniciar Simulación Oficial (${numSim} de 3)`;
    btnIniciar.style.backgroundColor = '#22c55e';
    modo = 'OFICIAL';
  } else {
    if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());

    const total = aciertosCromaticos + aciertosAgudeza;
    const efectividad = Math.round((total / 6) * 100);
    const aprobado = efectividad >= 80;
    const consumidas = CreditManager.registrarConsumo('visual');

    localStorage.setItem('sensometrika_visual', JSON.stringify({
      aciertosCromaticos,
      aciertosAgudeza,
      efectividad,
      dictamenVisual: aprobado ? 'SIN ALERTAS PREVIAS' : 'ALERTA: Sugiere revisión de lentes',
      aprobado
    }));

    CreditManager.pintarBadgeCabecera('caja-contador-simulacion', 'visual');
    const bloqueoTotal = consumidas >= CreditManager.LIMITE_SIMULACIONES;

    const sesion = CreditManager.obtenerSesion();
    const tieneAuditivo = sesion.modulosPermitidos && sesion.modulosPermitidos.includes('auditivo');
    const siguienteUrl = tieneAuditivo ? 'audicion.html' : 'informe.html';
    const textoBoton = tieneAuditivo ? 'Continuar a Módulo 5 (Tamizaje Auditivo) →' : '📊 Ver Informe y Dictamen Final';

    panelEstado.innerText = 'Tamizaje Visual Oficial completado.';

    zonaCoordinacion.innerHTML = `
      <div style="background: #020617; border: 1.5px solid ${aprobado ? '#38bdf8' : '#ef4444'}; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; width: 100%; box-sizing: border-box;">
        <h3 style="color: ${aprobado ? '#4ade80' : '#f87171'}; margin: 0 0 6px 0; font-size: 1.1rem;">
          ¡Simulación ${consumidas}/3 Finalizada!
        </h3>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 8px;">
          Efectividad: <strong style="color: #fff;">${efectividad}%</strong> (${aprobado ? 'Sin Alertas' : 'Observado'})
        </p>
        <p style="color: #38bdf8; font-size: 0.82rem; font-weight: bold; margin-bottom: 12px;">
          ${bloqueoTotal ? 'Has alcanzado el límite de 3/3 simulaciones de este módulo.' : `Te restan ${3 - consumidas} simulación(es) en este módulo.`}
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="${siguienteUrl}" class="btn-principal" style="display:flex; justify-content:center; align-items:center; text-decoration:none; height:44px; background-color:#0284c7; color:#fff; border-radius:6px; font-weight:bold; font-size:0.9rem;">
            ${textoBoton}
          </a>
          <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:6px;">
            Volver al Menú Principal
          </a>
        </div>
      </div>
    `;
  }
}