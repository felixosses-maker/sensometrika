/**
 * Sensometrika Pro B2B - Modalidad 1C: Trepidador (Temblor Fino)
 */
import { PunteoMobileEngine } from './v2_mobile_core.js';

export class ModalidadTrepidador extends PunteoMobileEngine {
  constructor(canvasId, options = {}) {
    super(canvasId, { ...options, mode: '1C_estatico' });
    this.toleranceRadius = options.toleranceRadius || 25; // Radio seguro
    this.outOfBoundsMs = 0;
    this.lastTapTime = null;
  }

  /**
   * Dibuja los anillos concéntricos de tolerancia (zona segura e insegura)
   */
  renderTarget() {
    if (!this.ctx) return;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = w / 2;
    const centerY = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    // Zona exterior de falta (Rojo)
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.toleranceRadius + 20, 0, 2 * Math.PI);
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Zona interior segura (Amarillo/Verde)
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.toleranceRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#eab308';
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  processTap(x, y, timestamp) {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = w / 2;
    const centerY = h / 2;

    const distFromCenter = Math.hypot(x - centerX, y - centerY);

    if (distFromCenter > this.toleranceRadius) {
      this.missHits++;
      if (this.lastTapTime) {
        this.outOfBoundsMs += (timestamp - this.lastTapTime);
      }
    } else {
      this.validHits++;
    }

    this.lastTapTime = timestamp;
    super.processTap(x, y, timestamp);
  }

  getSummaryMetrics() {
    const base = super.getSummaryMetrics();
    return {
      ...base,
      out_of_bounds_ms: Number(this.outOfBoundsMs.toFixed(2))
    };
  }
}