import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './Listas.css';

const ListaEgresados = () => {
    const [egresados, setEgresados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarEgresados();
    }, []);

    const cargarEgresados = async () => {
        try {
            setLoading(true);
            const result = await apiService.getEgresados();
            setEgresados(result.egresados || []);
        } catch (err) {
            setError('Error al cargar egresados: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBuscar = async () => {
        if (!busqueda.trim()) {
            cargarEgresados();
            return;
        }

        try {
            setLoading(true);
            const result = await apiService.buscarEgresados(busqueda);
            setEgresados(result.egresados || []);
        } catch (err) {
            setError('Error en búsqueda: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await apiService.deleteEgresado(id);
                alert('Egresado eliminado exitosamente');
                cargarEgresados();
            } catch (err) {
                alert('Error al eliminar: ' + err.message);
            }
        }
    };

    const handleVerPerfil = (id) => {
        window.open(`/perfil/egresado/${id}`, '_blank');
    };

    if (loading) {
        return (
            <div className="lista-container">
                <div className="loading">Cargando egresados...</div>
            </div>
        );
    }

    return (
        <div className="lista-container">
            <div className="lista-header">
                <h2>💼 Lista de Egresados</h2>
                <div className="contador">Total: {egresados.length}</div>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="busqueda-container">
                <input
                    type="text"
                    placeholder="Buscar egresados por nombre, empresa, puesto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                    className="busqueda-input"
                />
                <button onClick={handleBuscar} className="busqueda-btn">
                    🔍 Buscar
                </button>
                <button onClick={cargarEgresados} className="recargar-btn">
                    🔄 Recargar
                </button>
            </div>

            {egresados.length === 0 ? (
                <div className="sin-registros">
                    No se encontraron egresados registrados
                </div>
            ) : (
                <div className="tabla-container">
                    <table className="tabla-egresados">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Correo</th>
                                <th>Carrera Egreso</th>
                                <th>Año Egreso</th>
                                <th>Empresa</th>
                                <th>Puesto</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {egresados.map((egresado) => (
                                <tr key={egresado.id}>
                                    <td>{egresado.id}</td>
                                    <td className="nombre-cell">{egresado.nombre_completo}</td>
                                    <td>{egresado.correo_institucional}</td>
                                    <td>{egresado.carrera_egreso}</td>
                                    <td>{egresado.anio_egreso}</td>
                                    <td>{egresado.empresa}</td>
                                    <td>{egresado.puesto}</td>
                                    <td>{new Date(egresado.fecha_registro).toLocaleDateString()}</td>
                                    <td className="acciones-cell">
                                        <button 
                                            onClick={() => handleVerPerfil(egresado.id)}
                                            className="btn-perfil"
                                        >
                                            👁️ Ver
                                        </button>
                                        <button 
                                            onClick={() => handleEliminar(egresado.id, egresado.nombre_completo)}
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

export default ListaEgresados;