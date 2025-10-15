// src/services/api.js

// Puedes sobreescribir por .env => REACT_APP_API_URL=http://localhost:8000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
      // El servidor dijo JSON pero el cuerpo es inválido
      throw new Error('El servidor indicó JSON pero envió contenido inválido.');
    }
  }

  // No es JSON → devolvemos texto (p.ej. HTML de error)
  return { data: null, raw: text, contentType: ct };
}

// Único punto de entrada para todas las requests
async function requestJSON(method, path, body) {
  // Aseguramos barra final en endpoints tipo recurso (conviene para DRF)
  // Solo la aplicamos cuando path parece un "endpoint base" (termina en letra)
  const mustSlash = /[a-zA-Z)]$/.test(path);
  const normalizedPath = mustSlash ? ensureTrailingSlash(path) : path;
  const url = joinURL(API_BASE_URL, normalizedPath);

  const init = {
    method: method.toUpperCase(),
    headers: {
      'Accept': 'application/json',
      // 'Content-Type' solo cuando enviamos body JSON
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
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
    // Errores de red, caída del servidor, CORS, etc.
    if (err.name === 'TypeError' && String(err.message).includes('fetch')) {
      throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en ' + API_BASE_URL);
    }
    throw err;
  }

  // Si no es ok, lanzamos error con mensaje del backend (si hay) o preview de HTML
  if (!response.ok) {
    const msg =
      parsed?.data?.message ||
      parsed?.data?.detail ||
      `Error en la solicitud`;
    throw httpError(msg, { status: response.status, url, raw: parsed?.raw });
  }

  // Normalizamos salida: si backend envía { data: ... } usamos eso; sino enviamos el payload directo
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
  /* ---------- CREATE ---------- */
  async createEstudiante(estudianteData) {
    console.log('🚀 INICIANDO REGISTRO DE ESTUDIANTE...');
    console.log('📦 Datos a enviar:', estudianteData);

    if (!estudianteData?.nombre_completo || !estudianteData?.correo_institucional) {
      throw new Error('Nombre y correo son obligatorios');
    }
    // Si usas contraseña, valida aquí también (front)
    // if (!estudianteData.password || !estudianteData.password2) { ... }

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

  /* ---------- LIST ---------- */
  async getEstudiantes() {
    console.log('🔍 Obteniendo lista de estudiantes...');
    const res = await requestJSON('GET', '/api/estudiantes/');
    // Normalizamos: si backend no envía {data: [...]}, devolvemos payload tal cual
    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
    console.log('📡 Lista de estudiantes:', data);
    return { success: true, data, status: res.status };
  },

  async getDocentes() {
    console.log('🔍 Obteniendo lista de docentes...');
    const res = await requestJSON('GET', '/api/docentes/');
    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
    console.log('📡 Lista de docentes:', data);
    return { success: true, data, status: res.status };
  },

  async getEgresados() {
    console.log('🔍 Obteniendo lista de egresados...');
    const res = await requestJSON('GET', '/api/egresados/');
    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data);
    console.log('📡 Lista de egresados:', data);
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

  /* ---------- DELETE ---------- */
  async deleteEstudiante(estudianteId) {
    console.log(`🗑️ Eliminando estudiante ID: ${estudianteId}`);
    const res = await requestJSON('DELETE', `/api/estudiante/${estudianteId}/`);
    return { success: true, message: res.message || 'Estudiante eliminado exitosamente', status: res.status };
  },

  async deleteDocente(docenteId) {
    console.log(`🗑️ Eliminando docente ID: ${docenteId}`);
    const res = await requestJSON('DELETE', `/api/docente/${docenteId}/`);
    return { success: true, message: res.message || 'Docente eliminado exitosamente', status: res.status };
  },

  async deleteEgresado(egresadoId) {
    console.log(`🗑️ Eliminando egresado ID: ${egresadoId}`);
    const res = await requestJSON('DELETE', `/api/egresado/${egresadoId}/`);
    return { success: true, message: res.message || 'Egresado eliminado exitosamente', status: res.status };
  },

  /* ---------- UPDATE ---------- */
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

  /* ---------- SEARCH ---------- */
  async buscarEstudiantes(query) {
    console.log(`🔍 Buscando estudiantes: ${query}`);
    const res = await requestJSON('GET', `/api/estudiantes/buscar/?q=${encodeURIComponent(query)}`);
    // Si backend devuelve {results:[...]} o {data:[...]} o [...]
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

  /* ---------- Buscar por correo ---------- */
  async buscarPerfilPorCorreo(correo) {
    console.log(`🔍 Buscando perfil por correo: ${correo}`);

    // Buscamos en las tres listas (si alguna falla, seguimos con las demás)
    try {
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

  /* ---------- Health ---------- */
  // Usa un endpoint JSON en el backend: /api/health/
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

  /* ---------- Verificar correo existente ---------- */
  async verificarCorreoExistente(correo) {
    try {
      console.log(`🔍 Verificando si el correo existe: ${correo}`);
      const resultado = await this.buscarPerfilPorCorreo(correo);
      return {
        success: true,
        existe: !!resultado.success,
        tipo: resultado.tipo,
        data: resultado.data,
      };
    } catch (error) {
      console.error('Error verificando correo:', error.preview || error.message);
      return {
        success: false,
        existe: false,
        message: error.message,
      };
    }
  },
};
