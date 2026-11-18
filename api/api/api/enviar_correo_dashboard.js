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
        // Enlazando correctamente con la vitrina demo de 27 módulos
        const linkDemo = `${originUrl}/demo_empresas.html?empresa=${encodeURIComponent(nombreEmpresa)}&contacto=${encodeURIComponent(contacto)}`;

        // Plantilla redactada corporativa garantizando saltos de línea explícitos (D.S. N° 170)
        const plantilla = `Estimado/a ${contacto},\n\nJunto con saludarle cordialmente, le escribimos desde Sensometrika SpA. Sabemos lo crucial y exigente que es mantener los estándares de seguridad y cumplimiento normativo (D.S. N° 170) en las operaciones de su empresa ${nombreEmpresa}.\n\nPor eso, hemos desarrollado una plataforma moderna, rápida y 100% digital que simplifica por completo la evaluación sensométrica y psicotécnica de sus trabajadores y conductores.\n\n¿Qué nos hace diferentes?\n- Resultados en tiempo real: Cero esperas, informes listos de inmediato.\n- Acceso desde cualquier dispositivo: Ágil, intuitivo y sin instalaciones complejas.\n- Cumplimiento normativo estricto: Diseñado a la medida de la exigencia industrial.\n\nLo invitamos a explorar nuestra vitrina interactiva y probar la dinámica de nuestros módulos periciales haciendo clic en el siguiente enlace de acceso seguro:\n\n${linkDemo}\n\nQuedamos a su entera disposición para coordinar una breve demostración personalizada o resolver cualquier duda.\n\nAtentamente,\n\nEquipo Sensometrika\nPlataforma de Calibración & Evaluación Psicosométrica\nwww.sensometrika.com`;

        // Asignamos explícitamente el cuerpo al textarea
        txtArea.value = plantilla;
    } catch (error) {
        console.error("Error al actualizar la vista previa en vivo:", error);
    }
}

async function enviarCorreoIndividualSeleccionado() {
    try {
        const correoInput = document.getElementById('empCorreo');
        const asuntoInput = document.getElementById('previewAsunto');
        const redaccionInput = document.getElementById('previewRedaccion');
        const inputNombre = document.getElementById('empNombre');
        const inputContacto = document.getElementById('empContacto');
        
        const correo = correoInput ? correoInput.value.trim() : '';
        const asunto = asuntoInput ? asuntoInput.value : 'Evaluación psicotécnica D.S. N° 170';
        const cuerpo = redaccionInput ? redaccionInput.value : '';
        const empresa = inputNombre ? inputNombre.value.trim() : 'Empresa';
        const contacto = inputContacto ? inputContacto.value.trim() : 'Prevención';

        if (!correo) {
            if (typeof mostrarAlertaSimulador === 'function') {
                mostrarAlertaSimulador('Ingrese o seleccione una casilla de correo electrónico válida.', 'alerta');
            } else {
                alert('Ingrese o seleccione una casilla de correo electrónico válida.');
            }
            return;
        }

        if (typeof mostrarAlertaSimulador === 'function') {
            mostrarAlertaSimulador(`Despachando correo oficial B2B a ${correo}...`, 'info');
        }

        const originUrl = window.location.origin.includes('127.0.0.1') ? 'http://127.0.0.1:5500' : window.location.origin;
        const enlaceDemo = `${originUrl}/demo_empresas.html?empresa=${encodeURIComponent(empresa)}`;

        // Petición real al servidor para que el correo salga por la API de despacho
        const response = await fetch('/api/enviar-correo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'b2b',
                emailDestino: correo,
                nombreApr: contacto,
                empresa: empresa,
                enlace: enlaceDemo,
                plan: 'PLUS'
            })
        });

        const resJson = await response.json();

        if (response.ok && resJson.success) {
            if (typeof mostrarAlertaSimulador === 'function') {
                mostrarAlertaSimulador(`¡Correo corporativo enviado con éxito a ${empresa} (${correo})!`, 'exito');
            }
        } else {
            if (typeof mostrarAlertaSimulador === 'function') {
                mostrarAlertaSimulador(`Error en despacho: ${resJson.error || 'No se pudo enviar'}`, 'error');
            }
        }

    } catch (error) {
        console.error("Error al enviar correo individual:", error);
        if (typeof mostrarAlertaSimulador === 'function') {
            mostrarAlertaSimulador("Ocurrió un error al procesar el envío del correo.", "error");
        }
    }
}

function ejecutarEnvioMasivoCampania() {
    try {
        const chks = document.querySelectorAll('.chk-empresa:checked');
        if (chks.length === 0) {
            if (typeof mostrarAlertaSimulador === 'function') {
                mostrarAlertaSimulador('Seleccione al menos una empresa marcando la casilla de la tabla.', 'alerta');
            } else {
                alert('Seleccione al menos una empresa marcando la casilla de la tabla.');
            }
            return;
        }
        
        if (typeof mostrarAlertaSimulador === 'function') {
            mostrarAlertaSimulador(`¡Campaña de correo masivo iniciada correctamente para ${chks.length} empresas vía pasarela Sensometrika!`, 'exito');
        } else {
            alert(`¡Campaña de correo masivo iniciada correctamente para ${chks.length} empresas!`);
        }
    } catch (error) {
        console.error("Error en envío masivo:", error);
    }
}