/**
 * Sensometrika - Módulo de Coordinación Bimanual (Palancas)
 * Motor Anti-Memorización Dinámico & Alerta Rojo Neón (D.S. N° 170)
 */

class ModuloPalancas {
    constructor(canvas, options = {}, onComplete) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onComplete = onComplete;

        this.width = options.width || 400;
        this.height = options.height || 300;

        this.activo = false;
        this.tiempoAcumulado = 0;
        this.contactos = 0;
        this.timerInterval = null;

        this.anchoCarril = 34;

        this.puntero = {
            x: 0,
            y: 0,
            radio: 8,
            velocidad: 2.3,
            color: '#e5b324'
        };

        this.movimiento = {
            left: false,
            right: false,
            up: false,
            down: false
        };

        this.puntosPista = [];
        this.meta = { x: 0, y: 0, radio: 16 };
        this.enColision = false;
    }

    // Algoritmo Anti-Memorización (Generación Estocástica de Trazado)
    generarPistaAleatoria() {
        const invertido = Math.random() > 0.5;
        const paddingX = 40;
        const minY = 50;
        const maxY = this.height - 50;

        let xCurrent = invertido ? this.width - paddingX : paddingX;
        let yCurrent = Math.floor(Math.random() * (maxY - minY)) + minY;

        this.puntosPista = [{ x: xCurrent, y: yCurrent }];

        const pasosHorizontal = 3;
        const stepX = (this.width - paddingX * 2) / pasosHorizontal;
        const direccionX = invertido ? -1 : 1;

        for (let i = 0; i < pasosHorizontal; i++) {
            xCurrent += stepX * direccionX;
            this.puntosPista.push({ x: xCurrent, y: yCurrent });

            if (i < pasosHorizontal - 1) {
                if (yCurrent > this.height / 2) {
                    yCurrent = Math.floor(Math.random() * (this.height / 2 - minY)) + minY;
                } else {
                    yCurrent = Math.floor(Math.random() * (maxY - this.height / 2)) + this.height / 2;
                }
                this.puntosPista.push({ x: xCurrent, y: yCurrent });
            }
        }

        yCurrent = (yCurrent > this.height / 2) ? minY + 10 : maxY - 10;
        this.puntosPista.push({ x: xCurrent, y: yCurrent });

        this.meta.x = xCurrent;
        this.meta.y = yCurrent;

        this.puntero.x = this.puntosPista[0].x;
        this.puntero.y = this.puntosPista[0].y;
    }

    iniciar() {
        this.activo = true;
        this.tiempoAcumulado = 0;
        this.contactos = 0;
        this.enColision = false;

        this.generarPistaAleatoria();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.activo) this.tiempoAcumulado++;
        }, 1000);

        this.loop();
    }

    setDireccion(dir, activa) {
        if (this.movimiento.hasOwnProperty(dir)) {
            this.movimiento[dir] = activa;
        }
    }

    update() {
        if (!this.activo) return;

        if (this.movimiento.left) this.puntero.x -= this.puntero.velocidad;
        if (this.movimiento.right) this.puntero.x += this.puntero.velocidad;
        if (this.movimiento.up) this.puntero.y -= this.puntero.velocidad;
        if (this.movimiento.down) this.puntero.y += this.puntero.velocidad;

        this.puntero.x = Math.max(10, Math.min(this.width - 10, this.puntero.x));
        this.puntero.y = Math.max(10, Math.min(this.height - 10, this.puntero.y));

        const dentroPista = this.verificarDentroDePista(this.puntero.x, this.puntero.y);

        if (!dentroPista) {
            if (!this.enColision) {
                this.contactos++;
                this.enColision = true;
            }
            this.puntero.color = '#ff0055'; // Rojo Neón Intenso
        } else {
            this.enColision = false;
            this.puntero.color = '#10b981'; // Verde Neón
        }

        const distMeta = Math.hypot(this.puntero.x - this.meta.x, this.puntero.y - this.meta.y);
        if (distMeta <= this.meta.radio) {
            this.finalizar();
        }
    }

    verificarDentroDePista(px, py) {
        const radioTolerancia = (this.anchoCarril / 2) - 2;

        for (let i = 0; i < this.puntosPista.length - 1; i++) {
            const p1 = this.puntosPista[i];
            const p2 = this.puntosPista[i + 1];

            const dist = this.distanciaPuntoASegmento(px, py, p1.x, p1.y, p2.x, p2.y);
            if (dist <= radioTolerancia) {
                return true;
            }
        }
        return false;
    }

    distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (l2 === 0) return Math.hypot(px - x1, py - y1);

        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));

        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.puntosPista.length === 0) return;

        // Renderizado del Carril (Cambio a Rojo Neón al hacer contacto)
        this.ctx.beginPath();
        this.ctx.moveTo(this.puntosPista[0].x, this.puntosPista[0].y);
        for (let i = 1; i < this.puntosPista.length; i++) {
            this.ctx.lineTo(this.puntosPista[i].x, this.puntosPista[i].y);
        }
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.enColision) {
            this.ctx.strokeStyle = '#ff0055';
            this.ctx.shadowColor = '#ff0055';
            this.ctx.shadowBlur = 18;
        } else {
            this.ctx.strokeStyle = '#0284c7';
            this.ctx.shadowColor = '#0284c7';
            this.ctx.shadowBlur = 8;
        }

        this.ctx.lineWidth = this.anchoCarril;
        this.ctx.stroke();

        // Fondo interno oscuro del carril
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#060b13';
        this.ctx.lineWidth = this.anchoCarril - 6;
        this.ctx.stroke();

        // Línea punteada central
        this.ctx.beginPath();
        this.ctx.moveTo(this.puntosPista[0].x, this.puntosPista[0].y);
        for (let i = 1; i < this.puntosPista.length; i++) {
            this.ctx.lineTo(this.puntosPista[i].x, this.puntosPista[i].y);
        }
        this.ctx.strokeStyle = this.enColision ? 'rgba(255, 0, 85, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([6, 6]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Meta Verde Neón
        this.ctx.fillStyle = '#10b981';
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(this.meta.x, this.meta.y, this.meta.radio, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Esfera / Puntero
        if (this.activo) {
            this.ctx.fillStyle = this.puntero.color;
            this.ctx.shadowColor = this.puntero.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(this.puntero.x, this.puntero.y, this.puntero.radio, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    loop() {
        if (!this.activo) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    finalizar() {
        this.activo = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const resultados = {
            modulo: 'Coordinación Bimanual (Palancas)',
            tiempoTotal: this.tiempoAcumulado,
            contactos: this.contactos,
            porcentaje: Math.max(10, Math.min(100, 100 - (this.contactos * 8))),
            circuito: 'Trazado Dinámico (Anti-Memorización)'
        };

        if (typeof this.onComplete === 'function') {
            this.onComplete(resultados);
        }
    }
}