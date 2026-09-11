/**
 * Sensometrika | Gestor de Tiempo Diario y Créditos de Módulos Únicos
 */
const SessionTimer = {
  getHoyStr: () => new Date().toISOString().split('T')[0],

  obtenerSesion: () => {
    let sesion = JSON.parse(localStorage.getItem('sensometrika_sesion'));
    if (!sesion) {
      sesion = {
        rol: 'particular',
        planId: 'part_acomp_10m',
        nombrePlan: 'Plan Acompañamiento',
        modulosPermitidos: ['reactimetro', 'palancas', 'punteo', 'visual', 'auditivo'],
        segundosMaxDiarios: 600, // 10 min
        diasVigencia: 5,
        usosVisualAuditivoMax: 1,
        usosConsumidos: { visual: 0, auditivo: 0 },
        fechaInicio: new Date().toISOString()
      };
      localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
    }
    if (!sesion.usosConsumidos) {
      sesion.usosConsumidos = { visual: 0, auditivo: 0 };
    }
    return sesion;
  },

  guardarSesion: (sesion) => {
    localStorage.setItem('sensometrika_sesion', JSON.stringify(sesion));
  },

  obtenerControlTiempo: () => {
    const sesion = SessionTimer.obtenerSesion();
    const hoy = SessionTimer.getHoyStr();
    let control = JSON.parse(localStorage.getItem('sensometrika_tiempo_diario'));

    if (!control || control.fecha !== hoy) {
      control = {
        fecha: hoy,
        segundosConsumidos: 0
      };
      localStorage.setItem('sensometrika_tiempo_diario', JSON.stringify(control));
    }
    return { control, sesion };
  },

  formatearMinSeg: (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  },

  obtenerSegundosRestantes: () => {
    const { control, sesion } = SessionTimer.obtenerControlTiempo();
    if (!sesion.segundosMaxDiarios || sesion.segundosMaxDiarios === 0) {
      return 999999;
    }
    const restantes = sesion.segundosMaxDiarios - control.segundosConsumidos;
    return restantes > 0 ? restantes : 0;
  },

  calcularDiaActual: () => {
    const sesion = SessionTimer.obtenerSesion();
    if (!sesion.fechaInicio) return 1;
    const inicio = new Date(sesion.fechaInicio);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diferenciaDias, 1), sesion.diasVigencia || 5);
  },

  verificarDiasExpirados: () => {
    const sesion = SessionTimer.obtenerSesion();
    if (!sesion.fechaInicio) return false;
    const inicio = new Date(sesion.fechaInicio);
    const ahora = new Date();
    const diferenciaDias = Math.floor((ahora - inicio) / (1000 * 60 * 60 * 24));
    return diferenciaDias >= (sesion.diasVigencia || 5);
  },

  registrarSegundoConsumido: () => {
    const { control, sesion } = SessionTimer.obtenerControlTiempo();
    if (sesion.segundosMaxDiarios > 0) {
      control.segundosConsumidos += 1;
      localStorage.setItem('sensometrika_tiempo_diario', JSON.stringify(control));
    }
  },

  puedeUsarModulo: (moduloKey) => {
    const sesion = SessionTimer.obtenerSesion();
    if (!sesion.modulosPermitidos.includes(moduloKey)) return false;

    if (moduloKey === 'visual' || moduloKey === 'auditivo') {
      if (sesion.usosVisualAuditivoMax > 0) {
        const consumidos = (sesion.usosConsumidos && sesion.usosConsumidos[moduloKey]) || 0;
        return consumidos < sesion.usosVisualAuditivoMax;
      }
      return true;
    }

    return SessionTimer.obtenerSegundosRestantes() > 0;
  },

  consumirUsoModulo: (moduloKey) => {
    if (moduloKey === 'visual' || moduloKey === 'auditivo') {
      const sesion = SessionTimer.obtenerSesion();
      if (!sesion.usosConsumidos) sesion.usosConsumidos = { visual: 0, auditivo: 0 };
      sesion.usosConsumidos[moduloKey] = (sesion.usosConsumidos[moduloKey] || 0) + 1;
      SessionTimer.guardarSesion(sesion);
    }
  }
};