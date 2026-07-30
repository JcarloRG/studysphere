// src/components/perfil_vista.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import AppHeader from './AppHeader';
import './Perfil.css';

// 🌟 SIMULACIÓN DE AUTENTICACIÓN (MANTENIDA)
const useAuth = () => {
    const storedId = localStorage.getItem('currentUserId'); 
    const storedType = localStorage.getItem('currentUserType'); 
    
    const currentUserId = storedId ? Number(storedId) : null; 
    const currentUserType = storedType || null; 
    
    return { currentUserId, currentUserType };
};
// ----------------------------------------------------------------------


const Perfil = () => {
    const { tipo, id } = useParams();
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('info'); 

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [contactando, setContactando] = useState(false);
    const [contactoMensaje, setContactoMensaje] = useState('');

    const { currentUserId, currentUserType } = useAuth();
    const perfilId = Number(id);
    const isOwner = perfilId === currentUserId && tipo === currentUserType;
    

    // Helper para media URL absoluta (MANTENIDO)
    const buildMediaUrl = (rel) => {
        if (!rel) return null;
        const host = API_BASE_URL.replace(/\/api\/?$/, '');
        return rel.startsWith('http') ? rel : `${host}${rel}`;
    };

    // ❌ AVATAR URL SE MUEVE ABAJO, AL INICIO DEL RENDER PRINCIPAL ❌

    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                let result;
                if (tipo === 'estudiante') result = await apiService.getPerfilEstudiante(id);
                else if (tipo === 'docente') result = await apiService.getPerfilDocente(id);
                else if (tipo === 'egresado') result = await apiService.getPerfilEgresado(id);
                else throw new Error('Tipo de perfil no válido');

                if (result.success && result.data) setPerfil(result.data);
                else setError('No se pudo cargar el perfil o el perfil no existe.');
            } catch (err) {
                setError('Error al cargar el perfil: ' + err.message);
                console.error('Error detallado:', err);
            } finally {
                setLoading(false);
            }
        };

        if (tipo && id) cargarPerfil();
    }, [tipo, id]);

    // Navegación / acciones (MANTENIDO)
    const handleVolver = () => navigate(-1);
    const handleVolverInicio = () => navigate('/');
    const handleEditar = () => navigate(`/editar/${tipo}/${id}`);

    // 🌟 NUEVA FUNCIÓN: Cerrar Sesión 🌟
    const handleLogout = () => {
        // 1. Eliminar las credenciales de autenticación del navegador
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUserType');
        // Opcional: limpiar otros tokens de sesión si existen
        
        // 2. Redirigir al usuario a la página de inicio
        navigate('/');
    };
    // ------------------------------------

    const handleEliminar = async () => {
        if (!window.confirm(`¿Eliminar este perfil de ${tipo}? Esta acción es permanente.`)) return;
        try {
            let result;
            if (tipo === 'estudiante') result = await apiService.deleteEstudiante(id);
            else if (tipo === 'docente') result = await apiService.deleteDocente(id);
            else if (tipo === 'egresado') result = await apiService.deleteEgresado(id);

            if (result.success) {
                alert('Perfil eliminado exitosamente');
                navigate('/'); 
            } else {
                alert('Error al eliminar el perfil');
            }
        } catch (err) {
            alert('Error al eliminar el perfil: ' + err.message);
        }
    };
    
    // Envía una solicitud de colaboración real (mismo flujo que "Colaborar" en Comunidad)
    const handleContactar = async () => {
        if (!perfil || contactando) return;

        if (!currentUserId || !currentUserType) {
            setContactoMensaje('Necesitas iniciar sesión para contactar a alguien.');
            return;
        }

        setContactando(true);
        setContactoMensaje('');
        try {
            const res = await apiService.enviarSolicitudMatch(perfilId, tipo);
            if (res.success) {
                setContactoMensaje(
                    res.data?.estado === 'aceptado'
                        ? '¡Es un match! Ya pueden escribirse por mensajes.'
                        : 'Solicitud enviada. Te avisaremos si la acepta.'
                );
            } else {
                setContactoMensaje(res.message || 'No se pudo enviar la solicitud.');
            }
        } catch (err) {
            setContactoMensaje(err.message || 'Error al enviar la solicitud.');
        } finally {
            setContactando(false);
        }
    };

    // Foto: handlers (MANTENIDO)
    const onPickFile = () => {
        if (tipo !== 'estudiante' || !isOwner) return; 
        fileInputRef.current?.click();
    };

    const onFileChange = async (e) => {
        if (tipo !== 'estudiante' || !isOwner) return; 
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            alert('La imagen no debe superar 3MB.');
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const res = await apiService.updateEstudianteFoto(id, file);
            const nuevaRel = res?.data?.foto || res?.data?.data?.foto;
            if (nuevaRel) setPerfil((prev) => ({ ...prev, foto: nuevaRel }));
        } catch (err) {
            alert('Error al actualizar la foto: ' + (err.message || 'desconocido'));
            console.error('❌ updateEstudianteFoto error:', err);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    // Contenido por pestaña (MANTENIDO)
    const renderTabContent = () => {
        if (!perfil) return null; 

        if (activeTab === 'info') {
            return (
                <>
                    {/* ... (Contenido de Datos Generales que usa perfil) ... */}
                    <div className="info-section-custom">
                        <h3 className="section-title-custom">📋 Datos Generales</h3>
                        <div className="info-grid-custom">
                            <div className="info-item-custom">
                                <label>Nombre</label>
                                <p>{perfil.nombre_completo}</p>
                            </div>
                            <div className="info-item-custom">
                                <label>Correo</label>
                                <p>{perfil.correo_institucional}</p>
                            </div>

                            {tipo === 'estudiante' && (<>
                                <div className="info-item-custom"><label>Carrera Actual</label><p>{perfil.carrera_actual}</p></div>
                                <div className="info-item-custom"><label>Semestre</label><p>{perfil.semestre || 'N/E'}</p></div>
                                <div className="info-item-custom"><label>Otra Carrera</label><p>{perfil.otra_carrera || 'No'}</p></div>
                            </>)}

                            {tipo === 'docente' && (<>
                                <div className="info-item-custom"><label>Carrera Egreso</label><p>{perfil.carrera_egreso}</p></div>
                                <div className="info-item-custom"><label>Carreras Imparte</label><p>{perfil.carreras_imparte || 'N/E'}</p></div>
                                <div className="info-item-custom"><label>Grado</label><p>{perfil.grado_academico || 'N/E'}</p></div>
                            </>)}

                            {tipo === 'egresado' && (<>
                                <div className="info-item-custom"><label>Carrera Egreso</label><p>{perfil.carrera_egreso}</p></div>
                                <div className="info-item-custom"><label>Año Egreso</label><p>{perfil.anio_egreso}</p></div>
                                <div className="info-item-custom"><label>Ocupación</label><p>{perfil.ocupacion_actual || 'N/E'}</p></div>
                                <div className="info-item-custom"><label>Empresa</label><p>{perfil.empresa || 'N/E'}</p></div>
                                <div className="info-item-custom"><label>Puesto</label><p>{perfil.puesto || 'N/E'}</p></div>
                                {perfil.perfil_linkedin && (<div className="info-item-custom"><label>LinkedIn</label><p><a href={perfil.perfil_linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-link-custom">Ver Perfil</a></p></div>)}
                            </>)}
                        </div>
                    </div>

                    <div className="info-section-custom full-width">
                        <h3 className="section-title-custom">📅 Registro</h3>
                        <div className="info-item-custom half-width">
                            <label>Fecha de Registro</label>
                            <p>
                                {new Date(perfil.fecha_registro).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                </>
            );
        }

        if (activeTab === 'habilidades') {
            const logrosLabel =
                tipo === 'docente' ? 'Logros' : tipo === 'egresado' ? 'Logros' : null;
            const logrosValor = tipo === 'docente' || tipo === 'egresado' ? perfil.logros : null;
            const competenciasValor = tipo === 'egresado' ? perfil.competencias : null;
            const areaInteresValor = tipo === 'estudiante' ? perfil.area_interes : null;

            return (
                <>
                    <div className="info-section-custom full-width">
                        <h3 className="section-title-custom">🛠️ Habilidades</h3>
                        <p className="perfil-parrafo">
                            {perfil.habilidades || 'Todavía no agregó habilidades a su perfil.'}
                        </p>
                    </div>

                    {areaInteresValor !== null && (
                        <div className="info-section-custom full-width">
                            <h3 className="section-title-custom">💡 Área de interés</h3>
                            <p className="perfil-parrafo">
                                {areaInteresValor || 'Todavía no agregó su área de interés.'}
                            </p>
                        </div>
                    )}

                    {logrosLabel && (
                        <div className="info-section-custom full-width">
                            <h3 className="section-title-custom">🏆 {logrosLabel}</h3>
                            <p className="perfil-parrafo">
                                {logrosValor || 'Todavía no agregó logros a su perfil.'}
                            </p>
                        </div>
                    )}

                    {competenciasValor !== null && (
                        <div className="info-section-custom full-width">
                            <h3 className="section-title-custom">📈 Competencias</h3>
                            <p className="perfil-parrafo">
                                {competenciasValor || 'Todavía no agregó competencias a su perfil.'}
                            </p>
                        </div>
                    )}
                </>
            );
        }

        return <p className="no-content-message">Selecciona una pestaña para ver el contenido.</p>;
    };

    // --------------------------------------------------------
    // RENDERIZADO CONDICIONAL DE ESTADOS INICIALES (MANTENIDO)
    // --------------------------------------------------------
    if (loading) {
        return (
            <div className="home-container">
                {/* ... (loading JSX) ... */}
            </div>
        );
    }

    if (error || !perfil) {
        return (
            <div className="home-container">
                {/* ... (error JSX) ... */}
            </div>
        );
    }
    
    // --------------------------------------------------------
    // RENDERIZADO PRINCIPAL (AQUÍ PERFIL ES SEGURO)
    // --------------------------------------------------------
    
    const finalAvatarUrl = perfil?.foto ? buildMediaUrl(perfil.foto) : '/avatar-default.png';

    return (
        <div className="perfil-container">
            <AppHeader />

            {/* Main */}
            <div className="perfil-main-content">
                <button onClick={handleVolver} className="volver-btn">
                    <span className="btn-icon">←</span> Volver
                </button>

                {/* Encabezado: avatar + título + tabs */}
                <div className="perfil-header-area">
                    {/* ... (perfil-avatar-wrap y avatar) ... */}
                    <div className="perfil-avatar-wrap">
                        <img src={finalAvatarUrl} alt="Foto de perfil" className="perfil-avatar perfil-avatar--lg" />
                        {tipo === 'estudiante' && isOwner && (
                            <button
                                className={`mini-btn ${isUploading ? 'disabled' : ''}`}
                                onClick={onPickFile}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Subiendo...' : 'Cambiar foto'}
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div>
                        <div className="header-with-emoji" style={{ justifyContent: 'flex-start', marginBottom: 8 }}>
                            <span className="perfil-emoji">
                                {tipo === 'estudiante' && '🎓'}
                                {tipo === 'docente' && '📚'}
                                {tipo === 'egresado' && '💡'}
                            </span>
                            <h1 className="perfil-title">Perfil de {perfil.nombre_completo}</h1>
                        </div>

                        {/* Tabs (MANTENIDO) */}
                        <nav className="perfil-tabs">
                            <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                                Información Personal
                            </button>
                            <button className={`tab-btn ${activeTab === 'habilidades' ? 'active' : ''}`} onClick={() => setActiveTab('habilidades')}>
                                Habilidades y Logros
                            </button>

                        </nav>
                    </div>
                </div>

                {/* Grid principal */}
                <div className="perfil-grid-layout">
                    {/* Columna 1: contenido (MANTENIDO) */}
                    <div className="perfil-content-wrapper">
                        <div className="perfil-tab-content" key={activeTab}>{renderTabContent()}</div>
                    </div>

                    {/* Columna 2: sidebar (LÓGICA CONDICIONAL) */}
<div className="perfil-sidebar">
    <div className="sidebar-card">
        <h3 className="sidebar-title">
            {isOwner ? '🔧 Gestión de Perfil' : '🤝 Interacción'}
        </h3>
        <div className="sidebar-actions-group">
            
            {/* 1. CONTACTAR (Solo si NO es el Propietario) */}
            {!isOwner && (
                <>
                    <button
                        onClick={handleContactar}
                        className="sidebar-btn contactar-btn"
                        disabled={contactando}
                    >
                        <span className="btn-icon">🤝</span>
                        {contactando ? 'Enviando...' : 'Solicitar colaboración'}
                    </button>
                    {contactoMensaje && (
                        <p className="contacto-mensaje">{contactoMensaje}</p>
                    )}
                </>
            )}

            {/* 2. BOTONES SOLO PARA EL PROPIETARIO */}
            {isOwner && (
                <>
                    <button onClick={handleEditar} className="sidebar-btn editar-btn">
                        <span className="btn-icon">✏️</span> Editar Perfil
                    </button>

                    <button onClick={handleEliminar} className="sidebar-btn eliminar-btn">
                        <span className="btn-icon">🗑️</span> Eliminar Perfil
                    </button>
                </>
            )}

            {/* 3. BOTÓN CERRAR SESIÓN (solo si es el propietario viendo su propio perfil) */}
            {isOwner && (
                <button onClick={handleLogout} className="sidebar-btn logout-btn">
                    <span className="btn-icon">🚪</span> Cerrar Sesión
                </button>
            )}
        </div>
    </div>
</div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;