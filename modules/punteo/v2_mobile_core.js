/**
 * Sensometrika Pro B2B - Mobile Core Engine (Punteo)
 * Motor Canvas HTML5 de alta frecuencia con compensación de latencia hardware.
 */

import { LatencyTuner } from '../../calibracion/latency_tuner.js';

export class PunteoMobileEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.tuner = new LatencyTuner();
    
    this.durationSec = options.durationSec || 30;
    this.mode = options.mode || '1A_libre';
    
    this.isRunning = false;
    this.startTime = 0;
    this.tapLogs = [];
    this.validHits = 0;
    this.missHits = 0;
  }

  async init() {
    if (!this.canvas) throw new Error('Canvas no encontrado');
    await this.tuner.detectScreenRefreshRate();
    this.resizeCanvas();
    this.bindTouchEvents();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) this.ctx.scale(dpr, dpr);
  }

  bindTouchEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.isRunning) return;

      const rawTimestamp = performance.now();
      const hardwareOffset = this.tuner.registerCalibrationTap(e);
      const netTimestamp = Math.max(0, rawTimestamp - hardwareOffset);

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.processTap(x, y, netTimestamp);
    });
  }

  processTap(x, y, timestamp) {
    const tapData = { x, y, timestamp, mode: this.mode };
    this.tapLogs.push(tapData);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  getSummaryMetrics() {
    const totalTaps = this.tapLogs.length;
    const telemetry = this.tuner.getTelemetryData();

    return {
      total_taps: totalTaps,
      valid_hits: this.validHits,
      miss_hits: this.missHits,
      frequency_hz: Number((totalTaps / this.durationSec).toFixed(2)),
      telemetry
    };
  }
}