import React, { useState } from 'react';
import ListaEstudiantes from './ListaEstudiantes';
import ListaDocentes from './ListaDocentes';
import ListaEgresados from './ListaEgresados';
import './AdminPanel.css';

const AdminPanel = () => {
    const [vistaActiva, setVistaActiva] = useState('estudiantes');

    const renderVista = () => {
        switch (vistaActiva) {
            case 'estudiantes':
                return <ListaEstudiantes />;
            case 'docentes':
                return <ListaDocentes />;
            case 'egresados':
                return <ListaEgresados />;
            default:
                return <ListaEstudiantes />;
        }
    };

    return (
        <div className="admin-panel">
            <div className="panel-header">
                <h1>🎓 Panel de Administración - StudySphere</h1>
                <p>Gestiona todos los registros del sistema</p>
            </div>

            <div className="navegacion-panel">
                <button 
                    className={`nav-btn ${vistaActiva === 'estudiantes' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('estudiantes')}
                >
                    👨‍🎓 Estudiantes
                </button>
                <button 
                    className={`nav-btn ${vistaActiva === 'docentes' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('docentes')}
                >
                    👨‍🏫 Docentes
                </button>
                <button 
                    className={`nav-btn ${vistaActiva === 'egresados' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('egresados')}
                >
                    💼 Egresados
                </button>
            </div>

            <div className="panel-content">
                {renderVista()}
            </div>
        </div>
    );
};

export default AdminPanel;