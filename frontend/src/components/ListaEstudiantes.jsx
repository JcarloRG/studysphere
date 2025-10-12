import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './Listas.css';

const ListaEstudiantes = () => {
    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarEstudiantes();
    }, []);

    const cargarEstudiantes = async () => {
        try {
            setLoading(true);
            const result = await apiService.getEstudiantes();
            setEstudiantes(result.estudiantes || []);
        } catch (err) {
            setError('Error al cargar estudiantes: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = async () => {
        if (!busqueda.trim()) {
            cargarEstudiantes();
            return;
        }

        try {
            setLoading(true);
            const result = await apiService.buscarEstudiantes(busqueda);
            setEstudiantes(result.estudiantes || []);
        } catch (err) {
            setError('Error en búsqueda: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await apiService.deleteEstudiante(id);
                alert('Estudiante eliminado exitosamente');
                cargarEstudiantes(); // Recargar la lista
            } catch (err) {
                alert('Error al eliminar: ' + err.message);
            }
        }
    };

    const handleVerPerfil = (id) => {
        window.open(`/perfil/estudiante/${id}`, '_blank');
    };

    if (loading) {
        return (
            <div className="lista-container">
                <div className="loading">Cargando estudiantes...</div>
            </div>
        );
    }

    return (
        <div className="lista-container">
            <div className="lista-header">
                <h2>👨‍🎓 Lista de Estudiantes</h2>
                <div className="contador">Total: {estudiantes.length}</div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="busqueda-container">
                <input
                    type="text"
                    placeholder="Buscar estudiantes por nombre, carrera, etc..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                    className="busqueda-input"
                />
                <button onClick={handleBuscar} className="busqueda-btn">
                    🔍 Buscar
                </button>
                <button onClick={cargarEstudiantes} className="recargar-btn">
                    🔄 Recargar
                </button>
            </div>

            {estudiantes.length === 0 ? (
                <div className="sin-registros">
                    No se encontraron estudiantes registrados
                </div>
            ) : (
                <div className="tabla-container">
                    <table className="tabla-estudiantes">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Correo</th>
                                <th>Número Control</th>
                                <th>Carrera</th>
                                <th>Semestre</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estudiantes.map((estudiante) => (
                                <tr key={estudiante.id}>
                                    <td>{estudiante.id}</td>
                                    <td className="nombre-cell">{estudiante.nombre_completo}</td>
                                    <td>{estudiante.correo_institucional}</td>
                                    <td>{estudiante.numero_control}</td>
                                    <td>{estudiante.carrera_actual}</td>
                                    <td>{estudiante.semestre}</td>
                                    <td>{new Date(estudiante.fecha_registro).toLocaleDateString()}</td>
                                    <td className="acciones-cell">
                                        <button 
                                            onClick={() => handleVerPerfil(estudiante.id)}
                                            className="btn-perfil"
                                            title="Ver perfil completo"
                                        >
                                            👁️ Ver
                                        </button>
                                        <button 
                                            onClick={() => handleEliminar(estudiante.id, estudiante.nombre_completo)}
                                            className="btn-eliminar"
                                            title="Eliminar estudiante"
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

export default ListaEstudiantes;