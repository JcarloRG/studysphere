// src/components/BuscarProyectos.jsx

import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Link } from 'react-router-dom';
import AppHeader from './AppHeader';
import './Comunidad.css'; // reutilizamos estilos bonitos

const BuscarProyectos = () => {
  const currentUserId = localStorage.getItem('currentUserId');
  const currentUserType = localStorage.getItem('currentUserType');

  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [modalidadFilter, setModalidadFilter] = useState('todos');

  const [mensajeExito, setMensajeExito] = useState('');
  const [postulandoId, setPostulandoId] = useState(null);
  const [interesados, setInteresados] = useState(new Set());

  // Cargar proyectos desde el backend
  const cargarProyectos = async () => {
    try {
      setLoading(true);
      setError('');

      // ⚠️ Ajusta este método a tu api.js si ya tienes algo como getProyectos()
      const res = await apiService.getProyectos?.();
      if (res?.success) {
        setProyectos(res.data || []);
      } else {
        setError(res?.message || 'No se pudieron cargar los proyectos');
      }
    } catch (err) {
      console.error('Error cargando proyectos:', err);
      setError(err.message || 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProyectos();
  }, []);

  // Filtros en front
  const proyectosFiltrados = proyectos.filter((p) => {
    const q = searchTerm.toLowerCase();

    const coincideBusqueda =
      !q ||
      (p.titulo && p.titulo.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
      (p.area_interes && p.area_interes.toLowerCase().includes(q)) ||
      (p.habilidades_requeridas && p.habilidades_requeridas.toLowerCase().includes(q));

    const coincideTipo =
      tipoFilter === 'todos' || (p.tipo && p.tipo.toLowerCase() === tipoFilter);

    const coincideEstado =
      estadoFilter === 'todos' ||
      (p.estado && p.estado.toLowerCase() === estadoFilter);

    const coincideModalidad =
      modalidadFilter === 'todos' ||
      (p.modalidad && p.modalidad.toLowerCase() === modalidadFilter);

    return coincideBusqueda && coincideTipo && coincideEstado && coincideModalidad;
  });

  const handlePostular = async (proyecto) => {
    if (!currentUserId || !currentUserType) {
      setError('Debes iniciar sesión para postularte a un proyecto.');
      return;
    }
    setPostulandoId(proyecto.id);
    try {
      const res = await apiService.marcarInteresProyecto(proyecto.id);
      if (res.success) {
        setInteresados((prev) => new Set(prev).add(proyecto.id));
        setMensajeExito(`Tu interés en "${proyecto.titulo}" ha sido registrado.`);
        setTimeout(() => setMensajeExito(''), 2500);
      } else {
        setError(res.message || 'No se pudo registrar tu interés.');
      }
    } catch (err) {
      setError(err.message || 'Error al registrar tu interés en el proyecto.');
    } finally {
      setPostulandoId(null);
    }
  };

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
                <span className="form-emoji">📚</span>
                <h2>Proyectos Académicos</h2>
              </div>
              <p className="form-description-custom">
                Explora proyectos, cursos y mentorías para colaborar con la comunidad
              </p>
              <Link to="/proyectos/crear" className="cta-btn primary">
                🚀 Publicar Proyecto
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-info">
                  <span className="stat-number">{proyectos.length}</span>
                  <span className="stat-label">Proyectos publicados</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {mensajeExito && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {mensajeExito}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={cargarProyectos} className="retry-btn">
              🔄 Reintentar
            </button>
          </div>
        )}

        {/* FILTROS */}
        <section className="filters-section">
          <div className="filters-content">
            <div className="search-bar">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Buscar por título, descripción, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  ×
                </button>
              )}
            </div>

            <div className="filter-selects" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="filter-select"
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
              >
                <option value="todos">Tipo: todos</option>
                <option value="proyecto">Proyecto</option>
                <option value="curso">Curso</option>
                <option value="mentoria">Mentoría</option>
              </select>

              <select
                className="filter-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="todos">Estado: todos</option>
                <option value="abierto">Abierto</option>
                <option value="en progreso">En progreso</option>
                <option value="cerrado">Cerrado</option>
              </select>

              <select
                className="filter-select"
                value={modalidadFilter}
                onChange={(e) => setModalidadFilter(e.target.value)}
              >
                <option value="todos">Modalidad: todas</option>
                <option value="presencial">Presencial</option>
                <option value="en linea">En línea</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>
          </div>
        </section>

        {/* LISTA DE PROYECTOS */}
        <section className="members-section">
          <div className="section-header">
            <h2>🔍 Proyectos disponibles</h2>
            <p>
              {proyectosFiltrados.length}{' '}
              {proyectosFiltrados.length === 1
                ? 'proyecto encontrado'
                : 'proyectos encontrados'}
            </p>
          </div>

          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Cargando proyectos...</p>
            </div>
          ) : proyectosFiltrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No se encontraron proyectos</h3>
              <p>Prueba con otros filtros o palabras clave</p>
              <button onClick={cargarProyectos} className="reload-btn">
                🔄 Recargar
              </button>
            </div>
          ) : (
            <div className="members-grid">
              {proyectosFiltrados.map((p) => {
                const yaInteresado = interesados.has(p.id);
                const estadoNorm = (p.estado || 'abierto').toLowerCase();
                return (
                  <div key={p.id} className="member-card">
                    <div className="member-header">
                      <div className="profile-badge-large" style={{ backgroundColor: '#6366f1' }}>
                        📁
                      </div>
                      <div className="member-info">
                        <h3>{p.titulo || 'Proyecto sin título'}</h3>
                        <p className="member-role">
                          {p.tipo ? p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1) : 'Proyecto'}
                          {p.modalidad && ` · ${p.modalidad}`}
                        </p>
                      </div>
                      <span className={`project-estado-badge estado-${estadoNorm.replace(/\s+/g, '-')}`}>
                        {p.estado || 'abierto'}
                      </span>
                    </div>

                    <div className="member-details">
                      <p className="member-email">
                        {p.descripcion || 'Sin descripción'}
                      </p>

                      {p.area_interes && (
                        <div className="member-interests">
                          <strong>Área de interés:</strong>{' '}
                          <span>{p.area_interes}</span>
                        </div>
                      )}

                      {p.habilidades_requeridas && (
                        <div className="member-skills">
                          <strong>Buscan:</strong>{' '}
                          <span>{p.habilidades_requeridas}</span>
                        </div>
                      )}

                      {p.creador_nombre && (
                        <p className="member-interests">
                          <strong>Publicado por:</strong>{' '}
                          {p.creador_nombre} {p.creador_tipo && `(${p.creador_tipo})`}
                        </p>
                      )}
                    </div>

                    <div className="member-actions">
                      {String(p.creador_id) === String(currentUserId) &&
                      p.creador_tipo === currentUserType ? (
                        <span className="own-project-chip">📌 Tu proyecto</span>
                      ) : (
                        <button
                          className="match-btn"
                          onClick={() => handlePostular(p)}
                          disabled={postulandoId === p.id || yaInteresado}
                        >
                          {yaInteresado
                            ? '✅ Interés enviado'
                            : postulandoId === p.id
                            ? 'Enviando...'
                            : '🤝 Quiero colaborar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BuscarProyectos;