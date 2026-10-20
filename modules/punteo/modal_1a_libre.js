/**
 * Sensometrika Pro B2B - Modalidad 1B: Ritmo Fijo (Cadencia)
 */
import { PunteoMobileEngine } from './v2_mobile_core.js';

export class ModalidadRitmoFijo extends PunteoMobileEngine {
  constructor(canvasId, options = {}) {
    super(canvasId, { ...options, mode: '1B_ritmo' });
    this.bpm = options.bpm || 120; // 2 Hz (1 toque cada 500ms)
    this.intervalMs = (60 / this.bpm) * 1000;
    this.targetTimestamps = [];
    this.syncErrorsMs = [];
    this.pulsePhase = 0;
  }

  startMetronome() {
    this.isRunning = true;
    this.startTime = performance.now();
    
    for (let t = 0; t < this.durationSec * 1000; t += this.intervalMs) {
      this.targetTimestamps.push(t);
    }
  }

  /**
   * Dibuja el metrónomo rítmico que pulsa en pantalla
   */
  renderTarget() {
    if (!this.ctx) return;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = w / 2;
    const centerY = h / 2;

    const draw = () => {
      if (!this.isRunning) return;
      this.ctx.clearRect(0, 0, w, h);

      // Animación de pulso concéntrico
      this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
      const currentRadius = 45 + Math.sin(this.pulsePhase) * 10;

      // Círculo metrónomo
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#22c55e';
      this.ctx.fill();
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.stroke();

      requestAnimationFrame(draw);
    };

    draw();
  }

  processTap(x, y, timestamp) {
    const relativeTime = timestamp - this.startTime;
    
    const closestTarget = this.targetTimestamps.reduce((prev, curr) => 
      Math.abs(curr - relativeTime) < Math.abs(prev - relativeTime) ? curr : prev
    , this.targetTimestamps[0] || 0);

    const deltaMs = relativeTime - closestTarget;
    this.syncErrorsMs.push(deltaMs);

    if (Math.abs(deltaMs) <= 40) {
      this.validHits++;
    } else {
      this.missHits++;
    }

    super.processTap(x, y, timestamp);
  }
}