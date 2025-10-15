import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleMiPerfil = () => {
        setShowLoginModal(true);
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (email && email.includes('@')) {
            try {
                console.log('🔍 Buscando perfil con correo:', email);
                
                const result = await apiService.buscarPerfilPorCorreo(email);
                
                if (result.success) {
                    console.log('✅ Perfil encontrado:', result);
                    navigate(`/perfil/${result.tipo}/${result.id}`);
                    setShowLoginModal(false);
                    setEmail('');
                } else {
                    setError(result.message || 'No se encontró ningún perfil con este correo');
                }
            } catch (err) {
                console.error('💥 Error en login:', err);
                setError('Error al buscar el perfil: ' + err.message);
            }
        } else {
            setError('Por favor ingresa un correo electrónico válido');
        }
        
        setLoading(false);
    };

    const handleCloseModal = () => {
        setShowLoginModal(false);
        setEmail('');
        setError('');
    };

    return (
        <div className="home-container">
            {/* Fondo con elementos decorativos estáticos */}
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div>

            {/* Header Elegante */}
            <header className="premium-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo-icon">🚀</div>
                        <h1>StudySphere</h1>
                    </div>
                    <nav className="nav-actions">
                        <button 
                            className="nav-btn profile-nav-btn"
                            onClick={handleMiPerfil}
                            disabled={loading}
                        >
                            <span className="btn-icon">👤</span>
                            <span>Mi Perfil</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Modal de Login */}
            {showLoginModal && (
                <div className="modal-overlay">
                    <div className="premium-modal">
                        <div className="modal-header">
                            <div className="modal-icon">🔐</div>
                            <h2>Iniciar Sesión</h2>
                            <button 
                                className="close-btn"
                                onClick={handleCloseModal}
                                disabled={loading}
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="email">Correo Institucional</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu.correo@institucion.edu"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading || !email}
                                >
                                    {loading ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            Buscando...
                                        </>
                                    ) : (
                                        'Ingresar a Mi Perfil'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hero Section Compacta */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span>✨ Plataforma de Colaboración Académica</span>
                    </div>
                    <h1 className="hero-title">
                        Conecta, Colabora y 
                        <span className="gradient-text"> Crece</span>
                    </h1>
                    <p className="hero-description">
                        Únete a una comunidad vibrante de estudiantes, docentes y profesionales 
                        donde las ideas se transforman en proyectos innovadores.
                    </p>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">500+</span>
                            <span className="stat-label">Miembros</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">150+</span>
                            <span className="stat-label">Proyectos</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">95%</span>
                            <span className="stat-label">Éxito</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de Registros - Directamente después del hero */}
            <section className="registration-section">
                <div className="section-header">
                    <h2>Únete a Nuestra Comunidad</h2>
                    <p>Elige tu perfil y comienza a colaborar</p>
                </div>
                <div className="registration-grid">
                    <Link to="/estudiante" className="registration-card student-card">
                        <div className="card-content">
                            <div className="card-icon">🎓</div>
                            <h3>Estudiante</h3>
                            <p>Encuentra equipo para proyectos y participa en concursos académicos con compañeros y mentores.</p>
                            <ul className="card-features">
                                <li>✓ Encuentra colaboradores</li>
                                <li>✓ Participa en competencias</li>
                                <li>✓ Accede a mentoría</li>
                            </ul>
                        </div>
                    </Link>

                    <Link to="/docente" className="registration-card teacher-card">
                        <div className="card-content">
                            <div className="card-icon">📚</div>
                            <h3>Docente</h3>
                            <p>Dirige investigaciones, colabora en proyectos innovadores y guía a la próxima generación.</p>
                            <ul className="card-features">
                                <li>✓ Dirige investigaciones</li>
                                <li>✓ Colabora en proyectos</li>
                                <li>✓ Guía a estudiantes</li>
                            </ul>
                        </div>
                    </Link>

                    <Link to="/egresado" className="registration-card graduate-card">
                        <div className="card-content">
                            <div className="card-icon">💡</div>
                            <h3>Egresado</h3>
                            <p>Comparte tu experiencia profesional, ofrece mentoría y conecta con proyectos de impacto.</p>
                            <ul className="card-features">
                                <li>✓ Comparte experiencia</li>
                                <li>✓ Ofrece mentoría</li>
                                <li>✓ Conecta con proyectos</li>
                            </ul>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Acciones Rápidas - Más compacto */}
            <section className="quick-actions">
                <div className="actions-content">
                    <h3>¿Qué quieres hacer?</h3>
                    <div className="action-buttons">
                        <Link to="/comunidad" className="action-btn explore-btn">
                            <span className="btn-icon">🌐</span>
                            <span>Explorar Comunidad</span>
                        </Link>
                        <Link to="/registros/estudiantes" className="action-btn members-btn">
                            <span className="btn-icon">👥</span>
                            <span>Ver Miembros</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;