// src/components/AppHeader.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './AppHeader.css';

export default function AppHeader({ title = 'StudySphere', logoSrc = '/logo192.png' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem('currentUserId');
  const currentUserType = localStorage.getItem('currentUserType');
  const logueado = Boolean(currentUserId && currentUserType);

  const [pendientes, setPendientes] = useState(0);
  const [noLeidos, setNoLeidos] = useState(0);

  useEffect(() => {
    if (!logueado) return;

    const cargarBadges = async () => {
      const resMatches = await apiService.obtenerMisMatches('pendiente');
      if (resMatches.success) {
        setPendientes(
          (resMatches.matches || []).filter((m) => m.direccion === 'recibida').length
        );
      }
      const resConv = await apiService.obtenerConversaciones();
      if (resConv.success) {
        setNoLeidos(
          (resConv.conversaciones || []).reduce((acc, c) => acc + (c.no_leidos || 0), 0)
        );
      }
    };

    cargarBadges();
    const interval = setInterval(cargarBadges, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logueado]);

  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserType');
    navigate('/');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="premium-header" role="banner">
      <div className="header-content">
        <div className="logo-section">
          <Link to="/" className="logo-link" aria-label={`${title} inicio`}>
            <img src={logoSrc} alt={`${title} logo`} className="site-logo" />
          </Link>
          <h1 className="site-title">{title}</h1>
        </div>

        {logueado && (
          <nav className="nav-actions" aria-label="Acciones principales">
            <Link
              to="/comunidad"
              className={`nav-btn ${isActive('/comunidad') ? 'active' : ''}`}
            >
              <span className="btn-icon" aria-hidden>🔍</span>
              <span>Descubrir</span>
            </Link>

            <Link
              to="/proyectos"
              className={`nav-btn ${isActive('/proyectos') ? 'active' : ''}`}
            >
              <span className="btn-icon" aria-hidden>📁</span>
              <span>Proyectos</span>
            </Link>

            <Link
              to="/mensajes"
              className={`nav-btn ${isActive('/mensajes') ? 'active' : ''}`}
            >
              <span className="btn-icon" aria-hidden>💬</span>
              <span>Mensajes</span>
              {noLeidos > 0 && <span className="nav-badge">{noLeidos}</span>}
            </Link>

            <Link
              to="/mis-matches"
              className={`nav-btn ${isActive('/mis-matches') ? 'active' : ''}`}
            >
              <span className="btn-icon" aria-hidden>🤝</span>
              <span>Conexiones</span>
              {pendientes > 0 && <span className="nav-badge">{pendientes}</span>}
            </Link>

            <Link
              to={`/perfil/${currentUserType}/${currentUserId}`}
              className={`nav-btn profile-nav-btn ${
                isActive(`/perfil/${currentUserType}/${currentUserId}`) ? 'active' : ''
              }`}
            >
              <span className="btn-icon" aria-hidden>👤</span>
              <span>Mi Perfil</span>
            </Link>

            <button
              type="button"
              className="nav-btn logout-nav-btn"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <span className="btn-icon" aria-hidden>🚪</span>
              <span>Salir</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}