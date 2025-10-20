import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './Perfil.css';

const Perfil = () => {
    const { tipo, id } = useParams();
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                let result;
                if (tipo === 'estudiante') {
                    result = await apiService.getPerfilEstudiante(id);
                } else if (tipo === 'docente') {
                    result = await apiService.getPerfilDocente(id);
                } else if (tipo === 'egresado') {
                    result = await apiService.getPerfilEgresado(id);
                } else {
                    throw new Error('Tipo de perfil no válido');
                }

                if (result.success) {
                    setPerfil(result.data);
                } else {
                    setError('No se pudo cargar el perfil');
                }
            } catch (err) {
                setError('Error al cargar el perfil: ' + err.message);
                console.error('Error detallado:', err);
            } finally {
                setLoading(false);
            }
        };

        if (tipo && id) {
            cargarPerfil();
        }
    }, [tipo, id]);

    const handleVolver = () => {
        navigate(-1);
    };

    const handleVolverInicio = () => {
        navigate('/');
    };

    const handleEditar = () => {
        navigate(`/editar/${tipo}/${id}`);
    };

    const handleEliminar = async () => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar este perfil de ${tipo}?`)) {
            try {
                let result;
                if (tipo === 'estudiante') {
                    result = await apiService.deleteEstudiante(id);
                } else if (tipo === 'docente') {
                    result = await apiService.deleteDocente(id);
                } else if (tipo === 'egresado') {
                    result = await apiService.deleteEgresado(id);
                }

                if (result.success) {
                    alert('Perfil eliminado exitosamente');
                    navigate('/');
                } else {
                    alert('Error al eliminar el perfil');
                }
            } catch (err) {
                alert('Error al eliminar el perfil: ' + err.message);
            }
        }
    };

    const handleContactar = () => {
        const subject = `Interés en colaborar - ${perfil.nombre_completo}`;
        const body = `Hola ${perfil.nombre_completo},\n\nMe interesa colaborar contigo...`;
        window.location.href = `mailto:${perfil.correo_institucional}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (loading) {
        return (
            <div className="home-container">
                <div className="background-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
                <div className="loading-container-custom">
                    <div className="loading-spinner-large"></div>
                    <p>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-container">
                <div className="background-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
                <div className="form-section">
                    <div className="form-container-custom">
                        <div className="form-card-custom">
                            <div className="error-message-custom">
                                {error}
                            </div>
                            <div className="form-actions-custom">
                                <button onClick={handleVolver} className="back-btn-custom">
                                    ← Volver
                                </button>
                                <button onClick={handleVolverInicio} className="submit-btn-custom">
                                    🏠 Inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="home-container">
                <div className="background-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
                <div className="form-section">
                    <div className="form-container-custom">
                        <div className="form-card-custom">
                            <div className="error-message-custom">
                                Perfil no encontrado
                            </div>
                            <div className="form-actions-custom">
                                <button onClick={handleVolverInicio} className="submit-btn-custom">
                                    🏠 Volver al Inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Fondo idéntico al homepage */}
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div>

            {/* Header idéntico al homepage */}
            <header className="premium-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo-icon">🚀</div>
                        <h1>StudySphere</h1>
                    </div>
                    <nav className="nav-actions">
                        <button 
                            className="nav-btn profile-nav-btn"
                            onClick={handleVolverInicio}
                        >
                            <span className="btn-icon">🏠</span>
                            <span>Volver al Inicio</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Contenido del perfil */}
            <div className="form-section">
                <div className="form-container-custom">
                    <div className="form-card-custom">
                        <div className="form-header-custom">
                            <div className="header-with-emoji">
                                <span className="form-emoji">
                                    {tipo === 'estudiante' && '🎓'}
                                    {tipo === 'docente' && '📚'}
                                    {tipo === 'egresado' && '💡'}
                                </span>
                                <h2>Perfil de {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h2>
                            </div>
                            <p className="form-description-custom">
                                Información completa del perfil registrado en StudySphere
                            </p>
                        </div>

                        <div className="perfil-info-custom">
                            <div className="info-section-custom">
                                <h3 className="section-title-custom">📋 Información Personal</h3>
                                <div className="info-grid-custom">
                                    <div className="info-item-custom">
                                        <label>Nombre Completo</label>
                                        <p>{perfil.nombre_completo}</p>
                                    </div>
                                    <div className="info-item-custom">
                                        <label>Correo Institucional</label>
                                        <p>{perfil.correo_institucional}</p>
                                    </div>
                                    
                                    {tipo === 'estudiante' && (
                                        <>
                                            <div className="info-item-custom">
                                                <label>Número de Control</label>
                                                <p>{perfil.numero_control}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Carrera Actual</label>
                                                <p>{perfil.carrera_actual}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Semestre</label>
                                                <p>{perfil.semestre || 'No especificado'}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Otra Carrera</label>
                                                <p>{perfil.otra_carrera || 'No'}</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {tipo === 'docente' && (
                                        <>
                                            <div className="info-item-custom">
                                                <label>Carrera de Egreso</label>
                                                <p>{perfil.carrera_egreso}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Carreras que Imparte</label>
                                                <p>{perfil.carreras_imparte || 'No especificado'}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Grado Académico</label>
                                                <p>{perfil.grado_academico || 'No especificado'}</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {tipo === 'egresado' && (
                                        <>
                                            <div className="info-item-custom">
                                                <label>Carrera de Egreso</label>
                                                <p>{perfil.carrera_egreso}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Año de Egreso</label>
                                                <p>{perfil.anio_egreso}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Ocupación Actual</label>
                                                <p>{perfil.ocupacion_actual || 'No especificado'}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Empresa</label>
                                                <p>{perfil.empresa || 'No especificado'}</p>
                                            </div>
                                            <div className="info-item-custom">
                                                <label>Puesto</label>
                                                <p>{perfil.puesto || 'No especificado'}</p>
                                            </div>
                                            {perfil.perfil_linkedin && (
                                                <div className="info-item-custom">
                                                    <label>LinkedIn</label>
                                                    <p>
                                                        <a 
                                                            href={perfil.perfil_linkedin} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="linkedin-link-custom"
                                                        >
                                                            {perfil.perfil_linkedin}
                                                        </a>
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {(perfil.habilidades || perfil.area_interes || perfil.competencias) && (
                                <div className="info-section-custom">
                                    <h3 className="section-title-custom">🚀 Habilidades e Intereses</h3>
                                    <div className="info-grid-custom">
                                        {perfil.habilidades && (
                                            <div className="info-item-custom">
                                                <label>Habilidades</label>
                                                <p>{perfil.habilidades}</p>
                                            </div>
                                        )}
                                        {perfil.area_interes && (
                                            <div className="info-item-custom">
                                                <label>Áreas de Interés</label>
                                                <p>{perfil.area_interes}</p>
                                            </div>
                                        )}
                                        {perfil.competencias && (
                                            <div className="info-item-custom">
                                                <label>Competencias</label>
                                                <p>{perfil.competencias}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {perfil.logros && (
                                <div className="info-section-custom">
                                    <h3 className="section-title-custom">🏆 Logros</h3>
                                    <div className="info-item-custom full-width">
                                        <p>{perfil.logros}</p>
                                    </div>
                                </div>
                            )}

                            <div className="info-section-custom">
                                <h3 className="section-title-custom">📅 Información de Registro</h3>
                                <div className="info-item-custom">
                                    <label>Fecha de Registro</label>
                                    <p>
                                        {new Date(perfil.fecha_registro).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Acciones CRUD */}
                        <div className="crud-actions-custom">
                            <button onClick={handleContactar} className="crud-btn-custom contactar-btn-custom">
                                ✉️ Contactar
                            </button>
                            <button onClick={handleEditar} className="crud-btn-custom editar-btn-custom">
                                ✏️ Editar Perfil
                            </button>
                            <button onClick={handleEliminar} className="crud-btn-custom eliminar-btn-custom">
                                🗑️ Eliminar Perfil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;