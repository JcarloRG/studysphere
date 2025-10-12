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
        navigate(-1); // Volver a la página anterior
    };

    const handleVolverInicio = () => {
        navigate('/');
    };

    // --- NUEVAS FUNCIONES CRUD AGREGADAS ---
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
    // --- FIN DE NUEVAS FUNCIONES ---

    if (loading) {
        return (
            <div className="perfil-container">
                <div className="loading">Cargando perfil...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="perfil-container">
                <div className="error-message">{error}</div>
                <div className="botones-perfil">
                    <button onClick={handleVolver} className="back-btn">
                        ← Volver
                    </button>
                    <button onClick={handleVolverInicio} className="home-btn">
                        🏠 Inicio
                    </button>
                </div>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="perfil-container">
                <div className="error-message">Perfil no encontrado</div>
                <button onClick={handleVolverInicio} className="home-btn">
                    🏠 Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="perfil-container">
            <div className="perfil-card">
                <div className="perfil-header">
                    <h2>
                        {tipo === 'estudiante' && '👨‍🎓 '}
                        {tipo === 'docente' && '👨‍🏫 '}
                        {tipo === 'egresado' && '💼 '}
                        Perfil de {tipo}
                    </h2>
                    <div className="botones-perfil">
                        <button onClick={handleVolver} className="back-btn">
                            ← Volver
                        </button>
                        <button onClick={handleVolverInicio} className="home-btn">
                            🏠 Inicio
                        </button>
                    </div>
                </div>

                <div className="perfil-info">
                    <div className="info-group">
                        <h3>Información Personal</h3>
                        <p><strong>Nombre:</strong> {perfil.nombre_completo}</p>
                        <p><strong>Correo Institucional:</strong> {perfil.correo_institucional}</p>
                        
                        {tipo === 'estudiante' && (
                            <>
                                <p><strong>Número de Control:</strong> {perfil.numero_control}</p>
                                <p><strong>Carrera Actual:</strong> {perfil.carrera_actual}</p>
                                <p><strong>Semestre:</strong> {perfil.semestre}</p>
                                <p><strong>Otra Carrera:</strong> {perfil.otra_carrera}</p>
                            </>
                        )}
                        
                        {tipo === 'docente' && (
                            <>
                                <p><strong>Carrera de Egreso:</strong> {perfil.carrera_egreso}</p>
                                <p><strong>Carreras que Imparte:</strong> {perfil.carreras_imparte || 'No especificado'}</p>
                                <p><strong>Grado Académico:</strong> {perfil.grado_academico || 'No especificado'}</p>
                            </>
                        )}
                        
                        {tipo === 'egresado' && (
                            <>
                                <p><strong>Carrera de Egreso:</strong> {perfil.carrera_egreso}</p>
                                <p><strong>Año de Egreso:</strong> {perfil.anio_egreso}</p>
                                <p><strong>Ocupación Actual:</strong> {perfil.ocupacion_actual || 'No especificado'}</p>
                                <p><strong>Empresa:</strong> {perfil.empresa || 'No especificado'}</p>
                                <p><strong>Puesto:</strong> {perfil.puesto || 'No especificado'}</p>
                                {perfil.perfil_linkedin && (
                                    <p>
                                        <strong>LinkedIn:</strong>{' '}
                                        <a 
                                            href={perfil.perfil_linkedin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="linkedin-link"
                                        >
                                            {perfil.perfil_linkedin}
                                        </a>
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {(perfil.habilidades || perfil.area_interes || perfil.competencias) && (
                        <div className="info-group">
                            <h3>Habilidades e Intereses</h3>
                            {perfil.habilidades && (
                                <p><strong>Habilidades:</strong> {perfil.habilidades}</p>
                            )}
                            {perfil.area_interes && (
                                <p><strong>Áreas de Interés:</strong> {perfil.area_interes}</p>
                            )}
                            {perfil.competencias && (
                                <p><strong>Competencias:</strong> {perfil.competencias}</p>
                            )}
                        </div>
                    )}

                    {perfil.logros && (
                        <div className="info-group">
                            <h3>Logros</h3>
                            <p>{perfil.logros}</p>
                        </div>
                    )}

                    <div className="info-group">
                        <p><strong>Fecha de Registro:</strong> {new Date(perfil.fecha_registro).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                </div>

                {/* --- NUEVA SECCIÓN DE BOTONES CRUD AGREGADA --- */}
                <div className="crud-actions">
                    <button onClick={handleContactar} className="crud-btn contactar-btn">
                        ✉️ Contactar
                    </button>
                    <button onClick={handleEditar} className="crud-btn editar-btn">
                        ✏️ Editar
                    </button>
                    <button onClick={handleEliminar} className="crud-btn eliminar-btn">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Perfil;