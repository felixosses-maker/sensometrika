/**
 * Sensometrika - Módulo Reactímetro Simple (Tiempo de Frenado)
 * Medición de Latencia y Tiempos de Reacción Multiestímulo (D.S. N° 170)
 */

class ModuloReactimetro {
    constructor(canvas, options = {}, onComplete) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onComplete = onComplete;

        this.width = options.width || 400;
        this.height = options.height || 300;

        // Configuración Multiestímulo (entre 5 y 8 por simulación)
        this.totalEstimulosPorSimulacion = options.totalEstimulos || 6; 
        this.estimuloActual = 0;
        this.tiemposRegistrados = [];

        this.estado = 'ESPERA'; // 'ESPERA', 'LISTO', 'ESTIMULO', 'PAUSA_ENTRE', 'FINALIZADO'
        this.tiempoInicioEstimulo = 0;
        this.anticipaciones = 0;
        this.timeoutEstimulo = null;

        this.offsetLatenciaHardware = parseInt(localStorage.getItem('sensometrika_latencia_hardware_ms')) || 0;

        this.colorSemaforo = '#334155';
        this.textoSemaforo = 'PRESIONA INICIAR';
    }

    iniciarSimulacionCompleta() {
        this.estimuloActual = 0;
        this.tiemposRegistrados = [];
        this.anticipaciones = 0;
        this.siguienteEstimulo();
    }

    siguienteEstimulo() {
        this.estimuloActual++;
        this.estado = 'LISTO';
        this.colorSemaforo = '#e5b324'; // Amarillo de espera
        this.textoSemaforo = `ESTÍMULO ${this.estimuloActual}/${this.totalEstimulosPorSimulacion} • ESPERE ROJO...`;
        this.draw();

        // Tiempo de espera aleatorio entre 1.8 y 4.2 segundos para evitar habituación
        const tiempoEspera = Math.floor(Math.random() * 2400) + 1800;

        if (this.timeoutEstimulo) clearTimeout(this.timeoutEstimulo);

        this.timeoutEstimulo = setTimeout(() => {
            if (this.estado === 'LISTO') {
                this.estado = 'ESTIMULO';
                this.tiempoInicioEstimulo = performance.now();
                this.colorSemaforo = '#ff0055'; // Rojo neón
                this.textoSemaforo = '¡FRENE AHORA!';
                this.draw();
            }
        }, tiempoEspera);
    }

    registrarFrenado() {
        if (this.estado === 'LISTO') {
            // Anticipación (Frenó antes de que aparezca la luz roja)
            if (this.timeoutEstimulo) clearTimeout(this.timeoutEstimulo);
            this.anticipaciones++;
            this.estado = 'PAUSA_ENTRE';
            this.colorSemaforo = '#ef4444';
            this.textoSemaforo = '⚠ ANTICIPACIÓN DETECTADA';
            this.draw();

            return { exito: false, tipo: 'ANTICIPACION', anticipaciones: this.anticipaciones };
        } else if (this.estado === 'ESTIMULO') {
            const tiempoFin = performance.now();
            const tiempoBruto = Math.round(tiempoFin - this.tiempoInicioEstimulo);
            const tiempoNeto = Math.max(10, tiempoBruto - this.offsetLatenciaHardware);

            this.tiemposRegistrados.push(tiempoNeto);

            if (this.estimuloActual < this.totalEstimulosPorSimulacion) {
                // Siguiente estímulo tras una breve pausa
                this.estado = 'PAUSA_ENTRE';
                this.colorSemaforo = '#10b981';
                this.textoSemaforo = `REGISTRADO: ${tiempoNeto} ms`;
                this.draw();

                setTimeout(() => {
                    this.siguienteEstimulo();
                }, 1200);

                return { 
                    exito: true, 
                    tipo: 'PARCIAL', 
                    tiempo: tiempoNeto, 
                    estimulo: this.estimuloActual, 
                    totalEstimulos: this.totalEstimulosPorSimulacion 
                };
            } else {
                // Cálculo de promedio final de la simulación
                const suma = this.tiemposRegistrados.reduce((a, b) => a + b, 0);
                const promedio = Math.round(suma / this.tiemposRegistrados.length);

                this.estado = 'FINALIZADO';
                this.colorSemaforo = '#10b981';
                this.textoSemaforo = `PROMEDIO FINAL: ${promedio} ms`;
                this.draw();

                const resultado = {
                    exito: true,
                    tipo: 'COMPLETADO',
                    promedioTiempo: promedio,
                    tiemposDetalle: this.tiemposRegistrados,
                    latenciaDescontada: this.offsetLatenciaHardware,
                    anticipaciones: this.anticipaciones,
                    modulo: 'Reactímetro (Tiempo de Frenado)'
                };

                if (typeof this.onComplete === 'function') {
                    this.onComplete(resultado);
                }

                return resultado;
            }
        }

        return { exito: false, tipo: 'IGNORADO' };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#050a12';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const centerX = this.width / 2;
        const centerY = this.height / 2 - 15;
        const radius = 60;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colorSemaforo;
        this.ctx.shadowColor = this.colorSemaforo;
        this.ctx.shadowBlur = (this.estado === 'ESTIMULO' || this.estado === 'FINALIZADO') ? 20 : 5;
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 6;
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px -apple-system, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.textoSemaforo, centerX, centerY + radius + 35);
    }

    reset() {
        if (this.timeoutEstimulo) clearTimeout(this.timeoutEstimulo);
        this.estado = 'ESPERA';
        this.colorSemaforo = '#334155';
        this.textoSemaforo = 'PRESIONA INICIAR';
        this.draw();
    }
}