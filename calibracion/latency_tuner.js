/**
 * Sensometrika Pro B2B - Latency Tuner
 * Mide la tasa de refresco (Hz) y la latencia de entrada (input lag) del hardware/móvil.
 */

export class LatencyTuner {
  constructor() {
    this.hardwareOffsetMs = 0;
    this.refreshRateHz = 60;
    this.sampleTaps = [];
  }

  /**
   * Mide la tasa de refresco real de la pantalla usando requestAnimationFrame
   */
  async detectScreenRefreshRate() {
    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();

      const calc = () => {
        frames++;
        const duration = performance.now() - startTime;

        if (duration < 500) {
          requestAnimationFrame(calc);
        } else {
          this.refreshRateHz = Math.round((frames * 1000) / duration);
          resolve(this.refreshRateHz);
        }
      };

      requestAnimationFrame(calc);
    });
  }

  /**
   * Registra y calcula la latencia de un toque de calibración
   */
  registerCalibrationTap(event) {
    const systemTimestamp = performance.now();
    let touchTimestamp = event.timeStamp;

    if (event.getCoalescedEvents && event.getCoalescedEvents().length > 0) {
      touchTimestamp = event.getCoalescedEvents()[0].timeStamp;
    }

    const lag = Math.max(0, systemTimestamp - touchTimestamp);
    this.sampleTaps.push(lag);

    if (this.sampleTaps.length >= 3) {
      const sum = this.sampleTaps.reduce((a, b) => a + b, 0);
      this.hardwareOffsetMs = Number((sum / this.sampleTaps.length).toFixed(2));
    }

    return this.hardwareOffsetMs;
  }

  /**
   * Devuelve la telemetría calculada para empaquetar hacia Supabase
   */
  getTelemetryData() {
    return {
      screen_refresh_rate_hz: this.refreshRateHz,
      hardware_latency_offset_ms: this.hardwareOffsetMs,
      calibration_completed: this.sampleTaps.length >= 3
    };
  }
}