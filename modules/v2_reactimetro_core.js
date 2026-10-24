/**
 * Sensometrika Pro B2B - Reactímetro Core Engine
 * Motor de alta precisión para tiempos de reacción simple, discriminativa y freno de emergencia.
 * Integrado con LatencyTuner y aislamiento estricto por sesión/RUT.
 */

import { LatencyTuner } from '../calibracion/latency_tuner.js';

export class ReactimetroCoreEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.tuner = new LatencyTuner();

    this.trialsCount = options.trialsCount || 5;
    this.currentTrial = 0;
    this.isRunning = false;
    this.state = 'IDLE'; // IDLE, WAITING_STIMULUS, STIMULUS_ACTIVE, FINISHED

    this.stimulusTimestamp = 0;
    this.releaseTimestamp = 0;
    this.pressTimestamp = 0;

    this.trialsLog = [];
    this.falseStarts = 0;

    // Extracción de parámetros URL para aislamiento B2B
    const urlParams = new URLSearchParams(window.location.search);
    const rutEval = urlParams.get('rut') || 'GENERICO';
    this.cleanRut = rutEval.replace(/[^0-9Kk]/g, '');
    this.sessionParam = urlParams.get('session') || '';

    // Claves de almacenamiento aisladas por sesión y RUT
    this.claveHistorial = this.sessionParam 
      ? `sensometrika_historial_reactimetro_core_${this.cleanRut}_${this.sessionParam}` 
      : `sensometrika_historial_reactimetro_core_${this.cleanRut}`;

    this.claveLast = this.sessionParam 
      ? `sensometrika_last_reactimetro_core_${this.cleanRut}_${this.sessionParam}` 
      : `sensometrika_last_reactimetro_core_${this.cleanRut}`;
  }

  async init() {
    if (!this.canvas) throw new Error('Canvas no encontrado');
    await this.tuner.detectScreenRefreshRate();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) this.ctx.scale(dpr, dpr);
  }

  getRandomDelay(minMs = 1500, maxMs = 3500) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  registrarCierreSimulacion() {
    const metrics = this.getSummaryMetrics();
    const promedioMs = metrics.avg_reaction_time_ms !== '--' ? parseFloat(metrics.avg_reaction_time_ms) : 500;
    const aprobado = promedioMs <= 450 && metrics.false_starts <= 1;

    const resultadoFinal = {
      promedioTiempo: promedioMs,
      anticipaciones: metrics.false_starts,
      trialsCompleted: metrics.trials_completed,
      aprobado: aprobado,
      fecha: new Date().toISOString()
    };

    // Guardado riguroso en el historial aislado por sesión
    let historialActual = JSON.parse(localStorage.getItem(this.claveHistorial)) || [];
    historialActual.push(resultadoFinal);
    localStorage.setItem(this.claveHistorial, JSON.stringify(historialActual));

    // Guardado del último resultado individual para trazabilidad del menú B2B
    localStorage.setItem(this.claveLast, JSON.stringify({
      ...resultadoFinal,
      go_no_go_flag: aprobado
    }));

    return resultadoFinal;
  }

  getSummaryMetrics() {
    const validTrials = this.trialsLog.filter(t => t.isValid);
    const avgReactionMs = validTrials.length > 0
      ? (validTrials.reduce((a, b) => a + b.reactionTimeMs, 0) / validTrials.length).toFixed(1)
      : '--';

    return {
      trials_completed: this.trialsLog.length,
      false_starts: this.falseStarts,
      avg_reaction_time_ms: avgReactionMs,
      trials_detail: this.trialsLog,
      telemetry: this.tuner.getTelemetryData()
    };
  }
}