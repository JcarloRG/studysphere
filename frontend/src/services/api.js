// src/services/api.js

// Puedes sobreescribir por .env => REACT_APP_API_URL=http://localhost:8000
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ===================== Helpers robustos ===================== */

function ensureLeadingSlash(path) {
    if (!path.startsWith('/')) return '/' + path;
    return path;
}

function ensureTrailingSlash(path) {
    if (!path.endsWith('/')) return path + '/';
    return path;
}

function joinURL(base, path) {
    const a = base.replace(/\/+$/, '');
    const b = ensureLeadingSlash(path);
    return a + b;
}

// Crea un Error con preview del cuerpo (por si viene HTML)
function httpError(message, { status, url, raw }) {
    const preview = (raw || '').slice(0, 300).replace(/\s+/g, ' ');
    const err = new Error(`${message} (HTTP ${status})`);
    err.status = status;
    err.url = url;
    err.preview = preview;
    return err;
}

// Parsea JSON si el servidor lo indica; si no, entrega texto
async function parseResponse(response) {
    const status = response.status;
    const ct = (response.headers.get('content-type') || '').toLowerCase();

    // 204 (No Content)
    if (status === 204) {
        return { data: null, raw: '', contentType: ct };
    }

    const text = await response.text();

    if (ct.includes('application/json')) {
        try {
            return { data: JSON.parse(text), raw: text, contentType: ct };
        } catch {
            throw new Error('El servidor indicó JSON pero envió contenido inválido.');
        }
    }

    // No es JSON → devolvemos texto (p.ej. HTML de error)
    return { data: null, raw: text, contentType: ct };
}

/**
 * Único punto de entrada para requests JSON
 * @param {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} method
 * @param {string} path
 * @param {object?} body
 * @param {number?} timeoutMs
 */
async function requestJSON(method, path, body, timeoutMs = 20000) {
    // Aseguramos barra final en endpoints tipo recurso (conviene para DRF)
    const mustSlash = /[a-zA-Z)]$/.test(path);
    const normalizedPath = mustSlash ? ensureTrailingSlash(path) : path;
    const url = joinURL(API_BASE_URL, normalizedPath);

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const init = {
        method: method.toUpperCase(),
        headers: {
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        credentials: 'omit', // no enviar cookies en dev
        signal: controller.signal,
    };

    if (body) {
        init.body = JSON.stringify(body);
    }

    let parsed;
    let response;
    try {
        response = await fetch(url, init);
        parsed = await parseResponse(response);
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado y fue cancelada.');
        }
        // Errores de red, caída del servidor, CORS, etc.
        if (err.name === 'TypeError' && String(err.message).includes('fetch')) {
            throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en ' + API_BASE_URL);
        }
        throw err;
    } finally {
        clearTimeout(id);
    }

    if (!response.ok) {
        const msg =
            parsed?.data?.message ||
            parsed?.data?.detail ||
            (parsed?.raw && parsed.raw.trim().startsWith('<') ? 'El servidor devolvió HTML (posible error 500). Revisa consola/servidor.' : 'Error en la solicitud');
        throw httpError(msg, { status: response.status, url, raw: parsed?.raw });
    }

    // Normalizamos salida
    const payload = parsed?.data;
    const normalizedData = payload?.data !== undefined ? payload.data : payload;
    const message = payload?.message || payload?.detail || undefined;

    return {
        success: true,
        status: response.status,
        data: normalizedData ?? null,
        raw: parsed?.raw,
        message,
    };
}

/**
 * Request para multipart/form-data (subida de archivos)
 * - NO seteamos 'Content-Type'; el navegador agrega el boundary correcto.
 * @param {'POST'|'PUT'|'PATCH'} method
 * @param {string} path
 * @param {FormData} formData
 * @param {number?} timeoutMs
 */
