// auditService.js - Módulo de Trazabilidad Forense para Sensometrika

export async function guardarTrazabilidadFinal(supabase, sessionData, rut, nombre, empresa, fotoBlob, resultadosBateria, estadoFinal, tokenQr) {
    try {
        // 1. Subir la foto de la webcam al bucket de Supabase Storage
        const nombreArchivo = `${rut}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('evaluados-fotos')
            .upload(nombreArchivo, fotoBlob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Obtener la URL pública de la foto recién subida
        const { data: publicUrlData } = supabase.storage
            .from('evaluados-fotos')
            .getPublicUrl(nombreArchivo);

        const fotoPublicUrl = publicUrlData.publicUrl;

        // 2. Insertar el registro completo en la tabla evaluation_audit_logs
        const { data: insertData, error: insertError } = await supabase
            .from('evaluation_audit_logs')
            .insert([
                {
                    session_id: sessionData.sessionId || crypto.randomUUID(),
                    rut_evaluado: rut,
                    nombre_evaluado: nombre,
                    empresa_mandante: empresa,
                    foto_identidad_url: fotoPublicUrl,
                    device_info: sessionData.device_info || {},
                    input_latency_ms: sessionData.input_latency_ms || 0,
                    bateria_tipo: 'Alto Estándar',
                    resultados_detallados: resultadosBateria,
                    estado_final: estadoFinal, // 'APTO' o 'NO APTO'
                    qr_hash_token: tokenQr
                }
            ]);

        if (insertError) throw insertError;

        console.log('Trazabilidad forense y fotografía guardadas con éxito.');
        return true;

    } catch (error) {
        console.error('Error al guardar la auditoría de la evaluación:', error);
        return false;
    }
}