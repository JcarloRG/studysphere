// src/components/Perfil.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import './Perfil.css';
import AppHeader from './AppHeader';

// 🌟 Simulación de autenticación
const useAuth = () => {
  const storedId = localStorage.getItem('currentUserId');
  const storedType = localStorage.getItem('currentUserType');
  const currentUserId = storedId ? Number(storedId) : null;
  const currentUserType = storedType || null;
  return { currentUserId, currentUserType, isAdmin: currentUserId === 1 };
};

const Perfil = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { currentUserId, currentUserType, isAdmin } = useAuth();
  const perfilId = Number(id);
  const isOwner = perfilId === currentUserId && tipo === currentUserType;

  // ===== Centro de Notificaciones (UI local) =====
  const [notifFilter, setNotifFilter] = useState('all'); // all | match | system
  const [notifs, setNotifs] = useState([
    {
      id: 101,
      type: 'match', // 'match' | 'system' | 'message'
      title: '¡Nuevo match de proyecto!',
      description: '“Clasificador COVID-19 con Random Forest” busca un perfil como el tuyo.',
      time: 'Hace 2 min',
      read: false,
      ctaLabel: 'Ver proyecto',
      ctaPath: '/proyectos/busqueda?match=101'
    },
    {
      id: 102,
      type: 'system',
      title: 'Verificación de correo completada',
      description: 'Tu correo institucional ya fue verificado correctamente.',
      time: 'Hoy, 10:15',
      read: false
    },
    {
      id: 103,
      type: 'match',
      title: 'Invitación a equipo',
      description: 'Docente “F. Torres” te invitó a unirte al equipo de Redes (WAN).',
      time: 'Ayer',
      read: true,
      ctaLabel: 'Revisar invitación',
      ctaPath: '/comunidad?inv=103'
    }
  ]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id) => {
    setNotifs(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearRead = () => {
    setNotifs(prev => prev.filter(n => !n.read));
  };

  const filteredNotifs = notifs.filter(n => {
    if (notifFilter === 'all') return true;
    if (notifFilter === 'match') return n.type === 'match';
    if (notifFilter === 'system') return n.type === 'system';
    return true;
  });

  // Helper URL media
  const buildMediaUrl = (rel) => {
    if (!rel) return null;
    const host = API_BASE_URL.replace(/\/api\/?$/, '');
    return rel.startsWith('http') ? rel : `${host}${rel}`;
  };

  // Carga de perfil
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

  // Acciones
  const handleEditar = () => navigate(`/editar/${tipo}/${id}`);
  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserType');
    navigate('/');
  };
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
  const handleContactar = () => {
    if (!perfil) return;
    const subject = `Interés en colaborar - ${perfil.nombre_completo}`;
    const body = `Hola ${perfil.nombre_completo},\n\nMe interesa colaborar contigo...`;
    window.location.href = `mailto:${perfil.correo_institucional}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Foto
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

  // Contenido por pestaña
  const renderTabContent = () => {
    if (!perfil) return null;

    if (activeTab === 'info') {
      return (
        <>
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

              {tipo === 'estudiante' && (
                <>
                  <div className="info-item-custom">
                    <label>Núm. Control</label>
                    <p>{perfil.numero_control}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Carrera Actual</label>
                    <p>{perfil.carrera_actual}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Semestre</label>
                    <p>{perfil.semestre || 'N/E'}</p>
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
                    <label>Carrera Egreso</label>
                    <p>{perfil.carrera_egreso}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Carreras Imparte</label>
                    <p>{perfil.carreras_imparte || 'N/E'}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Grado</label>
                    <p>{perfil.grado_academico || 'N/E'}</p>
                  </div>
                </>
              )}

              {tipo === 'egresado' && (
                <>
                  <div className="info-item-custom">
                    <label>Carrera Egreso</label>
                    <p>{perfil.carrera_egreso}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Año Egreso</label>
                    <p>{perfil.anio_egreso}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Ocupación</label>
                    <p>{perfil.ocupacion_actual || 'N/E'}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Empresa</label>
                    <p>{perfil.empresa || 'N/E'}</p>
                  </div>
                  <div className="info-item-custom">
                    <label>Puesto</label>
                    <p>{perfil.puesto || 'N/E'}</p>
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
                          Ver Perfil
                        </a>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ====== Centro de Notificaciones ====== */}
          <section className="notifs-card">
            <div className="notifs-header">
              <div className="notifs-header-left">
                <h3 className="notifs-title">🔔 Centro de Notificaciones</h3>
                <span className={`badge ${unreadCount ? 'badge--active' : ''}`}>
                  {unreadCount} sin leer
                </span>
              </div>
              <div className="notifs-actions">
                <button className="btn-ghost" onClick={markAllRead} disabled={!unreadCount}>
                  Marcar todo leído
                </button>
                <button
                  className="btn-ghost danger"
                  onClick={clearRead}
                  disabled={notifs.filter(n => n.read).length === 0}
                >
                  Limpiar leídos
                </button>
              </div>
            </div>

            <div className="notifs-filters">
              <button
                className={`pill ${notifFilter === 'all' ? 'pill--active' : ''}`}
                onClick={() => setNotifFilter('all')}
              >
                Todos
              </button>
              <button
                className={`pill ${notifFilter === 'match' ? 'pill--active' : ''}`}
                onClick={() => setNotifFilter('match')}
              >
                Coincidencias
              </button>
              <button
                className={`pill ${notifFilter === 'system' ? 'pill--active' : ''}`}
                onClick={() => setNotifFilter('system')}
              >
                Sistema
              </button>
            </div>

            <div className="notifs-list">
              {filteredNotifs.length === 0 ? (
                <div className="notifs-empty">
                  <p>No hay notificaciones para este filtro.</p>
                </div>
              ) : (
                filteredNotifs.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => !n.read && markRead(n.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="notif-icon">
                      {n.type === 'match' && <span>🎯</span>}
                      {n.type === 'system' && <span>🛠️</span>}
                      {n.type === 'message' && <span>✉️</span>}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title-row">
                        <h4 className="notif-title">{n.title}</h4>
                        <span className="notif-time">{n.time}</span>
                      </div>
                      <p className="notif-desc">{n.description}</p>
                      <div className="notif-cta-row">
                        {!n.read && <span className="dot-unread" />}
                        {n.ctaLabel && (
                          <button
                            className="notif-cta"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.ctaPath) navigate(n.ctaPath);
                            }}
                          >
                            {n.ctaLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      );
    }

    if (activeTab === 'habilidades') {
      const hasContent =
        perfil.habilidades || perfil.area_interes || perfil.competencias || perfil.logros;
      return (
        <div className="info-section-custom full-width">
          <h3 className="section-title-custom">🚀 Habilidades y Logros</h3>
          {hasContent ? (
            <div className="info-grid-custom">
              {perfil.habilidades && (
                <div className="info-item-custom full-width">
                  <label>Habilidades</label>
                  <p>{perfil.habilidades}</p>
                </div>
              )}
              {perfil.area_interes && (
                <div className="info-item-custom full-width">
                  <label>Áreas de Interés</label>
                  <p>{perfil.area_interes}</p>
                </div>
              )}
              {perfil.competencias && (
                <div className="info-item-custom full-width">
                  <label>Competencias</label>
                  <p>{perfil.competencias}</p>
                </div>
              )}
              {perfil.logros && (
                <div className="info-item-custom full-width">
                  <label>Logros / Experiencia</label>
                  <p>{perfil.logros}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="no-content-message">No se han especificado habilidades, logros o intereses.</p>
          )}
        </div>
      );
    }

    return <p className="no-content-message">Selecciona una pestaña para ver el contenido.</p>;
  };

  if (loading) return <div className="perfil-container" />;
  if (error || !perfil) return <div className="perfil-container" />;

  const finalAvatarUrl =
    tipo === 'estudiante'
      ? perfil?.foto
        ? buildMediaUrl(perfil.foto)
        : '/avatar-default.png'
      : '/avatar-default.png';

  return (
    <div className="perfil-container">
      {/* Header - El botón de logout ya está en AppHeader */}
      <AppHeader onLogout={handleLogout} onGoCommunity={() => navigate('/comunidad')} />

      {/* Resumen superior */}
      <section className="perfil-summary-card">
        <div className="perfil-summary-left">
          <div className="perfil-avatar-wrap perfil-avatar-wrap--summary">
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

          <div className="perfil-summary-title">
            <div className="header-with-emoji" style={{ gap: 10 }}>
              <span className="perfil-emoji">
                {tipo === 'estudiante' && '🎓'}
                {tipo === 'docente' && '📚'}
                {tipo === 'egresado' && '💡'}
              </span>
              <h1 className="perfil-title">Perfil de {perfil.nombre_completo}</h1>
            </div>
            <div className="perfil-badges">
              <span className="chip chip--type">{tipo}</span>
              {perfil.correo_institucional && <span className="chip">{perfil.correo_institucional}</span>}
            </div>
          </div>
        </div>

        <nav className="perfil-tabs perfil-tabs--summary">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Información Personal
          </button>
          <button
            className={`tab-btn ${activeTab === 'habilidades' ? 'active' : ''}`}
            onClick={() => setActiveTab('habilidades')}
          >
            Habilidades y Logros
          </button>
        </nav>
      </section>

      {/* Grid principal */}
      <div className="perfil-grid-layout perfil-grid-layout--pro">
        {/* Columna izquierda */}
        <div className="perfil-content-wrapper">
          <div className="perfil-tab-content">{renderTabContent()}</div>
        </div>

        {/* Columna derecha */}
        <aside className="perfil-sidebar perfil-sidebar--pro">
          <div className="sidebar-card meta-card">
            <h3 className="sidebar-title">🗂️ Ficha</h3>
            <dl className="kv">
              <div className="kv-row">
                <dt>Registrado</dt>
                <dd>
                  {new Date(perfil.fecha_registro).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
              {tipo === 'estudiante' && (
                <>
                  <div className="kv-row">
                    <dt>No. Control</dt>
                    <dd>{perfil.numero_control}</dd>
                  </div>
                  <div className="kv-row">
                    <dt>Semestre</dt>
                    <dd>{perfil.semestre || 'N/E'}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">{isOwner ? '🔧 Gestión de Perfil' : '🤝 Interacción'}</h3>
            <div className="sidebar-actions-group">
              {!isOwner && (
                <button onClick={handleContactar} className="sidebar-btn contactar-btn">
                  <span className="btn-icon">✉️</span> Contactar
                </button>
              )}
              {(isOwner || isAdmin) && (
                <button onClick={handleEditar} className="sidebar-btn editar-btn">
                  <span className="btn-icon">✏️</span> Editar Perfil
                </button>
              )}
              {(isOwner || isAdmin) && (
                <button onClick={handleEliminar} className="sidebar-btn eliminar-btn">
                  <span className="btn-icon">🗑️</span> Eliminar Perfil
                </button>
              )}
              {/* 🌟 BOTÓN DE CERRAR SESIÓN ELIMINADO - Ya está en AppHeader */}
            </div>
          </div>

          {/* 🌟 SECCIÓN "CONECTA Y EXPLORA" ELIMINADA - Ya está en AppHeader */}
        </aside>
      </div>
    </div>
  );
};

export default Perfil;