/**
 * Sensometrika Pro B2B - Telemetry & Supabase Service
 * Empaqueta métricas de examen, datos de calibración de hardware y firma de integridad.
 */

export class B2BTelemetryService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Genera el payload consolidado y firmado para guardar en Supabase
   */
  async saveEvaluationResult(evaluationData) {
    const {
      companyId,
      evaluatorId,
      evaluatedUser,
      moduleCode,
      modalityCode,
      metrics,
      telemetry
    } = evaluationData;

    // Genera firma simple de integridad (Hash MD5/SHA-256 local o simulado)
    const rawPayload = JSON.stringify({ metrics, telemetry, timestamp: Date.now() });
    const integrityHash = await this.generateHash(rawPayload);

    const payload = {
      company_id: companyId,
      evaluator_id: evaluatorId,
      evaluated_rut: evaluatedUser.rut,
      evaluated_name: evaluatedUser.fullName,
      module_code: moduleCode,
      modality_code: modalityCode,
      metrics: metrics,
      hardware_telemetry: telemetry,
      integrity_hash: integrityHash,
      created_at: new Date().toISOString()
    };

    // Si existe cliente Supabase configurado
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('evaluaciones_pro_b2b')
        .insert([payload]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        throw error;
      }
      return data;
    }

    // Fallback de desarrollo local
    console.log('Payload B2B listo para envío:', payload);
    return payload;
  }

  async generateHash(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}