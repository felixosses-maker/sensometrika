/* ==========================================================================
   SENSOMETRIKA - MÓDULO 4: TAMIZAJE VISUAL (visual.js)
   • Generador Estocástico Anti-Memorización (Ishihara + Optotipo E)
   • 1 Demo de 2 Láminas + Examen Oficial de 6 Láminas
   • Auditoría facial continua y bloqueo reactivo ante proximidad (<45 cm)
   • Conexión con CreditManager y persistencia completa
   ========================================================================== */

const canvas = document.getElementById('lienzo-visual');
const ctx = canvas.getContext('2d');

const badgeModo = document.getElementById('badge-modo');
const txtPlacaTitulo = document.getElementById('txt-placa-titulo');
const txtDistanciaLabel = document.getElementById('txt-distancia-label');
const indicadorDistancia = document.getElementById('indicador-distancia');
const txtPregunta = document.getElementById('txt-pregunta');
const zonaBotones = document.getElementById('zona-botones-respuestas');
const btnIniciarOficial = document.getElementById('btn-iniciar-oficial');
const zonaCoordinacion = document.getElementById('zona-coordinacion-test');

const metricaFase = document.getElementById('metrica-fase');
const metricaAciertos = document.getElementById('metrica-aciertos');
const metricaEfectividad = document.getElementById('metrica-efectividad');

// Cámara
const video = document.getElementById('video-camara');
const procCanvas = document.getElementById('canvas-procesamiento-camara');
const procCtx = procCanvas ? procCanvas.getContext('2d', { willReadFrequently: true }) : null;

// Modal
const modalGuia = document.getElementById('modal-guia');
const btnAbrirAyuda = document.getElementById('btn-abrir-ayuda');
const btnCerrarAyuda = document.getElementById('btn-cerrar-ayuda');

if (btnAbrirAyuda) btnAbrirAyuda.onclick = () => modalGuia.style.display = 'flex';
if (btnCerrarAyuda) btnCerrarAyuda.onclick = () => modalGuia.style.display = 'none';

// BANCO DE DATOS CROMÁTICOS (ISHIHARA)
const BANCO_ISHIHARA = [
  { valor: '12', opciones: ['12', '74', '8', 'No distingo'] },
  { valor: '8',  opciones: ['3', '8', '6', 'No distingo'] },
  { valor: '74', opciones: ['21', '74', '71', 'No distingo'] },
  { valor: '6',  opciones: ['5', '6', '8', 'No distingo'] },
  { valor: '29', opciones: ['70', '29', '26', 'No distingo'] },
  { valor: '5',  opciones: ['2', '5', '3', 'No distingo'] }
];

// ÁNGULOS POSIBLES PARA EL OPTOTIPO 'E'
const ORIENTACIONES_E = [
  { rot: 0,              dir: 'Derecha' },
  { rot: Math.PI,        dir: 'Izquierda' },
  { rot: -Math.PI / 2,   dir: 'Arriba' },
  { rot: Math.PI / 2,    dir: 'Abajo' }
];

