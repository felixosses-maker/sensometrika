/* ==========================================================================
   SENSOMETRIKA - GESTOR CENTRAL DE CRÉDITOS Y BLOQUEOS (credit-manager.js)
   • Cuotas Dinámicas:
     - Básico: 3 psicomotrices (1, 2 y 3) | 0 sensoriales
     - Plus: 5 psicomotrices | 2 visuales | 0 auditivo
     - Full: 8 psicomotrices | 4 sensoriales (visual y auditivo)
     - B2B Empresa: 1 de 1 examen oficial por trabajador
   • Bloqueo estricto al agotar cupos
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
        planId: 'part_full',
        nombrePlan: 'Pase Full Integral',
        simulacionesConsumidas: { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 }
      };
      localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    }

    if (!sesion.simulacionesConsumidas) {
      sesion.simulacionesConsumidas = { reactimetro: 0, palancas: 0, punteo: 0, visual: 0, auditivo: 0 };
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
      (datosUser.tipo === 'empresa') ||
      (datosUser.empresa && datosUser.empresa.toLowerCase() !== 'particular')
    );
  },

  obtenerLimiteModulo: function(moduloKey) {
    if (this.esB2B()) return 1; // B2B: exactamente 1 examen oficial

    const sesion = this.obtenerSesion();
    const plan = (sesion.planId || '').toLowerCase();
    const nombre = (sesion.nombrePlan || '').toLowerCase();

    const esSensorial = (moduloKey === 'visual' || moduloKey === 'auditivo');

    // Detección robusta de Plan Full
    if (plan.includes('full') || nombre.includes('full')) {
      return esSensorial ? 4 : 8;
    } 
    // Detección robusta de Plan Plus
    else if (plan.includes('plus') || nombre.includes('plus')) {
      if (moduloKey === 'visual') return 2;
      if (moduloKey === 'auditivo') return 0;
      return 5;
    } 
    // Plan Básico
    else {
      return esSensorial ? 0 : 3;
    }
  },

  obtenerConsumidas: function(moduloKey) {
    const sesion = this.obtenerSesion();
    return (sesion.simulacionesConsumidas && sesion.simulacionesConsumidas[moduloKey]) || 0;
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

    const consumidas = this.obtenerConsumidas(moduloKey);
    if (consumidas >= max) {
      alert(`Has completado todas tus simulaciones (${max}/${max}) para este módulo.`);
      window.location.replace('menu.html');
      return false;
    }
    return true;
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

  demoYaRealizado: function(moduloKey) {
    return localStorage.getItem(`sensometrika_${moduloKey}_demo_ok`) === 'true';
  },

  marcarDemoCompletado: function(moduloKey) {
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