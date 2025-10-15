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
            
            // Cargar todos los perfiles
            const [estudiantesRes, docentesRes, egresadosRes] = await Promise.all([
                apiService.getEstudiantes(),
                apiService.getDocentes(),
                apiService.getEgresados()
            ]);

            if (estudiantesRes.success) setEstudiantes(estudiantesRes.data || []);
            if (docentesRes.success) setDocentes(docentesRes.data || []);
            if (egresadosRes.success) setEgresados(egresadosRes.data || []);

            // Seleccionar perfiles destacados
            const todosLosPerfiles = [
                ...(estudiantesRes.data || []).map(e => ({ ...e, tipo: 'estudiante' })),
                ...(docentesRes.data || []).map(d => ({ ...d, tipo: 'docente' })),
                ...(egresadosRes.data || []).map(eg => ({ ...eg, tipo: 'egresado' }))
            ];

            // Mezclar y tomar 3 perfiles aleatorios como destacados
            const shuffled = todosLosPerfiles.sort(() => 0.5 - Math.random());
            setFeaturedProfiles(shuffled.slice(0, 3));

        } catch (error) {
            console.error('Error cargando comunidad:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPerfilesFiltrados = () => {
        let perfiles = [];

        if (activeFilter === 'todos' || activeFilter === 'estudiantes') {
            perfiles = [...perfiles, ...estudiantes.map(e => ({ ...e, tipo: 'estudiante' }))];
        }
        if (activeFilter === 'todos' || activeFilter === 'docentes') {
            perfiles = [...perfiles, ...docentes.map(d => ({ ...d, tipo: 'docente' }))];
        }
        if (activeFilter === 'todos' || activeFilter === 'egresados') {
            perfiles = [...perfiles, ...egresados.map(eg => ({ ...eg, tipo: 'egresado' }))];
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            perfiles = perfiles.filter(perfil =>
                perfil.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                perfil.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                perfil.habilidades?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                perfil.area_interes?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

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

    return (
        <div className="comunidad-container">
            {/* Fondo decorativo */}
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* Header */}
            <header className="comunidad-header">
                <div className="header-content">
                    <Link to="/" className="back-btn">
                        ← Volver al Inicio
                    </Link>
                    <div className="header-title">
                        <h1>🌐 Nuestra Comunidad</h1>
                        <p>Conecta con estudiantes, docentes y profesionales</p>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="comunidad-hero">
                <div className="hero-content">
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
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <span className="stat-number">{estudiantes.length + docentes.length + egresados.length}</span>
                                <span className="stat-label">Total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
                            <div key={index} className="featured-card">
                                <div 
                                    className="profile-badge"
                                    style={{ backgroundColor: getTipoColor(perfil.tipo) }}
                                >
                                    {getTipoIcon(perfil.tipo)}
                                </div>
                                <div className="profile-content">
                                    <h3>{perfil.nombre_completo}</h3>
                                    <p className="profile-role">
                                        {perfil.tipo === 'estudiante' && 'Estudiante'}
                                        {perfil.tipo === 'docente' && 'Docente'}
                                        {perfil.tipo === 'egresado' && 'Egresado'}
                                    </p>
                                    <p className="profile-email">{perfil.correo_institucional}</p>
                                    {perfil.habilidades && (
                                        <div className="profile-skills">
                                            <span>{perfil.habilidades.split(',').slice(0, 2).join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                                <Link 
                                    to={`/perfil/${perfil.tipo}/${perfil.id}`}
                                    className="view-profile-btn"
                                >
                                    Ver Perfil →
                                </Link>
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
                        <p>Intenta con otros filtros o términos de búsqueda</p>
                    </div>
                ) : (
                    <div className="members-grid">
                        {perfilesFiltrados.map((perfil, index) => (
                            <div key={`${perfil.tipo}-${perfil.id}`} className="member-card">
                                <div className="member-header">
                                    <div 
                                        className="member-badge"
                                        style={{ backgroundColor: getTipoColor(perfil.tipo) }}
                                    >
                                        {getTipoIcon(perfil.tipo)}
                                    </div>
                                    <div className="member-info">
                                        <h3>{perfil.nombre_completo}</h3>
                                        <p className="member-role">
                                            {perfil.tipo === 'estudiante' && `Estudiante - ${perfil.carrera_actual || 'Carrera'}`}
                                            {perfil.tipo === 'docente' && `Docente - ${perfil.carrera_egreso || 'Especialidad'}`}
                                            {perfil.tipo === 'egresado' && `Egresado - ${perfil.carrera_egreso || 'Profesión'}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="member-details">
                                    <p className="member-email">📧 {perfil.correo_institucional}</p>
                                    
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="comunidad-cta">
                <div className="cta-content">
                    <h2>¿No encuentras lo que buscas?</h2>
                    <p>Regístrate en nuestra comunidad y conecta con personas que comparten tus intereses</p>
                    <div className="cta-buttons">
                        <Link to="/" className="cta-btn primary">
                            🚀 Únete a StudySphere
                        </Link>
                        <Link to="/registros/estudiantes" className="cta-btn secondary">
                            👥 Ver Todos los Registros
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Comunidad;