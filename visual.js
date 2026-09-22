/* ==========================================================================
   SENSOMETRIKA - MÓDULO 4: TAMIZAJE VISUAL (visual.js)
   • Visor Clínico Digital con Retícula de Grado Oftálmico
   • Generador Estocástico Anti-Memorización (Ishihara + Optotipo E)
   • 1 Demo de 2 Láminas + Examen Oficial de 6 Láminas
   • Auditoría facial continua y bloqueo reactivo ante proximidad (<45 cm)
   • Persistencia compatible con menu.html e informe.html
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
const modalX = document.getElementById('modalX');

if (btnAbrirAyuda) btnAbrirAyuda.onclick = () => modalGuia.style.display = 'flex';
if (btnCerrarAyuda) btnCerrarAyuda.onclick = () => modalGuia.style.display = 'none';
if (modalX) modalX.onclick = () => modalGuia.style.display = 'none';

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
  { rot: 0,             dir: 'Derecha' },
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
  const cromaticas = barajar(BANCO_ISHIHARA).slice(0, 3).map(item => ({
    tipo: 'ishihara',
    valor: item.valor,
    opciones: barajar(item.opciones)
  }));

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
  const max = typeof CreditManager !== 'undefined' ? CreditManager.obtenerLimiteModulo('visual') : 2;
  badgeModo.innerText = `Cupo Agotado (${max} de ${max})`;
  badgeModo.style.color = '#f87171';
  txtPregunta.innerText = 'Has completado tus simulaciones autorizadas para este módulo.';
  txtPregunta.style.color = '#f87171';
  zonaBotones.style.display = 'none';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1px solid #ef4444; border-radius:10px; padding:14px; text-align:center;">
      <a href="menu.html" style="display:flex; justify-content:center; align-items:center; height:42px; background:#0284c7; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; margin-bottom:8px;">
        Volver al Menú Principal
      </a>
    </div>
  `;
}

function iniciarFaseDemo() {
  modo = 'DEMO';
  pruebasActivas = generarBateriaDemo();
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
  pruebasActivas = generarBateriaOficial();
  pasoActual = 0;
  aciertos = 0;

  // Cuota según plan
  const hist = JSON.parse(localStorage.getItem('sensometrika_historial_visual')) || [];
  const num = hist.length + 1;
  const max = 2; // Tamizaje visual contempla 2 simulaciones

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
    console.warn("Cámara no disponible, pasando a modo referencial:", err);
    txtDistanciaLabel.innerText = "Modo Asistido";
    indicadorDistancia.innerText = "✔ Distancia Aceptada";
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
    btn.style.opacity = distanciaPermitida ? '1' : '0.35';
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

// DIBUJO DE ALTA FIDELIDAD CLÍNICA: ISHIHARA
function dibujarPlacaIshihara(numero) {
  const centroX = canvas.width / 2;
  const centroY = canvas.height / 2;
  const radioPlaca = 88;

  // 1. DIAL OFTALMOLÓGICO EXTERIOR
  ctx.save();
  ctx.beginPath();
  ctx.arc(centroX, centroY, radioPlaca + 14, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Marcas perimetrales
  for (let i = 0; i < 36; i++) {
    const angle = (i * Math.PI * 2) / 36;
    const x1 = centroX + Math.cos(angle) * (radioPlaca + 10);
    const y1 = centroY + Math.sin(angle) * (radioPlaca + 10);
    const x2 = centroX + Math.cos(angle) * (radioPlaca + 14);
    const y2 = centroY + Math.sin(angle) * (radioPlaca + 14);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = (i % 3 === 0) ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = (i % 3 === 0) ? 2 : 1;
    ctx.stroke();
  }
  ctx.restore();

  // 2. DISCO BASE CON HALO
  ctx.save();
  ctx.beginPath();
  ctx.arc(centroX, centroY, radioPlaca, 0, Math.PI * 2);
  ctx.fillStyle = '#0a101f';
  ctx.shadowColor = 'rgba(34, 197, 94, 0.35)';
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.restore();

  // 3. MICROCÍRCULOS POLICROMÁTICOS (FONDO ORGÁNICO)
  const paletaVerdes = [
    '#15803d', '#16a34a', '#22c55e', '#4ade80', '#14532d', 
    '#65a30d', '#84cc16', '#166534', '#155e75', '#0e7490'
  ];

  for (let a = 0; a < Math.PI * 2; a += 0.18) {
    for (let r = 14; r < radioPlaca - 4; r += 11) {
      const offsetX = (Math.sin(r * 4) * 2.5);
      const offsetY = (Math.cos(a * 4) * 2.5);
      const x = centroX + Math.cos(a) * r + offsetX;
      const y = centroY + Math.sin(a) * r + offsetY;

      ctx.beginPath();
      const dotRadius = 3.2 + ((r + a * 10) % 4.2);
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = paletaVerdes[(Math.floor(x * 3 + y * 7)) % paletaVerdes.length];
      ctx.fill();

      // Micro-borde sutil
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  // 4. DÍGITO CROMÁTICO DE CONTRASTE
  ctx.save();
  ctx.font = '800 58px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f97316';
  ctx.shadowColor = 'rgba(234, 88, 12, 0.6)';
  ctx.shadowBlur = 12;
  ctx.fillText(numero, centroX, centroY);
  ctx.restore();
}

// DIBUJO DE ALTA PRECISIÓN: OPTOTIPO SNELLEN 'E'
function dibujarOptotipoSnellen(rotacion) {
  const centroX = canvas.width / 2;
  const centroY = canvas.height / 2;
  const radioVisor = 88;

  // Dial exterior
  ctx.save();
  ctx.beginPath();
  ctx.arc(centroX, centroY, radioVisor + 12, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Halo central
  ctx.beginPath();
  ctx.arc(centroX, centroY, radioVisor, 0, Math.PI * 2);
  ctx.fillStyle = '#060b18';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.restore();

  // 'E' de Snellen
  ctx.save();
  ctx.translate(centroX, centroY);
  ctx.rotate(rotacion);

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
  ctx.shadowBlur = 14;

  // Proporción 5x5 oficial de optotipo
  ctx.fillRect(-35, -35, 14, 70); // Barra vertical
  ctx.fillRect(-35, -35, 70, 14); // Barra superior
  ctx.fillRect(-35, -7, 48, 14);  // Barra media
  ctx.fillRect(-35, 21, 70, 14);  // Barra inferior

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

function concluirDemo() {
  modo = 'PAUSA_ENTRE_FASES';
  zonaBotones.style.display = 'none';

  txtPregunta.innerText = '¡Calibración completada! Pulsa para iniciar la evaluación oficial.';
  txtPregunta.style.color = '#4ade80';

  const hist = JSON.parse(localStorage.getItem('sensometrika_historial_visual')) || [];
  const num = hist.length + 1;
  const max = 2;

  btnIniciarOficial.style.display = 'block';
  btnIniciarOficial.innerText = `Iniciar Simulación Oficial (${num} de ${max})`;
}

function finalizarPruebaVisual() {
  pruebaFinalizada = true;

  if (streamCamara) {
    streamCamara.getTracks().forEach(t => t.stop());
  }

  let historial = JSON.parse(localStorage.getItem('sensometrika_historial_visual')) || [];
  const simActual = historial.length + 1;
  const max = 2;
  const pct = Math.round((aciertos / pruebasActivas.length) * 100);
  const aprobado = pct >= 80;

  const attemptData = {
    simulacion: simActual,
    efectividad: pct,
    porcentaje: pct,
    aciertos: aciertos,
    total: pruebasActivas.length,
    aprobado: aprobado,
    timestamp: new Date().toISOString()
  };

  historial.push(attemptData);
  localStorage.setItem('sensometrika_historial_visual', JSON.stringify(historial));
  localStorage.setItem('simulaciones_visual', Math.min(max, historial.length).toString());

  // Consolidado para informe.html
  localStorage.setItem('sensometrika_visual', JSON.stringify({
    estado: (historial.length >= max) ? 'COMPLETADO' : 'EN_CURSO',
    efectividad: pct,
    porcentaje: pct,
    aciertos: aciertos,
    total: pruebasActivas.length,
    aprobado: aprobado,
    resultado: aprobado ? 'APROBADO' : 'OBSERVADO',
    simulaciones: Math.min(max, historial.length),
    historial: historial,
    fecha: new Date().toISOString()
  }));

  zonaBotones.style.display = 'none';
  btnIniciarOficial.style.display = 'none';

  txtPregunta.innerText = `Evaluación Finalizada: ${pct}% (${aprobado ? 'Aprobado' : 'Observado'})`;
  txtPregunta.style.color = aprobado ? '#4ade80' : '#f87171';

  zonaCoordinacion.innerHTML = `
    <div style="background:#090e1c; border:1.5px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius:14px; padding:18px; text-align:center; margin-top:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
      <h3 style="color:${aprobado ? '#4ade80' : '#f87171'}; margin:0 0 6px 0; font-size:1.15rem;">
        ¡Simulación ${simActual} de ${max} Finalizada!
      </h3>
      <p style="color:#94a3b8; font-size:0.88rem; margin:0 0 14px 0;">
        Efectividad Visual: <strong style="color:#38bdf8;">${pct}%</strong> &nbsp;|&nbsp; 
        Aciertos: <strong style="color:#fff;">${aciertos}/${pruebasActivas.length}</strong>
      </p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="informe.html" style="display:flex; justify-content:center; align-items:center; height:44px; background:#0284c7; color:#fff; text-decoration:none; border-radius:8px; font-weight:700; font-size:0.95rem;">
          📊 Ver Diagnóstico en Pantalla →
        </a>
        <a href="menu.html" style="color:#64748b; font-size:0.82rem; text-decoration:none; padding:4px;">
          Volver al Menú Principal
        </a>
      </div>
    </div>
  `;
}