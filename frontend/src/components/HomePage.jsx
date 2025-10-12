import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="home-container">
            <div className="home-content">
                <h1>StudySphere</h1>
                <p className="home-description">
                    Conecta con colaboradores para compartir nuevas ideas y crear proyectos innovadores
                </p>
                
                <div className="options-grid">
                    <Link to="/estudiante" className="option-card">
                        <div className="card-content">
                            <h3>👨‍🎓 Soy Estudiante</h3>
                            <p>Busco equipo para proyectos escolares innovadores y participar en diferentes concursos</p>
                        </div>
                    </Link>
                    
                    <Link to="/docente" className="option-card">
                        <div className="card-content">
                            <h3>👨‍🏫 Soy Docente</h3>
                            <p>Busco estudiantes para colaborar en investigaciones y proyectos innovadores</p>
                        </div>
                    </Link>
                    
                    <Link to="/egresado" className="option-card">
                        <div className="card-content">
                            <h3>💼 Soy Egresado</h3>
                            <p>Ofrezco mentoría y colaboración para proyectos innovadores</p>
                        </div>
                    </Link>
                </div>

                <div className="view-records">
                    <p>¿Quieres ver los registros existentes?</p>
                    <div className="record-links">
                        <a href="http://localhost:8000/estudiantes/" target="_blank" rel="noopener noreferrer" className="btn-outline">
                            Ver Estudiantes
                        </a>
                        <a href="http://localhost:8000/docentes/" target="_blank" rel="noopener noreferrer" className="btn-outline">
                            Ver Docentes
                        </a>
                        <a href="http://localhost:8000/egresados/" target="_blank" rel="noopener noreferrer" className="btn-outline">
                            Ver Egresados
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;