// --- SCRIPT EXTERNO (CARPETA API): GESTIÓN DE CORREOS Y ACCIONES DEL DASHBOARD ---

function actualizarPreviewEnVivo() {
    try {
        const inputNombre = document.getElementById('empNombre');
        const inputContacto = document.getElementById('empContacto');
        const txtArea = document.getElementById('previewRedaccion');

        if (!txtArea) return;

        const nombreEmpresa = inputNombre && inputNombre.value.trim() ? inputNombre.value.trim() : '[NOMBRE DE LA EMPRESA]';
        const contacto = inputContacto && inputContacto.value.trim() ? inputContacto.value.trim() : '[Nombre del Contacto / Prevencionista]';
        
        const originUrl = window.location.origin.includes('127.0.0.1') ? 'http://127.0.0.1:5500' : window.location.origin;
        const linkDemo = `${originUrl}/demo_empresa.html?empresa=${encodeURIComponent(nombreEmpresa)}`;

        const plantilla = `Estimado/a ${contacto},

Junto con saludarle cordialmente, le escribimos desde Sensometrika SpA. Sabemos lo crucial y exigente que es mantener los estándares de seguridad y cumplimiento normativo (D.S. N° 170) en las operaciones de su empresa ${nombreEmpresa}.

Por eso, hemos desarrollado una plataforma moderna, rápida y 100% digital que simplifica por completo la evaluación sensométrica y psicotécnica de sus trabajadores y conductores.

¿Qué nos hace diferentes?
- Resultados en tiempo real: Cero esperas, informes listos de inmediato.
- Acceso desde cualquier dispositivo: Ágil, intuitivo y sin instalaciones complejas.
- Cumplimiento normativo estricto: Diseñado a la medida de la exigencia industrial.

Lo invitamos a explorar nuestra vitrina interactiva y probar la dinámica de nuestros módulos periciales haciendo clic en el siguiente enlace de acceso seguro:

${linkDemo}

Quedamos a su entera disposición para coordinar una breve demostración personalizada o resolver cualquier duda.

Atentamente,

Equipo Sensometrika
Plataforma de Calibración & Evaluación Psicosométrica
www.sensometrika.com`;

        txtArea.value = plantilla;
    } catch (error) {
        console.error("Error al actualizar la vista previa en vivo:", error);
    }
}

function enviarCorreoIndividualSeleccionado() {
    try {
        const correoInput = document.getElementById('empCorreo');
        const empresaInput = document.getElementById('empNombre');
        
        const correo = correoInput ? correoInput.value.trim() : '';
        const empresa = empresaInput ? empresaInput.value.trim() : 'Empresa Mandante';

        if (!correo) {
            mostrarAlertaSimulador('Ingrese o seleccione una casilla de correo electrónico válida.', 'alerta');
            return;
        }

        mostrarAlertaSimulador(`¡Correo de presentación enviado exitosamente a ${correo} (${empresa})!`, 'exito');
    } catch (error) {
        console.error("Error al enviar correo individual:", error);
    }
}

function ejecutarEnvioMasivoCampania() {
    try {
        const chks = document.querySelectorAll('.chk-empresa:checked');
        if (chks.length === 0) {
            mostrarAlertaSimulador('Seleccione al menos una empresa marcando la casilla de la tabla.', 'alerta');
            return;
        }
        mostrarAlertaSimulador(`¡Campaña de correo masivo iniciada correctamente para ${chks.length} empresas!`, 'exito');
    } catch (error) {
        console.error("Error en envío masivo:", error);
    }
}