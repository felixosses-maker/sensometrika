/**
 * Sensometrika Pro B2B - Visomotriz / Tracking Core Engine
 * Medición de coordinación bimanual continua y salidas de pista.
 */

import { LatencyTuner } from '../calibracion/latency_tuner.js';

export class VisomotrizCoreEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.tuner = new LatencyTuner();

    this.durationSec = options.durationSec || 20;
    this.isRunning = false;

    // Métricas periciales continuas
    this.timeOffTrackMs = 0;
    this.offTrackEvents = 0;
    this.isCurrentlyOffTrack = false;
    this.lastFrameTimestamp = 0;

    // Posiciones
    this.userPos = { x: -100, y: -100 };
    this.targetPos = { x: 0, y: 0 };
    this.toleranceRadius = options.toleranceRadius || 35;
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
    const updatePos = (e) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      this.userPos.x = e.clientX - rect.left;
      this.userPos.y = e.clientY - rect.top;
      this.tuner.registerCalibrationTap(e);
    };

    this.canvas.onpointerdown = updatePos;
    this.canvas.onpointermove = updatePos;
  }

  getSummaryMetrics() {
    const totalTimeMs = this.durationSec * 1000;
    const percentOnTrack = Number((((totalTimeMs - this.timeOffTrackMs) / totalTimeMs) * 100).toFixed(1));

    return {
      time_off_track_ms: Number(this.timeOffTrackMs.toFixed(1)),
      off_track_events: this.offTrackEvents,
      percent_on_track: Math.max(0, percentOnTrack),
      telemetry: this.tuner.getTelemetryData()
    };
  }
}