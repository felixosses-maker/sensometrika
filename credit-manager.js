/* ==========================================================================
   SENSOMETRIKA - GESTOR CENTRAL DE CRÉDITOS Y DEMOS (credit-manager.js)
   Regla: 1 Demo único por módulo + 3 Simulaciones Oficiales (1/3, 2/3, 3/3 Bloqueo)
   ========================================================================== */
const CreditManager = {
  LIMITE_SIMULACIONES: 3,

  obtenerSesion: function() {
    let sesion = JSON.parse(localStorage.getItem('sensometrika_sesion'));
    if (!sesion) {
      sesion = {
        rol: 'particular',
        planId: 'part_basico',
        simulacionesConsumidas: { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 },
        demosCompletados: { reactimetro: false, palancas: false, punteo: false }
      };
      localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    }
    if (!sesion.simulacionesConsumidas) {
      sesion.simulacionesConsumidas = { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 };
    }
    if (!sesion.demosCompletados) {
      sesion.demosCompletados = { reactimetro: false, palancas: false, punteo: false };
    }
    return sesion;
  },

  guardarSesion: function(sesion) {
    localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
  },

  obtenerDatosUsuario: function() {
    const datos = JSON.parse(localStorage.getItem('sensometrika_datos_usuario'));
    if (datos && datos.nombre && datos.nombre.trim() !== '') {
      return datos;
    }
    const sesion = this.obtenerSesion();
    return {
      nombre: sesion.nombre || 'Particular Registrado',
      rut: sesion.rut || 'No informado',
      correo: sesion.correoInforme || ''
    };
  },

  // Control de Demo único
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

  // Retorna la simulación actual en curso: 1, 2 o 3
  obtenerNumeroSimulacionActual: function(moduloKey) {
    const sesion = this.obtenerSesion();
    const consumidas = (sesion.simulacionesConsumidas && sesion.simulacionesConsumidas[moduloKey]) || 0;
    return Math.min(consumidas + 1, this.LIMITE_SIMULACIONES);
  },

  obtenerConsumidas: function(moduloKey) {
    const sesion = this.obtenerSesion();
    return (sesion.simulacionesConsumidas && sesion.simulacionesConsumidas[moduloKey]) || 0;
  },

  puedeRendir: function(moduloKey) {
    const sesion = this.obtenerSesion();
    if (sesion.rol === 'empresa') return true;
    const consumidas = this.obtenerConsumidas(moduloKey);
    return consumidas < this.LIMITE_SIMULACIONES;
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

    const sesion = this.obtenerSesion();
    if (sesion.rol === 'empresa') return;

    const consumidas = this.obtenerConsumidas(moduloKey);
    const actual = Math.min(consumidas + 1, this.LIMITE_SIMULACIONES);

    if (consumidas >= this.LIMITE_SIMULACIONES) {
      cont.innerHTML = `<span style="background:#dc2626; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem; border:1px solid #ef4444;">Simulaciones: 3 de 3 (Cupo Bloqueado)</span>`;
    } else {
      cont.innerHTML = `<span style="background:#0284c7; color:#ffffff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:0.75rem; border:1px solid #38bdf8;">Simulación Oficial: ${actual} de ${this.LIMITE_SIMULACIONES}</span>`;
    }
  }
};