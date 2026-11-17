/**
 * Envía un correo individual a la empresa seleccionada utilizando la API serverless.
 */
async function enviarCorreoIndividualSeleccionado() {
    if (!empresaSeleccionadaId) {
        const empresas = obtenerListaEmpresasB2B();
        if (empresas.length > 0) {
            empresaSeleccionadaId = empresas[0].id;
        } else {
            alert('⚠️ No hay empresas registradas para enviar el correo.');
            return;
        }
    }

    const empresas = obtenerListaEmpresasB2B();
    const emp = empresas.find(e => e.id === empresaSeleccionadaId);
    if (!emp) return;

    // Indicador visual de carga en el botón
    const btnEnviar = document.getElementById('btnEnviarIndividual') || event.target;
    const textoOriginal = btnEnviar.textContent;
    btnEnviar.textContent = '⏳ Enviando vía Resend...';
    btnEnviar.disabled = true;

    try {
        const response = await fetch('/api/enviar-correo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'b2b_apr_acceso',
                emailDestino: emp.correo,
                nombreApr: emp.contacto,
                empresa: emp.nombre,
                rutEmpresa: emp.rut || '--',
                planNombre: emp.plan || 'Bolsa Corporativa B2B',
                codigoEmpresa: emp.codigo || 'SENSE-B2B-ACTIVO'
            })
        });

        const resultado = await response.json();

        if (response.ok && resultado.success) {
            alert(`✅ ¡Correo enviado exitosamente a ${emp.correo}!\nID de Resend: ${resultado.id}`);
            
            // Actualizar estado local si corresponde
            if (emp.estado === 'LINK_ENVIADO') {
                emp.estado = 'EN_SERVICIO';
            }
            localStorage.setItem('sensometrika_empresas_b2b', JSON.stringify(empresas));
            
            if (typeof renderizarTablaEmpresas === 'function') renderizarTablaEmpresas();
            if (typeof actualizarMetricasYRendimiento === 'function') actualizarMetricasYRendimiento();
        } else {
            alert(`❌ Error al enviar el correo: ${resultado.error || 'Respuesta no válida'}`);
        }
    } catch (err) {
        console.error('Error de red:', err);
        alert('❌ Error de red al intentar conectar con la API de despacho.');
    } finally {
        btnEnviar.textContent = textoOriginal;
        btnEnviar.disabled = false;
    }
}


/**
 * Envía correos masivos a todas las empresas de la lista de forma iterativa y segura.
 */
async function ejecutarEnvioMasivoCampana() {
    const empresas = obtenerListaEmpresasB2B();
    if (!empresas || empresas.length === 0) {
        alert('⚠️ No hay empresas en la lista para realizar el envío masivo.');
        return;
    }

    if (!confirm(`¿Estás seguro de iniciar la campaña de correo masivo para ${empresas.length} empresas?`)) {
        return;
    }

    const btnMasivo = document.getElementById('btnEnvioMasivo') || event.target;
    const textoOriginal = btnMasivo.textContent;
    btnMasivo.disabled = true;

    let exitosos = 0;
    let fallidos = 0;

    for (let i = 0; i < empresas.length; i++) {
        const emp = empresas[i];
        btnMasivo.textContent = `⏳ Enviando (${i + 1}/${empresas.length})...`;

        try {
            const response = await fetch('/api/enviar-correo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'b2b_apr_acceso',
                    emailDestino: emp.correo,
                    nombreApr: emp.contacto,
                    empresa: emp.nombre,
                    rutEmpresa: emp.rut || '--',
                    planNombre: emp.plan || 'Bolsa Corporativa B2B',
                    codigoEmpresa: emp.codigo || 'SENSE-B2B-ACTIVO'
                })
            });

            const resData = await response.json();
            if (response.ok && resData.success) {
                exitosos++;
                if (emp.estado === 'LINK_ENVIADO') emp.estado = 'EN_SERVICIO';
            } else {
                fallidos++;
            }
        } catch (e) {
            fallidos++;
        }
    }

    // Guardar cambios actualizados
    localStorage.setItem('sensometrika_empresas_b2b', JSON.stringify(empresas));
    if (typeof renderizarTablaEmpresas === 'function') renderizarTablaEmpresas();

    alert(`📊 Campaña finalizada:\n\n✅ Exitosos: ${exitosos}\n❌ Fallidos: ${fallidos}`);
    btnMasivo.textContent = textoOriginal;
    btnMasivo.disabled = false;
}