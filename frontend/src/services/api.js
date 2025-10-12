const API_BASE_URL = 'http://localhost:8000';

export const apiService = {
    async createEstudiante(estudianteData) {
        console.log('🚀 INICIANDO REGISTRO DE ESTUDIANTE...');
        console.log('📦 Datos a enviar:', estudianteData);
        
        try {
            // Validación básica
            if (!estudianteData.nombre_completo || !estudianteData.correo_institucional) {
                throw new Error('Nombre y correo son obligatorios');
            }
            
            // Usar JSON en lugar de FormData (más simple)
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
            
            // Mensajes más claros
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('No se puede conectar al servidor. Verifica que Django esté ejecutándose en http://localhost:8000');
            }
            
            throw error;
        }
    },
    
    // Para docentes y egresados (implementar después)
    async createDocente(docenteData) {
        console.log('📝 Registro docente pendiente');
        return { success: true, message: 'Funcionalidad en desarrollo' };
    },
    
    async createEgresado(egresadoData) {
        console.log('📝 Registro egresado pendiente');
        return { success: true, message: 'Funcionalidad en desarrollo' };
    }
};