import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const EgresadoForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo_institucional: '',
        carrera_egreso: '',
        anio_egreso: '',
        ocupacion_actual: '',
        perfil_linkedin: '',
        empresa: '',
        puesto: '',
        logros: '',
        habilidades: '',
        competencias: ''
    });

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setMessageType('');

        // Validación básica
        if (!formData.nombre_completo || !formData.correo_institucional || !formData.carrera_egreso || !formData.anio_egreso) {
            setMessage('❌ Por favor completa todos los campos obligatorios');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        // Validar año de egreso
        const anioActual = new Date().getFullYear();
        const anioEgreso = parseInt(formData.anio_egreso);
        if (anioEgreso < 1900 || anioEgreso > anioActual) {
            setMessage(`❌ El año de egreso debe estar entre 1900 y ${anioActual}`);
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔄 Enviando datos de egresado...', formData);
            
            const result = await apiService.createEgresado(formData);
            
            setMessage('✅ ¡Egresado registrado exitosamente!');
            setMessageType('success');
            
            // Limpiar formulario después de 2 segundos
            setTimeout(() => {
                setFormData({
                    nombre_completo: '',
                    correo_institucional: '',
                    carrera_egreso: '',
                    anio_egreso: '',
                    ocupacion_actual: '',
                    perfil_linkedin: '',
                    empresa: '',
                    puesto: '',
                    logros: '',
                    habilidades: '',
                    competencias: ''
                });
                
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error('❌ Error completo:', error);
            setMessage(`❌ Error al registrar egresado: ${error.message}`);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="form-container">
            <div className="form-card">
                <div className="form-header">
                    <h2>💼 Registro de Egresado</h2>
                    <p className="form-description">
                        Completa tus datos para compartir tu experiencia profesional y conectar con la comunidad
                    </p>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="egresado-form">
                    <div className="form-group">
                        <label htmlFor="nombre_completo" className="required">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            id="nombre_completo"
                            name="nombre_completo"
                            value={formData.nombre_completo}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Carlos Rodríguez Martínez"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="correo_institucional" className="required">
                                Correo Institucional
                            </label>
                            <input
                                type="email"
                                id="correo_institucional"
                                name="correo_institucional"
                                value={formData.correo_institucional}
                                onChange={handleChange}
                                required
                                placeholder="Ej: carlos.rodriguez@institucion.edu"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="carrera_egreso" className="required">
                                Carrera de Egreso
                            </label>
                            <input
                                type="text"
                                id="carrera_egreso"
                                name="carrera_egreso"
                                value={formData.carrera_egreso}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Ingeniería en Tecnologías de la Información"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="anio_egreso" className="required">
                                Año de Egreso
                            </label>
                            <input
                                type="number"
                                id="anio_egreso"
                                name="anio_egreso"
                                value={formData.anio_egreso}
                                onChange={handleChange}
                                required
                                min="1900"
                                max={new Date().getFullYear()}
                                placeholder="Ej: 2020"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="ocupacion_actual">
                                Ocupación Actual
                            </label>
                            <input
                                type="text"
                                id="ocupacion_actual"
                                name="ocupacion_actual"
                                value={formData.ocupacion_actual}
                                onChange={handleChange}
                                placeholder="Ej: Desarrollador Full Stack"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="empresa">
                                Empresa
                            </label>
                            <input
                                type="text"
                                id="empresa"
                                name="empresa"
                                value={formData.empresa}
                                onChange={handleChange}
                                placeholder="Ej: Google, Microsoft, Startup XYZ"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="puesto">
                                Puesto
                            </label>
                            <input
                                type="text"
                                id="puesto"
                                name="puesto"
                                value={formData.puesto}
                                onChange={handleChange}
                                placeholder="Ej: Senior Software Engineer"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="perfil_linkedin">
                            Perfil de LinkedIn
                        </label>
                        <input
                            type="url"
                            id="perfil_linkedin"
                            name="perfil_linkedin"
                            value={formData.perfil_linkedin}
                            onChange={handleChange}
                            placeholder="Ej: https://linkedin.com/in/tu-perfil"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="habilidades">
                            Habilidades Técnicas
                        </label>
                        <textarea
                            id="habilidades"
                            name="habilidades"
                            value={formData.habilidades}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Ej: JavaScript, Python, React, Node.js, AWS, Docker..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="competencias">
                            Competencias Profesionales
                        </label>
                        <textarea
                            id="competencias"
                            name="competencias"
                            value={formData.competencias}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Ej: Liderazgo de equipos, Gestión de proyectos, Comunicación efectiva, Resolución de problemas..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="logros">
                            Logros Profesionales
                        </label>
                        <textarea
                            id="logros"
                            name="logros"
                            value={formData.logros}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ej: Proyectos destacados, Promociones, Certificaciones, Reconocimientos..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className={`submit-btn ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Registrando...
                                </>
                            ) : (
                                '💼 Registrar Egresado'
                            )}
                        </button>
                        
                        <button 
                            type="button" 
                            className="back-btn"
                            onClick={handleBack}
                            disabled={isLoading}
                        >
                            ← Volver al Inicio
                        </button>
                    </div>
                </form>

                <div className="form-footer">
                    <p className="required-note">
                        * Campos obligatorios
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EgresadoForm;