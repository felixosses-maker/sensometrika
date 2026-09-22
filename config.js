// config.js
// Configuración centralizada de Sensometrika: B2C y B2B

const SENSOMETRIKA_CONFIG = {
  b2c: {
    nombreModo: 'B2C Particular',
    intentos: 10,
    tiempoMinEsperaMs: 2000,
    tiempoMaxEsperaMs: 4500,
    umbralAprobadoMs: 450,
    toleranciaAnticipacion: 2,
    maxSimulaciones: 3,
    storageKey: 'sensometrika_reactimetro', // Clave que leen menu.html e informe.html
    urlRetorno: 'menu.html'
  },
  b2b: {
    nombreModo: 'B2B Faena Forestal/Minera',
    intentos: 20,
    tiempoMinEsperaMs: 1500,
    tiempoMaxEsperaMs: 3500,
    umbralAprobadoMs: 320,
    toleranciaAnticipacion: 0,
    maxSimulaciones: 1,
    storageKey: 'sensometrika_reactimetro', // Compatible con menu-b2b.html e informe-b2b.html
    urlRetorno: 'menu-b2b.html'
  }
};