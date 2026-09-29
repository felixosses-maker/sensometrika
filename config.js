/* ==========================================================================
   SENSOMETRIKA - CONFIGURACIÓN DE PLANES Y PERFILES B2B (config.js)
   ========================================================================== */

export const PLANES_B2B = {
  estandar: {
    id: "estandar",
    name: "Plan B2B Estándar (Transporte / General)",
    modulos: ["reactimetro", "punteo", "palancas"],
    descripcion: "Evaluación psicotécnica base para conducción general y transporte de carga."
  },
  alta_complejidad: {
    id: "alta_complejidad",
    name: "Plan B2B Alta Complejidad (Minería Sernageomin / Forestal CORMA)",
    modulos: ["reactimetro", "palancas", "anticipacion", "fatiga", "estereopsis"],
    descripcion: "Batería crítica avanzada para operación de maquinaria pesada, grúas y faenas de alto riesgo."
  }
};

export const INDUSTRY_THRESHOLDS = {
  mining: {
    name: "Minera (Estándar Sernageomin)",
    maxReactionTime: 350,
    errorTolerance: 0,
    passingScore: 85
  },
  forestry: {
    name: "Forestal (Estándar CORMA)",
    maxReactionTime: 400,
    errorTolerance: 1,
    passingScore: 80
  },
  transport: {
    name: "Transporte de Carga",
    maxReactionTime: 380,
    errorTolerance: 2,
    passingScore: 75
  }
};