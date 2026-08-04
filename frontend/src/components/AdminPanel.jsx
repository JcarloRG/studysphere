import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ListaEstudiantes from './ListaEstudiantes';
import ListaDocentes from './ListaDocentes';
import ListaEgresados from './ListaEgresados';
import ListaProyectosAdmin from './ListaProyectosAdmin';
import './AdminPanel.css';

const AdminPanel = () => {
    // null = todavía verificando la sesión guardada; false = no autenticado;
    // objeto = autenticado, con los datos del admin.
    const [admin, setAdmin] = useState(null);
    const [verificando, setVerificando] = useState(true);
    const [vistaActiva, setVistaActiva] = useState('dashboard');

    const cerrarSesion = useCallback(() => {
        adminService.logout();
        setAdmin(false);
    }, []);

    useEffect(() => {
        const verificar = async () => {
            if (!adminService.isAuthenticated()) {
                setAdmin(false);
                setVerificando(false);
                return;
            }
            try {
                const info = await adminService.verificarSesion();
                setAdmin(info);
            } catch {
                setAdmin(false);
            } finally {
                setVerificando(false);
            }
        };
        verificar();
    }, []);

    const handleLoginSuccess = (adminInfo) => {
        setAdmin(adminInfo);
    };

    if (verificando) {
        return (
            <div className="admin-panel">
                <div className="loading">Verificando sesión...</div>
            </div>
        );
    }

    if (!admin) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    const renderVista = () => {
        switch (vistaActiva) {
            case 'dashboard':
                return <AdminDashboard onUnauthorized={cerrarSesion} />;
            case 'estudiantes':
                return <ListaEstudiantes onUnauthorized={cerrarSesion} />;
            case 'docentes':
                return <ListaDocentes onUnauthorized={cerrarSesion} />;
            case 'egresados':
                return <ListaEgresados onUnauthorized={cerrarSesion} />;
            case 'proyectos':
                return <ListaProyectosAdmin onUnauthorized={cerrarSesion} />;
            default:
                return <AdminDashboard onUnauthorized={cerrarSesion} />;
        }
    };

    return (
        <div className="admin-panel">
            <div className="panel-header">
                <div className="panel-header-top">
                    <div>
                        <h1>🎓 Panel de Administración - StudySphere</h1>
                        <p>Gestiona todos los registros del sistema</p>
                    </div>
                    <div className="panel-admin-info">
                        <span>👤 {admin.nombre || admin.username}</span>
                        <button className="btn-logout" onClick={cerrarSesion}>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>

            <div className="navegacion-panel">
                <button
                    className={`nav-btn ${vistaActiva === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('dashboard')}
                >
                    📊 Dashboard
                </button>
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
                <button
                    className={`nav-btn ${vistaActiva === 'proyectos' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('proyectos')}
                >
                    📁 Proyectos
                </button>
            </div>

            <div className="panel-content">
                {renderVista()}
            </div>
        </div>
    );
};

export default AdminPanel;
