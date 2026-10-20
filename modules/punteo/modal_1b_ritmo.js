/**
 * Sensometrika Pro B2B - Modalidad 1D: Coordinación Bimanual Alternada
 */
import { PunteoMobileEngine } from './v2_mobile_core.js';

export class ModalidadBimanual extends PunteoMobileEngine {
  constructor(canvasId, options = {}) {
    super(canvasId, { ...options, mode: '1D_bimanual' });
    this.expectedSide = 'LEFT'; // Alterna entre 'LEFT' y 'RIGHT'
    this.sequenceErrors = 0;
  }

  /**
   * Dibuja los dos campos de toque (Izquierda / Derecha)
   */
  renderTarget() {
    if (!this.ctx) return;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.clearRect(0, 0, w, h);

    // Zona Izquierda (Azul)
    this.ctx.fillStyle = this.expectedSide === 'LEFT' ? '#38bdf8' : '#1e293b';
    this.ctx.fillRect(10, 10, (w / 2) - 15, h - 20);
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(10, 10, (w / 2) - 15, h - 20);

    // Zona Derecha (Púrpura)
    this.ctx.fillStyle = this.expectedSide === 'RIGHT' ? '#a855f7' : '#1e293b';
    this.ctx.fillRect((w / 2) + 5, 10, (w / 2) - 15, h - 20);
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect((w / 2) + 5, 10, (w / 2) - 15, h - 20);
  }

  processTap(x, y, timestamp) {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const tappedSide = x < (w / 2) ? 'LEFT' : 'RIGHT';

    if (tappedSide === this.expectedSide) {
      this.validHits++;
      this.expectedSide = this.expectedSide === 'LEFT' ? 'RIGHT' : 'LEFT';
    } else {
      this.missHits++;
      this.sequenceErrors++;
    }

    // Redibuja el objetivo destacando el nuevo lado esperado
    this.renderTarget();

    super.processTap(x, y, timestamp);
  }

  getSummaryMetrics() {
    const base = super.getSummaryMetrics();
    return {
      ...base,
      sequence_errors: this.sequenceErrors
    };
  }
}