async function requestMultipart(method, path, formData, timeoutMs = 20000) {
    if (!(formData instanceof FormData)) {
        throw new Error('requestMultipart requiere un FormData válido');
    }

    const mustSlash = /[a-zA-Z)]$/.test(path);
    const normalizedPath = mustSlash ? ensureTrailingSlash(path) : path;
    const url = joinURL(API_BASE_URL, normalizedPath);

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const init = {
        method: method.toUpperCase(),
        headers: {
            Accept: 'application/json',
            // Importante: NO poner Content-Type aquí
        },
        body: formData,
        credentials: 'omit',
        signal: controller.signal,
    };

    let parsed;
    let response;
    try {
        response = await fetch(url, init);
        parsed = await parseResponse(response);
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado y fue cancelada.');
        }
        if (err.name === 'TypeError' && String(err.message).includes('fetch')) {
            throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en ' + API_BASE_URL);
        }
        throw err;
    } finally {
        clearTimeout(id);
    }

    if (!response.ok) {
        const msg =
            parsed?.data?.message ||
            parsed?.data?.detail ||
            (parsed?.raw && parsed.raw.trim().startsWith('<') ? 'El servidor devolvió HTML (posible error 500). Revisa consola/servidor.' : 'Error en la solicitud');
        throw httpError(msg, { status: response.status, url, raw: parsed?.raw });
    }

    const payload = parsed?.data;
    const normalizedData = payload?.data !== undefined ? payload.data : payload;
    const message = payload?.message || payload?.detail || undefined;

    return {
        success: true,
        status: response.status,
        data: normalizedData ?? null,
        raw: parsed?.raw,
        message,
    };
}

/* ===================== API pública ===================== */

