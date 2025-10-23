// src/components/Perfil.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import './Perfil.css';

const Perfil = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'habilidades' | 'explorar'

  // Foto (solo estudiantes)
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Helper para media URL absoluta
  const buildMediaUrl = (rel) => {
    if (!rel) return null;
    const host = API_BASE_URL.replace(/\/api\/?$/, '');
    return rel.startsWith('http') ? rel : `${host}${rel}`;
  };

  const avatarUrl =
    tipo === 'estudiante'
      ? perfil?.foto
        ? buildMediaUrl(perfil.foto)
        : '/avatar-default.png'
      : '/avatar-default.png';

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

  // Navegación / acciones
  const handleVolver = () => navigate(-1);
  const handleVolverInicio = () => navigate('/');
  const handleEditar = () => navigate(`/editar/${tipo}/${id}`);

  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar este perfil de ${tipo}?`)) return;
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
    const subject = `Interés en colaborar - ${perfil.nombre_completo}`;
    const body = `Hola ${perfil.nombre_completo},\n\nMe interesa colaborar contigo...`;
    window.location.href = `mailto:${perfil.correo_institucional}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  // Foto: handlers
  const onPickFile = () => {
    if (tipo !== 'estudiante') return;
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    if (tipo !== 'estudiante') return;
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

    if (activeTab === 'explorar') {
      return (
        <div className="explorar-section-custom">
          <h3 className="section-title-custom">✨ ¿Qué quieres hacer?</h3>
          <p className="section-description-custom">
            Acciones para conectar con otros perfiles y proyectos en StudySphere.
          </p>
          <div className="action-cards-grid">
            <Link to="/comunidad" className="action-card explorar-btn">
              <span className="card-icon">🌐</span>
              <h4>Explorar Comunidad</h4>
              <p>Encuentra perfiles y proyectos relevantes.</p>
            </Link>
            <Link to="/registros/estudiantes" className="action-card miembros-btn">
              <span className="card-icon">👥</span>
              <h4>Ver Miembros</h4>
              <p>Consulta la lista completa de usuarios registrados.</p>
            </Link>
            <Link to="/proyectos/busqueda" className="action-card proyectos-btn">
              <span className="card-icon">💡</span>
              <h4>Buscar Proyectos</h4>
              <p>Encuentra oportunidades de colaboración.</p>
            </Link>
          </div>
        </div>
      );
    }

    return <p className="no-content-message">Selecciona una pestaña para ver el contenido.</p>;
  };

  // Estados iniciales
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

  if (error || !perfil) {
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
              <div className="error-message-custom">{error || 'Perfil no encontrado'}</div>
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

  // Render principal
  return (
    <div className="perfil-container">
      {/* Fondo */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Header top */}
      <header className="premium-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🚀</div>
            <h1>StudySphere</h1>
          </div>
          <nav className="nav-actions">
            <button className="nav-btn profile-nav-btn" onClick={handleVolverInicio}>
              <span className="btn-icon">🏠</span>
              <span>Volver al Inicio</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <div className="perfil-main-content">
        {/* Encabezado: avatar + título + tabs */}
        <div className="perfil-header-area">
          <div className="perfil-avatar-wrap">
            <img src={avatarUrl} alt="Foto de perfil" className="perfil-avatar" />
            {tipo === 'estudiante' && (
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

            {/* Tabs */}
            <nav className="perfil-tabs">
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
              <button
                className={`tab-btn ${activeTab === 'explorar' ? 'active' : ''}`}
                onClick={() => setActiveTab('explorar')}
              >
                Comunidad
              </button>
            </nav>
          </div>
        </div>

        {/* Grid principal */}
        <div className="perfil-grid-layout">
          {/* Columna 1: contenido */}
          <div className="perfil-content-wrapper">
            <div className="perfil-tab-content">{renderTabContent()}</div>
          </div>

          {/* Columna 2: sidebar */}
          <div className="perfil-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">⚙️ Acciones del Perfil</h3>
              <div className="sidebar-actions-group">
                <button onClick={handleContactar} className="sidebar-btn contactar-btn">
                  <span className="btn-icon">✉️</span> Contactar
                </button>
                <button onClick={handleEditar} className="sidebar-btn editar-btn">
                  <span className="btn-icon">✏️</span> Editar Perfil
                </button>
                <button onClick={handleEliminar} className="sidebar-btn eliminar-btn">
                  <span className="btn-icon">🗑️</span> Eliminar Perfil
                </button>
              </div>
            </div>

            {activeTab !== 'explorar' && (
              <div className="sidebar-card secondary-actions">
                <h3 className="sidebar-title">🌐 Conecta y Explora</h3>
                <Link to="/comunidad" className="sidebar-link-btn">
                  <span className="btn-icon">🔍</span> Explorar Comunidad
                </Link>
                <Link to="/registros/estudiantes" className="sidebar-link-btn">
                  <span className="btn-icon">👥</span> Ver Miembros
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
