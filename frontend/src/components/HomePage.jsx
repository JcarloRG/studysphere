import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api'; 
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [modalOpen, setModalOpen] = useState(false); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleMiPerfil = () => {
        setShowLoginModal(true);
        setTimeout(() => {
            setModalOpen(true);
        }, 10); 
        setError('');
        setPassword(''); 
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (email && password) {
            try {
                console.log('🔍 Intentando iniciar sesión para:', email);
                
                const result = await apiService.loginUser(email, password); 
                
                if (result.success) {
                    console.log('✅ Inicio de sesión exitoso:', result.data);
                    
                    // 🌟 1. GUARDAR ID Y TIPO EN LOCALSTORAGE (¡Mantenido y Correcto!) 🌟
                    localStorage.setItem('currentUserId', result.data.perfil_id);
                    localStorage.setItem('currentUserType', result.data.tipo);
                    
                    // 2. Iniciar redirección y cierre animado
                    navigate(`/perfil/${result.data.tipo}/${result.data.perfil_id}`);
                    
                    setModalOpen(false);
                    setTimeout(() => {
                        setShowLoginModal(false);
                        setEmail('');
                        setPassword('');
                    }, 400);

                    // 🌟 3. CORRECCIÓN: Usar return para detener la ejecución aquí 🌟
                    // Esto evita que setLoading(false) se ejecute antes de la redirección.
                    return; 
                } else {
                    setError(result.message || 'Correo o contraseña incorrectos.');
                }
            } catch (err) {
                console.error('💥 Error en login:', err);
                setError(err.message || 'Ocurrió un error al intentar iniciar sesión. Verifica tu conexión.'); 
            }
        } else {
            setError('Por favor ingresa tu correo y contraseña.');
        }
        
        // Se ejecuta solo si hubo un error (no si el login fue exitoso y devolvió un return)
        setLoading(false); 
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setTimeout(() => {
            setShowLoginModal(false);
            setEmail('');
            setPassword(''); 
            setError('');
        }, 400);
    };

    const scrollToRegistration = () => {
        const registrationSection = document.querySelector('.registration-section');
        if (registrationSection) {
            registrationSection.scrollIntoView({ behavior: 'smooth' });
        }
        handleCloseModal();
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

            {/* Header Elegante con Logo */}
            <header className="premium-header">
                <div className="header-content">
                    <div className="logo-section">
                        <img 
                            src="/logo192.png" 
                            alt="StudySphere Logo" 
                            className="site-logo"
                        />
                        <h1>StudySphere</h1>
                    </div>
                    <nav className="nav-actions">
                        <button 
                            className="nav-btn profile-nav-btn"
                            onClick={handleMiPerfil}
                            disabled={loading}
                        >
                            <span className="btn-icon">👤</span>
                            <span>Iniciar sesión</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Modal de Login Centrado */}
            {showLoginModal && (
                <div className="modal-overlay centered-modal-overlay">
                    <div className={`premium-modal centered-premium-modal ${modalOpen ? 'open' : ''}`}> 
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
                            
                            <div className="form-group">
                                <label htmlFor="password">Contraseña</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Tu contraseña"
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
                                    disabled={loading || !email || !password} 
                                >
                                    {loading ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            Ingresando...
                                        </>
                                    ) : (
                                        'Ingresar a Mi Perfil'
                                    )}
                                </button>
                            </div>

                            {/* Nuevo Botón de Crear Cuenta */}
                            <div className="create-account-section">
                                <p className="create-account-text">
                                    ¿No tienes una cuenta?
                                </p>
                                <button 
                                    type="button"
                                    className="btn create-account-btn"
                                    onClick={scrollToRegistration}
                                    disabled={loading}
                                >
                                    Crear una cuenta
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

            {/* Sección de Registros */}
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
        </div>
    );
};

export default HomePage;