import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import './Comunidad.css';

const Comunidad = () => {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [egresados, setEgresados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProfiles, setFeaturedProfiles] = useState([]);

  // MATCHING
  const [perfilesRecomendados, setPerfilesRecomendados] = useState([]);
  const [perfilActualIndex, setPerfilActualIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [viewMode, setViewMode] = useState('lista'); // 'matching' | 'lista'
  const [error, setError] = useState('');

  const filters = [
    { id: 'todos', label: '👥 Todos', emoji: '👥' },
    { id: 'estudiantes', label: '🎓 Estudiantes', emoji: '🎓' },
    { id: 'docentes', label: '📚 Docentes', emoji: '📚' },
    { id: 'egresados', label: '💼 Egresados', emoji: '💼' },
  ];

  useEffect(() => {
    cargarComunidad();
  }, []);

  // ----- helpers de imagen -----
  const buildMediaUrl = (rel) => {
    if (!rel) return null;
    const host = API_BASE_URL.replace(/\/+$/, '');
    return rel.startsWith('http') ? rel : `${host}${rel}`;
  };
  const getAvatarUrl = (perfil) => {
    // hoy solo Estudiante tiene campo "foto"
    if (perfil?.tipo === 'estudiante' && perfil?.foto) return buildMediaUrl(perfil.foto);
    // fallback por tipo
    if (perfil?.tipo === 'docente') return '/avatar-docente.png';
    if (perfil?.tipo === 'egresado') return '/avatar-egresado.png';
    return '/avatar-default.png';
  };

  const cargarComunidad = async () => {
    try {
      setLoading(true);
      setError('');
      const [estudiantesRes, docentesRes, egresadosRes] = await Promise.all([
        apiService.getEstudiantes(),
        apiService.getDocentes(),
        apiService.getEgresados(),
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
        setFeaturedProfiles(shuffled.slice(0, Math.min(3, shuffled.length)));
        setPerfilesRecomendados(shuffled);
      } else {
        setFeaturedProfiles([]);
        setPerfilesRecomendados([]);
      }
    } catch (err) {
      setError('Error al cargar la comunidad: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // MATCHING
  const handleLike = async (perfil) => {
    try {
      const result = await apiService.enviarSolicitudMatch(perfil.id, perfil.tipo);
      if (result.success) setMatches((prev) => [...prev, perfil]);
    } catch {}
    siguientePerfil();
  };
  const handlePass = () => siguientePerfil();
  const siguientePerfil = () =>
    setPerfilActualIndex((prev) => (prev >= perfilesRecomendados.length - 1 ? 0 : prev + 1));

  const getPerfilesFiltrados = () => {
    let perfiles = [];
    if (activeFilter === 'todos' || activeFilter === 'estudiantes')
      perfiles = [...perfiles, ...estudiantes.map((e) => ({ ...e, tipo: 'estudiante', id: e.id || e._id }))];
    if (activeFilter === 'todos' || activeFilter === 'docentes')
      perfiles = [...perfiles, ...docentes.map((d) => ({ ...d, tipo: 'docente', id: d.id || d._id }))];
    if (activeFilter === 'todos' || activeFilter === 'egresados')
      perfiles = [...perfiles, ...egresados.map((g) => ({ ...g, tipo: 'egresado', id: g.id || g._id }))];

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
              <button className={`mode-btn ${viewMode === 'matching' ? 'active' : ''}`} onClick={() => setViewMode('matching')}>
                💖 Descubrir
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
                <div className="stat-icon">💖</div>
                <div className="stat-info">
                  <span className="stat-number">{matches.length}</span>
                  <span className="stat-label">Matches</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={cargarComunidad} className="retry-btn">🔄 Reintentar</button>
          </div>
        )}

        {/* MATCHING */}
        {viewMode === 'matching' && (
          <section className="matching-section">
            <div className="section-header">
              <h2>💖 Descubre Colaboradores</h2>
              <p>Desliza para encontrar personas con intereses similares</p>
            </div>

            {loading ? (
              <div className="loading-section"><div className="loading-spinner"></div><p>Buscando colaboradores increíbles...</p></div>
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
                    <span>compatibilidad</span>
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
                    <button className="pass-btn" onClick={handlePass}><span className="action-icon">✕</span>Pass</button>
                    <button className="like-btn" onClick={() => handleLike(perfilActual)}><span className="action-icon">💖</span>Like</button>
                  </div>
                </div>
              </div>
            ) : null}

            {matches.length > 0 && (
              <div className="matches-preview">
                <h4>Tus Matches Recientes ({matches.length})</h4>
                <div className="matches-mini-grid">
                  {matches.slice(-3).map((m, i) => (
                    <div key={i} className="match-mini-card">
                      <img className="avatar avatar-sm" src={getAvatarUrl(m)} alt="Mini avatar" />
                      <div className="match-mini-info">
                        <span className="match-mini-name">{m.nombre_completo}</span>
                        <span className="match-mini-role">
                          {m.tipo === 'estudiante' ? 'Estudiante' : m.tipo === 'docente' ? 'Docente' : 'Egresado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* LISTA */}
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

            {/* Destacados */}
            {featuredProfiles.length > 0 && (
              <section className="featured-section">
                <div className="section-header">
                  <h2>⭐ Perfiles Destacados</h2>
                  <p>Conoce a algunos miembros de nuestra comunidad</p>
                </div>
                <div className="featured-grid">
                  {featuredProfiles.map((p, i) => (
                    <div key={`featured-${p.id || i}`} className="featured-card">
                      <img className="avatar avatar-md" src={getAvatarUrl(p)} alt="Avatar" />
                      <div className="profile-content">
                        <h3>{p.nombre_completo || 'Nombre no disponible'}</h3>
                        <p className="profile-role">
                          {p.tipo === 'estudiante' ? 'Estudiante' : p.tipo === 'docente' ? 'Docente' : 'Egresado'}
                        </p>
                        <p className="profile-email">{p.correo_institucional || 'Correo no disponible'}</p>
                        {p.habilidades && (
                          <div className="profile-skills">
                            <span>{p.habilidades.split(',').slice(0, 2).join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="featured-actions">
                        <Link to={`/perfil/${p.tipo}/${p.id}`} className="view-profile-btn">Ver Perfil →</Link>
                        <button className="match-btn" onClick={() => handleLike(p)}>💫 Conectar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                        <Link to={`/perfil/${p.tipo}/${p.id}`} className="profile-link">Ver Perfil Completo</Link>
                        <a href={`mailto:${p.correo_institucional}`} className="contact-btn">✉️ Contactar</a>
                        <button className="match-btn" onClick={() => handleLike(p)}>💫 Conectar</button>
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
            <p>Únete a nuestra comunidad y comienza a conectar con personas increíbles</p>
            <div className="cta-buttons">
              <Link to="/" className="cta-btn primary">🚀 Únete a StudySphere</Link>
              <button className="cta-btn secondary" onClick={() => setViewMode(viewMode === 'matching' ? 'lista' : 'matching')}>
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
