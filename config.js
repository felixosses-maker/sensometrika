/* SENSOMETRIKA - Core Session & Isolation Manager */

const SensometrikaSession = {
  // Inicializa la sesión B2C limpiando residuos anteriores
  initB2C: function(datos) {
    localStorage.removeItem('sensometrika_b2b_token');
    localStorage.removeItem('sensometrika_foto_trabajador');
    localStorage.removeItem('sensometrika_firma_trabajador');
    
    localStorage.setItem('sensometrika_mode', 'b2c');
    localStorage.setItem('sensometrika_datos_usuario', JSON.stringify(datos));
    
    if (!localStorage.getItem('sensometrika_intento_actual')) {
      localStorage.setItem('sensometrika_intento_actual', '1');
    }
  },

  // Inicializa la sesión B2B aislada
  initB2B: function(datosEmpresa) {
    localStorage.removeItem('sensometrika_b2c_intentos');
    localStorage.setItem('sensometrika_mode', 'b2b');
    localStorage.setItem('sensometrika_b2b_datos', JSON.stringify(datosEmpresa));
  },

  // Obtiene la modalidad activa de forma segura
  getMode: function() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') || localStorage.getItem('sensometrika_mode') || 'b2c';
  },

  // Reinicia los módulos rendidos cuando se inicia un nuevo intento B2C
  resetModulosRendidos: function() {
    localStorage.removeItem('sensometrika_modulos_rendidos');
  }
};