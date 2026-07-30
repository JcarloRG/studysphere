// src/pages/Mensajes.jsx

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

const formatHora = (iso) => {
  if (!iso) return '';
  try {
    const fecha = new Date(iso);
    const hoy = new Date();
    const esHoy = fecha.toDateString() === hoy.toDateString();
    return esHoy
      ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      : fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

export default function Mensajes() {
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await apiService.obtenerConversaciones();
    if (res.success) {
      setConversaciones(res.conversaciones);
    } else {
      setError(res.message || 'No se pudieron cargar tus conversaciones.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
                <span className="form-emoji">💬</span>
                <h2>Mensajes</h2>
              </div>
              <p className="form-description-custom">
                Tus conversaciones con las personas con las que ya colaboras
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={cargar} className="retry-btn">🔄 Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Cargando tus conversaciones...</p>
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Todavía no tienes conversaciones</h3>
            <p>Cuando hagas match con alguien, podrás escribirle desde aquí</p>
            <Link to="/mis-matches" className="reload-btn">
              🤝 Ver mis conexiones
            </Link>
          </div>
        ) : (
          <div className="conversations-list">
            {conversaciones.map((c) => (
              <Link
                to={`/mensajes/${c.match_id}`}
                key={c.match_id}
                className={`conversation-row ${c.no_leidos > 0 ? 'unread' : ''}`}
              >
                <img
                  className="avatar"
                  src={c.otro_foto ? buildMediaUrl(c.otro_foto) : '/avatar-default.png'}
                  alt={c.otro_nombre || 'Usuario'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = avatarFromName(c.otro_nombre);
                  }}
                />
                <div className="conversation-info">
                  <div className="conversation-top">
                    <h4>{c.otro_nombre || 'Usuario'}</h4>
                    <span className="conversation-time">{formatHora(c.ultimo_mensaje_en)}</span>
                  </div>
                  <p className="conversation-preview">
                    {c.ultimo_mensaje
                      ? c.ultimo_mensaje.length > 60
                        ? c.ultimo_mensaje.slice(0, 60) + '…'
                        : c.ultimo_mensaje
                      : 'Empieza la conversación'}
                  </p>
                </div>
                {c.no_leidos > 0 && (
                  <span className="conversation-unread-badge">{c.no_leidos}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}