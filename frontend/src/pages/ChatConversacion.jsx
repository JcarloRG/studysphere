// src/pages/ChatConversacion.jsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import '../components/Comunidad.css';

const POLL_MS = 4000;

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
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function ChatConversacion() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem('currentUserId');
  const currentUserType = localStorage.getItem('currentUserType');

  const [mensajes, setMensajes] = useState([]);
  const [otraPersona, setOtraPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Traemos el nombre/foto de la otra persona desde la lista de
  // conversaciones (más simple que otro endpoint dedicado)
  useEffect(() => {
    const cargarInfoConversacion = async () => {
      const res = await apiService.obtenerConversaciones();
      if (res.success) {
        const conv = res.conversaciones.find(
          (c) => String(c.match_id) === String(matchId)
        );
        if (conv) setOtraPersona(conv);
      }
    };
    cargarInfoConversacion();
  }, [matchId]);

  const cargarMensajes = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLoading(true);
      const res = await apiService.obtenerMensajes(matchId);
      if (res.success) {
        setMensajes(res.mensajes);
        setError('');
      } else if (!silencioso) {
        setError(res.message || 'No se pudo cargar la conversación.');
      }
      if (!silencioso) setLoading(false);
    },
    [matchId]
  );

  useEffect(() => {
    cargarMensajes();
    pollRef.current = setInterval(() => cargarMensajes(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [cargarMensajes]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    setEnviando(true);
    setTexto('');
    try {
      const res = await apiService.enviarMensaje(matchId, contenido);
      if (res.success) {
        await cargarMensajes(true);
      } else {
        setError(res.message || 'No se pudo enviar el mensaje.');
        setTexto(contenido); // se lo regresamos al input para que no lo pierda
      }
    } catch (err) {
      setError(err.message || 'Error al enviar el mensaje.');
      setTexto(contenido);
    } finally {
      setEnviando(false);
    }
  };

  const esMio = (m) =>
    String(m.remitente_id) === String(currentUserId) &&
    m.remitente_tipo === currentUserType;

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
          <div className="logo-section chat-header-person">
            <img
              className="avatar"
              src={
                otraPersona?.otro_foto
                  ? buildMediaUrl(otraPersona.otro_foto)
                  : '/avatar-default.png'
              }
              alt={otraPersona?.otro_nombre || 'Usuario'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = avatarFromName(otraPersona?.otro_nombre);
              }}
            />
            <h1>{otraPersona?.otro_nombre || 'Conversación'}</h1>
          </div>
          <nav className="nav-actions">
            {otraPersona?.otro_id && otraPersona?.otro_tipo && (
              <Link
                to={`/perfil_vista/${otraPersona.otro_tipo}/${otraPersona.otro_id}`}
                className="nav-btn"
              >
                <span className="btn-icon">👤</span>
                <span>Ver perfil</span>
              </Link>
            )}
            <button className="nav-btn profile-nav-btn" onClick={() => navigate('/mensajes')}>
              <span className="btn-icon">←</span>
              <span>Mensajes</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="chat-container">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Cargando conversación...</p>
          </div>
        ) : (
          <div className="chat-messages">
            {mensajes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👋</div>
                <h3>Todavía no hay mensajes</h3>
                <p>Manda el primero para romper el hielo</p>
              </div>
            ) : (
              mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble-row ${esMio(m) ? 'mine' : 'theirs'}`}
                >
                  <div className="chat-bubble">
                    <p>{m.contenido}</p>
                    <span className="chat-bubble-time">{formatHora(m.creado_en)}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <form className="chat-input-row" onSubmit={handleEnviar}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={2000}
            disabled={enviando}
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn" disabled={enviando || !texto.trim()}>
            {enviando ? '...' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}