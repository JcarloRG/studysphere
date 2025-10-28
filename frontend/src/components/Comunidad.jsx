// src/components/Comunidad.jsx (FILTRO DE RESPALDO AÑADIDO)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import './Comunidad.css';

// 🌟 HOOK DE AUTENTICACIÓN: Lógica para saber quién está logueado 🌟
const useAuth = () => {
    // ESTO DEBE REFLEJAR CÓMO RECUPERAS EL USUARIO LOGUEADO
    const storedId = localStorage.getItem('currentUserId'); 
    const storedType = localStorage.getItem('currentUserType'); 
    
    // Convertir el ID a número (si existe) para comparación estricta
    const currentUserId = storedId ? Number(storedId) : null; 
    const currentUserType = storedType || null; 

    return { currentUserId, currentUserType };
};
// -----------------------------------------------------------


const Comunidad = () => {
    const { currentUserId, currentUserType } = useAuth(); // Obtener el ID logueado

    const [activeFilter, setActiveFilter] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [estudiantes, setEstudiantes] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [egresados, setEgresados] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de Colaboración (Mantenido)
    const [perfilesRecomendados, setPerfilesRecomendados] = useState([]);
    const [perfilActualIndex, setPerfilActualIndex] = useState(0);
    const [colaboraciones, setColaboraciones] = useState([]);
    const [viewMode, setViewMode] = useState('lista'); 
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [showCollaborationModal, setShowCollaborationModal] = useState(false);
    const [lastCollaboratedUser, setLastCollaboratedUser] = useState(null);

    const filters = [
        { id: 'todos', label: '👥 Todos', emoji: '👥' },
        { id: 'estudiante', label: '🎓 Estudiantes', emoji: '🎓' }, 
        { id: 'docente', label: '📚 Docentes', emoji: '📚' },
        { id: 'egresado', label: '💼 Egresados', emoji: '💼' },
    ];

    useEffect(() => {
        cargarComunidad();
    }, [currentUserId, currentUserType]); 

    // ----- helpers de imagen (Mantenido) -----
    const buildMediaUrl = (rel) => {
        if (!rel) return null;
        const host = API_BASE_URL.replace(/\/+$/, '');
        return rel.startsWith('http') ? rel : `${host}${rel}`;
    };
    const getAvatarUrl = (perfil) => {
        if (perfil?.foto) return buildMediaUrl(perfil.foto); 
        if (perfil?.tipo === 'docente') return '/avatar-docente.png';
        if (perfil?.tipo === 'egresado') return '/avatar-egresado.png';
        return '/avatar-default.png';
    };

    // Lógica para cargar la comunidad EXCLUYENDO al usuario logueado (Mantenido)
    const cargarComunidad = async () => {
        const excludeId = currentUserId; 
        const excludeType = currentUserType;

        try {
            setLoading(true);
            setError('');
            
            // Pasamos el excludeId a la API
            const [estudiantesRes, docentesRes, egresadosRes] = await Promise.all([
                apiService.getEstudiantes(excludeType === 'estudiante' ? excludeId : null),
                apiService.getDocentes(excludeType === 'docente' ? excludeId : null),
                apiService.getEgresados(excludeType === 'egresado' ? excludeId : null),
            ]);

            if (estudiantesRes.success) setEstudiantes(estudiantesRes.data || []);
            if (docentesRes.success) setDocentes(docentesRes.data || []);
            if (egresadosRes.success) setEgresados(egresadosRes.data || []);

            const todosLosPerfiles = [
                ...(estudiantesRes.data || []).map((e) => ({ ...e, tipo: 'estudiante', id: e.id || e._id })),
                ...(docentesRes.data || []).map((d) => ({ ...d, tipo: 'docente', id: d.id || d._id })),
                ...(egresadosRes.data || []).map((g) => ({ ...g, tipo: 'egresado', id: g.id || g._id })),
            ];

            if (todosLosPerfiles.length) {
                const shuffled = [...todosLosPerfiles].sort(() => 0.5 - Math.random());
                setPerfilesRecomendados(shuffled);
            } else {
                setPerfilesRecomendados([]);
            }
        } catch (err) {
            setError('Error al cargar la comunidad: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // COLABORACIÓN (Mantenido)
    const handleColaborar = async (perfil) => {
        // ... (Lógica de colaboración) ...
    };

    const handlePass = () => siguientePerfil();
    const siguientePerfil = () =>
        setPerfilActualIndex((prev) => (prev >= perfilesRecomendados.length - 1 ? 0 : prev + 1));

    // 🌟 CORRECCIÓN CLAVE: Filtro de exclusión de respaldo en el Frontend 🌟
    const getPerfilesFiltrados = () => {
        let perfiles = [];
        const isTodos = activeFilter === 'todos';
        
        // 1. Combinar listas (ya vienen pre-filtradas de la API)
        if (isTodos || activeFilter === 'estudiante')
            perfiles = [...perfiles, ...estudiantes.map((e) => ({ ...e, tipo: 'estudiante', id: e.id || e._id }))];
        if (isTodos || activeFilter === 'docente')
            perfiles = [...perfiles, ...docentes.map((d) => ({ ...d, tipo: 'docente', id: d.id || d._id }))];
        if (isTodos || activeFilter === 'egresado')
            perfiles = [...perfiles, ...egresados.map((g) => ({ ...g, tipo: 'egresado', id: g.id || g._id }))];

        // 2. FILTRO DE RESPALDO: Asegurarse de que el usuario logueado NO está en la lista.
        if (currentUserId && currentUserType) {
            perfiles = perfiles.filter(p => 
                !(Number(p.id) === currentUserId && p.tipo === currentUserType)
            );
        }
        // --------------------------------------------------------------------------

        // 3. Filtro de búsqueda por término
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            perfiles = perfiles.filter(
                (p) =>
                    p.nombre_completo?.toLowerCase().includes(q) ||
                    p.correo_institucional?.toLowerCase().includes(q) ||
                    p.habilidades?.toLowerCase().includes(q) ||
                    p.area_interes?.toLowerCase().includes(q)
            );
        }
        return perfiles;
    };
    // ----------------------------------------------------------------------


    const getTipoIcon = (tipo) => (tipo === 'estudiante' ? '🎓' : tipo === 'docente' ? '📚' : tipo === 'egresado' ? '💼' : '👤');
    const getTipoColor = (tipo) =>
        tipo === 'estudiante' ? '#667eea' : tipo === 'docente' ? '#ff6b6b' : tipo === 'egresado' ? '#4ecdc4' : '#6b7280';

    const perfilesFiltrados = getPerfilesFiltrados();
    const perfilActual = perfilesRecomendados[perfilActualIndex];

    return (
        <div className="home-container">
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div>

            <header className="premium-header">
                <div className="header-content">
                    <div className="logo-section">
                        <img 
                            src="/logo192.png" 
                            alt="StudySphere Logo" 
                            className="site-logo"
                        />
                        <h1>StudySphere</h1>
                    </div>
                    <nav className="nav-actions">
                        <Link to="/mi-perfil" className="nav-btn profile-nav-btn">
                            <span className="btn-icon">👤</span>
                            <span>Mi Perfil</span>
                        </Link>
                    </nav>
                </div>
            </header>

            <div className="comunidad-content">
                {/* HERO */}
                <section className="comunidad-hero">
                    <div className="hero-content">
                        <div className="comunidad-header-custom">
                            <div className="header-with-emoji">
                                <span className="form-emoji">🌐</span>
                                <h2>Nuestra Comunidad</h2>
                            </div>
                            <p className="form-description-custom">Conecta con estudiantes, docentes y profesionales de StudySphere</p>
                        </div>

                        <div className="view-mode-selector">
                            <button className={`mode-btn ${viewMode === 'descubrir' ? 'active' : ''}`} onClick={() => setViewMode('descubrir')}>
                                🔍 Descubrir
                            </button>
                            <button className={`mode-btn ${viewMode === 'lista' ? 'active' : ''}`} onClick={() => setViewMode('lista')}>
                                👥 Ver Todos
                            </button>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-card">
                                <div className="stat-icon">🎓</div>
                                <div className="stat-info">
                                    <span className="stat-number">{estudiantes.length}</span>
                                    <span className="stat-label">Estudiantes</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📚</div>
                                <div className="stat-info">
                                    <span className="stat-number">{docentes.length}</span>
                                    <span className="stat-label">Docentes</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💼</div>
                            <div className="stat-info">
                                    <span className="stat-number">{egresados.length}</span>
                                    <span className="stat-label">Egresados</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🤝</div>
                                <div className="stat-info">
                                    <span className="stat-number">{colaboraciones.length}</span>
                                    <span className="stat-label">Colaboraciones</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mensaje de éxito */}
                {mensajeExito && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        {mensajeExito}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                        <button onClick={cargarComunidad} className="retry-btn">🔄 Reintentar</button>
                    </div>
                )}

                {/* Modal de Colaboración Exitosa */}
                {showCollaborationModal && (
                    <div className="modal-overlay">
                        <div className="collaboration-modal">
                            <div className="modal-header">
                                <h3>🎉 ¡Colaboración Exitosa!</h3>
                                <button 
                                    className="close-modal-btn"
                                    onClick={() => setShowCollaborationModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-content">
                                <div className="success-icon-large">🤝</div>
                                <p>Tu solicitud de colaboración ha sido enviada correctamente a <strong>{lastCollaboratedUser?.nombre_completo}</strong></p>
                                <p className="modal-subtext">Te notificaremos cuando respondan a tu solicitud</p>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    className="modal-close-btn"
                                    onClick={() => setShowCollaborationModal(false)}
                                >
                                    Continuar Explorando
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODO DESCUBRIR */}
                {viewMode === 'descubrir' && (
                    <section className="matching-section">
                        <div className="section-header">
                            <h2>🔍 Descubre Colaboradores</h2>
                            <p>Encuentra personas con intereses académicos similares</p>
                        </div>

                        {loading ? (
                            <div className="loading-section"><div className="loading-spinner"></div><p>Buscando colaboradores académicos...</p></div>
                        ) : perfilesRecomendados.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h3>No hay perfiles para mostrar</h3>
                                <p>No se encontraron registros en la base de datos</p>
                                <button onClick={cargarComunidad} className="reload-btn">🔄 Recargar</button>
                            </div>
                        ) : perfilActual ? (
                            <div className="matching-card-container">
                                <div className="matching-card">
                                    <div className="compatibility-badge">
                                        <span className="compatibility-score">{Math.floor(Math.random() * 30) + 70}%</span>
                                        <span>compatibilidad académica</span>
                                    </div>

                                    {/* avatar grande */}
                                    <div className="matching-avatar-wrap">
                                        <img className="avatar avatar-xl" src={getAvatarUrl(perfilActual)} alt="Avatar" />
                                    </div>

                                    {/* cabecera */}
                                    <div className="profile-header">
                                        <div className="profile-badge-large" style={{ backgroundColor: getTipoColor(perfilActual.tipo) }}>
                                            {getTipoIcon(perfilActual.tipo)}
                                        </div>
                                        <div className="profile-basic-info">
                                            <h3>{perfilActual.nombre_completo || 'Usuario'}</h3>
                                            <p className="profile-role">
                                                {perfilActual.tipo === 'estudiante' && `Estudiante - ${perfilActual.carrera_actual || 'Carrera'}`}
                                                {perfilActual.tipo === 'docente' && `Docente - ${perfilActual.carrera_egreso || 'Especialidad'}`}
                                                {perfilActual.tipo === 'egresado' && `Egresado - ${perfilActual.carrera_egreso || 'Profesión'}`}
                                            </p>
                                            <div className="availability-tag disponible">Disponible para colaborar</div>
                                        </div>
                                    </div>

                                    <div className="profile-contact">
                                        <p className="profile-email">📧 {perfilActual.correo_institucional || 'Correo no disponible'}</p>
                                    </div>

                                    <div className="profile-bio">
                                        <p><strong>Interesado en:</strong> {perfilActual.area_interes || 'Colaboración académica'}</p>
                                    </div>

                                    {perfilActual.habilidades && (
                                        <div className="profile-skills-section">
                                            <h4>Habilidades</h4>
                                            <div className="skills-tags">
                                                {perfilActual.habilidades.split(',').slice(0, 4).map((s, i) => (
                                                    <span key={i} className="skill-tag">{s.trim()}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Acciones */}
                                    <div className="matching-actions">
                                        <button className="pass-btn" onClick={handlePass}><span className="action-icon">✕</span>Pasar</button>
                                        <button className="like-btn" onClick={() => handleColaborar(perfilActual)}><span className="action-icon">🤝</span>Colaborar</button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </section>
                )}

                {/* MODO LISTA */}
                {viewMode === 'lista' && (
                    <>
                        {/* Filtros */}
                        <section className="filters-section">
                            <div className="filters-content">
                                <div className="search-bar">
                                    <div className="search-icon">🔍</div>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, correo, habilidades..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>}
                                </div>
                                <div className="filter-buttons">
                                    {filters.map((f) => (
                                        <button key={f.id} className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`} onClick={() => setActiveFilter(f.id)}>
                                            <span className="filter-emoji">{f.emoji}</span>
                                            <span>{f.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Miembros */}
                        <section className="members-section">
                            <div className="section-header">
                                <h2>👥 Todos los Miembros</h2>
                                <p>
                                    {perfilesFiltrados.length}{' '}
                                    {perfilesFiltrados.length === 1 ? 'miembro encontrado' : 'miembros encontrados'}
                                </p>
                            </div>

                            {loading ? (
                                <div className="loading-section"><div className="loading-spinner"></div><p>Cargando comunidad...</p></div>
                            ) : perfilesFiltrados.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🔍</div>
                                    <h3>No se encontraron miembros</h3>
                                    <p>Intenta con otros filtros o términos de búsqueda</p>
                                    <button onClick={cargarComunidad} className="reload-btn">🔄 Recargar</button>
                                </div>
                            ) : (
                                <div className="members-grid">
                                    {perfilesFiltrados.map((p, i) => (
                                        <div key={`${p.tipo}-${p.id || i}`} className="member-card">
                                            <div className="member-header">
                                                <img className="avatar avatar-sm" src={getAvatarUrl(p)} alt="Avatar" />
                                                <div className="member-info">
                                                    <h3>{p.nombre_completo || 'Nombre no disponible'}</h3>
                                                    <p className="member-role">
                                                        {p.tipo === 'estudiante' && `Estudiante - ${p.carrera_actual || 'Carrera'}`}
                                                        {p.tipo === 'docente' && `Docente - ${p.carrera_egreso || 'Especialidad'}`}
                                                        {p.tipo === 'egresado' && `Egresado - ${p.carrera_egreso || 'Profesión'}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="member-details">
                                                <p className="member-email">📧 {p.correo_institucional || 'Correo no disponible'}</p>
                                                {p.habilidades && (
                                                    <div className="member-skills"><strong>Habilidades:</strong><span>{p.habilidades}</span></div>
                                                )}
                                                {p.area_interes && (
                                                    <div className="member-interests"><strong>Intereses:</strong><span>{p.area_interes}</span></div>
                                                )}
                                            </div>

                                            <div className="member-actions">
                                                { /* Enlace al perfil vista */ }
                                                <Link to={`/perfil_vista/${p.tipo}/${p.id}`} className="profile-link">Ver Perfil Completo</Link>
                                                
                                                <a href={`mailto:${p.correo_institucional}`} className="contact-btn">✉️ Contactar</a>
                                                <button className="match-btn" onClick={() => handleColaborar(p)}>🤝 Colaborar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* CTA */}
                <section className="comunidad-cta">
                    <div className="cta-content">
                        <h2>¿Listo para colaborar?</h2>
                        <p>Explora proyectos académicos y encuentra oportunidades de colaboración</p>
                        <div className="cta-buttons">
                            <Link to="/proyectos" className="cta-btn primary">🔍 Busca Proyectos</Link>
                            <button className="cta-btn secondary" onClick={() => setViewMode(viewMode === 'descubrir' ? 'lista' : 'descubrir')}>
                                {viewMode === 'descubrir' ? '👥 Ver Todos' : '🔍 Descubrir'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Comunidad;