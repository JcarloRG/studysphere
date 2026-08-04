import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import './AdminDashboard.css';

const TARJETAS = [
    { key: 'estudiantes', label: 'Estudiantes', icon: '👨‍🎓', color: '#6780FE' },
    { key: 'docentes', label: 'Docentes', icon: '👨‍🏫', color: '#4CAF50' },
    { key: 'egresados', label: 'Egresados', icon: '💼', color: '#FF9800' },
    { key: 'proyectos', label: 'Proyectos', icon: '📁', color: '#9C27B0' },
    { key: 'matches_aceptados', label: 'Conexiones aceptadas', icon: '🤝', color: '#2196F3' },
    { key: 'matches_pendientes', label: 'Solicitudes pendientes', icon: '⏳', color: '#f44336' },
];

const ETIQUETAS_TIPO = {
    estudiante: '👨‍🎓 Estudiante',
    docente: '👨‍🏫 Docente',
    egresado: '💼 Egresado',
};

const AdminDashboard = ({ onUnauthorized }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarStats = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getStats();
            setStats(data);
        } catch (err) {
            if (err.status === 401) {
                onUnauthorized && onUnauthorized();
                return;
            }
            setError('Error al cargar estadísticas: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container"><div className="loading">Cargando estadísticas...</div></div>;
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-message">{error}</div>
                <button className="recargar-btn" onClick={cargarStats}>🔄 Reintentar</button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-grid">
                {TARJETAS.map((t) => (
                    <div className="dashboard-card" key={t.key} style={{ borderTopColor: t.color }}>
                        <div className="dashboard-card-icon">{t.icon}</div>
                        <div className="dashboard-card-value">{stats?.[t.key] ?? '—'}</div>
                        <div className="dashboard-card-label">{t.label}</div>
                    </div>
                ))}
            </div>

            <div className="dashboard-recientes">
                <h3>🕐 Últimos registros</h3>
                {(!stats?.registros_recientes || stats.registros_recientes.length === 0) ? (
                    <div className="sin-registros">Todavía no hay registros.</div>
                ) : (
                    <div className="tabla-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.registros_recientes.map((r) => (
                                    <tr key={`${r.tipo}-${r.id}`}>
                                        <td>{ETIQUETAS_TIPO[r.tipo] || r.tipo}</td>
                                        <td className="nombre-cell">{r.nombre_completo}</td>
                                        <td>{r.correo_institucional}</td>
                                        <td>{r.fecha_registro ? new Date(r.fecha_registro).toLocaleString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
