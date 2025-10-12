import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const DocenteForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo_institucional: '',
        carrera_egreso: '',
        carreras_imparte: '',
        grado_academico: '',
        habilidades: '',
        logros: ''
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
    if (!formData.nombre_completo || !formData.correo_institucional || !formData.carrera_egreso) {
        setMessage('❌ Por favor completa todos los campos obligatorios');
        setMessageType('error');
        setIsLoading(false);
        return;
    }

    try {
        console.log('🔄 Enviando datos de docente...', formData);
        
        const result = await apiService.createDocente(formData);
        
        setMessage('✅ ¡Docente registrado exitosamente!');
        setMessageType('success');
        
        // ✅ REDIRIGIR AL PERFIL después de 2 segundos
        setTimeout(() => {
            navigate(`/perfil/docente/${result.data.id}`);
        }, 2000);

    } catch (error) {
        console.error('❌ Error completo:', error);
        setMessage(`❌ Error al registrar docente: ${error.message}`);
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
                    <h2>👨‍🏫 Registro de Docente</h2>
                    <p className="form-description">
                        Completa tus datos para compartir tu experiencia y conectar con estudiantes
                    </p>
                </div>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="docente-form">
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
                            placeholder="Ej: Dra. María González López"
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
                                placeholder="Ej: maria.gonzalez@institucion.edu"
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
                                placeholder="Ej: Ingeniería en Sistemas Computacionales"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="carreras_imparte">
                                Carreras que Imparte
                            </label>
                            <input
                                type="text"
                                id="carreras_imparte"
                                name="carreras_imparte"
                                value={formData.carreras_imparte}
                                onChange={handleChange}
                                placeholder="Ej: Ingeniería Software, Sistemas Computacionales"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="grado_academico">
                                Grado Académico
                            </label>
                            <select
                                id="grado_academico"
                                name="grado_academico"
                                value={formData.grado_academico}
                                onChange={handleChange}
                                disabled={isLoading}
                            >
                                <option value="">Selecciona un grado</option>
                                <option value="Licenciatura">Licenciatura</option>
                                <option value="Maestría">Maestría</option>
                                <option value="Doctorado">Doctorado</option>
                                <option value="Especialización">Especialización</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="habilidades">
                            Habilidades y Especialidades
                        </label>
                        <textarea
                            id="habilidades"
                            name="habilidades"
                            value={formData.habilidades}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ej: Inteligencia Artificial, Base de Datos, Metodologías Ágiles, Investigación..."
                            disabled={isLoading}
                        />
                        <small className="help-text">
                            Áreas en las que tienes experiencia y especialización
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="logros">
                            Logros Académicos y Profesionales
                        </label>
                        <textarea
                            id="logros"
                            name="logros"
                            value={formData.logros}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ej: Publicaciones, Proyectos de investigación, Reconocimientos, Certificaciones..."
                            disabled={isLoading}
                        />
                        <small className="help-text">
                            Logros destacados en tu carrera académica y profesional
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
                                '🎓 Registrar Docente'
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

export default DocenteForm;