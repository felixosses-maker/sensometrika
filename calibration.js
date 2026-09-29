// calibration.js - Módulo de Calibración Rápida con Memoria de Sesión

const UMBRALES_POR_PERFIL = {
    'demo': 400,       
    'operativo': 250,  
    'corporativo': 180 
};

let toquesTiempos = [];
let ultimoToque = 0;
const totalToquesRequeridos = 5;

export function montarInterfazCalibracion(containerId = 'app-container', perfilAcceso = 'demo', onSuccessCallback) {
    // 1. VERIFICAR SI YA FUE CALIBRADO EN ESTA SESIÓN
    const sesionCalibrada = sessionStorage.getItem('sensometrika_hardware_calibrado');
    if (sesionCalibrada === 'true') {
        console.log('Hardware ya calibrado en esta sesión. Omitiendo test...');
        if (typeof onSuccessCallback === 'function') onSuccessCallback();
        return; // No mostramos el modal
    }

    if (document.getElementById('sensometrika-calibration-wrapper')) return;

    const contenedor = document.getElementById(containerId) || document.body;

    const htmlCard = `
        <div id="sensometrika-calibration-wrapper" class="calibration-overlay">
            <div class="calibration-card">
                <span class="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/80 px-3 py-1 rounded-full border border-sky-500/30">
                    Filtro de Integridad Industrial
                </span>
                <h3 class="text-xl font-extrabold text-white mt-3 mb-1">Calibración de Hardware</h3>
                <p id="calibration-instructions" class="text-xs text-slate-400 mb-4 leading-relaxed">
                    Para calibrar su dispositivo, toque la caja verde de abajo <strong>5 veces seguidas a su ritmo normal</strong>. (Solo se solicita una vez por sesión).
                </p>
                
                <div id="calibration-stimulus" class="stimulus-box">
                    ¡TOQUE AQUÍ 5 VECES!
                </div>

                <div id="calibration-status-box" class="text-xs text-slate-300 font-medium mb-4">
                    Progreso: 0 / 5 toques
                </div>

                <button id="btn-start-evaluation" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg" style="display:none;">
                    Acceder al Sistema →
                </button>
            </div>
        </div>

        <style>
            .calibration-overlay { position: fixed; inset: 0; background: rgba(7, 13, 24, 0.95); backdrop-filter: blur(8px); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
            .calibration-card { max-width: 480px; width: 100%; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 1rem; padding: 1.5rem; text-align: center; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); color: white; font-family: sans-serif; }
            .stimulus-box { width: 100%; height: 110px; background: #22c55e; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; border-radius: 0.75rem; margin: 1.25rem 0; cursor: pointer; user-select: none; transition: transform 0.1s; }
            .stimulus-box:active { transform: scale(0.97); background: #16a34a; }
        </style>
    `;

    const divTemp = document.createElement('div');
    divTemp.innerHTML = htmlCard;
    contenedor.appendChild(divTemp);

    const cajaEstimulo = document.getElementById('calibration-stimulus');
    toquesTiempos = [];
    ultimoToque = 0;

    cajaEstimulo.onclick = () => {
        const ahora = performance.now();
        
        if (ultimoToque > 0) {
            const delta = ahora - ultimoToque;
            toquesTiempos.push(delta);
        }
        
        ultimoToque = ahora;
        const actual = toquesTiempos.length + 1;
        
        document.getElementById('calibration-status-box').innerText = `Progreso: ${actual} / ${totalToquesRequeridos} toques`;

        if (toquesTiempos.length >= (totalToquesRequeridos - 1)) {
            cajaEstimulo.style.pointerEvents = 'none';
            cajaEstimulo.style.background = '#334155';
            cajaEstimulo.innerText = '¡Calibración Completa!';
            finalizarCalibracionPorPulsacion(perfilAcceso, onSuccessCallback);
        }
    };
}

function finalizarCalibracionPorPulsacion(perfil, onSuccessCallback) {
    let promedioIntervalo = 150;
    if (toquesTiempos.length > 0) {
        const suma = toquesTiempos.reduce((a, b) => a + b, 0);
        promedioIntervalo = Math.round(suma / toquesTiempos.length);
    }

    const limitePermitido = UMBRALES_POR_PERFIL[perfil] || UMBRALES_POR_PERFIL['demo'];

    let tierStatus = '';
    let mensajeUI = '';
    let permitirAcceso = true;

    if (promedioIntervalo <= limitePermitido) {
        tierStatus = 'OPTIMAL_OR_ACCEPTABLE';
        mensajeUI = `¡Calibración exitosa! Ritmo: ${promedioIntervalo} ms (Apto).`;
    } else {
        tierStatus = 'BLOCKED_HIGH_LATENCY';
        mensajeUI = `Intervalo detectado (${promedioIntervalo} ms). Límite permitido: ${limitePermitido} ms.`;
        permitirAcceso = false;
    }

    window.sensometrikaSessionData = {
        input_latency_ms: promedioIntervalo,
        hardware_tier: tierStatus,
        perfil_evaluacion: perfil,
        device_info: { intervalos: toquesTiempos, userAgent: navigator.userAgent }
    };

    const statusBox = document.getElementById('calibration-status-box');
    const btnStartEval = document.getElementById('btn-start-evaluation');

    if (statusBox) statusBox.innerText = mensajeUI;

    if (permitirAcceso) {
        // 2. GUARDAR EN SESIÓN QUE YA ESTÁ CALIBRADO
        sessionStorage.setItem('sensometrika_hardware_calibrado', 'true');

        if (btnStartEval) {
            btnStartEval.style.display = 'block';
            btnStartEval.onclick = () => {
                const overlay = document.getElementById('sensometrika-calibration-wrapper');
                if (overlay) overlay.remove();
                if (typeof onSuccessCallback === 'function') onSuccessCallback();
            };
        }
    } else {
        const cajaEstimulo = document.getElementById('calibration-stimulus');
        cajaEstimulo.style.pointerEvents = 'auto';
        cajaEstimulo.style.background = '#22c55e';
        cajaEstimulo.innerText = 'Tocar para reintentar';
        toquesTiempos = [];
        ultimoToque = 0;
    }
}