import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import './Listas.css';

const ListaProyectosAdmin = ({ onUnauthorized }) => {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarProyectos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const manejarError = (err, prefijo) => {
        if (err.status === 401) {
            onUnauthorized && onUnauthorized();
            return;
        }
        setError(prefijo + err.message);
    };

    const cargarProyectos = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getProyectos();
            setProyectos(data);
        } catch (err) {
            manejarError(err, 'Error al cargar proyectos: ');
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getProyectos(busqueda.trim());
            setProyectos(data);
        } catch (err) {
            manejarError(err, 'Error en búsqueda: ');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id, titulo) => {
        if (window.confirm(`¿Estás seguro de eliminar el proyecto "${titulo}"? Esta acción no se puede deshacer.`)) {
            try {
                await adminService.deleteProyecto(id);
                cargarProyectos();
            } catch (err) {
                if (err.status === 401) {
                    onUnauthorized && onUnauthorized();
                    return;
                }
                alert('Error al eliminar: ' + err.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="lista-container">
                <div className="loading">Cargando proyectos...</div>
            </div>
        );
    }

    return (
        <div className="lista-container">
            <div className="lista-header">
                <h2>📁 Lista de Proyectos</h2>
                <div className="contador">Total: {proyectos.length}</div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="busqueda-container">
                <input
                    type="text"
                    placeholder="Buscar proyectos por título o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                    className="busqueda-input"
                />
                <button onClick={handleBuscar} className="busqueda-btn">
                    🔍 Buscar
                </button>
                <button onClick={() => { setBusqueda(''); cargarProyectos(); }} className="recargar-btn">
                    🔄 Recargar
                </button>
            </div>

            {proyectos.length === 0 ? (
                <div className="sin-registros">
                    No se encontraron proyectos registrados
                </div>
            ) : (
                <div className="tabla-container">
                    <table className="tabla-proyectos">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Carrera</th>
                                <th>Estado</th>
                                <th>Creador</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proyectos.map((proyecto) => (
                                <tr key={proyecto.id}>
                                    <td>{proyecto.id}</td>
                                    <td className="nombre-cell">{proyecto.titulo}</td>
                                    <td>{proyecto.tipo}</td>
                                    <td>{proyecto.carrera}</td>
                                    <td>{proyecto.estado}</td>
                                    <td>{proyecto.creador_nombre || `${proyecto.creador_tipo || ''} #${proyecto.creador_id ?? ''}`}</td>
                                    <td>{proyecto.creado_en ? new Date(proyecto.creado_en).toLocaleDateString() : '—'}</td>
                                    <td className="acciones-cell">
                                        <button
                                            onClick={() => handleEliminar(proyecto.id, proyecto.titulo)}
                                            className="btn-eliminar"
                                            title="Eliminar proyecto"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ListaProyectosAdmin;
