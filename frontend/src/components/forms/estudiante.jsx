import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const EstudianteForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo_institucional: '',
        numero_control: '',
        carrera_actual: '',
        otra_carrera: 'No',
        semestre: '',
        habilidades: '',
        area_interes: ''
    });

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageType, setMessageType] = useState('');

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
        console.log('🔄 Enviando datos de estudiante...', formData);
        
        const result = await apiService.createEstudiante(formData);
        
        setMessage('✅ ¡Estudiante registrado exitosamente!');
        setMessageType('success');
        
        // ✅ REDIRIGIR AL PERFIL después de 2 segundos
        setTimeout(() => {
            navigate(`/perfil/estudiante/${result.data.id}`);
        }, 2000);

    } catch (error) {
        console.error('❌ Error completo:', error);
        setMessage(`❌ Error al registrar estudiante: ${error.message}`);
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
                    <h2>👨‍🎓 Registro de Estudiante</h2>
                    <p className="form-description">
                        Completa tus datos para conectar con proyectos innovadores y colaborar con otros estudiantes
                    </p>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="estudiante-form">
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
                            placeholder="Ej: Juan Pérez García"
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
                                placeholder="Ej: juan.perez@institucion.edu"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="numero_control" className="required">
                                Número de Control
                            </label>
                            <input
                                type="text"
                                id="numero_control"
                                name="numero_control"
                                value={formData.numero_control}
                                onChange={handleChange}
                                required
                                placeholder="Ej: 19210840"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="carrera_actual" className="required">
                                Carrera Actual
                            </label>
                            <input
                                type="text"
                                id="carrera_actual"
                                name="carrera_actual"
                                value={formData.carrera_actual}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Ingeniería en Software"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="semestre">
                                Semestre
                            </label>
                            <input
                                type="text"
                                id="semestre"
                                name="semestre"
                                value={formData.semestre}
                                onChange={handleChange}
                                placeholder="Ej: 7mo Semestre"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="otra_carrera">
                            ¿Cursas otra carrera?
                        </label>
                        <select
                            id="otra_carrera"
                            name="otra_carrera"
                            value={formData.otra_carrera}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            <option value="No">No</option>
                            <option value="Sí">Sí</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="habilidades">
                            Habilidades Principales
                        </label>
                        <textarea
                            id="habilidades"
                            name="habilidades"
                            value={formData.habilidades}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ej: Programación en Python, Diseño UX, Trabajo en equipo, Liderazgo..."
                            disabled={isLoading}
                        />
                        <small className="help-text">
                            Separa tus habilidades con comas
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="area_interes">
                            Áreas de Interés
                        </label>
                        <textarea
                            id="area_interes"
                            name="area_interes"
                            value={formData.area_interes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ej: Inteligencia Artificial, Desarrollo Web, Ciberseguridad, Robótica..."
                            disabled={isLoading}
                        />
                        <small className="help-text">
                            Menciona las áreas que te interesan para proyectos
                        </small>
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
                                '📚 Registrar Estudiante'
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

export default EstudianteForm;