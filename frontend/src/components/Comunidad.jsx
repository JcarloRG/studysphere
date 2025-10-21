import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import './Comunidad.css';

const Comunidad = () => {
    const [activeFilter, setActiveFilter] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [estudiantes, setEstudiantes] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [egresados, setEgresados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [featuredProfiles, setFeaturedProfiles] = useState([]);
    
    // NUEVOS ESTADOS PARA MATCHING
    const [perfilesRecomendados, setPerfilesRecomendados] = useState([]);
    const [perfilActualIndex, setPerfilActualIndex] = useState(0);
    const [matches, setMatches] = useState([]);
    const [viewMode, setViewMode] = useState('lista'); // 'matching' o 'lista'
    const [error, setError] = useState('');

    const filters = [
        { id: 'todos', label: '👥 Todos', emoji: '👥' },
        { id: 'estudiantes', label: '🎓 Estudiantes', emoji: '🎓' },
        { id: 'docentes', label: '📚 Docentes', emoji: '📚' },
        { id: 'egresados', label: '💼 Egresados', emoji: '💼' }
    ];

    useEffect(() => {
        cargarComunidad();
    }, []);

    const cargarComunidad = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('🔍 Iniciando carga de comunidad...');
            
            // Cargar todos los perfiles
            const [estudiantesRes, docentesRes, egresadosRes] = await Promise.all([
                apiService.getEstudiantes(),
                apiService.getDocentes(),
                apiService.getEgresados()
            ]);

            console.log('📊 Respuestas API:', {
                estudiantes: estudiantesRes,
                docentes: docentesRes,
                egresados: egresadosRes
            });

            if (estudiantesRes.success) {
                setEstudiantes(estudiantesRes.data || []);
                console.log(`🎓 ${estudiantesRes.data?.length || 0} estudiantes cargados`);
            }

            if (docentesRes.success) {
                setDocentes(docentesRes.data || []);
                console.log(`📚 ${docentesRes.data?.length || 0} docentes cargados`);
            }

            if (egresadosRes.success) {
                setEgresados(egresadosRes.data || []);
                console.log(`💼 ${egresadosRes.data?.length || 0} egresados cargados`);
            }

            // Seleccionar perfiles destacados
            const todosLosPerfiles = [
                ...(estudiantesRes.data || []).map(e => ({ 
                    ...e, 
                    tipo: 'estudiante',
                    id: e.id || e._id
                })),
                ...(docentesRes.data || []).map(d => ({ 
                    ...d, 
                    tipo: 'docente',
                    id: d.id || d._id
                })),
                ...(egresadosRes.data || []).map(eg => ({ 
                    ...eg, 
                    tipo: 'egresado',
                    id: eg.id || eg._id
                }))
            ];

            console.log('👥 Total de perfiles encontrados:', todosLosPerfiles.length);

            if (todosLosPerfiles.length > 0) {
                const shuffled = [...todosLosPerfiles].sort(() => 0.5 - Math.random());
                const destacados = shuffled.slice(0, Math.min(3, shuffled.length));
                setFeaturedProfiles(destacados);
                console.log('⭐ Perfiles destacados seleccionados:', destacados);
                
                // Usar los mismos perfiles para matching
                setPerfilesRecomendados(shuffled);
            } else {
                setFeaturedProfiles([]);
                setPerfilesRecomendados([]);
                console.log('⚠️ No hay perfiles para mostrar');
            }

        } catch (error) {
            console.error('💥 Error cargando comunidad:', error);
            setError('Error al cargar la comunidad: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // NUEVAS FUNCIONES PARA MATCHING
    const handleLike = async (perfil) => {
        try {
            console.log(`💖 Enviando like a: ${perfil.nombre_completo}`);
            
            // Registrar el match
            const result = await apiService.enviarSolicitudMatch(perfil.id, perfil.tipo);
            
            if (result.success) {
                console.log('✅ Match registrado exitosamente');
                // Agregar a matches
                setMatches(prev => [...prev, perfil]);
            } else {
                console.error('❌ Error registrando match:', result.message);
            }
            
            // Pasar al siguiente perfil
            siguientePerfil();
            
        } catch (error) {
            console.error('💥 Error registrando match:', error);
            siguientePerfil();
        }
    };

    const handlePass = () => {
        console.log(`❌ Pasando perfil`);
        // Simplemente pasar al siguiente perfil
        siguientePerfil();
    };

    const siguientePerfil = () => {
        setPerfilActualIndex(prev => {
            if (prev >= perfilesRecomendados.length - 1) {
                // Si no hay más perfiles, volver al inicio
                return 0;
            }
            return prev + 1;
        });
    };

    const getPerfilesFiltrados = () => {
        let perfiles = [];

        if (activeFilter === 'todos' || activeFilter === 'estudiantes') {
            perfiles = [...perfiles, ...estudiantes.map(e => ({ 
                ...e, 
                tipo: 'estudiante',
                id: e.id || e._id
            }))];
        }
        if (activeFilter === 'todos' || activeFilter === 'docentes') {
            perfiles = [...perfiles, ...docentes.map(d => ({ 
                ...d, 
                tipo: 'docente',
                id: d.id || d._id
            }))];
        }
        if (activeFilter === 'todos' || activeFilter === 'egresados') {
            perfiles = [...perfiles, ...egresados.map(eg => ({ 
                ...eg, 
                tipo: 'egresado',
                id: eg.id || eg._id
            }))];
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            perfiles = perfiles.filter(perfil =>
                (perfil.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                perfil.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                perfil.habilidades?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                perfil.area_interes?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        console.log(`🔍 ${perfiles.length} perfiles después de filtrar`);
        return perfiles;
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'estudiante': return '🎓';
            case 'docente': return '📚';
            case 'egresado': return '💼';
            default: return '👤';
        }
    };

    const getTipoColor = (tipo) => {
        switch (tipo) {
            case 'estudiante': return '#667eea';
            case 'docente': return '#ff6b6b';
            case 'egresado': return '#4ecdc4';
            default: return '#6b7280';
        }
    };

    const perfilesFiltrados = getPerfilesFiltrados();
    const perfilActual = perfilesRecomendados[perfilActualIndex];

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
                        <Link to="/" className="nav-btn profile-nav-btn">
                            <span className="btn-icon">🏠</span>
                            <span>Volver al Inicio</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Contenido de la comunidad */}
            <div className="comunidad-content">
                {/* Hero Section */}
                <section className="comunidad-hero">
                    <div className="hero-content">
                        <div className="comunidad-header-custom">
                            <div className="header-with-emoji">
                                <span className="form-emoji">🌐</span>
                                <h2>Nuestra Comunidad</h2>
                            </div>
                            <p className="form-description-custom">
                                Conecta con estudiantes, docentes y profesionales de StudySphere
                            </p>
                        </div>

                        {/* Selector de Modo */}
                        <div className="view-mode-selector">
                            <button 
                                className={`mode-btn ${viewMode === 'matching' ? 'active' : ''}`}
                                onClick={() => setViewMode('matching')}
                            >
                                💖 Descubrir
                            </button>
                            <button 
                                className={`mode-btn ${viewMode === 'lista' ? 'active' : ''}`}
                                onClick={() => setViewMode('lista')}
                            >
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
                                <div className="stat-icon">💖</div>
                                <div className="stat-info">
                                    <span className="stat-number">{matches.length}</span>
                                    <span className="stat-label">Matches</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mostrar error si existe */}
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                        <button onClick={cargarComunidad} className="retry-btn">
                            🔄 Reintentar
                        </button>
                    </div>
                )}

                {/* MODO MATCHING */}
                {viewMode === 'matching' && (
                    <section className="matching-section">
                        <div className="section-header">
                            <h2>💖 Descubre Colaboradores</h2>
                            <p>Desliza para encontrar personas con intereses similares</p>
                        </div>

                        {loading ? (
                            <div className="loading-section">
                                <div className="loading-spinner"></div>
                                <p>Buscando colaboradores increíbles...</p>
                            </div>
                        ) : perfilesRecomendados.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <h3>No hay perfiles para mostrar</h3>
                                <p>No se encontraron registros en la base de datos</p>
                                <button onClick={cargarComunidad} className="reload-btn">
                                    🔄 Recargar
                                </button>
                            </div>
                        ) : perfilActual ? (
                            <div className="matching-card-container">
                                <div className="matching-card">
                                    {/* Badge de Compatibilidad */}
                                    <div className="compatibility-badge">
                                        <span className="compatibility-score">{Math.floor(Math.random() * 30) + 70}%</span>
                                        <span>compatibilidad</span>
                                    </div>

                                    {/* Información del Perfil CORREGIDA */}
                                    <div className="profile-header">
                                        <div 
                                            className="profile-badge-large"
                                            style={{ backgroundColor: getTipoColor(perfilActual.tipo) }}
                                        >
                                            {getTipoIcon(perfilActual.tipo)}
                                        </div>
                                        <div className="profile-basic-info">
                                            <h3>{perfilActual.nombre_completo || 'Usuario'}</h3>
                                            <p className="profile-role">
                                                {perfilActual.tipo === 'estudiante' && `Estudiante - ${perfilActual.carrera_actual || 'Carrera'}`}
                                                {perfilActual.tipo === 'docente' && `Docente - ${perfilActual.carrera_egreso || 'Especialidad'}`}
                                                {perfilActual.tipo === 'egresado' && `Egresado - ${perfilActual.carrera_egreso || 'Profesión'}`}
                                            </p>
                                            <div className="availability-tag disponible">
                                                Disponible para colaborar
                                            </div>
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
                                                {perfilActual.habilidades.split(',').slice(0, 4).map((skill, index) => (
                                                    <span key={index} className="skill-tag">{skill.trim()}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {perfilActual.tipo === 'estudiante' && perfilActual.semestre && (
                                        <div className="profile-extra">
                                            <strong>Semestre:</strong> {perfilActual.semestre}
                                        </div>
                                    )}

                                    {perfilActual.tipo === 'egresado' && perfilActual.empresa && (
                                        <div className="profile-extra">
                                            <strong>Empresa:</strong> {perfilActual.empresa}
                                        </div>
                                    )}

                                    {/* Botones de Acción */}
                                    <div className="matching-actions">
                                        <button 
                                            className="pass-btn"
                                            onClick={handlePass}
                                        >
                                            <span className="action-icon">✕</span>
                                            Pass
                                        </button>
                                        <button 
                                            className="like-btn"
                                            onClick={() => handleLike(perfilActual)}
                                        >
                                            <span className="action-icon">💖</span>
                                            Like
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Sección de Matches */}
                        {matches.length > 0 && (
                            <div className="matches-preview">
                                <h4>Tus Matches Recientes ({matches.length})</h4>
                                <div className="matches-mini-grid">
                                    {matches.slice(-3).map((match, index) => (
                                        <div key={index} className="match-mini-card">
                                            <div 
                                                className="match-mini-avatar"
                                                style={{ backgroundColor: getTipoColor(match.tipo) }}
                                            >
                                                {getTipoIcon(match.tipo)}
                                            </div>
                                            <div className="match-mini-info">
                                                <span className="match-mini-name">{match.nombre_completo}</span>
                                                <span className="match-mini-role">
                                                    {match.tipo === 'estudiante' && 'Estudiante'}
                                                    {match.tipo === 'docente' && 'Docente'}
                                                    {match.tipo === 'egresado' && 'Egresado'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* MODO LISTA (tu diseño original) */}
                {viewMode === 'lista' && (
                    <>
                        {/* Barra de Búsqueda y Filtros */}
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
                                    {searchTerm && (
                                        <button 
                                            className="clear-search"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="filter-buttons">
                                    {filters.map(filter => (
                                        <button
                                            key={filter.id}
                                            className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                                            onClick={() => setActiveFilter(filter.id)}
                                        >
                                            <span className="filter-emoji">{filter.emoji}</span>
                                            <span>{filter.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Perfiles Destacados */}
                        {featuredProfiles.length > 0 && (
                            <section className="featured-section">
                                <div className="section-header">
                                    <h2>⭐ Perfiles Destacados</h2>
                                    <p>Conoce a algunos miembros de nuestra comunidad</p>
                                </div>
                                <div className="featured-grid">
                                    {featuredProfiles.map((perfil, index) => (
                                        <div key={`featured-${perfil.id || index}`} className="featured-card">
                                            <div 
                                                className="profile-badge"
                                                style={{ backgroundColor: getTipoColor(perfil.tipo) }}
                                            >
                                                {getTipoIcon(perfil.tipo)}
                                            </div>
                                            <div className="profile-content">
                                                <h3>{perfil.nombre_completo || 'Nombre no disponible'}</h3>
                                                <p className="profile-role">
                                                    {perfil.tipo === 'estudiante' && 'Estudiante'}
                                                    {perfil.tipo === 'docente' && 'Docente'}
                                                    {perfil.tipo === 'egresado' && 'Egresado'}
                                                </p>
                                                <p className="profile-email">{perfil.correo_institucional || 'Correo no disponible'}</p>
                                                {perfil.habilidades && (
                                                    <div className="profile-skills">
                                                        <span>{perfil.habilidades.split(',').slice(0, 2).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="featured-actions">
                                                <Link 
                                                    to={`/perfil/${perfil.tipo}/${perfil.id}`}
                                                    className="view-profile-btn"
                                                >
                                                    Ver Perfil →
                                                </Link>
                                                <button
                                                    className="match-btn"
                                                    onClick={() => handleLike(perfil)}
                                                >
                                                    💫 Conectar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Lista de Miembros */}
                        <section className="members-section">
                            <div className="section-header">
                                <h2>👥 Todos los Miembros</h2>
                                <p>
                                    {perfilesFiltrados.length} {perfilesFiltrados.length === 1 ? 'miembro encontrado' : 'miembros encontrados'}
                                    {activeFilter !== 'todos' && ` en ${filters.find(f => f.id === activeFilter)?.label}`}
                                    {searchTerm && ` para "${searchTerm}"`}
                                </p>
                            </div>

                            {loading ? (
                                <div className="loading-section">
                                    <div className="loading-spinner"></div>
                                    <p>Cargando comunidad...</p>
                                </div>
                            ) : perfilesFiltrados.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🔍</div>
                                    <h3>No se encontraron miembros</h3>
                                    <p>
                                        {estudiantes.length === 0 && docentes.length === 0 && egresados.length === 0 
                                            ? 'No hay registros en la base de datos. Asegúrate de que tu backend esté funcionando correctamente.'
                                            : 'Intenta con otros filtros o términos de búsqueda'
                                        }
                                    </p>
                                    <button onClick={cargarComunidad} className="reload-btn">
                                        🔄 Recargar
                                    </button>
                                </div>
                            ) : (
                                <div className="members-grid">
                                    {perfilesFiltrados.map((perfil, index) => (
                                        <div key={`${perfil.tipo}-${perfil.id || index}`} className="member-card">
                                            <div className="member-header">
                                                <div 
                                                    className="member-badge"
                                                    style={{ backgroundColor: getTipoColor(perfil.tipo) }}
                                                >
                                                    {getTipoIcon(perfil.tipo)}
                                                </div>
                                                <div className="member-info">
                                                    <h3>{perfil.nombre_completo || 'Nombre no disponible'}</h3>
                                                    <p className="member-role">
                                                        {perfil.tipo === 'estudiante' && `Estudiante - ${perfil.carrera_actual || 'Carrera'}`}
                                                        {perfil.tipo === 'docente' && `Docente - ${perfil.carrera_egreso || 'Especialidad'}`}
                                                        {perfil.tipo === 'egresado' && `Egresado - ${perfil.carrera_egreso || 'Profesión'}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="member-details">
                                                <p className="member-email">📧 {perfil.correo_institucional || 'Correo no disponible'}</p>
                                                
                                                {perfil.habilidades && (
                                                    <div className="member-skills">
                                                        <strong>Habilidades:</strong>
                                                        <span>{perfil.habilidades}</span>
                                                    </div>
                                                )}

                                                {perfil.area_interes && (
                                                    <div className="member-interests">
                                                        <strong>Intereses:</strong>
                                                        <span>{perfil.area_interes}</span>
                                                    </div>
                                                )}

                                                {perfil.tipo === 'estudiante' && perfil.semestre && (
                                                    <div className="member-extra">
                                                        <strong>Semestre:</strong>
                                                        <span>{perfil.semestre}</span>
                                                    </div>
                                                )}

                                                {perfil.tipo === 'egresado' && perfil.empresa && (
                                                    <div className="member-extra">
                                                        <strong>Empresa:</strong>
                                                        <span>{perfil.empresa}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="member-actions">
                                                <Link 
                                                    to={`/perfil/${perfil.tipo}/${perfil.id}`}
                                                    className="profile-link"
                                                >
                                                    Ver Perfil Completo
                                                </Link>
                                                <a 
                                                    href={`mailto:${perfil.correo_institucional}`}
                                                    className="contact-btn"
                                                >
                                                    ✉️ Contactar
                                                </a>
                                                <button
                                                    className="match-btn"
                                                    onClick={() => handleLike(perfil)}
                                                >
                                                    💫 Conectar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* CTA Section */}
                <section className="comunidad-cta">
                    <div className="cta-content">
                        <h2>¿Listo para colaborar?</h2>
                        <p>Únete a nuestra comunidad y comienza a conectar con personas increíbles</p>
                        <div className="cta-buttons">
                            <Link to="/" className="cta-btn primary">
                                🚀 Únete a StudySphere
                            </Link>
                            <button 
                                className="cta-btn secondary"
                                onClick={() => setViewMode(viewMode === 'matching' ? 'lista' : 'matching')}
                            >
                                {viewMode === 'matching' ? '👥 Ver Todos' : '💖 Descubrir'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Comunidad;