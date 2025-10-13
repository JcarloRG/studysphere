import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    const handleMiPerfil = () => {
        navigate('/seleccionar-perfil');
    };

    return (
        <div className="home-container">
            {/* Botón de perfil independiente en esquina superior derecha */}
            <button 
                className="mi-perfil-btn"
                onClick={handleMiPerfil}
            >
                👤 Mi Perfil
            </button>

            {/* Contenido principal */}
            <div className="home-content">
                <h1>StudySphere</h1>
                <p className="home-description">
                    Conecta con colaboradores para compartir nuevas ideas y crear proyectos innovadores
                </p>
                
                {/* Sección de Registro - RECTANGULARES */}
                <div className="section">
                    <h2>🎯 Regístrate en la Comunidad</h2>
                    <div className="options-grid">
                        <Link to="/estudiante" className="option-card rectangular">
                            <div className="card-content">
                                <h3>👨‍🎓 Soy Estudiante</h3>
                                <p>Busco equipo para proyectos escolares innovadores y participar en diferentes concursos</p>
                            </div>
                        </Link>
                        
                        <Link to="/docente" className="option-card rectangular">
                            <div className="card-content">
                                <h3>👨‍🏫 Soy Docente</h3>
                                <p>Busco estudiantes para colaborar en investigaciones y proyectos innovadores</p>
                            </div>
                        </Link>
                        
                        <Link to="/egresado" className="option-card rectangular">
                            <div className="card-content">
                                <h3>💼 Soy Egresado</h3>
                                <p>Ofrezco mentoría y colaboración para proyectos innovadores</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Sección de Comunidad - CUADRADOS */}
                <div className="section">
                    <h2>🌐 Explora la Comunidad</h2>
                    <p className="section-description">
                        Conecta con otros miembros y descubre oportunidades de colaboración
                    </p>
                    <div className="community-grid">
                        <Link to="/matches" className="community-card square">
                            <div className="card-content">
                                <div className="card-icon">💫</div>
                                <h3>Conexiones Recomendadas</h3>
                                <p>Descubre personas con intereses similares</p>
                            </div>
                        </Link>

                        <Link to="/perfiles/estudiantes" className="community-card square">
                            <div className="card-content">
                                <div className="card-icon">👨‍🎓</div>
                                <h3>Comunidad Estudiantil</h3>
                                <p>Conecta con estudiantes</p>
                            </div>
                        </Link>

                        <Link to="/perfiles/docentes" className="community-card square">
                            <div className="card-content">
                                <div className="card-icon">👨‍🏫</div>
                                <h3>Planta Docente</h3>
                                <p>Encuentra mentores</p>
                            </div>
                        </Link>

                        <Link to="/perfiles/egresados" className="community-card square">
                            <div className="card-content">
                                <div className="card-icon">💼</div>
                                <h3>Red de Egresados</h3>
                                <p>Conecta con profesionales</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Sección de Registros Existentes */}
                <div className="view-records">
                    <p>¿Quieres ver los registros existentes?</p>
                    <div className="record-links">
                        <Link to="/registros/estudiantes" className="btn-outline">
                            Ver Estudiantes
                        </Link>
                        <Link to="/registros/docentes" className="btn-outline">
                            Ver Docentes
                        </Link>
                        <Link to="/registros/egresados" className="btn-outline">
                            Ver Egresados
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;