import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import './Listas.css';

const ListaDocentes = ({ onUnauthorized }) => {
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarDocentes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const manejarError = (err, prefijo) => {
        if (err.status === 401) {
            onUnauthorized && onUnauthorized();
            return;
        }
        setError(prefijo + err.message);
    };

    const cargarDocentes = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getDocentes();
            setDocentes(data);
        } catch (err) {
            manejarError(err, 'Error al cargar docentes: ');
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getDocentes(busqueda.trim());
            setDocentes(data);
        } catch (err) {
            manejarError(err, 'Error en búsqueda: ');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
            try {
                await adminService.deleteDocente(id);
                cargarDocentes();
            } catch (err) {
                if (err.status === 401) {
                    onUnauthorized && onUnauthorized();
                    return;
                }
                alert('Error al eliminar: ' + err.message);
            }
        }
    };

    const handleVerPerfil = (id) => {
        window.open(`/perfil_vista/docente/${id}`, '_blank');
    };

    if (loading) {
        return (
            <div className="lista-container">
                <div className="loading">Cargando docentes...</div>
            </div>
        );
    }

    return (
        <div className="lista-container">
            <div className="lista-header">
                <h2>👨‍🏫 Lista de Docentes</h2>
                <div className="contador">Total: {docentes.length}</div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="busqueda-container">
                <input
                    type="text"
                    placeholder="Buscar docentes por nombre, correo, carrera..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                    className="busqueda-input"
                />
                <button onClick={handleBuscar} className="busqueda-btn">
                    🔍 Buscar
                </button>
                <button onClick={() => { setBusqueda(''); cargarDocentes(); }} className="recargar-btn">
                    🔄 Recargar
                </button>
            </div>

            {docentes.length === 0 ? (
                <div className="sin-registros">
                    No se encontraron docentes registrados
                </div>
            ) : (
                <div className="tabla-container">
                    <table className="tabla-docentes">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Correo</th>
                                <th>Carrera Egreso</th>
                                <th>Carreras Imparte</th>
                                <th>Grado Académico</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docentes.map((docente) => (
                                <tr key={docente.id}>
                                    <td>{docente.id}</td>
                                    <td className="nombre-cell">{docente.nombre_completo}</td>
                                    <td>{docente.correo_institucional}</td>
                                    <td>{docente.carrera_egreso}</td>
                                    <td>{docente.carreras_imparte}</td>
                                    <td>{docente.grado_academico}</td>
                                    <td>{docente.fecha_registro ? new Date(docente.fecha_registro).toLocaleDateString() : '—'}</td>
                                    <td className="acciones-cell">
                                        <button
                                            onClick={() => handleVerPerfil(docente.id)}
                                            className="btn-perfil"
                                        >
                                            👁️ Ver
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(docente.id, docente.nombre_completo)}
                                            className="btn-eliminar"
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

export default ListaDocentes;
