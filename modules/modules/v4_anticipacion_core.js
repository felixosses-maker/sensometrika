/**
 * Sensometrika Pro B2B - Anticipación Espaciotemporal Core Engine
 * Medición del error de estimación de tiempo de paso en puntos ciegos.
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

  getSummaryMetrics() {
    const validTrials = this.trialsLog.filter(t => t.isValid);
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