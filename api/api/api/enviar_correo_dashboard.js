async function enviarCorreoIndividualSeleccionado() {
    // Tomamos los valores reales de los inputs o de la empresa seleccionada en la tabla
    const emailDestino = document.getElementById('empCorreo')?.value || emp.correo;
    const nombreApr = document.getElementById('empContacto')?.value || emp.contacto;
    const empresa = document.getElementById('empNombre')?.value || emp.nombre;
    const plan = document.getElementById('empPlan')?.value || emp.plan;
    const enlace = emp.url; // El link generado con demo_empresa.html?empresa=...

    try {
        const response = await fetch('/api/enviar-correo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailDestino: emailDestino,
                nombreApr: nombreApr,      // <--- Se inyecta correctamente en ${nombreFinal}
                empresa: empresa,          // <--- Se inyecta correctamente en ${empresaFinal}
                rut: "RUT-EMPRESA-B2B",    // <--- O el RUT del trabajador si corresponde
                enlace: enlace,            // <--- El link dinámico
                plan: plan                 // <--- Plan Plus, Full, etc.
            })
        });

        const resultado = await response.json();
        if (response.ok && resultado.success) {
            mostrarAlertaSimulador(`¡Correo enviado con éxito a ${emailDestino}!`, 'exito');
        } else {
            mostrarAlertaSimulador(`Error: ${resultado.error}`, 'error');
        }
    } catch (err) {
        mostrarAlertaSimulador('Error de red al conectar con el servidor de correo.', 'error');
    }
}