// src/pages/MisMatchesPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import AppHeader from '../components/AppHeader';
import '../components/Comunidad.css';

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
      <rect width='128' height='128' rx='64' fill='url(#g)'/>
      <text x='50%' y='54%' font-family='Inter, sans-serif' font-size='48'
        fill='white' text-anchor='middle' dominant-baseline='middle'>${initials || '?'}</text>
    </svg>
  `);
  return `data:image/svg+xml,${svg}`;
};

const buildMediaUrl = (rel) => {
  if (!rel) return null;
  const host = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  if (/^https?:\/\//i.test(rel)) return rel;
  return `${host}${rel.startsWith('/') ? '' : '/'}${rel}`;
};

const getAvatarUrl = (m) => {
  const rel = m?.otro_foto;
  if (rel) return buildMediaUrl(rel);
  return '/avatar-default.png';
};

const getTipoIcon = (tipo) =>
  tipo === 'estudiante' ? '🎓' : tipo === 'docente' ? '👨‍🏫' : tipo === 'egresado' ? '💼' : '👤';

const getTipoColor = (tipo) =>
  tipo === 'estudiante' ? '#667eea' : tipo === 'docente' ? '#ff6b6b' : tipo === 'egresado' ? '#4ecdc4' : '#6b7280';

const formatFecha = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export default function MisMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const cargarMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.obtenerMisMatches();
      if (res.success) {
        setMatches(res.matches || []);
      } else {
        setError(res.message || 'No se pudieron cargar tus matches.');
      }
    } catch (err) {
      setError(err.message || 'Error al obtener tus matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMatches();
  }, [cargarMatches]);

  const handleAceptar = async (matchId) => {
    setProcesandoId(matchId);
    try {
      const res = await apiService.aceptarMatch(matchId);
      if (res.success) {
        setMensaje('¡Ahora son colaboradores! 🎉');
        setTimeout(() => setMensaje(''), 2500);
        await cargarMatches();
      } else {
        setError(res.message || 'No se pudo aceptar el match.');
      }
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (matchId) => {
    setProcesandoId(matchId);
    try {
      const res = await apiService.rechazarMatch(matchId);
      if (res.success) {
        await cargarMatches();
      } else {
        setError(res.message || 'No se pudo rechazar el match.');
      }
    } finally {
      setProcesandoId(null);
    }
  };

  const recibidas = matches.filter((m) => m.direccion === 'recibida' && m.estado === 'pendiente');
  const enviadas = matches.filter((m) => m.direccion === 'enviada' && m.estado === 'pendiente');
  const aceptados = matches.filter((m) => m.estado === 'aceptado');

  const MatchCard = ({ m, children }) => (
    <div className="member-card match-card">
      <div className="member-header">
        <img
          className="avatar"
          src={getAvatarUrl(m)}
          alt={m.otro_nombre || 'Usuario'}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = avatarFromName(m.otro_nombre);
          }}
        />
        <div className="member-info">
          <h3>{m.otro_nombre || 'Usuario'}</h3>
          <p className="member-role">
            <span
              className="tipo-dot"
              style={{ backgroundColor: getTipoColor(m.otro_tipo) }}
            >
              {getTipoIcon(m.otro_tipo)}
            </span>{' '}
            {m.otro_tipo
              ? m.otro_tipo.charAt(0).toUpperCase() + m.otro_tipo.slice(1)
              : 'Usuario'}
          </p>
        </div>
        {m.compatibilidad !== null && m.compatibilidad !== undefined && (
          <span className="match-compat-chip">{m.compatibilidad}%</span>
        )}
      </div>

      <p className="match-fecha">
        {m.estado === 'aceptado'
          ? `Colaborando desde el ${formatFecha(m.fecha_actualizacion)}`
          : `Solicitud del ${formatFecha(m.fecha_match)}`}
      </p>

      <div className="member-actions">
        {m.otro_id && m.otro_tipo && (
          <Link to={`/perfil_vista/${m.otro_tipo}/${m.otro_id}`} className="profile-link">
            Ver perfil
          </Link>
        )}
        {children}
      </div>
    </div>
  );

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
        <section className="comunidad-hero">
          <div className="hero-content">
            <div className="comunidad-header-custom">
              <div className="header-with-emoji">
                <span className="form-emoji">🤝</span>
                <h2>Mis Conexiones</h2>
              </div>
              <p className="form-description-custom">
                Solicitudes de colaboración y las personas con las que ya haces match
              </p>
            </div>
          </div>
        </section>

        {mensaje && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {mensaje}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={cargarMatches} className="retry-btn">
              🔄 Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Cargando tus conexiones...</p>
          </div>
        ) : (
          <>
            {/* SOLICITUDES RECIBIDAS: requieren acción */}
            <section className="members-section">
              <div className="section-header">
                <h2>📥 Solicitudes recibidas</h2>
                <p>
                  {recibidas.length === 0
                    ? 'No tienes solicitudes pendientes por responder'
                    : `${recibidas.length} ${recibidas.length === 1 ? 'persona quiere' : 'personas quieren'} colaborar contigo`}
                </p>
              </div>
              {recibidas.length > 0 && (
                <div className="members-grid">
                  {recibidas.map((m) => (
                    <MatchCard key={m.id} m={m}>
                      <button
                        className="match-btn accept-btn"
                        disabled={procesandoId === m.id}
                        onClick={() => handleAceptar(m.id)}
                      >
                        {procesandoId === m.id ? 'Procesando...' : '✅ Aceptar'}
                      </button>
                      <button
                        className="match-btn reject-btn"
                        disabled={procesandoId === m.id}
                        onClick={() => handleRechazar(m.id)}
                      >
                        ✕ Rechazar
                      </button>
                    </MatchCard>
                  ))}
                </div>
              )}
            </section>

            {/* SOLICITUDES ENVIADAS: esperando respuesta */}
            {enviadas.length > 0 && (
              <section className="members-section">
                <div className="section-header">
                  <h2>📤 Solicitudes enviadas</h2>
                  <p>Esperando que {enviadas.length === 1 ? 'la otra persona responda' : 'respondan'}</p>
                </div>
                <div className="members-grid">
                  {enviadas.map((m) => (
                    <MatchCard key={m.id} m={m}>
                      <span className="pending-chip">⏳ Esperando respuesta</span>
                    </MatchCard>
                  ))}
                </div>
              </section>
            )}

            {/* MATCHES ACEPTADOS */}
            <section className="members-section">
              <div className="section-header">
                <h2>🎉 Mis colaboraciones</h2>
                <p>
                  {aceptados.length === 0
                    ? 'Aún no tienes colaboraciones activas'
                    : `${aceptados.length} ${aceptados.length === 1 ? 'colaboración activa' : 'colaboraciones activas'}`}
                </p>
              </div>
              {aceptados.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🤝</div>
                  <h3>Todavía no tienes colaboraciones</h3>
                  <p>Ve a Descubrir y desliza a la derecha en los perfiles que te interesen</p>
                  <Link to="/comunidad" className="reload-btn">
                    🔍 Ir a Descubrir
                  </Link>
                </div>
              ) : (
                <div className="members-grid">
                  {aceptados.map((m) => (
                    <MatchCard key={m.id} m={m}>
                      <Link to={`/mensajes/${m.id}`} className="match-btn message-btn">
                        💬 Mensaje
                      </Link>
                    </MatchCard>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}