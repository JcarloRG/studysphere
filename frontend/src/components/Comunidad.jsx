// src/components/Comunidad.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import AppHeader from './AppHeader';
import './Comunidad.css';

// 🌟 HOOK DE AUTENTICACIÓN
const useAuth = () => {
  const storedId = localStorage.getItem('currentUserId');
  const storedType = localStorage.getItem('currentUserType');
  const currentUserId = storedId ? Number(storedId) : null;
  const currentUserType = storedType || null;
  return { currentUserId, currentUserType };
};

// Fallback de iniciales por si la imagen falla
const avatarFromName = (name = 'Usuario') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const svg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#6EE7F9'/>
          <stop offset='100%' stop-color='#A78BFA'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle'
            font-family='Inter, Arial' font-size='56' fill='white' font-weight='700'>${initials}</text>
    </svg>`);
  return `data:image/svg+xml;charset=utf-8,${svg}`;
};

const Comunidad = () => {
  const { currentUserId, currentUserType } = useAuth();

  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [egresados, setEgresados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [perfilesRecomendados, setPerfilesRecomendados] = useState([]);
  const [perfilActualIndex, setPerfilActualIndex] = useState(0);
  const [colaboraciones, setColaboraciones] = useState([]); // ahora viene de mis matches
  const [viewMode, setViewMode] = useState('lista');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [lastCollaboratedUser, setLastCollaboratedUser] = useState(null);

  // ---- Swipe (arrastrar la tarjeta como en Tinder) ----
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState(null); // 'like' | 'pass' | null
  const dragStartX = useRef(0);
  const cardRef = useRef(null);
  const SWIPE_THRESHOLD = 110;

  const filters = [
    { id: 'todos', label: '👥 Todos', emoji: '👥' },
    { id: 'estudiante', label: '🎓 Estudiantes', emoji: '🎓' },
    { id: 'docente', label: '📚 Docentes', emoji: '📚' },
    { id: 'egresado', label: '💼 Egresados', emoji: '💼' },
  ];

  useEffect(() => {
    cargarComunidad();
    if (currentUserId && currentUserType) {
      cargarMisMatches();
      cargarRecomendados();
    } else {
      setPerfilesRecomendados([]);
      setColaboraciones([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, currentUserType]);

  // ----- helpers de imagen -----
  const buildMediaUrl = (rel) => {
    if (!rel) return null;
    const host = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    if (/^https?:\/\//i.test(rel)) return rel;
    return `${host}${rel.startsWith('/') ? '' : '/'}${rel}`;
  };

  const getAvatarUrl = (perfil) => {
    const rel = perfil?.foto_url || perfil?.foto;
    if (rel) return buildMediaUrl(rel);
    if (perfil?.tipo === 'docente') return '/avatar-docente.png';
    if (perfil?.tipo === 'egresado') return '/avatar-egresado.png';
    return '/avatar-default.png';
  };

  // Normaliza el id que venga de cada endpoint
  const normalizeId = (o) =>
    o?.id ?? o?.estudiante_id ?? o?.docente_id ?? o?.egresado_id ?? o?._id ?? null;

  // 🌟 FILTRAR MI PERFIL
  const filtrarMiPerfil = (perfiles) => {
    if (!currentUserId || !currentUserType) return perfiles;
    return perfiles.filter(
      (p) => !(Number(p.id) === currentUserId && p.tipo === currentUserType)
    );
  };

  // Cargar comunidad (solo listas base)
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
    } catch (err) {
      setError('Error al cargar la comunidad: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Cargar matches del usuario (para el contador de colaboraciones de la
  // portada; el badge de pendientes en el nav ahora lo maneja AppHeader)
  const cargarMisMatches = async () => {
    try {
      // Solo aceptadas, para que el contador de la portada no mezcle
      // pendientes/rechazadas con colaboraciones reales
      const res = await apiService.obtenerMisMatches('aceptado');
      if (res.success) {
        setColaboraciones(res.matches || []);
      } else {
        console.error('Error obteniendo mis matches:', res.message);
      }
    } catch (err) {
      console.error('Error al obtener mis matches:', err);
    }
  };

  // 🔍 Recomendaciones desde el backend de matchs
  const cargarRecomendados = async () => {
    if (!currentUserId || !currentUserType) {
      setPerfilesRecomendados([]);
      return;
    }
    try {
      const res = await apiService.obtenerMatchesPotenciales();
      if (res.success) {
        const arr = res.matches || [];
        // Normalizamos para que encaje con la interfaz
        const normalizados = filtrarMiPerfil(
          arr.map((p) => ({
            ...p,
            id: normalizeId(p),
            // El backend manda "carrera"; la adaptamos a lo que usa la UI
            carrera_actual: p.carrera_actual || p.carrera || '',
            carrera_egreso: p.carrera_egreso || p.carrera || '',
          }))
        );
        setPerfilesRecomendados(normalizados);
        setPerfilActualIndex(0);
      } else {
        console.error('Error al obtener recomendaciones:', res.message);
      }
    } catch (err) {
      console.error('Error al cargar recomendaciones:', err);
    }
  };

  // COLABORACIÓN (usa sistema de matchs del backend)
  const handleColaborar = async (perfil) => {
    if (!currentUserId || !currentUserType) {
      setError('Debes iniciar sesión para enviar solicitudes de colaboración.');
      return;
    }
    try {
      const res = await apiService.enviarSolicitudMatch(perfil.id, perfil.tipo);
      if (!res.success) {
        setError(res.message || 'Error al enviar solicitud de colaboración');
        return;
      }

      setLastCollaboratedUser(perfil);
      setShowCollaborationModal(true);
      setMensajeExito(res.message || '¡Solicitud de colaboración enviada!');

      // Refrescamos contador de colaboraciones
      cargarMisMatches();

      setTimeout(() => setMensajeExito(''), 2500);
    } catch {
      setError('Error al enviar solicitud de colaboración');
    }

    if (viewMode === 'descubrir') {
      siguientePerfil();
    }
  };

  const handlePass = () => siguientePerfil();

  const siguientePerfil = () =>
    setPerfilActualIndex((prev) =>
      prev >= perfilesRecomendados.length - 1 ? 0 : prev + 1
    );

  // Al pasar al siguiente perfil, la tarjeta nueva siempre arranca centrada
  useEffect(() => {
    setDragX(0);
    setFlyDirection(null);
  }, [perfilActualIndex]);

  const triggerLike = () => {
    if (flyDirection) return; // ya está animando, ignora doble clic/gesto
    setFlyDirection('like');
    setTimeout(() => handleColaborar(perfilActual), 180);
  };

  const triggerPass = () => {
    if (flyDirection) return;
    setFlyDirection('pass');
    setTimeout(() => handlePass(), 180);
  };

  const onDragStart = (clientX) => {
    if (flyDirection) return;
    setDragging(true);
    dragStartX.current = clientX;
  };

  const onDragMove = (clientX) => {
    if (!dragging) return;
    setDragX(clientX - dragStartX.current);
  };

  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);

    if (dragX > SWIPE_THRESHOLD) {
      triggerLike();
    } else if (dragX < -SWIPE_THRESHOLD) {
      triggerPass();
    } else {
      setDragX(0);
    }
  };

  const handlePointerDown = (e) => onDragStart(e.clientX);
  const handlePointerMove = (e) => onDragMove(e.clientX);
  const handlePointerUp = () => onDragEnd();
  const handleTouchStart = (e) => onDragStart(e.touches[0].clientX);
  const handleTouchMove = (e) => onDragMove(e.touches[0].clientX);
  const handleTouchEnd = () => onDragEnd();

  // Filtro de respaldo en Frontend (excluir logueado + búsqueda)
  const getPerfilesFiltrados = () => {
    let perfiles = [];
    const isTodos = activeFilter === 'todos';

    if (isTodos || activeFilter === 'estudiante')
      perfiles = [
        ...perfiles,
        ...estudiantes.map((e) => ({
          ...e,
          tipo: 'estudiante',
          id: normalizeId(e),
        })),
      ];
    if (isTodos || activeFilter === 'docente')
      perfiles = [
        ...perfiles,
        ...docentes.map((d) => ({
          ...d,
          tipo: 'docente',
          id: normalizeId(d),
        })),
      ];
    if (isTodos || activeFilter === 'egresado')
      perfiles = [
        ...perfiles,
        ...egresados.map((g) => ({
          ...g,
          tipo: 'egresado',
          id: normalizeId(g),
        })),
      ];

    // Excluir mi propio perfil también en lista
    perfiles = filtrarMiPerfil(perfiles);

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

  const getTipoIcon = (tipo) =>
    tipo === 'estudiante'
      ? '🎓'
      : tipo === 'docente'
      ? '📚'
      : tipo === 'egresado'
      ? '💼'
      : '👤';

  const getTipoColor = (tipo) =>
    tipo === 'estudiante'
      ? '#667eea'
      : tipo === 'docente'
      ? '#ff6b6b'
      : tipo === 'egresado'
      ? '#4ecdc4'
      : '#6b7280';

  // Convierte "Python, React, UX" -> ['Python','React','UX'], recortado a `max`
  const parseTags = (texto, max = 4) => {
    if (!texto) return [];
    return texto
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, max);
  };

  const compatTier = (score) => {
    if (score === null || score === undefined) return 'sin-datos';
    if (score >= 75) return 'alta';
    if (score >= 45) return 'media';
    return 'baja';
  };

  const compatLabel = (score) => {
    if (score === null || score === undefined) return 'Completa tu perfil para ver tu compatibilidad';
    if (score >= 75) return 'Alta afinidad académica';
    if (score >= 45) return 'Afinidad moderada';
    return 'Afinidad parcial';
  };

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

      <AppHeader />

      <div className="comunidad-content">
        {/* HERO */}
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

            <div className="view-mode-selector">
              <button
                className={`mode-btn ${viewMode === 'descubrir' ? 'active' : ''}`}
                onClick={() => setViewMode('descubrir')}
              >
                🔍 Descubrir
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
            <button onClick={cargarComunidad} className="retry-btn">
              🔄 Reintentar
            </button>
          </div>
        )}

        {/* Modal de Colaboración */}
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
                <p>
                  Tu solicitud de colaboración ha sido enviada correctamente a{' '}
                  <strong>{lastCollaboratedUser?.nombre_completo}</strong>
                </p>
                <p className="modal-subtext">
                  Te notificaremos cuando respondan a tu solicitud
                </p>
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
              <p>Desliza a la derecha para colaborar, a la izquierda para pasar</p>
            </div>

            {loading ? (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Buscando colaboradores académicos...</p>
              </div>
            ) : perfilesRecomendados.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No hay perfiles para mostrar</h3>
                <p>No se encontraron otros perfiles en la comunidad</p>
                <button onClick={cargarRecomendados} className="reload-btn">
                  🔄 Recargar sugerencias
                </button>
              </div>
            ) : perfilActual ? (
              <div className="matching-card-container">
                <div
                  ref={cardRef}
                  className={`matching-card ${flyDirection ? `fly-${flyDirection}` : ''} ${dragging ? 'dragging' : ''}`}
                  style={
                    flyDirection
                      ? undefined
                      : {
                          transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
                          transition: dragging ? 'none' : 'transform 0.3s ease',
                        }
                  }
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Sellos de LIKE / PASS que aparecen mientras arrastras */}
                  <div
                    className="swipe-stamp swipe-stamp-like"
                    style={{ opacity: Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1) }}
                  >
                    Colaborar
                  </div>
                  <div
                    className="swipe-stamp swipe-stamp-pass"
                    style={{ opacity: Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1) }}
                  >
                    Pasar
                  </div>

                  <div className={`compatibility-badge tier-${compatTier(perfilActual.compatibilidad)}`}>
                    {perfilActual.compatibilidad !== null && perfilActual.compatibilidad !== undefined ? (
                      <span className="compatibility-score">{perfilActual.compatibilidad}%</span>
                    ) : (
                      <span className="compatibility-score compatibility-score-empty">—</span>
                    )}
                    <span>{compatLabel(perfilActual.compatibilidad)}</span>
                  </div>

                  <div className="matching-avatar-wrap">
                    <img
                      className="avatar avatar-xl"
                      src={getAvatarUrl(perfilActual)}
                      alt="Avatar"
                      draggable="false"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = avatarFromName(
                          perfilActual?.nombre_completo
                        );
                      }}
                    />
                  </div>

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
                        {perfilActual.tipo === 'estudiante' &&
                          `Estudiante - ${
                            perfilActual.carrera_actual || perfilActual.carrera || 'Carrera'
                          }`}
                        {perfilActual.tipo === 'docente' &&
                          `Docente - ${
                            perfilActual.carrera_egreso ||
                            perfilActual.carrera ||
                            'Especialidad'
                          }`}
                        {perfilActual.tipo === 'egresado' &&
                          `Egresado - ${
                            perfilActual.carrera_egreso ||
                            perfilActual.carrera ||
                            'Profesión'
                          }`}
                      </p>
                      <div className="availability-tag disponible">
                        Disponible para colaborar
                      </div>
                    </div>
                  </div>

                  <div className="profile-contact">
                    <p className="profile-email">
                      📧 {perfilActual.correo_institucional || 'Correo no disponible'}
                    </p>
                  </div>

                  {parseTags(perfilActual.area_interes, 4).length > 0 && (
                    <div className="profile-skills-section">
                      <h4>Le interesa</h4>
                      <div className="skills-tags">
                        {parseTags(perfilActual.area_interes, 4).map((s, i) => (
                          <span key={i} className="skill-tag interes-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parseTags(perfilActual.habilidades, 4).length > 0 && (
                    <div className="profile-skills-section">
                      <h4>Habilidades</h4>
                      <div className="skills-tags">
                        {parseTags(perfilActual.habilidades, 4).map((s, i) => (
                          <span key={i} className="skill-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="matching-actions">
                    <button className="pass-btn" onClick={triggerPass}>
                      <span className="action-icon">✕</span>Pasar
                    </button>
                    <button
                      className="like-btn"
                      onClick={triggerLike}
                    >
                      <span className="action-icon">🤝</span>Colaborar
                    </button>
                  </div>
                </div>

                <p className="matching-counter">
                  {perfilActualIndex + 1} de {perfilesRecomendados.length} sugerencias
                </p>
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
                </div>
                <div className="filter-buttons">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(f.id)}
                    >
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
                  {perfilesFiltrados.length === 1
                    ? 'miembro encontrado'
                    : 'miembros encontrados'}
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
                  <button onClick={cargarComunidad} className="reload-btn">
                    🔄 Recargar
                  </button>
                </div>
              ) : (
                <div className="members-grid">
                  {perfilesFiltrados.map((p, i) => (
                    <div key={`${p.tipo}-${p.id || i}`} className="member-card">
                      <div className="member-header">
                        <img
                          className="avatar avatar-sm"
                          src={getAvatarUrl(p)}
                          alt="Avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = avatarFromName(p?.nombre_completo);
                          }}
                        />
                        <div className="member-info">
                          <h3>{p.nombre_completo || 'Nombre no disponible'}</h3>
                          <p className="member-role">
                            {p.tipo === 'estudiante' &&
                              `Estudiante - ${p.carrera_actual || 'Carrera'}`}
                            {p.tipo === 'docente' &&
                              `Docente - ${p.carrera_egreso || 'Especialidad'}`}
                            {p.tipo === 'egresado' &&
                              `Egresado - ${p.carrera_egreso || 'Profesión'}`}
                          </p>
                        </div>
                      </div>

                      <div className="member-details">
                        <p className="member-email">
                          📧 {p.correo_institucional || 'Correo no disponible'}
                        </p>
                        {parseTags(p.habilidades, 3).length > 0 && (
                          <div className="member-skills">
                            <strong>Habilidades</strong>
                            <div className="skills-tags">
                              {parseTags(p.habilidades, 3).map((s, i) => (
                                <span key={i} className="skill-tag skill-tag-sm">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseTags(p.area_interes, 3).length > 0 && (
                          <div className="member-interests">
                            <strong>Le interesa</strong>
                            <div className="skills-tags">
                              {parseTags(p.area_interes, 3).map((s, i) => (
                                <span key={i} className="skill-tag skill-tag-sm interes-tag">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="member-actions">
                        <Link
                          to={`/perfil/${p.tipo}/${p.id}`}
                          className="profile-link"
                        >
                          Ver Perfil Completo
                        </Link>
                        <a
                          href={`mailto:${p.correo_institucional}`}
                          className="contact-btn"
                        >
                          ✉️ Contactar
                        </a>
                        <button
                          className="match-btn"
                          onClick={() => handleColaborar(p)}
                        >
                          🤝 Colaborar
                        </button>
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
              <Link to="/proyectos" className="cta-btn primary">
                🔍 Busca Proyectos
              </Link>
              <button
                className="cta-btn secondary"
                onClick={() =>
                  setViewMode(viewMode === 'descubrir' ? 'lista' : 'descubrir')
                }
              >
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