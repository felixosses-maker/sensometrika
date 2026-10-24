/**
 * SENSOMETRIKA - Core Módulo de Encandilamiento y Recuperación Visual
 * Cumplimiento D.S. N° 170 MTT / Estándar Ocupacional Faenas Nocturnas
 * Integrado con modo B2B, sesión única y aislamiento estricto por RUT
 */

class ModuloEncandilamiento {
  constructor(config = {}) {
    this.canvasId = config.canvasId || 'canvasEncandilamiento';
    this.containerId = config.containerId || 'containerEncandilamiento';
    this.latenciaHardwareMs = config.latenciaHardwareMs || 16;
    this.onFinish = config.onFinish || function() {};
    
    this.fase = 'IDLE'; // IDLE, ADAPTACION, ENCANDILAMIENTO, RECUPERACION, FIN
    this.tiempoInicioEncandilamiento = 0;
    this.tiempoFinEncandilamiento = 0;
    this.tiempoRespuesta = 0;
    
    this.direccionObjetivo = 'ARRIBA'; // ARRIBA, ABAJO, IZQUIERDA, DERECHA
    this.intentos = [];
    this.maxIntentos = 3;
    this.intentoActual = 0;
    
    this.initUI();
  }

  initUI() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div id="encandilaOverlay" style="position:relative; width:100%; height:260px; background:#000; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; justify-content:center; align-items:center; border:1px solid var(--card-border);">
        <div id="screenFlash" style="position:absolute; inset:0; background:#fff; opacity:0; transition:opacity 0.1s; z-index:10;"></div>
        <div id="targetDisplay" style="z-index:5; display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div id="lblEstadoEncandila" style="color:var(--text-muted); font-size:0.75rem; font-weight:800; text-transform:uppercase; text-align:center;">Presiona Iniciar Prueba</div>
          <div id="stimulusBox" style="width:90px; height:90px; display:flex; justify-content:center; align-items:center; font-size:3rem; font-weight:900; color:rgba(255, 255, 255, 0.18); transition: color 0.2s ease;">•</div>
        </div>
      </div>
      <div id="controlsEncandila" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px; opacity:0.3; pointer-events:none;">
        <div></div>
        <button class="btn-ctrl-enc" onclick="window.instanciaEncandila.responder('ARRIBA')" style="background:#0b1320; border:1px solid var(--accent-cyan); color:#fff; padding:12px; border-radius:8px; font-weight:900; font-size:1.2rem; cursor:pointer;">▲</button>
        <div></div>
        <button class="btn-ctrl-enc" onclick="window.instanciaEncandila.responder('IZQUIERDA')" style="background:#0b1320; border:1px solid var(--accent-cyan); color:#fff; padding:12px; border-radius:8px; font-weight:900; font-size:1.2rem; cursor:pointer;">◄</button>
        <button class="btn-ctrl-enc" onclick="window.instanciaEncandila.responder('ABAJO')" style="background:#0b1320; border:1px solid var(--accent-cyan); color:#fff; padding:12px; border-radius:8px; font-weight:900; font-size:1.2rem; cursor:pointer;">▼</button>
        <button class="btn-ctrl-enc" onclick="window.instanciaEncandila.responder('DERECHA')" style="background:#0b1320; border:1px solid var(--accent-cyan); color:#fff; padding:12px; border-radius:8px; font-weight:900; font-size:1.2rem; cursor:pointer;">►</button>
      </div>
    `;
    window.instanciaEncandila = this;
  }

  iniciarEvaluacion() {
    this.intentos = [];
    this.intentoActual = 0;
    this.siguienteEnsayo();
  }

  siguienteEnsayo() {
    if (this.intentoActual >= this.maxIntentos) {
      this.finalizarPrueba();
      return;
    }

    this.intentoActual++;
    this.fase = 'ADAPTACION';
    
    const lbl = document.getElementById('lblEstadoEncandila');
    const flash = document.getElementById('screenFlash');
    const box = document.getElementById('stimulusBox');
    const ctrls = document.getElementById('controlsEncandila');
    
    const lblEnsayo = document.getElementById('lblEnsayo');
    if (lblEnsayo) lblEnsayo.textContent = `${this.intentoActual}/${this.maxIntentos}`;

    ctrls.style.opacity = '0.3';
    ctrls.style.pointerEvents = 'none';
    flash.style.opacity = '0';
    box.style.color = 'rgba(255, 255, 255, 0.05)';
    box.textContent = '+';
    lbl.textContent = `ENSAYO ${this.intentoActual}/${this.maxIntentos} - ADAPTACIÓN NOCTURNA...`;

    // 1. Fase de Adaptación (2.5 segundos)
    setTimeout(() => {
      this.fase = 'ENCANDILAMIENTO';
      lbl.textContent = '⚡ ENCANDILAMIENTO EN CURSO...';
      flash.style.opacity = '1'; // Destello Blanco total

      const duracionDestello = Math.floor(Math.random() * 1500) + 2500; // 2.5s a 4s

      // 2. Fin de Encandilamiento y Despliegue de Estímulo Tenue
      setTimeout(() => {
        flash.style.opacity = '0';
        this.fase = 'RECUPERACION';
        this.tiempoFinEncandilamiento = performance.now();

        // Generar dirección aleatoria
        const dirs = ['ARRIBA', 'ABAJO', 'IZQUIERDA', 'DERECHA'];
        this.direccionObjetivo = dirs[Math.floor(Math.random() * dirs.length)];
        
        const simboMap = { 'ARRIBA': '▲', 'ABAJO': '▼', 'IZQUIERDA': '◄', 'DERECHA': '►' };
        box.textContent = simboMap[this.direccionObjetivo];
        
        // Flecha tenue de bajo contraste deliberado para evaluar recuperación visual nocturna
        box.style.color = 'rgba(255, 255, 255, 0.18)'; 

        lbl.textContent = '👁 INDICA LA DIRECCIÓN DEL SÍMBOLO REVELADO';
        ctrls.style.opacity = '1';
        ctrls.style.pointerEvents = 'auto';
      }, duracionDestello);

    }, 2500);
  }

  responder(direccionMarcada) {
    if (this.fase !== 'RECUPERACION') return;

    const tReaccionBruto = Math.round(performance.now() - this.tiempoFinEncandilamiento);
    const tReaccionNeto = Math.max(100, tReaccionBruto - this.latenciaHardwareMs);
    const esCorrecto = (direccionMarcada === this.direccionObjetivo);

    this.intentos.push({
      ensayo: this.intentoActual,
      tiempoMs: tReaccionNeto,
      correcto: esCorrecto
    });

    const lblErrores = document.getElementById('lblErrores');
    if (lblErrores) {
      const errCount = this.intentos.filter(i => !i.correcto).length;
      lblErrores.textContent = errCount;
    }

    this.fase = 'ESPERA';
    document.getElementById('controlsEncandila').style.opacity = '0.3';
    document.getElementById('controlsEncandila').style.pointerEvents = 'none';

    setTimeout(() => {
      this.siguienteEnsayo();
    }, 1200);
  }

  finalizarPrueba() {
    this.fase = 'FIN';
    const tiemposOk = this.intentos.filter(i => i.correcto).map(i => i.tiempoMs);
    const promMs = tiemposOk.length > 0 ? Math.round(tiemposOk.reduce((a,b)=>a+b,0)/tiemposOk.length) : 5000;
    const aciertos = tiemposOk.length;
    const aprobado = (promMs <= 3000) && (aciertos >= 2);

    const resultadoFinal = {
      promediodB: promMs,
      tiempoRecuperacionMs: promMs,
      aciertos: aciertos,
      totalIntentos: this.maxIntentos,
      aprobado: aprobado
    };

    // Guardar en Historial Local por trabajador y sesión con claves aisladas B2B
    const datosUser = JSON.parse(localStorage.getItem('sensometrika_datos_usuario')) || {};
    const urlParams = new URLSearchParams(window.location.search);
    const rut = urlParams.get('rut') || datosUser.rut || 'DEMO';
    const cleanRut = rut.replace(/[^0-9Kk]/g, '');
    const sessionId = urlParams.get('session') || localStorage.getItem('sensometrika_session_activa') || `SESION_${cleanRut}_${Date.now()}`;
    
    const claveHistorial = `sensometrika_historial_encandilamiento_${cleanRut}_${sessionId}`;
    const claveLast = `sensometrika_last_encandilamiento_${cleanRut}_${sessionId}`;
    
    let hist = JSON.parse(localStorage.getItem(claveHistorial)) || [];
    hist.push(resultadoFinal);
    localStorage.setItem(claveHistorial, JSON.stringify(hist));

    // Guardado del último resultado individual para trazabilidad del menú B2B
    localStorage.setItem(claveLast, JSON.stringify({
      ...resultadoFinal,
      go_no_go_flag: aprobado,
      fecha: new Date().toISOString()
    }));

    document.getElementById('lblEstadoEncandila').textContent = `PRUEBA FINALIZADA - TIEMPO PROM: ${(promMs/1000).toFixed(2)}s`;
    
    if (this.onFinish) {
      this.onFinish(resultadoFinal);
    }
  }
}