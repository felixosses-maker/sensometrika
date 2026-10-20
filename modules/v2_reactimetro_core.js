/**
 * Sensometrika Pro B2B - Reactímetro Core Engine
 * Motor de alta precisión para tiempos de reacción simple, discriminativa y freno de emergencia.
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