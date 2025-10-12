const API_BASE_URL = 'http://localhost:8000';

export const apiService = {
    // ========== ESTUDIANTES ==========
    async createEstudiante(estudianteData) {
        console.log('🚀 INICIANDO REGISTRO DE ESTUDIANTE...');
        console.log('📦 Datos a enviar:', estudianteData);
        
        try {
            // Validación básica
            if (!estudianteData.nombre_completo || !estudianteData.correo_institucional) {
                throw new Error('Nombre y correo son obligatorios');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/estudiante/registrar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(estudianteData),
            });
            
            console.log('📡 Respuesta del servidor - Status:', response.status);
            
            const result = await response.json();
            console.log('📡 Respuesta del servidor - Data:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || '¡Registro exitoso!',
                    data: result
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
            
        } catch (error) {
            console.error('💥 ERROR EN REGISTRO:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en http://localhost:8000');
            }
            
            throw error;
        }
    },
    
    // ========== DOCENTES ==========
    async createDocente(docenteData) {
        console.log('🚀 INICIANDO REGISTRO DE DOCENTE...');
        console.log('📦 Datos a enviar:', docenteData);
        
        try {
            // Validación básica
            if (!docenteData.nombre_completo || !docenteData.correo_institucional || !docenteData.carrera_egreso) {
                throw new Error('Nombre, correo y carrera de egreso son obligatorios');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/docente/registrar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(docenteData),
            });
            
            console.log('📡 Respuesta del servidor - Status:', response.status);
            
            const result = await response.json();
            console.log('📡 Respuesta del servidor - Data:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || '¡Docente registrado exitosamente!',
                    data: result
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
            
        } catch (error) {
            console.error('💥 ERROR EN REGISTRO DOCENTE:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en http://localhost:8000');
            }
            
            throw error;
        }
    },
    
    // ========== EGRESADOS ==========
    async createEgresado(egresadoData) {
        console.log('🚀 INICIANDO REGISTRO DE EGRESADO...');
        console.log('📦 Datos a enviar:', egresadoData);
        
        try {
            // Validación básica
            if (!egresadoData.nombre_completo || !egresadoData.correo_institucional || !egresadoData.carrera_egreso || !egresadoData.anio_egreso) {
                throw new Error('Nombre, correo, carrera de egreso y año de egreso son obligatorios');
            }
            
            // Validar que año_egreso sea un número
            if (isNaN(egresadoData.anio_egreso)) {
                throw new Error('El año de egreso debe ser un número válido');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/egresado/registrar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(egresadoData),
            });
            
            console.log('📡 Respuesta del servidor - Status:', response.status);
            
            const result = await response.json();
            console.log('📡 Respuesta del servidor - Data:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || '¡Egresado registrado exitosamente!',
                    data: result
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
            
        } catch (error) {
            console.error('💥 ERROR EN REGISTRO EGRESADO:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en http://localhost:8000');
            }
            
            throw error;
        }
    },

    // ========== FUNCIONES PARA OBTENER LISTAS ==========
    async getEstudiantes() {
        try {
            console.log('🔍 Obteniendo lista de estudiantes...');
            const response = await fetch(`${API_BASE_URL}/api/estudiantes/`);
            const result = await response.json();
            console.log('📡 Lista de estudiantes:', result);
            return result;
        } catch (error) {
            console.error('Error obteniendo estudiantes:', error);
            throw error;
        }
    },

    async getDocentes() {
        try {
            console.log('🔍 Obteniendo lista de docentes...');
            const response = await fetch(`${API_BASE_URL}/api/docentes/`);
            const result = await response.json();
            console.log('📡 Lista de docentes:', result);
            return result;
        } catch (error) {
            console.error('Error obteniendo docentes:', error);
            throw error;
        }
    },

    async getEgresados() {
        try {
            console.log('🔍 Obteniendo lista de egresados...');
            const response = await fetch(`${API_BASE_URL}/api/egresados/`);
            const result = await response.json();
            console.log('📡 Lista de egresados:', result);
            return result;
        } catch (error) {
            console.error('Error obteniendo egresados:', error);
            throw error;
        }
    },

    // ========== FUNCIONES PARA PERFILES INDIVIDUALES ==========
    async getPerfilEstudiante(estudianteId) {
        try {
            console.log(`🔍 Obteniendo perfil del estudiante ID: ${estudianteId}`);
            const response = await fetch(`${API_BASE_URL}/api/estudiante/${estudianteId}/`);
            const result = await response.json();
            
            console.log('📡 Respuesta perfil estudiante:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    data: result.data,
                    tipo: result.tipo
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error obteniendo perfil estudiante:', error);
            throw error;
        }
    },

    async getPerfilDocente(docenteId) {
        try {
            console.log(`🔍 Obteniendo perfil del docente ID: ${docenteId}`);
            const response = await fetch(`${API_BASE_URL}/api/docente/${docenteId}/`);
            const result = await response.json();
            
            console.log('📡 Respuesta perfil docente:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    data: result.data,
                    tipo: result.tipo
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error obteniendo perfil docente:', error);
            throw error;
        }
    },

    async getPerfilEgresado(egresadoId) {
        try {
            console.log(`🔍 Obteniendo perfil del egresado ID: ${egresadoId}`);
            const response = await fetch(`${API_BASE_URL}/api/egresado/${egresadoId}/`);
            const result = await response.json();
            
            console.log('📡 Respuesta perfil egresado:', result);
            
            if (response.ok) {
                return {
                    success: true,
                    data: result.data,
                    tipo: result.tipo
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error obteniendo perfil egresado:', error);
            throw error;
        }
    },

    // ========== FUNCIÓN GENÉRICA PARA CUALQUIER PERFIL ==========
    async getPerfil(tipo, id) {
        try {
            console.log(`🔍 Obteniendo perfil: ${tipo} ID: ${id}`);
            
            let result;
            if (tipo === 'estudiante') {
                result = await this.getPerfilEstudiante(id);
            } else if (tipo === 'docente') {
                result = await this.getPerfilDocente(id);
            } else if (tipo === 'egresado') {
                result = await this.getPerfilEgresado(id);
            } else {
                throw new Error('Tipo de perfil no válido');
            }
            
            return result;
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            throw error;
        }
    },

    // ========== FUNCIONES DE ELIMINACIÓN ==========
    async deleteEstudiante(estudianteId) {
        try {
            console.log(`🗑️ Eliminando estudiante ID: ${estudianteId}`);
            const response = await fetch(`${API_BASE_URL}/api/estudiante/${estudianteId}/`, {
                method: 'DELETE',
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || 'Estudiante eliminado exitosamente'
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error eliminando estudiante:', error);
            throw error;
        }
    },

    async deleteDocente(docenteId) {
        try {
            console.log(`🗑️ Eliminando docente ID: ${docenteId}`);
            const response = await fetch(`${API_BASE_URL}/api/docente/${docenteId}/`, {
                method: 'DELETE',
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || 'Docente eliminado exitosamente'
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error eliminando docente:', error);
            throw error;
        }
    },

    async deleteEgresado(egresadoId) {
        try {
            console.log(`🗑️ Eliminando egresado ID: ${egresadoId}`);
            const response = await fetch(`${API_BASE_URL}/api/egresado/${egresadoId}/`, {
                method: 'DELETE',
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || 'Egresado eliminado exitosamente'
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error eliminando egresado:', error);
            throw error;
        }
    },

    // ========== FUNCIONES DE ACTUALIZACIÓN ==========
    async updateEstudiante(estudianteId, estudianteData) {
        try {
            console.log(`✏️ Actualizando estudiante ID: ${estudianteId}`, estudianteData);
            const response = await fetch(`${API_BASE_URL}/api/estudiante/${estudianteId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(estudianteData),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || 'Estudiante actualizado exitosamente',
                    data: result.data
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error actualizando estudiante:', error);
            throw error;
        }
    },

    async updateDocente(docenteId, docenteData) {
        try {
            console.log(`✏️ Actualizando docente ID: ${docenteId}`, docenteData);
            const response = await fetch(`${API_BASE_URL}/api/docente/${docenteId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(docenteData),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || 'Docente actualizado exitosamente',
                    data: result.data
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error actualizando docente:', error);
            throw error;
        }
    },

    async updateEgresado(egresadoId, egresadoData) {
        try {
            console.log(`✏️ Actualizando egresado ID: ${egresadoId}`, egresadoData);
            const response = await fetch(`${API_BASE_URL}/api/egresado/${egresadoId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(egresadoData),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    message: result.message || 'Egresado actualizado exitosamente',
                    data: result.data
                };
            } else {
                throw new Error(result.message || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error actualizando egresado:', error);
            throw error;
        }
    },

    // ========== FUNCIONES DE BÚSQUEDA ==========
    async buscarEstudiantes(query) {
        try {
            console.log(`🔍 Buscando estudiantes: ${query}`);
            const response = await fetch(`${API_BASE_URL}/api/estudiantes/buscar/?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error buscando estudiantes:', error);
            throw error;
        }
    },

    async buscarDocentes(query) {
        try {
            console.log(`🔍 Buscando docentes: ${query}`);
            const response = await fetch(`${API_BASE_URL}/api/docentes/buscar/?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error buscando docentes:', error);
            throw error;
        }
    },

    async buscarEgresados(query) {
        try {
            console.log(`🔍 Buscando egresados: ${query}`);
            const response = await fetch(`${API_BASE_URL}/api/egresados/buscar/?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error buscando egresados:', error);
            throw error;
        }
    },

    // ========== FUNCIÓN DE ESTADO DEL SERVIDOR ==========
    async checkServerStatus() {
        try {
            console.log('🔍 Verificando estado del servidor...');
            const response = await fetch(`${API_BASE_URL}/`);
            const result = await response.json();
            return {
                success: true,
                status: 'online',
                message: result.message || 'Servidor funcionando correctamente'
            };
        } catch (error) {
            console.error('Servidor offline:', error);
            return {
                success: false,
                status: 'offline',
                message: 'No se puede conectar al servidor'
            };
        }
    }
};