function barajar(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// GENERADORES ESTOCÁSTICOS (ANTI-MEMORIZACIÓN)
function generarBateriaDemo() {
  const cromatica = barajar(BANCO_ISHIHARA)[0];
  const agudeza = ORIENTACIONES_E[Math.floor(Math.random() * ORIENTACIONES_E.length)];

  return [
    {
      tipo: 'ishihara',
      valor: cromatica.valor,
      opciones: barajar(cromatica.opciones)
    },
    {
      tipo: 'snellen',
      rotacion: agudeza.rot,
      valor: agudeza.dir,
      opciones: barajar(['Derecha', 'Izquierda', 'Arriba', 'Abajo'])
    }
  ];
}

function generarBateriaOficial() {
  // 3 láminas cromáticas extraídas al azar sin repetir
  const cromaticas = barajar(BANCO_ISHIHARA).slice(0, 3).map(item => ({
    tipo: 'ishihara',
    valor: item.valor,
    opciones: barajar(item.opciones)
  }));

  // 3 optotipos E con orientaciones aleatorias
  const agudezas = [0, 1, 2].map(() => {
    const elegido = ORIENTACIONES_E[Math.floor(Math.random() * ORIENTACIONES_E.length)];
    return {
      tipo: 'snellen',
      rotacion: elegido.rot,
      valor: elegido.dir,
      opciones: barajar(['Derecha', 'Izquierda', 'Arriba', 'Abajo'])
    };
  });

  return [...cromaticas, ...agudezas];
}

let modo = 'DEMO';
let pruebasActivas = [];
let pasoActual = 0;
let aciertos = 0;
let streamCamara = null;
let distanciaPermitida = true;
let pruebaFinalizada = false;

window.addEventListener('DOMContentLoaded', () => {
  if (typeof CreditManager !== 'undefined') {
    if (!CreditManager.puedeRendir('visual')) {
      bloquearModuloPorCupo();
      return;
    }
  }

  iniciarCamara();
  iniciarFaseDemo();
});

function bloquearModuloPorCupo() {
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('visual') : 4;
  badgeModo.innerText = `Cupo Agotado (${max} de ${max})`;
  badgeModo.style.color = '#f87171';
  txtPregunta.innerText = 'Has completado tus simulaciones autorizadas para este módulo.';
  txtPregunta.style.color = '#f87171';
  zonaBotones.style.display = 'none';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1px solid #ef4444; border-radius:10px; padding:14px; text-align:center;">
      <a href="audicion.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; margin-bottom:8px;">
        Continuar a Módulo 5 (Tamizaje Auditivo) →
      </a>
      <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none;">Volver al Menú Principal</a>
    </div>
  `;
}

function iniciarFaseDemo() {
  modo = 'DEMO';
  pruebasActivas = generarBateriaDemo(); // Generación aleatoria para el demo
  pasoActual = 0;
  aciertos = 0;

  badgeModo.innerText = '🟡 Calibración Técnica (Demo)';
  badgeModo.style.color = '#facc15';
  badgeModo.style.background = 'rgba(250, 204, 21, 0.1)';
  badgeModo.style.borderColor = 'rgba(250, 204, 21, 0.25)';

  txtPlacaTitulo.innerText = '🟡 Calibración Biométrica';
  txtPlacaTitulo.style.color = '#facc15';

  metricaFase.innerText = 'Demo';
  metricaAciertos.innerText = `0 / ${pruebasActivas.length}`;
  metricaEfectividad.innerText = '100%';

  btnIniciarOficial.style.display = 'none';
  zonaBotones.style.display = 'grid';

  cargarEstimulo();
}

function prepararFaseOficial() {
  modo = 'OFICIAL';
  pruebasActivas = generarBateriaOficial(); // Generación aleatoria anti-memorización para la evaluación oficial
  pasoActual = 0;
  aciertos = 0;

  const num = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('visual') : 1;
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('visual') : 4;

  badgeModo.innerText = `🔴 Simulación Oficial: ${num} de ${max}`;
  badgeModo.style.color = '#38bdf8';
  badgeModo.style.background = 'rgba(56, 189, 248, 0.1)';
  badgeModo.style.borderColor = 'rgba(56, 189, 248, 0.25)';

  txtPlacaTitulo.innerText = '🔴 Evaluación Activa';
  txtPlacaTitulo.style.color = '#38bdf8';

  metricaFase.innerText = 'Cromática';
  metricaAciertos.innerText = `0 / ${pruebasActivas.length}`;
  metricaEfectividad.innerText = '100%';

  btnIniciarOficial.style.display = 'none';
  zonaBotones.style.display = 'grid';

  cargarEstimulo();
}

btnIniciarOficial.addEventListener('click', () => {
  prepararFaseOficial();
});

// CÁMARA Y CONTROL BIOMÉTRICO
async function iniciarCamara() {
  try {
    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 160 }, height: { ideal: 120 } },
      audio: false
    });
    if (video) {
      video.srcObject = streamCamara;
      video.play();
      setInterval(auditarDistanciaFacial, 200);
    }
  } catch (err) {
    console.warn("Cámara no disponible, pasando a modo referencial asistido:", err);
    txtDistanciaLabel.innerText = "Modo Asistido";
    indicadorDistancia.innerText = "Distancia Aceptada";
    distanciaPermitida = true;
    aplicarBloqueoEnBotones();
  }
}

function auditarDistanciaFacial() {
  if (!video || !procCtx || video.readyState !== 4 || pruebaFinalizada) return;

  procCtx.drawImage(video, 0, 0, procCanvas.width, procCanvas.height);
  const frame = procCtx.getImageData(0, 0, procCanvas.width, procCanvas.height);

  let pixelesRostro = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    const r = frame.data[i], g = frame.data[i+1], b = frame.data[i+2];
    if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
      pixelesRostro++;
    }
  }

  const densidad = pixelesRostro / (procCanvas.width * procCanvas.height);
  const esFaseOptotipo = (pasoActual < pruebasActivas.length && pruebasActivas[pasoActual].tipo === 'snellen');

  if (esFaseOptotipo) {
    if (densidad > 0.32) {
      distanciaPermitida = false;
      txtDistanciaLabel.innerText = "Muy Cerca";
      txtDistanciaLabel.style.color = "#ef4444";
      indicadorDistancia.innerText = "⚠️ Muy Cerca: Estira el brazo";
      indicadorDistancia.style.color = "#ef4444";
      indicadorDistancia.style.borderColor = "rgba(239, 68, 68, 0.4)";
      indicadorDistancia.style.background = "rgba(239, 68, 68, 0.15)";
    } else if (densidad < 0.04) {
      distanciaPermitida = false;
      txtDistanciaLabel.innerText = "Sin Rostro";
      txtDistanciaLabel.style.color = "#facc15";
      indicadorDistancia.innerText = "👤 Ubica tu rostro al frente";
      indicadorDistancia.style.color = "#facc15";
      indicadorDistancia.style.borderColor = "rgba(250, 204, 21, 0.4)";
      indicadorDistancia.style.background = "rgba(250, 204, 21, 0.15)";
    } else {
      distanciaPermitida = true;
      txtDistanciaLabel.innerText = "Normal";
      txtDistanciaLabel.style.color = "#4ade80";
      indicadorDistancia.innerText = "✔ Distancia Óptima";
      indicadorDistancia.style.color = "#22c55e";
      indicadorDistancia.style.borderColor = "rgba(34, 197, 94, 0.3)";
      indicadorDistancia.style.background = "rgba(34, 197, 94, 0.1)";
    }
  } else {
    distanciaPermitida = true;
    txtDistanciaLabel.innerText = "Normal";
    txtDistanciaLabel.style.color = "#4ade80";
    indicadorDistancia.innerText = "✔ Posición Correcta";
    indicadorDistancia.style.color = "#22c55e";
    indicadorDistancia.style.borderColor = "rgba(34, 197, 94, 0.3)";
    indicadorDistancia.style.background = "rgba(34, 197, 94, 0.1)";
  }

  aplicarBloqueoEnBotones();
}

function aplicarBloqueoEnBotones() {
  const botones = zonaBotones.querySelectorAll('.btn-opcion-resp');
  botones.forEach(btn => {
    btn.disabled = !distanciaPermitida;
    btn.style.opacity = distanciaPermitida ? '1' : '0.3';
    btn.style.cursor = distanciaPermitida ? 'pointer' : 'not-allowed';
    btn.style.pointerEvents = distanciaPermitida ? 'auto' : 'none';
  });
}

// RENDERIZADO DEL ESTÍMULO
function cargarEstimulo() {
  if (pasoActual >= pruebasActivas.length) {
    if (modo === 'DEMO') {
      concluirDemo();
    } else {
      finalizarPruebaVisual();
    }
    return;
  }

  const p = pruebasActivas[pasoActual];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const prefijo = modo === 'DEMO' ? 'Demo' : 'Lámina';
  const total = pruebasActivas.length;

  if (p.tipo === 'ishihara') {
    metricaFase.innerText = modo === 'DEMO' ? 'Demo (Color)' : 'Cromática';
    txtPregunta.innerText = `${prefijo} ${pasoActual + 1} de ${total}: ¿Qué número ves en el círculo?`;
    dibujarPlacaIshihara(p.valor);
  } else {
    metricaFase.innerText = modo === 'DEMO' ? 'Demo (E)' : 'Agudeza (E)';
    txtPregunta.innerText = `${prefijo} ${pasoActual + 1} de ${total}: ¿Hacia dónde apuntan las barras de la 'E'?`;
    dibujarOptotipoSnellen(p.rotacion);
  }

  const botones = zonaBotones.querySelectorAll('.btn-opcion-resp');
  p.opciones.forEach((opc, idx) => {
    botones[idx].innerText = opc;
    botones[idx].onclick = () => {
      if (!distanciaPermitida) return;
      procesarRespuesta(opc === p.valor);
    };
  });

  aplicarBloqueoEnBotones();
}

function dibujarPlacaIshihara(numero) {
  const centroX = canvas.width / 2;
  const centroY = canvas.height / 2;
  const radioPlaca = 80;

  ctx.beginPath();
  ctx.arc(centroX, centroY, radioPlaca, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  const coloresFondo = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#14532d', '#65a30d'];

  for (let a = 0; a < Math.PI * 2; a += 0.22) {
    for (let r = 18; r < radioPlaca - 6; r += 14) {
      const x = centroX + Math.cos(a) * r + (Math.sin(r) * 3);
      const y = centroY + Math.sin(a) * r + (Math.cos(r) * 3);
      ctx.beginPath();
      ctx.arc(x, y, 4.5 + (r % 3), 0, Math.PI * 2);
      ctx.fillStyle = coloresFondo[(Math.floor(x + y)) % coloresFondo.length];
      ctx.fill();
    }
  }

  ctx.save();
  ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ea580c';
  ctx.shadowColor = 'rgba(234, 88, 12, 0.4)';
  ctx.shadowBlur = 8;
  ctx.fillText(numero, centroX, centroY);
  ctx.restore();
}

function dibujarOptotipoSnellen(rotacion) {
  const centroX = canvas.width / 2;
  const centroY = canvas.height / 2;

  ctx.save();
  ctx.translate(centroX, centroY);
  ctx.rotate(rotacion);

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
  ctx.shadowBlur = 10;

  ctx.fillRect(-35, -35, 14, 70);
  ctx.fillRect(-35, -35, 70, 14);
  ctx.fillRect(-35, -7, 48, 14);
  ctx.fillRect(-35, 21, 70, 14);

  ctx.restore();
}

function procesarRespuesta(correcta) {
  if (correcta) aciertos++;
  pasoActual++;

  const total = pruebasActivas.length;
  metricaAciertos.innerText = `${aciertos} / ${total}`;
  metricaEfectividad.innerText = `${Math.round((aciertos / Math.max(1, pasoActual)) * 100)}%`;

  cargarEstimulo();
}

// PAUSA TÉCNICA ENTRE DEMO Y OFICIAL
function concluirDemo() {
  modo = 'PAUSA_ENTRE_FASES';
  zonaBotones.style.display = 'none';

  txtPregunta.innerText = '¡Calibración completada! Presiona el botón para iniciar la evaluación oficial.';
  txtPregunta.style.color = '#4ade80';

  const num = typeof CreditManager !== 'undefined' ? CreditManager.obtenerNumeroSimulacionActual('visual') : 1;
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('visual') : 4;

  btnIniciarOficial.style.display = 'block';
  btnIniciarOficial.innerText = `Iniciar Simulación Oficial (${num} de ${max})`;
}

// FINALIZACIÓN OFICIAL
function finalizarPruebaVisual() {
  pruebaFinalizada = true;

  if (streamCamara) {
    streamCamara.getTracks().forEach(t => t.stop());
  }

  let consumidas = 1;
  if (typeof CreditManager !== 'undefined') {
    consumidas = CreditManager.registrarConsumo('visual');
  }

  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('visual') : 4;
  const pct = Math.round((aciertos / pruebasActivas.length) * 100);
  const aprobado = pct >= 80;

  localStorage.setItem('sensometrika_visual', JSON.stringify({
    efectividad: pct,
    porcentaje: pct,
    aciertos: aciertos,
    total: pruebasActivas.length,
    aprobado: aprobado,
    fecha: new Date().toISOString()
  }));

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_visual')) || [];
  historial.push({
    simulacion: consumidas,
    efectividad: pct,
    aprobado: aprobado
  });
  localStorage.setItem('sensometrika_historial_visual', JSON.stringify(historial));

  zonaBotones.style.display = 'none';
  btnIniciarOficial.style.display = 'none';
  txtPregunta.innerText = `Evaluación Finalizada: ${pct}% de acierto (${aprobado ? 'Aprobado' : 'Observado'})`;
  txtPregunta.style.color = aprobado ? '#4ade80' : '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:12px; padding:16px; text-align:center; margin-top:8px;">
      <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.05rem;">
        ¡Simulación ${consumidas} de ${max} Finalizada!
      </h3>
      <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 12px 0;">
        Efectividad Global: <strong style="color:#38bdf8;">${pct}%</strong> &nbsp;|&nbsp; 
        Aciertos: <strong style="color:#fff;">${aciertos}/${pruebasActivas.length}</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <a href="audicion.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:0.92rem;">
          Continuar a Módulo 5 (Tamizaje Auditivo) →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.8rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}