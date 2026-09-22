/* ==========================================================================
   SENSOMETRIKA - GESTOR CENTRAL DE CRÉDITOS Y BLOQUEO ESTRICTO (credit-manager.js)
   • Evita desbordes de cuota (limita estrictamente a 3, 5 u 8)
   • Bloqueo preventivo en puerta para todos los módulos
   ========================================================================== */

const CreditManager = {
  obtenerSesion: function() {
    let sesion = null;
    try {
      sesion = JSON.parse(localStorage.getItem('sensometrika_sesion'));
    } catch (e) {}

    if (!sesion) {
      sesion = {
        rol: 'particular',
        planId: 'part_basico',
        nombrePlan: 'Pase Básico Psicomotriz',
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
    return sesion;
  },

  guardarSesion: function(sesion) {
    localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    localStorage.setItem('sensometrika_ejecuciones', JSON.stringify(sesion.simulacionesConsumidas));
  },

  esB2B: function() {
    const sesion = this.obtenerSesion();
    const datosUser = JSON.parse(localStorage.getItem('sensometrika_datos_usuario')) || {};
    return (
      sesion.rol === 'empresa' ||
      (sesion.planId && String(sesion.planId).startsWith('b2b')) ||
      (datosUser.tipo === 'empresa')
    );
  },

  obtenerLimiteModulo: function(moduloKey) {
    if (this.esB2B()) return 1;

    const sesion = this.obtenerSesion();
    const plan = (sesion.planId || '').toLowerCase();
    const nombre = (sesion.nombrePlan || '').toLowerCase();
    const esSensorial = (moduloKey === 'visual' || moduloKey === 'auditivo');

    if (plan.includes('full') || nombre.includes('full')) {
      return esSensorial ? 4 : 8;
    } else if (plan.includes('plus') || nombre.includes('plus')) {
      if (moduloKey === 'visual') return 2;
      if (moduloKey === 'auditivo') return 0;
      return 5;
    } else {
      // Plan Básico
      return esSensorial ? 0 : 3;
    }
  },

  obtenerConsumidas: function(moduloKey) {
    const sesion = this.obtenerSesion();
    const max = this.obtenerLimiteModulo(moduloKey);
    let valor = (sesion.simulacionesConsumidas && sesion.simulacionesConsumidas[moduloKey]) || 0;
    // Saneo anti-desborde: nunca puede devolver más del límite del plan
    if (valor > max) {
      valor = max;
      sesion.simulacionesConsumidas[moduloKey] = max;
      this.guardarSesion(sesion);
    }
    return valor;
  },

  obtenerNumeroSimulacionActual: function(moduloKey) {
    const consumidas = this.obtenerConsumidas(moduloKey);
    const max = this.obtenerLimiteModulo(moduloKey);
    return Math.min(consumidas + 1, max);
  },

  puedeRendir: function(moduloKey) {
    const max = this.obtenerLimiteModulo(moduloKey);
    if (max === 0) return false;
    const consumidas = this.obtenerConsumidas(moduloKey);
    return consumidas < max;
  },

  validarAccesoOBloquear: function(moduloKey) {
    const max = this.obtenerLimiteModulo(moduloKey);
    if (max === 0) {
      alert('Este módulo no está incluido en tu plan contratado.');
      window.location.replace('menu.html');
      return false;
    }
    if (!this.puedeRendir(moduloKey)) {
      alert(`Has completado el cupo total (${max}/${max}) para este módulo.`);
      window.location.replace('menu.html');
      return false;
    }
    return true;
  },

  registrarConsumo: function(moduloKey) {
    const sesion = this.obtenerSesion();
    const max = this.obtenerLimiteModulo(moduloKey);
    if (!sesion.simulacionesConsumidas) {
      sesion.simulacionesConsumidas = { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 };
    }
    const actuales = sesion.simulacionesConsumidas[moduloKey] || 0;
    sesion.simulacionesConsumidas[moduloKey] = Math.min(actuales + 1, max);
    this.guardarSesion(sesion);
    return sesion.simulacionesConsumidas[moduloKey];
  },

  demoYaRealizado: function(moduloKey) {
    const sesion = this.obtenerSesion();
    return Boolean(
      (sesion.demosCompletados && sesion.demosCompletados[moduloKey]) ||
      localStorage.getItem(`sensometrika_${moduloKey}_demo_ok`) === 'true'
    );
  },

  marcarDemoCompletado: function(moduloKey) {
    const sesion = this.obtenerSesion();
    if (!sesion.demosCompletados) sesion.demosCompletados = {};
    sesion.demosCompletados[moduloKey] = true;
    this.guardarSesion(sesion);
    localStorage.setItem(`sensometrika_${moduloKey}_demo_ok`, 'true');
  },

  pintarBadgeCabecera: function(contenedorId, moduloKey) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    const consumidas = this.obtenerConsumidas(moduloKey);
    const max = this.obtenerLimiteModulo(moduloKey);
    const esEmpresa = this.esB2B();

    if (consumidas >= max) {
      cont.innerHTML = `<span style="background:#dc2626; color:#ffffff; padding:4px 12px; border-radius:20px; font-weight:800; font-size:0.75rem; border:1px solid #ef4444;">${esEmpresa ? 'Examen Oficial: 1/1 (Bloqueado)' : `Simulaciones: ${max}/${max} (Agotado)`}</span>`;
    } else {
      const actual = consumidas + 1;
      cont.innerHTML = `<span style="background:#0284c7; color:#ffffff; padding:4px 12px; border-radius:20px; font-weight:800; font-size:0.75rem; border:1px solid #38bdf8;">${esEmpresa ? 'Examen Oficial: 1 de 1' : `Simulación Oficial: ${actual} de ${max}`}</span>`;
    }
  }
};