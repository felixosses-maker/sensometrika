/* ==========================================================================
   SENSOMETRIKA - GESTOR CENTRAL DE CRÉDITOS Y BLOQUEOS (credit-manager.js)
   • Cuotas Dinámicas:
     - Básico: 3 simulaciones psicomotrices (1, 2 y 3)
     - Plus: 5 psicomotrices / 2 visuales
     - Full: 8 psicomotrices / 4 sensoriales (visual y auditivo)
     - B2B Empresa: 1 de 1 examen oficial por trabajador
   • Bloqueo estricto al retroceder o agotar cupos
   ========================================================================== */

const CreditManager = {
  obtenerSesion: function() {
    let sesion = JSON.parse(localStorage.getItem('sensometrika_sesion'));
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
    // Sincronizar espejo para compatibilidad
    localStorage.setItem('sensometrika_ejecuciones', JSON.stringify(sesion.simulacionesConsumidas));
  },

  esB2B: function() {
    const sesion = this.obtenerSesion();
    const datosUser = JSON.parse(localStorage.getItem('sensometrika_datos_usuario')) || {};
    return (
      sesion.rol === 'empresa' ||
      (sesion.planId && String(sesion.planId).startsWith('b2b')) ||
      (datosUser.empresa && datosUser.empresa.toLowerCase() !== 'particular')
    );
  },

  obtenerLimiteModulo: function(moduloKey) {
    if (this.esB2B()) return 1; // B2B es 1 de 1 por trabajador

    const sesion = this.obtenerSesion();
    const planId = sesion.planId || 'part_basico';

    const esSensorial = (moduloKey === 'visual' || moduloKey === 'auditivo');

    if (planId.includes('full') || planId === 'part_full') {
      return esSensorial ? 4 : 8;
    } else if (planId.includes('plus') || planId === 'part_plus') {
      return esSensorial ? 2 : 5;
    } else {
      // Plan Básico
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
    const consumidas = this.obtenerConsumidas(moduloKey);
    const max = this.obtenerLimiteModulo(moduloKey);
    return consumidas < max;
  },

  // BARRERA DE ENTRADA: Si intenta entrar tras haber agotado el cupo, bloquea y redirige
  validarAccesoOBloquear: function(moduloKey) {
    if (!this.puedeRendir(moduloKey)) {
      const max = this.obtenerLimiteModulo(moduloKey);
      alert(`Has completado todas tus simulaciones (${max}/${max}) para este módulo. Serás redirigido al Menú Principal.`);
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