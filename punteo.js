/**
 * Sensometrika - Módulo de Punteo e Impacto Rítmico
 * Arquitectura de Evaluación Psicotécnica (D.S. N° 170)
 */

class ModuloPunteo {
    constructor(canvas, options = {}, onComplete) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onComplete = onComplete;

        this.width = options.width || 400;
        this.height = options.height || 300;
        this.duracionSegundos = options.duracion || 30;

        // Estado de la prueba
        this.activo = false;
        this.tiempoRestante = this.duracionSegundos;
        this.aciertos = 0;
        this.totalImpactos = 0;
        this.intervalTimer = null;

        // Estímulo (Esfera descendente)
        this.esfera = {
            x: this.width / 2,
            y: -20,
            radio: 15,
            velocidad: options.velocidad || 2.5,
            color: '#38bdf8', // Azul al caer
            estado: 'CAYENDO'  // 'CAYENDO', 'ACERTADO', 'FALLADO'
        };

        // Zona Dorada de Impacto Rítmico
        this.zonaDorada = {
            x: 15,
            y: this.height - 70,
            width: this.width - 30,
            height: 38
        };

        this.logEventos = [];
        this.timerReset = null;
    }

    iniciar() {
        this.activo = true;
        this.tiempoRestante = this.duracionSegundos;
        this.aciertos = 0;
        this.totalImpactos = 0;
        this.logEventos = [];

        this.resetEsfera();

        if (this.intervalTimer) clearInterval(this.intervalTimer);
        this.intervalTimer = setInterval(() => {
            this.tiempoRestante--;
            if (this.tiempoRestante <= 0) {
                this.finalizar();
            }
        }, 1000);

        this.loop();
    }

    resetEsfera() {
        if (this.timerReset) clearTimeout(this.timerReset);
        this.esfera.x = Math.random() * (this.width - 100) + 50;
        this.esfera.y = -20;
        this.esfera.color = '#38bdf8'; // Azul
        this.esfera.estado = 'CAYENDO';
    }

    update() {
        if (!this.activo) return;

        this.esfera.y += this.esfera.velocidad;

        const limiteInferiorZona = this.zonaDorada.y + this.zonaDorada.height;

        // Omisión: Pasa la zona de impacto sin recibir punteo
        if (this.esfera.estado === 'CAYENDO' && (this.esfera.y - this.esfera.radio) > limiteInferiorZona) {
            this.esfera.estado = 'FALLADO';
            this.esfera.color = '#ef4444'; // ROJO
            this.totalImpactos++;
            this.registrarEvento('OMISION');

            this.timerReset = setTimeout(() => {
                if (this.activo) this.resetEsfera();
            }, 250);
        }

        if (this.esfera.y - this.esfera.radio > this.height + 20) {
            this.resetEsfera();
        }
    }

    registrarPunteo() {
        if (!this.activo || this.esfera.estado !== 'CAYENDO') return;

        // Cálculo de presencia dentro de la Zona de Impacto Rítmico
        const centroZonaY = this.zonaDorada.y + (this.zonaDorada.height / 2);
        const margenTolerancia = (this.zonaDorada.height / 2) + this.esfera.radio;

        const dentroZona = Math.abs(this.esfera.y - centroZonaY) <= margenTolerancia;

        this.totalImpactos++;

        if (dentroZona) {
            this.aciertos++;
            this.esfera.estado = 'ACERTADO';
            this.esfera.color = '#10b981'; // VERDE
            this.registrarEvento('ACIERTO');
        } else {
            this.esfera.estado = 'FALLADO';
            this.esfera.color = '#ef4444'; // ROJO (A destiempo)
            this.registrarEvento('ERROR_TIEMPO');
        }

        this.timerReset = setTimeout(() => {
            if (this.activo) this.resetEsfera();
        }, 250);
    }

    registrarEvento(tipo) {
        this.logEventos.push({
            timestamp: Date.now(),
            tipo: tipo,
            posY: this.esfera.y,
            zonaY: this.zonaDorada.y
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Marca de Agua sutil de Isotipo en Canvas
        const cx = this.width / 2;
        const cy = this.height / 2 - 10;

        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 45, Math.PI * 0.25, Math.PI * 1.75);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 30, Math.PI * 0.75, Math.PI * 2.25);
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.07)';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Zona de Impacto Rítmico (Margen Dorado)
        this.ctx.strokeStyle = '#e5b324';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = 'rgba(229, 179, 36, 0.05)';
        this.ctx.fillRect(this.zonaDorada.x, this.zonaDorada.y, this.zonaDorada.width, this.zonaDorada.height);
        this.ctx.strokeRect(this.zonaDorada.x, this.zonaDorada.y, this.zonaDorada.width, this.zonaDorada.height);

        this.ctx.fillStyle = '#e5b324';
        this.ctx.font = 'bold 9px -apple-system, sans-serif';
        this.ctx.fillText('ZONA DE IMPACTO RÍTMICO', this.zonaDorada.x + 8, this.zonaDorada.y + 14);

        // Esfera descendente
        if (this.activo) {
            this.ctx.fillStyle = this.esfera.color;
            this.ctx.beginPath();
            this.ctx.arc(this.esfera.x, this.esfera.y, this.esfera.radio, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }
    }

    loop() {
        if (!this.activo) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    obtenerEfectividad() {
        if (this.totalImpactos === 0) return 0;
        return Math.round((this.aciertos / this.totalImpactos) * 100);
    }

    finalizar() {
        this.activo = false;
        if (this.intervalTimer) clearInterval(this.intervalTimer);
        if (this.timerReset) clearTimeout(this.timerReset);

        const resultados = {
            modulo: 'Punteo e Impacto Rítmico',
            tiempo: this.duracionSegundos,
            aciertos: this.aciertos,
            totalImpactos: this.totalImpactos,
            efectividad: this.obtenerEfectividad(),
            eventos: this.logEventos
        };

        if (typeof this.onComplete === 'function') {
            this.onComplete(resultados);
        }
    }
}