// src/components/Perfil.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import './Perfil.css';
import AppHeader from './AppHeader';

// Simulación de autenticación: lee del localStorage
const useAuth = () => {
  const storedId = localStorage.getItem('currentUserId');
  const storedType = localStorage.getItem('currentUserType');
  const currentUserId = storedId ? Number(storedId) : null;
  const currentUserType = storedType || null;
  return { currentUserId, currentUserType };
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

  const { currentUserId, currentUserType } = useAuth();
  const perfilId = Number(id);
  const isOwner = perfilId === currentUserId && tipo === currentUserType;

  // ==== Estado de MATCH con este perfil ====
  const [matchState, setMatchState] = useState({
    loading: false,
    estado: 'no_match', // no_match | pendiente | aceptado | error
    matchId: null,
    error: '',
  });

  // ==== Proyectos de este perfil ====
  const [proyectos, setProyectos] = useState([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [errorProyectos, setErrorProyectos] = useState('');
  const [nuevoProyecto, setNuevoProyecto] = useState({
    titulo: '',
    tipo_proyecto: 'proyecto', // proyecto | curso | tesis | otro
    descripcion: '',
    tecnologias: '',
    link_repo: '',
    link_demo: '',
  });

  // ===== Centro de Notificaciones (UI local de ejemplo) =====
  const [notifFilter, setNotifFilter] = useState('all'); // all | match | system
  const [notifs, setNotifs] = useState([
    {
      id: 101,
      type: 'match',
      title: '¡Nuevo match de proyecto!',
      description:
        '"Clasificador COVID-19 con Random Forest" busca un perfil como el tuyo.',
      time: 'Hace 2 min',
      read: false,
      ctaLabel: 'Ver proyecto',
      ctaPath: '/proyectos/busqueda?match=101',
    },
    {
      id: 102,
      type: 'system',
      title: 'Verificación de correo completada',
      description: 'Tu correo institucional ya fue verificado correctamente.',
      time: 'Hoy, 10:15',
      read: false,
    },
    {
      id: 103,
      type: 'match',
      title: 'Invitación a equipo',
      description:
        'Docente "F. Torres" te invitó a unirte al equipo de Redes (WAN).',
      time: 'Ayer',
      read: true,
      ctaLabel: 'Revisar invitación',
      ctaPath: '/comunidad?inv=103',
    },
  ]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = (id) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearRead = () => {
    setNotifs((prev) => prev.filter((n) => !n.read));
  };

  const filteredNotifs = notifs.filter((n) => {
    if (notifFilter === 'all') return true;
    if (notifFilter === 'match') return n.type === 'match';
    if (notifFilter === 'system') return n.type === 'system';
    return true;
  });

  // Helper URL media
  const buildMediaUrl = (rel) => {
    if (!rel) return '/static/images/default-avatar.png';
    const host = API_BASE_URL.replace(/\/api\/?$/, '');
    return rel.startsWith('http') ? rel : `${host}${rel}`;
  };

  // Carga de perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        let result;
        if (tipo === 'estudiante')
          result = await apiService.getPerfilEstudiante(id);
        else if (tipo === 'docente')
          result = await apiService.getPerfilDocente(id);
        else if (tipo === 'egresado')
          result = await apiService.getPerfilEgresado(id);
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

  // Cargar estado de match SOLO si hay usuario logueado y no es dueño
  useEffect(() => {
    const cargarMatch = async () => {
      if (!currentUserId || !currentUserType) return;
      if (isOwner) return;

      try {
        setMatchState((prev) => ({ ...prev, loading: true, error: '' }));
        const res = await apiService.verificarEstadoMatch(perfilId);
        if (res.success) {
          setMatchState({
            loading: false,
            estado: res.estado || res.data?.estado || 'no_match',
            matchId: res.data?.match_id || null,
            error: '',
          });
        } else {
          setMatchState({
            loading: false,
            estado: 'error',
            matchId: null,
            error: res.message || 'No se pudo obtener el estado de match',
          });
        }
      } catch (err) {
        console.error('Error al cargar estado de match:', err);
        setMatchState({
          loading: false,
          estado: 'error',
          matchId: null,
          error: err.message || 'Error al consultar estado de match',
        });
      }
    };

    cargarMatch();
  }, [currentUserId, currentUserType, isOwner, perfilId]);

  // Cargar proyectos de este perfil
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        setLoadingProyectos(true);
        setErrorProyectos('');
        const res = await apiService.getProyectosPorPerfil(tipo, id);
        if (res.success) {
          setProyectos(res.data || []);
        } else {
          setErrorProyectos(
            res.message || 'No se pudieron cargar los proyectos.'
          );
        }
      } catch (err) {
        console.error('Error al cargar proyectos:', err);
        setErrorProyectos(err.message || 'Error al cargar proyectos.');
      } finally {
        setLoadingProyectos(false);
      }
    };

    if (tipo && id) cargarProyectos();
  }, [tipo, id]);

  // Acciones de perfil
  const handleEditar = () => navigate(`/editar/${tipo}/${id}`);
  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserType');
    navigate('/');
  };

  const handleEliminar = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar tu perfil de ${tipo}? Esta acción es permanente y no se puede deshacer.`
      )
    )
      return;

    if (
      !window.confirm(
        `CONFIRMACIÓN FINAL: Esta acción eliminará tu cuenta y todos tus datos permanentemente. ¿Continuar?`
      )
    )
      return;

    try {
      let result;
      if (tipo === 'estudiante') result = await apiService.deleteEstudiante(id);
      else if (tipo === 'docente')
        result = await apiService.deleteDocente(id);
      else if (tipo === 'egresado')
        result = await apiService.deleteEgresado(id);

      if (result.success) {
        alert('Perfil eliminado exitosamente');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUserType');
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
    window.location.href = `mailto:${perfil.correo_institucional}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  // ====== MATCH: acciones ======
  const handleEnviarMatch = async () => {
    if (!currentUserId || !currentUserType) {
      alert('Debes iniciar sesión para enviar una solicitud de colaboración.');
      return;
    }

    try {
      setMatchState((prev) => ({ ...prev, loading: true, error: '' }));
      const res = await apiService.enviarSolicitudMatch(perfilId, tipo);
      console.log('Respuesta enviarSolicitudMatch (Perfil):', res);

      if (res.success) {
        const estado = res.data?.estado || 'pendiente';
        const matchId = res.data?.match_id || null;
        setMatchState({
          loading: false,
          estado,
          matchId,
          error: '',
        });
        alert(res.message || 'Solicitud de colaboración enviada.');
      } else {
        setMatchState((prev) => ({
          ...prev,
          loading: false,
          error: res.message || 'Error al enviar la solicitud',
        }));
        alert(res.message || 'Error al enviar la solicitud de match');
      }
    } catch (err) {
      console.error('Error en handleEnviarMatch:', err);
      setMatchState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al enviar la solicitud',
      }));
      alert(
        'Error al enviar la solicitud de colaboración: ' +
          (err.message || 'Error desconocido')
      );
    }
  };

  const handleCancelarMatch = async () => {
    if (!matchState.matchId) {
      alert('No hay match para cancelar.');
      return;
    }
    if (
      !window.confirm(
        '¿Seguro que quieres cancelar/rechazar esta colaboración?'
      )
    )
      return;

    try {
      setMatchState((prev) => ({ ...prev, loading: true, error: '' }));
      const res = await apiService.rechazarMatch(matchState.matchId);
      console.log('Respuesta rechazarMatch (Perfil):', res);

      if (res.success) {
        setMatchState({
          loading: false,
          estado: 'no_match',
          matchId: null,
          error: '',
        });
        alert(res.message || 'Match cancelado.');
      } else {
        setMatchState((prev) => ({
          ...prev,
          loading: false,
          error: res.message || 'Error al cancelar el match',
        }));
        alert(res.message || 'Error al cancelar el match');
      }
    } catch (err) {
      console.error('Error en handleCancelarMatch:', err);
      setMatchState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al cancelar el match',
      }));
      alert(
        'Error al cancelar el match: ' + (err.message || 'Error desconocido')
      );
    }
  };

  // ===================== PROYECTOS: handlers =====================

  const handleNuevoProyectoChange = (e) => {
    const { name, value } = e.target;
    setNuevoProyecto((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    if (!nuevoProyecto.titulo || !nuevoProyecto.descripcion) {
      alert('Título y descripción son obligatorios.');
      return;
    }

    try {
      const res = await apiService.crearProyecto(nuevoProyecto);
      if (res.success) {
        const creado = res.data || nuevoProyecto;
        // lo añadimos al inicio
        setProyectos((prev) => [creado, ...prev]);
        setNuevoProyecto({
          titulo: '',
          tipo_proyecto: 'proyecto',
          descripcion: '',
          tecnologias: '',
          link_repo: '',
          link_demo: '',
        });
        alert(res.message || 'Proyecto creado correctamente.');
      } else {
        alert(res.message || 'Error al crear proyecto.');
      }
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      alert(
        'Error al crear proyecto: ' + (err.message || 'Error desconocido')
      );
    }
  };

  // ===================== FUNCIONALIDAD MEJORADA DE FOTOS =====================

  const onPickFile = () => {
    if (!isOwner) return;
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar 3MB.');
      e.target.value = '';
      return;
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExt = file.name.toLowerCase().split('.').pop();
    if (!allowedExtensions.includes('.' + fileExt)) {
      alert('Solo se permiten imágenes JPG, PNG o GIF.');
      e.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      let result;

      if (tipo === 'estudiante') {
        result = await apiService.updateEstudianteFoto(id, file);
      } else if (tipo === 'docente') {
        result = await apiService.updateDocenteFoto(id, file);
      } else if (tipo === 'egresado') {
        result = await apiService.updateEgresadoFoto(id, file);
      }

      if (result.success) {
        const nuevaFoto = result.data?.foto;
        if (nuevaFoto) {
          setPerfil((prev) => ({ ...prev, foto: nuevaFoto }));
          alert('✅ Foto actualizada correctamente');
        }
      } else {
        alert(
          '❌ Error al actualizar la foto: ' +
            (result.message || 'Error desconocido')
        );
      }
    } catch (err) {
      alert(
        '❌ Error al actualizar la foto: ' +
          (err.message || 'Error de conexión')
      );
      console.error('Error actualizando foto:', err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const eliminarFoto = async () => {
    if (
      !isOwner ||
      !window.confirm(
        '¿Estás seguro de que quieres eliminar tu foto de perfil?'
      )
    ) {
      return;
    }

    try {
      setIsUploading(true);
      let result;

      if (tipo === 'estudiante') {
        result = await apiService.deleteEstudianteFoto(id);
      } else if (tipo === 'docente') {
        result = await apiService.deleteDocenteFoto(id);
      } else if (tipo === 'egresado') {
        result = await apiService.deleteEgresadoFoto(id);
      }

      if (result.success) {
        setPerfil((prev) => ({ ...prev, foto: null }));
        alert('✅ Foto eliminada correctamente');
      } else {
        alert(
          '❌ Error al eliminar la foto: ' +
            (result.message || 'Error desconocido')
        );
      }
    } catch (err) {
      alert(
        '❌ Error al eliminar la foto: ' +
          (err.message || 'Error de conexión')
      );
      console.error('Error eliminando foto:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Contenido por pestaña
  const renderTabContent = () => {
    if (!perfil) return null;

    // ---------- Pestaña INFO ----------
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
                <span
                  className={`badge ${
                    unreadCount ? 'badge--active' : ''
                  }`}
                >
                  {unreadCount} sin leer
                </span>
              </div>
              <div className="notifs-actions">
                <button
                  className="btn-ghost"
                  onClick={markAllRead}
                  disabled={!unreadCount}
                >
                  Marcar todo leído
                </button>
                <button
                  className="btn-ghost danger"
                  onClick={clearRead}
                  disabled={notifs.filter((n) => n.read).length === 0}
                >
                  Limpiar leídos
                </button>
              </div>
            </div>

            <div className="notifs-filters">
              <button
                className={`pill ${
                  notifFilter === 'all' ? 'pill--active' : ''
                }`}
                onClick={() => setNotifFilter('all')}
              >
                Todos
              </button>
              <button
                className={`pill ${
                  notifFilter === 'match' ? 'pill--active' : ''
                }`}
                onClick={() => setNotifFilter('match')}
              >
                Coincidencias
              </button>
              <button
                className={`pill ${
                  notifFilter === 'system' ? 'pill--active' : ''
                }`}
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
                filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${
                      n.read ? 'read' : 'unread'
                    }`}
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

    // ---------- Pestaña HABILIDADES ----------
    if (activeTab === 'habilidades') {
      const hasContent =
        perfil.habilidades ||
        perfil.area_interes ||
        perfil.competencias ||
        perfil.logros;
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
            <p className="no-content-message">
              No se han especificado habilidades, logros o intereses.
            </p>
          )}
        </div>
      );
    }

    // ---------- Pestaña PROYECTOS ----------
    if (activeTab === 'proyectos') {
      return (
        <div className="info-section-custom full-width">
          <h3 className="section-title-custom">📂 Proyectos</h3>

          {/* Formulario para el dueño del perfil */}
          {isOwner && (
            <form className="project-form" onSubmit={handleCrearProyecto}>
              <h4 className="project-form-title">Agregar nuevo proyecto</h4>
              <div className="project-form-grid">
                <div className="info-item-custom full-width">
                  <label>Título del proyecto</label>
                  <input
                    type="text"
                    name="titulo"
                    value={nuevoProyecto.titulo}
                    onChange={handleNuevoProyectoChange}
                    placeholder="Ej. Sistema experto de bebidas con IA"
                  />
                </div>
                <div className="info-item-custom">
                  <label>Tipo</label>
                  <select
                    name="tipo_proyecto"
                    value={nuevoProyecto.tipo_proyecto}
                    onChange={handleNuevoProyectoChange}
                  >
                    <option value="proyecto">Proyecto</option>
                    <option value="curso">Curso / Taller</option>
                    <option value="tesis">Tesis</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="info-item-custom full-width">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={nuevoProyecto.descripcion}
                    onChange={handleNuevoProyectoChange}
                    rows={4}
                    placeholder="Explica brevemente el objetivo, tecnologías y qué tipo de colaboraciones buscas."
                  />
                </div>
                <div className="info-item-custom full-width">
                  <label>Tecnologías / Temas</label>
                  <input
                    type="text"
                    name="tecnologias"
                    value={nuevoProyecto.tecnologias}
                    onChange={handleNuevoProyectoChange}
                    placeholder="Ej. React, Django, Redes WAN, IA, Fuzzy Logic..."
                  />
                </div>
                <div className="info-item-custom">
                  <label>Repositorio (GitHub, GitLab...)</label>
                  <input
                    type="url"
                    name="link_repo"
                    value={nuevoProyecto.link_repo}
                    onChange={handleNuevoProyectoChange}
                    placeholder="https://github.com/usuario/proyecto"
                  />
                </div>
                <div className="info-item-custom">
                  <label>Demo / Documento</label>
                  <input
                    type="url"
                    name="link_demo"
                    value={nuevoProyecto.link_demo}
                    onChange={handleNuevoProyectoChange}
                    placeholder="https://tudemo.com / enlace a PDF"
                  />
                </div>
              </div>

              <button type="submit" className="sidebar-btn match-btn">
                Publicar proyecto
              </button>
            </form>
          )}

          {/* Lista de proyectos */}
          <div className="projects-list">
            {loadingProyectos ? (
              <p className="no-content-message">Cargando proyectos...</p>
            ) : errorProyectos ? (
              <p className="no-content-message">{errorProyectos}</p>
            ) : proyectos.length === 0 ? (
              <p className="no-content-message">
                {isOwner
                  ? 'Aún no has publicado proyectos. Usa el formulario de arriba para agregar el primero.'
                  : 'Este perfil todavía no tiene proyectos publicados.'}
              </p>
            ) : (
              proyectos.map((p) => (
                <article key={p.id || p.titulo} className="project-card">
                  <header className="project-card-header">
                    <h4 className="project-title">
                      {p.titulo || 'Proyecto sin título'}
                    </h4>
                    {p.tipo_proyecto && (
                      <span className="chip">
                        {p.tipo_proyecto}
                      </span>
                    )}
                  </header>
                  {p.tecnologias && (
                    <p className="project-techs">
                      {p.tecnologias}
                    </p>
                  )}
                  <p className="project-desc">
                    {p.descripcion || 'Sin descripción.'}
                  </p>
                  <div className="project-links">
                    {p.link_repo && (
                      <a
                        href={p.link_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                      >
                        Ver repositorio
                      </a>
                    )}
                    {p.link_demo && (
                      <a
                        href={p.link_demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                      >
                        Ver demo / documento
                      </a>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      );
    }

    return (
      <p className="no-content-message">
        Selecciona una pestaña para ver el contenido.
      </p>
    );
  };

  if (loading) return <div className="perfil-container" />;
  if (error || !perfil) return <div className="perfil-container" />;

  const finalAvatarUrl = buildMediaUrl(perfil.foto);

  return (
    <div className="perfil-container">
      {/* Solo pasar onLogout si es el propietario */}
      <AppHeader
        onLogout={isOwner ? handleLogout : null}
        onGoCommunity={() => navigate('/comunidad')}
      />

      {/* Resumen superior */}
      <section className="perfil-summary-card">
        <div className="perfil-summary-left">
          <div className="perfil-avatar-wrap perfil-avatar-wrap--summary">
            <img
              src={finalAvatarUrl}
              alt="Foto de perfil"
              className="perfil-avatar perfil-avatar--lg"
            />

            {/* Botones foto: solo propietario */}
            {isOwner && (
              <div className="avatar-actions">
                <button
                  className={`mini-btn ${isUploading ? 'disabled' : ''}`}
                  onClick={onPickFile}
                  disabled={isUploading}
                >
                  {isUploading ? '📤 Subiendo...' : '📷 Cambiar'}
                </button>

                {perfil.foto && (
                  <button
                    className="mini-btn btn-danger"
                    onClick={eliminarFoto}
                    disabled={isUploading}
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
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
              <h1 className="perfil-title">
                Perfil de {perfil.nombre_completo}
              </h1>
            </div>
            <div className="perfil-badges">
              <span className="chip chip--type">{tipo}</span>
              {perfil.correo_institucional && (
                <span className="chip">
                  {perfil.correo_institucional}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="perfil-tabs perfil-tabs--summary">
          <button
            className={`tab-btn ${
              activeTab === 'info' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('info')}
          >
            Información Personal
          </button>
          <button
            className={`tab-btn ${
              activeTab === 'habilidades' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('habilidades')}
          >
            Habilidades y Logros
          </button>
          <button
            className={`tab-btn ${
              activeTab === 'proyectos' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('proyectos')}
          >
            Proyectos
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
                  {new Date(
                    perfil.fecha_registro
                  ).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
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
            <h3 className="sidebar-title">
              {isOwner ? '🔧 Gestión de Perfil' : '🤝 Interacción'}
            </h3>
            <div className="sidebar-actions-group">
              {/* Interacción para visitantes (no dueño) */}
              {!isOwner && (
                <>
                  <button
                    onClick={handleContactar}
                    className="sidebar-btn contactar-btn"
                  >
                    <span className="btn-icon">✉️</span> Contactar
                  </button>

                  {/* Bloque de match */}
                  <div className="match-box">
                    <p className="match-status-label">
                      Estado de colaboración:
                    </p>
                    {matchState.loading ? (
                      <p className="match-status-value">
                        Consultando estado…
                      </p>
                    ) : (
                      <p className="match-status-value">
                        {matchState.estado === 'no_match' &&
                          'Sin solicitud aún'}
                        {matchState.estado === 'pendiente' &&
                          'Solicitud pendiente'}
                        {matchState.estado === 'aceptado' &&
                          '¡Ya son match para colaborar!'}
                        {matchState.estado === 'error' &&
                          (matchState.error ||
                            'No se pudo obtener el estado')}
                      </p>
                    )}

                    <div className="match-buttons">
                      {matchState.estado === 'no_match' && (
                        <button
                          className="sidebar-btn match-btn"
                          onClick={handleEnviarMatch}
                          disabled={matchState.loading}
                        >
                          {matchState.loading
                            ? 'Enviando...'
                            : 'Conectar / Solicitar colaboración'}
                        </button>
                      )}

                      {matchState.estado === 'pendiente' && (
                        <>
                          <button
                            className="sidebar-btn match-btn disabled"
                            disabled
                          >
                            Solicitud enviada
                          </button>
                          <button
                            className="sidebar-btn eliminar-btn"
                            onClick={handleCancelarMatch}
                            disabled={matchState.loading}
                          >
                            Cancelar solicitud
                          </button>
                        </>
                      )}

                      {matchState.estado === 'aceptado' && (
                        <button
                          className="sidebar-btn match-btn"
                          onClick={() =>
                            navigate('/mis-matches')
                          }
                        >
                          Ver mis matches
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Gestión para el propietario */}
              {isOwner && (
                <>
                  <button
                    onClick={handleEditar}
                    className="sidebar-btn editar-btn"
                  >
                    <span className="btn-icon">✏️</span> Editar Perfil
                  </button>
                  <button
                    onClick={handleEliminar}
                    className="sidebar-btn eliminar-btn"
                  >
                    <span className="btn-icon">🗑️</span> Eliminar Perfil
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Perfil;
