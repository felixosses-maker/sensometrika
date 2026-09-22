/**
 * Sensometrika | Gestor Unificado de Regímenes, Créditos y Planes
 */
const SessionTimer = {
  obtenerSesion: () => {
    let sesion = JSON.parse(localStorage.getItem('sensometrika_sesion'));
    if (!sesion) {
      sesion = {
        planId: 'part_basico',
        nombrePlan: 'Plan Básico Psicomotriz',
        rol: 'particular',
        modulosPermitidos: ['reactimetro', 'palancas', 'punteo'],
        tipoRegimen: 'creditos_modulo',
        pruebasCompletasRestantes: 1,
        ejecucionesRestantes: { reactimetro: 3, palancas: 3, punteo: 3 }
      };
      localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    }
    return sesion;
  },

  guardarSesion: (sesion) => {
    localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
  },

  puedeIngresarModulo: (moduloKey) => {
    const sesion = SessionTimer.obtenerSesion();
    if (!sesion.modulosPermitidos || !sesion.modulosPermitidos.includes(moduloKey)) return false;

    // Plan Básico: 1 diagnóstico general + 3 ejecuciones por módulo
    if (sesion.tipoRegimen === 'creditos_modulo') {
      if (sesion.pruebasCompletasRestantes > 0) return true;
      const restantes = (sesion.ejecucionesRestantes && sesion.ejecucionesRestantes[moduloKey]) || 0;
      return restantes > 0;
    }

    // Plan Acompañamiento: 1 único uso para visual/auditivo
    if (sesion.tipoRegimen === 'tiempo_diario') {
      if (moduloKey === 'visual' || moduloKey === 'auditivo') {
        const consumidos = (sesion.usosConsumidos && sesion.usosConsumidos[moduloKey]) || 0;
        return consumidos < (sesion.usosVisualAuditivoMax || 1);
      }
    }

    return true;
  },

  descontarEjecucion: (moduloKey) => {
    const sesion = SessionTimer.obtenerSesion();
    if (sesion.tipoRegimen === 'creditos_modulo') {
      if (sesion.pruebasCompletasRestantes > 0) {
        // La prueba inicial diagnóstica se descuenta al llegar al informe
        return;
      }
      if (sesion.ejecucionesRestantes && sesion.ejecucionesRestantes[moduloKey] > 0) {
        sesion.ejecucionesRestantes[moduloKey] -= 1;
        SessionTimer.guardarSesion(sesion);
      }
    } else if (moduloKey === 'visual' || moduloKey === 'auditivo') {
      if (!sesion.usosConsumidos) sesion.usosConsumidos = { visual: 0, auditivo: 0 };
      sesion.usosConsumidos[moduloKey] = (sesion.usosConsumidos[moduloKey] || 0) + 1;
      SessionTimer.guardarSesion(sesion);
    }
  }
};