export const apiService = {

    // En services/api.js - ACTUALIZAR ESTE MÉTODO

async cancelRegistration(email, tipo) {
    console.log(`🗑️ Cancelando registro para: ${email}, tipo: ${tipo}`);
    
    try {
        // Buscar el perfil por correo y tipo para obtener el ID
        const buscarResult = await this.buscarPorCorreoYTipo(email, tipo);
        
        if (!buscarResult.success) {
            throw new Error('No se encontró el registro para cancelar');
        }

        const perfilId = buscarResult.id;
        console.log(`🔍 Encontrado ${tipo} ID: ${perfilId} para cancelar`);

        // ✅ USAR LOS NUEVOS ENDPOINTS
        let resultado;
        switch(tipo) {
            case 'estudiante':
                resultado = await requestJSON('POST', `/api/estudiante/${perfilId}/delete/`, {});
                break;
            case 'docente':
                resultado = await requestJSON('POST', `/api/docente/${perfilId}/delete/`, {});
                break;
            case 'egresado':
                resultado = await requestJSON('POST', `/api/egresado/${perfilId}/delete/`, {});
                break;
            default:
                throw new Error('Tipo de usuario no válido');
        }

        console.log('✅ Registro eliminado exitosamente:', resultado);
        return {
            success: true,
            message: resultado.message || 'Registro cancelado exitosamente',
            data: resultado.data,
            status: resultado.status,
        };

    } catch (error) {
        console.error('❌ Error en cancelRegistration:', error);
        throw new Error(error.message || 'Error al cancelar el registro');
    }
},

    /* ---------- AUTHENTICATION ---------- */
    async loginUser(email, password) {
        console.log(`🔐 INICIANDO LOGIN para: ${email}`);

        if (!email || !password) {
            throw new Error('Correo y contraseña son obligatorios');
        }

        const res = await requestJSON('POST', '/api/login/', {
            correo_institucional: email, // nombre de campo que espera tu backend
            password: password,
        });

        console.log('📡 Respuesta loginUser:', res);

        if (res.success && res.data) {
            return {
                success: true,
                message: res.message || 'Inicio de sesión exitoso',
                tipo: res.data.tipo,
                id: res.data.perfil_id,
                data: res.data,
            };
        }
        
        throw new Error(res.message || 'Respuesta de login inesperada.');
    },
    
    /* ---------- CREATE ---------- */
    async createEstudiante(estudianteData) {
        console.log('🚀 INICIANDO REGISTRO DE ESTUDIANTE...');
        console.log('📦 Datos a enviar:', estudianteData);

        if (estudianteData instanceof FormData) {
            // ⬇️ Envío con foto (multipart/form-data)
            const res = await requestMultipart('POST', '/api/estudiante/registrar/', estudianteData);
            console.log('📡 Respuesta createEstudiante (multipart):', res);
            return {
                success: true,
                message: res.message || '¡Registro exitoso!',
                data: res.data,
                status: res.status,
            };
        }

        // ⬇️ Envío JSON normal (sin foto)
        if (!estudianteData?.nombre_completo || !estudianteData?.correo_institucional) {
            throw new Error('Nombre y correo son obligatorios');
        }
        const res = await requestJSON('POST', '/api/estudiante/registrar/', estudianteData);
        console.log('📡 Respuesta createEstudiante:', res);
        return {
            success: true,
            message: res.message || '¡Registro exitoso!',
            data: res.data,
            status: res.status,
        };
    },

    async createDocente(docenteData) {
        console.log('🚀 INICIANDO REGISTRO DE DOCENTE...');
        console.log('📦 Datos a enviar:', docenteData);

        if (!docenteData?.nombre_completo || !docenteData?.correo_institucional || !docenteData?.carrera_egreso) {
            throw new Error('Nombre, correo y carrera de egreso son obligatorios');
        }

        const res = await requestJSON('POST', '/api/docente/registrar/', docenteData);
        console.log('📡 Respuesta createDocente:', res);
        return {
            success: true,
            message: res.message || '¡Docente registrado exitosamente!',
            data: res.data,
            status: res.status,
        };
    },

    async createEgresado(egresadoData) {
        console.log('🚀 INICIANDO REGISTRO DE EGRESADO...');
        console.log('📦 Datos a enviar:', egresadoData);

        if (!egresadoData?.nombre_completo || !egresadoData?.correo_institucional || !egresadoData?.carrera_egreso || !egresadoData?.anio_egreso) {
            throw new Error('Nombre, correo, carrera de egreso y año de egreso son obligatorios');
        }
        if (isNaN(Number(egresadoData.anio_egreso))) {
            throw new Error('El año de egreso debe ser un número válido');
        }

        const res = await requestJSON('POST', '/api/egresado/registrar/', egresadoData);
        console.log('📡 Respuesta createEgresado:', res);
        return {
            success: true,
            message: res.message || '¡Egresado registrado exitosamente!',
            data: res.data,
            status: res.status,
        };
    },

    /* ---------- LIST (MODIFICADO para excluir ID) ---------- */
    async getEstudiantes(excludeId = null) {
        console.log(`🔍 Obteniendo lista de estudiantes (Excluir: ${excludeId})...`);
        const query = excludeId ? `?exclude_id=${excludeId}` : '';
        const res = await requestJSON('GET', `/api/estudiantes/${query}`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
        return { success: true, data, status: res.status };
    },

    async getDocentes(excludeId = null) {
        console.log(`🔍 Obteniendo lista de docentes (Excluir: ${excludeId})...`);
        const query = excludeId ? `?exclude_id=${excludeId}` : '';
        const res = await requestJSON('GET', `/api/docentes/${query}`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
        return { success: true, data, status: res.status };
    },

    async getEgresados(excludeId = null) {
        console.log(`🔍 Obteniendo lista de egresados (Excluir: ${excludeId})...`);
        const query = excludeId ? `?exclude_id=${excludeId}` : '';
        const res = await requestJSON('GET', `/api/egresados/${query}`);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
        return { success: true, data, status: res.status };
    },

    /* ---------- PROFILES ---------- */
    async getPerfilEstudiante(estudianteId) {
        console.log(`🔍 Obteniendo perfil del estudiante ID: ${estudianteId}`);
        const res = await requestJSON('GET', `/api/estudiante/${estudianteId}/`);
        return { success: true, data: res.data, tipo: 'estudiante', status: res.status };
    },

    async getPerfilDocente(docenteId) {
        console.log(`🔍 Obteniendo perfil del docente ID: ${docenteId}`);
        const res = await requestJSON('GET', `/api/docente/${docenteId}/`);
        return { success: true, data: res.data, tipo: 'docente', status: res.status };
    },

    async getPerfilEgresado(egresadoId) {
        console.log(`🔍 Obteniendo perfil del egresado ID: ${egresadoId}`);
        const res = await requestJSON('GET', `/api/egresado/${egresadoId}/`);
        return { success: true, data: res.data, tipo: 'egresado', status: res.status };
    },

    async getPerfil(tipo, id) {
        console.log(`🔍 Obteniendo perfil: ${tipo} ID: ${id}`);
        if (tipo === 'estudiante') return this.getPerfilEstudiante(id);
        if (tipo === 'docente')    return this.getPerfilDocente(id);
        if (tipo === 'egresado')   return this.getPerfilEgresado(id);
        throw new Error('Tipo de perfil no válido');
    },

    /* ---------- DELETE, UPDATE, SEARCH (Corregido) ---------- */
async deleteEstudiante(estudianteId) {
    console.log(`🗑️ Eliminando estudiante ID: ${estudianteId}`);
    // ✅ USAR LA URL CORRECTA que coincide con tu Django
    const res = await requestJSON('POST', `/api/estudiante/${estudianteId}/delete/`);
    return { 
        success: true, 
        message: res.message || 'Estudiante eliminado exitosamente', 
        data: res.data,
        status: res.status 
    };
},

async deleteDocente(docenteId) {
    console.log(`🗑️ Eliminando docente ID: ${docenteId}`);
    // ✅ USAR LA URL CORRECTA que coincide con tu Django
    const res = await requestJSON('POST', `/api/docente/${docenteId}/delete/`);
    return { 
        success: true, 
        message: res.message || 'Docente eliminado exitosamente', 
        data: res.data,
        status: res.status 
    };
},

async deleteEgresado(egresadoId) {
    console.log(`🗑️ Eliminando egresado ID: ${egresadoId}`);
    // ✅ USAR LA URL CORRECTA que coincide con tu Django
    const res = await requestJSON('POST', `/api/egresado/${egresadoId}/delete/`);
    return { 
        success: true, 
        message: res.message || 'Egresado eliminado exitosamente', 
        data: res.data,
        status: res.status 
    };
},

    async updateEstudiante(estudianteId, estudianteData) {
        console.log(`✏️ Actualizando estudiante ID: ${estudianteId}`, estudianteData);
        const res = await requestJSON('PUT', `/api/estudiante/${estudianteId}/`, estudianteData);
        return { success: true, message: res.message || 'Estudiante actualizado exitosamente', data: res.data, status: res.status };
    },

    async updateDocente(docenteId, docenteData) {
        console.log(`✏️ Actualizando docente ID: ${docenteId}`, docenteData);
        const res = await requestJSON('PUT', `/api/docente/${docenteId}/`, docenteData);
        return { success: true, message: res.message || 'Docente actualizado exitosamente', data: res.data, status: res.status };
    },

    async updateEgresado(egresadoId, egresadoData) {
        console.log(`✏️ Actualizando egresado ID: ${egresadoId}`, egresadoData);
        const res = await requestJSON('PUT', `/api/egresado/${egresadoId}/`, egresadoData);
        return { success: true, message: res.message || 'Egresado actualizado exitosamente', data: res.data, status: res.status };
    },

    async buscarEstudiantes(query) {
        console.log(`🔍 Buscando estudiantes: ${query}`);
        const res = await requestJSON('GET', `/api/estudiantes/buscar/?q=${encodeURIComponent(query)}`);
        const data = res.data?.results || res.data?.data || res.data || [];
        return { success: true, data, status: res.status };
    },

    async buscarDocentes(query) {
        console.log(`🔍 Buscando docentes: ${query}`);
        const res = await requestJSON('GET', `/api/docentes/buscar/?q=${encodeURIComponent(query)}`);
        const data = res.data?.results || res.data?.data || res.data || [];
        return { success: true, data, status: res.status };
    },

    async buscarEgresados(query) {
        console.log(`🔍 Buscando egresados: ${query}`);
        const res = await requestJSON('GET', `/api/egresados/buscar/?q=${encodeURIComponent(query)}`);
        const data = res.data?.results || res.data?.data || res.data || [];
        return { success: true, data, status: res.status };
    },

    /* ---------- Buscar por correo (Mantenido) ---------- */
    async buscarPerfilPorCorreo(correo) {
        console.log(`🔍 Buscando perfil por correo: ${correo}`);

        try {
            // Nota: Aquí se usa getEstudiantes sin excludeId porque el propósito es buscar *todos* los perfiles por email.
            const est = await this.getEstudiantes(); 
            const e = (est.data || []).find(x =>
                x.correo_institucional && x.correo_institucional.toLowerCase() === correo.toLowerCase()
            );
            if (e) return { success: true, data: e, tipo: 'estudiante', id: e.id };
        } catch (err) {
            console.log('❌ Error buscando en estudiantes:', err.preview || err.message);
        }

        try {
            const doc = await this.getDocentes();
            const d = (doc.data || []).find(x =>
                x.correo_institucional && x.correo_institucional.toLowerCase() === correo.toLowerCase()
            );
            if (d) return { success: true, data: d, tipo: 'docente', id: d.id };
        } catch (err) {
            console.log('❌ Error buscando en docentes:', err.preview || err.message);
        }

        try {
            const egr = await this.getEgresados();
            const g = (egr.data || []).find(x =>
                x.correo_institucional && x.correo_institucional.toLowerCase() === correo.toLowerCase()
            );
            if (g) return { success: true, data: g, tipo: 'egresado', id: g.id };
        } catch (err) {
            console.log('❌ Error buscando en egresados:', err.preview || err.message);
        }

        return { success: false, message: 'No se encontró ningún perfil registrado con este correo electrónico' };
    },

    async buscarPorCorreoYTipo(correo, tipo) {
        console.log(`🔍 Buscando ${tipo} por correo: ${correo}`);
        let listado;
        if (tipo === 'estudiante') listado = await this.getEstudiantes();
        else if (tipo === 'docente') listado = await this.getDocentes();
        else if (tipo === 'egresado') listado = await this.getEgresados();
        else throw new Error('Tipo de perfil no válido');

        const arr = listado.data || [];
        const perfil = arr.find(x =>
            x.correo_institucional && x.correo_institucional.toLowerCase() === correo.toLowerCase()
        );
        if (perfil) return { success: true, data: perfil, tipo, id: perfil.id };
        return { success: false, message: `No se encontró ningún ${tipo} con este correo` };
    },

    /* ---------- Health, Email, Matches (Mantenido) ---------- */

    async checkServerStatus() {
        console.log('🔍 Verificando estado del servidor...');
        try {
            const res = await requestJSON('GET', '/api/health/');
            return { success: true, status: 'online', message: res.message || 'OK' };
        } catch (error) {
            console.error('Servidor offline (preview):', error.preview || error.message);
            return { success: false, status: 'offline', message: error.message };
        }
    },

    async emailGenerarCodigo(email, purpose = 'signup', tipo = 'estudiante', perfil_id = null) {
        const res = await requestJSON('POST', '/api/email/request_code/', { email, purpose, tipo, perfil_id });
        return { success: true, ...(res.data || {}), status: res.status, message: res.message };
    },

    async resendCode(email, userType) {
        console.log(`🔄 Reenviando código para: ${email}, tipo: ${userType}`);
        const res = await requestJSON('POST', '/api/email/request_code/', {
            email,
            purpose: 'resend',
            tipo: userType
        });
        console.log('📡 Respuesta resendCode:', res);
        return {
            success: true,
            message: res.message || '¡Código reenviado exitosamente!',
            data: res.data,
            status: res.status,
        };
    },

    async emailVerificarCodigo({ email, code }) {
        const res = await requestJSON('POST', '/api/email/verify_code/', { email, code });
        return { success: true, ...(res.data || {}), status: res.status, message: res.message };
    },
    
    async verifyCode(email, code) {
        return this.emailVerificarCodigo({ email, code });
    },

    async emailEstado(email) {
        // (opcional si no lo usas)
        const res = await requestJSON('GET', `/api/email/estado/?email=${encodeURIComponent(email)}`);
        return { success: true, ...(res.data || {}), status: res.status, message: res.message };
    },
    
    // ---------- MATCHES ----------
    async enviarSolicitudMatch(perfilId, tipo) {
        console.log(`💫 Enviando solicitud de match a ${tipo} ID: ${perfilId}`);
        try {
            const res = await requestJSON('POST', '/api/matches/solicitar/', {
                perfil_id: perfilId,
                tipo_perfil: tipo
            });
            console.log('📡 Respuesta enviarSolicitudMatch:', res);
            return {
                success: true,
                message: res.message || '¡Solicitud de match enviada exitosamente!',
                data: res.data,
                status: res.status,
            };
        } catch (error) {
            console.error('❌ Error en enviarSolicitudMatch:', error);
            return { success: false, message: error.message || 'Error al enviar la solicitud de match', status: error.status };
        }
    },

    async obtenerMatchesPotenciales() {
        console.log('🔍 Obteniendo matches potenciales...');
        try {
            const res = await requestJSON('GET', '/api/matches/potenciales/');
            console.log('📡 Respuesta obtenerMatchesPotenciales:', res);
            return { success: true, message: res.message || 'Matches potenciales obtenidos', matches: res.data || [], status: res.status };
        } catch (error) {
            console.error('❌ Error en obtenerMatchesPotenciales:', error);
            return { success: false, message: error.message || 'Error al obtener matches potenciales', status: error.status, matches: [] };
        }
    },

    async aceptarMatch(matchId) {
        console.log(`✅ Aceptando match ID: ${matchId}`);
        try {
            const res = await requestJSON('POST', '/api/matches/aceptar/', { match_id: matchId });
            console.log('📡 Respuesta aceptarMatch:', res);
            return { success: true, message: res.message || '¡Match aceptado exitosamente!', data: res.data, status: res.status };
        } catch (error) {
            console.error('❌ Error en aceptarMatch:', error);
            return { success: false, message: error.message || 'Error al aceptar el match', status: error.status };
        }
    },

    async rechazarMatch(matchId) {
        console.log(`❌ Rechazando match ID: ${matchId}`);
        try {
            const res = await requestJSON('POST', '/api/matches/rechazar/', { match_id: matchId });
            console.log('📡 Respuesta rechazarMatch:', res);
            return { success: true, message: res.message || 'Match rechazado', data: res.data, status: res.status };
        } catch (error) {
            console.error('❌ Error en rechazarMatch:', error);
            return { success: false, message: error.message || 'Error al rechazar el match', status: error.status };
        }
    },

    async obtenerMisMatches() {
        console.log('🔍 Obteniendo mis matches...');
        try {
            const res = await requestJSON('GET', '/api/matches/mis-matches/');
            console.log('📡 Respuesta obtenerMisMatches:', res);
            return { success: true, message: res.message || 'Mis matches obtenidos', matches: res.data || [], status: res.status };
        } catch (error) {
            console.error('❌ Error en obtenerMisMatches:', error);
            return { success: false, message: error.message || 'Error al obtener mis matches', status: error.status, matches: [] };
        }
    },

    async verificarEstadoMatch(perfilId) {
        console.log(`🔍 Verificando estado de match con perfil ID: ${perfilId}`);
        try {
            const res = await requestJSON('GET', `/api/matches/estado/${perfilId}/`);
            console.log('📡 Respuesta verificarEstadoMatch:', res);
            return { success: true, message: res.message || 'Estado de match obtenido', estado: res.data?.estado || 'no_match', data: res.data, status: res.status };
        } catch (error) {
            console.error('❌ Error en verificarEstadoMatch:', error);
            return { success: false, message: error.message || 'Error al verificar estado del match', status: error.status, estado: 'error' };
        }
    },

    /* ===================== MÉTODOS DE FOTOS ===================== */

    // Actualizar fotos
    async updateEstudianteFoto(estudianteId, file) {
        console.log(`📸 Actualizando foto de estudiante ID: ${estudianteId}`);
        const formData = new FormData();
        formData.append('foto', file);
        const res = await requestMultipart('POST', `/api/estudiante/${estudianteId}/foto/`, formData);
        return {
            success: true,
            message: res.message || 'Foto actualizada correctamente',
            data: res.data,
            status: res.status,
        };
    },

    async updateDocenteFoto(docenteId, file) {
        console.log(`📸 Actualizando foto de docente ID: ${docenteId}`);
        const formData = new FormData();
        formData.append('foto', file);
        const res = await requestMultipart('POST', `/api/docente/${docenteId}/foto/`, formData);
        return {
            success: true,
            message: res.message || 'Foto actualizada correctamente',
            data: res.data,
            status: res.status,
        };
    },

    async updateEgresadoFoto(egresadoId, file) {
        console.log(`📸 Actualizando foto de egresado ID: ${egresadoId}`);
        const formData = new FormData();
        formData.append('foto', file);
        const res = await requestMultipart('POST', `/api/egresado/${egresadoId}/foto/`, formData);
        return {
            success: true,
            message: res.message || 'Foto actualizada correctamente',
            data: res.data,
            status: res.status,
        };
    },

    // Eliminar fotos
    async deleteEstudianteFoto(estudianteId) {
        console.log(`🗑️ Eliminando foto de estudiante ID: ${estudianteId}`);
        const res = await requestJSON('POST', `/api/estudiante/${estudianteId}/foto/eliminar/`);
        return {
            success: true,
            message: res.message || 'Foto eliminada correctamente',
            data: res.data,
            status: res.status,
        };
    },

    async deleteDocenteFoto(docenteId) {
        console.log(`🗑️ Eliminando foto de docente ID: ${docenteId}`);
        const res = await requestJSON('POST', `/api/docente/${docenteId}/foto/eliminar/`);
        return {
            success: true,
            message: res.message || 'Foto eliminada correctamente',
            data: res.data,
            status: res.status,
        };
    },

    async deleteEgresadoFoto(egresadoId) {
        console.log(`🗑️ Eliminando foto de egresado ID: ${egresadoId}`);
        const res = await requestJSON('POST', `/api/egresado/${egresadoId}/foto/eliminar/`);
        return {
            success: true,
            message: res.message || 'Foto eliminada correctamente',
            data: res.data,
            status: res.status,
        };
    },
};