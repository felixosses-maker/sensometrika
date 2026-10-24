/**
 * Sensometrika Pro B2B - Anticipación Espaciotemporal Core Engine
 * Medición del error de estimación de tiempo de paso en puntos ciegos.
 * Integrado con LatencyTuner y aislamiento estricto por sesión/RUT.
 */

import { LatencyTuner } from '../calibracion/latency_tuner.js';

export class AnticipacionCoreEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.tuner = new LatencyTuner();

    this.trialsCount = options.trialsCount || 5;
    this.currentTrial = 0;
    this.isRunning = false;

    // Registros periciales
    this.trialsLog = []; // { expectedTimeMs, userTimeMs, errorMs, type: 'ADELANTADO'|'ATRASADO' }

    // Extracción de parámetros URL para aislamiento B2B
    const urlParams = new URLSearchParams(window.location.search);
    const rutEval = urlParams.get('rut') || 'GENERICO';
    this.cleanRut = rutEval.replace(/[^0-9Kk]/g, '');
    this.sessionParam = urlParams.get('session') || '';

    // Claves de almacenamiento aisladas por sesión y RUT
    this.claveHistorial = this.sessionParam 
      ? `sensometrika_historial_anticipacion_core_${this.cleanRut}_${this.sessionParam}` 
      : `sensometrika_historial_anticipacion_core_${this.cleanRut}`;

    this.claveLast = this.sessionParam 
      ? `sensometrika_last_anticipacion_core_${this.cleanRut}_${this.sessionParam}` 
      : `sensometrika_last_anticipacion_core_${this.cleanRut}`;
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

  registrarCierreSimulacion() {
    const metrics = this.getSummaryMetrics();
    const avgError = metrics.avg_abs_error_ms !== '--' ? parseFloat(metrics.avg_abs_error_ms) : 300;
    const aprobado = avgError <= 220 && metrics.trials_completed > 0;

    const resultadoFinal = {
      promedioError: avgError,
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
    const validTrials = this.trialsLog.filter(t => t.isValid !== false);
    const avgErrorMs = validTrials.length > 0
      ? (validTrials.reduce((a, b) => a + Math.abs(b.errorMs), 0) / validTrials.length).toFixed(1)
      : '--';

    return {
      trials_completed: this.trialsLog.length,
      avg_abs_error_ms: avgErrorMs,
      trials_detail: this.trialsLog,
      telemetry: this.tuner.getTelemetryData()
    };
  }
}