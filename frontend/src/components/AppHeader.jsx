// src/components/AppHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AppHeader.css';

export default function AppHeader({
  title = 'StudySphere',
  logoSrc = '/logo192.png',
  onLogout,
  onGoCommunity,
  rightSlot
}) {
  return (
    <header className="premium-header" role="banner">
      <div className="header-content">
        <div className="logo-section">
          <Link to="/" className="logo-link" aria-label={`${title} inicio`}>
            <img src={logoSrc} alt={`${title} logo`} className="site-logo" />
          </Link>
          <h1 className="site-title">{title}</h1>
        </div>

        <nav className="nav-actions" aria-label="Acciones principales">
          {rightSlot ? (
            rightSlot
          ) : (
            <>
              <button
                type="button"
                className="nav-btn"
                onClick={onGoCommunity}
                aria-label="Ir a Comunidad"
              >
                <span className="btn-icon" aria-hidden>🌐</span>
                <span>Comunidad</span>
              </button>

              <button
                type="button"
                className="nav-btn logout-nav-btn"
                onClick={onLogout}
                aria-label="Cerrar sesión"
              >
                <span className="btn-icon" aria-hidden>🚪</span>
                <span>Cerrar sesión</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
