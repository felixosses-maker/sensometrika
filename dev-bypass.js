/* ==========================================================================
   SENSOMETRIKA - BYPASS AUTOMÁTICO PARA DESARROLLO LOCAL (dev-bypass.js)
   • Permite visualizar y probar todas las vistas B2B e informes sin bloqueos
   ========================================================================== */

(function() {
  const esLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

  if (esLocal) {
    console.log("🛠️ [Sensometrika Dev Mode]: Entorno local detectado. Aplicando bypass de pruebas...");

    // 1. Inyectar empresa de prueba si no existe
    if (!localStorage.getItem('sensometrika_plan_empresa')) {
      localStorage.setItem('sensometrika_plan_empresa', JSON.stringify({
        razonSocial: "SOCADEP LTDA. (MODO DESARROLLO)",
        rutEmpresa: "76.123.456-7",
        responsable: "Mariela Cárcamo Fernández",
        correoInformes: "prevencion@socadep.cl",
        plan: "alta_complejidad"
      }));
    }

    // 2. Inyectar sesión corporativa con alta complejidad habilitada
    if (!localStorage.getItem('sensometrika_sesion')) {
      localStorage.setItem('sensometrika_sesion', JSON.stringify({
        planId: "alta_complejidad",
        modulosPermitidos: ["reactimetro", "palancas", "punteo", "anticipacion", "fatiga", "estereopsis"]
      }));
    }

    // 3. Inyectar datos de trabajador y firma de prueba para desbloquear informes
    if (!localStorage.getItem('sensometrika_datos_usuario')) {
      localStorage.setItem('sensometrika_datos_usuario', JSON.stringify({
        tipo: "b2b",
        nombre: "Félix Osses (Tester Local)",
        rut: "12.345.678-9",
        cargo: "Operador de Maquinaria Pesada",
        empresa: "SOCADEP LTDA.",
        consentimiento: true,
        fechaRegistro: new Date().toISOString()
      }));
    }

    // Inyectar un píxel transparente como firma válida si no existe
    if (!localStorage.getItem('sensometrika_firma_trabajador')) {
      const canvasTemp = document.createElement('canvas');
      canvasTemp.width = 200;
      canvasTemp.height = 50;
      const ctxTemp = canvasTemp.getContext('2d');
      ctxTemp.fillStyle = '#0284c7';
      ctxTemp.font = '16px sans-serif';
      ctxTemp.fillText('Firma Test Local', 10, 30);
      localStorage.setItem('sensometrika_firma_trabajador', canvasTemp.toDataURL());
    }

    // 4. Inyectar resultados de prueba exitosos para los 6 módulos (para ver el informe completo)
    if (!localStorage.getItem('sensometrika_reactimetro')) {
      localStorage.setItem('sensometrika_reactimetro', JSON.stringify({ promedioMs: 320, aprobado: true }));
      localStorage.setItem('sensometrika_palancas', JSON.stringify({ efectividad: 92, aprobado: true }));
      localStorage.setItem('sensometrika_punteo', JSON.stringify({ efectividad: 88, aprobado: true }));
      localStorage.setItem('sensometrika_anticipacion', JSON.stringify({ promedioError: 140, aprobado: true }));
      localStorage.setItem('sensometrika_fatiga', JSON.stringify({ promedioLatencia: 290, aprobado: true }));
      localStorage.setItem('sensometrika_estereopsis', JSON.stringify({ precision: 100, aprobado: true }));
    }
  }
})();