/* ==========================================================================
   SENSOMETRIKA - GESTOR CENTRAL DE CRÉDITOS Y CONTROL B2C / B2B (credit-manager.js)
   • Regla B2C: 1 Demo + N simulaciones según plan (Básico: 3, Plus: 5, Full: 8)
   • Regla B2B: 1 Demo + 1 Examen Oficial único (1 de 1) y bloqueo estricto
   ========================================================================== */
const CreditManager = {
  obtenerSesion: function() {
    let sesion = JSON.parse(localStorage.getItem('sensometrika_sesion'));
    if (!sesion) {
      sesion = {
        rol: 'particular',
        planId: 'part_basico',
        nombrePlan: 'Pase Básico Psicomotriz',
        modulosPermitidos: ['reactimetro', 'palancas', 'punteo'],
        limitesSimulaciones: { reactimetro: 3, palancas: 3, punteo: 3, visual: 0, auditivo: 0 },
        simulacionesConsumidas: { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 },
        demosCompletados: { reactimetro: false, palancas: false, punteo: false, visual: false, auditivo: false }
      };
      localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    }
    if (!sesion.simulacionesConsumidas) {
      sesion.simulacionesConsumidas = { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 };
    }
    if (!sesion.demosCompletados) {
      sesion.demosCompletados = { reactimetro: false, palancas: false, punteo: false, visual: false, auditivo: false };
    }
    if (!sesion.limitesSimulaciones) {
      sesion.limitesSimulaciones = this.determinarLimitesPorPlan(sesion.planId, sesion.rol);
      this.guardarSesion(sesion);
    }
    return sesion;
  },

  guardarSesion: function(sesion) {
    localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
  },

  esB2B: function() {
    const sesion = this.obtenerSesion();
    return (sesion.rol === 'empresa' || (sesion.planId && String(sesion.planId).toLowerCase().includes('b2b')));
  },

  determinarLimitesPorPlan: function(planId, rol) {
    if (rol === 'empresa' || String(planId || '').toLowerCase().includes('b2b')) {
      // Regla estricta B2B: exactamente 1 examen oficial por trabajador
      return { reactimetro: 1, palancas: 1, punteo: 1, visual: 1, auditivo: 1 };
    }
    const id = String(planId || '').toLowerCase();
    if (id.includes('full') || id.includes('integral')) {
      return { reactimetro: 8, palancas: 8, punteo: 8, visual: 4, auditivo: 4 };
    } else if (id.includes('plus')) {
      return { reactimetro: 5, palancas: 5, punteo: 5, visual: 2, auditivo: 0 };
    } else {
      return { reactimetro: 3, palancas: 3, punteo: 3, visual: 0, auditivo: 0 };
    }
  },

  obtenerLimiteModulo: function(moduloKey) {
    if (this.esB2B()) {
      return 1; // En B2B siempre es 1 examen oficial
    }
    const sesion = this.obtenerSesion();
    if (sesion.limitesSimulaciones && sesion.limitesSimulaciones[moduloKey] !== undefined) {
      return sesion.limitesSimulaciones[moduloKey];
    }
    const limites = this.determinarLimitesPorPlan(sesion.planId, sesion.rol);
    return limites[moduloKey] || 3;
  },

  obtenerDatosUsuario: function() {
    const datos = JSON.parse(localStorage.getItem('sensometrika_datos_usuario'));
    if (datos && datos.nombre && datos.nombre.trim() !== '') {
      return datos;
    }
    const sesion = this.obtenerSesion();
    return {
      nombre: sesion.nombre || (this.esB2B() ? '' : 'Particular Registrado'),
      rut: sesion.rut || (this.esB2B() ? '' : 'No informado'),
      correo: sesion.correoInforme || ''
    };
  },

  demoYaRealizado: function(moduloKey) {
    const sesion = this.obtenerSesion();
    return Boolean(sesion.demosCompletados && sesion.demosCompletados[moduloKey]);
  },

  marcarDemoCompletado: function(moduloKey) {
    const sesion = this.obtenerSesion();
    if (!sesion.demosCompletados) sesion.demosCompletados = {};
    sesion.demosCompletados[moduloKey] = true;
    this.guardarSesion(sesion);
  },

  obtenerConsumidas: function(moduloKey) {
    const sesion = this.obtenerSesion();
    return (sesion.simulacionesConsumidas && sesion.simulacionesConsumidas[moduloKey]) || 0;
  },

  obtenerNumeroSimulacionActual: function(moduloKey) {
    const max = this.obtenerLimiteModulo(moduloKey);
    const consumidas = this.obtenerConsumidas(moduloKey);
    return Math.min(consumidas + 1, max);
  },

  puedeRendir: function(moduloKey) {
    const max = this.obtenerLimiteModulo(moduloKey);
    const consumidas = this.obtenerConsumidas(moduloKey);
    return consumidas < max; // En B2B si consumió 1, bloquea inmediatamente
  },

  registrarConsumo: function(moduloKey) {
    const sesion = this.obtenerSesion();
    if (!sesion.simulacionesConsumidas) {
      sesion.simulacionesConsumidas = { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 };
    }
    sesion.simulacionesConsumidas[moduloKey] = (sesion.simulacionesConsumidas[moduloKey] || 0) + 1;
    this.guardarSesion(sesion);
    return sesion.simulacionesConsumidas[moduloKey];
  },

  pintarBadgeCabecera: function(contenedorId, moduloKey) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    const esEmpresa = this.esB2B();
    const max = this.obtenerLimiteModulo(moduloKey);
    const consumidas = this.obtenerConsumidas(moduloKey);

    if (esEmpresa) {
      if (consumidas >= 1) {
        cont.innerHTML = `<span style="background:#dc2626; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem; border:1px solid #ef4444;">Examen Oficial: 1 de 1 (Evaluación Realizada - Bloqueado)</span>`;
      } else {
        cont.innerHTML = `<span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem; border:1px solid #38bdf8;">Examen Oficial B2B: 1 de 1</span>`;
      }
    } else {
      const actual = Math.min(consumidas + 1, max);
      if (consumidas >= max) {
        cont.innerHTML = `<span style="background:#dc2626; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem; border:1px solid #ef4444;">Simulaciones: ${max} de ${max} (Cupo Bloqueado)</span>`;
      } else {
        cont.innerHTML = `<span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem; border:1px solid #38bdf8;">Simulación Oficial: ${actual} de ${max}</span>`;
      }
    }
  }
};